//public/pages/settings/settings.js

/**
 * SETTINGS PAGE INITIALIZATION
 * Claude-style settings with hash-based navigation
 */
class SettingsPage {
    constructor() {
        this.currentSection = 'profile';
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [Settings] Already initialized');
            return;
        }
        
        console.log('🔧 [Settings] Initializing settings page...');
        
        try {
            // Initialize sidebar
            await this.initializeSidebar();
            
            // Setup hash navigation
            this.setupHashNavigation();
            
            // Setup navigation listeners
            this.setupNavigationListeners();
            
            // Load initial section from hash
            this.loadSectionFromHash();
            
            this.initialized = true;
            console.log('✅ [Settings] Initialization complete');
            
        } catch (error) {
            console.error('❌ [Settings] Initialization failed:', error);
        }
    }
    
    async initializeSidebar() {
        try {
            console.log('📋 [Settings] Initializing sidebar...');
            
            let attempts = 0;
            while (!window.sidebarManager && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (window.sidebarManager) {
                await window.sidebarManager.render('#sidebar-container');
                window.sidebarManager.setActiveMenuItem('settings');
                console.log('✅ [Settings] Sidebar initialized');
            }
            
        } catch (error) {
            console.error('❌ [Settings] Sidebar failed:', error);
        }
    }
    
    setupHashNavigation() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.loadSectionFromHash();
        });
    }
    
    setupNavigationListeners() {
        const navItems = document.querySelectorAll('.settings-nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateToSection(section);
            });
        });
    }
    
    loadSectionFromHash() {
        const hash = window.location.hash.slice(1); // Remove #
        const section = hash || 'profile';
        this.showSection(section);
    }
    
    navigateToSection(section) {
        window.location.hash = section;
    }
    
    showSection(sectionId) {
        console.log(`📄 [Settings] Showing section: ${sectionId}`);
        
        // Update active nav item
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update visible section
        document.querySelectorAll('.settings-section').forEach(section => {
            if (section.id === `${sectionId}-section`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        
        this.currentSection = sectionId;
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Wait for DOM and scripts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
} else {
    initSettings();
}

async function initSettings() {
    console.log('🚀 [Settings] Starting initialization...');
    
    try {
        // Wait for OsliraAuth
        let attempts = 0;
        while (!window.OsliraAuth?.isLoaded && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.OsliraAuth?.user) {
            console.error('❌ [Settings] User not authenticated');
            window.location.href = window.OsliraEnv.getAuthUrl();
            return;
        }
        
        // Initialize settings page
        const settingsPage = new SettingsPage();
        await settingsPage.init();
        
        // Expose globally
        window.settingsPage = settingsPage;
        
    } catch (error) {
        console.error('❌ [Settings] Failed to initialize:', error);
    }
}

console.log('✅ [Settings] Module loaded');
