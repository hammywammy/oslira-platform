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

async updateUserInfo(user) {
    try {
        console.log('👤 [SidebarManager] Updating user info...', user?.email);
        this.user = user;

        // Update email
        const emailElement = document.getElementById('sidebar-email');
        if (emailElement && user?.email) {
            emailElement.textContent = user.email;
            console.log('✅ [SidebarManager] Email updated:', user.email);
        } else {
            console.warn('⚠️ [SidebarManager] Email element or user email missing', {
                hasElement: !!emailElement,
                hasEmail: !!user?.email
            });
        }

            // Update user initial
            const userInitialElement = document.getElementById('sidebar-user-initial');
            if (userInitialElement && user?.email) {
                userInitialElement.textContent = user.email.charAt(0).toUpperCase();
            }

            // Update subscription plan
            const planElement = document.getElementById('sidebar-plan');
            if (planElement) {
                const planName = this.formatPlanName(user.subscription_plan || 'free');
                planElement.textContent = planName;
            }

            // Update credits display
            const creditsElement = document.getElementById('sidebar-credits');
            if (creditsElement) {
                const credits = user.credits || 0;
                creditsElement.textContent = credits;
                
                // Add low credits warning
                if (credits < 5) {
                    creditsElement.classList.add('text-red-500');
                } else {
                    creditsElement.classList.remove('text-red-500');
                }
            }

            console.log('✅ [SidebarManager] User info updated');
            
        } catch (error) {
            console.error('❌ [SidebarManager] Failed to update user info:', error);
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
                    <div class="sidebar-logo-container">
                        <img src="/assets/images/oslira-logo.png" alt="Oslira Logo" 
                             class="sidebar-logo-image">
                        <div class="sidebar-logo-text">Oslira</div>
                    </div>
                </div>
                
                <!-- Navigation -->
                <nav class="sidebar-nav">
                    <!-- Main Section -->
                    <div class="nav-section">
                        <h4 class="nav-section-header">Main</h4>
                        <div class="nav-items">
                            <a href="/dashboard" data-page="dashboard" data-tooltip="Dashboard" class="nav-item">
                                <span class="nav-icon">📊</span>
                                <span class="nav-text">Dashboard</span>
                            </a>
                            <a href="/leads" data-page="leads" data-tooltip="Lead Research" class="nav-item">
                                <span class="nav-icon">🔍</span>
                                <span class="nav-text">Lead Research</span>
                            </a>
                            <a href="/analytics" data-page="analytics" data-tooltip="Analytics" class="nav-item">
                                <span class="nav-icon">📈</span>
                                <span class="nav-text">Analytics</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Tools Section -->
                    <div class="nav-section">
                        <h4 class="nav-section-header">Tools</h4>
                        <div class="nav-items">
                            <a href="/campaigns" data-page="campaigns" data-tooltip="Campaigns" class="nav-item">
                                <span class="nav-icon">🎯</span>
                                <span class="nav-text">Campaigns</span>
                            </a>
                            <a href="/automations" data-page="automations" data-tooltip="Automations" class="nav-item">
                                <span class="nav-icon">⚡</span>
                                <span class="nav-text">Automations</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Account Section -->
                    <div class="nav-section">
                        <h4 class="nav-section-header">Account</h4>
                        <div class="nav-items">
                        <a href="/subscription" data-page="Subscription" data-tooltip="Subscription" class="nav-item">
                                <span class="nav-icon">💳</span>
                                <span class="nav-text">Subscription</span>
                            </a>
                            <a href="/settings" data-page="settings" data-tooltip="Settings" class="nav-item">
                                <span class="nav-icon">⚙️</span>
                                <span class="nav-text">Settings</span>
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

createExternalToggle() {
    console.log('🔧 [SidebarManager] Creating external toggle...');
    
    // Remove any existing external toggle
    const existing = document.getElementById('sidebar-external-toggle');
    if (existing) {
        existing.remove();
    }
    
    // Create the toggle button
    const toggle = document.createElement('button');
    toggle.id = 'sidebar-external-toggle';
    toggle.innerHTML = `
        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
        </svg>
    `;
    
    // Style as thin vertical bar with transparency
    toggle.style.cssText = `
        position: fixed !important;
        top: 6.3% !important;
        left: 256px !important;
        transform: translateY(-50%) !important;
        width: 1rem !important;
        height: 8rem !important;
background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%) !important;
backdrop-filter: blur(16px) !important;
-webkit-backdrop-filter: blur(16px) !important;
        border: 1px solid rgba(229, 231, 235, 0.6) !important;
        border-left: none !important;
        border-radius: 0 0.5rem 0.5rem 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        z-index: 30 !important;
        box-shadow: 2px 0 8px rgba(0,0,0,0.1) !important;
        color: #6b7280 !important;
        transition: all 0.3s ease !important;
    `;
    
    // Add click handler
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSidebar();
    });

const hideWhenModalsPresent = () => {
    // Only consider modals that are actually visible with content (opacity: 1 and not empty)
    const activeModals = document.querySelectorAll('[id*="Modal"]');
    const hasActiveModal = Array.from(activeModals).some(modal => {
        const styles = window.getComputedStyle(modal);
        const hasContent = modal.children.length > 0 || modal.textContent.trim().length > 0;
        return styles.display !== 'none' && 
               !modal.classList.contains('hidden') && 
               styles.opacity === '1' && 
               hasContent;
    });
    
    if (hasActiveModal) {
        toggle.style.display = 'none';
    } else {
        toggle.style.display = 'flex';
    }
};

// Set initial state
toggle.style.display = 'flex';

// Run once on creation, then only when modals actually change
hideWhenModalsPresent();

// Simpler observer that only watches for modal-specific changes
const modalObserver = new MutationObserver((mutations) => {
    const modalChanged = mutations.some(mutation => 
        mutation.target.id && mutation.target.id.includes('Modal')
    );
    if (modalChanged) {
        hideWhenModalsPresent();
    }
});

modalObserver.observe(document.body, {
    childList: true,
    attributes: true,
    attributeFilter: ['style']
});
    
    // Add to body
    document.body.appendChild(toggle);
    
    // Store reference
    this.externalToggle = toggle;
    
    console.log('✅ [SidebarManager] External toggle created');
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
        
        // Update external toggle position
        if (this.externalToggle) {
            if (this.isCollapsed) {
                this.externalToggle.style.left = '64px';
                this.externalToggle.querySelector('svg').style.transform = 'rotate(180deg)';
            } else {
                this.externalToggle.style.left = '256px';
                this.externalToggle.querySelector('svg').style.transform = 'rotate(0deg)';
            }
        }
        
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
    
    // Wait for OsliraApp to be available and update user info
    const waitForUserData = setInterval(() => {
        if (window.OsliraApp?.user) {
            clearInterval(waitForUserData);
            this.updateUserInfo(window.OsliraApp.user);
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
