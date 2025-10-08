// =============================================================================
// LOADER - Universal Script Loader
// Path: /public/core/Loader.js
// Dependencies: None (runs first)
// =============================================================================

/**
 * @class Loader
 * @description Loads all core and page-specific scripts in correct order
 * 
 * Features:
 * - Sequential core script loading
 * - Parallel page script loading
 * - Script deduplication
 * - Error handling with retry
 * - Load event emission
 */
class Loader {
    constructor() {
        this.loadedScripts = new Set();
        this.loadingPromises = new Map();
        this.failedScripts = new Set();
        this.pageName = null;
        
        console.log('📦 [Loader] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async load() {
        try {
            console.log('🚀 [Loader] Starting script loading...');
            
            // Get page name from data-page attribute
            this.pageName = this.getPageName();
            console.log(`📄 [Loader] Page: ${this.pageName}`);
            
            // Phase 1: Load core scripts sequentially
            await this.loadCoreScripts();
            
            // Phase 2: Load page scripts in parallel
            if (this.pageName) {
                await this.loadPageScripts(this.pageName);
            }
            
            // Emit loaded event
            this.emitLoadedEvent();
            
            console.log('✅ [Loader] All scripts loaded successfully');
            
        } catch (error) {
            console.error('❌ [Loader] Script loading failed:', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'Loader', phase: 'load' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Get page name from script tag
     */
    getPageName() {
        const loaderScript = document.querySelector('script[src*="loader.js"]');
        return loaderScript?.getAttribute('data-page') || null;
    }
    
    // =========================================================================
    // CORE SCRIPTS (Sequential Loading)
    // =========================================================================
    
    async loadCoreScripts() {
        console.log('📦 [Loader] Phase 1: Loading core scripts sequentially...');
        
        const coreScripts = [
            // Phase 1: Init
            { name: 'ModuleRegistry', path: '/core/init/ModuleRegistry.js' },
            { name: 'Phases', path: '/core/init/Phases.js' },
            { name: 'Coordinator', path: '/core/init/Coordinator.js' },
            
            // Phase 2: Infrastructure
            { name: 'EnvDetector', path: '/core/infrastructure/EnvDetector.js' },
            { name: 'ConfigProvider', path: '/core/infrastructure/ConfigProvider.js' },
            { name: 'HttpClient', path: '/core/infrastructure/HttpClient.js' },
            { name: 'Logger', path: '/core/infrastructure/Logger.js' },
            { name: 'ErrorHandler', path: '/core/infrastructure/ErrorHandler.js' },
            { name: 'Monitoring', path: '/core/infrastructure/Monitoring.js' },
            
            // Phase 3: Auth
            { name: 'AuthManager', path: '/core/auth/AuthManager.js' },
            { name: 'SessionValidator', path: '/core/auth/SessionValidator.js' },
            { name: 'TokenRefresher', path: '/core/auth/TokenRefresher.js' },
            
            // Phase 4: State
            { name: 'Store', path: '/core/state/Store.js' },
            { name: 'StateManager', path: '/core/state/StateManager.js' },
            { name: 'Selectors', path: '/core/state/Selectors.js' },
            
            // Phase 5: Events
            { name: 'EventBus', path: '/core/events/EventBus.js' },
            { name: 'EventTypes', path: '/core/events/EventTypes.js' },
            
            // Phase 6: DI
            { name: 'ServiceRegistry', path: '/core/di/ServiceRegistry.js' },
            { name: 'Container', path: '/core/di/Container.js' },
            
            // Phase 7: UI
            { name: 'UIOrchestrator', path: '/core/ui/UIOrchestrator.js' },
            { name: 'FormValidator', path: '/core/ui/FormValidator.js' },
            
            // Phase 8: API
            { name: 'ApiClient', path: '/core/api/ApiClient.js' },
            { name: 'AuthAPI', path: '/core/api/endpoints/AuthAPI.js' },
            { name: 'LeadsAPI', path: '/core/api/endpoints/LeadsAPI.js' },
            { name: 'BusinessAPI', path: '/core/api/endpoints/BusinessAPI.js' },
            { name: 'AnalyticsAPI', path: '/core/api/endpoints/AnalyticsAPI.js' },
            
            // Phase 9: Services
            { name: 'LeadService', path: '/core/services/LeadService.js' },
            { name: 'AnalyticsService', path: '/core/services/AnalyticsService.js' },
            { name: 'BusinessService', path: '/core/services/BusinessService.js' },
            { name: 'UserService', path: '/core/services/UserService.js' },
            
            // Phase 10: Utils
            { name: 'DateUtils', path: '/core/utils/DateUtils.js' },
            { name: 'ValidationUtils', path: '/core/utils/ValidationUtils.js' },
            { name: 'FormatUtils', path: '/core/utils/FormatUtils.js' },
            { name: 'CryptoUtils', path: '/core/utils/CryptoUtils.js' },
            
            // Bootstrap (Must be last)
            { name: 'Bootstrap', path: '/core/init/Bootstrap.js' }
        ];
        
        // Load sequentially
        for (const script of coreScripts) {
            await this.loadScript(script.name, script.path);
        }
        
        console.log('✅ [Loader] Core scripts loaded successfully');
    }
    
    // =========================================================================
    // PAGE SCRIPTS (Parallel Loading)
    // =========================================================================
    
    async loadPageScripts(pageName) {
        console.log(`📄 [Loader] Phase 2: Loading scripts for page: ${pageName}`);
        
        // Get script list from registry
        if (!window.OsliraModuleRegistry) {
            throw new Error('ModuleRegistry not loaded');
        }
        
        const scripts = window.OsliraModuleRegistry.getPageScripts(pageName);
        
        if (!scripts || scripts.length === 0) {
            console.log(`⚠️ [Loader] No scripts registered for page: ${pageName}`);
            return;
        }
        
        console.log(`📦 [Loader] Loading ${scripts.length} scripts in parallel...`);
        
        try {
            // Load all scripts in parallel for maximum speed
            await Promise.all(
                scripts.map(scriptPath => {
                    const scriptName = this.extractScriptName(scriptPath);
                    return this.loadScript(scriptName, scriptPath);
                })
            );
            
            console.log(`✅ [Loader] All scripts loaded for ${pageName}`);
            
        } catch (error) {
            console.error(`❌ [Loader] Failed to load scripts for ${pageName}:`, error);
            throw error;
        }
    }
    
    /**
     * Extract script name from path
     */
    extractScriptName(path) {
        return path.split('/').pop().replace('.js', '');
    }
    
    // =========================================================================
    // SCRIPT LOADING (With De-duplication)
    // =========================================================================
    
    async loadScript(name, src) {
        // Check if already loaded
        if (this.loadedScripts.has(name)) {
            console.log(`⏭️  [Loader] ${name} already loaded, skipping`);
            return;
        }
        
        // Check if currently loading (return existing promise)
        if (this.loadingPromises.has(name)) {
            console.log(`⏳ [Loader] ${name} already loading, waiting...`);
            return this.loadingPromises.get(name);
        }
        
        // Check DOM for script loaded before loader initialized
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            console.log(`✅ [Loader] ${name} found in DOM, marking as loaded`);
            this.loadedScripts.add(name);
            return;
        }
        
        // Check if previously failed
        if (this.failedScripts.has(name)) {
            console.warn(`⚠️ [Loader] ${name} previously failed, skipping`);
            return;
        }
        
        console.log(`📦 [Loader] Loading: ${name} from ${src}`);
        
        // Create loading promise
        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Maintain order
            
            script.onload = () => {
                console.log(`✅ [Loader] ${name} loaded`);
                this.loadedScripts.add(name);
                this.loadingPromises.delete(name);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`❌ [Loader] ${name} failed to load from ${src}`);
                this.failedScripts.add(name);
                this.loadingPromises.delete(name);
                reject(new Error(`Failed to load ${name}`));
            };
            
            document.head.appendChild(script);
        });
        
        this.loadingPromises.set(name, loadPromise);
        
        return loadPromise;
    }
    
    // =========================================================================
    // EVENTS
    // =========================================================================
    
    /**
     * Emit scripts loaded event
     */
    emitLoadedEvent() {
        const event = new CustomEvent('oslira:scripts:loaded', {
            detail: {
                pageName: this.pageName,
                loadedCount: this.loadedScripts.size,
                failedCount: this.failedScripts.size
            }
        });
        
        window.dispatchEvent(event);
        console.log('📡 [Loader] Event emitted: oslira:scripts:loaded');
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Get loader stats
     */
    getStats() {
        return {
            pageName: this.pageName,
            loadedScripts: Array.from(this.loadedScripts),
            loadedCount: this.loadedScripts.size,
            failedScripts: Array.from(this.failedScripts),
            failedCount: this.failedScripts.size,
            loadingCount: this.loadingPromises.size
        };
    }
    
    /**
     * Debug info
     */
    debug() {
        console.group('📦 [Loader] Debug Info');
        console.log('Stats:', this.getStats());
        console.groupEnd();
    }
}

// =============================================================================
// AUTO-INITIALIZE
// =============================================================================

// Create global instance
window.OsliraLoader = new Loader();

// Auto-start loading
window.OsliraLoader.load().catch(error => {
    console.error('💥 [Loader] Critical failure:', error);
    alert('Failed to load application. Please refresh the page.');
});

console.log('✅ [Loader] Class loaded and auto-starting...');
