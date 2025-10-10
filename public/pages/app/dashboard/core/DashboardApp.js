// =============================================================================
// DASHBOARD APP - Refactored to use Core DI System
// Path: /public/pages/app/dashboard/core/DashboardApp.js
// =============================================================================

/**
 * @class DashboardApp
 * @description Dashboard orchestrator using Core DI system
 * 
 * Uses window.OsliraContainer (NOT window.DependencyContainer)
 */
class DashboardApp {
    constructor() {
        this.initialized = false;
        this.initStartTime = Date.now();
        this.initializationPromise = null;
        
        console.log('🚀 [DashboardApp] Starting initialization...');
    }
    
    /**
     * Main initialization
     */
    async init() {
        if (this.initializationPromise) {
            console.log('⏳ [DashboardApp] Initialization in progress...');
            return this.initializationPromise;
        }
        
        if (this.initialized) {
            console.log('✅ [DashboardApp] Already initialized');
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
    
// =============================================================================
// DASHBOARD APP - Fixed Auth Check
// Path: /public/pages/app/dashboard/core/DashboardApp.js
// =============================================================================

async _performInitialization() {
    try {
        console.log('🔧 [DashboardApp] Setting up dashboard...');
        
        this.validateDependencies();
        
        // ✅ CRITICAL FIX: Initialize Auth AND wait for session
        console.log('🔐 [DashboardApp] Initializing authentication...');
        if (window.OsliraAuth && !window.OsliraAuth.initialized) {
            await window.OsliraAuth.initialize();
            console.log('✅ [DashboardApp] Auth initialized');
        }
        
        // ✅ CRITICAL FIX: Wait for session to be restored from localStorage
        console.log('🔐 [DashboardApp] Waiting for session restoration...');
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!window.OsliraAuth?.user && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
            // Check if we have a stored session but user isn't populated yet
            const storedSession = localStorage.getItem('oslira-auth');
            if (storedSession && window.OsliraAuth?.supabase) {
                console.log('🔄 [DashboardApp] Found stored session, checking validity...');
                const { data } = await window.OsliraAuth.supabase.auth.getSession();
                if (data?.session?.user) {
                    window.OsliraAuth.user = data.session.user;
                    window.OsliraAuth.session = data.session;
                    console.log('✅ [DashboardApp] Session restored from storage');
                    break;
                }
            }
        }
        
        // Now check if user is authenticated
        if (!window.OsliraAuth?.user) {
            console.warn('⚠️ [DashboardApp] No authenticated user after wait, redirecting...');
            
            // Save current URL for return after login
            const returnUrl = encodeURIComponent(window.location.href);
            const authUrl = `${window.OsliraEnv.getAuthUrl()}?return_to=${returnUrl}`;
            
            window.location.href = authUrl;
            return;
        }
        
        console.log('✅ [DashboardApp] User authenticated:', window.OsliraAuth.user.email);
        
        // Step 2: Initialize sidebar
        console.log('🔧 [DashboardApp] Initializing sidebar...');
        const sidebar = new window.SidebarManager();
        await sidebar.render('#sidebar-container');
        
        // Step 3: Load business profiles
        console.log('🏢 [DashboardApp] Loading businesses...');
        const businessManager = new window.BusinessManager();
        await businessManager.loadBusinesses();
        
        // Sync business to OsliraAuth
        const currentBusiness = businessManager.getCurrentBusiness();
        if (currentBusiness && window.OsliraAuth) {
            window.OsliraAuth.business = currentBusiness;
            console.log('✅ [DashboardApp] Business synced:', currentBusiness.business_name);
        }
        
        // Step 4: Initialize managers
        console.log('📊 [DashboardApp] Initializing managers...');
        const leadManager = new window.LeadManager();
        const modalManager = new window.ModalManager();
        
        // Step 5: Render dashboard UI
        console.log('🎨 [DashboardApp] Rendering dashboard UI...');
        await this.renderDashboardUI();
        
        // Step 6: Load lead data
        console.log('📊 [DashboardApp] Loading lead data...');
        await leadManager.loadDashboardData();
        
        // Step 7: Setup event handlers
        console.log('📡 [DashboardApp] Setting up event handlers...');
        if (window.DashboardEventSystem) {
            window.DashboardEventSystem.setupHandlers(
                window.OsliraEventBus,
                this
            );
        }
        
        // Step 8: Expose public API
        this.exposePublicAPI();
        
        // Complete
        this.initialized = true;
        const initTime = Date.now() - this.initStartTime;
        
        // Make page visible
        document.body.style.visibility = 'visible';
        
        console.log(`✅ [DashboardApp] Initialized in ${initTime}ms`);
        
        // Emit completion event
        window.EventBus.emit('DASHBOARD_INIT_COMPLETE', { initTime });
        
    } catch (error) {
        console.error('❌ [DashboardApp] Initialization failed:', error);
        window.OsliraErrorHandler.handleError(error, { 
            context: 'dashboard_init',
            fatal: true 
        });
        throw error;
    }
}
    
    /**
     * Validate all required dependencies exist
     */
    validateDependencies() {
        const required = [
            'OsliraEventBus',
            'OsliraStateManager',
            'OsliraErrorHandler',
            'OsliraAuth',
            'LeadManager',
            'BusinessManager',
            'ModalManager',
            'SidebarManager'
        ];
        
        const missing = required.filter(dep => !window[dep]);
        
        if (missing.length > 0) {
            throw new Error(`Missing dependencies: ${missing.join(', ')}`);
        }
        
        console.log('✅ [DashboardApp] All dependencies validated');
    }
    
    /**
     * Render dashboard UI components
     */
    async renderDashboardUI() {
        try {
            // Header
            if (window.DashboardHeader) {
                const dashboardHeader = new window.DashboardHeader();
                const headerElement = document.getElementById('dashboard-header');
                if (headerElement && dashboardHeader.renderHeader) {
                    headerElement.innerHTML = dashboardHeader.renderHeader();
                }
            }
            
            // Stats Cards
            if (window.StatsCards) {
                const statsCards = new window.StatsCards();
                
                const priorityCardsEl = document.getElementById('priority-cards');
                if (priorityCardsEl && statsCards.renderPriorityCards) {
                    priorityCardsEl.innerHTML = statsCards.renderPriorityCards();
                }
                
                const metricsEl = document.getElementById('performance-metrics');
                if (metricsEl && statsCards.renderPerformanceMetrics) {
                    metricsEl.innerHTML = statsCards.renderPerformanceMetrics();
                }
            }
            
            // Leads Table
            if (window.LeadsTable) {
                const leadsTable = new window.LeadsTable();
                const tableEl = document.getElementById('leads-table-container');
                if (tableEl && leadsTable.render) {
                    tableEl.innerHTML = leadsTable.render();
                }
            }
            
            console.log('✅ [DashboardApp] UI components rendered');
            
        } catch (error) {
            console.error('❌ [DashboardApp] Failed to render UI:', error);
            throw error;
        }
    }
    
    /**
     * Expose public API
     */
    exposePublicAPI() {
        window.dashboard = this;
        
        // Global refresh function
        window.refreshLeadsTable = async () => {
            if (window.LeadManager) {
                const leadManager = new window.LeadManager();
                await leadManager.loadDashboardData();
            }
        };
        
        console.log('✅ [DashboardApp] Public API exposed');
    }
    
    /**
     * Get dashboard stats
     */
    getStats() {
        try {
            const stateManager = window.StateManager;
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
        return this.initialized && window.OsliraAuth?.user;
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return window.OsliraAuth?.user || null;
    }
    
    /**
     * Cleanup
     */
    async cleanup() {
        console.log('🧹 [DashboardApp] Cleaning up...');
        
        try {
            delete window.dashboard;
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
            stats: this.getStats(),
            user: this.getCurrentUser()?.email
        };
    }
}

// Initialize when scripts loaded
window.addEventListener('oslira:scripts:loaded', async () => {
    console.log('🎯 [DashboardApp] Scripts loaded, starting initialization...');
    
    try {
        const app = new DashboardApp();
        await app.init();
    } catch (error) {
        console.error('❌ [DashboardApp] Fatal initialization error:', error);
        window.ErrorHandler.handleError(error, { 
            context: 'dashboard_bootstrap',
            fatal: true 
        });
    }
});

// Export
window.DashboardApp = DashboardApp;
