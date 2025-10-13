// =============================================================================
// CONFIG PROVIDER - AWS Parameter Store Configuration Management
// Path: /public/core/infrastructure/ConfigProvider.js
// Dependencies: EnvDetector, Logger, HttpClient
// =============================================================================

/**
 * @class ConfigProvider
 * @description Fetches and manages configuration from AWS Parameter Store
 * 
 * Features:
 * - Async config loading from Worker → AWS
 * - Environment-specific configs (dev/staging/prod)
 * - LocalStorage caching with expiration
 * - Fallback to cached config on failure
 * - Read-only after initialization
 * - Retry logic with exponential backoff
 */
class ConfigProvider {
    constructor() {
        this.config = {};
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
        
        this.envDetector = null;
        this.logger = null;
        this.httpClient = null;
        
        // Cache config
        this.cacheKey = 'oslira-config-cache';
        this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
        
        // Retry config
        this.maxRetries = 3;
        this.retryCount = 0;
        
        console.log('🔧 [ConfigProvider] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize config provider
     */
    async initialize(dependencies = {}) {
        // Prevent duplicate initialization
        if (this.isLoading) {
            console.log('⏳ [ConfigProvider] Already loading, waiting...');
            return this.loadPromise;
        }
        
        if (this.isLoaded) {
            console.log('✅ [ConfigProvider] Already loaded');
            return true;
        }
        
        this.isLoading = true;
        
        console.log('🔧 [ConfigProvider] Initializing...');
        
        // Create promise for others to await
        this.loadPromise = this._initializeInternal(dependencies);
        
        try {
await this.loadPromise;
this.isLoaded = true;
this.isLoading = false;
console.log('✅ [ConfigProvider] Initialization complete');

// Register with Coordinator after successful initialization
if (window.Oslira?.init) {
    window.Oslira.init.register('ConfigProvider', this);
    console.log('📋 [ConfigProvider] Registered with Coordinator');
}

return true;
            
        } catch (error) {
            this.isLoading = false;
            console.error('❌ [ConfigProvider] Initialization failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'ConfigProvider', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Internal initialization logic
     */
    async _initializeInternal(dependencies) {
        try {
            // STEP 1: Get dependencies
            this.envDetector = dependencies.envDetector;
            this.logger = dependencies.logger;
            this.httpClient = dependencies.httpClient;
            
            if (!this.envDetector) {
                throw new Error('EnvDetector dependency missing');
            }
            
            // STEP 2: Try to load from cache first (for fast startup)
            const cachedConfig = this._loadFromCache();
            if (cachedConfig) {
                this.config = cachedConfig;
                console.log('✅ [ConfigProvider] Loaded from cache');
                
                // Fetch fresh config in background
                this._refreshConfigInBackground();
                return;
            }
            
            // STEP 3: Fetch from AWS (via Worker)
            await this._fetchFromAWS();
            
        } catch (error) {
            console.error('❌ [ConfigProvider] Internal initialization failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // CONFIG FETCHING
    // =========================================================================
    
    /**
     * Fetch config from AWS Parameter Store via Worker
     */
    async _fetchFromAWS() {
        const environment = this.envDetector.environment;
        const workerUrl = this.envDetector.workerUrl;
        
        console.log('🔧 [ConfigProvider] Fetching config from AWS:', {
            environment,
            workerUrl
        });
        
        try {
            // Build fetch URL
            const url = `${workerUrl}/api/public-config?env=${environment}`;
            
            // Fetch with retry logic
            let lastError = null;
            
            for (let attempt = 0; attempt < this.maxRetries; attempt++) {
                try {
                    const response = await fetch(url, {
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
                    
                    // Store config
                    this.config = result.data;
                    
                    // Cache config
                    this._saveToCache(this.config);
                    
                    console.log('✅ [ConfigProvider] Config fetched from AWS:', {
                        environment: this.config.environment,
                        hasSupabaseUrl: !!this.config.supabaseUrl,
                        hasSupabaseKey: !!this.config.supabaseAnonKey,
                        hasStripeKey: !!this.config.stripePublishableKey
                    });
                    
                    return;
                    
                } catch (error) {
                    lastError = error;
                    console.error(`❌ [ConfigProvider] Fetch attempt ${attempt + 1}/${this.maxRetries} failed:`, error);
                    
                    // Wait before retry (exponential backoff)
                    if (attempt < this.maxRetries - 1) {
                        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            // All retries failed
            throw new Error(`Failed to fetch config after ${this.maxRetries} attempts: ${lastError.message}`);
            
        } catch (error) {
            console.error('❌ [ConfigProvider] AWS fetch failed:', error);
            
            // Try to use cached config as fallback
            const cachedConfig = this._loadFromCache();
            if (cachedConfig) {
                console.warn('⚠️ [ConfigProvider] Using cached config as fallback');
                this.config = cachedConfig;
                return;
            }
            
            throw error;
        }
    }
    
    /**
     * Refresh config in background (non-blocking)
     */
    _refreshConfigInBackground() {
        setTimeout(async () => {
            try {
                console.log('🔄 [ConfigProvider] Refreshing config in background...');
                await this._fetchFromAWS();
                console.log('✅ [ConfigProvider] Background refresh complete');
            } catch (error) {
                console.warn('⚠️ [ConfigProvider] Background refresh failed:', error);
            }
        }, 100);
    }
    
    // =========================================================================
    // CACHING
    // =========================================================================
    
    /**
     * Load config from localStorage cache
     */
    _loadFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) {
                return null;
            }
            
            const { timestamp, data } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            
            // Check if cache is still valid
            if (age > this.cacheTTL) {
                console.log('⏰ [ConfigProvider] Cache expired');
                localStorage.removeItem(this.cacheKey);
                return null;
            }
            
            console.log(`✅ [ConfigProvider] Cache hit (age: ${Math.round(age / 60000)} minutes)`);
            return data;
            
        } catch (error) {
            console.error('❌ [ConfigProvider] Cache load failed:', error);
            return null;
        }
    }
    
    /**
     * Save config to localStorage cache
     */
    _saveToCache(config) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                data: config
            };
            
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
            console.log('✅ [ConfigProvider] Config cached');
            
        } catch (error) {
            console.error('❌ [ConfigProvider] Cache save failed:', error);
        }
    }
    
    /**
     * Clear config cache
     */
    clearCache() {
        try {
            localStorage.removeItem(this.cacheKey);
            console.log('🗑️ [ConfigProvider] Cache cleared');
        } catch (error) {
            console.error('❌ [ConfigProvider] Cache clear failed:', error);
        }
    }
    
    // =========================================================================
    // CONFIG ACCESS (Read-Only)
    // =========================================================================
    
    /**
     * Get config value by key
     */
    get(key) {
        if (!this.isLoaded) {
            throw new Error('Config not loaded. Call await configProvider.initialize() first');
        }
        
        return this.config[key];
    }
    
    /**
     * Get all config
     */
    getAll() {
        if (!this.isLoaded) {
            throw new Error('Config not loaded. Call await configProvider.initialize() first');
        }
        
        return { ...this.config };
    }
    
    /**
     * Check if config key exists
     */
    has(key) {
        return key in this.config;
    }
    
    // =========================================================================
    // SPECIFIC CONFIG GETTERS
    // =========================================================================
    
    /**
     * Get Supabase URL
     */
    getSupabaseUrl() {
        return this.get('supabaseUrl');
    }
    
    /**
     * Get Supabase anon key
     */
    getSupabaseAnonKey() {
        return this.get('supabaseAnonKey');
    }
    
    /**
     * Get Stripe publishable key
     */
    getStripePublishableKey() {
        return this.get('stripePublishableKey');
    }
    
    /**
     * Get frontend URL
     */
    getFrontendUrl() {
        return this.get('frontendUrl');
    }
    
    /**
     * Get Supabase config object (for AuthManager)
     */
    getSupabaseConfig() {
        return {
            url: this.getSupabaseUrl(),
            key: this.getSupabaseAnonKey()
        };
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate required config fields
     */
    validate() {
        const required = [
            'supabaseUrl',
            'supabaseAnonKey',
            'stripePublishableKey',
            'frontendUrl',
            'environment'
        ];
        
        const missing = [];
        
        for (const field of required) {
            if (!this.config[field]) {
                missing.push(field);
            }
        }
        
        if (missing.length > 0) {
            const error = new Error(`Missing required config fields: ${missing.join(', ')}`);
            console.error('❌ [ConfigProvider] Validation failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'ConfigProvider', action: 'validate' },
                    extra: { missing }
                });
            }
            
            throw error;
        }
        
        console.log('✅ [ConfigProvider] Validation passed');
        return true;
    }
    
    // =========================================================================
    // REFRESH
    // =========================================================================
    
    /**
     * Manually refresh config from AWS
     */
    async refresh() {
        console.log('🔄 [ConfigProvider] Manual refresh triggered');
        
        try {
            await this._fetchFromAWS();
            console.log('✅ [ConfigProvider] Refresh complete');
        } catch (error) {
            console.error('❌ [ConfigProvider] Refresh failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // WAITING
    // =========================================================================
    
    /**
     * Wait for config to be loaded
     */
    async ready() {
        if (this.isLoaded) {
            return true;
        }
        
        if (this.loadPromise) {
            await this.loadPromise;
            return true;
        }
        
        throw new Error('Config not initialized. Call initialize() first');
    }
    
    // =========================================================================
    // DEBUG & UTILITIES
    // =========================================================================
    
    /**
     * Get debug info (masks sensitive data)
     */
    getDebugInfo() {
        return {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            environment: this.config.environment,
            hasSupabaseUrl: !!this.config.supabaseUrl,
            hasSupabaseKey: !!this.config.supabaseAnonKey,
            hasStripeKey: !!this.config.stripePublishableKey,
            hasFrontendUrl: !!this.config.frontendUrl,
            cacheAge: this._getCacheAge(),
            retryCount: this.retryCount
        };
    }
    
    /**
     * Get cache age in minutes
     */
    _getCacheAge() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;
            
            const { timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            return Math.round(age / 60000);
            
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Print debug info
     */
    debug() {
        console.group('🔧 [ConfigProvider] Debug Info');
        console.log('Status:', {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading
        });
        console.log('Config:', this.getDebugInfo());
        console.groupEnd();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Destroy config provider
     */
    destroy() {
        this.config = {};
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
        
        console.log('🗑️ [ConfigProvider] Destroyed');
    }
}



// =============================================================================
// ES6 MODULE EXPORT
// =============================================================================
export default ConfigProvider;
