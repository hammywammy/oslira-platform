// =============================================================================
// STATE MANAGER - State Management with Computed Values
// Path: /public/core/state/StateManager.js
// Dependencies: Store, Logger
// ============================================================================= 

/**
 * @class StateManager
 * @description High-level state management with computed values and convenience methods
 * 
 * Features:
 * - Convenience methods for common state operations
 * - Computed state (auto-updating derived values)
 * - State validation
 * - State persistence
 * - State history and undo/redo
 */
class StateManager {
    constructor(store, logger) {
        if (!store) {
            throw new Error('[StateManager] Store instance required');
        }
        if (!logger) {
            throw new Error('[StateManager] Logger instance required');
        }
        
        this.store = store;
        this.logger = logger;
        
        this.isInitialized = false;
        
        // Computed state definitions
        this.computedState = new Map();
        
        console.log('🎯 [StateManager] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('[StateManager] Already initialized');
            return;
        }
        
        try {
            // Initialize default state structure
            this.initializeDefaultState();
            
            // Setup computed state
            this.setupComputedState();
            
            this.isInitialized = true;
            this.logger.info('[StateManager] Initialized');
            
        } catch (error) {
            this.logger.error('[StateManager] Initialization failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'StateManager', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Initialize default state structure
     */
    initializeDefaultState() {
        const defaultState = {
            auth: {
                user: null,
                session: null,
                isAuthenticated: false
            },
            business: {
                all: [],
                selected: null
            },
            leads: {
                all: [],
                filtered: [],
                selected: []
            },
            ui: {
                loading: false,
                sidebarCollapsed: false,
                activeModal: null,
                filters: {}
            },
            analytics: {
                stats: {}
            },
            user: {
                preferences: {},
                subscription: null
            }
        };
        
        // Set default state
        this.store.setState('', defaultState);
        
        this.logger.debug('[StateManager] Default state initialized');
    }
    
    /**
     * Setup computed state definitions
     */
    setupComputedState() {
        // Total lead count
        this.defineComputedState('leads.totalCount', () => {
            const leads = this.getState('leads.all') || [];
            return leads.length;
        }, ['leads.all']);
        
        // Selected lead count
        this.defineComputedState('leads.selectedCount', () => {
            const selected = this.getState('leads.selected') || [];
            return selected.length;
        }, ['leads.selected']);
        
        // Has businesses
        this.defineComputedState('business.hasBusinesses', () => {
            const businesses = this.getState('business.all') || [];
            return businesses.length > 0;
        }, ['business.all']);
        
        // Is authenticated
        this.defineComputedState('auth.isAuthenticated', () => {
            const user = this.getState('auth.user');
            return user !== null && user !== undefined;
        }, ['auth.user']);
        
        // User credits
        this.defineComputedState('auth.credits', () => {
            const user = this.getState('auth.user');
            return user?.credits || 0;
        }, ['auth.user']);
        
        this.logger.debug('[StateManager] Computed state setup complete');
    }
    
    /**
     * Define computed state
     * @param {string} path - State path
     * @param {Function} computeFn - Computation function
     * @param {Array} dependencies - Paths to watch
     */
    defineComputedState(path, computeFn, dependencies = []) {
        this.computedState.set(path, {
            compute: computeFn,
            dependencies
        });
        
        // Subscribe to dependencies
        dependencies.forEach(dep => {
            this.store.subscribe(dep, () => {
                const value = computeFn();
                this.store.setState(path, value);
            });
        });
        
        // Compute initial value
        const initialValue = computeFn();
        this.store.setState(path, initialValue);
    }
    
    // =========================================================================
    // STATE ACCESS (Convenience Methods)
    // =========================================================================
    
    /**
     * Get state at path
     * @param {string} path - State path
     * @returns {*} State value
     */
    getState(path) {
        return this.store.getState(path);
    }
    
    /**
     * Set state at path
     * @param {string} path - State path
     * @param {*} value - New value
     */
    setState(path, value) {
        this.store.setState(path, value);
    }
    
    /**
     * Update state at path (merge with existing)
     * @param {string} path - State path
     * @param {Object} updates - Updates to merge
     */
    updateState(path, updates) {
        const current = this.getState(path) || {};
        
        if (typeof current !== 'object' || Array.isArray(current)) {
            this.logger.warn('[StateManager] Cannot update non-object state', { path });
            return;
        }
        
        this.setState(path, { ...current, ...updates });
    }
    
    /**
     * Delete state at path
     * @param {string} path - State path
     */
    deleteState(path) {
        this.store.deleteState(path);
    }
    
    /**
     * Reset state to default
     */
    resetState() {
        this.initializeDefaultState();
        this.logger.info('[StateManager] State reset to default');
    }
    
    // =========================================================================
    // SUBSCRIPTION (Convenience Methods)
    // =========================================================================
    
    /**
     * Subscribe to state changes
     * @param {string} path - State path
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        return this.store.subscribe(path, callback);
    }
    
    /**
     * Subscribe once to state change
     * @param {string} path - State path
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribeOnce(path, callback) {
        const unsubscribe = this.store.subscribe(path, (value, previousValue) => {
            callback(value, previousValue);
            unsubscribe();
        });
        return unsubscribe;
    }
    
    // =========================================================================
    // AUTH STATE HELPERS
    // =========================================================================
    
    /**
     * Set current user
     */
    setUser(user) {
        this.setState('auth.user', user);
        this.setState('auth.session', user ? { user } : null);
    }
    
    /**
     * Get current user
     */
    getUser() {
        return this.getState('auth.user');
    }
    
    /**
     * Clear auth state
     */
    clearAuth() {
        this.setState('auth.user', null);
        this.setState('auth.session', null);
    }
    
    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return this.getState('auth.isAuthenticated');
    }
    
    // =========================================================================
    // BUSINESS STATE HELPERS
    // =========================================================================
    
    /**
     * Set businesses
     */
    setBusinesses(businesses) {
        this.setState('business.all', businesses);
    }
    
    /**
     * Get all businesses
     */
    getBusinesses() {
        return this.getState('business.all') || [];
    }
    
    /**
     * Set selected business
     */
    setSelectedBusiness(business) {
        this.setState('business.selected', business);
    }
    
    /**
     * Get selected business
     */
    getSelectedBusiness() {
        return this.getState('business.selected');
    }
    
    /**
     * Add business
     */
    addBusiness(business) {
        const businesses = this.getBusinesses();
        this.setBusinesses([...businesses, business]);
    }
    
    /**
     * Update business
     */
    updateBusiness(businessId, updates) {
        const businesses = this.getBusinesses();
        const updated = businesses.map(b => 
            b.id === businessId ? { ...b, ...updates } : b
        );
        this.setBusinesses(updated);
    }
    
    /**
     * Remove business
     */
    removeBusiness(businessId) {
        const businesses = this.getBusinesses();
        const filtered = businesses.filter(b => b.id !== businessId);
        this.setBusinesses(filtered);
    }
    
    // =========================================================================
    // LEAD STATE HELPERS
    // =========================================================================
    
    /**
     * Set leads
     */
    setLeads(leads) {
        this.setState('leads.all', leads);
        this.setState('leads.filtered', leads);
    }
    
    /**
     * Get all leads
     */
    getLeads() {
        return this.getState('leads.all') || [];
    }
    
    /**
     * Get filtered leads
     */
    getFilteredLeads() {
        return this.getState('leads.filtered') || [];
    }
    
    /**
     * Add lead
     */
    addLead(lead) {
        const leads = this.getLeads();
        this.setState('leads.all', [lead, ...leads]);
    }
    
    /**
     * Update lead
     */
    updateLead(leadId, updates) {
        const leads = this.getLeads();
        const updated = leads.map(l => 
            l.id === leadId ? { ...l, ...updates } : l
        );
        this.setState('leads.all', updated);
    }
    
    /**
     * Remove lead
     */
    removeLead(leadId) {
        const leads = this.getLeads();
        const filtered = leads.filter(l => l.id !== leadId);
        this.setState('leads.all', filtered);
    }
    
    /**
     * Set selected leads
     */
    setSelectedLeads(leadIds) {
        this.setState('leads.selected', leadIds);
    }
    
    /**
     * Get selected leads
     */
    getSelectedLeads() {
        return this.getState('leads.selected') || [];
    }
    
    /**
     * Clear selected leads
     */
    clearSelectedLeads() {
        this.setState('leads.selected', []);
    }
    
    // =========================================================================
    // UI STATE HELPERS
    // =========================================================================
    
    /**
     * Set loading state
     */
    setLoading(isLoading) {
        this.setState('ui.loading', isLoading);
    }
    
    /**
     * Get loading state
     */
    isLoading() {
        return this.getState('ui.loading') || false;
    }
    
    /**
     * Set active modal
     */
    setActiveModal(modalId) {
        this.setState('ui.activeModal', modalId);
    }
    
    /**
     * Get active modal
     */
    getActiveModal() {
        return this.getState('ui.activeModal');
    }
    
    /**
     * Clear active modal
     */
    clearActiveModal() {
        this.setState('ui.activeModal', null);
    }
    
    /**
     * Set filters
     */
    setFilters(filters) {
        this.setState('ui.filters', filters);
    }
    
    /**
     * Get filters
     */
    getFilters() {
        return this.getState('ui.filters') || {};
    }
    
    /**
     * Clear filters
     */
    clearFilters() {
        this.setState('ui.filters', {});
    }
    
    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        const collapsed = this.getState('ui.sidebarCollapsed');
        this.setState('ui.sidebarCollapsed', !collapsed);
    }
    
    // =========================================================================
    // ANALYTICS STATE HELPERS
    // =========================================================================
    
    /**
     * Set analytics stats
     */
    setAnalyticsStats(stats) {
        this.setState('analytics.stats', stats);
    }
    
    /**
     * Get analytics stats
     */
    getAnalyticsStats() {
        return this.getState('analytics.stats') || {};
    }
    
    // =========================================================================
    // PERSISTENCE
    // =========================================================================
    
    /**
     * Save state to localStorage
     * @param {Array} paths - Paths to save (default: all)
     */
    saveToLocalStorage(paths = ['ui.filters', 'ui.sidebarCollapsed']) {
        try {
            paths.forEach(path => {
                const value = this.getState(path);
                const key = `oslira-state-${path}`;
                localStorage.setItem(key, JSON.stringify(value));
            });
            
            this.logger.debug('[StateManager] State saved to localStorage', { paths });
        } catch (error) {
            this.logger.error('[StateManager] Save to localStorage failed', error);
        }
    }
    
    /**
     * Load state from localStorage
     * @param {Array} paths - Paths to load
     */
    loadFromLocalStorage(paths = ['ui.filters', 'ui.sidebarCollapsed']) {
        try {
            paths.forEach(path => {
                const key = `oslira-state-${path}`;
                const stored = localStorage.getItem(key);
                
                if (stored) {
                    const value = JSON.parse(stored);
                    this.setState(path, value);
                }
            });
            
            this.logger.debug('[StateManager] State loaded from localStorage', { paths });
        } catch (error) {
            this.logger.error('[StateManager] Load from localStorage failed', error);
        }
    }
    
    /**
     * Clear persisted state
     */
    clearPersistedState() {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('oslira-state-'));
            keys.forEach(key => localStorage.removeItem(key));
            
            this.logger.debug('[StateManager] Persisted state cleared');
        } catch (error) {
            this.logger.error('[StateManager] Clear persisted state failed', error);
        }
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate state structure
     * @returns {Object} Validation result
     */
    validateState() {
        const errors = [];
        
        const requiredPaths = [
            'auth.user',
            'business.all',
            'leads.all',
            'ui.loading'
        ];
        
        requiredPaths.forEach(path => {
            if (this.getState(path) === undefined) {
                errors.push(`Missing required state: ${path}`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Get current state snapshot
     */
    getStateSnapshot() {
        return this.store.getState('');
    }
    
    /**
     * Debug info
     */
    debug() {
        console.group('🎯 [StateManager] Debug Info');
        console.log('Initialized:', this.isInitialized);
        console.log('Computed state count:', this.computedState.size);
        console.log('Current state:', this.getStateSnapshot());
        console.log('Validation:', this.validateState());
        console.groupEnd();
    }
    
    /**
     * Get stats
     */
    getStats() {
        const state = this.getStateSnapshot();
        
        return {
            isInitialized: this.isInitialized,
            computedStateCount: this.computedState.size,
            leadCount: this.getLeads().length,
            businessCount: this.getBusinesses().length,
            selectedLeadCount: this.getSelectedLeads().length,
            isAuthenticated: this.isAuthenticated(),
            isLoading: this.isLoading()
        };
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    destroy() {
        this.computedState.clear();
        this.isInitialized = false;
        this.logger.info('[StateManager] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================

// Create singleton instance (requires Store and Logger)
const store = window.OsliraStore;
const logger = window.OsliraLogger;
const instance = new StateManager(store, logger);

// Export to window
window.OsliraStateManager = instance;

console.log('✅ [StateManager] Loaded and ready');

// Register with Coordinator immediately (Pattern A)
if (window.Oslira?.init) {
    window.Oslira.init.register('StateManager', instance);
    console.log('📋 [StateManager] Registered with Coordinator');
}
