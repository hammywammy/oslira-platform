// =============================================================================
// SIDEBAR MANAGER - PRODUCTION READY COMPONENT
// Core sidebar navigation system with proper width control and state management
// =============================================================================

class SidebarManager {
    constructor() {
        this.isCollapsed = false;
        this.user = null;
        this.sidebar = null;
        this.mainContent = null;
        
        console.log('🚀 [SidebarManager] Initializing...');
    }

    async handleLogout() {
    console.log('🔐 [SidebarManager] Logging out user...');
    
    try {
        // Show loading state on button
        const logoutBtn = document.querySelector('.sidebar-user-button');
        if (logoutBtn) {
            logoutBtn.disabled = true;
            logoutBtn.textContent = 'Signing out...';
        }
        
        // Use OsliraAuth for logout
        if (window.OsliraAuth) {
            await window.OsliraAuth.signOut();
            console.log('✅ [SidebarManager] User signed out successfully');
            
            // Redirect to home page
            window.location.href = '/';
        } else {
            console.error('❌ [SidebarManager] OsliraAuth not available');
            throw new Error('Authentication system not available');
        }
    } catch (error) {
        console.error('❌ [SidebarManager] Logout failed:', error);
        
        // Reset button state on error
        const logoutBtn = document.querySelector('.sidebar-user-button');
        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.textContent = 'Sign out';
        }
        
        // Show error message
        if (window.Alert && window.Alert.error) {
            window.Alert.error('Failed to sign out. Please try again.');
        }
    }
}
    // =========================================================================
    // PUBLIC API - CORE METHODS
    // =========================================================================

    async render(container = '#sidebar-container') {
        try {
            console.log('🎨 [SidebarManager] Rendering sidebar...');
            
            // Wait for container to exist if it's not found immediately
            let targetElement = typeof container === 'string' 
                ? document.querySelector(container)
                : container;

            if (!targetElement && typeof container === 'string') {
                // Wait up to 2 seconds for container to appear
                console.log('🔍 [SidebarManager] Waiting for container:', container);
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 20; // 2 seconds at 100ms intervals
                    
                    const checkForElement = () => {
                        targetElement = document.querySelector(container);
                        attempts++;
                        
                        if (targetElement) {
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            reject(new Error(`Container element not found after waiting: ${container}`));
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
            
            // Apply sidebar classes and inject HTML
            targetElement.className = 'sidebar';
            targetElement.innerHTML = this.getSidebarHTML();

            // Store references
            this.sidebar = targetElement;
            this.mainContent = document.querySelector('.main-content, [class*="content"], main');
            
            // Create external toggle
            this.createExternalToggle();

            // Initialize functionality
            this.initializeSidebar();

            console.log('✅ [SidebarManager] Sidebar rendered successfully');
            return this;
            
        } catch (error) {
            console.error('❌ [SidebarManager] Render failed:', error);
            throw error;
        }
    }
    async loadBusinessProfiles() {
    console.log('💼 [SidebarManager] Loading business profiles...');
    
    try {
        // Get businesses from Supabase
        const businesses = await this.fetchBusinessProfiles();
        const selectElement = document.getElementById('sidebar-business-select');
        
        if (!selectElement) {
            console.warn('⚠️ [SidebarManager] Business select element not found');
            return;
        }
        
        // Clear any existing options
        selectElement.innerHTML = '';
        
        if (!businesses || businesses.length === 0) {
            // If no businesses, show a message
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No businesses found';
            option.disabled = true;
            selectElement.appendChild(option);
            selectElement.disabled = true;
            return;
        }
        
        // Add all businesses without a placeholder
        businesses.forEach((business, index) => {
            const option = document.createElement('option');
            option.value = business.id;
            option.textContent = business.business_name;
            selectElement.appendChild(option);
        });
        
        // Auto-select the first business
        if (businesses.length > 0) {
            selectElement.value = businesses[0].id;
            // Trigger the change event to load the first business
            this.handleBusinessChange({ target: selectElement });
        }
        
        console.log(`✅ [SidebarManager] Loaded ${businesses.length} business profiles`);
        
    } catch (error) {
        console.error('❌ [SidebarManager] Failed to load business profiles:', error);
    }
}

async fetchBusinessProfiles() {
    try {
        // Get current user
const user = window.OsliraAuth?.user;
if (!user) {
    console.warn('⚠️ [SidebarManager] No authenticated user');
            return [];
        }
        
        // Fetch businesses from Supabase
        const { data: businesses, error } = await window.OsliraAuth.supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return businesses || [];
        
    } catch (error) {
        console.error('❌ [SidebarManager] Failed to fetch businesses:', error);
        return [];
    }
}

handleBusinessChange(event) {
    const businessId = event.target.value;
    if (!businessId) return;
    
    console.log('🔄 [SidebarManager] Business changed to:', businessId);
    
    // Emit event for other components to react
    if (this.eventBus) {
        this.eventBus.emit('business:changed', businessId);
    }
    
    // Store selected business in localStorage for persistence
    localStorage.setItem('selectedBusinessId', businessId);
    
    // Update business manager if available
    if (window.businessManager) {
        window.businessManager.setCurrentBusiness(businessId);
    }
}
    updateSelectedBusiness(businessId) {
    const selectElement = document.getElementById('sidebar-business-select');
    if (selectElement && selectElement.value !== businessId) {
        selectElement.value = businessId;
        console.log('✅ [SidebarManager] Updated selected business in dropdown');
    }
}

updateUserInfo() {
    const user = window.OsliraAuth?.user;
    if (!user) {
        console.warn('⚠️ [SidebarManager] No user available for info update');
        return;
    }
    
    console.log('👤 [SidebarManager] Updating user info:', {
        email: user.email,
        credits: user.credits,
        plan: user.plan_type
    });
    
    // Update email
    const emailElement = document.getElementById('sidebar-email');
    if (emailElement && user.email) {
        emailElement.textContent = user.email;
    }
    
    // Update plan
    const planElement = document.getElementById('sidebar-plan');
    if (planElement && user.plan_type) {
        const planNames = {
            'free': 'Free Plan',
            'starter': 'Starter Plan',
            'pro': 'Pro Plan'
        };
        planElement.textContent = planNames[user.plan_type] || 'Free Plan';
    }
    
    // Update credits
    const creditsElement = document.getElementById('sidebar-credits');
    if (creditsElement) {
        creditsElement.textContent = user.credits !== undefined ? user.credits.toLocaleString() : '--';
    }
}
    setActiveMenuItem(pageId) {
        console.log(`🎯 [SidebarManager] Setting active menu item: ${pageId}`);
        
        // Remove active class from all menu items
        const menuItems = document.querySelectorAll('.nav-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current page
        const activeItem = document.querySelector(`[data-page="${pageId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            console.log(`✅ [SidebarManager] Active menu item set: ${pageId}`);
        } else {
            console.warn(`⚠️ [SidebarManager] Menu item not found: ${pageId}`);
        }
    }

    // =========================================================================
    // HTML TEMPLATE
    // =========================================================================

    getSidebarHTML() {
        return `
            <div class="sidebar-container">
                <!-- Header -->
<div class="sidebar-header">
    <a href="${window.OsliraEnv.getMarketingUrl()}" class="sidebar-logo-link">
        <img src="/assets/images/oslira-logo.png" alt="Oslira Logo" class="sidebar-logo-image">
        <span class="sidebar-logo-text home-logo">Oslira</span>
    </a>
</div>
                
                <!-- Navigation -->
                <nav class="sidebar-nav">
                    <!-- Main Section -->
                    <div class="nav-section">
                        <h4 class="nav-section-header">Main</h4>
                        <div class="nav-items">
                            <a href="${window.OsliraEnv.getAppUrl('/dashboard')}" data-page="dashboard" data-tooltip="Dashboard" class="nav-item">
                                <span class="nav-icon">📊</span>
                                <span class="nav-text">Dashboard</span>
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/leads')}" data-page="leads" data-tooltip="Lead Research" class="nav-item">
                                <span class="nav-icon">🔍</span>
                                <span class="nav-text">Lead Research</span>
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/analytics')}" data-page="analytics" data-tooltip="Analytics" class="nav-item">
                                <span class="nav-icon">📈</span>
                                <span class="nav-text">Analytics</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Tools Section -->
                    <div class="nav-section">
                        <h4 class="nav-section-header">Tools</h4>
                        <div class="nav-items">
                            <a href="${window.OsliraEnv.getAppUrl('/campaigns')}" data-page="campaigns" data-tooltip="Campaigns" class="nav-item">
                                <span class="nav-icon">🎯</span>
                                <span class="nav-text">Campaigns</span>
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/automations')}" data-page="automations" data-tooltip="Automations" class="nav-item">
                                <span class="nav-icon">⚡</span>
                                <span class="nav-text">Automations</span>
                            </a>
                        </div>
                    </div>
                    
                </nav>
                
<!-- User Section -->
<div class="sidebar-user-section">
    <!-- Expanded User Info with integrated business -->
    <div class="sidebar-user-expanded">
        <div class="sidebar-user-info bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200/60 overflow-hidden">
            <!-- Business Header -->
            <div class="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/40">
                <label class="text-xs text-gray-600 uppercase tracking-wider font-semibold">Active Business</label>
<select id="sidebar-business-select" 
        onchange="window.sidebarManager && window.sidebarManager.handleBusinessChange(event)"
        class="w-full border border-gray-300 bg-gray-50 hover:bg-white hover:border-gray-400 focus:bg-white focus:border-blue-500 text-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
    <!-- Options will be dynamically loaded without placeholder -->
</select>
            </div>
            
            <!-- User Details -->
            <div class="px-4 py-3">
                <div id="sidebar-email" class="sidebar-user-email text-sm font-medium text-gray-800">Loading...</div>
                <div id="sidebar-plan" class="sidebar-user-plan text-xs text-gray-500 mt-1">Free Plan</div>
            </div>
            
            <div class="sidebar-user-credits px-4 py-3 border-t border-gray-200/40">
                <div class="sidebar-user-credits-header">
                    <div>
                        <span class="sidebar-user-credits-label">Credits</span>
                        <div id="sidebar-credits" class="sidebar-user-credits-count">--</div>
                    </div>
                    <div class="sidebar-user-credits-icon">⚡</div>
                </div>
            </div>
            
            <div class="sidebar-user-actions px-4 py-3 border-t border-gray-200/40 bg-gray-50/50">
<button onclick="window.sidebarManager.handleLogout()" 
        class="sidebar-user-button w-full">
    Sign out
</button>
            </div>
        </div>
    </div>
    
    <!-- Collapsed User Avatar -->
    <div class="sidebar-user-collapsed">
        <div class="sidebar-user-avatar">
            <span id="sidebar-user-initial">U</span>
        </div>
    </div>
</div>
            </div>
        `;
    }

    // =========================================================================
    // SIDEBAR FUNCTIONALITY
    // =========================================================================

initializeSidebar() {
    console.log('⚙️ [SidebarManager] Initializing sidebar functionality...');
    
    // Initialize navigation
    this.initializeNavigation();
    
    // Initialize business integration
    this.initializeBusinessIntegration();
    
    // Initialize user data integration
    this.initializeUserIntegration();
    
    // Set initial state
    this.updateSidebarState();

    // After sidebar renders
if (window.OsliraAuth?.user) {
    this.updateUserInfo();
}
    
    console.log('✅ [SidebarManager] Sidebar functionality initialized');
}

toggleSidebar() {
    console.log('🔄 [SidebarManager] Toggling sidebar, current state:', this.isCollapsed);
    
    this.isCollapsed = !this.isCollapsed;
    this.updateSidebarState();
    
    // Update classes and margins
    if (this.isCollapsed) {
        this.sidebar.classList.add('collapsed');
        if (this.mainContent) {
            this.mainContent.classList.add('sidebar-collapsed');
            this.mainContent.style.marginLeft = '64px'; // Collapsed sidebar width
        }
    } else {
        this.sidebar.classList.remove('collapsed');
        if (this.mainContent) {
            this.mainContent.classList.remove('sidebar-collapsed');
            this.mainContent.style.marginLeft = '256px'; // Full sidebar width
        }
    }
}

    updateSidebarState() {
        if (!this.sidebar) return;
        
        console.log('🔄 [SidebarManager] Updating sidebar state to:', this.isCollapsed ? 'collapsed' : 'expanded');
        
        // Update classes only - let CSS handle styling
        if (this.isCollapsed) {
            this.sidebar.classList.add('collapsed');
            if (this.mainContent) {
                this.mainContent.classList.add('sidebar-collapsed');
            }
        } else {
            this.sidebar.classList.remove('collapsed');
            if (this.mainContent) {
                this.mainContent.classList.remove('sidebar-collapsed');
            }
        }
        
        // Update all child elements
        this.updateChildElements();
        
        console.log('✅ [SidebarManager] State updated');
    }

    updateChildElements() {
        if (!this.sidebar) return;
        
        const elementsToUpdate = [
            '.sidebar-header',
            '.sidebar-logo-container', 
            '.sidebar-logo-text',
            '.sidebar-nav',
            '.nav-section',
            '.nav-section-header',
            '.nav-item',
            '.nav-text',
            '.sidebar-user-section',
            '.sidebar-user-expanded',
            '.sidebar-user-collapsed'
        ];
        
        elementsToUpdate.forEach(selector => {
            const elements = this.sidebar.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isCollapsed) {
                    el.classList.add('collapsed');
                } else {
                    el.classList.remove('collapsed');
                }
            });
        });
    }
    
    initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const pageId = item.getAttribute('data-page');
                if (pageId) {
                    this.setActiveMenuItem(pageId);
                }
            });
        });
        
        console.log('✅ [SidebarManager] Navigation event listeners attached');
    }

    // =========================================================================
// BUSINESS INTEGRATION
// =========================================================================

initializeBusinessIntegration() {
    console.log('💼 [SidebarManager] Initializing business integration...');
    
    // Load business profiles and auto-select first one
    this.loadBusinessProfiles().then(() => {
        console.log('✅ [SidebarManager] Business profiles loaded and auto-selected');
        
        // Restore previously selected business if available
        const savedBusinessId = localStorage.getItem('selectedBusinessId');
        if (savedBusinessId) {
            const selectElement = document.getElementById('sidebar-business-select');
            if (selectElement && selectElement.querySelector(`option[value="${savedBusinessId}"]`)) {
                selectElement.value = savedBusinessId;
                this.handleBusinessChange({ target: selectElement });
            }
        }
    });
    
    // Listen for business changes from other components
    if (this.eventBus) {
        this.eventBus.on('business:changed', (businessId) => {
            this.updateSelectedBusiness(businessId);
        });
        
        // Listen for business list updates
        this.eventBus.on('businesses:updated', () => {
            this.loadBusinessProfiles();
        });
    }
}

setBusinessManager(businessManager) {
    this.businessManager = businessManager;
    this.initializeBusinessIntegration();
}
    // =========================================================================
// USER DATA INTEGRATION
// =========================================================================
initializeUserIntegration() {
    console.log('👤 [SidebarManager] Initializing user integration...');
    
    // Poll for OsliraAuth user data (primary source)
    const waitForUserData = setInterval(() => {
        if (window.OsliraAuth?.user) {
            clearInterval(waitForUserData);
            this.updateUserInfo();
            console.log('✅ [SidebarManager] User integration initialized');
        }
    }, 100);
    
    // Clear interval after 10 seconds to prevent infinite polling
    setTimeout(() => clearInterval(waitForUserData), 10000);
    
// Also listen for auth state changes if available
try {
    if (window.OsliraAuth && typeof window.OsliraAuth.onAuthStateChange === 'function') {
        window.OsliraAuth.onAuthStateChange((event, session) => {
            if (session?.user && window.OsliraApp?.user) {
                this.updateUserInfo(window.OsliraApp.user);
            }
        });
    } else {
        console.log('👤 [SidebarManager] Auth state change listener not available, using polling only');
    }
} catch (error) {
    console.warn('⚠️ [SidebarManager] Could not setup auth state listener:', error.message);
}
}

// Helper method to refresh user data from OsliraApp
refreshUserData() {
    if (window.OsliraApp?.user) {
        this.updateUserInfo(window.OsliraApp.user);
        console.log('🔄 [SidebarManager] User data refreshed');
    } else {
        console.warn('⚠️ [SidebarManager] No user data available to refresh');
    }
}

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    formatPlanName(plan) {
        const planMap = {
            'free': 'Free Plan',
            'starter': 'Starter Plan',
            'professional': 'Pro Plan',
            'enterprise': 'Enterprise Plan'
        };
        return planMap[plan] || 'Subscription';
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
            user: this.user
        };
    }

    static refreshAllUserData() {
    if (window.sidebarManager) {
        window.sidebarManager.refreshUserData();
    }
}
}


// =============================================================================
// GLOBAL INITIALIZATION
// =============================================================================

// Export for global use
window.SidebarManager = SidebarManager;

// Create global instance
window.sidebarManager = new SidebarManager();

console.log('✅ [SidebarManager] Module loaded and ready');

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#sidebar-container');
    if (container) {
        window.sidebarManager.render('#sidebar-container').catch(console.error);
    }
});
