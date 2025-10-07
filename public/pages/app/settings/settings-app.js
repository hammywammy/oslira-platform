// =============================================================================
// SETTINGS APP - Bootstrap System Integration
// Path: /pages/settings/settings-app.js
// Replaces: Inline initialization in settings-nav.js
// =============================================================================

class SettingsApp {
    constructor() {
        this.initialized = false;
        this.sidebar = null;
        console.log('🎯 [SettingsApp] Instance created');
    }
    
    // ═══════════════════════════════════════════════════════════
    // MAIN INITIALIZATION (Called by Orchestrator)
    // ═══════════════════════════════════════════════════════════
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [SettingsApp] Already initialized');
            return;
        }
        
        console.log('🚀 [SettingsApp] Starting initialization...');
        
        try {
            // Step 1: Initialize sidebar
            await this.initializeSidebar();
            
            // Step 2: Initialize settings navigation (tabs)
            await this.initializeSettingsNav();
            
            // Step 3: Make page visible
            document.body.style.visibility = 'visible';
            
            this.initialized = true;
            console.log('✅ [SettingsApp] Initialization complete');
            
        } catch (error) {
            console.error('❌ [SettingsApp] Initialization failed:', error);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // SIDEBAR INITIALIZATION
    // ═══════════════════════════════════════════════════════════
    
    async initializeSidebar() {
        console.log('📱 [SettingsApp] Initializing sidebar...');
        
        if (!window.SidebarManager) {
            throw new Error('SidebarManager not loaded');
        }
        
        this.sidebar = new window.SidebarManager();
        await this.sidebar.init();
        
        // Ensure sidebar doesn't auto-collapse for settings pages
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.remove('sidebar-collapsed');
        }
        
        console.log('✅ [SettingsApp] Sidebar initialized');
    }
    
    // ═══════════════════════════════════════════════════════════
    // SETTINGS NAV INITIALIZATION
    // ═══════════════════════════════════════════════════════════
    
    async initializeSettingsNav() {
        console.log('🔧 [SettingsApp] Initializing settings navigation...');
        
        // SettingsNav class handles tab highlighting and navigation
        // It should be loaded via settings-nav.js
        if (!window.SettingsNav) {
            console.warn('⚠️ [SettingsApp] SettingsNav not loaded, using basic nav');
            return;
        }
        
        const settingsNav = new window.SettingsNav();
        await settingsNav.init();
        
        // Expose globally for other components
        window.settingsNav = settingsNav;
        
        console.log('✅ [SettingsApp] Settings navigation initialized');
    }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL EXPORT (CRITICAL - Orchestrator needs this)
// ═══════════════════════════════════════════════════════════
window.SettingsApp = SettingsApp;
console.log('✅ [SettingsApp] Module loaded and ready');
