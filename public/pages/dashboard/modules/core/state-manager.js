//public/pages/dashboard/modules/core/state-manager.js

/**
 * OSLIRA DASHBOARD STATE MANAGER
 * Centralized state management for all dashboard data
 * Replaces scattered global variables and localStorage usage
 */
class DashboardStateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // Core application state
        this.state = {
            // User & Auth
            user: null,
            isAuthenticated: false,
            session: null,
            
            // Business Context
            businesses: [],
            selectedBusiness: null,
            
            // Leads Data
            leads: [],
            allLeads: [], // Complete dataset
            filteredLeads: [], // After filtering
            selectedLeads: new Set(),
            
            // Filters & Search
            currentFilter: 'all',
            searchTerm: '',
            sortBy: 'created_at',
            sortOrder: 'desc',
            
            // UI State
            isLoading: false,
            loadingMessage: 'Loading...',
            currentView: 'dashboard',
            activeModal: null,
            
            // Stats
            stats: {
                totalLeads: 0,
                averageScore: 0,
                highValueLeads: 0,
                totalAnalyses: 0,
                creditsRemaining: 0,
                lastUpdate: null
            },
            
            // Real-time
            isRealtimeActive: false,
            lastUpdateTimestamp: null,
            connectionStatus: 'disconnected',
            
            // Analysis Queue
            analysisQueue: new Map(),
            queueVisible: false,
            
            // Cache
            cache: {
                leads: null,
                lastRefresh: null,
                businesses: null
            },
            
            // Preferences
            preferences: {
                autoRefresh: true,
                notifications: true,
                defaultAnalysisType: 'light',
                defaultBusiness: null
            }
        };
        
        // Subscribers for reactive updates
        this.subscribers = new Map();
        this.computedCache = new Map();
        
        // Load persisted state
        this.loadPersistedState();
        
        console.log('🚀 [StateManager] Initialized');
    }
    
    /**
     * Get state value
     */
    getState(path = null) {
        if (!path) {
            return this.state;
        }
        
        return this.getNestedValue(this.state, path);
    }
    
    /**
     * Set state value and notify subscribers
     */
    setState(path, value, silent = false) {
        const oldValue = this.getNestedValue(this.state, path);
        
        if (oldValue === value) {
            return; // No change, skip update
        }
        
        // Update the state
        this.setNestedValue(this.state, path, value);
        
        // Persist critical state
        this.persistCriticalState(path, value);
        
        // Clear affected computed values
        this.clearAffectedComputedCache(path);
        
        if (!silent) {
            // Notify subscribers
            this.notifySubscribers(path, value, oldValue);
            
            // Emit event for broader system
            this.eventBus?.emit('state:changed', {
                path,
                value,
                oldValue
            });
        }
        
        console.log(`📝 [StateManager] State updated: ${path}`, { value, oldValue });
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(path, callback, immediate = false) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        
        this.subscribers.get(path).add(callback);
        
        // Call immediately with current value if requested
        if (immediate) {
            const currentValue = this.getNestedValue(this.state, path);
            callback(currentValue, null);
        }
        
        // Return unsubscribe function
        return () => {
            const pathSubscribers = this.subscribers.get(path);
            if (pathSubscribers) {
                pathSubscribers.delete(callback);
                if (pathSubscribers.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }
    
    /**
     * Create computed state that auto-updates
     */
    computed(name, dependencies, computeFn) {
        // Store computation function
        this.computedCache.set(name, {
            dependencies,
            computeFn,
            value: null,
            dirty: true
        });
        
        // Subscribe to dependencies
        dependencies.forEach(dep => {
            this.subscribe(dep, () => {
                this.invalidateComputed(name);
            });
        });
        
        return () => this.getComputed(name);
    }
    
    /**
     * Get computed value
     */
    getComputed(name) {
        const computed = this.computedCache.get(name);
        if (!computed) {
            throw new Error(`Computed value '${name}' not found`);
        }
        
        if (computed.dirty) {
            const depValues = computed.dependencies.map(dep => this.getNestedValue(this.state, dep));
            computed.value = computed.computeFn(...depValues);
            computed.dirty = false;
        }
        
        return computed.value;
    }
    
    /**
     * Batch multiple state updates
     */
    batchUpdate(updates, silent = false) {
        const oldValues = {};
        
        // Apply all updates
        Object.entries(updates).forEach(([path, value]) => {
            oldValues[path] = this.getNestedValue(this.state, path);
            this.setNestedValue(this.state, path, value);
        });
        
        // Persist critical state
        Object.entries(updates).forEach(([path, value]) => {
            this.persistCriticalState(path, value);
        });
        
        if (!silent) {
            // Notify all affected subscribers
            Object.entries(updates).forEach(([path, value]) => {
                this.notifySubscribers(path, value, oldValues[path]);
            });
            
            // Emit batch update event
            this.eventBus?.emit('state:batch_updated', {
                updates,
                oldValues
            });
        }
        
        console.log('📝 [StateManager] Batch update completed:', Object.keys(updates));
    }
    
    /**
     * Reset state to initial values
     */
    reset(preserveAuth = true) {
        const authState = preserveAuth ? {
            user: this.state.user,
            isAuthenticated: this.state.isAuthenticated,
            session: this.state.session
        } : {};
        
        // Clear computed cache
        this.computedCache.clear();
        
        // Reset to initial state
        this.state = {
            ...this.getInitialState(),
            ...authState
        };
        
        // Clear localStorage except auth
        if (!preserveAuth) {
            this.clearPersistedState();
        }
        
        // Notify reset
        this.eventBus?.emit('state:reset', { preserveAuth });
        
        console.log('🔄 [StateManager] State reset completed');
    }
    
    /**
     * Export state for debugging/persistence
     */
    exportState() {
        return {
            timestamp: Date.now(),
            state: JSON.parse(JSON.stringify(this.state)),
            computedKeys: Array.from(this.computedCache.keys()),
            subscriberPaths: Array.from(this.subscribers.keys())
        };
    }
    
    /**
     * Get state summary for debugging
     */
    getStateSummary() {
        return {
            totalLeads: this.state.leads.length,
            selectedLeads: this.state.selectedLeads.size,
            currentFilter: this.state.currentFilter,
            isLoading: this.state.isLoading,
            isAuthenticated: this.state.isAuthenticated,
            selectedBusiness: this.state.selectedBusiness?.business_name || 'None',
            queueSize: this.state.analysisQueue.size,
            connectionStatus: this.state.connectionStatus,
            subscribers: this.subscribers.size,
            computedValues: this.computedCache.size
        };
    }
    
    // Private methods
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current?.[key];
        }, obj);
    }
    
setNestedValue(obj, path, value) {
    if (!path || typeof path !== 'string') {
        console.error('Invalid path for setNestedValue:', path);
        return;
    }
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) {
        console.error('Invalid lastKey for path:', path);
        return;
    }
    
    const target = keys.reduce((current, key) => {
        if (!current || typeof current !== 'object') {
            console.error('Cannot navigate to key:', key, 'in path:', path);
            return {};
        }
        if (!(key in current)) {
            current[key] = {};
        }
        return current[key];
    }, obj);
    
    if (!target || typeof target !== 'object') {
        console.error('Invalid target for setting value at path:', path);
        return;
    }
    
    target[lastKey] = value;
}
    
    notifySubscribers(path, value, oldValue) {
        const subscribers = this.subscribers.get(path);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(value, oldValue);
                } catch (error) {
                    console.error(`❌ [StateManager] Subscriber error for ${path}:`, error);
                }
            });
        }
    }
    
    invalidateComputed(name) {
        const computed = this.computedCache.get(name);
        if (computed) {
            computed.dirty = true;
        }
    }
    
    clearAffectedComputedCache(changedPath) {
        for (const [name, computed] of this.computedCache.entries()) {
            if (computed.dependencies.some(dep => changedPath.startsWith(dep))) {
                computed.dirty = true;
            }
        }
    }
    
    persistCriticalState(path, value) {
        const criticalPaths = {
            'selectedBusiness': 'selectedBusinessId',
            'preferences': 'dashboardPreferences',
            'currentFilter': 'dashboardFilter'
        };
        
        const storageKey = criticalPaths[path];
        if (storageKey) {
            try {
                if (path === 'selectedBusiness' && value?.id) {
                    localStorage.setItem(storageKey, value.id);
                } else {
                    localStorage.setItem(storageKey, JSON.stringify(value));
                }
            } catch (error) {
                console.warn(`⚠️ [StateManager] Failed to persist ${path}:`, error);
            }
        }
    }
    
    loadPersistedState() {
        try {
            // Load basic preferences
            const preferences = localStorage.getItem('dashboardPreferences');
            if (preferences) {
                this.state.preferences = { ...this.state.preferences, ...JSON.parse(preferences) };
            }
            
            // Load filter state
            const filter = localStorage.getItem('dashboardFilter');
            if (filter) {
                this.state.currentFilter = filter;
            }
            
            console.log('✅ [StateManager] Persisted state loaded');
        } catch (error) {
            console.warn('⚠️ [StateManager] Failed to load persisted state:', error);
        }
    }
    
    clearPersistedState() {
        const keys = [
            'selectedBusinessId',
            'dashboardPreferences', 
            'dashboardFilter'
        ];
        
        keys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`⚠️ Failed to clear ${key}:`, error);
            }
        });
    }
    
    getInitialState() {
        return {
            user: null,
            isAuthenticated: false,
            session: null,
            businesses: [],
            selectedBusiness: null,
            leads: [],
            allLeads: [],
            filteredLeads: [],
            selectedLeads: new Set(),
            currentFilter: 'all',
            searchTerm: '',
            sortBy: 'created_at',
            sortOrder: 'desc',
            isLoading: false,
            loadingMessage: 'Loading...',
            currentView: 'dashboard',
            activeModal: null,
            stats: {
                totalLeads: 0,
                averageScore: 0,
                highValueLeads: 0,
                totalAnalyses: 0,
                creditsRemaining: 0,
                lastUpdate: null
            },
            isRealtimeActive: false,
            lastUpdateTimestamp: null,
            connectionStatus: 'disconnected',
            analysisQueue: new Map(),
            queueVisible: false,
            cache: {
                leads: null,
                lastRefresh: null,
                businesses: null
            },
            preferences: {
                autoRefresh: true,
                notifications: true,
                defaultAnalysisType: 'light',
                defaultBusiness: null
            }
        };
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardStateManager };
} else {
    window.DashboardStateManager = DashboardStateManager;
}
