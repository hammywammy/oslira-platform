// =============================================================================
// CONFIG MANAGER - THIN WRAPPER AROUND ENV-MANAGER
// Simplified to trust that env-manager has already loaded config
// =============================================================================

class OsliraConfigManager {
    constructor() {
        this.config = {};
        this.initialized = false;
        
        console.log('🔧 [Config] Initializing config manager');
        this.initialize();
    }
    
    initialize() {
        // Config should already be loaded by timing-manager's config-fetch phase
        // Just copy values from env-manager
        
        if (!window.OsliraEnv) {
            throw new Error('OsliraEnv not available - initialization order error');
        }
        
        if (!window.OsliraEnv.configLoaded) {
            console.warn('⚠️ [Config] Config not loaded yet - timing issue');
            throw new Error('Config not loaded - should be loaded in config-fetch phase');
        }
        
        // Copy all config from env-manager
        this.config = {
            // Environment info (synchronous, always available)
            environment: window.OsliraEnv.ENV,
            currentPage: window.OsliraEnv.CURRENT_PAGE,
            isProduction: window.OsliraEnv.IS_PRODUCTION,
            isStaging: window.OsliraEnv.IS_STAGING,
            isDevelopment: window.OsliraEnv.IS_DEVELOPMENT,
            baseUrl: window.OsliraEnv.BASE_URL,
            authCallbackUrl: window.OsliraEnv.AUTH_CALLBACK_URL,
            workerUrl: window.OsliraEnv.WORKER_URL,
            
            // Config from AWS (loaded async, now available)
            supabaseUrl: window.OsliraEnv.SUPABASE_URL,
            supabaseAnonKey: window.OsliraEnv.SUPABASE_ANON_KEY,
            stripePublishableKey: window.OsliraEnv.STRIPE_PUBLISHABLE_KEY,
            frontendUrl: window.OsliraEnv.FRONTEND_URL,
            
            // Uppercase aliases for compatibility
            WORKER_URL: window.OsliraEnv.WORKER_URL,
            SUPABASE_URL: window.OsliraEnv.SUPABASE_URL,
            SUPABASE_ANON_KEY: window.OsliraEnv.SUPABASE_ANON_KEY
        };
        
        this.initialized = true;
        
        console.log('✅ [Config] Configuration loaded:', {
            environment: this.config.environment,
            currentPage: this.config.currentPage,
            workerUrl: this.config.workerUrl,
            hasSupabaseUrl: !!this.config.supabaseUrl,
            hasSupabaseKey: !!this.config.supabaseAnonKey,
            hasStripeKey: !!this.config.stripePublishableKey
        });
        
        // Validate required fields
        this.validateConfiguration();
    }

    // Supabase config getter for auth-manager
getSupabaseConfig() {
    if (!this.initialized) {
        throw new Error('Config manager not initialized');
    }
    
    return {
        url: this.config.supabaseUrl,
        key: this.config.supabaseAnonKey
    };
}

// Async version for compatibility
async getConfig() {
    return this.config;
}
    
    validateConfiguration() {
        const required = ['supabaseUrl', 'supabaseAnonKey', 'workerUrl'];
        const missing = required.filter(key => !this.config[key]);
        
        if (missing.length > 0) {
            console.error('🚨 [Config] Missing required configuration:', missing);
            throw new Error(`Missing required config: ${missing.join(', ')}`);
        }
        
        console.log('✅ [Config] All required fields present');
    }
    
    // =============================================================================
    // PUBLIC API
    // =============================================================================
    
    get(key) {
        if (!this.initialized) {
            throw new Error('Config manager not initialized');
        }
        
        return this.config[key];
    }
    
    getAll() {
        if (!this.initialized) {
            throw new Error('Config manager not initialized');
        }
        
        return { ...this.config };
    }
    
    // Environment helpers
    isProduction() {
        return this.config.isProduction;
    }
    
    isStaging() {
        return this.config.isStaging;
    }
    
    isDevelopment() {
        return this.config.isDevelopment;
    }
    
    getEnvironment() {
        return this.config.environment;
    }
    
    // Specific getters for common config
    getWorkerUrl() {
        return this.config.workerUrl;
    }
    
    getSupabaseUrl() {
        return this.config.supabaseUrl;
    }
    
    getSupabaseAnonKey() {
        return this.config.supabaseAnonKey;
    }
    
    getStripePublishableKey() {
        return this.config.stripePublishableKey;
    }
    
    getCurrentPage() {
        return this.config.currentPage;
    }
    
    // Debug method
    debug() {
        console.group('🔧 [Config] Debug Information');
        console.log('Initialized:', this.initialized);
        console.log('Config:', this.config);
        console.groupEnd();
    }
}

// =============================================================================
// GLOBAL SINGLETON
// =============================================================================

window.OsliraConfig = new OsliraConfigManager();

console.log('🔧 [Config] Manager loaded and initialized');
