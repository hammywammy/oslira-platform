// =============================================================================
// SETTINGS NAVIGATION - LIGHTWEIGHT SIDEBAR INTEGRATION
// =============================================================================

class SettingsNav {
    constructor() {
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [SettingsNav] Already initialized');
            return;
        }
        
        console.log('🔧 [SettingsNav] Initializing...');
        
        try {
            // Initialize sidebar
            await this.initializeSidebar();
            
            // Set active tab based on current path
            this.setActiveTab();
            
            // Listen for sidebar collapse
            this.setupSidebarListener();
            
            this.initialized = true;
            console.log('✅ [SettingsNav] Initialization complete');
            
        } catch (error) {
            console.error('❌ [SettingsNav] Initialization failed:', error);
        }
    }
    
    async initializeSidebar() {
        try {
            console.log('📋 [SettingsNav] Initializing sidebar...');
            
            let attempts = 0;
            while (!window.sidebarManager && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (window.sidebarManager) {
                await window.sidebarManager.render('#sidebar-container');
                window.sidebarManager.setActiveMenuItem('settings');
                console.log('✅ [SettingsNav] Sidebar initialized');
            }
            
        } catch (error) {
            console.error('❌ [SettingsNav] Sidebar failed:', error);
        }
    }
    
    setActiveTab() {
        const currentPath = window.location.pathname;
        const tabs = document.querySelectorAll('.settings-tab');
        
        tabs.forEach(tab => {
            const href = tab.getAttribute('href');
            if (href && currentPath.includes(href)) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }
    
    setupSidebarListener() {
        // Listen for sidebar collapse events
        window.addEventListener('sidebar:collapsed', () => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.classList.add('sidebar-collapsed');
            }
        });
        
        window.addEventListener('sidebar:expanded', () => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.classList.remove('sidebar-collapsed');
            }
        });
    }
}

// =============================================================================
// EXPORT TO WINDOW (Bootstrap system will instantiate)
// =============================================================================
window.SettingsNav = SettingsNav;
console.log('✅ [SettingsNav] Module loaded and ready');
