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
        
        // Step 1: Initialize Auth
        console.log('🔐 [DashboardApp] Initializing authentication...');
        if (window.OsliraAuth && !window.OsliraAuth.initialized) {
            await window.OsliraAuth.initialize();
            console.log('✅ [DashboardApp] Auth initialized');
        }
        
        // Step 2: Check URL hash for cross-subdomain session transfer
        const restoredFromHash = await this._restoreSessionFromUrlHash();
        
        if (restoredFromHash) {
            console.log('✅ [DashboardApp] Session restored from URL hash');
        } else {
            // Step 3: Wait for session from localStorage
            console.log('🔐 [DashboardApp] Waiting for session restoration...');
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!window.OsliraAuth?.user && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
                
                const storedSession = localStorage.getItem('oslira-auth');
                if (storedSession && window.OsliraAuth?.supabase) {
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
        }
        
        // Step 4: Final auth check
        if (!window.OsliraAuth?.user) {
            console.warn('⚠️ [DashboardApp] No authenticated user');
            localStorage.removeItem('oslira-auth');
            
            const returnUrl = encodeURIComponent(window.location.href);
            const authUrl = `${window.OsliraEnv.getAuthUrl()}?return_to=${returnUrl}`;
            
            window.location.href = authUrl;
            return;
        }
        
        console.log('✅ [DashboardApp] User authenticated:', window.OsliraAuth.user.email);
        
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
        
        // ✅ FIX: Use correct EventBus reference
        if (window.OsliraEventBus) {
            window.OsliraEventBus.emit('DASHBOARD_INIT_COMPLETE', { initTime });
        }
        
    } catch (error) {
        console.error('❌ [DashboardApp] Initialization failed:', error);
        
if (window.OsliraErrorHandler) {
    window.OsliraErrorHandler.handleError(error, { 
        context: 'dashboard_init',
        fatal: true 
    });
} else {
            console.error('❌ [DashboardApp] ErrorHandler not available');
        }
        
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
        'OsliraErrorHandler',    // ✅ CORRECT
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
// =============================================================================
// COMPLETE FIX FOR DashboardApp.js
// Replace the entire renderDashboardUI() and exposePublicAPI() methods
// =============================================================================

/**
 * Render dashboard UI components
 */
async renderDashboardUI() {
    try {
        console.log('🎨 [DashboardApp] Rendering dashboard UI components...');
        
        // =========================================================================
        // STEP 1: Render Header
        // =========================================================================
        if (window.DashboardHeader) {
            const dashboardHeader = new window.DashboardHeader();
            const headerElement = document.getElementById('dashboard-header');
            if (headerElement && dashboardHeader.renderHeader) {
                headerElement.innerHTML = dashboardHeader.renderHeader();
                
                // Initialize header functionality (dropdown, buttons, etc.)
                if (dashboardHeader.initialize) {
                    dashboardHeader.initialize();
                }
                
                // Store reference for global functions
                window.dashboardHeaderInstance = dashboardHeader;
            }
        }
        
        // =========================================================================
        // STEP 2: Render Stats Cards
        // =========================================================================
        if (window.StatsCards) {
            const statsCards = new window.StatsCards();
            
            // Priority cards
            const priorityCardsEl = document.getElementById('priority-cards');
            if (priorityCardsEl && statsCards.renderPriorityCards) {
                priorityCardsEl.innerHTML = statsCards.renderPriorityCards();
            }
            
            // Performance metrics
            const metricsEl = document.getElementById('performance-metrics');
            if (metricsEl && statsCards.renderPerformanceMetrics) {
                metricsEl.innerHTML = statsCards.renderPerformanceMetrics();
            }
            
            // Initialize stats cards functionality
            if (statsCards.initialize) {
                statsCards.initialize();
            }
            
            // Store reference
            window.statsCardsInstance = statsCards;
        }
        
        // =========================================================================
        // STEP 3: Render Leads Table (CRITICAL FIX)
        // =========================================================================
        if (window.LeadsTable) {
            const leadsTable = new window.LeadsTable();
            const tableEl = document.getElementById('leads-table-container');
            if (tableEl && leadsTable.render) {
                tableEl.innerHTML = leadsTable.render();
                
                // Initialize table functionality (sorting, selection, etc.)
                if (leadsTable.initialize) {
                    leadsTable.initialize();
                }
                
                // Store reference
                window.leadsTableInstance = leadsTable;
            }
        }
        
        // =========================================================================
        // STEP 4: Setup Lead Renderer (for actual lead cards)
        // =========================================================================
if (window.LeadRenderer) {
    const leadRenderer = new window.LeadRenderer();
    
    // Listen for leads loaded event to render them
    if (window.OsliraEventBus) {
        window.OsliraEventBus.on('leads:loaded', (leadsData) => {
            // Handle both array and object formats
            const leads = Array.isArray(leadsData) ? leadsData : (leadsData.leads || leadsData);
            console.log('📊 [DashboardApp] Leads loaded, rendering...', leads);
            this.renderLeads(leads);
        });
    }
    
    // Store reference
    window.leadRendererInstance = leadRenderer;
}
        
        // =========================================================================
        // STEP 5: Render Insights Panel
        // =========================================================================
        if (window.InsightsPanel) {
            const insightsPanel = new window.InsightsPanel();
            const panelEl = document.getElementById('insights-panel');
            if (panelEl && insightsPanel.render) {
                panelEl.innerHTML = insightsPanel.render();
                
                if (insightsPanel.initialize) {
                    insightsPanel.initialize();
                }
            }
        }
        
        // =========================================================================
        // STEP 6: Render Tip of Day
        // =========================================================================
        if (window.TipOfDay) {
            const tipOfDay = new window.TipOfDay();
            const tipEl = document.getElementById('tip-of-day');
            if (tipEl && tipOfDay.render) {
                tipEl.innerHTML = tipOfDay.render();
                
                if (tipOfDay.initialize) {
                    tipOfDay.initialize();
                }
            }
        }
        
        console.log('✅ [DashboardApp] UI components rendered');
        
    } catch (error) {
        console.error('❌ [DashboardApp] Failed to render UI:', error);
        throw error;
    }
}

/**
 * Render leads into table (called when leads are loaded)
 */
renderLeads(leads) {
    try {
        const tableContainer = document.getElementById('leads-table-container');
        if (!tableContainer) {
            console.warn('⚠️ [DashboardApp] Leads table container not found');
            return;
        }
        
        if (window.leadRendererInstance && window.leadRendererInstance.renderLeads) {
            const leadsHtml = window.leadRendererInstance.renderLeads(leads);
            const tbody = tableContainer.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = leadsHtml;
                
                // Setup event listeners for lead cards
                this.setupLeadEventListeners();
            }
        }
        
        console.log(`✅ [DashboardApp] Rendered ${leads.length} leads`);
        
    } catch (error) {
        console.error('❌ [DashboardApp] Failed to render leads:', error);
    }
}

/**
 * Setup event listeners for lead interactions
 */
setupLeadEventListeners() {
    // Checkbox selection
    document.querySelectorAll('.lead-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const leadId = e.target.dataset.leadId;
            if (window.LeadManager) {
                const leadManager = new window.LeadManager();
                if (e.target.checked) {
                    leadManager.selectLead(leadId);
                } else {
                    leadManager.deselectLead(leadId);
                }
            }
        });
    });
    
    // Lead card clicks (open modal)
    document.querySelectorAll('.table-row').forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't trigger if clicking checkbox
            if (e.target.classList.contains('lead-checkbox')) return;
            
            const leadId = row.dataset.leadId;
            if (window.ModalManager && leadId) {
                const modalManager = new window.ModalManager();
                modalManager.openLeadModal(leadId);
            }
        });
    });
}

/**
 * Expose public API (UPDATED FOR NEW ARCHITECTURE)
 */
exposePublicAPI() {
    // Main dashboard reference
    window.dashboard = this;
    
    // ==========================================================================
    // GLOBAL FUNCTIONS FOR HTML onclick HANDLERS
    // ==========================================================================
    
    /**
     * Handle dropdown mode selection (single/bulk)
     */
    window.handleDropdownSelection = (mode) => {
        if (window.dashboardHeaderInstance && window.dashboardHeaderInstance.handleModeChange) {
            window.dashboardHeaderInstance.handleModeChange(mode);
        } else {
            console.warn('⚠️ Dashboard header not initialized');
        }
    };
    
    /**
     * Submit research form
     */
    window.submitResearch = () => {
        if (window.ResearchHandlers) {
            const handlers = new window.ResearchHandlers();
            if (handlers.submitResearch) {
                handlers.submitResearch();
            }
        } else {
            console.warn('⚠️ Research handlers not available');
        }
    };
    
    /**
     * Filter leads by priority
     */
    window.filterByPriority = (priority) => {
        if (window.statsCardsInstance && window.statsCardsInstance.filterByPriority) {
            window.statsCardsInstance.filterByPriority(priority);
        } else if (window.LeadManager) {
            const leadManager = new window.LeadManager();
            if (leadManager.filterLeads) {
                leadManager.filterLeads(priority);
            }
        }
    };
    
    /**
     * Clear all lead selections
     */
    window.clearAllSelections = () => {
        if (window.LeadManager) {
            const leadManager = new window.LeadManager();
            if (leadManager.clearSelection) {
                leadManager.clearSelection();
            }
        }
        
        // Also clear checkboxes visually
        document.querySelectorAll('.lead-checkbox:checked').forEach(cb => {
            cb.checked = false;
        });
    };
    
    /**
     * Open bulk modal
     */
    window.openBulkModal = () => {
        if (window.ModalManager) {
            const modalManager = new window.ModalManager();
            if (modalManager.openModal) {
                modalManager.openModal('bulkModal');
            }
        } else {
            console.warn('⚠️ Modal manager not available');
        }
    };
    
    /**
     * Handle main button click (Research New Lead button)
     */
    window.handleMainButtonClick = () => {
        const currentMode = window.dashboardHeaderInstance?.currentMode || 'single';
        
        if (currentMode === 'bulk') {
            window.openBulkModal();
        } else {
            // Open research modal
            if (window.ResearchHandlers) {
                const handlers = new window.ResearchHandlers();
                if (handlers.openResearchModal) {
                    handlers.openResearchModal();
                }
            } else if (window.ModalManager) {
                const modalManager = new window.ModalManager();
                if (modalManager.openModal) {
                    modalManager.openModal('researchModal');
                }
            }
        }
    };
    
    /**
     * Global refresh function
     */
    window.refreshLeadsTable = async () => {
        if (window.LeadManager) {
            const leadManager = new window.LeadManager();
            if (leadManager.loadDashboardData) {
                await leadManager.loadDashboardData();
            }
        }
    };
    
    // ==========================================================================
    // TOOLBAR FUNCTIONS
    // ==========================================================================
    
    window.toggleToolbarCopyDropdown = () => {
        const dropdown = document.getElementById('toolbar-copy-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    };
    
    console.log('✅ [DashboardApp] Public API exposed');
}
    
    /**
     * Get dashboard stats
     */
getStats() {
    try {
        const stateManager = window.OsliraStateManager;  // ✅ FIXED
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
    if (window.OsliraErrorHandler) {
        window.OsliraErrorHandler.handleError(error, { 
            context: 'dashboard_bootstrap',
            fatal: true 
        });
    }
}
});

// Export
window.DashboardApp = DashboardApp;
