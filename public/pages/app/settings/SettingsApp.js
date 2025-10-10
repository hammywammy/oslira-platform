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
            // Step 1: Wait for sidebar to auto-render (it does this automatically)
            await this.waitForSidebar();
            
            // Step 2: Configure sidebar for settings
            await this.configureSidebar();
            
            // Step 3: Initialize settings navigation (tabs)
            await this.initializeSettingsTabs();
            
            // Step 4: Mark as initialized
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
    
    async waitForSidebar() {
        console.log('📱 [SettingsApp] Waiting for sidebar...');
        
        // Wait for global sidebarManager instance to be available
        let attempts = 0;
        while (!window.sidebarManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.sidebarManager) {
            throw new Error('SidebarManager not available');
        }
        
        // Store reference
        this.components.sidebar = window.sidebarManager;
        
        console.log('✅ [SettingsApp] Sidebar reference obtained');
    }
    
    async configureSidebar() {
        console.log('⚙️ [SettingsApp] Configuring sidebar...');
        
        // Set active menu item to Settings
        if (this.components.sidebar.setActiveMenuItem) {
            this.components.sidebar.setActiveMenuItem('settings');
        }
        
        // Ensure sidebar is expanded for settings pages
        if (this.components.sidebar.isCollapsed) {
            this.components.sidebar.expand();
        }
        
        console.log('✅ [SettingsApp] Sidebar configured');
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
