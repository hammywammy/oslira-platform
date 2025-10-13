// =============================================================================
// NAVIGATION HELPER - Environment-Aware Link Management System
// Path: /public/core/utils/NavigationHelper.js
// Dependencies: EnvDetector
// =============================================================================

/**
 * @class NavigationHelper
 * @description Production-grade navigation system with environment awareness
 * 
 * Features:
 * - Auto-initialization of data-nav links
 * - Programmatic navigation API
 * - Auth state-aware redirects
 * - Query parameter preservation
 * - Hash fragment support
 * - External link detection
 * - Navigation event tracking
 * - Fallback handling
 */
class NavigationHelper {
    constructor() {
        this.envDetector = null;
        this.isInitialized = false;
        this.navigationTargets = new Map();
        this.externalDomains = ['instagram.com', 'twitter.com', 'linkedin.com', 'facebook.com'];
        
        console.log('🧭 [NavigationHelper] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize navigation helper
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ [NavigationHelper] Already initialized');
            return;
        }
        
        try {
            // Wait for EnvDetector
            await this._waitForEnvDetector();
            
            this.envDetector = window.OsliraEnv;
            
            // Build navigation target map
            this._buildNavigationMap();
            
            // Initialize all data-nav links on page
            this._initializeDataNavLinks();
            
            // Setup mutation observer for dynamic content
            this._setupMutationObserver();
            
            // Setup click interceptors
            this._setupClickInterceptors();
            
            this.isInitialized = true;
            console.log('✅ [NavigationHelper] Initialized successfully');
            
        } catch (error) {
            console.error('❌ [NavigationHelper] Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Wait for EnvDetector to be available
     */
    async _waitForEnvDetector() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!window.OsliraEnv && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.OsliraEnv) {
            throw new Error('EnvDetector not available after timeout');
        }
    }
    
    /**
     * Build navigation target map
     */
    _buildNavigationMap() {
        // Define all available navigation targets
        this.navigationTargets = new Map([
            // Auth targets
            ['auth', { method: 'getAuthUrl', requiresAuth: false }],
            ['login', { method: 'getAuthUrl', requiresAuth: false }],
            ['signin', { method: 'getAuthUrl', requiresAuth: false }],
            ['signup', { method: 'getAuthUrl', requiresAuth: false }],
            ['auth-callback', { method: 'getAuthUrl', path: '/callback', requiresAuth: false }],
            
            // App targets
            ['app', { method: 'getAppUrl', requiresAuth: true }],
            ['dashboard', { method: 'getAppUrl', path: '/dashboard', requiresAuth: true }],
            ['leads', { method: 'getAppUrl', path: '/leads', requiresAuth: true }],
            ['analytics', { method: 'getAppUrl', path: '/analytics', requiresAuth: true }],
            ['campaigns', { method: 'getAppUrl', path: '/campaigns', requiresAuth: true }],
            ['messages', { method: 'getAppUrl', path: '/messages', requiresAuth: true }],
            ['integrations', { method: 'getAppUrl', path: '/integrations', requiresAuth: true }],
            ['subscription', { method: 'getAppUrl', path: '/subscription', requiresAuth: true }],
            ['onboarding', { method: 'getAppUrl', path: '/onboarding', requiresAuth: true }],
            ['settings', { method: 'getAppUrl', path: '/settings', requiresAuth: true }],
            ['settings-profile', { method: 'getAppUrl', path: '/settings/profile', requiresAuth: true }],
            ['settings-account', { method: 'getAppUrl', path: '/settings/account', requiresAuth: true }],
            ['settings-billing', { method: 'getAppUrl', path: '/settings/billing', requiresAuth: true }],
            ['settings-usage', { method: 'getAppUrl', path: '/settings/usage', requiresAuth: true }],
            
            // Admin targets
            ['admin', { method: 'getAdminUrl', requiresAuth: true, requiresAdmin: true }],
            
            // Marketing targets
            ['home', { method: 'getMarketingUrl', requiresAuth: false }],
            ['marketing', { method: 'getMarketingUrl', requiresAuth: false }],
            ['about', { method: 'getMarketingUrl', path: '/about', requiresAuth: false }],
            ['pricing', { method: 'getMarketingUrl', path: '/pricing', requiresAuth: false }],
            ['security', { method: 'getMarketingUrl', path: '/security', requiresAuth: false }],
            ['help', { method: 'getMarketingUrl', path: '/help', requiresAuth: false }],
            ['docs', { method: 'getMarketingUrl', path: '/docs', requiresAuth: false }],
            ['api', { method: 'getMarketingUrl', path: '/api', requiresAuth: false }],
            ['case-studies', { method: 'getMarketingUrl', path: '/case-studies', requiresAuth: false }],
            
            // Legal targets
            ['legal', { method: 'getLegalUrl', requiresAuth: false }],
            ['terms', { method: 'getLegalUrl', path: '/terms', requiresAuth: false }],
            ['privacy', { method: 'getLegalUrl', path: '/privacy', requiresAuth: false }],
            ['refund', { method: 'getLegalUrl', path: '/refund', requiresAuth: false }],
            ['disclaimer', { method: 'getLegalUrl', path: '/disclaimer', requiresAuth: false }],
            
            // Contact targets
            ['contact', { method: 'getContactUrl', requiresAuth: false }],
            ['contact-support', { method: 'getContactUrl', path: '/support', requiresAuth: false }],
            ['contact-sales', { method: 'getContactUrl', path: '/sales', requiresAuth: false }],
            ['contact-security', { method: 'getContactUrl', path: '/security', requiresAuth: false }],
            ['contact-bug-report', { method: 'getContactUrl', path: '/bug-report', requiresAuth: false }],
            ['contact-legal', { method: 'getContactUrl', path: '/legal', requiresAuth: false }],
            
            // Status target
            ['status', { method: 'getStatusUrl', requiresAuth: false }]
        ]);
        
        console.log(`📋 [NavigationHelper] Built ${this.navigationTargets.size} navigation targets`);
    }
    
    /**
     * Initialize all data-nav links on current page
     */
    _initializeDataNavLinks() {
        const links = document.querySelectorAll('[data-nav]');
        let count = 0;
        
        links.forEach(link => {
            if (this._processNavLink(link)) {
                count++;
            }
        });
        
        console.log(`✅ [NavigationHelper] Initialized ${count} data-nav links`);
    }
    
    /**
     * Setup mutation observer for dynamically added links
     */
    _setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if the node itself has data-nav
                        if (node.hasAttribute && node.hasAttribute('data-nav')) {
                            this._processNavLink(node);
                        }
                        // Check descendants
                        if (node.querySelectorAll) {
                            node.querySelectorAll('[data-nav]').forEach(link => {
                                this._processNavLink(link);
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👁️ [NavigationHelper] Mutation observer active');
    }
    
    /**
     * Setup click interceptors for enhanced navigation
     */
    _setupClickInterceptors() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-nav]');
            if (link && link.hasAttribute('data-nav-intercept')) {
                e.preventDefault();
                const target = link.getAttribute('data-nav');
                const path = link.getAttribute('data-nav-path') || '';
                this.navigateTo(target, path);
            }
        });
    }
    
    // =========================================================================
    // LINK PROCESSING
    // =========================================================================
    
    /**
     * Process a single navigation link
     */
    _processNavLink(link) {
        const target = link.getAttribute('data-nav');
        const customPath = link.getAttribute('data-nav-path');
        const preserveQuery = link.getAttribute('data-nav-query') !== 'false';
        const preserveHash = link.getAttribute('data-nav-hash') !== 'false';
        
        if (!target) {
            console.warn('⚠️ [NavigationHelper] Link has data-nav but no target specified', link);
            return false;
        }
        
        try {
            const url = this.getUrl(target, customPath, { preserveQuery, preserveHash });
            
            if (url) {
                link.href = url;
                
                // Add external link attributes if needed
                if (this._isExternalUrl(url)) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
                
                return true;
            } else {
                console.warn(`⚠️ [NavigationHelper] Could not generate URL for target: ${target}`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ [NavigationHelper] Error processing link for target: ${target}`, error);
            return false;
        }
    }
    
    // =========================================================================
    // URL GENERATION
    // =========================================================================
    
    /**
     * Get URL for navigation target
     */
    getUrl(target, customPath = '', options = {}) {
        if (!this.envDetector) {
            console.error('❌ [NavigationHelper] EnvDetector not available');
            return null;
        }
        
        // Check if target exists in map
        const targetConfig = this.navigationTargets.get(target);
        
        if (!targetConfig) {
            console.warn(`⚠️ [NavigationHelper] Unknown navigation target: ${target}`);
            return null;
        }
        
        // Determine final path
        const finalPath = customPath || targetConfig.path || '';
        
        // Get base URL using EnvDetector method
        const method = targetConfig.method;
        let url;
        
        try {
            if (typeof this.envDetector[method] === 'function') {
                url = this.envDetector[method](finalPath);
            } else {
                console.error(`❌ [NavigationHelper] Method ${method} not found on EnvDetector`);
                return null;
            }
        } catch (error) {
            console.error(`❌ [NavigationHelper] Error calling ${method}:`, error);
            return null;
        }
        
        // Add query parameters if needed
        if (options.preserveQuery !== false && window.location.search) {
            const urlObj = new URL(url);
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.forEach((value, key) => {
                urlObj.searchParams.set(key, value);
            });
            url = urlObj.toString();
        }
        
        // Add hash if needed
        if (options.preserveHash !== false && window.location.hash) {
            url += window.location.hash;
        }
        
        return url;
    }
    
    /**
     * Get multiple URLs at once
     */
    getUrls(targets) {
        const urls = {};
        targets.forEach(target => {
            urls[target] = this.getUrl(target);
        });
        return urls;
    }
    
    // =========================================================================
    // PROGRAMMATIC NAVIGATION
    // =========================================================================
    
    /**
     * Navigate to target
     */
    navigateTo(target, customPath = '', options = {}) {
        const url = this.getUrl(target, customPath, options);
        
        if (!url) {
            console.error(`❌ [NavigationHelper] Cannot navigate to target: ${target}`);
            return false;
        }
        
        // Track navigation event
        this._trackNavigation(target, url);
        
        // Perform navigation
        if (options.newTab) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = url;
        }
        
        return true;
    }
    
    /**
     * Navigate with redirect tracking
     */
    navigateWithReturn(target, customPath = '') {
        const returnUrl = encodeURIComponent(window.location.href);
        const url = this.getUrl(target, customPath);
        
        if (url) {
            const urlObj = new URL(url);
            urlObj.searchParams.set('return_to', returnUrl);
            window.location.href = urlObj.toString();
        }
    }
    
    /**
     * Redirect to auth if not authenticated
     */
    requireAuth(redirectTo = null) {
        // Check if user is authenticated (implement your auth check)
        const isAuthenticated = this._checkAuthStatus();
        
        if (!isAuthenticated) {
            const returnUrl = redirectTo || window.location.href;
            const authUrl = this.getUrl('auth');
            const urlObj = new URL(authUrl);
            urlObj.searchParams.set('return_to', encodeURIComponent(returnUrl));
            window.location.href = urlObj.toString();
            return false;
        }
        
        return true;
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Check if URL is external
     */
    _isExternalUrl(url) {
        try {
            const urlObj = new URL(url);
            const currentDomain = window.location.hostname;
            return urlObj.hostname !== currentDomain && !urlObj.hostname.endsWith(this.envDetector.rootDomain);
        } catch {
            return false;
        }
    }
    
    /**
     * Check authentication status
     */
    _checkAuthStatus() {
        // Check if OsliraAuth is available and has session
        if (window.OsliraAuth && typeof window.OsliraAuth.isAuthenticated === 'function') {
            return window.OsliraAuth.isAuthenticated();
        }
        
        // Fallback: check localStorage for token
        return !!localStorage.getItem('oslira-auth');
    }
    
    /**
     * Track navigation event
     */
    _trackNavigation(target, url) {
        console.log(`🧭 [NavigationHelper] Navigating to: ${target} → ${url}`);
        
        // Emit custom event for analytics
        window.dispatchEvent(new CustomEvent('oslira:navigation', {
            detail: { target, url, timestamp: Date.now() }
        }));
    }
    
    /**
     * Refresh all navigation links on page
     */
    refreshAll() {
        console.log('🔄 [NavigationHelper] Refreshing all navigation links...');
        this._initializeDataNavLinks();
    }
    
    /**
     * Get all available targets
     */
    getAvailableTargets() {
        return Array.from(this.navigationTargets.keys());
    }
    
    /**
     * Check if target exists
     */
    hasTarget(target) {
        return this.navigationTargets.has(target);
    }
    
    /**
     * Get target configuration
     */
    getTargetConfig(target) {
        return this.navigationTargets.get(target);
    }
    
    /**
     * Debug info
     */
    debug() {
        console.group('🧭 [NavigationHelper] Debug Info');
        console.log('Initialized:', this.isInitialized);
        console.log('EnvDetector:', this.envDetector);
        console.log('Available Targets:', this.getAvailableTargets());
        console.log('Total Links on Page:', document.querySelectorAll('[data-nav]').length);
        console.groupEnd();
    }
}

// =============================================================================
// GLOBAL EXPORT & AUTO-INITIALIZATION
// =============================================================================

// Create singleton instance
const navigationHelper = new NavigationHelper();

// Export
window.OsliraNav = navigationHelper;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        navigationHelper.initialize();
    });
} else {
    // DOM already loaded
    navigationHelper.initialize();
}

console.log('✅ [NavigationHelper] Loaded');

// Register with Coordinator if available
if (window.Oslira?.init) {
    window.Oslira.init.register('NavigationHelper', window.OsliraNav);
    console.log('📋 [NavigationHelper] Registered with Coordinator');
}
