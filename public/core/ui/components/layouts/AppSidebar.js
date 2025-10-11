// =============================================================================
// SIDEBAR MANAGER - Enterprise Architecture v2.0
// Path: /public/core/ui/components/layouts/AppSidebar.js
// Dependencies: OsliraAuth, OsliraApiClient, OsliraEnv, EventBus (auto-loaded)
// =============================================================================

class SidebarManager {
    constructor() {
        // UI State
        this.isCollapsed = false;
        this.sidebarContainer = null;
        this.sidebar = null;
        this.mainContent = null;
        
        // Data State
        this.user = null;
        this.businesses = [];
        this.subscription = null;
        
        // Dependency References (Injected)
        this.authManager = null;
        this.apiClient = null;
        this.eventBus = null;
        this.envDetector = null;
        
        // Lifecycle State
        this.isInitialized = false;
        this.isDataLoaded = false;
        this.initializationPromise = null;
        
        // Configuration
        this.config = {
            containerSelector: '#sidebar-container',
            maxDependencyWaitTime: 5000, // 5 seconds
            maxContainerWaitTime: 2000,   // 2 seconds
            dataRefreshInterval: 5 * 60 * 1000, // 5 minutes
            enableAutoRefresh: true
        };
        
        console.log('🚀 [SidebarManager] Instance created');
    }

    // =========================================================================
    // ENTERPRISE INITIALIZATION PATTERN
    // =========================================================================

    /**
     * Main render method - Enterprise pattern with dependency injection
     * @param {string|HTMLElement} container - Container selector or element
     * @returns {Promise<SidebarManager>} Self reference for chaining
     */
    async render(container = '#sidebar-container') {
        // Prevent duplicate initialization
        if (this.initializationPromise) {
            console.log('⚠️ [SidebarManager] Initialization already in progress');
            return this.initializationPromise;
        }

        this.initializationPromise = this._performRender(container);
        
        // CRITICAL: Store this instance globally for console access
        window.sidebarManager = this;
        
        return this.initializationPromise;
    }

    async _performRender(container) {
        try {
            console.log('🎨 [SidebarManager] Starting render process...');
            
            // Step 1: Wait for critical dependencies
            await this._waitForDependencies();
            
            // Step 2: Inject dependencies
            this._injectDependencies();
            
            // Step 3: Wait for container element
            const targetElement = await this._waitForContainer(container);
            
            // Step 4: Inject sidebar HTML
            this._injectHTML(targetElement);
            
            // Step 5: Store DOM references
            this._storeDOMReferences(targetElement);
            
            // Step 6: Initialize UI components (synchronous)
            this._initializeUIComponents();
            
            // Step 7: Load data (asynchronous, non-blocking)
            this._loadDataAsync();
            
            // Step 8: Setup event listeners
            this._setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ [SidebarManager] Render complete');
            
            return this;
            
        } catch (error) {
            console.error('❌ [SidebarManager] Render failed:', error);
            this.initializationPromise = null;
            throw error;
        }
    }

    // =========================================================================
    // DEPENDENCY MANAGEMENT
    // =========================================================================

    /**
     * Wait for required dependencies with timeout
     */
    async _waitForDependencies() {
        const startTime = Date.now();
        const dependencies = ['OsliraAuth', 'OsliraApiClient', 'OsliraEnv', 'OsliraEventBus'];
        
        console.log('🔍 [SidebarManager] Waiting for dependencies:', dependencies);

        while (Date.now() - startTime < this.config.maxDependencyWaitTime) {
            const allReady = dependencies.every(dep => window[dep]?.isInitialized !== false);
            
            if (allReady) {
                console.log('✅ [SidebarManager] All dependencies ready');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Check which dependencies are missing
        const missing = dependencies.filter(dep => !window[dep]);
        if (missing.length > 0) {
            throw new Error(`Required dependencies not available: ${missing.join(', ')}`);
        }
    }

    /**
     * Inject dependencies (Dependency Injection Pattern)
     */
    _injectDependencies() {
        this.authManager = window.OsliraAuth;
        this.apiClient = window.OsliraApiClient;
        this.eventBus = window.OsliraEventBus;
        this.envDetector = window.OsliraEnv;
        
        console.log('✅ [SidebarManager] Dependencies injected');
    }

    /**
     * Wait for container element with timeout
     */
    async _waitForContainer(container) {
        const startTime = Date.now();
        
        let targetElement = typeof container === 'string' 
            ? document.querySelector(container)
            : container;

        if (!targetElement && typeof container === 'string') {
            console.log('🔍 [SidebarManager] Waiting for container:', container);
            
            while (Date.now() - startTime < this.config.maxContainerWaitTime) {
                targetElement = document.querySelector(container);
                
                if (targetElement) {
                    console.log('✅ [SidebarManager] Container found');
                    return targetElement;
                }
                
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        if (!targetElement) {
            throw new Error(`Container element not found: ${container}`);
        }

        return targetElement;
    }

    // =========================================================================
    // DOM MANAGEMENT
    // =========================================================================

    /**
     * Inject sidebar HTML into container
     */
    _injectHTML(targetElement) {
        targetElement.innerHTML = this.getSidebarHTML();
        console.log('✅ [SidebarManager] HTML injected');
    }

    /**
     * Store critical DOM references
     */
    _storeDOMReferences(targetElement) {
        this.sidebarContainer = targetElement;
        this.sidebar = targetElement.querySelector('.sidebar');
        this.mainContent = document.querySelector('.main-content, [class*="content"], main');
        
        console.log('✅ [SidebarManager] DOM references stored');
    }

    // =========================================================================
    // UI INITIALIZATION
    // =========================================================================

    /**
     * Initialize UI components (synchronous)
     */
    _initializeUIComponents() {
        // Load saved collapse state
        this._loadSavedState();
        
        // Initialize interactive components
        this._initializeToggleButton();
        this._initializeActiveNavItem();
        this._initializeCollapsibleSections();
        this._initializeAccountDropdown();
        
        console.log('✅ [SidebarManager] UI components initialized');
    }

    _loadSavedState() {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            this.isCollapsed = true;
            if (this.sidebarContainer) {
                this.sidebarContainer.classList.add('collapsed');
            }
        }
    }

    _initializeToggleButton() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSidebar());
            console.log('✅ [SidebarManager] Toggle button initialized');
        }
    }

    _initializeActiveNavItem() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && currentPath.includes(href.split('/').pop())) {
                item.classList.add('active');
            }
        });
    }

    _initializeCollapsibleSections() {
        const sectionHeaders = document.querySelectorAll('.nav-section-header-wrapper');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.nav-section');
                section.classList.toggle('section-collapsed');
            });
        });
        
        console.log('✅ [SidebarManager] Collapsible sections initialized');
    }

    _initializeAccountDropdown() {
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
    // DATA LOADING (ASYNC, NON-BLOCKING)
    // =========================================================================

    /**
     * Load data asynchronously (doesn't block UI rendering)
     */
    _loadDataAsync() {
        this._performDataLoad().catch(error => {
            console.error('❌ [SidebarManager] Data load failed:', error);
        });
    }

    async _performDataLoad() {
        try {
            console.log('🔐 [SidebarManager] Loading user data...');
            
            // Validate authentication
            if (!this.authManager?.user) {
                console.warn('⚠️ [SidebarManager] No authenticated user');
                return;
            }
            
            this.user = this.authManager.user;
            
            // Load business profiles and subscription in parallel
            const [businessResult, subscriptionResult] = await Promise.allSettled([
                this._loadBusinessProfiles(),
                this._loadSubscriptionData()
            ]);
            
            // Log results
            if (businessResult.status === 'rejected') {
                console.error('❌ [SidebarManager] Business load failed:', businessResult.reason);
            }
            
            if (subscriptionResult.status === 'rejected') {
                console.error('❌ [SidebarManager] Subscription load failed:', subscriptionResult.reason);
            }
            
            // Update UI with loaded data
            this._updateUI();
            
            this.isDataLoaded = true;
            
            // Emit data loaded event
            this.eventBus?.emit('sidebar:data-loaded', {
                user: this.user,
                businesses: this.businesses,
                subscription: this.subscription
            });
            
            console.log('✅ [SidebarManager] Data loaded:', {
                user: this.user.email,
                businesses: this.businesses.length,
                subscription: this.subscription?.plan_type || 'none'
            });
            
        } catch (error) {
            console.error('❌ [SidebarManager] Data load error:', error);
            throw error;
        }
    }

    /**
     * Load business profiles via API
     */
    async _loadBusinessProfiles() {
        try {
            // Validate dependencies
            if (!this.apiClient?.isInitialized) {
                throw new Error('ApiClient not initialized');
            }
            
            console.log('🏢 [SidebarManager] Fetching business profiles...');
            
            // Make API request (JWT token added automatically)
            const response = await this.apiClient.get(
                '/business-profiles',
                {}, // Options (empty - token auto-injected)
                { enabled: true, ttl: this.config.dataRefreshInterval } // Cache config
            );
            
            // Debug: Log full response
            console.log('🔍 [SidebarManager] API Response:', response);
            
            // ApiClient returns parsed response body directly
            // Backend returns: { success: true/false, data: [...], error?: string }
            if (!response || response.success === false) {
                const errorMsg = response?.error || 'Failed to fetch business profiles';
                console.error('❌ [SidebarManager] API Error:', errorMsg);
                throw new Error(errorMsg);
            }
            
            // Handle empty or missing data
            if (!response.data) {
                console.warn('⚠️ [SidebarManager] No business profiles found (empty response)');
                this.businesses = [];
                return;
            }
            
            // CRITICAL FIX: response.data is already an array - don't wrap it again!
            this.businesses = response.data;
            
            console.log('✅ [SidebarManager] Loaded', this.businesses.length, 'business profiles');
            
        } catch (error) {
            console.error('❌ [SidebarManager] Business profiles load failed:', error);
            this.businesses = [];
            throw error;
        }
    }

    /**
     * Load subscription data from AuthManager (no API call needed)
     */
    async _loadSubscriptionData() {
        try {
            console.log('💳 [SidebarManager] Loading subscription data...');
            
            // Subscription data is enriched in user object by AuthManager
            // No separate API call needed - it's already there
            if (!this.user) {
                throw new Error('User not available');
            }
            
            // Extract subscription from user object
            const planType = this.user.plan_type || 'free';
            const creditsRemaining = this.user.credits ?? 0;
            const subscriptionStatus = this.user.subscription_status || 'active';
            
            this.subscription = {
                plan_type: planType,
                credits_remaining: creditsRemaining,
                status: subscriptionStatus,
                plan_credits: this._getPlanCredits(planType)
            };
            
            console.log('✅ [SidebarManager] Subscription loaded:', {
                plan: planType,
                credits: creditsRemaining
            });
            
        } catch (error) {
            console.error('❌ [SidebarManager] Subscription load failed:', error);
            
            // Fallback to free plan
            this.subscription = {
                plan_type: 'free',
                credits_remaining: 25,
                status: 'active',
                plan_credits: 25
            };
            
            throw error;
        }
    }

    /**
     * Get plan credits based on plan type
     */
    _getPlanCredits(planType) {
        const PLAN_CREDITS = {
            free: 25,
            pro: 500,
            agency: 1000,
            enterprise: 5000
        };
        
        return PLAN_CREDITS[planType?.toLowerCase()] || 25;
    }

    // =========================================================================
    // UI UPDATE
    // =========================================================================

    /**
     * Update all UI elements with loaded data
     */
    _updateUI() {
        this._updateUserInfo();
        this._updateBusinessSelector();
        this._updateCreditsDisplay();
        this._updatePlanBadge();
        
        console.log('✅ [SidebarManager] UI updated');
    }

    _updateUserInfo() {
        if (!this.user) return;
        
        const displayName = this.user.user_metadata?.full_name || 
                           this.user.email?.split('@')[0] || 
                           'User';
        
        const firstName = displayName.split(' ')[0];
        const initial = displayName[0]?.toUpperCase() || 'U';
        
        // Update dropdown header
        const accountName = document.querySelector('.account-dropdown-name');
        const accountEmail = document.querySelector('.account-dropdown-email');
        
        if (accountName) accountName.textContent = displayName;
        if (accountEmail) accountEmail.textContent = this.user.email || '';
        
        // Update trigger button
        const triggerName = document.querySelector('.account-name');
        const avatar = document.querySelector('.account-avatar');
        
        if (triggerName) triggerName.textContent = firstName;
        if (avatar) avatar.textContent = initial;
    }

    _updateBusinessSelector() {
        const selector = document.getElementById('business-selector');
        if (!selector) return;
        
        // Clear existing options
        selector.innerHTML = '';
        
        if (this.businesses.length > 0) {
            // Add business options
            this.businesses.forEach(business => {
                const option = document.createElement('option');
                option.value = business.id;
                option.textContent = business.business_name;
                selector.appendChild(option);
            });
            
            console.log('✅ [SidebarManager] Business selector updated:', this.businesses.length, 'businesses');
        } else {
            // No businesses - show personal account
            const option = document.createElement('option');
            option.value = 'personal';
            option.textContent = 'Personal Account';
            selector.appendChild(option);
        }
    }

    _updateCreditsDisplay() {
        const display = document.querySelector('.credits-display-clean');
        if (!display) return;
        
        const creditsRemaining = this.subscription?.credits_remaining ?? 0;
        const planCredits = this.subscription?.plan_credits ?? 25;
        
        display.textContent = `${creditsRemaining} / ${planCredits}`;
    }

    _updatePlanBadge() {
        const badge = document.querySelector('.account-plan');
        if (!badge || !this.subscription) return;
        
        const planName = this.subscription.plan_type || 'free';
        const displayName = planName.charAt(0).toUpperCase() + planName.slice(1);
        
        badge.textContent = `${displayName} Plan`;
    }

    // =========================================================================
    // EVENT SYSTEM
    // =========================================================================

    /**
     * Setup global event listeners
     */
    _setupEventListeners() {
        // Listen for auth state changes
        this.eventBus?.on('auth:state-changed', () => {
            this._loadDataAsync();
        });
        
        // Listen for subscription updates
        this.eventBus?.on('subscription:updated', (data) => {
            this.subscription = data;
            this._updateCreditsDisplay();
            this._updatePlanBadge();
        });
        
        // Listen for business changes
        this.eventBus?.on('business:updated', () => {
            this._loadBusinessProfiles().catch(console.error);
        });
        
        console.log('✅ [SidebarManager] Event listeners setup');
    }

    // =========================================================================
    // SIDEBAR TOGGLE (ENTERPRISE PATTERN)
    // =========================================================================

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
        
        // Toggle class on container (enterprise pattern)
        if (this.sidebarContainer) {
            this.sidebarContainer.classList.toggle('collapsed', this.isCollapsed);
        }
        
        // Persist state
        localStorage.setItem('sidebarCollapsed', this.isCollapsed.toString());
        
        // Emit event
        const eventName = this.isCollapsed ? 'sidebar:collapsed' : 'sidebar:expanded';
        this.eventBus?.emit(eventName);
        
        console.log('✅ [SidebarManager] Sidebar toggled:', this.isCollapsed ? 'collapsed' : 'expanded');
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    collapse() {
        if (!this.isCollapsed) this.toggleSidebar();
    }

    expand() {
        if (this.isCollapsed) this.toggleSidebar();
    }

    async refresh() {
        console.log('🔄 [SidebarManager] Refreshing data...');
        await this._performDataLoad();
    }

    getState() {
        return {
            isInitialized: this.isInitialized,
            isDataLoaded: this.isDataLoaded,
            isCollapsed: this.isCollapsed,
            user: this.user,
            businesses: this.businesses,
            subscription: this.subscription
        };
    }

    // =========================================================================
    // HTML TEMPLATE
    // =========================================================================
    
    getSidebarHTML() {
        return `
        <div class="sidebar">
            <div class="sidebar-container">
                <!-- Header -->
                <div class="sidebar-header">
                    <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" title="Toggle Sidebar">
                        <span class="sidebar-toggle-icon" role="img" aria-label="Toggle sidebar"></span>
                    </button>
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
                            <a href="${this.envDetector.getAppUrl('/dashboard')}" data-page="dashboard" class="nav-item" data-tooltip="Dashboard">
                                <span class="nav-icon">📊</span>
                                <span class="nav-text">Dashboard</span>
                            </a>
                            <a href="${this.envDetector.getAppUrl('/leads')}" data-page="leads" class="nav-item" data-tooltip="Lead Research">
                                <span class="nav-icon">🔍</span>
                                <span class="nav-text">Lead Research</span>
                            </a>
                            <a href="${this.envDetector.getAppUrl('/analytics')}" data-page="analytics" class="nav-item" data-tooltip="Analytics">
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
                            <a href="${this.envDetector.getAppUrl('/campaigns')}" data-page="campaigns" class="nav-item" data-tooltip="Campaigns">
                                <span class="nav-icon">🎯</span>
                                <span class="nav-text">Campaigns</span>
                            </a>
                            <a href="${this.envDetector.getAppUrl('/messages')}" data-page="messages" class="nav-item" data-tooltip="Messages">
                                <span class="nav-icon">💬</span>
                                <span class="nav-text">Messages</span>
                            </a>
                            <a href="${this.envDetector.getAppUrl('/integrations')}" data-page="integrations" class="nav-item" data-tooltip="Integrations">
                                <span class="nav-icon">🔌</span>
                                <span class="nav-text">Integrations</span>
                            </a>
                        </div>
                    </div>
                </nav>
                
                <!-- Account Section -->
                <div class="sidebar-account-section">
                    <div class="account-dropdown" id="account-dropdown">
                        <div class="account-dropdown-header">
                            <div class="account-dropdown-name">Loading...</div>
                            <div class="account-dropdown-email">...</div>
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
                            <a href="${this.envDetector.getAppUrl('/settings')}" class="dropdown-action-clean">Settings</a>
                            <a href="https://oslira.com/help" target="_blank" rel="noopener noreferrer" class="dropdown-action-clean">Get Help</a>
                            <a href="https://oslira.com/upgrade" target="_blank" rel="noopener noreferrer" class="dropdown-action-clean upgrade-action">Upgrade Plan</a>
                            <button class="dropdown-action-clean logout-action">Logout</button>
                        </div>
                    </div>
                    
                    <button class="account-trigger" id="account-trigger-btn">
                        <div class="account-avatar">U</div>
                        <div class="account-info">
                            <div class="account-name">User</div>
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
// GLOBAL INITIALIZATION (SINGLETON PATTERN)
// =============================================================================

window.SidebarManager = SidebarManager;

// Pre-create a placeholder instance (will be replaced when render() is called)
if (!window.sidebarManager) {
    window.sidebarManager = new SidebarManager();
    console.log('✅ [SidebarManager] Placeholder instance created');
}

console.log('✅ [SidebarManager] Module loaded and ready');
