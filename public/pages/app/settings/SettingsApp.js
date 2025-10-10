// =============================================================================
// SETTINGS APP - New Loader.js System Integration
// Path: /public/pages/app/settings/SettingsApp.js
// =============================================================================

class SettingsApp {
    constructor() {
        this.isInitialized = false;
        this.components = {};
        console.log('🎯 [SettingsApp] Instance created');
    }
    
    // =========================================================================
    // MAIN INITIALIZATION
    // =========================================================================
    
    async init() {
        try {
            console.log('🚀 [SettingsApp] Starting initialization...');
            
            // Wait for scripts to load
            window.addEventListener('oslira:scripts:loaded', async () => {
                await this.initialize();
            });
            
        } catch (error) {
            console.error('❌ [SettingsApp] Initialization failed:', error);
        }
    }
    
    async initialize() {
        console.log('⚙️ [SettingsApp] Initializing components...');
        
        try {
            // Step 1: Initialize sidebar (AppSidebar loads automatically)
            await this.initializeSidebar();
            
            // Step 2: Initialize settings navigation (tabs)
            await this.initializeSettingsTabs();
            
            // Step 3: Mark as initialized
            this.isInitialized = true;
            console.log('✅ [SettingsApp] Initialization complete');
            
        } catch (error) {
            console.error('❌ [SettingsApp] Initialization failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // SIDEBAR INITIALIZATION
    // =========================================================================
    
    async initializeSidebar() {
        console.log('📱 [SettingsApp] Initializing sidebar...');
        
        // Wait for SidebarManager to be available
        let attempts = 0;
        while (!window.SidebarManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.SidebarManager) {
            throw new Error('SidebarManager not loaded');
        }
        
        // Create sidebar instance
        this.components.sidebar = new window.SidebarManager();
        await this.components.sidebar.init();
        
        // Set active menu item
        this.components.sidebar.setActiveMenuItem('settings');
        
        console.log('✅ [SettingsApp] Sidebar initialized');
    }
    
    // =========================================================================
    // SETTINGS TABS INITIALIZATION
    // =========================================================================
    
    async initializeSettingsTabs() {
        console.log('🔧 [SettingsApp] Initializing settings tabs...');
        
        // Highlight active tab based on current path
        this.setActiveTab();
        
        // Initialize tab click handlers
        const tabs = document.querySelectorAll('.settings-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = tab.getAttribute('data-nav');
                if (target && window.OsliraNav) {
                    window.OsliraNav.navigateTo(target);
                }
            });
        });
        
        console.log('✅ [SettingsApp] Settings tabs initialized');
    }
    
    setActiveTab() {
        const currentPath = window.location.pathname;
        const tabs = document.querySelectorAll('.settings-tab');
        
        tabs.forEach(tab => {
            const target = tab.getAttribute('data-nav');
            
            if (target) {
                // Get URL for target
                const url = window.OsliraNav?.getUrl(target);
                
                // Check if current path matches
                if (url && currentPath.includes(new URL(url).pathname)) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            }
        });
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.SettingsApp = new SettingsApp();
window.SettingsApp.init();

console.log('✅ [SettingsApp] Loaded and auto-initialized');
