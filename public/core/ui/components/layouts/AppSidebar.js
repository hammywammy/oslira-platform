// =============================================================================
// SIDEBAR MANAGER - Enterprise Architecture (UPDATED FOR FLEXBOX)
// Path: /public/core/ui/components/layouts/AppSidebar.js
// Dependencies: OsliraAuth, OsliraEnv, EventBus (auto-loaded)
// =============================================================================

class SidebarManager {
    constructor() {
        this.isCollapsed = false;
        this.user = null;
        this.businesses = [];
        this.sidebar = null;
        this.sidebarContainer = null;
        this.mainContent = null;
        
        console.log('🚀 [SidebarManager] Initializing...');
    }

    // =========================================================================
    // PUBLIC API - RENDER METHOD
    // =========================================================================

    async render(container = '#sidebar-container') {
        try {
            console.log('🎨 [SidebarManager] Rendering sidebar...');
            
            // Wait for container (up to 2 seconds)
            let targetElement = typeof container === 'string' 
                ? document.querySelector(container)
                : container;

            if (!targetElement && typeof container === 'string') {
                console.log('🔍 [SidebarManager] Waiting for container:', container);
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 20;
                    
                    const checkForElement = () => {
                        targetElement = document.querySelector(container);
                        attempts++;
                        
                        if (targetElement) {
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            reject(new Error(`Container element not found: ${container}`));
                        } else {
                            setTimeout(checkForElement, 100);
                        }
                    };
                    
                    checkForElement();
                });
            }

            if (!targetElement) {
                throw new Error(`Container element not found: ${container}`);
            }
            
            // Inject sidebar HTML
            targetElement.innerHTML = this.getSidebarHTML();
            
            // CRITICAL: Store reference to #sidebar-container, not .sidebar
            this.sidebarContainer = targetElement;
            this.sidebar = targetElement.querySelector('.sidebar');
            this.mainContent = document.querySelector('.main-content, [class*="content"], main');

            // Initialize all functionality
            this.initializeSidebar();

            console.log('✅ [SidebarManager] Sidebar rendered successfully');
            return this;
            
        } catch (error) {
            console.error('❌ [SidebarManager] Render failed:', error);
            throw error;
        }
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    initializeSidebar() {
        // Load saved state
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            this.isCollapsed = true;
            // CRITICAL: Toggle on #sidebar-container, not .sidebar
            if (this.sidebarContainer) {
                this.sidebarContainer.classList.add('collapsed');
            }
        }

        // Initialize components
        this.initializeToggleButton();
        this.initializeActiveNavItem();
        this.initializeCollapsibleSections();
        this.initializeAccountDropdown();
        
        console.log('✅ [SidebarManager] Sidebar initialized');
    }

    initializeActiveNavItem() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && currentPath.includes(href.split('/').pop())) {
                item.classList.add('active');
            }
        });
    }

    initializeCollapsibleSections() {
        const sectionHeaders = document.querySelectorAll('.nav-section-header-wrapper');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.nav-section');
                section.classList.toggle('section-collapsed');
            });
        });
        
        console.log('✅ [SidebarManager] Collapsible sections initialized');
    }

    initializeToggleButton() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
            console.log('✅ [SidebarManager] Toggle button initialized');
        }
    }

    initializeAccountDropdown() {
        const trigger = document.getElementById('account-trigger-btn');
        const dropdown = document.getElementById('account-dropdown');
        
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            
            document.addEventListener('click', (e) => {
                if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('open');
                }
            });
            
            console.log('✅ [SidebarManager] Account dropdown initialized');
        }
    }

    // =========================================================================
    // TOGGLE SIDEBAR (ENTERPRISE PATTERN)
    // =========================================================================

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
        
        // CRITICAL FIX: Toggle 'collapsed' class on #sidebar-container
        // NOT on .sidebar - this is the enterprise pattern
        if (this.sidebarContainer) {
            this.sidebarContainer.classList.toggle('collapsed', this.isCollapsed);
        }
        
        // Save state
        localStorage.setItem('sidebarCollapsed', this.isCollapsed.toString());
        
        // Emit event
        const eventName = this.isCollapsed ? 'sidebar:collapsed' : 'sidebar:expanded';
        window.dispatchEvent(new CustomEvent(eventName));
        
        console.log('✅ [SidebarManager] Sidebar toggled:', this.isCollapsed ? 'collapsed' : 'expanded');
    }

    // =========================================================================
    // PUBLIC UTILITIES
    // =========================================================================

    collapse() {
        if (!this.isCollapsed) {
            this.toggleSidebar();
        }
    }

    expand() {
        if (this.isCollapsed) {
            this.toggleSidebar();
        }
    }

    getState() {
        return {
            isCollapsed: this.isCollapsed,
            user: this.user,
            businesses: this.businesses
        };
    }

    // =========================================================================
    // HTML TEMPLATE (Unchanged)
    // =========================================================================
    
getSidebarHTML() {
    return `
        <div class="sidebar">
            <div class="sidebar-container">
                <!-- Header - CSS Grid Layout -->
                <div class="sidebar-header">
                    <!-- Toggle Button - Grid Position 1 (replaces logo) -->
                    <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" title="Toggle Sidebar">
                        <span class="sidebar-toggle-icon" role="img" aria-label="Toggle sidebar"></span>
                    </button>
                    
                    <!-- Company Name - Grid Position 2 (replaces logo text) -->
                    <span class="sidebar-company-name">Oslira</span>
                </div>
                
                <!-- Navigation -->
                <nav class="sidebar-nav">
                    <!-- Main Section -->
                    <div class="nav-section collapsible">
                        <div class="nav-section-header-wrapper" data-section="main">
                            <h4 class="nav-section-header">Main</h4>
                            <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </div>
                        <div class="nav-items">
<a href="${window.OsliraEnv.getAppUrl('/dashboard')}" 
   data-page="dashboard" 
   class="nav-item"
   data-tooltip="Dashboard">
    <span class="nav-icon">📊</span>
    <span class="nav-text">Dashboard</span>
</a>
<a href="${window.OsliraEnv.getAppUrl('/leads')}" 
   data-page="leads" 
   class="nav-item"
   data-tooltip="Lead Research">
    <span class="nav-icon">🔍</span>
    <span class="nav-text">Lead Research</span>
</a>

<a href="${window.OsliraEnv.getAppUrl('/analytics')}" 
   data-page="analytics" 
   class="nav-item"
   data-tooltip="Analytics">
    <span class="nav-icon">📈</span>
    <span class="nav-text">Analytics</span>
</a>
                        </div>
                    </div>
                    
                    <!-- Tools Section -->
                    <div class="nav-section collapsible">
                        <div class="nav-section-header-wrapper" data-section="tools">
                            <h4 class="nav-section-header">Tools</h4>
                            <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </div>
                        <div class="nav-items">
                            <a href="${window.OsliraEnv.getAppUrl('/campaigns')}" data-page="campaigns" class="nav-item">
                               data-page="campaigns" 
                               class="nav-item"
                               data-tooltip="Campaigns">
                                <span class="nav-icon">🎯</span>
                                <span class="nav-text">Campaigns</span>
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/messages')}" data-page="messages" class="nav-item">
                               data-page="messages" 
                               class="nav-item"
                               data-tooltip="Messages">
                                <span class="nav-icon">💬</span>
                                <span class="nav-text">Messages</span>
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/integrations')}" data-page="integrations" class="nav-item">
                               data-page="integrations" 
                               class="nav-item"
                               data-tooltip="Integrations">
                                <span class="nav-icon">🔌</span>
                                <span class="nav-text">Integrations</span>
                            </a>
                        </div>
                    </div>
                </nav>
                
                <!-- Account Section - Flush Design -->
                <div class="sidebar-account-section">
                    <!-- Dropdown (unchanged) -->
                    <div class="account-dropdown" id="account-dropdown">
                        <div class="account-dropdown-header">
                            <div class="account-dropdown-name">Hw Models</div>
                            <div class="account-dropdown-email">hw@example.com</div>
                        </div>
                        
                        <div class="account-dropdown-section">
                            <div class="account-section-title">Business</div>
                            <select class="dropdown-select-clean" id="business-selector">
                                <option>Personal Account</option>
                            </select>
                        </div>
                        
                        <div class="account-dropdown-section">
                            <div class="account-section-title">Credits</div>
                            <div class="credits-display-clean">0 / 25</div>
                        </div>
                        
                        <div class="account-dropdown-actions-clean">
                            <a href="${window.OsliraEnv.getAppUrl('/settings')}" class="dropdown-action-clean">Account Settings</a>
                            <button class="dropdown-action-clean logout-action">Logout</button>
                        </div>
                    </div>
                    
                    <!-- Trigger Button - Grid Layout -->
                    <button class="account-trigger" id="account-trigger-btn">
                        <div class="account-avatar">H</div>
                        <div class="account-info">
                            <div class="account-name">hwmodels14</div>
                            <div class="account-plan">Free Plan</div>
                        </div>
                        <svg class="account-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}
}

// =============================================================================
// GLOBAL INITIALIZATION
// =============================================================================

window.SidebarManager = SidebarManager;
window.sidebarManager = new SidebarManager();

console.log('✅ [SidebarManager] Module loaded and ready');

// Auto-render if container exists (for legacy compatibility)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#sidebar-container');
    if (container) {
        window.sidebarManager.render('#sidebar-container').catch(console.error);
    }
});
