//public/pages/dashboard/modules/core/dashboard-app.js

/**
 * DASHBOARD APP - Clean Modern Implementation
 * Main orchestrator using modular components
 */
class DashboardApp {
    constructor() {
        this.container = null;
        this.initialized = false;
        this.initStartTime = Date.now();
        
        console.log('🚀 [DashboardApp] Starting initialization...');
    }
    
    /**
     * Main initialization method
     */
    async init() {
        try {
            if (this.initialized) {
                console.log('⚠️ [DashboardApp] Already initialized');
                return;
            }
            
            console.log('🔧 [DashboardApp] Setting up dependency container...');
            
            // Create and setup dependency container
            this.container = this.setupDependencyContainer();
            
            // Validate container setup
            const validation = this.container.validate();
            if (!validation.valid) {
                throw new Error('Dependency validation failed: ' + JSON.stringify(validation.issues));
            }
            
// Use DashboardCore for initialization
await DashboardCore.initialize(this.container);

// Sync business to OsliraAuth after initialization
const businessManager = this.container.get('businessManager');
const currentBusiness = businessManager.getCurrentBusiness();
if (currentBusiness && window.OsliraAuth) {
    window.OsliraAuth.business = currentBusiness;
    console.log('✅ [DashboardApp] Business synced to OsliraAuth:', currentBusiness.business_name);
}

// Setup event system
DashboardEventSystem.setupHandlers(
                this.container.get('eventBus'),
                this.container
            );
            
            // Expose for debugging and external access
            this.exposePublicAPI();
            
            this.initialized = true;
            
            const initTime = Date.now() - this.initStartTime;
            console.log(`✅ [DashboardApp] Initialization completed in ${initTime}ms`);
            
            // Emit initialization complete event
            this.container.get('eventBus').emit(window.DASHBOARD_EVENTS.INIT_COMPLETE, {
                initTime,
                moduleCount: this.container.list().length
            });
            
        } catch (error) {
            console.error('❌ [DashboardApp] Initialization failed:', error);
            DashboardErrorSystem.handleInitializationError(error);
            throw error;
        }
    }
    
    /**
     * Setup dependency container with all required services
     */
setupDependencyContainer() {
    const container = new DependencyContainer();
    
    // Register core infrastructure
    console.log('📋 [DashboardApp] Registering core dependencies...');
    container.registerSingleton('eventBus', new DashboardEventBus());

    // Analysis Functions - async factory with readiness check
    container.registerFactory('analysisFunctions', async () => {
        await window.DependencyReadiness.waitForDependency('AnalysisFunctions');
        const instance = new window.AnalysisFunctions(container);
        if (typeof instance.init === 'function') {
            instance.init();
        }
        return instance;
    });
    
    // State Manager - with dependency on eventBus
    container.registerFactory('stateManager', async (eventBus) => {
        await window.DependencyReadiness.waitForDependency('DashboardStateManager');
        return new window.DashboardStateManager(eventBus);
    }, ['eventBus']);

    // Register OsliraAuth as direct reference
    container.registerSingleton('osliraAuth', window.OsliraAuth);
    
    // Register feature modules (DEDUPLICATED)
    console.log('📋 [DashboardApp] Registering feature modules...');
    
    container.registerFactory('leadManager', async () => {
        await window.DependencyReadiness.waitForDependency('LeadManager');
        return new window.LeadManager(container);
    }, []);
    
    container.registerFactory('realtimeManager', async () => {
        await window.DependencyReadiness.waitForDependency('RealtimeManager');
        return new window.RealtimeManager(container);
    }, []);

    container.registerFactory('businessManager', async () => {
        await window.DependencyReadiness.waitForDependency('BusinessManager');
        return new window.BusinessManager(container);
    }, []);

    container.registerFactory('modalManager', async () => {
        await window.DependencyReadiness.waitForDependency('ModalManager');
        return new window.ModalManager(container);
    }, []);

    container.registerFactory('researchHandlers', async () => {
        await window.DependencyReadiness.waitForDependency('ResearchHandlers');
        return new window.ResearchHandlers();
    }, []);

    container.registerFactory('analysisQueue', async () => {
        await window.DependencyReadiness.waitForDependency('AnalysisQueue');
        return new window.AnalysisQueue(container);
    }, []);

    container.registerFactory('leadRenderer', async () => {
        await window.DependencyReadiness.waitForDependency('LeadRenderer');
        return new window.LeadRenderer(container);
    }, []);

    container.registerFactory('statsCalculator', async () => {
        await window.DependencyReadiness.waitForDependency('StatsCalculator');
        return new window.StatsCalculator(container);
    }, []);

    // Register UI components
    container.registerFactory('dashboardHeader', async () => {
        await window.DependencyReadiness.waitForDependency('DashboardHeader');
        return new window.DashboardHeader(container);
    });

    container.registerFactory('statsCards', async () => {
        await window.DependencyReadiness.waitForDependency('StatsCards');
        const instance = new window.StatsCards(container);
        if (instance.init) instance.init();
        return instance;
    });

    container.registerFactory('leadsTable', async () => {
        await window.DependencyReadiness.waitForDependency('LeadsTable');
        return new window.LeadsTable(container);
    });
    
    container.registerFactory('insightsPanel', async () => {
        await window.DependencyReadiness.waitForDependency('InsightsPanel');
        return new window.InsightsPanel(container);
    });
    
    console.log('✅ [DashboardApp] All dependencies registered');
    return container;
}
    
    /**
     * Expose public API for external access
     */
    exposePublicAPI() {
        // Expose instance globally
        window.DashboardApp = window.DashboardApp || {};
        window.DashboardApp.instance = this;
        
        // Expose managers for direct access (clean way)
        window.DashboardManagers = {
            lead: this.container.get('leadManager'),
            analysis: this.container.get('analysisQueue'),
            modal: this.container.get('modalManager'),
            business: this.container.get('businessManager'),
            realtime: this.container.get('realtimeManager'),
            stats: this.container.get('statsCalculator'),
            state: this.container.get('stateManager'),
            events: this.container.get('eventBus')
        };
        
        // Expose utility methods
        window.DashboardAPI = {
            refreshData: () => this.refreshLeads(),
            getState: (key) => this.container.get('stateManager').getState(key),
            setState: (key, value) => this.container.get('stateManager').setState(key, value),
            emit: (event, data) => this.container.get('eventBus').emit(event, data),
            getManager: (name) => this.container.get(name)
        };
        
        console.log('✅ [DashboardApp] Public API exposed');
    }
    
    /**
     * Public method to refresh dashboard data
     */
    async refreshLeads() {
        console.log('🔄 [DashboardApp] Refreshing leads...');
        
        try {
            if (!this.initialized) {
                console.warn('⚠️ [DashboardApp] Not initialized, attempting recovery...');
                await this.init();
            }
            
            const leadManager = this.container.get('leadManager');
            await leadManager.loadDashboardData();
            
            const statsCalculator = this.container.get('statsCalculator');
            await statsCalculator.refreshStats();
            
            const eventBus = this.container.get('eventBus');
            eventBus.emit(window.DASHBOARD_EVENTS.DATA_REFRESH, {
                source: 'manual',
                timestamp: Date.now()
            });
            
            console.log('✅ [DashboardApp] Leads refreshed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ [DashboardApp] Failed to refresh leads:', error);
            DashboardErrorSystem.handleRuntimeError(error, { context: 'refreshLeads' });
            return false;
        }
    }
    
    /**
     * Get dashboard statistics
     */
    getStats() {
        try {
            const stateManager = this.container.get('stateManager');
            return {
                totalLeads: stateManager.getState('leads')?.length || 0,
                filteredLeads: stateManager.getState('filteredLeads')?.length || 0,
                selectedLeads: stateManager.getState('selectedLeads')?.size || 0,
                isLoading: stateManager.getState('isLoading') || false,
                connectionStatus: stateManager.getState('connectionStatus') || 'disconnected'
            };
        } catch (error) {
            console.error('❌ [DashboardApp] Failed to get stats:', error);
            return {};
        }
    }
    
    /**
     * Check if dashboard is ready
     */
    isReady() {
        return this.initialized && this.container && window.osliraAuth?.user;
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        try {
            return this.container.get('osliraAuth').user;
        } catch (error) {
            console.error('❌ [DashboardApp] Failed to get current user:', error);
            return null;
        }
    }
    
    /**
     * Cleanup dashboard
     */
    async cleanup() {
        console.log('🧹 [DashboardApp] Starting cleanup...');
        
        try {
            if (this.container) {
                await this.container.cleanup();
            }
            
            // Clear global references
            delete window.DashboardApp.instance;
            delete window.DashboardManagers;
            delete window.DashboardAPI;
            
            this.initialized = false;
            console.log('✅ [DashboardApp] Cleanup completed');
            
        } catch (error) {
            console.error('❌ [DashboardApp] Cleanup failed:', error);
        }
    }
    
    /**
     * Debug information
     */
    debug() {
        if (!this.initialized) {
            return { status: 'not_initialized' };
        }
        
        return {
            initialized: this.initialized,
            initTime: Date.now() - this.initStartTime,
            container: !!this.container,
            modules: this.container ? this.container.list() : [],
            stats: this.getStats(),
            user: this.getCurrentUser()?.email,
            events: this.container ? this.container.get('eventBus').getListeners() : {}
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardApp };
} else {
    window.DashboardApp = DashboardApp;
}
