// =============================================================================
// ADMIN CORE CONTROLLER
// Main orchestrator for admin panel
// =============================================================================

class AdminCore {
    constructor() {
        this.currentSection = null;
        this.sidebarManager = null;
        this.eventBus = null;
        this.sections = {};
        this.isInitialized = false;
        
        console.log('🎯 [AdminCore] Controller initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        console.log('🚀 [AdminCore] Starting initialization...');
        
        try {
            // Step 1: Verify admin access
            await this.verifyAdminAccess();
            
            // Step 2: Initialize event bus
            this.initializeEventBus();
            
            // Step 3: Initialize sidebar
            await this.initializeSidebar();
            
            // Step 4: Initialize sections
            await this.initializeSections();
            
            // Step 5: Load initial section
            await this.loadInitialSection();
            
            // Step 6: Setup global listeners
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
    // AUTHENTICATION
    // =========================================================================
    
async verifyAdminAccess() {
    console.log('🔐 [AdminCore] Verifying admin access...');
    
    // Guard already verified everything, just check flag
    if (!window.ADMIN_AUTHORIZED) {
        console.warn('⚠️ [AdminCore] ADMIN_AUTHORIZED flag not set - guard may not have run');
        throw new Error('Admin guard did not authorize access');
    }
    
    console.log('✅ [AdminCore] Admin access verified');
}
    
    // =========================================================================
    // EVENT BUS
    // =========================================================================
    
    initializeEventBus() {
        if (!window.AdminEventBus) {
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
    
    // Wait for sidebar script to load
    let attempts = 0;
    while (!window.AdminSidebarManager && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.AdminSidebarManager) {
        throw new Error('AdminSidebarManager not loaded after timeout');
    }
    
    this.sidebarManager = new window.AdminSidebarManager();
    await this.sidebarManager.initialize();
    
    console.log('✅ [AdminCore] Sidebar initialized');
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
        const contentEl = document.getElementById('admin-section-content');
        
        if (loadingEl) loadingEl.classList.add('hidden');
        if (contentEl) contentEl.classList.remove('hidden');
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
// INITIALIZATION
// =============================================================================

window.addEventListener('oslira:scripts:loaded', async () => {
    try {
        console.log('🚀 [Admin] Scripts loaded, initializing admin panel...');
        
        // Wait for config
        await window.OsliraEnv.ready();
        
        // Create and initialize admin core
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
