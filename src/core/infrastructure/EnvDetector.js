// =============================================================================
// ENV DETECTOR - Environment & Page Detection
// Path: /public/core/infrastructure/EnvDetector.js
// Dependencies: None (loads first)
// =============================================================================

/**
 * @class EnvDetector
 * @description Detects environment, current page, and provides URL helpers
 * 
 * Features:
 * - Environment detection (dev/staging/prod)
 * - Page detection from URL path
 * - Subdomain-aware URL builders
 * - Auth requirement checking
 * - Zero external dependencies
 */
class EnvDetector {
constructor() {
    // Raw URL info
    this.hostname = window.location.hostname;
    this.origin = window.location.origin;
    this.pathname = window.location.pathname;
    
    // Domain configuration
    this.domains = {
        production: 'oslira.com',
        staging: 'oslira.org',
        netlifyStaging: 'osliratest.netlify.app'
    };
    
    // Initialize page map first
    this.pageMap = null;
    this.pageTypes = null;
    
    // Initialization (ORDER MATTERS)
    this.detectEnvironment();
    this.detectRootDomain();
    this.buildPageRegistry();  // ← MUST be before detectCurrentPage
    this.detectCurrentPage();
        
        console.log('🌍 [EnvDetector] Initialized:', {
            env: this.environment,
            page: this.currentPage,
            pageType: this.pageType,
            requiresAuth: this.requiresAuth()
        });
    }
    
    // =========================================================================
    // ENVIRONMENT DETECTION
    // =========================================================================
    
    /**
     * Detect current environment from hostname
     */
    detectEnvironment() {
        // Check for production
        this.isProduction = this.hostname === this.domains.production || 
                           this.hostname.endsWith('.oslira.com');
        
        // Check for staging
        this.isStaging = this.hostname === this.domains.staging || 
                        this.hostname === this.domains.netlifyStaging ||
                        this.hostname.endsWith('.oslira.org');
        
        // Check for development
        this.isDevelopment = this.hostname === 'localhost' || 
                           this.hostname === '127.0.0.1';
        
        // Set environment string
        this.environment = this.isProduction ? 'production' : 
                          (this.isStaging ? 'staging' : 'development');
        
        // Set worker URL based on environment
        if (this.isDevelopment) {
            this.workerUrl = 'http://localhost:8787';
        } else if (this.isProduction) {
            this.workerUrl = 'https://api.oslira.com';
        } else {
            this.workerUrl = 'https://api.oslira.org';
        }
        
        console.log('🔧 [EnvDetector] Environment:', this.environment);
    }
    
    /**
     * Extract root domain from hostname
     */
    detectRootDomain() {
        const hostParts = this.hostname.split('.');
        
        if (hostParts.length >= 2) {
            // Get last two parts (domain + TLD)
            this.rootDomain = hostParts.slice(-2).join('.');
        } else {
            // Fallback for localhost
            this.rootDomain = this.hostname;
        }
        
        // Extract subdomain
        this.subdomain = hostParts.length > 2 ? 
            hostParts[0].replace(/^staging-/, '') : null;
        
        console.log('🔗 [EnvDetector] Root domain:', this.rootDomain, '| Subdomain:', this.subdomain);
    }
    
    // =========================================================================
    // PAGE DETECTION
    // =========================================================================
    
    /**
     * Build complete page registry
     */
    buildPageRegistry() {
        this.pageMap = {
            // Root marketing
            '/': 'home',
            '/index.html': 'home',
            
            // App subdomain
            '/dashboard': 'dashboard',
            '/leads': 'leads',
            '/analytics': 'analytics',
            '/campaigns': 'campaigns',
            '/automations': 'automations',
            '/messages': 'messages',
            '/integrations': 'integrations',
            '/subscription': 'subscription',
            '/onboarding': 'onboarding',
            
            // Settings
            '/settings': 'settings',
            '/settings/profile': 'settings-profile',
            '/settings/account': 'settings-account',
            '/settings/billing': 'settings-billing',
            '/settings/usage': 'settings-usage',
            
            // Auth subdomain
            '/auth': 'auth',
            '/auth/callback': 'auth-callback',
            
            // Admin subdomain
            '/admin': 'admin',
            
            // Marketing/footer pages
            '/footer/about': 'about',
            '/footer/pricing': 'pricing',
            '/footer/security': 'security-page',
            '/footer/help': 'help',
            '/footer/guides': 'guides',
            '/footer/case-studies': 'case-studies',
            '/footer/api': 'api-docs',
            
            // Legal subdomain
            '/footer/terms': 'terms',
            '/footer/privacy': 'privacy',
            '/footer/refund': 'refund',
            '/footer/disclaimer': 'disclaimer',
            '/terms': 'terms',
            '/privacy': 'privacy',
            '/refund': 'refund',
            '/disclaimer': 'disclaimer',
            
            // Contact subdomain
            '/footer/contact': 'contact-hub',
            '/contact': 'contact-hub',
            '/contact/support': 'contact-support',
            '/contact/sales': 'contact-sales',
            '/contact/security': 'contact-security',
            '/contact/bug-report': 'contact-bug-report',
            '/contact/legal': 'contact-legal',
            
            // Status subdomain
            '/footer/status': 'status',
            '/status': 'status'
        };
        
        // Page type classifications
        this.pageTypes = {
            PUBLIC: [
                'home', 'about', 'api-docs', 'case-studies', 'guides', 'help',
                'pricing', 'security-page', 'status', 'contact-hub', 'contact-support',
                'contact-sales', 'contact-security', 'contact-bug-report', 'contact-legal',
                'privacy', 'terms', 'refund', 'disclaimer'
            ],
            AUTH_ONLY: ['auth', 'auth-callback'],
            AUTH_REQUIRED: [
                'dashboard', 'settings', 'settings-profile', 'settings-account',
                'settings-billing', 'settings-usage', 'analytics', 'campaigns',
                'leads', 'messages', 'integrations', 'subscription', 'automations'
            ],
            ONBOARDING_REQUIRED: ['onboarding'],
            ADMIN_REQUIRED: ['admin']
        };
    }
    
    /**
     * Detect current page from URL
     */
    detectCurrentPage() {
        // STEP 1: Check exact path match
        if (this.pageMap[this.pathname]) {
            this.currentPage = this.pageMap[this.pathname];
            this.pageType = this.getPageType(this.currentPage);
            return;
        }
        
        // STEP 2: Try without trailing slash
        const pathWithoutSlash = this.pathname.replace(/\/$/, '');
        if (this.pageMap[pathWithoutSlash]) {
            this.currentPage = this.pageMap[pathWithoutSlash];
            this.pageType = this.getPageType(this.currentPage);
            return;
        }
        
        // STEP 3: Dynamic pattern matching
        if (this.pathname.startsWith('/admin')) {
            this.currentPage = 'admin';
            this.pageType = 'ADMIN_REQUIRED';
            return;
        }
        
        if (this.pathname.startsWith('/settings/')) {
            const settingsPath = this.pathname.split('/')[2];
            this.currentPage = settingsPath ? `settings-${settingsPath}` : 'settings';
            this.pageType = 'AUTH_REQUIRED';
            return;
        }
        
        if (this.pathname.startsWith('/settings')) {
            this.currentPage = 'settings';
            this.pageType = 'AUTH_REQUIRED';
            return;
        }
        
        if (this.pathname.startsWith('/auth/callback')) {
            this.currentPage = 'auth-callback';
            this.pageType = 'AUTH_ONLY';
            return;
        }
        
        if (this.pathname.startsWith('/contact/') || this.pathname.startsWith('/footer/contact/')) {
            this.currentPage = 'contact-hub';
            this.pageType = 'PUBLIC';
            return;
        }
        
        if (this.pathname.startsWith('/footer/legal/')) {
            this.currentPage = 'privacy';
            this.pageType = 'PUBLIC';
            return;
        }
        
        if (this.pathname.startsWith('/footer/')) {
            this.currentPage = 'about';
            this.pageType = 'PUBLIC';
            return;
        }
        
        // STEP 4: Root path with subdomain context
        if (this.pathname === '/' || this.pathname === '' || this.pathname === '/index.html') {
            switch(this.subdomain) {
                case 'auth':
                    this.currentPage = 'auth';
                    this.pageType = 'AUTH_ONLY';
                    return;
                case 'app':
                    if (this.pathname.startsWith('/admin')) {
                        this.currentPage = 'admin';
                        this.pageType = 'ADMIN_REQUIRED';
                    } else {
                        this.currentPage = 'dashboard';
                        this.pageType = 'AUTH_REQUIRED';
                    }
                    return;
                case 'legal':
                    this.currentPage = 'privacy';
                    this.pageType = 'PUBLIC';
                    return;
                case 'contact':
                    this.currentPage = 'contact-hub';
                    this.pageType = 'PUBLIC';
                    return;
                case 'status':
                    this.currentPage = 'status';
                    this.pageType = 'PUBLIC';
                    return;
                default:
                    this.currentPage = 'home';
                    this.pageType = 'PUBLIC';
                    return;
            }
        }
        
        // STEP 5: Fallback
        console.warn(`⚠️ [EnvDetector] Unknown path: ${this.pathname}, defaulting to home`);
        this.currentPage = 'home';
        this.pageType = 'PUBLIC';
    }
    
    /**
     * Get page type classification
     */
    getPageType(pageName) {
        for (const [type, pages] of Object.entries(this.pageTypes)) {
            if (pages.includes(pageName)) {
                return type;
            }
        }
        return 'PUBLIC';
    }
    
    // =========================================================================
    // URL BUILDERS (Subdomain-Aware)
    // =========================================================================
    
    /**
     * Get app subdomain URL
     */
    getAppUrl(path = '') {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `https://app.${this.rootDomain}${cleanPath}`;
    }
    
    /**
     * Get auth subdomain URL
     */
    getAuthUrl(path = '') {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `https://auth.${this.rootDomain}${cleanPath}`;
    }
    
    /**
     * Get admin URL (under app subdomain)
     */
    getAdminUrl(path = '') {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `https://app.${this.rootDomain}/admin${cleanPath}`;
    }
    
    /**
     * Get marketing (root) URL
     */
    getMarketingUrl(path = '') {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `https://${this.rootDomain}${cleanPath}`;
    }
    
    /**
     * Get legal subdomain URL
     */
    getLegalUrl(path = '') {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `https://legal.${this.rootDomain}${cleanPath}`;
    }
    
    /**
     * Get contact subdomain URL
     */
    getContactUrl(path = '') {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `https://contact.${this.rootDomain}${cleanPath}`;
    }
    
    /**
     * Get status subdomain URL
     */
    getStatusUrl(path = '') {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `https://status.${this.rootDomain}${cleanPath}`;
    }
    
    // =========================================================================
    // AUTH REQUIREMENT CHECKS
    // =========================================================================
    
    /**
     * Check if current page is public
     */
    isPublicPage() {
        return this.pageType === 'PUBLIC';
    }
    
    /**
     * Check if current page is auth-only
     */
    isAuthPage() {
        return this.pageType === 'AUTH_ONLY';
    }
    
    /**
     * Check if current page requires authentication
     */
    requiresAuth() {
        return ['AUTH_REQUIRED', 'ONBOARDING_REQUIRED', 'ADMIN_REQUIRED'].includes(this.pageType);
    }
    
    /**
     * Check if current page requires onboarding
     */
    requiresOnboarding() {
        return this.pageType === 'ONBOARDING_REQUIRED';
    }
    
    /**
     * Check if current page requires admin
     */
    requiresAdmin() {
        return this.pageType === 'ADMIN_REQUIRED';
    }
    
    // =========================================================================
    // REDIRECT HELPERS
    // =========================================================================
    
    /**
     * Get redirect URL for unauthenticated user
     */
    getUnauthenticatedRedirect() {
        if (this.isAuthPage()) {
            return null; // Already on auth page
        }
        return this.getAuthUrl();
    }
    
    /**
     * Get redirect URL for authenticated user on auth page
     */
    getAuthenticatedRedirect(needsOnboarding = false) {
        if (needsOnboarding) {
            return this.getAppUrl('/onboarding');
        }
        
        // If already on protected page, stay there
        if (this.requiresAuth()) {
            return null;
        }
        
        // Default to dashboard
        return this.getAppUrl('/dashboard');
    }
    
    // =========================================================================
    // GETTERS (Compatibility with old env-manager)
    // =========================================================================
    
    get ENV() { return this.environment; }
    get IS_PRODUCTION() { return this.isProduction; }
    get IS_STAGING() { return this.isStaging; }
    get IS_DEVELOPMENT() { return this.isDevelopment; }
    get WORKER_URL() { return this.workerUrl; }
    get BASE_URL() { return this.origin; }
    get CURRENT_PAGE() { return this.currentPage; }
    get PAGE_TYPE() { return this.pageType; }
    get PATHNAME() { return this.pathname; }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Get environment color for UI
     */
    getEnvironmentColor() {
        if (this.isProduction) return '#10b981';
        if (this.isStaging) return '#f59e0b';
        return '#6b7280';
    }
    
    /**
     * Check if on primary domain
     */
    isPrimaryDomain() {
        return this.isProduction;
    }
    
    /**
     * Debug info
     */
    debug() {
        console.group('🌍 [EnvDetector] Debug Info');
        console.log('Environment:', this.environment);
        console.log('Hostname:', this.hostname);
        console.log('Root Domain:', this.rootDomain);
        console.log('Subdomain:', this.subdomain);
        console.log('Pathname:', this.pathname);
        console.log('Current Page:', this.currentPage);
        console.log('Page Type:', this.pageType);
        console.log('Requires Auth:', this.requiresAuth());
        console.log('Worker URL:', this.workerUrl);
        console.groupEnd();
    }
    
    /**
     * Get all info as object
     */
    getInfo() {
        return {
            environment: this.environment,
            isDevelopment: this.isDevelopment,
            isStaging: this.isStaging,
            isProduction: this.isProduction,
            hostname: this.hostname,
            rootDomain: this.rootDomain,
            subdomain: this.subdomain,
            pathname: this.pathname,
            currentPage: this.currentPage,
            pageType: this.pageType,
            requiresAuth: this.requiresAuth(),
            workerUrl: this.workerUrl
        };
    }
}

// =============================================================================
// GLOBAL EXPORT & AUTO-INITIALIZATION
// =============================================================================
// Export for ES6 modules
export default EnvDetector;

// Also keep window global for backwards compatibility
if (typeof window !== 'undefined') {
    window.EnvDetector = EnvDetector;
}
