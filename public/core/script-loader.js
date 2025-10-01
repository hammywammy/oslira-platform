// =============================================================================
// SCRIPT LOADER - CENTRALIZED DEPENDENCY MANAGEMENT WITH ASYNC CONFIG SUPPORT
// =============================================================================

// Prevent multiple declarations
if (typeof window.ScriptLoader !== 'undefined') {
    console.log('🔄 [ScriptLoader] Already loaded, skipping redeclaration');
} else {

class ScriptLoader {
    constructor() {
        this.loadedScripts = new Set();
        this.failedScripts = new Set();
        this.loadingPromises = new Map();
        

// Core script loading order (handled in phases within loadCoreScripts)
this.coreScripts = [
    'env-manager',
    'supabase',
    'config-manager', 
    'auth-manager',
    'simple-app'
];
        
        // Page-specific script configurations
        this.pageConfigs = {
            'dashboard': {
                scripts: [
                    '/core/api-client.js',
                    '/core/sidebar/sidebar-manager.js',
                    '/pages/dashboard/modules/core/DashboardCore.js',
                    '/pages/dashboard/modules/core/DashboardErrorSystem.js',
                    '/pages/dashboard/modules/core/DashboardEventSystem.js',
                    '/pages/dashboard/modules/core/dashboard-app.js',
                    '/pages/dashboard/modules/core/dependency-container.js',
                    '/pages/dashboard/modules/core/event-bus.js',
                    '/pages/dashboard/modules/core/state-manager.js',
                    '/pages/dashboard/modules/modals/components/tab-system.js',
                    '/pages/dashboard/modules/modals/components/modal-components.js',
                    '/pages/dashboard/modules/modals/configs/analysis-configs.js', 
                    '/pages/dashboard/modules/modals/modal-builder.js',
                    '/pages/dashboard/modules/analysis/analysis-functions.js',
                    '/pages/dashboard/modules/analysis/analysis-modal.js',
                    '/pages/dashboard/modules/analysis/analysis-queue.js',
                    '/pages/dashboard/modules/bulk/bulk-upload.js',
                    '/pages/dashboard/modules/business/business-manager.js',
                    '/pages/dashboard/modules/handlers/lead-analysis-handlers.js',
                    '/pages/dashboard/modules/handlers/research-handlers.js',
                    '/pages/dashboard/modules/leads/lead-manager.js',
                    '/pages/dashboard/modules/leads/lead-renderer.js',
                    '/pages/dashboard/modules/modals/research-modal.js',
                    '/pages/dashboard/modules/modals/bulk-modal.js',
                    '/pages/dashboard/modules/ui/stats-cards.js',
                    '/pages/dashboard/modules/realtime/realtime-manager.js',
                    '/pages/dashboard/modules/stats/stats-calculator.js',
                    '/pages/dashboard/modules/ui/dashboard-header.js',
                    '/pages/dashboard/modules/ui/dashboard-styles.js',
                    '/pages/dashboard/modules/ui/insights-panel.js',
                    '/pages/dashboard/modules/ui/leads-table.js',
                    '/pages/dashboard/modules/ui/modal-manager.js',
                    '/pages/dashboard/dashboard.js'
                ],
                requiresAuth: true,
                enableTailwind: true
            },
            
            'home': {
                scripts: [
                    '/core/api-client.js',
                    '/pages/home/homeHandlers.js',
                    '/pages/home/home.js',
                    '/core/footer/footer-manager.js'
                ],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'onboarding': {
                scripts: [
                    '/core/api-client.js',
                    '/core/form-manager.js',
                    '/pages/onboarding/onboarding-rules.js',
                    '/pages/onboarding/onboarding-validator.js', 
                    '/pages/onboarding/onboarding.js'
                ],
                requiresAuth: true,
                enableTailwind: true
            },
            
            'auth': {
                scripts: ['/pages/auth/auth.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'analytics': {
                scripts: ['/pages/analytics/analytics.js'],
                requiresAuth: true,
                enableTailwind: true
            },
            
            'campaigns': {
                scripts: ['/pages/campaigns/campaigns.js'],
                requiresAuth: true,
                enableTailwind: true
            },
            
            'leads': {
                scripts: ['/pages/leads/leads.js'],
                requiresAuth: true,
                enableTailwind: true
            },
            
            'settings': {
                scripts: ['/pages/settings/settings.js'],
                requiresAuth: true,
                enableTailwind: true
            },
            
            'subscription': {
                scripts: [
                    '/core/sidebar/sidebar-manager.js',
                    '/core/api-client.js',
                    '/pages/subscription/subscription.js'
                ],
                requiresAuth: true,
                enableTailwind: true
            },
            
            'admin': {
                scripts: ['/pages/admin/admin.js'],
                requiresAuth: true,
                enableTailwind: true
            },
            
            'about': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'pricing': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'case-studies': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'help': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'security-page': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'privacy': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'terms': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'refund': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'status': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            
            'disclaimer': {
                scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
                requiresAuth: false,
                enableTailwind: true
            },
            'contact-hub': {
    scripts: ['/core/footer/footer-manager.js', '/core/header/header-manager.js'],
    requiresAuth: false,
    enableTailwind: true
}
        };
        
        console.log('📦 [ScriptLoader] Initialized');
    }
    
    // =============================================================================
    // MAIN INITIALIZATION
    // =============================================================================
    
    async initialize() {
        try {
            console.log('🚀 [ScriptLoader] Initializing...');
            
            // Load core scripts first
            await this.loadCoreScripts();
            
            // Determine current page and load page-specific scripts
            const currentPage = window.OsliraEnv?.CURRENT_PAGE || 'home';
            console.log(`📄 [ScriptLoader] Loading scripts for page: ${currentPage}`);
            
            await this.loadPageScripts(currentPage);
            
            console.log('✅ [ScriptLoader] Initialization complete');
            
            // Dispatch loaded event
            setTimeout(() => {
                const scriptsLoadedEvent = new CustomEvent('oslira:scripts:loaded', {
                    detail: {
                        page: currentPage,
                        loadedScripts: Array.from(this.loadedScripts),
                        timestamp: Date.now()
                    }
                });
                window.dispatchEvent(scriptsLoadedEvent);
                console.log('📡 [ScriptLoader] oslira:scripts:loaded event dispatched');
            }, 50);
            
        } catch (error) {
            console.error('❌ [ScriptLoader] Initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    // =============================================================================
    // CORE SCRIPTS LOADING
    // =============================================================================
    
async loadCoreScripts() {
    console.log('🔧 [ScriptLoader] Loading core scripts with parallel optimization...');
    
    // Phase 1: Bootstrap - env-manager only (REQUIRED FIRST)
    console.log('📦 [ScriptLoader] Phase 1: Bootstrap');
    await this.loadScript('env-manager', '/core/env-manager.js');
    if (!window.OsliraEnv) {
        throw new Error('env-manager failed to expose OsliraEnv global');
    }
    
    // Phase 2: Start parallel loads IMMEDIATELY while config fetches
    console.log('📦 [ScriptLoader] Phase 2: Parallel core + config load');
    
    // Start all independent loads in parallel - DON'T AWAIT YET
    const supabasePromise = this.loadScript('supabase', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    const configReadyPromise = window.OsliraEnv.ready();
    
    // Wait for both to complete
    await Promise.all([supabasePromise, configReadyPromise]);
    
    if (!window.supabase?.createClient) {
        throw new Error('Supabase CDN failed to expose createClient function');
    }
    console.log('✅ [ScriptLoader] Supabase + Config ready');
    
    // Phase 3: Load config-manager and auth-manager in parallel
    console.log('📦 [ScriptLoader] Phase 3: Loading auth stack in parallel');
    await Promise.all([
        this.loadScript('config-manager', '/core/config-manager.js'),
        this.loadScript('auth-manager', '/core/auth-manager.js')
    ]);
    
    if (!window.OsliraConfig) {
        throw new Error('config-manager failed to expose OsliraConfig global');
    }
    if (!window.OsliraAuth) {
        throw new Error('auth-manager failed to expose OsliraAuth global');
    }
    
    console.log('✅ [ScriptLoader] All core scripts loaded');
}
    
getGlobalName(scriptName) {
    const globalMap = {
        'env-manager': 'OsliraEnv',
        'supabase': null,
        'config-manager': 'OsliraConfig', 
        'auth-manager': 'OsliraAuth',
        'simple-app': 'OsliraSimpleApp'
    };
    return globalMap[scriptName];
}
    
    // =============================================================================
    // PAGE SCRIPT LOADING WITH CONFIG WAIT
    // =============================================================================
    
    async loadPageScripts(pageName) {
        const pageConfig = this.pageConfigs[pageName];
        if (!pageConfig) {
            console.warn(`⚠️ [ScriptLoader] No configuration found for page: ${pageName}`);
            return;
        }
        
        console.log(`📦 [ScriptLoader] Loading ${pageConfig.scripts.length} scripts for ${pageName}`);
        
        // CRITICAL: Wait for async config to load before loading page scripts
        console.log('⏳ [ScriptLoader] Waiting for config to load...');
        try {
            await window.OsliraEnv.ready();
            console.log('✅ [ScriptLoader] Config ready, proceeding with page scripts');
        } catch (error) {
            console.error('❌ [ScriptLoader] Config loading failed:', error);
            
            // Show error to user
            const errorOverlay = document.getElementById('oslira-config-loading');
            if (errorOverlay) {
                errorOverlay.innerHTML = `
                    <div style="text-align: center;">
                        <div style="color: #ef4444; font-size: 18px; margin-bottom: 10px;">⚠️ Configuration Error</div>
                        <div style="color: #6b7280;">Failed to load application configuration.</div>
                        <div style="color: #6b7280; font-size: 14px; margin-top: 10px;">Please refresh the page or contact support.</div>
                        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Reload Page
                        </button>
                    </div>
                `;
            }
            
            throw error;
        }
        
        // Load stylesheets for this page FIRST
        if (pageConfig.stylesheets) {
            const stylesheetPromises = pageConfig.stylesheets.map(async (stylePath) => {
                const styleName = this.extractScriptName(stylePath);
                return this.loadStylesheet(styleName, stylePath).catch(error => {
                    console.warn(`⚠️ [ScriptLoader] Stylesheet ${styleName} failed, continuing without it`);
                });
            });
                
            try {
                await Promise.all(stylesheetPromises);
                console.log(`✅ [ScriptLoader] All stylesheets loaded for ${pageName}`);
            } catch (error) {
                console.error(`❌ [ScriptLoader] Failed to load stylesheets for ${pageName}:`, error);
            }
        }
        
// Load page scripts in PARALLEL for maximum performance
try {
    // Identify scripts that MUST load sequentially (if any have dependencies)
    const criticalFirst = ['/core/api-client.js']; // Loads first if present
    const parallelScripts = pageConfig.scripts.filter(s => !criticalFirst.includes(s));
    
    // Load critical scripts first
    for (const scriptPath of pageConfig.scripts.filter(s => criticalFirst.includes(s))) {
        const scriptName = this.extractScriptName(scriptPath);
        await this.loadScript(scriptName, scriptPath);
    }
    
    // Load all remaining scripts in parallel
    await Promise.all(
        parallelScripts.map(scriptPath => {
            const scriptName = this.extractScriptName(scriptPath);
            return this.loadScript(scriptName, scriptPath);
        })
    );
    
    console.log(`✅ [ScriptLoader] All scripts loaded for ${pageName}`);
} catch (error) {
    console.error(`❌ [ScriptLoader] Failed to load scripts for ${pageName}:`, error);
    throw error;
}
        
        // CRITICAL: Initialize API client after all scripts are loaded
        if (pageConfig.scripts.includes('/core/api-client.js')) {
            await this.initializeApiClient();
        }
    }
    
    // =============================================================================
    // API CLIENT INITIALIZATION  
    // =============================================================================
    
    async initializeApiClient() {
        console.log('🔧 [ScriptLoader] Initializing API client...');
        
        try {
            // Wait for config to be ready (should already be ready, but double-check)
            await window.OsliraEnv.ready();
            
            if (typeof window.OsliraApiClient === 'undefined') {
                throw new Error('OsliraApiClient not loaded');
            }
            
            // Initialize with config from env manager
            const config = {
                workerUrl: window.OsliraEnv.WORKER_URL,
                supabaseUrl: window.OsliraEnv.SUPABASE_URL,
                supabaseAnonKey: window.OsliraEnv.SUPABASE_ANON_KEY
            };
            
            console.log('🔧 [ScriptLoader] API Client config:', {
                workerUrl: config.workerUrl,
                hasSupabaseUrl: !!config.supabaseUrl,
                hasAnonKey: !!config.supabaseAnonKey
            });
            
            window.OsliraAPI = new window.OsliraApiClient(config);
            console.log('✅ [ScriptLoader] API client initialized');
            
        } catch (error) {
            console.error('❌ [ScriptLoader] Failed to initialize API client:', error);
            throw error;
        }
    }
    
    // =============================================================================
    // SCRIPT LOADING UTILITIES
    // =============================================================================
    
    async loadScript(name, src) {
        if (this.loadedScripts.has(name)) {
            return;
        }
        
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        if (this.failedScripts.has(name)) {
            console.warn(`⚠️ [ScriptLoader] Skipping previously failed script: ${name}`);
            return;
        }
        
        console.log(`📦 [ScriptLoader] Loading script: ${name} from ${src}`);
        
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`✅ [ScriptLoader] ${name} loaded successfully`);
                this.loadedScripts.add(name);
                this.loadingPromises.delete(name);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ [ScriptLoader] Failed to load ${name} from ${src}`);
                this.failedScripts.add(name);
                this.loadingPromises.delete(name);
                reject(new Error(`Failed to load script: ${name}`));
            };
            
            document.head.appendChild(script);
        });
        
        this.loadingPromises.set(name, promise);
        return promise;
    }
    
    async loadStylesheet(name, href) {
        if (this.loadedScripts.has(name)) {
            return;
        }
        
        console.log(`🎨 [ScriptLoader] Loading stylesheet: ${name} from ${href}`);
        
        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            link.onload = () => {
                console.log(`✅ [ScriptLoader] ${name} stylesheet loaded`);
                this.loadedScripts.add(name);
                resolve();
            };
            
            link.onerror = () => {
                console.error(`❌ [ScriptLoader] Failed to load stylesheet ${name}`);
                reject(new Error(`Failed to load stylesheet: ${name}`));
            };
            
            document.head.appendChild(link);
        });
        
        return promise;
    }
    
    extractScriptName(scriptPath) {
        return scriptPath.split('/').pop().replace('.js', '').replace('.css', '');
    }
    
    // =============================================================================
    // ERROR HANDLING
    // =============================================================================
    
    handleInitializationError(error) {
        console.error('🚨 [ScriptLoader] Critical initialization error:', error);
        
        this.showErrorMessage(
            'Application Loading Error',
            'There was a problem loading the application. Please refresh the page to try again.'
        );
    }
    
    showErrorMessage(title, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed inset-0 bg-red-50 flex items-center justify-center z-50';
        errorDiv.innerHTML = `
            <div class="text-center p-8 max-w-md">
                <div class="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 class="text-xl font-semibold text-gray-900 mb-2">${title}</h2>
                <p class="text-gray-600 mb-6">${message}</p>
                <button onclick="window.location.reload()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
    
    // =============================================================================
    // UTILITIES
    // =============================================================================
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // =============================================================================
    // PUBLIC API METHODS
    // =============================================================================
    
    isLoaded(scriptName) {
        return this.loadedScripts.has(scriptName);
    }
    
    getLoadedScripts() {
        return Array.from(this.loadedScripts);
    }
    
    getFailedScripts() {
        return Array.from(this.failedScripts);
    }
    
    async reloadScript(name) {
        this.loadedScripts.delete(name);
        this.failedScripts.delete(name);
        
        let scriptPath;
        if (this.coreScripts.includes(name)) {
            scriptPath = name === 'supabase' ? 
                'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2' : 
                `/core/${name}.js`;
        } else {
            for (const pageConfig of Object.values(this.pageConfigs)) {
                const found = pageConfig.scripts?.find(path => 
                    this.extractScriptName(path) === name
                );
                if (found) {
                    scriptPath = found;
                    break;
                }
            }
        }
        
        if (!scriptPath) {
            throw new Error(`Could not find script path for: ${name}`);
        }
        
        return this.loadScript(name, scriptPath);
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

window.ScriptLoader = new ScriptLoader();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await window.ScriptLoader.initialize();
        } catch (error) {
            console.error('❌ [ScriptLoader] Failed to initialize:', error);
        }
    });
} else {
    setTimeout(async () => {
        try {
            await window.ScriptLoader.initialize();
        } catch (error) {
            console.error('❌ [ScriptLoader] Failed to initialize:', error);
        }
    }, 0);
}

if (window.location.hostname === 'localhost' || window.location.hostname.includes('staging')) {
    window.debugScriptLoader = {
        getLoaded: () => window.ScriptLoader.getLoadedScripts(),
        getFailed: () => window.ScriptLoader.getFailedScripts(),
        reload: (name) => window.ScriptLoader.reloadScript(name),
        instance: () => window.ScriptLoader
    };
}

} // End of duplicate check

console.log('📦 [ScriptLoader] Module loaded and ready');
