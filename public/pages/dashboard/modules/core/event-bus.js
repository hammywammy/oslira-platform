//public/pages/dashboard/modules/core/event-bus.js

/**
 * OSLIRA DASHBOARD EVENT BUS
 * Centralized event system for module communication
 * Replaces direct coupling between modules
 */
class DashboardEventBus extends EventTarget {
    constructor() {
        super();
        this.eventHistory = new Map();
        this.maxHistorySize = 100;
        
        // Track event listeners for debugging
        this.listenerCount = new Map();
        
        console.log('🚀 [EventBus] Initialized');
    }
    
    /**
     * Emit an event with data
     */
    emit(eventName, data = null) {
        const eventDetail = {
            timestamp: Date.now(),
            eventName,
            data,
            id: this.generateEventId()
        };
        
        // Store in history
        this.storeEventHistory(eventName, eventDetail);
        
        // Dispatch the event
        const customEvent = new CustomEvent(eventName, { 
            detail: eventDetail,
            bubbles: false,
            cancelable: false 
        });
        
        this.dispatchEvent(customEvent);
        
        console.log(`📡 [EventBus] Emitted: ${eventName}`, data);
        return eventDetail.id;
    }
    
    /**
     * Listen to an event
     */
    on(eventName, handler, options = {}) {
        const wrappedHandler = (event) => {
            try {
                handler(event.detail.data, event.detail);
            } catch (error) {
                console.error(`❌ [EventBus] Handler error for ${eventName}:`, error);
            }
        };
        
        this.addEventListener(eventName, wrappedHandler, options);
        this.incrementListenerCount(eventName);
        
        console.log(`👂 [EventBus] Listener added for: ${eventName}`);
        
        // Return unsubscribe function
        return () => this.off(eventName, wrappedHandler);
    }
    
    /**
     * Remove event listener
     */
    off(eventName, handler) {
        this.removeEventListener(eventName, handler);
        this.decrementListenerCount(eventName);
        console.log(`🔇 [EventBus] Listener removed for: ${eventName}`);
    }
    
    /**
     * Listen to an event once
     */
    once(eventName, handler) {
        return this.on(eventName, handler, { once: true });
    }
    
    /**
     * Wait for an event to be emitted
     */
    waitFor(eventName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout waiting for event: ${eventName}`));
            }, timeout);
            
            this.once(eventName, (data, detail) => {
                clearTimeout(timer);
                resolve({ data, detail });
            });
        });
    }
    
    /**
     * Get event history for debugging
     */
    getEventHistory(eventName) {
        if (eventName) {
            return this.eventHistory.get(eventName) || [];
        }
        return Array.from(this.eventHistory.entries());
    }
    
    /**
     * Get listener statistics
     */
    getListenerStats() {
        return Array.from(this.listenerCount.entries())
            .map(([eventName, count]) => ({ eventName, count }));
    }
    
    /**
     * Clear all listeners (cleanup)
     */
    clearAllListeners() {
        // Get all event types we're tracking
        const eventTypes = Array.from(this.listenerCount.keys());
        
        eventTypes.forEach(eventType => {
            // Remove all listeners for this event type
            const listeners = this.getEventListeners?.(eventType) || [];
            listeners.forEach(listener => {
                this.removeEventListener(eventType, listener);
            });
        });
        
        this.listenerCount.clear();
        console.log('🧹 [EventBus] All listeners cleared');
    }
    
    // Private methods
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    storeEventHistory(eventName, eventDetail) {
        if (!this.eventHistory.has(eventName)) {
            this.eventHistory.set(eventName, []);
        }
        
        const history = this.eventHistory.get(eventName);
        history.push(eventDetail);
        
        // Limit history size
        if (history.length > this.maxHistorySize) {
            history.shift();
        }
    }
    
    incrementListenerCount(eventName) {
        const current = this.listenerCount.get(eventName) || 0;
        this.listenerCount.set(eventName, current + 1);
    }
    
    decrementListenerCount(eventName) {
        const current = this.listenerCount.get(eventName) || 0;
        if (current > 0) {
            this.listenerCount.set(eventName, current - 1);
            if (current === 1) {
                this.listenerCount.delete(eventName);
            }
        }
    }
}

// Standard dashboard events
const DASHBOARD_EVENTS = {
    // Lifecycle
    INIT_START: 'dashboard:init:start',
    INIT_COMPLETE: 'dashboard:init:complete',
    CLEANUP: 'dashboard:cleanup',
    
    // Loading
    LOADING_START: 'dashboard:loading:start',
    LOADING_END: 'dashboard:loading:end',
    
    // Data
    DATA_LOADED: 'dashboard:data:loaded',
    DATA_ERROR: 'dashboard:data:error',
    DATA_REFRESH: 'dashboard:data:refresh',
    
    // Leads
    LEADS_LOADED: 'leads:loaded',
    LEAD_SELECTED: 'leads:selected',
    LEAD_DESELECTED: 'leads:deselected',
    LEAD_DELETED: 'leads:deleted',
    LEAD_CREATED: 'leads:created',
    LEAD_UPDATED: 'leads:updated',
    LEAD_VIEWED: 'leads:viewed',
    
    // Selection
    SELECTION_CHANGED: 'leads:selection:changed',
    SELECTION_CLEARED: 'leads:selection:cleared',
    BULK_SELECTION: 'leads:bulk:selected',
    
    // Filters
    FILTER_CHANGED: 'leads:filter:changed',
    SEARCH_CHANGED: 'leads:search:changed',
    
    // Analysis
    ANALYSIS_STARTED: 'analysis:started',
    ANALYSIS_PROGRESS: 'analysis:progress',
    ANALYSIS_COMPLETED: 'analysis:completed',
    ANALYSIS_FAILED: 'analysis:failed',
    
    // Queue
    QUEUE_UPDATED: 'queue:updated',
    QUEUE_ITEM_ADDED: 'queue:item:added',
    QUEUE_ITEM_REMOVED: 'queue:item:removed',
    
    // Real-time
    REALTIME_CONNECTED: 'realtime:connected',
    REALTIME_DISCONNECTED: 'realtime:disconnected',
    REALTIME_UPDATE: 'realtime:update',
    
    // Stats
    STATS_UPDATED: 'stats:updated',
    STATS_REFRESH: 'stats:refresh',
    
    // Business
    BUSINESS_CHANGED: 'business:changed',
    BUSINESS_LOADED: 'business:loaded',
    
    // UI
    MODAL_OPENED: 'ui:modal:opened',
    MODAL_CLOSED: 'ui:modal:closed',
    
    // Errors
    ERROR: 'dashboard:error',
    WARNING: 'dashboard:warning',
    
    // Credits
    CREDITS_UPDATED: 'credits:updated',
    CREDITS_INSUFFICIENT: 'credits:insufficient'
};

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardEventBus, DASHBOARD_EVENTS };
} else {
    window.DashboardEventBus = DashboardEventBus;
    window.DASHBOARD_EVENTS = DASHBOARD_EVENTS;
}
