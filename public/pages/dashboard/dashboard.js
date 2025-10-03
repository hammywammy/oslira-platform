//public/pages/dashboard/dashboard.js

// =============================================================================
// DASHBOARD.JS - Event-Driven Initialization System
// Waits for script-loader completion via 'oslira:scripts:loaded' event
// =============================================================================

class DashboardInitializer {
    constructor() {
        this.initialized = false;
        this.app = null;
        this.initTimeout = null;
    }
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [Dashboard] Already initialized');
            return this;
        }
        
        try {
            console.log('🚀 [Dashboard] Starting initialization...');
            
            // Wait for config to be loaded
            console.log('⏳ [Dashboard] Waiting for config to be ready...');
            await window.OsliraEnv.ready();
            console.log('✅ [Dashboard] Config ready, proceeding with initialization');
            
            // Verify all required modules are loaded
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
        
        // All modules should be loaded by script-loader at this point
        const missing = requiredModules.filter(module => !window[module]);
        
        if (missing.length > 0) {
            throw new Error(`Required modules not loaded: ${missing.join(', ')}`);
        }
        
        console.log('✅ [Dashboard] All required modules verified');
    }
    
    async initializeApp() {
        console.log('📱 [Dashboard] Initializing dashboard app...');
        
        try {
            // Wait for OsliraAuth
            if (!window.OsliraAuth) {
                throw new Error('OsliraAuth not available');
            }

            // Restore session from URL if present
            await window.OsliraAuth.restoreSessionFromUrl();

            // Initialize auth (will pick up restored session)
            await window.OsliraAuth.initialize();

            const user = window.OsliraAuth.user;

            if (!user) {
                console.log('❌ [Dashboard] No authenticated user, redirecting to auth');
                window.location.href = window.OsliraEnv.getAuthUrl();
                return;
            }
            
            // Create compatibility layer for OsliraAuth if needed
            if (!window.osliraAuth) {
                window.osliraAuth = window.OsliraAuth;
                console.log('✅ [Dashboard] OsliraAuth compatibility layer created');
            }
            
            // Create and initialize dashboard app
            this.app = new window.DashboardApp();
            await this.app.init();
            
            // Set global analysisQueue reference for backwards compatibility
            if (this.app.container) {
                const queue = this.app.container.get('analysisQueue');
                if (queue) {
                    window.analysisQueue = queue;
                    console.log('✅ [Dashboard] Global analysisQueue reference set');
                }
            }
            
            console.log('✅ [Dashboard] App initialized successfully');
            
        } catch (error) {
            console.error('❌ [Dashboard] App initialization failed:', error);
            throw error;
        }
    }
    
    async initializeSidebar() {
        console.log('📐 [Dashboard] Initializing modular sidebar...');
        
        if (window.SidebarManager) {
            try {
                const sidebarManager = new window.SidebarManager();
                await sidebarManager.init();
                window.sidebar = sidebarManager;
                console.log('✅ [Dashboard] Sidebar initialized successfully');
            } catch (error) {
                console.error('❌ [Dashboard] Sidebar initialization failed:', error);
                // Non-critical, continue initialization
            }
        } else {
            console.warn('⚠️ [Dashboard] SidebarManager not available');
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
                        
                        console.log('✅ [Dashboard] Analysis modal opened');
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] showAnalysisModal failed:', error);
                }
            },
            
            showBulkModal: () => {
                console.log('📁 [Dashboard] Global showBulkModal called');
                try {
                    const modal = document.getElementById('bulkModal');
                    if (modal) {
                        modal.style.display = 'flex';
                        console.log('✅ [Dashboard] Bulk modal opened');
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] showBulkModal failed:', error);
                }
            },
            
            closeModal: (modalId) => {
                console.log('❌ [Dashboard] Global closeModal called with:', modalId);
                try {
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.style.display = 'none';
                        console.log(`✅ [Dashboard] Modal ${modalId} closed`);
                    }
                } catch (error) {
                    console.error('❌ [Dashboard] closeModal failed:', error);
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
                
                if (this.app?.debug) {
                    return this.app.debug();
                }
            }
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
                    <button onclick="window.location.href='${window.OsliraEnv?.getAuthUrl ? window.OsliraEnv.getAuthUrl() : '/'}'" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
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
// AUTO-INITIALIZATION - Event-Driven Approach
// =============================================================================

const dashboardInitializer = new DashboardInitializer();

const startDashboard = () => {
    console.log('📄 [Dashboard] Dashboard initializer ready');
    
    // Listen for script-loader completion event
    window.addEventListener('oslira:scripts:loaded', async (event) => {
        if (dashboardInitializer.initialized) {
            console.log('⚠️ [Dashboard] Already initialized, ignoring event');
            return;
        }
        
        console.log('📄 [Dashboard] Scripts loaded event received:', event.detail);
        
        // Clear any existing timeout
        if (dashboardInitializer.initTimeout) {
            clearTimeout(dashboardInitializer.initTimeout);
        }
        
        try {
            await dashboardInitializer.init();
        } catch (error) {
            console.error('❌ [Dashboard] Failed to initialize:', error);
        }
    }, { once: true }); // Only listen once
    
    // Fallback: If event already fired before this listener was added
    setTimeout(() => {
        if (!dashboardInitializer.initialized && window.OsliraAuth) {
            console.log('📄 [Dashboard] Event missed, checking dependencies directly...');
            dashboardInitializer.init().catch(error => {
                console.error('❌ [Dashboard] Fallback initialization failed:', error);
            });
        }
    }, 1000);
    
    // Safety timeout: force initialization after 10 seconds
    dashboardInitializer.initTimeout = setTimeout(() => {
        if (!dashboardInitializer.initialized) {
            console.warn('⚠️ [Dashboard] Timeout reached, attempting forced initialization...');
            dashboardInitializer.init().catch(error => {
                console.error('❌ [Dashboard] Forced initialization failed:', error);
            });
        }
    }, 10000);
};

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDashboard);
} else {
    startDashboard();
}

window.dashboardInitializer = dashboardInitializer;
console.log('📄 [Dashboard] Module loaded');
