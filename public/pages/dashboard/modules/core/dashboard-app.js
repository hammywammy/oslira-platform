//public/pages/dashboard/modules/core/dashboard-app.js

/**
 * DASHBOARD APP - Production-Grade Initialization System
 * Handles dependency injection, parallel loading, and graceful failure recovery
 * Designed to work with script-loader.js parallel loading architecture
 */
class DashboardApp {
    constructor() {
        this.container = null;
        this.initialized = false;
        this.initStartTime = Date.now();
        this.initializationPromise = null;
        
        console.log('🚀 [DashboardApp] Starting initialization...');
    }
    
    /**
     * Main initialization method with idempotent protection
     */
    async init() {
        // Prevent multiple simultaneous initializations
        if (this.initializationPromise) {
            console.log('⏳ [DashboardApp] Initialization already in progress, waiting...');
            return this.initializationPromise;
        }
        
        if (this.initialized) {
            console.log('⚠️ [DashboardApp] Already initialized');
            return true;
        }
        
        this.initializationPromise = this._performInitialization();
        
        try {
            await this.initializationPromise;
            return true;
        } catch (error) {
            this.initializationPromise = null;
            throw error;
        }
    }
    
    /**
     * Internal initialization logic
     */
    async _performInitialization() {
        try {
            console.log('🔧 [DashboardApp] Setting up dependency container...');
            
            // Create and setup dependency container
            this.container = this.setupDependencyContainer();
            
            // Validate container setup
            const validation = this.container.validate();
            if (!validation.valid) {
                console.error('❌ [DashboardApp] Dependency validation failed:', validation.issues);
                throw new Error('Dependency validation failed: ' + JSON.stringify(validation.issues));
            }
            
            console.log('✅ [DashboardApp] Dependency validation passed');
            
            // Use DashboardCore for initialization (handles all async resolution)
            await DashboardCore.initialize(this.container);
            
            // Sync business to OsliraAuth after initialization
            const businessManager = this.container.get('businessManager');
            const currentBusiness = businessManager.getCurrentBusiness();
            if (currentBusiness && window.OsliraAuth) {
                window.OsliraAuth.business = currentBusiness;
                console.log('✅ [DashboardApp] Business synced to OsliraAuth:', currentBusiness.business_name);
            }
            
            // Setup event system
            console.log('📡 [DashboardApp] Setting up event handlers...');
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
     * Uses DependencyReadiness to handle parallel script loading
     */
    setupDependencyContainer() {
        const container = new DependencyContainer();
        
        // =========================================================================
        // CORE INFRASTRUCTURE - Singletons
        // =========================================================================
        console.log('📋 [DashboardApp] Registering core dependencies...');
        
        // EventBus - Pure singleton, no dependencies
        container.registerSingleton('eventBus', new DashboardEventBus());
        
        // StateManager - Depends on eventBus, must wait for class
        container.registerFactory('stateManager', (eventBus) => {
            // Synchronous check - class should be loaded by now
            if (!window.DashboardStateManager) {
                throw new Error('DashboardStateManager not loaded');
            }
            return new window.DashboardStateManager(eventBus);
        }, ['eventBus']);
        
        // OsliraAuth - Direct reference to global
        container.registerSingleton('osliraAuth', window.OsliraAuth);
        
        // AnalysisFunctions - Check class availability
        container.registerFactory('analysisFunctions', () => {
            if (!window.AnalysisFunctions) {
                throw new Error('AnalysisFunctions not loaded');
            }
            return new window.AnalysisFunctions(container);
        }, []);
        
        // =========================================================================
        // FEATURE MODULES - With availability checks
        // =========================================================================
        console.log('📋 [DashboardApp] Registering feature modules...');
        
        container.registerFactory('leadManager', () => {
            if (!window.LeadManager) {
                throw new Error('LeadManager not loaded');
            }
            return new window.LeadManager(container);
        }, []);
        
        container.registerFactory('realtimeManager', () => {
            if (!window.RealtimeManager) {
                throw new Error('RealtimeManager not loaded');
            }
            return new window.RealtimeManager(container);
        }, []);
        
        container.registerFactory('businessManager', () => {
            if (!window.BusinessManager) {
                throw new Error('BusinessManager not loaded');
            }
            return new window.BusinessManager(container);
        }, []);
        
        container.registerFactory('modalManager', () => {
            if (!window.ModalManager) {
                throw new Error('ModalManager not loaded');
            }
            return new window.ModalManager(container);
        }, []);
        
        container.registerFactory('researchHandlers', () => {
            if (!window.ResearchHandlers) {
                throw new Error('ResearchHandlers not loaded');
            }
            return new window.ResearchHandlers();
        }, []);
        
        container.registerFactory('analysisQueue', () => {
            if (!window.AnalysisQueue) {
                throw new Error('AnalysisQueue not loaded');
            }
            return new window.AnalysisQueue(container);
        }, []);
        
        container.registerFactory('leadRenderer', () => {
            if (!window.LeadRenderer) {
                throw new Error('LeadRenderer not loaded');
            }
            return new window.LeadRenderer(container);
        }, []);
        
        container.registerFactory('statsCalculator', () => {
            if (!window.StatsCalculator) {
                throw new Error('StatsCalculator not loaded');
            }
            return new window.StatsCalculator(container);
        }, []);
        
        // =========================================================================
        // UI COMPONENTS - With availability checks
        // =========================================================================
        console.log('📋 [DashboardApp] Registering UI components...');
        
        container.registerFactory('dashboardHeader', () => {
            if (!window.DashboardHeader) {
                throw new Error('DashboardHeader not loaded');
            }
            return new window.DashboardHeader(container);
        }, []);
        
        container.registerFactory('statsCards', () => {
            if (!window.StatsCards) {
                throw new Error('StatsCards not loaded');
            }
            return new window.StatsCards(container);
        }, []);
        
        container.registerFactory('leadsTable', () => {
            if (!window.LeadsTable) {
                throw new Error('LeadsTable not loaded');
            }
            return new window.LeadsTable(container);
        }, []);
        
        container.registerFactory('insightsPanel', () => {
            if (!window.InsightsPanel) {
                throw new Error('InsightsPanel not loaded');
            }
            return new window.InsightsPanel(container);
        }, []);
        
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
        
window.DashboardAPI = {
    refreshData: () => this.refreshLeads(),
    getState: (key) => this.container.get('stateManager').getState(key),
    setState: (key, value) => this.container.get('stateManager').setState(key, value),
    emit: (event, data) => this.container.get('eventBus').emit(event, data),
    getManager: (name) => this.container.get(name)
};

// Expose refresh function for manual button
window.refreshLeadsTable = async () => {
    const btn = document.getElementById('manual-refresh-btn');
    const icon = document.getElementById('refresh-icon');
    
    if (btn) btn.disabled = true;
    if (icon) {
        icon.style.transform = 'rotate(360deg)';
        icon.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    try {
        const leadManager = this.container.get('leadManager');
        await leadManager.refreshWithAnimation();
    } finally {
        if (btn) btn.disabled = false;
        if (icon) {
            setTimeout(() => {
                icon.style.transform = 'rotate(0deg)';
            }, 100);
        }
    }
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
        return this.initialized && this.container && window.OsliraAuth?.user;
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
            this.initializationPromise = null;
            
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
            return { 
                status: 'not_initialized',
                initializationInProgress: !!this.initializationPromise
            };
        }
        
        return {
            initialized: this.initialized,
            initTime: Date.now() - this.initStartTime,
            container: !!this.container,
            modules: this.container ? this.container.list() : [],
            stats: this.getStats(),
            user: this.getCurrentUser()?.email,
            containerStatus: this.container ? this.container.getStatus() : null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardApp };
} else {
    window.DashboardApp = DashboardApp;
}
