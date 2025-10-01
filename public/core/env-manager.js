// =============================================================================
// CENTRALIZED ENVIRONMENT & PAGE MANAGER - ASYNC CONFIG LOADING
// Single source of truth for environment detection AND page detection
// =============================================================================

class OsliraEnvManager { 
    constructor() {
        this.hostname = window.location.hostname;
        this.origin = window.location.origin;
        this.pathname = window.location.pathname;
        
        // DOMAIN CONFIGURATION - Single place to update
        this.domains = {
            production: 'oslira.com',
            staging: 'oslira.org', 
            netlifyStaging: 'osliratest.netlify.app'
        };
        
        // Config loading state
        this.configLoaded = false;
        this.configPromise = null;
        this.configError = null;
        
        // Initialize environment detection (synchronous)
        this.initEnvironment();
        this.initPageDetection();
        
        console.log('🌍 [Env] Environment & Page Setup:', {
            environment: this.environment,
            hostname: this.hostname,
            currentPage: this._currentPage,
            pageType: this._pageType,
            workerUrl: this.workerUrl,
            configLoaded: this.configLoaded
        });
    }
    
    // =============================================================================
    // ENVIRONMENT DETECTION (SYNCHRONOUS)
    // =============================================================================
    
    initEnvironment() {
        // Environment detection
        this.isProduction = this.hostname === this.domains.production;
        this.isStaging = this.hostname === this.domains.staging || 
                        this.hostname === this.domains.netlifyStaging;
        this.isDevelopment = this.hostname === 'localhost' || 
                           this.hostname === '127.0.0.1';
        
        // Environment string
        this.environment = this.isProduction ? 'production' : 
                          (this.isStaging ? 'staging' : 'development');
        
        // Worker URLs based on environment
        this.workerUrl = this.isProduction 
            ? 'https://api.oslira.com'
            : 'https://api-staging.oslira.com';
        
        // Auth callback URLs
        this.authCallbackUrl = `${this.origin}/auth/callback`;
        
        console.log('🔧 [Env] Environment detected:', {
            environment: this.environment,
            workerUrl: this.workerUrl,
            authCallback: this.authCallbackUrl
        });
    }
    
    // =============================================================================
    // PAGE DETECTION (SYNCHRONOUS)
    // =============================================================================
    
    initPageDetection() {
        // Page mapping (exact pathname to page name)
        this.pageMap = {
            // Core app pages
            '/': 'home',
            '/dashboard': 'dashboard',
            '/auth': 'auth',
            '/onboarding': 'onboarding',
            '/subscription': 'subscription',
            '/admin': 'admin',
            
            // Settings & profile
            '/settings': 'settings',
            '/analytics': 'analytics',
            '/campaigns': 'campaigns',
            '/leads': 'leads',
            '/messages': 'messages',
            '/integrations': 'integrations',
            
            // Footer pages (public)
            '/footer/about': 'about',
            '/footer/api-docs': 'api-docs',
            '/footer/case-studies': 'case-studies',
            '/footer/guides': 'guides',
            '/footer/help': 'help',
            '/footer/pricing': 'pricing',
            '/footer/security-page': 'security-page',
            '/footer/status': 'status',
            '/footer/contact': 'contact-hub',
            
            // Legal pages (public)
            '/footer/legal/privacy': 'privacy',
            '/footer/legal/terms': 'terms',
            '/footer/legal/refund': 'refund',
            '/footer/legal/disclaimer': 'disclaimer'
        };
        
        // PAGE TYPE CLASSIFICATION
        this.pageTypes = {
            PUBLIC: [
                'home', 'about', 'api-docs', 'case-studies', 'guides', 'help', 
                'pricing', 'security-page', 'status', 'contact-hub', 'privacy', 'terms', 
                'refund', 'disclaimer'
            ],
            AUTH_ONLY: ['auth', 'auth-callback'], 
            AUTH_REQUIRED: [
                'dashboard', 'settings', 'analytics', 'campaigns', 
                'leads', 'messages', 'integrations', 'subscription'
            ],
            ONBOARDING_REQUIRED: ['onboarding'],
            ADMIN_REQUIRED: ['admin']
        };
        
        this._currentPage = this.detectCurrentPage();
        this._pageType = this.classifyPage(this._currentPage);
    }
    
    detectCurrentPage() {
        // Exact match first
        if (this.pageMap[this.pathname]) {
            return this.pageMap[this.pathname];
        }

        // Try without trailing slash
        const pathWithoutSlash = this.pathname.replace(/\/$/, '');
        if (this.pageMap[pathWithoutSlash]) {
            return this.pageMap[pathWithoutSlash];
        }
        
        // Pattern matching for dynamic paths
        if (this.pathname.startsWith('/auth/callback')) {
            return 'auth-callback';
        }
        
        if (this.pathname.startsWith('/footer/legal/')) {
            return 'privacy';
        }
        
        if (this.pathname.startsWith('/footer/')) {
            return 'about';
        }
        
        // Root level detection
        if (this.pathname === '/' || this.pathname === '' || this.pathname === '/index.html') {
            return 'home';
        }
        
        return 'home';
    }
    
    classifyPage(pageName) {
        for (const [classification, pages] of Object.entries(this.pageTypes)) {
            if (pages.includes(pageName)) {
                return classification;
            }
        }
        return 'PUBLIC';
    }
    
    // =============================================================================
    // ASYNC CONFIG LOADING FROM AWS (VIA WORKER)
    // =============================================================================
    
    /**
     * Load configuration from Worker /config endpoint (which fetches from AWS)
     * This is called once during initialization and cached for the session
     */
    async loadConfigFromAWS() {
        // Prevent duplicate loads
        if (this.configPromise) {
            return this.configPromise;
        }
        
        this.configPromise = (async () => {
            try {
                console.log('🔄 [Env] Loading config from Worker:', {
                    workerUrl: this.workerUrl,
                    environment: this.environment
                });
                
                const response = await fetch(`${this.workerUrl}/api/public-config?env=${this.environment}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Config fetch failed: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (!result.success || !result.data) {
                    throw new Error(`Invalid config response: ${result.error || 'missing data'}`);
                }
                
                const config = result.data;
                
                // Populate properties from AWS config
                this.supabaseUrl = config.supabaseUrl;
                this.supabaseAnonKey = config.supabaseAnonKey;
                this.stripePublishableKey = config.stripePublishableKey;
                this.frontendUrl = config.frontendUrl;
                
                // Mark config as loaded
                this.configLoaded = true;
                
                console.log('✅ [Env] Config loaded from AWS:', {
                    environment: config.environment,
                    hasSupabaseUrl: !!this.supabaseUrl,
                    hasSupabaseKey: !!this.supabaseAnonKey,
                    hasStripeKey: !!this.stripePublishableKey,
                    frontendUrl: this.frontendUrl
                });
                
                // Cache in localStorage for offline fallback
                try {
                    localStorage.setItem('oslira-config-cache', JSON.stringify({
                        timestamp: Date.now(),
                        environment: this.environment,
                        data: config
                    }));
                } catch (e) {
                    console.warn('⚠️ [Env] Failed to cache config in localStorage:', e);
                }
                
                // Dispatch ready event
                window.dispatchEvent(new CustomEvent('oslira:config:ready', {
                    detail: { environment: this.environment, config }
                }));
                
                // Remove loading overlay if present
                const loadingOverlay = document.getElementById('oslira-config-loading');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
                
                return config;
                
            } catch (error) {
                console.error('❌ [Env] Failed to load config from AWS:', error);
                this.configError = error;
                
                // Try to load from localStorage cache as fallback
                try {
                    const cached = localStorage.getItem('oslira-config-cache');
                    if (cached) {
                        const { timestamp, data } = JSON.parse(cached);
                        const age = Date.now() - timestamp;
                        
                        // Use cache if less than 24 hours old
                        if (age < 24 * 60 * 60 * 1000) {
                            console.warn('⚠️ [Env] Using cached config (age: ' + Math.round(age / 60000) + ' minutes)');
                            
                            this.supabaseUrl = data.supabaseUrl;
                            this.supabaseAnonKey = data.supabaseAnonKey;
                            this.stripePublishableKey = data.stripePublishableKey;
                            this.frontendUrl = data.frontendUrl;
                            this.configLoaded = true;
                            
                            window.dispatchEvent(new CustomEvent('oslira:config:ready', {
                                detail: { environment: this.environment, config: data, cached: true }
                            }));
                            
                            return data;
                        }
                    }
                } catch (cacheError) {
                    console.error('❌ [Env] Failed to load cached config:', cacheError);
                }
                
                throw new Error(`Failed to load configuration: ${error.message}`);
            }
        })();
        
        return this.configPromise;
    }
    
    /**
     * Public method to wait for config to be ready
     * All components should call this before accessing config
     */
    async ready() {
        if (this.configLoaded) {
            return true;
        }
        
        if (!this.configPromise) {
            await this.loadConfigFromAWS();
        } else {
            await this.configPromise;
        }
        
        return this.configLoaded;
    }
    
    // =============================================================================
    // PUBLIC API - Getters (with validation)
    // =============================================================================
    
    // Environment getters (synchronous, always available)
    get ENV() { return this.environment; }
    get IS_PRODUCTION() { return this.isProduction; }
    get IS_STAGING() { return this.isStaging; }
    get IS_DEVELOPMENT() { return this.isDevelopment; }
    get WORKER_URL() { return this.workerUrl; }
    get BASE_URL() { return this.origin; }
    get AUTH_CALLBACK_URL() { return this.authCallbackUrl; }
    
    // Page getters (synchronous, always available)
    get CURRENT_PAGE() { return this._currentPage; }
    get PAGE_TYPE() { return this._pageType; }
    get PATHNAME() { return this.pathname; }
    get currentPage() { return this._currentPage; }
    get pageType() { return this._pageType; }
    
    // Config getters (throw error if accessed before ready)
    get SUPABASE_URL() {
        if (!this.configLoaded) {
            throw new Error('Config not loaded. Call await window.OsliraEnv.ready() first');
        }
        return this.supabaseUrl;
    }
    
    get SUPABASE_ANON_KEY() {
        if (!this.configLoaded) {
            throw new Error('Config not loaded. Call await window.OsliraEnv.ready() first');
        }
        return this.supabaseAnonKey;
    }
    
    get STRIPE_PUBLISHABLE_KEY() {
        if (!this.configLoaded) {
            throw new Error('Config not loaded. Call await window.OsliraEnv.ready() first');
        }
        return this.stripePublishableKey;
    }
    
    get FRONTEND_URL() {
        if (!this.configLoaded) {
            throw new Error('Config not loaded. Call await window.OsliraEnv.ready() first');
        }
        return this.frontendUrl;
    }
    
    // Helper methods
    isPrimaryDomain() {
        return this.isProduction;
    }
    
    isPublicPage() {
        return this._pageType === 'PUBLIC';
    }

    isAuthPage() {
        return this._pageType === 'AUTH_ONLY';
    }

    requiresAuth() {
        return ['AUTH_REQUIRED', 'ONBOARDING_REQUIRED', 'ADMIN_REQUIRED'].includes(this._pageType);
    }

    requiresOnboarding() {
        return this._pageType === 'ONBOARDING_REQUIRED';
    }

    requiresAdmin() {
        return this._pageType === 'ADMIN_REQUIRED';
    }
    
    getEnvironmentColor() {
        if (this.isProduction) return '#10b981';
        if (this.isStaging) return '#f59e0b';
        return '#6b7280';
    }
    
    // Debug method
    debug() {
        console.group('🌍 [Env] Debug Information');
        console.log('Environment:', this.environment);
        console.log('Config Loaded:', this.configLoaded);
        console.log('Hostname:', this.hostname);
        console.log('Pathname:', this.pathname);
        console.log('Current Page:', this._currentPage);
        console.log('Page Type:', this._pageType);
        console.log('Worker URL:', this.workerUrl);
        console.log('Auth Callback:', this.authCallbackUrl);
        if (this.configLoaded) {
            console.log('Supabase URL:', this.supabaseUrl);
            console.log('Has Anon Key:', !!this.supabaseAnonKey);
            console.log('Has Stripe Key:', !!this.stripePublishableKey);
        }
        console.groupEnd();
    }
}

// =============================================================================
// GLOBAL SINGLETON - Available everywhere immediately
// =============================================================================

window.OsliraEnv = new OsliraEnvManager();

console.log('🌍 [Env] Manager loaded and ready for async config loading');
