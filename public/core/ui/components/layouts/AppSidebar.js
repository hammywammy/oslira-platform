// =============================================================================
// SIDEBAR MANAGER - Enterprise Architecture + Full Auth Integration
// Path: /public/core/ui/components/layouts/AppSidebar.js
// Dependencies: OsliraAuth, OsliraEnv, EventBus (auto-loaded)
// =============================================================================

class SidebarManager {
    constructor() {
        this.isCollapsed = false;
        this.user = null;
        this.businesses = [];
        this.sidebar = null;
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
            this.sidebar = targetElement;
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
    // HTML TEMPLATE
    // =========================================================================
    
    getSidebarHTML() {
        return `
            <div class="sidebar-container">
                <!-- Header -->
                <div class="sidebar-header">
                    <a href="${window.OsliraEnv.getMarketingUrl()}" class="sidebar-logo-link">
                        <img src="/assets/images/oslira-logo.png" alt="Oslira" class="sidebar-logo-image">
                        <span class="sidebar-logo-text">Oslira</span>
                    </a>
                    <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" title="Toggle Sidebar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            <path d="M9 3v18"></path>
                        </svg>
                    </button>
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
                            <a href="${window.OsliraEnv.getAppUrl('/dashboard')}" data-page="dashboard" class="nav-item">
                                <span class="nav-icon">📊</span>
                                <span class="nav-text">Dashboard</span>
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/leads')}" data-page="leads" class="nav-item">
                                <span class="nav-icon">🔍</span>
                                <span class="nav-text">Lead Research</span>
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/analytics')}" data-page="analytics" class="nav-item">
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
                                <span class="nav-icon">🎯</span>
                                <span class="nav-text">Campaigns</span>
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/automations')}" data-page="automations" class="nav-item">
                                <span class="nav-icon">⚡</span>
                                <span class="nav-text">Automations</span>
                            </a>
                        </div>
                    </div>
                </nav>
                
                <!-- Account Section -->
                <div class="sidebar-account-section">
                    <button class="account-trigger" id="account-trigger-btn">
                        <div class="account-avatar" id="sidebar-avatar">
                            <span id="sidebar-user-initial">U</span>
                        </div>
                        <div class="account-info">
                            <div id="sidebar-name-trigger" class="account-name">Loading...</div>
                            <div id="sidebar-plan" class="account-plan">Free Plan</div>
                        </div>
                        <svg class="account-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    
                    <!-- Dropdown -->
                    <div class="account-dropdown" id="account-dropdown">
                        <div class="account-dropdown-header">
                            <div id="sidebar-name" class="account-dropdown-name">Loading...</div>
                            <div id="sidebar-email" class="account-dropdown-email">Loading...</div>
                        </div>
                        
                        <div class="account-dropdown-section">
                            <div class="account-section-title">ACTIVE BUSINESS</div>
                            <select id="sidebar-business-select" 
                                    onchange="window.sidebarManager && window.sidebarManager.handleBusinessChange(event)"
                                    class="dropdown-select-clean">
                                <option value="">Loading...</option>
                            </select>
                        </div>
                        
                        <div class="account-dropdown-section">
                            <div class="account-section-title">CREDITS</div>
                            <div class="credits-display-clean">
                                <span id="sidebar-credits">--</span>
                            </div>
                        </div>
                        
                        <div class="account-dropdown-actions-clean">
                            <a href="${window.OsliraEnv.getAppUrl('/settings/profile')}" class="dropdown-action-clean">
                                Settings
                            </a>
                            <a href="${window.OsliraEnv.getAppUrl('/subscription')}" class="dropdown-action-clean">
                                Upgrade plan
                            </a>
                            <a href="${window.OsliraEnv.getMarketingUrl('/help')}" class="dropdown-action-clean">
                                Get help
                            </a>
                            <a href="${window.OsliraEnv.getMarketingUrl('/docs')}" class="dropdown-action-clean">
                                Learn more
                            </a>
                            <button onclick="window.sidebarManager && window.sidebarManager.handleLogout()" class="dropdown-action-clean logout-action">
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    initializeSidebar() {
        console.log('⚙️ [SidebarManager] Initializing sidebar functionality...');
        
        this.initializeNavigation();
        this.initializeCollapsibleSections();
        this.initializeToggleButton();
        this.initializeAccountDropdown();
        this.initializeAuthIntegration();
        this.initializeBusinessIntegration();
        
        console.log('✅ [SidebarManager] Sidebar functionality initialized');
    }

    // =========================================================================
    // AUTH INTEGRATION (Core System)
    // =========================================================================

    initializeAuthIntegration() {
        console.log('🔐 [SidebarManager] Initializing auth integration...');
        
        // Method 1: Check if OsliraAuth is already loaded with user
        if (window.OsliraAuth?.user) {
            this.updateUserInfo(window.OsliraAuth.user);
            console.log('✅ [SidebarManager] User data loaded immediately');
            return;
        }
        
        // Method 2: Poll for OsliraAuth to load (handles async initialization)
        const pollInterval = setInterval(() => {
            if (window.OsliraAuth?.user) {
                clearInterval(pollInterval);
                this.updateUserInfo(window.OsliraAuth.user);
                console.log('✅ [SidebarManager] User data loaded via polling');
            }
        }, 100);
        
        // Clear poll after 10 seconds to prevent infinite loop
        setTimeout(() => clearInterval(pollInterval), 10000);
        
        // Method 3: Listen for auth state changes (handles sign in/out/updates)
        window.addEventListener('auth:signed-in', (event) => {
            console.log('🔐 [SidebarManager] User signed in event received');
            if (event.detail?.user) {
                this.updateUserInfo(event.detail.user);
            }
        });
        
        window.addEventListener('auth:signed-out', () => {
            console.log('🔐 [SidebarManager] User signed out event received');
            this.clearUserInfo();
        });
        
        window.addEventListener('auth:user-updated', (event) => {
            console.log('🔐 [SidebarManager] User updated event received');
            if (event.detail?.user) {
                this.updateUserInfo(event.detail.user);
            }
        });
        
        console.log('✅ [SidebarManager] Auth integration initialized');
    }

    updateUserInfo(user = null) {
        // Use provided user or get from OsliraAuth
        const userData = user || window.OsliraAuth?.user;
        
        if (!userData) {
            console.warn('⚠️ [SidebarManager] No user data available');
            return;
        }
        
        console.log('👤 [SidebarManager] Updating user info:', {
            email: userData.email,
            name: userData.signature_name || userData.full_name,
            credits: userData.credits,
            plan: userData.plan_type
        });
        
        // Store user reference
        this.user = userData;
        
        // Update name
        const nameElements = document.querySelectorAll('#sidebar-name, #sidebar-name-trigger');
        const displayName = userData.signature_name || userData.full_name || userData.email?.split('@')[0] || 'User';
        nameElements.forEach(el => {
            if (el) el.textContent = displayName;
        });
        
        // Update email
        const emailElement = document.getElementById('sidebar-email');
        if (emailElement && userData.email) {
            emailElement.textContent = userData.email;
        }
        
        // Update avatar initial
        const initialElement = document.getElementById('sidebar-user-initial');
        if (initialElement) {
            const initial = displayName.charAt(0).toUpperCase();
            initialElement.textContent = initial;
        }
        
        // Update plan
        const planElement = document.getElementById('sidebar-plan');
        if (planElement && userData.plan_type) {
            const planNames = {
                'free': 'Free plan',
                'starter': 'Starter plan',
                'pro': 'Pro plan',
                'max': 'Max plan'
            };
            planElement.textContent = planNames[userData.plan_type] || 'Free plan';
        }
        
        // Update credits
        const creditsElement = document.getElementById('sidebar-credits');
        if (creditsElement) {
            creditsElement.textContent = userData.credits !== undefined 
                ? userData.credits.toLocaleString() 
                : '--';
        }
        
        console.log('✅ [SidebarManager] User info updated');
    }

    clearUserInfo() {
        console.log('🧹 [SidebarManager] Clearing user info');
        
        this.user = null;
        
        document.querySelectorAll('#sidebar-name, #sidebar-name-trigger').forEach(el => {
            if (el) el.textContent = 'User';
        });
        
        const emailEl = document.getElementById('sidebar-email');
        if (emailEl) emailEl.textContent = '';
        
        const initialEl = document.getElementById('sidebar-user-initial');
        if (initialEl) initialEl.textContent = 'U';
        
        const planEl = document.getElementById('sidebar-plan');
        if (planEl) planEl.textContent = 'Free plan';
        
        const creditsEl = document.getElementById('sidebar-credits');
        if (creditsEl) creditsEl.textContent = '--';
    }

    async handleLogout() {
        console.log('🔐 [SidebarManager] Logging out user...');
        
        try {
            if (!window.OsliraAuth) {
                throw new Error('OsliraAuth not available');
            }
            
            // Use OsliraAuth.signOut() method
            await window.OsliraAuth.signOut();
            
            console.log('✅ [SidebarManager] User signed out successfully');
            
            // Redirect to home (OsliraAuth should handle this, but fallback)
            if (window.OsliraEnv) {
                window.location.href = window.OsliraEnv.getMarketingUrl();
            } else {
                window.location.href = '/';
            }
            
        } catch (error) {
            console.error('❌ [SidebarManager] Logout failed:', error);
            
            // Show error to user if possible
            if (window.alert) {
                alert('Failed to sign out. Please try again.');
            }
        }
    }

    // =========================================================================
    // BUSINESS INTEGRATION
    // =========================================================================

    initializeBusinessIntegration() {
        console.log('💼 [SidebarManager] Initializing business integration...');
        
        // Load businesses from OsliraAuth
        this.loadBusinessProfiles();
        
        // Listen for business changes
        window.addEventListener('business:changed', (event) => {
            console.log('💼 [SidebarManager] Business changed event received');
            if (event.detail?.businessId) {
                this.updateSelectedBusiness(event.detail.businessId);
            }
        });
        
        console.log('✅ [SidebarManager] Business integration initialized');
    }

    async loadBusinessProfiles() {
        console.log('💼 [SidebarManager] Loading business profiles...');
        
        try {
            const businesses = await this.fetchBusinessProfiles();
            const selectElement = document.getElementById('sidebar-business-select');
            
            if (!selectElement) {
                console.warn('⚠️ [SidebarManager] Business select element not found');
                return;
            }
            
            selectElement.innerHTML = '';
            
            if (!businesses || businesses.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No businesses found';
                option.disabled = true;
                selectElement.appendChild(option);
                selectElement.disabled = true;
                return;
            }
            
            // Add businesses
            businesses.forEach((business) => {
                const option = document.createElement('option');
                option.value = business.id;
                option.textContent = business.business_name;
                selectElement.appendChild(option);
            });
            
            // Auto-select first business or restore saved
            if (businesses.length > 0) {
                const savedBusinessId = localStorage.getItem('selectedBusinessId');
                if (savedBusinessId && businesses.find(b => b.id === savedBusinessId)) {
                    selectElement.value = savedBusinessId;
                } else {
                    selectElement.value = businesses[0].id;
                }
                
                this.handleBusinessChange({ target: selectElement });
            }
            
            console.log(`✅ [SidebarManager] Loaded ${businesses.length} business profiles`);
            
        } catch (error) {
            console.error('❌ [SidebarManager] Failed to load business profiles:', error);
        }
    }

    async fetchBusinessProfiles() {
        try {
            // Get from OsliraAuth first (if available)
            if (window.OsliraAuth?.businesses && window.OsliraAuth.businesses.length > 0) {
                console.log('✅ [SidebarManager] Using businesses from OsliraAuth');
                return window.OsliraAuth.businesses;
            }
            
            // Fallback: fetch from Supabase directly
            if (!window.OsliraAuth?.supabase || !window.OsliraAuth?.user) {
                console.warn('⚠️ [SidebarManager] No auth or user available');
                return [];
            }
            
            const { data: businesses, error } = await window.OsliraAuth.supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', window.OsliraAuth.user.id)
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
        
        // Save to localStorage
        localStorage.setItem('selectedBusinessId', businessId);
        
        // Emit event for other components
        window.dispatchEvent(new CustomEvent('business:changed', {
            detail: { businessId }
        }));
    }

    updateSelectedBusiness(businessId) {
        const selectElement = document.getElementById('sidebar-business-select');
        if (selectElement && selectElement.value !== businessId) {
            selectElement.value = businessId;
            console.log('✅ [SidebarManager] Updated selected business in dropdown');
        }
    }

    // =========================================================================
    // UI INTERACTIONS
    // =========================================================================

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
        
        console.log('✅ [SidebarManager] Navigation initialized');
    }

    setActiveMenuItem(pageId) {
        console.log(`🎯 [SidebarManager] Setting active: ${pageId}`);
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-page="${pageId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
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

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.sidebar) {
            this.sidebar.classList.toggle('collapsed', this.isCollapsed);
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
