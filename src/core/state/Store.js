// =============================================================================
// STORE - Immutable State Store
// Path: /public/core/state/Store.js
// Dependencies: Logger (lazily resolved)
// =============================================================================

/**
 * @class Store
 * @description Immutable state store with path-based access and subscriptions
 * 
 * Features:
 * - Immutable state (deep cloning)
 * - Path-based access (dot notation)
 * - Subscription system with wildcard support
 * - State history (last 50 changes)
 * - Change tracking
 * - Debug utilities
 * - Lazy dependency resolution
 */
class Store {
    constructor() {
        // State storage
        this.state = {};
        
        // Subscriptions: Map<path, Set<callback>>
        this.subscriptions = new Map();
        
        // History tracking
        this.history = [];
        this.maxHistorySize = 50;
        
        // Change tracking
        this.changeCount = 0;
        
        this.isInitialized = false;
        
        console.log('📦 [Store] Instance created');
    }
    
    // =========================================================================
    // LAZY DEPENDENCY RESOLUTION
    // =========================================================================
    
    /**
     * Get Logger instance (lazy)
     */
    get logger() {
        if (!window.OsliraLogger) {
            console.warn('[Store] Logger not yet available, using console');
            return {
                info: console.log.bind(console),
                warn: console.warn.bind(console),
                error: console.error.bind(console),
                debug: console.log.bind(console)
            };
        }
        return window.OsliraLogger;
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('[Store] Already initialized');
            return;
        }
        
        try {
            this.isInitialized = true;
            this.logger.info('[Store] Initialized');
            
        } catch (error) {
            this.logger.error('[Store] Initialization failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'Store', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // STATE ACCESS
    // =========================================================================
    
    /**
     * Get state at path
     * @param {string} path - Dot-notation path (e.g., 'auth.user' or '' for root)
     * @returns {*} State value (deep cloned)
     */
    getState(path) {
        if (path === '' || path === undefined) {
            return this.deepClone(this.state);
        }
        
        const value = this.getValueAtPath(this.state, path);
        return this.deepClone(value);
    }
    
    /**
     * Set state at path
     * @param {string} path - Dot-notation path
     * @param {*} value - New value
     */
    setState(path, value) {
        const previousValue = this.getState(path);
        
        // Deep clone value to ensure immutability
        const clonedValue = this.deepClone(value);
        
        // Update state
        if (path === '' || path === undefined) {
            this.state = clonedValue;
        } else {
            this.setValueAtPath(this.state, path, clonedValue);
        }
        
        // Track change
        this.trackChange(path, previousValue, clonedValue);
        
        // Notify subscribers
        this.notifySubscribers(path, clonedValue, previousValue);
        
        this.changeCount++;
    }
    
    /**
     * Delete state at path
     * @param {string} path - Dot-notation path
     */
    deleteState(path) {
        if (!path || path === '') {
            this.logger.warn('[Store] Cannot delete root state');
            return;
        }
        
        const previousValue = this.getState(path);
        
        this.deleteValueAtPath(this.state, path);
        
        // Track change
        this.trackChange(path, previousValue, undefined);
        
        // Notify subscribers
        this.notifySubscribers(path, undefined, previousValue);
        
        this.changeCount++;
    }
    
    // =========================================================================
    // PATH UTILITIES
    // =========================================================================
    
    /**
     * Get value at path
     */
    getValueAtPath(obj, path) {
        if (!path) return obj;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    }
    
    /**
     * Set value at path
     */
    setValueAtPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        // Create nested structure if needed
        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    }
    
    /**
     * Delete value at path
     */
    deleteValueAtPath(obj, path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!current[key]) {
                return;
            }
            current = current[key];
        }
        
        delete current[lastKey];
    }
    
    // =========================================================================
    // IMMUTABILITY
    // =========================================================================
    
    /**
     * Deep clone value to ensure immutability
     */
    deepClone(value) {
        if (value === null || value === undefined) {
            return value;
        }
        
        // Handle primitives
        if (typeof value !== 'object') {
            return value;
        }
        
        // Handle Date
        if (value instanceof Date) {
            return new Date(value.getTime());
        }
        
        // Handle Array
        if (Array.isArray(value)) {
            return value.map(item => this.deepClone(item));
        }
        
        // Handle Object
        const cloned = {};
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(value[key]);
            }
        }
        
        return cloned;
    }
    
    // =========================================================================
    // SUBSCRIPTIONS
    // =========================================================================
    
    /**
     * Subscribe to state changes
     * @param {string} path - Path to watch (supports '*' wildcard)
     * @param {Function} callback - Callback(value, previousValue)
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (typeof callback !== 'function') {
            throw new Error('[Store] Callback must be a function');
        }
        
        if (!this.subscriptions.has(path)) {
            this.subscriptions.set(path, new Set());
        }
        
        this.subscriptions.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscriptions.get(path);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscriptions.delete(path);
                }
            }
        };
    }
    
    /**
     * Notify subscribers of state change
     */
    notifySubscribers(path, newValue, previousValue) {
        // Notify exact path subscribers
        const exactCallbacks = this.subscriptions.get(path);
        if (exactCallbacks) {
            exactCallbacks.forEach(callback => {
                try {
                    callback(newValue, previousValue);
                } catch (error) {
                    this.logger.error('[Store] Subscriber callback error', error);
                    
                    if (window.Sentry) {
                        window.Sentry.captureException(error, {
                            tags: { component: 'Store', action: 'notifySubscribers' },
                            extra: { path }
                        });
                    }
                }
            });
        }
        
        // Notify wildcard subscribers
        const wildcardCallbacks = this.subscriptions.get('*');
        if (wildcardCallbacks) {
            wildcardCallbacks.forEach(callback => {
                try {
                    callback(newValue, previousValue, path);
                } catch (error) {
                    this.logger.error('[Store] Wildcard subscriber callback error', error);
                }
            });
        }
        
        // Notify parent path subscribers (e.g., 'auth' when 'auth.user' changes)
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentCallbacks = this.subscriptions.get(parentPath + '.*');
            
            if (parentCallbacks) {
                const parentValue = this.getState(parentPath);
                parentCallbacks.forEach(callback => {
                    try {
                        callback(parentValue, previousValue, path);
                    } catch (error) {
                        this.logger.error('[Store] Parent path subscriber error', error);
                    }
                });
            }
        }
    }
    
    /**
     * Get subscription count
     */
    getSubscriptionCount() {
        let total = 0;
        this.subscriptions.forEach(callbacks => {
            total += callbacks.size;
        });
        return total;
    }
    
    /**
     * Clear all subscriptions
     */
    clearSubscriptions() {
        this.subscriptions.clear();
        this.logger.debug('[Store] All subscriptions cleared');
    }
    
    // =========================================================================
    // HISTORY
    // =========================================================================
    
    /**
     * Track state change in history
     */
    trackChange(path, previousValue, newValue) {
        const change = {
            path,
            previousValue: this.deepClone(previousValue),
            newValue: this.deepClone(newValue),
            timestamp: Date.now()
        };
        
        this.history.push(change);
        
        // Trim history if too large
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }
    
    /**
     * Get state history
     * @param {number} limit - Max number of entries
     * @returns {Array} History entries
     */
    getHistory(limit = null) {
        if (limit) {
            return this.history.slice(-limit);
        }
        return [...this.history];
    }
    
    /**
     * Get history for specific path
     */
    getHistoryForPath(path) {
        return this.history.filter(entry => entry.path === path);
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.logger.debug('[Store] History cleared');
    }
    
    // =========================================================================
    // BATCH OPERATIONS
    // =========================================================================
    
    /**
     * Batch multiple state updates
     * @param {Function} updateFn - Function that performs updates
     */
    batch(updateFn) {
        const initialChangeCount = this.changeCount;
        
        try {
            updateFn();
        } catch (error) {
            this.logger.error('[Store] Batch update failed', error);
            throw error;
        }
        
        const changesCount = this.changeCount - initialChangeCount;
        this.logger.debug('[Store] Batch complete', { changes: changesCount });
    }
    
    // =========================================================================
    // RESET & CLEAR
    // =========================================================================
    
    /**
     * Reset state to empty
     */
    reset() {
        const previousState = this.deepClone(this.state);
        this.state = {};
        
        this.trackChange('', previousState, {});
        this.notifySubscribers('', {}, previousState);
        
        this.logger.info('[Store] State reset');
    }
    
    /**
     * Clear state at path
     */
    clear(path) {
        if (path === '' || path === undefined) {
            this.reset();
        } else {
            this.setState(path, null);
        }
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate state structure
     */
    validateState() {
        const errors = [];
        
        // Check if state is an object
        if (typeof this.state !== 'object' || this.state === null) {
            errors.push('State must be an object');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    // =========================================================================
    // DEBUG & INSPECTION
    // =========================================================================
    
    /**
     * Get store statistics
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            changeCount: this.changeCount,
            subscriptionCount: this.getSubscriptionCount(),
            historySize: this.history.length,
            maxHistorySize: this.maxHistorySize,
            stateSize: JSON.stringify(this.state).length
        };
    }
    
    /**
     * Debug info
     */
    debug() {
        console.group('📦 [Store] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Current state:', this.getState(''));
        console.log('Subscriptions:', Array.from(this.subscriptions.keys()));
        console.log('Recent history:', this.getHistory(5));
        console.groupEnd();
    }
    
    /**
     * Export state as JSON
     */
    exportState() {
        return JSON.stringify(this.state, null, 2);
    }
    
    /**
     * Import state from JSON
     */
    importState(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.setState('', imported);
            this.logger.info('[Store] State imported');
        } catch (error) {
            this.logger.error('[Store] Import failed', error);
            throw error;
        }
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    destroy() {
        this.clearSubscriptions();
        this.clearHistory();
        this.state = {};
        this.isInitialized = false;
        this.logger.info('[Store] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT (Safe Singleton Pattern)
// =============================================================================
// ES6 Module Export
export default Store;

if (!window.OsliraStore) {
    // Create instance without dependencies (lazy resolution)
    const instance = new Store();
    
    window.OsliraStore = instance;
    
    console.log('✅ [Store] Loaded and ready');
    
    if (window.Oslira?.init) {
        window.Oslira.init.register('Store', instance);
        console.log('📋 [Store] Registered with Coordinator');
    }
} else {
    console.log('⚠️ [Store] Already loaded, skipping re-initialization');
}
