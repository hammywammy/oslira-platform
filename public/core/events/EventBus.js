// =============================================================================
// EVENT BUS - Pub/Sub Event System
// Path: /public/core/events/EventBus.js
// Dependencies: Logger (optional), EventTypes (optional)
// =============================================================================

/**
 * @class EventBus
 * @description Centralized event system for application-wide communication
 * 
 * Features:
 * - Pub/sub pattern
 * - Wildcard event matching
 * - Once listeners (auto-remove after first call)
 * - Memory leak prevention (max listeners warning)
 * - Event history tracking
 * - Debug logging
 * - Namespace support
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Set();
        this.logger = null;
        
        // Configuration
        this.maxListeners = 50; // Per event type
        this.enableLogging = false;
        
        // Event history (for debugging)
        this.eventHistory = [];
        this.maxHistorySize = 100;
        
        // Statistics
        this.emitCount = 0;
        this.listenerCount = 0;
        
        this.isInitialized = false;
        
        console.log('📡 [EventBus] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize event bus with dependencies
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [EventBus] Already initialized');
            return;
        }
        
        try {
            console.log('📡 [EventBus] Initializing...');
            
            this.logger = dependencies.logger || window.OsliraLogger;
            
            // Enable logging in development
            if (window.OsliraEnv?.isDevelopment) {
                this.enableLogging = true;
            }
            
            this.isInitialized = true;
            console.log('✅ [EventBus] Initialized');
            
        } catch (error) {
            console.error('❌ [EventBus] Initialization failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // EVENT SUBSCRIPTION
    // =========================================================================
    
    /**
     * Subscribe to an event
     * @param {string} eventType - Event type to listen for
     * @param {Function} callback - Callback function
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    on(eventType, callback, options = {}) {
        if (!eventType || typeof eventType !== 'string') {
            throw new Error('Event type must be a non-empty string');
        }
        
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        const { context = null, priority = 0 } = options;
        
        // Create listener entry
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        
        const listeners = this.listeners.get(eventType);
        
        // Check max listeners
        if (listeners.length >= this.maxListeners) {
            console.warn(`⚠️ [EventBus] Max listeners (${this.maxListeners}) reached for: ${eventType}`);
        }
        
        // Create listener object
        const listener = {
            callback,
            context,
            priority,
            addedAt: Date.now()
        };
        
        // Add listener (sorted by priority, higher first)
        listeners.push(listener);
        listeners.sort((a, b) => b.priority - a.priority);
        
        this.listenerCount++;
        
        if (this.enableLogging) {
            console.log(`📡 [EventBus] Listener added: ${eventType} (${listeners.length} total)`);
        }
        
        // Return unsubscribe function
        return () => this.off(eventType, callback);
    }
    
    /**
     * Subscribe to an event once (auto-removes after first call)
     */
    once(eventType, callback, options = {}) {
        const wrappedCallback = (...args) => {
            // Remove listener before calling callback
            this.off(eventType, wrappedCallback);
            
            // Call original callback
            return callback(...args);
        };
        
        // Mark as once listener
        this.onceListeners.add(wrappedCallback);
        
        return this.on(eventType, wrappedCallback, options);
    }
    
    /**
     * Unsubscribe from an event
     */
    off(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            return false;
        }
        
        const listeners = this.listeners.get(eventType);
        const index = listeners.findIndex(l => l.callback === callback);
        
        if (index === -1) {
            return false;
        }
        
        // Remove listener
        listeners.splice(index, 1);
        this.listenerCount--;
        
        // Clean up empty listener arrays
        if (listeners.length === 0) {
            this.listeners.delete(eventType);
        }
        
        // Remove from once listeners if applicable
        this.onceListeners.delete(callback);
        
        if (this.enableLogging) {
            console.log(`📡 [EventBus] Listener removed: ${eventType}`);
        }
        
        return true;
    }
    
    /**
     * Remove all listeners for an event type
     */
    offAll(eventType) {
        if (!this.listeners.has(eventType)) {
            return 0;
        }
        
        const count = this.listeners.get(eventType).length;
        this.listenerCount -= count;
        this.listeners.delete(eventType);
        
        if (this.enableLogging) {
            console.log(`📡 [EventBus] All listeners removed: ${eventType} (${count} total)`);
        }
        
        return count;
    }
    
    /**
     * Remove all listeners
     */
    clear() {
        const count = this.listenerCount;
        this.listeners.clear();
        this.onceListeners.clear();
        this.listenerCount = 0;
        
        console.log(`📡 [EventBus] All listeners cleared (${count} total)`);
    }
    
    // =========================================================================
    // EVENT EMISSION
    // =========================================================================
    
    /**
     * Emit an event
     * @param {string} eventType - Event type to emit
     * @param {any} data - Event data
     * @param {Object} options - Emission options
     */
    emit(eventType, data = null, options = {}) {
        if (!eventType || typeof eventType !== 'string') {
            throw new Error('Event type must be a non-empty string');
        }
        
        const { async = false } = options;
        
        // Track event
        this.emitCount++;
        this._addToHistory(eventType, data);
        
        if (this.enableLogging) {
            console.log(`📡 [EventBus] Emitting: ${eventType}`, data);
        }
        
        // Get matching listeners (exact + wildcard)
        const matchingListeners = this._getMatchingListeners(eventType);
        
        if (matchingListeners.length === 0) {
            if (this.enableLogging) {
                console.log(`📡 [EventBus] No listeners for: ${eventType}`);
            }
            return;
        }
        
        // Call listeners
        if (async) {
            this._emitAsync(eventType, data, matchingListeners);
        } else {
            this._emitSync(eventType, data, matchingListeners);
        }
    }
    
    /**
     * Emit event synchronously
     */
    _emitSync(eventType, data, listeners) {
        for (const listener of listeners) {
            try {
                const context = listener.context || null;
                listener.callback.call(context, data, eventType);
            } catch (error) {
                console.error(`❌ [EventBus] Listener error for ${eventType}:`, error);
                
                if (this.logger?.error) {
                    this.logger.error('[EventBus] Listener error', {
                        eventType,
                        error: error.message
                    });
                }
                
                if (window.Sentry) {
                    Sentry.captureException(error, {
                        tags: {
                            component: 'EventBus',
                            eventType
                        }
                    });
                }
            }
        }
    }
    
    /**
     * Emit event asynchronously
     */
    async _emitAsync(eventType, data, listeners) {
        for (const listener of listeners) {
            try {
                const context = listener.context || null;
                await listener.callback.call(context, data, eventType);
            } catch (error) {
                console.error(`❌ [EventBus] Async listener error for ${eventType}:`, error);
                
                if (this.logger?.error) {
                    this.logger.error('[EventBus] Async listener error', {
                        eventType,
                        error: error.message
                    });
                }
                
                if (window.Sentry) {
                    Sentry.captureException(error, {
                        tags: {
                            component: 'EventBus',
                            eventType,
                            async: true
                        }
                    });
                }
            }
        }
    }
    
    /**
     * Emit event asynchronously (returns promise)
     */
    async emitAsync(eventType, data = null) {
        return this.emit(eventType, data, { async: true });
    }
    
    // =========================================================================
    // WILDCARD MATCHING
    // =========================================================================
    
    /**
     * Get listeners matching event type (including wildcards)
     */
    _getMatchingListeners(eventType) {
        const matching = [];
        
        for (const [pattern, listeners] of this.listeners.entries()) {
            if (this._matchesPattern(eventType, pattern)) {
                matching.push(...listeners);
            }
        }
        
        // Sort by priority
        matching.sort((a, b) => b.priority - a.priority);
        
        return matching;
    }
    
    /**
     * Check if event type matches pattern (supports wildcards)
     */
    _matchesPattern(eventType, pattern) {
        // Exact match
        if (eventType === pattern) {
            return true;
        }
        
        // Wildcard match (e.g., "lead:*" matches "lead:created")
        if (pattern.includes('*')) {
            const regexPattern = pattern
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(eventType);
        }
        
        return false;
    }
    
    // =========================================================================
    // EVENT HISTORY
    // =========================================================================
    
    /**
     * Add event to history
     */
    _addToHistory(eventType, data) {
        this.eventHistory.push({
            eventType,
            data,
            timestamp: Date.now()
        });
        
        // Trim history if too large
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }
    
    /**
     * Get event history
     */
    getHistory(eventType = null) {
        if (eventType) {
            return this.eventHistory.filter(e => e.eventType === eventType);
        }
        return [...this.eventHistory];
    }
    
    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }
    
    // =========================================================================
    // LISTENER INSPECTION
    // =========================================================================
    
    /**
     * Get listener count for event type
     */
    getListenerCount(eventType) {
        if (!this.listeners.has(eventType)) {
            return 0;
        }
        return this.listeners.get(eventType).length;
    }
    
    /**
     * Get all event types with listeners
     */
    getEventTypes() {
        return Array.from(this.listeners.keys());
    }
    
    /**
     * Check if event has listeners
     */
    hasListeners(eventType) {
        return this.getListenerCount(eventType) > 0;
    }
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    /**
     * Set max listeners per event type
     */
    setMaxListeners(max) {
        if (max < 1) {
            throw new Error('Max listeners must be at least 1');
        }
        this.maxListeners = max;
    }
    
    /**
     * Enable/disable debug logging
     */
    setLogging(enabled) {
        this.enableLogging = enabled;
    }
    
    /**
     * Set max history size
     */
    setMaxHistorySize(size) {
        if (size < 0) {
            throw new Error('Max history size must be non-negative');
        }
        this.maxHistorySize = size;
        
        // Trim current history if needed
        if (this.eventHistory.length > size) {
            this.eventHistory = this.eventHistory.slice(-size);
        }
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get event bus statistics
     */
    getStats() {
        return {
            totalListeners: this.listenerCount,
            eventTypes: this.listeners.size,
            totalEmits: this.emitCount,
            historySize: this.eventHistory.length,
            maxHistorySize: this.maxHistorySize,
            maxListeners: this.maxListeners
        };
    }
    
    /**
     * Get breakdown by event type
     */
    getBreakdown() {
        const breakdown = [];
        
        for (const [eventType, listeners] of this.listeners.entries()) {
            breakdown.push({
                eventType,
                listenerCount: listeners.length,
                oldestListener: Math.min(...listeners.map(l => l.addedAt))
            });
        }
        
        return breakdown.sort((a, b) => b.listenerCount - a.listenerCount);
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            stats: this.getStats(),
            breakdown: this.getBreakdown(),
            recentEvents: this.eventHistory.slice(-10)
        };
    }
    
    /**
     * Print debug info
     */
    debug() {
        console.group('📡 [EventBus] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Event Types:', this.getEventTypes());
        console.log('Breakdown:', this.getBreakdown());
        console.groupEnd();
    }
    
    /**
     * List all listeners
     */
    listListeners() {
        console.group('📡 [EventBus] All Listeners');
        
        for (const [eventType, listeners] of this.listeners.entries()) {
            console.group(`${eventType} (${listeners.length})`);
            listeners.forEach((listener, index) => {
                console.log(`${index + 1}. Priority: ${listener.priority}, Context: ${!!listener.context}`);
            });
            console.groupEnd();
        }
        
        console.groupEnd();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Destroy event bus
     */
    destroy() {
        this.clear();
        this.clearHistory();
        this.isInitialized = false;
        
        console.log('🗑️ [EventBus] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT (Safe Singleton Pattern)
// =============================================================================

if (!window.OsliraEventBus) {
    const instance = new EventBus();
    
    window.OsliraEventBus = instance;
    
    // Auto-initialize
    instance.initialize();
    
    console.log('✅ [EventBus] Loaded and initialized');
    
    if (window.Oslira?.init) {
        window.Oslira.init.register('EventBus', instance);
        console.log('📋 [EventBus] Registered with Coordinator');
    }
} else {
    console.log('⚠️ [EventBus] Already loaded, skipping re-initialization');
}
