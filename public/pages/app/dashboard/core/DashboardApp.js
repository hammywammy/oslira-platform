// public/pages/app/dashboard/core/DashboardApp.js

/**
 * DASHBOARD APP - Core Orchestrator
 * 
 * PURPOSE: Dashboard-specific initialization and coordination
 * DEPENDENCIES: All Core services via window.Oslira*
 * 
 * This file ONLY handles:
 * 1. Dashboard module registration
 * 2. Dashboard-specific initialization sequence
 * 3. Business logic coordination
 * 
 * Core handles: Auth, EventBus, State, DI Container, HTTP, Errors
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
     * Main initialization - called by Core Loader after scripts load
     */
    async init() {
        // Prevent duplicate initialization
        if (this.initializationPromise) {
            console.log('⏳ [DashboardApp] Initialization in progress...');
            return this.initializationPromise;
        }
        
        if (this.initialized) {
            console.log('✅ [DashboardApp] Already initialized');
            return true;
        }
        
        // Start initialization
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
            console.log('🔧 [DashboardApp] Setting up dashboard...');
            
            // Step 1: Setup dependency container with Core services
            this.container = this.setupDependencyContainer();
            
            // Step 2: Validate container
            const validation = this.container.validate();
            if (!validation.valid) {
                console.error('❌ [DashboardApp] Validation failed:', validation.issues);
                throw new Error('Dependency validation failed: ' + JSON.stringify(validation.issues));
            }
            
            console.log('✅ [DashboardApp] Container validated');
            
            // Step 3: Pre-resolve async dependencies
            await this.preResolveAsyncDependencies();
            
            // Step 4: Initialize all modules
            console.log('🔄 [DashboardApp] Initializing modules...');
            await this.container.initialize();
            
            // Step 5: Initialize sidebar
            console.log('🔧 [DashboardApp] Initializing sidebar...');
            const sidebar = new window.SidebarManager();
            await sidebar.render('#sidebar-container');
            
            // Step 6: Load business profiles
            console.log('🏢 [DashboardApp] Loading businesses...');
            const businessManager = this.container.get('businessManager');
            await businessManager.loadBusinesses();
            
            // Sync business to OsliraAuth
            const currentBusiness = businessManager.getCurrentBusiness();
            if (currentBusiness && window.OsliraAuth) {
                window.OsliraAuth.business = currentBusiness;
                console.log('✅ [DashboardApp] Business synced:', currentBusiness.business_name);
            }
            
            // Step 7: Render dashboard UI
            console.log('🎨 [DashboardApp] Rendering dashboard UI...');
            await this.renderDashboardUI();
            
            // Step 8: Initialize components that need DOM
            await this.initializeComponents();
            
            // Step 9: Populate modals
            await this.populateModals();
            
            // Step 10: Load lead data
            console.log('📊 [DashboardApp] Loading lead data...');
            const leadManager = this.container.get('leadManager');
            await leadManager.loadDashboardData();
            
            // Step 11: Setup event handlers
            console.log('📡 [DashboardApp] Setting up event handlers...');
            DashboardEventSystem.setupHandlers(
                this.container.get('eventBus'),
                this.container
            );
            
            // Step 12: Setup filter and selection handlers
            await this.setupHandlers();
            
            // Step 13: Expose public API
            this.exposePublicAPI();
            
            // Complete initialization
            this.initialized = true;
            const initTime = Date.now() - this.initStartTime;
            
            // Make page visible
            document.body.style.visibility = 'visible';
            
            console.log(`✅ [DashboardApp] Initialized in ${initTime}ms`);
            
            // Emit completion event
            this.container.get('eventBus').emit(window.DASHBOARD_EVENTS.INIT_COMPLETE, {
                initTime,
                moduleCount: this.container.list().length
            });
            
        } catch (error) {
            console.error('❌ [DashboardApp] Initialization failed:', error);
            window.OsliraErrorHandler.handle(error, { 
                context: 'dashboard_init',
                fatal: true 
            });
            throw error;
        }
    }
    
    /**
     * Setup dependency container - registers all dashboard modules
     * Uses CORE services (not dashboard duplicates)
     */
    setupDependencyContainer() {
        // Use Core's DependencyContainer
        const container = new window.OsliraDependencyContainer();
        
        console.log('📋 [DashboardApp] Registering Core services...');
        
        // =====================================================================
        // CORE SERVICES - Use from window.Oslira*
        // =====================================================================
        
        container.registerSingleton('eventBus', window.OsliraEventBus);
        container.registerSingleton('stateManager', window.OsliraState);
        container.registerSingleton('errorHandler', window.OsliraErrorHandler);
        container.registerSingleton('logger', window.OsliraLogger);
        container.registerSingleton('http', window.OsliraHttp);
        
        // Auth & Database
        container.registerSingleton('osliraAuth', window.OsliraAuth);
        container.registerSingleton('supabase', window.OsliraAuth.supabase);
        
        console.log('📋 [DashboardApp] Registering dashboard modules...');
        
        // =====================================================================
        // DASHBOARD DOMAIN MODULES
        // =====================================================================
        
        container.registerFactory('leadManager', () => {
            if (!window.LeadManager) throw new Error('LeadManager not loaded');
            return new window.LeadManager(container);
        }, []);
        
        container.registerFactory('businessManager', () => {
            if (!window.BusinessManager) throw new Error('BusinessManager not loaded');
            return new window.BusinessManager(container);
        }, []);
        
        container.registerFactory('statsCalculator', () => {
            if (!window.StatsCalculator) throw new Error('StatsCalculator not loaded');
            return new window.StatsCalculator(container);
        }, []);
        
        container.registerFactory('leadRenderer', () => {
            if (!window.LeadRenderer) throw new Error('LeadRenderer not loaded');
            return new window.LeadRenderer(container);
        }, []);
        
        // =====================================================================
        // ANALYSIS SYSTEM
        // =====================================================================
        
        container.registerFactory('analysisQueue', () => {
            if (!window.AnalysisQueue) throw new Error('AnalysisQueue not loaded');
            return new window.AnalysisQueue(container);
        }, []);
        
        container.registerFactory('analysisFunctions', () => {
            if (!window.AnalysisFunctions) throw new Error('AnalysisFunctions not loaded');
            return new window.AnalysisFunctions(container);
        }, []);
        
        // =====================================================================
        // INFRASTRUCTURE
        // =====================================================================
        
        container.registerFactory('realtimeManager', () => {
            if (!window.RealtimeManager) throw new Error('RealtimeManager not loaded');
            return new window.RealtimeManager(container);
        }, []);
        
        container.registerFactory('modalManager', () => {
            if (!window.ModalManager) throw new Error('ModalManager not loaded');
            return new window.ModalManager(container);
        }, []);
        
        // =====================================================================
        // HANDLERS
        // =====================================================================
        
        container.registerFactory('researchHandlers', () => {
            if (!window.ResearchHandlers) throw new Error('ResearchHandlers not loaded');
            return new window.ResearchHandlers();
        }, []);
        
        // =====================================================================
        // UI COMPONENTS
        // =====================================================================
        
        container.registerFactory('dashboardHeader', () => {
            if (!window.DashboardHeader) throw new Error('DashboardHeader not loaded');
            return new window.DashboardHeader(container);
        }, []);
        
        container.registerFactory('statsCards', () => {
            if (!window.StatsCards) throw new Error('StatsCards not loaded');
            return new window.StatsCards(container);
        }, []);
        
        container.registerFactory('leadsTable', () => {
            if (!window.LeadsTable) throw new Error('LeadsTable not loaded');
            return new window.LeadsTable(container);
        }, []);
        
        container.registerFactory('insightsPanel', () => {
            if (!window.InsightsPanel) throw new Error('InsightsPanel not loaded');
            return new window.InsightsPanel(container);
        }, []);
        
        container.registerFactory('tipOfDay', () => {
            if (!window.TipOfDay) throw new Error('TipOfDay not loaded');
            return new window.TipOfDay(container);
        }, []);
        
        console.log('✅ [DashboardApp] All dependencies registered');
        return container;
    }
    
    /**
     * Pre-resolve async dependencies
     * (Moved from DashboardCore.js)
     */
    async preResolveAsyncDependencies() {
        console.log('🔄 [DashboardApp] Resolving async dependencies...');
        
        // Resolve AnalysisFunctions
        const analysisFunctions = await this.container.getAsync('analysisFunctions');
        this.container.registerSingleton('analysisFunctions', analysisFunctions);
        
        console.log('✅ [DashboardApp] Async dependencies resolved');
    }
    
    /**
     * Render dashboard UI components
     * (Moved from DashboardCore.js)
     */
    async renderDashboardUI() {
        try {
            // Header
            const dashboardHeader = this.container.get('dashboardHeader');
            if (dashboardHeader && dashboardHeader.renderHeader) {
                document.getElementById('dashboard-header').innerHTML = dashboardHeader.renderHeader();
            }
            
            // Stats Cards
            const statsCards = this.container.get('statsCards');
            if (statsCards) {
                if (statsCards.renderPriorityCards) {
                    document.getElementById('priority-cards').innerHTML = statsCards.renderPriorityCards();
                }
                if (statsCards.renderPerformanceMetrics) {
                    document.getElementById('performance-metrics').innerHTML = statsCards.renderPerformanceMetrics();
                }
            }
            
            // Leads Table
            const leadsTable = this.container.get('leadsTable');
            if (leadsTable && leadsTable.renderTableContainer) {
                const leadsSection = document.getElementById('leads-section');
                if (leadsSection) {
                    leadsSection.innerHTML = leadsTable.renderTableContainer();
                    if (leadsTable.setupRefreshButton) {
                        leadsTable.setupRefreshButton();
                    }
                }
            }
            
            // Insights Panel
            const insightsPanel = this.container.get('insightsPanel');
            if (insightsPanel && insightsPanel.renderInsightsPanel) {
                document.getElementById('insights-panel').innerHTML = insightsPanel.renderInsightsPanel();
            }
            
            // Tip of Day
            const tipOfDay = this.container.get('tipOfDay');
            if (tipOfDay && tipOfDay.renderTip) {
                document.getElementById('tip-of-day').innerHTML = tipOfDay.renderTip();
                window.tipOfDay = tipOfDay;
            }
            
            // Initialize feather icons
            if (window.feather) {
                window.feather.replace();
            }
            
            console.log('✅ [DashboardApp] UI rendered');
            
        } catch (error) {
            console.error('❌ [DashboardApp] UI rendering failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize components that need DOM elements
     */
    async initializeComponents() {
        console.log('🔧 [DashboardApp] Initializing components...');
        
        // Dashboard Header
        const dashboardHeader = this.container.get('dashboardHeader');
        if (dashboardHeader && !dashboardHeader.initialized) {
            await dashboardHeader.initialize();
            console.log('✅ [DashboardApp] DashboardHeader initialized');
        }
        
        // Lead Renderer
        const leadRenderer = this.container.get('leadRenderer');
        if (leadRenderer && !leadRenderer.initialized) {
            leadRenderer.init();
            leadRenderer.initialized = true;
            console.log('✅ [DashboardApp] LeadRenderer initialized');
        }
    }
    
    /**
     * Populate modal HTML
     */
    async populateModals() {
        console.log('🔧 [DashboardApp] Populating modals...');
        
        // Research Modal
        if (window.ResearchModal) {
            const researchModal = new window.ResearchModal(this.container);
            const modalHTML = researchModal.renderModal();
            const modalContainer = document.getElementById('researchModal');
            if (modalContainer) {
                modalContainer.outerHTML = modalHTML;
                console.log('✅ [DashboardApp] ResearchModal populated');
            }
        }
        
        // Bulk Modal
        if (window.BulkModal) {
            const bulkModal = new window.BulkModal(this.container);
            const modalHTML = bulkModal.renderBulkModal();
            const modalContainer = document.getElementById('bulkModal');
            if (modalContainer) {
                modalContainer.innerHTML = modalHTML;
                bulkModal.setupEventHandlers();
                console.log('✅ [DashboardApp] BulkModal populated');
            }
        }
        
        // Filter Modal
        if (window.FilterModal) {
            const filterModal = new window.FilterModal(this.container);
            const modalHTML = filterModal.renderModal();
            const modalContainer = document.getElementById('filter-modal-container');
            if (modalContainer) {
                modalContainer.innerHTML = modalHTML;
                filterModal.setupEventHandlers();
                console.log('✅ [DashboardApp] FilterModal populated');
            }
        }
    }
    
    /**
     * Setup event handlers after data is loaded
     */
    async setupHandlers() {
        console.log('🔧 [DashboardApp] Setting up handlers...');
        
        const leadsTable = this.container.get('leadsTable');
        
        // Filter handlers
        if (leadsTable && leadsTable.setupFilterHandlers) {
            leadsTable.setupFilterHandlers();
            console.log('✅ [DashboardApp] Filter handlers initialized');
        }
        
        // Selection handlers
        if (leadsTable && leadsTable.setupSelectionHandlers) {
            leadsTable.setupSelectionHandlers();
            console.log('✅ [DashboardApp] Selection handlers initialized');
        }
        
        // Event handlers (toolbar buttons, etc.)
        if (leadsTable && leadsTable.setupEventHandlers) {
            leadsTable.setupEventHandlers();
            console.log('✅ [DashboardApp] Event handlers initialized');
        }
    }
    
    /**
     * Expose public API for global access
     */
    exposePublicAPI() {
        // Expose instance
        window.dashboard = this;
        
        // Expose managers
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
        
        // Expose API methods
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
                console.warn('⚠️ [DashboardApp] Not initialized yet');
                return false;
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
            
            console.log('✅ [DashboardApp] Leads refreshed');
            return true;
            
        } catch (error) {
            console.error('❌ [DashboardApp] Refresh failed:', error);
            window.OsliraErrorHandler.handle(error, { context: 'refreshLeads' });
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
            return null;
        }
    }
    
    /**
     * Cleanup dashboard
     */
    async cleanup() {
        console.log('🧹 [DashboardApp] Cleaning up...');
        
        try {
            if (this.container) {
                await this.container.cleanup();
            }
            
            delete window.dashboard;
            delete window.DashboardManagers;
            delete window.DashboardAPI;
            delete window.refreshLeadsTable;
            
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

// Initialize when Core Loader fires the event
window.addEventListener('oslira:scripts:loaded', async () => {
    console.log('🎯 [DashboardApp] Scripts loaded, starting initialization...');
    
    try {
        const app = new DashboardApp();
        await app.init();
    } catch (error) {
        console.error('❌ [DashboardApp] Fatal initialization error:', error);
        window.OsliraErrorHandler.handle(error, { 
            context: 'dashboard_bootstrap',
            fatal: true 
        });
    }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardApp };
} else {
    window.DashboardApp = DashboardApp;
}
