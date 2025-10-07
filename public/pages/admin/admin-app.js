//public/pages/admin/admin-app.js

// =============================================================================
// ADMIN CORE CONTROLLER
// Main orchestrator for admin panel with password gate
// =============================================================================

class AdminCore {
    constructor() {
        this.currentSection = null;
        this.sidebarManager = null;
        this.eventBus = null;
        this.sections = {};
        this.isInitialized = false;
        this.passwordVerified = false;
        
        console.log('🎯 [AdminCore] Controller initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        console.log('🚀 [AdminCore] Starting initialization...');
        
        try {
            // Step 1: Verify admin password (BLOCKS until verified)
            await this.verifyAdminPassword();
            
            // Step 2: Show page content
            this.showPageContent();
            
            // Step 3: Initialize event bus
            this.initializeEventBus();
            
            // Step 4: Initialize sidebar
            await this.initializeSidebar();
            
            // Step 5: Initialize sections
            await this.initializeSections();
            
            // Step 6: Load initial section
            await this.loadInitialSection();
            
            // Step 7: Setup global listeners
            this.setupGlobalListeners();
            
            // Hide loading, show content
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('✅ [AdminCore] Initialization complete');
            
        } catch (error) {
            console.error('❌ [AdminCore] Initialization failed:', error);
            this.showError(error.message || 'Failed to initialize admin panel');
        }
    }
    
    // =========================================================================
    // PASSWORD AUTHENTICATION
    // =========================================================================
    
    async verifyAdminPassword() {
        console.log('🔐 [AdminCore] Starting password verification...');
        
        // Check if already verified in this session
        const SESSION_KEY = 'admin_auth_' + btoa(window.location.hostname).slice(0, 8);
        const SESSION_DURATION = 8 * 60 * 60 * 1000;
        
        try {
            const authData = sessionStorage.getItem(SESSION_KEY);
            if (authData) {
                const parsed = JSON.parse(authData);
                const isExpired = Date.now() - parsed.timestamp > SESSION_DURATION;
                
                if (!isExpired && parsed.verified && parsed.isAdmin) {
                    console.log('✅ [AdminCore] Valid admin session found');
                    this.passwordVerified = true;
                    return;
                }
            }
        } catch (e) {
            sessionStorage.removeItem(SESSION_KEY);
        }
        
        // Show password prompt
        console.log('🔑 [AdminCore] Showing password prompt...');
        await this.showPasswordPrompt(SESSION_KEY);
        
        // Password verified, now check if user is admin
        console.log('🔐 [AdminCore] Checking admin privileges...');
        const isAdmin = await this.checkIsAdmin();
        
        if (!isAdmin) {
            console.error('❌ [AdminCore] User is not an admin');
            this.showAdminDeniedError();
            throw new Error('Access denied - admin privileges required');
        }
        
        // Save admin status to session
        const authData = JSON.parse(sessionStorage.getItem(SESSION_KEY));
        authData.isAdmin = true;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(authData));
        
        console.log('✅ [AdminCore] Password verified and admin confirmed');
        this.passwordVerified = true;
    }

    async checkIsAdmin() {
        try {
            const session = window.OsliraAuth.getCurrentSession();
            
            if (!session) {
                console.error('❌ [AdminCore] No user session found');
                return false;
            }
            
            const workerUrl = window.OsliraEnv?.WORKER_URL || 'https://api.oslira.com';
            const response = await fetch(`${workerUrl}/admin/validate-session`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            return result.success === true;
            
        } catch (error) {
            console.error('❌ [AdminCore] Admin check failed:', error);
            return false;
        }
    }

    showAdminDeniedError() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 48px; border-radius: 16px; text-align: center; max-width: 450px;">
                <div style="font-size: 64px; margin-bottom: 24px;">🚫</div>
                <h2 style="margin: 0 0 12px 0; color: #dc2626; font-size: 28px; font-weight: 700;">Access Denied</h2>
                <p style="margin: 0 0 32px 0; color: #64748b; font-size: 16px;">You do not have administrator privileges.</p>
                <button onclick="window.location.href='${window.OsliraEnv.getAppUrl('/dashboard')}'" 
                        style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;">
                    Return to Dashboard
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    async showPasswordPrompt(sessionKey) {
        return new Promise((resolve, reject) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
            `;
            
            overlay.innerHTML = `
                <div style="background: white; padding: 48px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); max-width: 450px; width: 90%;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
                        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 28px; font-weight: 700;">Admin Access</h2>
                        <p style="margin: 0; color: #64748b; font-size: 14px;">Enter password to continue</p>
                    </div>
                    <form id="admin-password-form" style="margin-bottom: 0;">
                        <input type="password" id="admin-password-input" placeholder="Enter admin password" style="width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 16px; margin-bottom: 16px; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'">
                        <button type="submit" id="admin-submit-btn" style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                            Access Panel
                        </button>
                        <div id="admin-password-error" style="color: #dc2626; font-size: 14px; padding: 12px; background: #fef2f2; border-radius: 8px; margin-top: 16px; display: none;"></div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            const input = document.getElementById('admin-password-input');
            const form = document.getElementById('admin-password-form');
            const errorDiv = document.getElementById('admin-password-error');
            const submitBtn = document.getElementById('admin-submit-btn');
            
            setTimeout(() => input.focus(), 100);
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = input.value.trim();
                if (!password) return;
                
                submitBtn.disabled = true;
                submitBtn.textContent = 'Verifying...';
                errorDiv.style.display = 'none';
                
                try {
                    const workerUrl = window.OsliraEnv?.WORKER_URL || 'https://api.oslira.com';
                    const response = await fetch(`${workerUrl}/admin/verify-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            password, 
                            userId: 'admin-user-' + Date.now() 
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.data?.valid) {
                        const timestamp = Date.now();
                        sessionStorage.setItem(sessionKey, JSON.stringify({
                            verified: true,
                            timestamp
                        }));
                        
                        overlay.remove();
                        resolve();
                    } else {
                        errorDiv.textContent = 'Incorrect password. Please try again.';
                        errorDiv.style.display = 'block';
                        input.value = '';
                        input.focus();
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Access Panel';
                    }
                } catch (error) {
                    console.error('❌ [AdminCore] Password verification failed:', error);
                    errorDiv.textContent = 'Verification failed. Please try again.';
                    errorDiv.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Access Panel';
                }
            });
        });
    }
    
    showPageContent() {
        const pageRoot = document.getElementById('admin-page-root');
        if (pageRoot) {
            pageRoot.style.display = 'block';
        }
    }
    
    // =========================================================================
    // EVENT BUS
    // =========================================================================
    
    initializeEventBus() {
        console.log('📡 [AdminCore] Initializing event bus...');
        
        if (!window.AdminEventBus) {
            console.log('🔧 [AdminCore] Creating AdminEventBus...');
            
            window.AdminEventBus = new EventTarget();
            
            window.AdminEventBus.emit = function(eventName, data) {
                this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
            };
            
            window.AdminEventBus.on = function(eventName, handler) {
                this.addEventListener(eventName, (e) => handler(e.detail));
            };
            
            window.AdminEventBus.off = function(eventName, handler) {
                this.removeEventListener(eventName, handler);
            };
        }
        
        this.eventBus = window.AdminEventBus;
        console.log('✅ [AdminCore] Event bus initialized');
    }
    
    // =========================================================================
    // SIDEBAR
    // =========================================================================
    
    async initializeSidebar() {
        console.log('📐 [AdminCore] Initializing sidebar...');
        
        if (window.adminSidebarManager) {
            try {
                await window.adminSidebarManager.initialize();
                this.sidebarManager = window.adminSidebarManager;
                console.log('✅ [AdminCore] Sidebar initialized');
            } catch (error) {
                console.error('❌ [AdminCore] Sidebar initialization failed:', error);
                throw error;
            }
        } else {
            console.error('❌ [AdminCore] adminSidebarManager not found');
            throw new Error('Sidebar manager not available');
        }
    }
    
    // =========================================================================
    // SECTIONS
    // =========================================================================
    
    async initializeSections() {
        console.log('📋 [AdminCore] Initializing sections...');
        
        const sectionClasses = {
            overview: window.OverviewSection,
            users: window.UsersSection,
            businesses: window.BusinessesSection,
            revenue: window.RevenueSection,
            system: window.SystemSection,
            analytics: window.AnalyticsSection,
            settings: window.AdminSettingsSection
        };
        
        for (const [id, SectionClass] of Object.entries(sectionClasses)) {
            if (SectionClass) {
                this.sections[id] = new SectionClass();
                console.log(`✅ [AdminCore] Section registered: ${id}`);
            } else {
                console.warn(`⚠️ [AdminCore] Section class not found: ${id}`);
            }
        }
        
        console.log('✅ [AdminCore] Sections initialized');
    }
    
    async loadInitialSection() {
        const hash = window.location.hash.slice(1) || 'overview';
        await this.loadSection(hash);
    }
    
    async loadSection(sectionId) {
        console.log(`🔄 [AdminCore] Loading section: ${sectionId}`);
        
        const section = this.sections[sectionId];
        if (!section) {
            console.error(`❌ [AdminCore] Section not found: ${sectionId}`);
            return;
        }
        
        const container = document.getElementById('admin-section-content');
        if (!container) {
            console.error('❌ [AdminCore] Section container not found');
            return;
        }
        
        this.currentSection = sectionId;
        
        try {
            await section.render(container);
            
            if (this.sidebarManager) {
                this.sidebarManager.setActiveSection(sectionId);
            }
            
            window.location.hash = sectionId;
            
            console.log(`✅ [AdminCore] Section loaded: ${sectionId}`);
            
        } catch (error) {
            console.error(`❌ [AdminCore] Section load failed: ${sectionId}`, error);
            container.innerHTML = `
                <div class="admin-error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Failed to Load Section</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    setupGlobalListeners() {
        window.addEventListener('hashchange', () => {
            const sectionId = window.location.hash.slice(1) || 'overview';
            this.loadSection(sectionId);
        });
        
        if (this.eventBus) {
            this.eventBus.on('admin:section:load', (data) => {
                this.loadSection(data.sectionId);
            });
            
            this.eventBus.on('admin:data:refresh', () => {
                this.refreshCurrentSection();
            });
        }
    }
    
    hideLoading() {
        const loadingEl = document.getElementById('admin-loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    }
    
    showError(message) {
        const loadingEl = document.getElementById('admin-loading');
        const errorEl = document.getElementById('admin-error');
        const errorMessageEl = document.getElementById('admin-error-message');
        
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
        if (errorMessageEl) {
            errorMessageEl.textContent = message;
        }
    }
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `admin-toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    getSection(sectionId) {
        return this.sections[sectionId];
    }
    
    getCurrentSection() {
        return this.currentSection;
    }
    
    refreshCurrentSection() {
        if (this.currentSection) {
            this.loadSection(this.currentSection);
        }
    }
}

// =============================================================================
// ADMIN APP - BOOTSTRAP WRAPPER
// =============================================================================

class AdminApp {
    constructor() {
        this.core = null;
        this.initialized = false;
        console.log('🎯 [AdminApp] Instance created');
    }
    
    async init() {
        try {
            console.log('🚀 [AdminApp] Starting initialization...');
            
            // Wait for config
            await window.OsliraEnv.ready();
            console.log('✅ [AdminApp] Config ready');
            
            // Create and initialize admin core
            this.core = new AdminCore();
            await this.core.initialize();
            
            this.initialized = true;
            console.log('✅ [AdminApp] Admin panel ready');
            
            // Make page visible (both body AND admin-page-root)
document.body.style.visibility = 'visible';

const pageRoot = document.getElementById('admin-page-root');
if (pageRoot) {
    pageRoot.style.display = 'block';
}
            
        } catch (error) {
            console.error('❌ [AdminApp] Initialization failed:', error);
            this.showError(error.message || 'Failed to initialize admin panel');
            throw error;
        }
    }
    
    showError(message) {
        const loadingEl = document.getElementById('admin-loading');
        const errorEl = document.getElementById('admin-error');
        const errorMessageEl = document.getElementById('admin-error-message');
        
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
        if (errorMessageEl) {
            errorMessageEl.textContent = message;
        }
        
        document.body.style.visibility = 'visible';
    }
}

// Export for orchestrator
window.AdminApp = AdminApp;
console.log('✅ [AdminApp] Module loaded and ready');
