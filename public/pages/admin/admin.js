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
        // Get current user session
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
            // Create password overlay
            const overlay = document.createElement('div');
            overlay.id = 'admin-password-overlay';
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
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            overlay.innerHTML = `
                <div style="background: white; padding: 48px; border-radius: 16px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); text-align: center; max-width: 450px; width: 90%;">
                    <div style="font-size: 64px; margin-bottom: 24px;">🔐</div>
                    <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 28px; font-weight: 700;">Admin Panel Access</h2>
                    <p style="margin: 0 0 32px 0; color: #64748b; font-size: 16px;">Enter the admin password to continue.</p>
                    <form id="admin-password-form">
                        <input type="password" id="admin-password-input" placeholder="Enter password" 
                               style="width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 16px; margin-bottom: 16px; box-sizing: border-box;" 
                               required autocomplete="off" />
                        <button type="submit" id="admin-submit-btn"
                                style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;">
                            Access Panel
                        </button>
                    </form>
                    <div id="admin-password-error" style="color: #dc2626; font-size: 14px; padding: 12px; background: #fef2f2; border-radius: 8px; margin-top: 16px; display: none;"></div>
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
// Save session
const timestamp = Date.now();
sessionStorage.setItem(sessionKey, JSON.stringify({
    verified: true,
    timestamp
}));
                        
                        // Remove overlay
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
    
    // Create AdminEventBus inline if not exists
    if (!window.AdminEventBus) {
        console.log('🔧 [AdminCore] Creating AdminEventBus...');
        
        window.AdminEventBus = new EventTarget();
        
        // Helper methods
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
    
    // Use global instance like dashboard does
    if (window.adminSidebarManager) {
        try {
            // Sidebar renders itself into the body (no container needed for admin)
            await window.adminSidebarManager.initialize();
            this.sidebarManager = window.adminSidebarManager;
            console.log('✅ [AdminCore] Sidebar initialized successfully');
        } catch (error) {
            console.error('❌ [AdminCore] Sidebar initialization failed:', error);
            throw error;
        }
    } else {
        console.error('❌ [AdminCore] adminSidebarManager not available');
        throw new Error('AdminSidebarManager not loaded');
    }
}
    
    // =========================================================================
    // SECTIONS
    // =========================================================================
    
    async initializeSections() {
        console.log('📦 [AdminCore] Initializing sections...');
        
        // Register all available sections
        const sectionClasses = {
            'overview': window.OverviewSection,
            'users': window.UsersSection,
            'businesses': window.BusinessesSection,
            'revenue': window.RevenueSection,
            'usage': window.UsageSection,
            'system': window.SystemSection,
            'leads': window.LeadsSection
        };
        
        for (const [sectionId, SectionClass] of Object.entries(sectionClasses)) {
            if (SectionClass) {
                this.sections[sectionId] = new SectionClass(this.eventBus);
                console.log(`✅ [AdminCore] Registered section: ${sectionId}`);
            } else {
                console.warn(`⚠️ [AdminCore] Section not loaded: ${sectionId}`);
            }
        }
    }
    
    async loadInitialSection() {
        const initialSection = this.sidebarManager.getActiveSection();
        await this.loadSection(initialSection);
    }
    
    async loadSection(sectionId) {
        console.log(`📍 [AdminCore] Loading section: ${sectionId}`);
        
        const section = this.sections[sectionId];
        
        if (!section) {
            console.error(`❌ [AdminCore] Section not found: ${sectionId}`);
            this.showError(`Section "${sectionId}" not available`);
            return;
        }
        
        try {
            // Hide current section
            if (this.currentSection) {
                const currentSectionElement = document.getElementById(`admin-section-${this.currentSection}`);
                if (currentSectionElement) {
                    currentSectionElement.classList.add('hidden');
                }
            }
            
            // Check if section already rendered
            let sectionElement = document.getElementById(`admin-section-${sectionId}`);
            
            if (!sectionElement) {
                // Render section for first time
                const container = document.getElementById('admin-section-content');
                sectionElement = document.createElement('div');
                sectionElement.id = `admin-section-${sectionId}`;
                sectionElement.className = 'admin-section';
                container.appendChild(sectionElement);
                
                // Initialize section
                await section.initialize(sectionElement);
            } else {
                // Refresh existing section
                await section.refresh();
            }
            
            // Show section
            sectionElement.classList.remove('hidden');
            
            this.currentSection = sectionId;
            
            console.log(`✅ [AdminCore] Section loaded: ${sectionId}`);
            
        } catch (error) {
            console.error(`❌ [AdminCore] Failed to load section ${sectionId}:`, error);
            this.showError(`Failed to load ${sectionId} section: ${error.message}`);
        }
    }
    
    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    
    setupGlobalListeners() {
        // Listen for section changes
        window.addEventListener('admin:section-changed', (e) => {
            this.loadSection(e.detail.section);
        });
        
        // Listen for data refresh requests
        this.eventBus.on('admin:refresh-section', (data) => {
            if (data.section) {
                this.loadSection(data.section);
            } else if (this.currentSection) {
                this.loadSection(this.currentSection);
            }
        });
        
        // Listen for toast notifications
        this.eventBus.on('admin:show-toast', (data) => {
            this.showToast(data.message, data.type || 'info');
        });
        
        console.log('✅ [AdminCore] Global listeners setup');
    }
    
    // =========================================================================
    // UI HELPERS
    // =========================================================================
    
hideLoading() {
    const loadingEl = document.getElementById('admin-loading');
    const pageRoot = document.getElementById('admin-page-root');
    
    if (loadingEl) loadingEl.classList.add('hidden');
    if (pageRoot) pageRoot.style.display = 'block';
}
    
    showError(message) {
        const loadingEl = document.getElementById('admin-loading');
        const contentEl = document.getElementById('admin-section-content');
        const errorEl = document.getElementById('admin-error');
        const errorMessageEl = document.getElementById('admin-error-message');
        
        if (loadingEl) loadingEl.classList.add('hidden');
        if (contentEl) contentEl.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
        if (errorMessageEl) errorMessageEl.textContent = message;
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('admin-toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `admin-toast admin-toast-${type}`;
        
        const icon = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[type] || 'ℹ️';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    // =========================================================================
    // UTILITY METHODS
    // =========================================================================
    
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
// INITIALIZATION - SAME PATTERN AS DASHBOARD
// =============================================================================

window.addEventListener('oslira:scripts:loaded', async () => {
    try {
        console.log('🚀 [Admin] Scripts loaded, initializing admin panel...');
        
        // Wait for config to be ready
        console.log('⏳ [Admin] Waiting for config...');
        await window.OsliraEnv.ready();
        console.log('✅ [Admin] Config ready');
        
        // Create and initialize admin core (will handle password prompt)
        window.AdminCore = new AdminCore();
        await window.AdminCore.initialize();
        
        console.log('✅ [Admin] Admin panel ready');
        
    } catch (error) {
        console.error('❌ [Admin] Initialization failed:', error);
        
        // Show error state
        const loadingEl = document.getElementById('admin-loading');
        const errorEl = document.getElementById('admin-error');
        const errorMessageEl = document.getElementById('admin-error-message');
        
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
        if (errorMessageEl) {
            errorMessageEl.textContent = error.message || 'Failed to initialize admin panel';
        }
    }
});

console.log('📦 [Admin] Core module loaded');
