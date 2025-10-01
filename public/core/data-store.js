// =============================================================================
// DATA-STORE.JS - Centralized State Management System
// Reactive state management with localStorage persistence and middleware support
// =============================================================================

class OsliraDataStore {
    constructor() {
        this.state = {
            // User data
            user: null,
            session: null,
            businesses: [],
            selectedBusiness: null,
            
            // Application data
            leads: [],
            analytics: {
                summary: null,
                trends: null,
                lastUpdated: null
            },
            
            // UI state
            preferences: {
                theme: 'light',
                sidebarCollapsed: false,
                dashboardView: 'grid',
                notificationsEnabled: true,
                leadSortBy: 'created_at',
                leadSortOrder: 'desc'
            },
            
            // Cache
            cache: {
                apiResponses: new Map(),
                lastRefresh: null,
                version: '1.0.0',
                maxSize: 100,
                ttl: 5 * 60 * 1000 // 5 minutes
            },
            
            // Real-time subscriptions
            subscriptions: new Map(),
            
            // Application status
            status: {
                online: navigator.onLine,
                loading: false,
                error: null,
                lastSync: null,
                initialized: false
            }
        };
        
        this.subscribers = new Map();
        this.middleware = [];
        this.initialized = false;
        this.cleanupInterval = null;
        
        this.init();
    }
    
    init() {
        if (this.initialized) return;
        
        // Load persisted state
        this.loadFromStorage();
        
        // Setup online/offline detection
        this.setupNetworkListeners();
        
        // Setup periodic state cleanup
        this.setupCleanupInterval();
        
        // Mark as initialized
        this.set('status.initialized', true, { persist: false });
        this.initialized = true;
        
        console.log('✅ [Store] Data Store initialized');
    }
    
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================
    
    /**
     * Get state value by path
     * @param {string} path - Dot notation path (e.g., 'user.id', 'preferences.theme')
     * @returns {any} State value
     */
    get(path) {
        if (!path) return this.state;
        
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    }
    
    /**
     * Set state value by path
     * @param {string} path - Dot notation path
     * @param {any} value - New value
     * @param {object} options - Options for persistence and notification
     */
    set(path, value, options = {}) {
        const {
            persist = true,
            notify = true,
            merge = false
        } = options;
        
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.state;
        
        // Navigate to parent object
        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        // Set the value
        const oldValue = current[lastKey];
        
        if (merge && typeof value === 'object' && typeof oldValue === 'object') {
            current[lastKey] = { ...oldValue, ...value };
        } else {
            current[lastKey] = value;
        }
        
        // Execute middleware
        this.executeMiddleware(path, value, oldValue);
        
        // Persist to localStorage if needed
        if (persist) {
            this.persistToStorage(path, current[lastKey]);
        }
        
        // Notify subscribers if needed
        if (notify) {
            this.notifySubscribers(path, current[lastKey], oldValue);
        }
        
        console.log(`📊 [Store] Updated ${path}:`, current[lastKey]);
    }
    
    /**
     * Update nested object properties
     * @param {string} path - Path to object
     * @param {object} updates - Properties to update
     */
    update(path, updates, options = {}) {
        const currentValue = this.get(path);
        if (typeof currentValue === 'object' && currentValue !== null) {
            this.set(path, { ...currentValue, ...updates }, options);
        } else {
            this.set(path, updates, options);
        }
    }
    
    /**
     * Delete state property
     * @param {string} path - Path to delete
     */
    delete(path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const parentPath = keys.join('.');
        const parent = parentPath ? this.get(parentPath) : this.state;
        
        if (parent && typeof parent === 'object' && lastKey in parent) {
            const oldValue = parent[lastKey];
            delete parent[lastKey];
            
            this.executeMiddleware(path, undefined, oldValue);
            this.notifySubscribers(path, undefined, oldValue);
            
            console.log(`🗑️ [Store] Deleted ${path}`);
        }
    }
    
    /**
     * Push item to array in state
     * @param {string} path - Path to array
     * @param {any} item - Item to push
     */
    push(path, item) {
        const array = this.get(path);
        if (Array.isArray(array)) {
            array.push(item);
            this.set(path, array);
        } else {
            this.set(path, [item]);
        }
    }
    
    /**
     * Remove item from array in state
     * @param {string} path - Path to array
     * @param {function|any} predicate - Function to find item or item to remove
     */
    remove(path, predicate) {
        const array = this.get(path);
        if (!Array.isArray(array)) return;
        
        let index;
        if (typeof predicate === 'function') {
            index = array.findIndex(predicate);
        } else {
            index = array.indexOf(predicate);
        }
        
        if (index > -1) {
            array.splice(index, 1);
            this.set(path, array);
        }
    }
    
    /**
     * Toggle boolean value in state
     * @param {string} path - Path to boolean
     */
    toggle(path) {
        const currentValue = this.get(path);
        this.set(path, !currentValue);
    }
    
    // =============================================================================
    // SUBSCRIPTION SYSTEM
    // =============================================================================
    
    /**
     * Subscribe to state changes
     * @param {string} path - Path to watch
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        
        this.subscribers.get(path).add(callback);
        
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
     * Subscribe to multiple paths
     * @param {string[]} paths - Paths to watch
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    subscribeMultiple(paths, callback) {
        const unsubscribers = paths.map(path => this.subscribe(path, callback));
        
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }
    
    /**
     * Subscribe once to state change
     * @param {string} path - Path to watch
     * @param {function} callback - Callback function
     */
    subscribeOnce(path, callback) {
        const unsubscribe = this.subscribe(path, (value, oldValue, changePath) => {
            unsubscribe();
            callback(value, oldValue, changePath);
        });
    }
    
    notifySubscribers(path, newValue, oldValue) {
        // Notify direct subscribers
        const directSubscribers = this.subscribers.get(path);
        if (directSubscribers) {
            directSubscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`Error in subscriber for ${path}:`, error);
                }
            });
        }
        
        // Notify parent path subscribers
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentSubscribers = this.subscribers.get(parentPath);
            if (parentSubscribers) {
                parentSubscribers.forEach(callback => {
                    try {
                        callback(this.get(parentPath), undefined, parentPath);
                    } catch (error) {
                        console.error(`Error in parent subscriber for ${parentPath}:`, error);
                    }
                });
            }
        }
    }
    
    // =============================================================================
    // MIDDLEWARE SYSTEM
    // =============================================================================
    
    /**
     * Add middleware for state changes
     * @param {function} middleware - Middleware function
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }
    
    /**
     * Remove middleware
     * @param {function} middleware - Middleware function to remove
     */
    removeMiddleware(middleware) {
        const index = this.middleware.indexOf(middleware);
        if (index > -1) {
            this.middleware.splice(index, 1);
        }
    }
    
    executeMiddleware(path, newValue, oldValue) {
        this.middleware.forEach(middleware => {
            try {
                middleware(path, newValue, oldValue, this);
            } catch (error) {
                console.error('Middleware error:', error);
            }
        });
    }
    
    // =============================================================================
    // PERSISTENCE SYSTEM
    // =============================================================================
    
    loadFromStorage() {
        try {
            // Load user preferences
            const preferences = localStorage.getItem('oslira-preferences');
            if (preferences) {
                this.set('preferences', JSON.parse(preferences), { notify: false });
            }
            
            // Load selected business
            const selectedBusinessId = localStorage.getItem('selectedBusinessId');
            if (selectedBusinessId) {
                this.set('selectedBusiness', { id: selectedBusinessId }, { notify: false });
            }
            
            // Load cached data with expiration check
            const cachedData = localStorage.getItem('oslira-cache');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const expirationTime = parsed.timestamp + (24 * 60 * 60 * 1000); // 24 hours
                
                if (Date.now() < expirationTime) {
                    // Only load cache data, not the Map objects
                    this.update('cache', {
                        lastRefresh: parsed.data.lastRefresh,
                        version: parsed.data.version
                    }, { notify: false, persist: false });
                }
            }
            
            console.log('📁 [Store] State loaded from localStorage');
        } catch (error) {
            console.error('Failed to load state from storage:', error);
        }
    }
    
    persistToStorage(path, value) {
        try {
            // Persist specific state branches
            if (path.startsWith('preferences')) {
                localStorage.setItem('oslira-preferences', JSON.stringify(this.get('preferences')));
            } else if (path === 'selectedBusiness') {
                if (value && value.id) {
                    localStorage.setItem('selectedBusinessId', value.id);
                }
            } else if (path.startsWith('cache')) {
                // Persist cache data with timestamp
                const cacheData = {
                    timestamp: Date.now(),
                    data: {
                        lastRefresh: this.get('cache.lastRefresh'),
                        version: this.get('cache.version')
                    }
                };
                localStorage.setItem('oslira-cache', JSON.stringify(cacheData));
            }
        } catch (error) {
            console.error('Failed to persist to storage:', error);
        }
    }
    
    // =============================================================================
    // CACHE MANAGEMENT
    // =============================================================================
    
    /**
     * Set cached response
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    setCache(key, data, ttl = null) {
        const cache = this.get('cache.apiResponses');
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.get('cache.ttl')
        };
        
        cache.set(key, cacheEntry);
        
        // Clean up old entries if cache is getting too large
        if (cache.size > this.get('cache.maxSize')) {
            this.cleanupCache();
        }
    }
    
    /**
     * Get cached response
     * @param {string} key - Cache key
     * @returns {any|null} Cached data or null if expired/not found
     */
    getCache(key) {
        const cache = this.get('cache.apiResponses');
        const entry = cache.get(key);
        
        if (!entry) return null;
        
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            cache.delete(key);
            return null;
        }
        
        return entry.data;
    }
    
    /**
     * Clear specific cache entry
     * @param {string} key - Cache key to clear
     */
    clearCache(key = null) {
        const cache = this.get('cache.apiResponses');
        
        if (key) {
            cache.delete(key);
        } else {
            cache.clear();
            this.set('cache.lastRefresh', null);
        }
        
        console.log('🧹 [Store] Cache cleared');
    }
    
    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const cache = this.get('cache.apiResponses');
        const now = Date.now();
        
        for (const [key, entry] of cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                cache.delete(key);
            }
        }
    }
    
    /**
     * Get cache size and statistics
     */
    getCacheSize() {
        const cache = this.get('cache.apiResponses');
        return {
            entries: cache.size,
            maxSize: this.get('cache.maxSize'),
            usage: `${cache.size}/${this.get('cache.maxSize')}`
        };
    }
    
    // =============================================================================
    // NETWORK STATUS
    // =============================================================================
    
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.set('status.online', true, { persist: false });
            console.log('🌐 [Store] Network online');
        });
        
        window.addEventListener('offline', () => {
            this.set('status.online', false, { persist: false });
            console.log('📡 [Store] Network offline');
        });
    }
    
    // =============================================================================
    // PERIODIC CLEANUP
    // =============================================================================
    
    setupCleanupInterval() {
        // Clean up cache every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupCache();
        }, 5 * 60 * 1000);
    }
    
    clearCleanupInterval() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    
    // =============================================================================
    // UTILITY METHODS
    // =============================================================================
    
    /**
     * Deep clone a value
     */
    clone(value) {
        if (value === null || typeof value !== 'object') return value;
        if (value instanceof Date) return new Date(value.getTime());
        if (value instanceof Array) return value.map(item => this.clone(item));
        if (value instanceof Map) {
            const cloned = new Map();
            value.forEach((val, key) => cloned.set(key, this.clone(val)));
            return cloned;
        }
        if (value instanceof Set) {
            return new Set([...value].map(item => this.clone(item)));
        }
        if (typeof value === 'object') {
            const cloned = {};
            Object.keys(value).forEach(key => {
                cloned[key] = this.clone(value[key]);
            });
            return cloned;
        }
        return value;
    }
    
    /**
     * Get state snapshot for debugging
     */
    getSnapshot() {
        return this.clone(this.state);
    }
    
    /**
     * Reset specific state branch to default
     */
    reset(path) {
        const defaultStates = {
            'leads': [],
            'analytics': {
                summary: null,
                trends: null,
                lastUpdated: null
            },
            'cache': {
                apiResponses: new Map(),
                lastRefresh: null,
                version: '1.0.0',
                maxSize: 100,
                ttl: 5 * 60 * 1000
            },
            'preferences': {
                theme: 'light',
                sidebarCollapsed: false,
                dashboardView: 'grid',
                notificationsEnabled: true,
                leadSortBy: 'created_at',
                leadSortOrder: 'desc'
            }
        };
        
        if (defaultStates[path]) {
            this.set(path, this.clone(defaultStates[path]));
            console.log(`🔄 [Store] Reset ${path} to default state`);
        }
    }
    
    /**
     * Import state from external source
     */
    import(data, options = {}) {
        const { merge = false, validate = true } = options;
        
        if (validate && !this.validateStateStructure(data)) {
            throw new Error('Invalid state structure for import');
        }
        
        if (merge) {
            // Merge with existing state
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'object' && data[key] !== null) {
                    this.update(key, data[key]);
                } else {
                    this.set(key, data[key]);
                }
            });
        } else {
            // Replace entire state
            this.state = this.clone(data);
            this.notifyAllSubscribers();
        }
        
        console.log('📥 [Store] State imported');
    }
    
    /**
     * Export state for backup/transfer
     */
    export(includeCache = false) {
        const exported = this.clone(this.state);
        
        if (!includeCache) {
            delete exported.cache;
        }
        
        return {
            ...exported,
            exportedAt: new Date().toISOString(),
            version: this.get('cache.version')
        };
    }
    
    /**
     * Validate state structure
     */
    validateStateStructure(data) {
        const requiredKeys = ['user', 'businesses', 'leads', 'preferences', 'status'];
        return requiredKeys.every(key => key in data);
    }
    
    /**
     * Notify all subscribers (used during import)
     */
    notifyAllSubscribers() {
        this.subscribers.forEach((callbacks, path) => {
            const value = this.get(path);
            callbacks.forEach(callback => {
                try {
                    callback(value, undefined, path);
                } catch (error) {
                    console.error(`Error in subscriber for ${path}:`, error);
                }
            });
        });
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            subscriberCount: Array.from(this.subscribers.values()).reduce((total, set) => 
                total + set.size, 0),
            pathsWatched: this.subscribers.size,
            cacheSize: this.getCacheSize(),
            lastCleanup: this.get('cache.lastCleanup'),
            memoryUsage: this.getMemoryUsage(),
            stateSize: JSON.stringify(this.state).length
        };
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
    
    // =============================================================================
    // DEBUG HELPERS
    // =============================================================================
    
    debug() {
        console.group('🔍 [Store] Debug Information');
        console.log('Current State:', this.getSnapshot());
        console.log('Subscribers:', Object.fromEntries(
            Array.from(this.subscribers.entries()).map(([path, callbacks]) => [path, callbacks.size])
        ));
        console.log('Performance:', this.getPerformanceStats());
        console.groupEnd();
    }
    
    // =============================================================================
    // DESTRUCTION
    // =============================================================================
    
    destroy() {
        // Clear cleanup interval
        this.clearCleanupInterval();
        
        // Clear all subscriptions
        this.subscribers.clear();
        
        // Clear middleware
        this.middleware = [];
        
        // Clear cache
        this.clearCache();
        
        // Remove network listeners
        window.removeEventListener('online', this.setupNetworkListeners);
        window.removeEventListener('offline', this.setupNetworkListeners);
        
        console.log('🗑️ [Store] Data Store destroyed');
    }
}

// Export for global use
window.OsliraDataStore = OsliraDataStore;

console.log('📊 Data Store class loaded');
