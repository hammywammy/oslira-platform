// =============================================================================
// DASHBOARD.JS - Main Dashboard Controller with Config Wait
// =============================================================================

class DashboardInitializer {
    constructor() {
        this.initialized = false;
        this.app = null;
    }
    
async init() {
    if (this.initialized) return this;
    
    try {
        console.log('🚀 [Dashboard] Starting initialization...');
        
        // CRITICAL: Wait for config to be loaded
        console.log('⏳ [Dashboard] Waiting for config to be ready...');
        await window.OsliraEnv.ready();
        console.log('✅ [Dashboard] Config ready, proceeding with initialization');
        
        // Verify all required modules are loaded (now async)
        await this.verifyModules();
            
            // Initialize the dashboard application
            await this.initializeApp();
            
            // Initialize modular sidebar
            await this.initializeSidebar();
            
            // Setup global compatibility
            this.setupGlobalCompatibility();
            
            this.initialized = true;
            console.log('✅ [Dashboard] Initialization complete');
            
            return this;
            
        } catch (error) {
            console.error('❌ [Dashboard] Initialization failed:', error);
            this.handleInitializationError(error);
            throw error;
        }
    }
    
async verifyModules() {
    console.log('🔍 [Dashboard] Verifying required modules...');
    
    const requiredModules = [
        'DashboardCore',
        'DashboardApp',
        'DashboardEventSystem',
        'DashboardErrorSystem',
        'DependencyContainer'
    ];
    
    // Wait for all modules with retry logic
    const maxAttempts = 50;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const missing = requiredModules.filter(module => !window[module]);
        
        if (missing.length === 0) {
            console.log('✅ [Dashboard] All required modules verified');
            return;
        }
        
        if (attempts === 0) {
            console.log('⏳ [Dashboard] Waiting for modules:', missing);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    const missing = requiredModules.filter(module => !window[module]);
    if (missing.length > 0) {
            throw new Error(`Missing required modules: ${missing.join(', ')}`);
        }
        
        console.log('✅ [Dashboard] All required modules present');
    }
    
async initializeApp() {
    console.log('📱 [Dashboard] Initializing dashboard app...');
    
    // Wait for OsliraAuth
    if (!window.OsliraAuth) {
        throw new Error('OsliraAuth not available');
    }

    // CRITICAL: Restore session from URL if present
    await window.OsliraAuth.restoreSessionFromUrl();

    // NOW initialize auth (will pick up restored session)
    await window.OsliraAuth.initialize();

    const user = window.OsliraAuth.user;

    if (!user) {
        console.log('❌ [Dashboard] No authenticated user, redirecting to auth');
        window.location.href = window.OsliraEnv.getAuthUrl();
        return;
    }
    
    console.log('✅ [Dashboard] OsliraAuth compatibility layer created');
    
    // Create and initialize the dashboard app
    this.app = new DashboardApp();
    await this.app.init();
    
    // CRITICAL: Expose container globally for TimingManager
    window.dashboard = {
        container: this.app.container,
        app: this.app
    };
    
    // Set global reference for onclick handlers
    if (this.app && this.app.container) {
        try {
            window.analysisQueue = this.app.container.get('analysisQueue');
            console.log('✅ [Dashboard] Global analysisQueue reference set');
        } catch (error) {
            console.warn('⚠️ [Dashboard] Failed to set global analysisQueue:', error.message);
        }
    }
    
    console.log('✅ [Dashboard] App initialized successfully');
}
    
    async initializeSidebar() {
        console.log('📐 [Dashboard] Initializing modular sidebar...');
        
        // Wait for SidebarManager to be available
        if (!window.SidebarManager) {
            console.warn('⚠️ [Dashboard] SidebarManager not available, skipping sidebar initialization');
            return;
        }
        
        try {
            await window.sidebarManager.render('#sidebar-container');
            console.log('✅ [Dashboard] Sidebar initialized successfully');
        } catch (error) {
            console.error('❌ [Dashboard] Sidebar initialization failed:', error);
            // Non-critical error, continue with dashboard initialization
        }
    }
    
    setupGlobalCompatibility() {
        console.log('🌐 [Dashboard] Setting up global compatibility...');
        
        // Create comprehensive global dashboard interface
        window.dashboard = {
            // Core initialization
            app: this.app,
            container: this.app?.container,
            init: () => this.init(),
            refresh: () => window.location.reload(),
            
            // Modal Management
            showAnalysisModal: (username = '') => {
                console.log('🔍 [Dashboard] Global showAnalysisModal called with:', username);
                try {
                    if (this.app?.showAnalysisModal) {
                        return this.app.showAnalysisModal(username);
                    }
                    
                    // Fallback: direct modal opening
                    const modal = document.getElementById('analysisModal');
                    if (modal) {
                        modal.style.display = 'flex';
                        
                        if (username) {
                            const usernameInput = document.getElementById('username');
                            const analysisType = document.getElementById('analysis-type');
                            const inputContainer = document.getElementById('input-field-container');
                            
                            if (usernameInput) usernameInput.value = username;
                            if (analysisType) analysisType.value = 'profile';
                            if (inputContainer) inputContainer.style.display = 'block';
                        }
                        
                        console.log('✅ [Dashboard] Analysis modal opened via fallback');
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] showAnalysisModal failed:', error);
                }
            },
            
            showBulkModal: () => {
                console.log('📁 [Dashboard] Global showBulkModal called');
                try {
                    if (this.app?.showBulkModal) {
                        return this.app.showBulkModal();
                    }
                    
                    const modal = document.getElementById('bulkModal');
                    if (modal) {
                        modal.style.display = 'flex';
                        console.log('✅ [Dashboard] Bulk modal opened via fallback');
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] showBulkModal failed:', error);
                }
            },
            
            closeModal: (modalId) => {
                console.log('❌ [Dashboard] Global closeModal called with:', modalId);
                try {
                    if (this.app?.closeModal) {
                        return this.app.closeModal(modalId);
                    }
                    
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.style.display = 'none';
                        console.log(`✅ [Dashboard] Modal ${modalId} closed via fallback`);
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] closeModal failed:', error);
                }
            },
            
            // Form Handlers
            submitAnalysis: async () => {
                console.log('🔍 [Dashboard] Global submitAnalysis called');
                
                const submitBtn = document.getElementById('analysis-submit-btn');
                const analysisType = document.getElementById('analysis-type')?.value;
                const username = document.getElementById('username')?.value;
                
                if (!analysisType) {
                    this.showAlert('Please select an analysis type', 'error');
                    return;
                }
                
                if (analysisType === 'profile' && !username?.trim()) {
                    this.showAlert('Please enter a username', 'error');
                    return;
                }
                
                let originalText = 'Start Analysis';
                
                try {
                    if (submitBtn) {
                        originalText = submitBtn.textContent;
                        submitBtn.textContent = 'Processing...';
                        submitBtn.disabled = true;
                    }
                    
                    const config = await window.OsliraConfig.getConfig();
                    const session = window.OsliraAuth.getCurrentSession();
                    
                    if (!session?.access_token) {
                        throw new Error('Authentication required');
                    }
                    
                    const response = await fetch(`${config.workerUrl}/analyze/single`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            username: username?.trim(),
                            analysis_type: analysisType
                        })
                    });
                    
                    if (response.ok) {
                        this.showAlert('Analysis started! Results will appear in your dashboard.', 'success');
                        this.closeModal('analysisModal');
                        
                        if (this.app?.refreshLeads) {
                            setTimeout(() => this.app.refreshLeads(), 2000);
                        }
                    } else {
                        const errorText = await response.text();
                        throw new Error(errorText || `Server error: ${response.status}`);
                    }
                    
                } catch (error) {
                    console.error('❌ [Dashboard] Analysis submission failed:', error);
                    this.showAlert(error.message || 'Analysis failed. Please try again.', 'error');
                } finally {
                    if (submitBtn) {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
                }
            },
            
            // Lead Management
            deleteLead: (leadId) => {
                console.log('🗑️ [Dashboard] Global deleteLead called with:', leadId);
                try {
                    if (this.app?.deleteLead) {
                        return this.app.deleteLead(leadId);
                    }
                    console.warn('❌ [Dashboard] deleteLead not available in app');
                } catch (error) {
                    console.error('❌ [Dashboard] deleteLead failed:', error);
                }
            },
            
            selectLead: (checkbox) => {
                try {
                    if (this.app?.selectLead) {
                        return this.app.selectLead(checkbox);
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] selectLead failed:', error);
                }
            },
            
            toggleAllLeads: (masterCheckbox) => {
                try {
                    if (this.app?.toggleAllLeads) {
                        return this.app.toggleAllLeads(masterCheckbox);
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] toggleAllLeads failed:', error);
                }
            },
            
            // Filtering and Search
            filterLeads: (filter) => {
                try {
                    if (this.app?.filterLeads) {
                        return this.app.filterLeads(filter);
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] filterLeads failed:', error);
                }
            },
            
            searchLeads: (term) => {
                try {
                    if (this.app?.searchLeads) {
                        return this.app.searchLeads(term);
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] searchLeads failed:', error);
                }
            },
            
            // Bulk Operations
            processBulkUpload: () => {
                console.log('📁 [Dashboard] Global processBulkUpload called');
                try {
                    if (this.app?.processBulkUpload) {
                        return this.app.processBulkUpload();
                    }
                    console.warn('❌ [Dashboard] processBulkUpload not available in app');
                } catch (error) {
                    console.error('❌ [Dashboard] processBulkUpload failed:', error);
                }
            },
            
            // Utility Methods
            showAlert: (message, type = 'info') => {
                if (window.Alert) {
                    switch (type) {
                        case 'error':
                            window.Alert.error(message);
                            break;
                        case 'success':
                            window.Alert.success(message);
                            break;
                        default:
                            window.Alert.info(message);
                    }
                } else {
                    alert(message);
                }
            },
            
            refreshData: async () => {
                console.log('🔄 [Dashboard] Global refreshData called');
                try {
                    if (this.app?.refreshLeads) {
                        await this.app.refreshLeads();
                        console.log('✅ [Dashboard] Data refreshed');
                    } else {
                        console.warn('❌ [Dashboard] refreshLeads not available');
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] refreshData failed:', error);
                }
            },
            
            // Debug utilities
            debug: () => {
                console.group('🐛 [Dashboard] Debug Info');
                console.log('Initialized:', this.initialized);
                console.log('Has app:', !!this.app);
                console.log('App initialized:', this.app?.initialized);
                console.log('Container:', {
                    exists: !!this.app?.container,
                    moduleCount: this.app?.container ? this.app.container.list().length : 0
                });
                
                if (this.app?.container) {
                    console.log('Modules:', this.app.container.list());
                    console.log('Container state:', {
                        modalManager: !!this.app.container.get('modalManager'),
                        businessManager: !!this.app.container.get('businessManager'),
                        leadManager: !!this.app.container.get('leadManager')
                    });
                }
                console.groupEnd();
                
                if (this.app?.debugDashboard) {
                    return this.app.debugDashboard();
                }
            },
            
            debugDashboard: () => {
                console.log('🐛 [Dashboard] Debug info:', {
                    app: !!this.app,
                    appMethods: this.app ? Object.keys(this.app) : [],
                    container: !!this.app?.container,
                    modules: this.app?.container ? {
                        modalManager: !!this.app.container.get('modalManager'),
                        businessManager: !!this.app.container.get('businessManager'),
                        leadManager: !!this.app.container.get('leadManager')
                    } : 'No container'
                });
                
                if (this.app?.debugDashboard) {
                    return this.app.debugDashboard();
                }
            },
            
            // Internal reference for advanced usage
            _app: this.app,
            _initializer: this
        };
        
        // Expose debugging utilities
        if (this.app?.container) {
            window.debugUtils = {
                analysisQueue: this.app.container.get('analysisQueue'),
                modalManager: this.app.container.get('modalManager'),
                businessManager: this.app.container.get('businessManager'),
                leadManager: this.app.container.get('leadManager'),
                stateManager: this.app.container.get('stateManager')
            };
            console.log('🐛 [Dashboard] Debug utilities exposed as window.debugUtils');
        }
        
        console.log('✅ [Dashboard] Global compatibility established');
    }
    
    handleInitializationError(error) {
        console.error('💥 [Dashboard] Critical initialization error:', error);
        
        const errorContainer = document.createElement('div');
        errorContainer.className = 'dashboard-error';
        errorContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            text-align: center;
            z-index: 10000;
        `;
        errorContainer.innerHTML = `
            <div class="error-content">
                <h2 style="color: #ef4444; font-size: 24px; margin-bottom: 16px;">⚠️ Dashboard Loading Error</h2>
                <p style="color: #6b7280; margin-bottom: 12px;">The dashboard failed to initialize properly.</p>
                <p style="color: #374151; font-size: 14px; margin-bottom: 24px;"><strong>Error:</strong> ${error.message}</p>
                <div class="error-actions" style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="window.location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                        🔄 Reload Page
                    </button>
                    <button onclick="window.location.href='${window.OsliraEnv.getAuthUrl()}'" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                        🔐 Return to Login
                    </button>
                </div>
            </div>
        `;
        
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.innerHTML = '';
            dashboard.appendChild(errorContainer);
        } else {
            document.body.appendChild(errorContainer);
        }
    }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

const dashboardInitializer = new DashboardInitializer();

const startDashboard = async () => {
    try {
        console.log('📄 [Dashboard] Dashboard initializer ready');
        
        window.addEventListener('oslira:timing:ready', () => {
            console.log('📄 [Dashboard] TimingManager ready, dashboard can proceed');
        });
        
        // Polling with shorter interval for faster response
        console.log('📄 [Dashboard] Setting up dependency polling...');
const pollForDependencies = setInterval(async () => {
    if (window.OsliraAuth && !dashboardInitializer.initialized) {
                console.log('📄 [Dashboard] Dependencies detected via polling, initializing...');
                clearInterval(pollForDependencies);
                await dashboardInitializer.init();
            }
        }, 100);
        
        // Cleanup timeout after 10 seconds
        setTimeout(() => {
            clearInterval(pollForDependencies);
            if (!dashboardInitializer.initialized) {
                console.log('📄 [Dashboard] Polling timeout reached without initialization');
            }
        }, 10000);
        
    } catch (error) {
        console.error('❌ [Dashboard] Failed to start dashboard:', error);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDashboard);
} else {
    startDashboard();
}

window.dashboardInitializer = dashboardInitializer;
console.log('📄 [Dashboard] Module loaded');
