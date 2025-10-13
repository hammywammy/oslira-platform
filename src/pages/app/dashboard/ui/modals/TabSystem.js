// ===============================================================================
// TAB SYSTEM COMPONENT - Modular Tab Switching for Analysis Modals
// File: public/pages/dashboard/modules/modals/components/tab-system.js
// ===============================================================================

class TabSystem {
    constructor() {
        this.activeTab = null;
        this.tabs = [];
        this.containerId = null;
        this.onTabChange = null;
    }

    // ===============================================================================
    // INITIALIZATION
    // ===============================================================================
    
    initialize(containerId, tabs, defaultTab = null, onTabChange = null) {
        this.containerId = containerId;
        this.tabs = tabs;
        this.onTabChange = onTabChange;
        this.activeTab = defaultTab || (tabs.length > 0 ? tabs[0].id : null);
        
        this.setupEventListeners();
        this.showTab(this.activeTab);
        
        console.log('✅ [TabSystem] Initialized with tabs:', tabs.map(t => t.id));
    }

    // ===============================================================================
    // TAB SWITCHING LOGIC
    // ===============================================================================
    
    switchTab(tabId) {
        if (tabId === this.activeTab) return;
        
        const fromTab = this.activeTab;
        const toTab = tabId;
        
        // Validate tab exists
        if (!this.tabs.find(t => t.id === tabId)) {
            console.error('❌ [TabSystem] Invalid tab:', tabId);
            return;
        }

        console.log(`🔄 [TabSystem] Switching from '${fromTab}' to '${toTab}'`);
        
        // Hide current tab with animation
        this.hideTab(fromTab);
        
        // Show new tab with animation
        setTimeout(() => {
            this.activeTab = tabId;
            this.showTab(tabId);
            this.updateTabNavigation();
            
            if (this.onTabChange) {
                this.onTabChange(tabId, fromTab);
            }
        }, 150);
    }

    showTab(tabId) {
        const container = document.getElementById(`tab-content-${tabId}`);
        const navButton = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (container) {
            container.style.display = 'block';
            container.style.opacity = '0';
            container.style.transform = 'translateY(10px)';
            
            // Animate in
            setTimeout(() => {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 10);
        }
        
        if (navButton) {
            navButton.classList.add('active');
        }
    }

    hideTab(tabId) {
        const container = document.getElementById(`tab-content-${tabId}`);
        const navButton = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                container.style.display = 'none';
            }, 150);
        }
        
        if (navButton) {
            navButton.classList.remove('active');
        }
    }

    updateTabNavigation() {
        // Update all nav buttons
        this.tabs.forEach(tab => {
            const navButton = document.querySelector(`[data-tab="${tab.id}"]`);
            if (navButton) {
                navButton.classList.toggle('active', tab.id === this.activeTab);
            }
        });
    }

    // ===============================================================================
    // EVENT HANDLING
    // ===============================================================================
    
    setupEventListeners() {
        // Use event delegation for tab clicks
        document.addEventListener('click', (e) => {
            const tabButton = e.target.closest('[data-tab]');
            if (tabButton && this.containerId) {
                const container = document.getElementById(this.containerId);
                if (container && container.contains(tabButton)) {
                    const tabId = tabButton.getAttribute('data-tab');
                    this.switchTab(tabId);
                }
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.containerId) return;
            
            const container = document.getElementById(this.containerId);
            if (!container || !container.contains(document.activeElement)) return;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const currentIndex = this.tabs.findIndex(t => t.id === this.activeTab);
                const direction = e.key === 'ArrowLeft' ? -1 : 1;
                const newIndex = (currentIndex + direction + this.tabs.length) % this.tabs.length;
                this.switchTab(this.tabs[newIndex].id);
            }
        });
    }

    // ===============================================================================
    // UTILITY METHODS
    // ===============================================================================
    
    getActiveTab() {
        return this.activeTab;
    }

    getTabData(tabId) {
        return this.tabs.find(t => t.id === tabId);
    }

    destroy() {
        this.activeTab = null;
        this.tabs = [];
        this.containerId = null;
        this.onTabChange = null;
        
        console.log('🧹 [TabSystem] Destroyed');
    }

    // ===============================================================================
    // STATIC FACTORY METHODS
    // ===============================================================================
    
    static create(containerId, tabs, defaultTab = null, onTabChange = null) {
        const tabSystem = new TabSystem();
        tabSystem.initialize(containerId, tabs, defaultTab, onTabChange);
        return tabSystem;
    }
}

// ===============================================================================
// GLOBAL AVAILABILITY
// ===============================================================================

if (typeof window !== 'undefined') {
    window.TabSystem = TabSystem;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabSystem;
}
