// =============================================================================
// DASHBOARD APP - Production-Ready Complete Rewrite
// Path: /public/pages/app/dashboard/core/DashboardApp.js
// =============================================================================

class DashboardApp {
    constructor() {
        this.initialized = false;
        this.initStartTime = Date.now();
        this.initializationPromise = null;
        
        // Component instances (stored for reuse)
        this.components = {
            leadManager: null,
            modalManager: null,
            businessManager: null,
            sidebar: null,
            header: null,
            statsCards: null,
            leadsTable: null,
            leadRenderer: null,
            insightsPanel: null,
            tipOfDay: null
        };
        
        console.log('🚀 [DashboardApp] Starting initialization...');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async init() {
        if (this.initializationPromise) {
            console.log('⏳ [DashboardApp] Already initializing...');
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
    
    async _performInitialization() {
        try {
            console.log('🔧 [DashboardApp] Setting up dashboard...');
            
            // Validate dependencies
            this.validateDependencies();
            
            // Initialize auth
            await this.initializeAuth();
            
            // Restore session (from URL hash or localStorage)
            await this.restoreSession();
            
            // Check authentication
            if (!window.OsliraAuth?.user) {
                this.redirectToAuth();
                return;
            }
            
            console.log('✅ [DashboardApp] User authenticated:', window.OsliraAuth.user.email);
            
            // Initialize sidebar
            await this.initializeSidebar();
            
            // Load businesses
            await this.loadBusinesses();
            
            // Initialize managers (singletons!)
            this.initializeManagers();
            
            // Render UI
            await this.renderDashboardUI();
            
            // Load data
            await this.loadDashboardData();
            
            // Setup events
            this.setupEventHandlers();
            
            // Expose API
            this.exposePublicAPI();
            
            // Complete
            this.finishInitialization();
            
        } catch (error) {
            console.error('❌ [DashboardApp] Initialization failed:', error);
            
            if (window.OsliraErrorHandler) {
                window.OsliraErrorHandler.handleError(error, { 
                    context: 'dashboard_init',
                    fatal: true 
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // INITIALIZATION STEPS
    // =========================================================================
    
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
        
        console.log('✅ [DashboardApp] Dependencies validated');
    }
    
    async initializeAuth() {
        console.log('🔐 [DashboardApp] Initializing authentication...');
        
        if (window.OsliraAuth && !window.OsliraAuth.initialized) {
            await window.OsliraAuth.initialize();
        }
        
        console.log('✅ [DashboardApp] Auth initialized');
    }
    
    async restoreSession() {
        // Check URL hash first
        const restoredFromHash = await this._restoreSessionFromUrlHash();
        
        if (restoredFromHash) {
            console.log('✅ [DashboardApp] Session restored from URL hash');
            return;
        }
        
        // Wait for localStorage session
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
                        console.warn('⚠️ [DashboardApp] Session recovery error');
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
                    console.warn('⚠️ [DashboardApp] Session check error');
                }
            }
        }
    }
    
    async _restoreSessionFromUrlHash() {
        const hash = window.location.hash;
        
        if (!hash || !hash.includes('auth=')) {
            return false;
        }
        
        try {
            const hashParams = new URLSearchParams(hash.substring(1));
            const authToken = hashParams.get('auth');
            
            if (!authToken) return false;
            
            // Decode tokens
            const base64 = authToken.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '==='.slice((base64.length + 3) % 4);
            const tokens = JSON.parse(atob(padded));
            
            // Set session
            const { data, error } = await window.OsliraAuth.supabase.auth.setSession({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token
            });
            
            if (error || !data.session) {
                throw new Error('Failed to set session');
            }
            
            // Update auth state
            window.OsliraAuth.session = data.session;
            window.OsliraAuth.user = data.session.user;
            
            // Clean URL
            window.history.replaceState(null, '', window.location.pathname);
            
            console.log('✅ [DashboardApp] Session restored from URL hash');
            return true;
            
        } catch (error) {
            console.error('❌ [DashboardApp] Hash restoration failed:', error);
            window.history.replaceState(null, '', window.location.pathname);
            return false;
        }
    }
    
    redirectToAuth() {
        console.warn('⚠️ [DashboardApp] No authenticated user, redirecting...');
        localStorage.removeItem('oslira-auth');
        
        const returnUrl = encodeURIComponent(window.location.href);
        const authUrl = `${window.OsliraEnv.getAuthUrl()}?return_to=${returnUrl}`;
        
        window.location.href = authUrl;
    }
    
    async initializeSidebar() {
        console.log('🔧 [DashboardApp] Initializing sidebar...');
        
        this.components.sidebar = new window.SidebarManager();
        await this.components.sidebar.render('#sidebar-container');
        
        console.log('✅ [DashboardApp] Sidebar initialized');
    }
    
    async loadBusinesses() {
        console.log('🏢 [DashboardApp] Loading businesses...');
        
        this.components.businessManager = new window.BusinessManager();
        await this.components.businessManager.loadBusinesses();
        
        const currentBusiness = this.components.businessManager.getCurrentBusiness();
        if (currentBusiness && window.OsliraAuth) {
            window.OsliraAuth.business = currentBusiness;
            console.log('✅ [DashboardApp] Business synced:', currentBusiness.business_name);
        }
    }
    
    initializeManagers() {
        console.log('📊 [DashboardApp] Initializing managers...');
        
        // Create singleton instances
        this.components.leadManager = new window.LeadManager();
        this.components.modalManager = new window.ModalManager();
        
        // Store globally for easy access
        window.leadManagerInstance = this.components.leadManager;
        window.modalManagerInstance = this.components.modalManager;
        
        console.log('✅ [DashboardApp] Managers initialized');
    }
    
    // =========================================================================
    // UI RENDERING
    // =========================================================================
    
    async renderDashboardUI() {
        try {
            console.log('🎨 [DashboardApp] Rendering UI components...');
            
            // Render header
            await this.renderHeader();
            
            // Render stats cards
            await this.renderStatsCards();
            
            // Render leads table
            await this.renderLeadsTable();
            
            // Render insights panel
            await this.renderInsightsPanel();
            
            // Render tip of day
            await this.renderTipOfDay();
            
            console.log('✅ [DashboardApp] UI rendered');
            
        } catch (error) {
            console.error('❌ [DashboardApp] UI rendering failed:', error);
            throw error;
        }
    }
    
    async renderHeader() {
        if (!window.DashboardHeader) return;
        
        console.log('📋 [DashboardApp] Rendering header...');
        
        this.components.header = new window.DashboardHeader();
        const headerEl = document.getElementById('dashboard-header');
        
        if (headerEl && typeof this.components.header.renderHeader === 'function') {
            headerEl.innerHTML = this.components.header.renderHeader();
            
            if (typeof this.components.header.initialize === 'function') {
                await this.components.header.initialize();
            }
            
            window.dashboardHeaderInstance = this.components.header;
            console.log('✅ [DashboardApp] Header rendered');
        }
    }
    
    async renderStatsCards() {
        if (!window.StatsCards) return;
        
        console.log('📊 [DashboardApp] Rendering stats cards...');
        
        this.components.statsCards = new window.StatsCards();
        
        // Priority cards
        const priorityEl = document.getElementById('priority-cards');
        if (priorityEl && typeof this.components.statsCards.renderPriorityCards === 'function') {
            priorityEl.innerHTML = this.components.statsCards.renderPriorityCards();
        }
        
        // Performance metrics
        const metricsEl = document.getElementById('performance-metrics');
        if (metricsEl && typeof this.components.statsCards.renderPerformanceMetrics === 'function') {
            metricsEl.innerHTML = this.components.statsCards.renderPerformanceMetrics();
        }
        
        // Initialize
        if (typeof this.components.statsCards.initialize === 'function') {
            await this.components.statsCards.initialize();
        }
        
        window.statsCardsInstance = this.components.statsCards;
        console.log('✅ [DashboardApp] Stats cards rendered');
    }
    
async renderLeadsTable() {
    if (!window.LeadsTable) return;
    
    console.log('📋 [DashboardApp] Rendering leads table...');
    
    this.components.leadsTable = new window.LeadsTable();
    const tableEl = document.getElementById('leads-table-container');
    
    if (tableEl && typeof this.components.leadsTable.renderTableContainer === 'function') {
        tableEl.innerHTML = this.components.leadsTable.renderTableContainer();
        
        if (typeof this.components.leadsTable.setupEventHandlers === 'function') {
            this.components.leadsTable.setupEventHandlers();
        }
        
        window.leadsTableInstance = this.components.leadsTable;
        console.log('✅ [DashboardApp] Leads table rendered');
    }
    
    // Setup lead renderer
    if (window.LeadRenderer) {
        this.components.leadRenderer = new window.LeadRenderer();
        window.leadRendererInstance = this.components.leadRenderer;
        
        // 🎯 ADD THIS LINE:
        await this.components.leadRenderer.init();
        
        // Now trigger initial display with empty array to show empty state
        this.components.leadRenderer.displayLeads([]);
        
        // Listen for leads loaded
        if (window.OsliraEventBus) {
            window.OsliraEventBus.on('leads:loaded', (leadsData) => {
                const leads = Array.isArray(leadsData) ? leadsData : (leadsData.leads || leadsData);
                this.components.leadRenderer.displayLeads(leads);
            });
        }
    }
}

async renderTipOfDay() {
    if (!window.TipOfDay) return;
    
    console.log('💡 [DashboardApp] Rendering tip of day...');
    
    this.components.tipOfDay = new window.TipOfDay();
    const tipEl = document.getElementById('tip-of-day');
    
    if (tipEl && typeof this.components.tipOfDay.renderTip === 'function') {
        tipEl.innerHTML = this.components.tipOfDay.renderTip(); // ✅ CHANGED: was render()
        console.log('✅ [DashboardApp] Tip of day rendered');
    }
}
    
    async renderInsightsPanel() {
        if (!window.InsightsPanel) return;
        
        console.log('💡 [DashboardApp] Rendering insights panel...');
        
        this.components.insightsPanel = new window.InsightsPanel();
        const panelEl = document.getElementById('insights-panel');
        
        if (panelEl && typeof this.components.insightsPanel.render === 'function') {
            panelEl.innerHTML = this.components.insightsPanel.render();
            
            if (typeof this.components.insightsPanel.initialize === 'function') {
                await this.components.insightsPanel.initialize();
            }
            
            console.log('✅ [DashboardApp] Insights panel rendered');
        }
    }
    renderLeads(leads) {
        try {
            if (!this.components.leadRenderer) return;
            
            const tableContainer = document.getElementById('leads-table-container');
            if (!tableContainer) return;
            
            if (typeof this.components.leadRenderer.renderLeads === 'function') {
                const leadsHtml = this.components.leadRenderer.renderLeads(leads);
                const tbody = tableContainer.querySelector('tbody');
                
                if (tbody) {
                    tbody.innerHTML = leadsHtml;
                    this.setupLeadEventListeners();
                }
            }
            
            console.log(`✅ [DashboardApp] Rendered ${leads.length} leads`);
            
        } catch (error) {
            console.error('❌ [DashboardApp] Lead rendering failed:', error);
        }
    }
    
    setupLeadEventListeners() {
        // Checkbox selection
        document.querySelectorAll('.lead-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const leadId = e.target.dataset.leadId;
                if (e.target.checked) {
                    this.components.leadManager?.selectLead(leadId);
                } else {
                    this.components.leadManager?.deselectLead(leadId);
                }
            });
        });
        
        // Row clicks (open modal)
        document.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.classList.contains('lead-checkbox')) return;
                
                const leadId = row.dataset.leadId;
                if (leadId && this.components.modalManager) {
                    // Try multiple possible method names
                    if (typeof this.components.modalManager.openLeadModal === 'function') {
                        this.components.modalManager.openLeadModal(leadId);
                    } else if (typeof this.components.modalManager.showModal === 'function') {
                        this.components.modalManager.showModal('lead', { leadId });
                    }
                }
            });
        });
    }
    
    // =========================================================================
    // DATA LOADING
    // =========================================================================
    
    async loadDashboardData() {
        console.log('📊 [DashboardApp] Loading data...');
        
        if (this.components.leadManager && typeof this.components.leadManager.loadDashboardData === 'function') {
            await this.components.leadManager.loadDashboardData();
        }
        
        console.log('✅ [DashboardApp] Data loaded');
    }
    
    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================
    
    setupEventHandlers() {
        console.log('📡 [DashboardApp] Setting up event handlers...');
        
        if (window.DashboardEventSystem && window.OsliraEventBus) {
            window.DashboardEventSystem.setupHandlers(window.OsliraEventBus, this);
        }
        
        console.log('✅ [DashboardApp] Event handlers setup');
    }
    
    // =========================================================================
    // PUBLIC API
    // =========================================================================
    
    exposePublicAPI() {
        window.dashboard = this;
        
        // =====================================================================
        // GLOBAL FUNCTIONS (for HTML onclick handlers)
        // =====================================================================
        
        window.handleDropdownSelection = (mode) => {
            if (this.components.header && typeof this.components.header.handleModeChange === 'function') {
                this.components.header.handleModeChange(mode);
            }
        };
        
        window.submitResearch = () => {
            if (window.ResearchHandlers) {
                const handlers = new window.ResearchHandlers();
                if (typeof handlers.submitResearch === 'function') {
                    handlers.submitResearch();
                }
            }
        };

// In DashboardApp.js exposePublicAPI() method:

window.openResearchModal = () => {
    const modal = document.getElementById('researchModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.openBulkModal = () => {
    if (this.components.modalManager && typeof this.components.modalManager.openModal === 'function') {
        this.components.modalManager.openModal('bulkModal');
    } else {
        // Fallback
        const modal = document.getElementById('bulkModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }
};
        
        window.filterByPriority = (priority) => {
            if (this.components.statsCards && typeof this.components.statsCards.filterByPriority === 'function') {
                this.components.statsCards.filterByPriority(priority);
            } else if (this.components.leadManager && typeof this.components.leadManager.filterLeads === 'function') {
                this.components.leadManager.filterLeads(priority);
            }
        };
        
        window.clearAllSelections = () => {
            if (this.components.leadManager && typeof this.components.leadManager.clearSelection === 'function') {
                this.components.leadManager.clearSelection();
            }
            
            document.querySelectorAll('.lead-checkbox:checked').forEach(cb => cb.checked = false);
        };
        
        window.handleMainButtonClick = () => {
            const mode = this.components.header?.currentMode || 'single';
            
            if (mode === 'bulk') {
                window.openBulkModal();
            } else {
                // Open research modal
                if (window.ResearchHandlers) {
                    const handlers = new window.ResearchHandlers();
                    if (typeof handlers.openResearchModal === 'function') {
                        handlers.openResearchModal();
                    }
                } else if (this.components.modalManager) {
                    if (typeof this.components.modalManager.openModal === 'function') {
                        this.components.modalManager.openModal('researchModal');
                    } else if (typeof this.components.modalManager.showModal === 'function') {
                        this.components.modalManager.showModal('research');
                    }
                }
            }
        };
        
        window.refreshLeadsTable = async () => {
            if (this.components.leadManager && typeof this.components.leadManager.loadDashboardData === 'function') {
                await this.components.leadManager.loadDashboardData();
            }
        };
        
        window.toggleToolbarCopyDropdown = () => {
            const dropdown = document.getElementById('toolbar-copy-dropdown');
            if (dropdown) dropdown.classList.toggle('hidden');
        };
        
        console.log('✅ [DashboardApp] Public API exposed');
    }
    
    // =========================================================================
    // FINALIZATION
    // =========================================================================
    
    finishInitialization() {
        this.initialized = true;
        const initTime = Date.now() - this.initStartTime;
        
        document.body.style.visibility = 'visible';
        
        console.log(`✅ [DashboardApp] Initialized in ${initTime}ms`);
        
        if (window.OsliraEventBus) {
            window.OsliraEventBus.emit('DASHBOARD_INIT_COMPLETE', { initTime });
        }
    }
    
    // =========================================================================
    // UTILITY METHODS
    // =========================================================================
    
    getStats() {
        try {
            return {
                totalLeads: window.OsliraStateManager.getState('leads')?.length || 0,
                filteredLeads: window.OsliraStateManager.getState('filteredLeads')?.length || 0,
                selectedLeads: window.OsliraStateManager.getState('selectedLeads')?.size || 0,
                isLoading: window.OsliraStateManager.getState('isLoading') || false
            };
        } catch (error) {
            return {};
        }
    }
    
    isReady() {
        return this.initialized && window.OsliraAuth?.user;
    }
    
    getCurrentUser() {
        return window.OsliraAuth?.user || null;
    }
    
    async cleanup() {
        console.log('🧹 [DashboardApp] Cleaning up...');
        
        delete window.dashboard;
        delete window.refreshLeadsTable;
        
        this.initialized = false;
        this.initializationPromise = null;
        
        console.log('✅ [DashboardApp] Cleanup complete');
    }
    
    debug() {
        return {
            initialized: this.initialized,
            initTime: Date.now() - this.initStartTime,
            stats: this.getStats(),
            user: this.getCurrentUser()?.email,
            components: Object.keys(this.components).filter(k => this.components[k] !== null)
        };
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

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

window.DashboardApp = DashboardApp;
