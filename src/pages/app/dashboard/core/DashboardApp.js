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
        return this.initializationPromise;
    }
    
    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
}

async _performInitialization() {
    try {
        console.log('🚀 [DashboardApp] Starting initialization...');
        this.initStartTime = Date.now();
        
        // Validate dependencies
        this.validateDependencies();
        
// Just initialize, no need to create instance
if (window.OsliraApiClient && !window.OsliraApiClient.isInitialized) {
    console.log('🌐 [DashboardApp] Initializing ApiClient...');
    await window.OsliraApiClient.initialize({
        httpClient: window.OsliraHttp || window.OsliraHttpClient,
        logger: window.OsliraLogger,
        authManager: window.OsliraAuth
    });
    console.log('✅ [DashboardApp] ApiClient initialized');
}

// ✅ ADD THIS: Initialize LeadsAPI
if (window.OsliraLeadsAPI && !window.OsliraLeadsAPI.isInitialized) {
    console.log('🎯 [DashboardApp] Initializing LeadsAPI...');
    await window.OsliraLeadsAPI.initialize({
        apiClient: window.OsliraApiClient
    });
    console.log('✅ [DashboardApp] LeadsAPI initialized');
}
        
        // Initialize auth
        await this.initializeAuth();
        
        // Restore session
        await this.restoreSession();
        
        // Initialize sidebar
        await this.initializeSidebar();
        
        // Load businesses
        await this.loadBusinesses();

        // Initialize managers
await this.initializeManagers();
        
        // ✅ ADD THIS ONE LINE ✅
        await this.initializeModals();
        
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
    
    // ✅ CRITICAL FIX: Check if error is auth-related
    if (error.message && error.message.includes('Authentication required')) {
        console.log('🔐 [DashboardApp] Auth redirect in progress, suppressing error...');
        // Don't log to Sentry - this is expected behavior
        return;
    }
    
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
    
/**
 * Restore session from URL hash or localStorage
 * ✅ CRITICAL FIX: Redirect to login if no session found after timeout
 */
async restoreSession() {
    console.log('🔐 [DashboardApp] Waiting for session restoration...');
    
    // ============================================================================
    // STEP 1: Try to restore from URL hash first (cross-subdomain transfer)
    // ============================================================================
    const restoredFromHash = await this._restoreSessionFromUrlHash();
    
    if (restoredFromHash) {
        console.log('✅ [DashboardApp] Session restored from URL hash');
        return;
    }
    
    // ============================================================================
    // STEP 2: Wait for session from localStorage/Supabase
    // ============================================================================
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds (50 * 100ms)
    
    while (!window.OsliraAuth?.user && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        // Try to recover session from localStorage
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
                    return; // ✅ Exit early on success
                }
            } catch (sessionError) {
                console.warn('⚠️ [DashboardApp] Session check error:', sessionError);
            }
        }
    }
    
    // ============================================================================
    // STEP 3: CRITICAL FIX - No session after timeout = Redirect to login
    // ============================================================================
    if (!window.OsliraAuth?.user) {
        console.warn('⚠️ [DashboardApp] No session found after timeout, redirecting to login...');
        this.redirectToAuth();
        
        // Throw error to stop initialization
        throw new Error('Authentication required - redirecting to login');
    }
    
    console.log('✅ [DashboardApp] Session restoration complete');
}

/**
 * Restore session from URL hash (cross-subdomain transfer)
 */
async _restoreSessionFromUrlHash() {
    const hash = window.location.hash;
    
    if (!hash || !hash.includes('auth=')) {
        return false;
    }
    
    try {
        console.log('🔐 [DashboardApp] Found auth token in URL hash, restoring...');
        
        const hashParams = new URLSearchParams(hash.substring(1));
        const authToken = hashParams.get('auth');
        
        if (!authToken) return false;
        
        // Decode URL-safe base64
        const base64 = authToken.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '==='.slice((base64.length + 3) % 4);
        const tokens = JSON.parse(atob(padded));
        
        // Set session in Supabase
        const { data, error } = await window.OsliraAuth.supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
        });
        
        if (error || !data.session) {
            console.error('❌ [DashboardApp] Failed to set session from URL:', error);
            window.history.replaceState(null, '', window.location.pathname);
            return false;
        }
        
        // Update auth state immediately
        window.OsliraAuth.session = data.session;
        window.OsliraAuth.user = data.session.user;
        
        // Clean URL (remove hash)
        window.history.replaceState(null, '', window.location.pathname);
        
        console.log('✅ [DashboardApp] Session restored from URL hash');
        return true;
        
    } catch (error) {
        console.error('❌ [DashboardApp] Hash restoration failed:', error);
        window.history.replaceState(null, '', window.location.pathname);
        return false;
    }
}

/**
 * Redirect to auth/login page
 * ✅ CRITICAL: This stops infinite loops and provides clean UX
 */
redirectToAuth() {
    console.warn('⚠️ [DashboardApp] No authenticated user, redirecting to login...');
    
    // Clear any stale auth data
    localStorage.removeItem('oslira-auth');
    
    // Build return URL (so user comes back here after login)
    const returnUrl = encodeURIComponent(window.location.href);
    const authUrl = `${window.OsliraEnv.getAuthUrl()}?return_to=${returnUrl}`;
    
    console.log('🔀 [DashboardApp] Redirecting to:', authUrl);
    
    // Perform redirect
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
    
async initializeManagers() {
    console.log('📊 [DashboardApp] Initializing managers...');
    
    // Create singleton instances
    this.components.leadManager = new window.LeadManager();
    this.components.modalManager = new window.ModalManager();
    
    // Initialize Analysis Queue
    if (window.AnalysisQueue) {
        console.log('📊 [DashboardApp] Initializing AnalysisQueue...');
        this.components.analysisQueue = new window.AnalysisQueue();
        await this.components.analysisQueue.init();
        window.analysisQueueInstance = this.components.analysisQueue;
        console.log('✅ [DashboardApp] AnalysisQueue initialized');
    }
    
    // Store globally for easy access
    window.leadManagerInstance = this.components.leadManager;
    window.modalManagerInstance = this.components.modalManager;
    
    console.log('✅ [DashboardApp] Managers initialized');
}

async initializeModals() {
    console.log('🎨 [DashboardApp] Rendering modals...');
    
    // Render Research Modal
    if (window.ResearchModal) {
        const modal = new window.ResearchModal();
        const container = document.getElementById('researchModal');
        if (container && modal.renderModal) {
            container.outerHTML = modal.renderModal();
            if (modal.setupEventHandlers) modal.setupEventHandlers();
            console.log('✅ Research modal rendered');
        }
    }
    
    // Render Bulk Modal - NOTE: Method is called renderBulkModal() not renderModal()
    if (window.BulkModal) {
        const modal = new window.BulkModal();
        const container = document.getElementById('bulkModal');
        if (container && modal.renderBulkModal) {
            container.outerHTML = modal.renderBulkModal();
            if (modal.setupEventHandlers) modal.setupEventHandlers();
            console.log('✅ Bulk modal rendered');
        }
    }
    
    // Render Filter Modal
    if (window.FilterModal) {
        const modal = new window.FilterModal();
        const containers = document.getElementById('modal-containers');
        if (containers && modal.renderModal) {
            containers.insertAdjacentHTML('beforeend', modal.renderModal());
            if (modal.setupEventHandlers) modal.setupEventHandlers();
            console.log('✅ Filter modal rendered');
        }
    }
    
    // Initialize ModalManager
    if (this.components.modalManager && this.components.modalManager.init) {
        await this.components.modalManager.init();
    }
    
    console.log('✅ [DashboardApp] Modals initialized');
}


/**
 * Verify that modals are actually in the DOM with content
 */
verifyModalsInDOM() {
    console.log('🔍 [DashboardApp] Verifying modals in DOM...');
    
    const modalChecks = {
        researchModal: document.getElementById('researchModal'),
        bulkModal: document.getElementById('bulkModal')
    };
    
    for (const [modalName, modalElement] of Object.entries(modalChecks)) {
        if (!modalElement) {
            console.error(`❌ ${modalName} not found in DOM`);
        } else if (modalElement.innerHTML.trim().length < 100) {
            console.error(`❌ ${modalName} is empty (${modalElement.innerHTML.length} chars)`);
        } else {
            console.log(`✅ ${modalName} verified (${modalElement.innerHTML.length} chars)`);
        }
    }
}

    setupGlobalModalControls() {
    console.log('🔧 [DashboardApp] Setting up global modal controls...');
    
    // =========================================================================
    // RESEARCH MODAL CONTROLS
    // =========================================================================
    
    window.openResearchModal = () => {
        console.log('🔍 [Global] Opening research modal...');
        const modal = document.getElementById('researchModal');
        
        if (!modal) {
            console.error('❌ Research modal not found in DOM');
            return;
        }
        
        // Remove hidden class
        modal.classList.remove('hidden');
        
        // Set display to flex
        modal.style.display = 'flex';
        
        // Also show any nested wrapper
        const wrapper = modal.querySelector('.fixed.inset-0');
        if (wrapper) {
            wrapper.classList.remove('hidden');
            wrapper.style.display = 'flex';
        }
        
        console.log('✅ Research modal opened');
    };
    
    window.closeResearchModal = () => {
        console.log('📕 [Global] Closing research modal...');
        const modal = document.getElementById('researchModal');
        
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        const wrapper = modal.querySelector('.fixed.inset-0');
        if (wrapper) {
            wrapper.classList.add('hidden');
            wrapper.style.display = 'none';
        }
        
        console.log('✅ Research modal closed');
    };
    
    // =========================================================================
    // BULK MODAL CONTROLS
    // =========================================================================
    
    window.openBulkModal = () => {
        console.log('📊 [Global] Opening bulk modal...');
        const modal = document.getElementById('bulkModal');
        
        if (!modal) {
            console.error('❌ Bulk modal not found in DOM');
            console.log('Available modals:', 
                Array.from(document.querySelectorAll('[id*="modal"]')).map(el => el.id)
            );
            return;
        }
        
        // Log current state
        console.log('Modal element found:', {
            id: modal.id,
            classes: modal.className,
            display: modal.style.display,
            innerHTML: modal.innerHTML.length + ' chars'
        });
        
        // Remove hidden class
        modal.classList.remove('hidden');
        
        // Set display to flex (critical for visibility)
        modal.style.display = 'flex';
        
        // Also show the inner wrapper that has the backdrop
        const innerWrapper = modal.querySelector('.fixed.inset-0');
        if (innerWrapper) {
            innerWrapper.classList.remove('hidden');
            innerWrapper.style.display = 'flex';
        }
        
        // Force reflow
        void modal.offsetHeight;
        
        console.log('✅ Bulk modal opened (display:', modal.style.display, ')');
    };
    
    window.closeBulkModal = () => {
        console.log('📕 [Global] Closing bulk modal...');
        const modal = document.getElementById('bulkModal');
        
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        const innerWrapper = modal.querySelector('.fixed.inset-0');
        if (innerWrapper) {
            innerWrapper.classList.add('hidden');
            innerWrapper.style.display = 'none';
        }
        
        console.log('✅ Bulk modal closed');
    };
    
    // =========================================================================
    // EXPOSE VIA DASHBOARD OBJECT
    // =========================================================================
    
    if (!window.dashboard.modals) {
        window.dashboard.modals = {};
    }
    
    window.dashboard.modals = {
        openResearch: window.openResearchModal,
        closeResearch: window.closeResearchModal,
        openBulk: window.openBulkModal,
        closeBulk: window.closeBulkModal,
        
        // Debug method
        debug: () => {
            return {
                researchModal: {
                    exists: !!document.getElementById('researchModal'),
                    hasContent: document.getElementById('researchModal')?.innerHTML.length > 100,
                    display: document.getElementById('researchModal')?.style.display,
                    classes: document.getElementById('researchModal')?.className
                },
                bulkModal: {
                    exists: !!document.getElementById('bulkModal'),
                    hasContent: document.getElementById('bulkModal')?.innerHTML.length > 100,
                    display: document.getElementById('bulkModal')?.style.display,
                    classes: document.getElementById('bulkModal')?.className
                }
            };
        }
    };
    
    console.log('✅ [DashboardApp] Global modal controls ready');
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

    window.openLeadAnalysisModal = (leadId) => {
        console.log('📊 [DashboardApp] Opening lead analysis modal:', leadId);
        
        // Try LeadAnalysisHandlers first
        if (window.LeadAnalysisHandlers) {
            const handlers = new window.LeadAnalysisHandlers();
            if (typeof handlers.openModal === 'function') {
                handlers.openModal(leadId);
                return;
            }
        }
        
        // Fallback: Try ModalManager
        if (this.components.modalManager && typeof this.components.modalManager.openModal === 'function') {
            this.components.modalManager.openModal('leadAnalysisModal', { leadId });
            return;
        }
        
        // Fallback: Direct modal manipulation
        const modal = document.getElementById('leadAnalysisModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        } else {
            console.error('❌ Lead analysis modal not found');
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

export default DashboardApp;

// Also keep window global for backwards compatibility
if (typeof window !== 'undefined') {
    window.DashboardApp = DashboardApp;
}
