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
    
// ADD THIS METHOD TO DashboardApp class (around line 50, BEFORE _performInitialization)

/**
 * Check URL hash for cross-subdomain session transfer
 * This happens when redirecting from auth.oslira.com → app.oslira.com
 */
async _restoreSessionFromUrlHash() {
    console.log('🔍 [DashboardApp] Checking URL hash for session tokens...');
    
    const hash = window.location.hash;
    
    if (!hash || !hash.includes('auth=')) {
        console.log('ℹ️ [DashboardApp] No auth tokens in URL hash');
        return false;
    }
    
    try {
        // Extract token from hash
        const hashParams = new URLSearchParams(hash.substring(1));
        const authToken = hashParams.get('auth');
        
        if (!authToken) {
            console.log('ℹ️ [DashboardApp] No auth parameter in hash');
            return false;
        }
        
        console.log('🔐 [DashboardApp] Found auth token in URL hash, decoding...');
        
        // Decode URL-safe base64
        const base64 = authToken
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Add padding if needed
        const padded = base64 + '==='.slice((base64.length + 3) % 4);
        
        // Parse tokens
        const tokensJson = atob(padded);
        const tokens = JSON.parse(tokensJson);
        
        console.log('✅ [DashboardApp] Decoded session tokens');
        console.log('📊 [DashboardApp] Token expires at:', new Date(tokens.expires_at * 1000).toLocaleString());
        
        // Store in Supabase auth
        if (!window.OsliraAuth?.supabase) {
            throw new Error('Supabase client not available');
        }
        
        // Set the session in Supabase
        const { data, error } = await window.OsliraAuth.supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
        });
        
        if (error) {
            console.error('❌ [DashboardApp] Failed to set session:', error);
            throw error;
        }
        
        if (data.session) {
            // Update AuthManager state
            window.OsliraAuth.session = data.session;
            window.OsliraAuth.user = data.session.user;
            
            console.log('✅ [DashboardApp] Session restored from URL hash');
            console.log('👤 [DashboardApp] User:', data.session.user.email);
            
            // Clean up URL (remove hash)
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            console.log('🧹 [DashboardApp] Cleaned URL hash');
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ [DashboardApp] Session restoration from hash failed:', error);
        // Clean up URL even on error
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return false;
    }
}


// THEN MODIFY _performInitialization() to call this FIRST:

async _performInitialization() {
    try {
        console.log('🔧 [DashboardApp] Setting up dashboard...');
        
        this.validateDependencies();
        
        // ✅ STEP 1: Initialize Auth
        console.log('🔐 [DashboardApp] Initializing authentication...');
        if (window.OsliraAuth && !window.OsliraAuth.initialized) {
            await window.OsliraAuth.initialize();
            console.log('✅ [DashboardApp] Auth initialized');
        }
        
        // ✅ STEP 2: Check URL hash for cross-subdomain session transfer (FIRST!)
        const restoredFromHash = await this._restoreSessionFromUrlHash();
        
        if (restoredFromHash) {
            console.log('✅ [DashboardApp] Session restored from URL hash, skipping wait loop');
        } else {
            // ✅ STEP 3: Wait for session from localStorage if not in hash
            console.log('🔐 [DashboardApp] Waiting for session restoration from localStorage...');
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds total
            
            while (!window.OsliraAuth?.user && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
                
                // Check if we have a stored session
                const storedSession = localStorage.getItem('oslira-auth');
                if (storedSession && window.OsliraAuth?.supabase) {
                    console.log(`🔄 [DashboardApp] Attempt ${attempts}: Checking stored session...`);
                    
                    try {
                        const { data, error } = await window.OsliraAuth.supabase.auth.getSession();
                        
                        if (error) {
                            console.warn('⚠️ [DashboardApp] Session recovery error:', error);
                            localStorage.removeItem('oslira-auth');
                            break;
                        }
                        
                        if (data?.session?.user) {
                            window.OsliraAuth.user = data.session.user;
                            window.OsliraAuth.session = data.session;
                            console.log('✅ [DashboardApp] Session restored from localStorage');
                            break;
                        }
                    } catch (sessionError) {
                        console.warn('⚠️ [DashboardApp] Session check error:', sessionError);
                    }
                }
            }
            
            console.log(`⏱️ [DashboardApp] Session check took ${attempts * 100}ms`);
        }
        
        // ✅ STEP 4: Final auth check
        if (!window.OsliraAuth?.user) {
            console.warn('⚠️ [DashboardApp] No authenticated user after restoration attempts');
            console.log('🔄 [DashboardApp] Redirecting to auth page...');
            
            // Clear any corrupted session data
            localStorage.removeItem('oslira-auth');
            
            // Redirect to auth with return URL
            const returnUrl = encodeURIComponent(window.location.href);
            const authUrl = `${window.OsliraEnv.getAuthUrl()}?return_to=${returnUrl}`;
            
            window.location.href = authUrl;
            return; // Stop initialization
        }
        
        console.log('✅ [DashboardApp] User authenticated:', window.OsliraAuth.user.email);
        
        // Continue with rest of initialization...
        // (keep everything else the same)
        
        // Step 5: Initialize sidebar
        console.log('🔧 [DashboardApp] Initializing sidebar...');
        const sidebar = new window.SidebarManager();
        await sidebar.render('#sidebar-container');
        
        // Step 6: Load business profiles
        console.log('🏢 [DashboardApp] Loading businesses...');
        const businessManager = new window.BusinessManager();
        await businessManager.loadBusinesses();
        
        const currentBusiness = businessManager.getCurrentBusiness();
        if (currentBusiness && window.OsliraAuth) {
            window.OsliraAuth.business = currentBusiness;
            console.log('✅ [DashboardApp] Business synced:', currentBusiness.business_name);
        }
        
        // Step 7: Initialize managers
        console.log('📊 [DashboardApp] Initializing managers...');
        const leadManager = new window.LeadManager();
        const modalManager = new window.ModalManager();
        
        // Step 8: Render dashboard UI
        console.log('🎨 [DashboardApp] Rendering dashboard UI...');
        await this.renderDashboardUI();
        
        // Step 9: Load lead data
        console.log('📊 [DashboardApp] Loading lead data...');
        await leadManager.loadDashboardData();
        
        // Step 10: Setup event handlers
        console.log('📡 [DashboardApp] Setting up event handlers...');
        if (window.DashboardEventSystem) {
            window.DashboardEventSystem.setupHandlers(
                window.OsliraEventBus,
                this
            );
        }
        
        // Step 11: Expose public API
        this.exposePublicAPI();
        
        // Complete
        this.initialized = true;
        const initTime = Date.now() - this.initStartTime;
        
        document.body.style.visibility = 'visible';
        
        console.log(`✅ [DashboardApp] Initialized in ${initTime}ms`);
        
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
