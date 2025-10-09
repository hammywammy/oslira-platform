// =============================================================================
// LOADER - Main Script Loading Orchestrator
// Path: /public/core/init/Loader.js
// Dependencies: None (loads first, then loads PhasedLoader)
// =============================================================================

/**
 * @class Loader
 * @description Main orchestrator that connects HTML → ModuleRegistry → PhasedLoader
 * 
 * Flow:
 * 1. Read data-page attribute from script tag
 * 2. Load ModuleRegistry.js
 * 3. Load PhasedLoader.js
 * 4. Get scripts for page from ModuleRegistry
 * 5. Organize scripts into phases
 * 6. Hand to PhasedLoader for execution
 */
(function() {
    'use strict';
    
    console.log('🚀 [Loader] Starting...');
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    const CONFIG = {
        registryPath: '/core/init/ModuleRegistry.js',
        phasedLoaderPath: '/core/init/PhasedLoader.js',
        maxInitAttempts: 50,
        initCheckInterval: 100
    };
    
    // =========================================================================
    // GET CURRENT PAGE
    // =========================================================================
    
    /**
     * Get page name from script tag data-page attribute
     */
    function getCurrentPage() {
        const loaderScript = document.currentScript || 
                            document.querySelector('script[src*="Loader.js"]');
        
        if (!loaderScript) {
            console.error('❌ [Loader] Could not find Loader.js script tag');
            return null;
        }
        
        const pageName = loaderScript.getAttribute('data-page');
        
        if (!pageName) {
            console.error('❌ [Loader] No data-page attribute found on Loader.js');
            return null;
        }
        
        console.log(`📄 [Loader] Current page: ${pageName}`);
        return pageName;
    }
    
    // =========================================================================
    // LOAD DEPENDENCIES
    // =========================================================================
    
    /**
     * Load a single script
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Maintain order for these critical scripts
            
            script.onload = () => {
                console.log(`✅ [Loader] Loaded: ${src}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ [Loader] Failed to load: ${src}`);
                reject(new Error(`Failed to load: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load ModuleRegistry and PhasedLoader
     */
    async function loadCoreDependencies() {
        console.log('📦 [Loader] Loading core dependencies...');
        
        try {
            // Load ModuleRegistry first
            await loadScript(CONFIG.registryPath);
            
            // Load PhasedLoader second
            await loadScript(CONFIG.phasedLoaderPath);
            
            console.log('✅ [Loader] Core dependencies loaded');
            return true;
            
        } catch (error) {
            console.error('❌ [Loader] Failed to load core dependencies:', error);
            throw error;
        }
    }
    
    /**
     * Wait for dependencies to be available
     */
    async function waitForDependencies() {
        let attempts = 0;
        
        while (attempts < CONFIG.maxInitAttempts) {
            // Check if dependencies are available
            const registryReady = window.OsliraModuleRegistry && 
                                 typeof window.OsliraModuleRegistry.getPageConfig === 'function';
            const loaderReady = window.OsliraLoader && 
                               typeof window.OsliraLoader.definePhases === 'function';
            
            if (registryReady && loaderReady) {
                console.log('✅ [Loader] Dependencies ready');
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, CONFIG.initCheckInterval));
            attempts++;
        }
        
        throw new Error('Dependencies not available after timeout');
    }
    
    // =========================================================================
    // ORGANIZE SCRIPTS INTO PHASES
    // =========================================================================
    
    /**
     * Organize page scripts into dependency phases
     * 
     * IMPORTANT: ModuleRegistry is the single source of truth for page scripts.
     * This function ONLY organizes core infrastructure phases.
     * All page-specific scripts (including UI components) come from ModuleRegistry.
     */
    function organizeIntoPhases(pageScripts) {
        const phases = [];
        
        // Phase 0: Critical Infrastructure (always loaded)
        phases.push({
            name: 'Critical Infrastructure',
            critical: true,
            scripts: [
                '/core/infrastructure/EnvDetector.js',
                '/core/infrastructure/Logger.js',
                '/core/infrastructure/ErrorHandler.js',
                '/core/events/EventBus.js'
            ]
        });
        
        // Phase 1: Core Infrastructure
        phases.push({
            name: 'Core Infrastructure',
            critical: true,
            scripts: [
                '/core/infrastructure/HttpClient.js',
                '/core/infrastructure/ConfigProvider.js',
                '/core/infrastructure/Monitoring.js',
                '/core/utils/NavigationHelper.js',
                '/core/utils/ValidationUtils.js',
                '/core/utils/DateUtils.js',
                '/core/utils/FormatUtils.js',
                '/core/utils/CryptoUtils.js'
            ]
        });
        
        // Phase 2: State Layer (depends on Phase 1)
        phases.push({
            name: 'State Layer',
            critical: true,
            scripts: [
                '/core/state/Store.js',
                '/core/state/StateManager.js'
            ]
        });
        
        // Phase 3: API Layer
        phases.push({
            name: 'API Layer',
            critical: true,
            scripts: [
                '/core/api/ApiClient.js'
            ]
        });
        
        // Phase 4: Auth & Services
        phases.push({
            name: 'Auth & Services',
            critical: true,
            scripts: [
                '/core/auth/AuthManager.js',
                '/core/auth/SessionValidator.js',
                '/core/auth/TokenRefresher.js',
                '/core/state/Selectors.js',
                '/core/services/UserService.js',
                '/core/services/BusinessService.js',
                '/core/services/LeadService.js',
                '/core/services/AnalyticsService.js'
            ]
        });
        
        // Phase 5: Page-Specific Scripts (from ModuleRegistry)
        // Filter out scripts that were already added in core phases
        const loadedScripts = new Set(
            phases.flatMap(phase => phase.scripts)
        );
        
        const remainingPageScripts = pageScripts.filter(
            script => !loadedScripts.has(script)
        );
        
        if (remainingPageScripts.length > 0) {
            phases.push({
                name: 'Page Scripts',
                critical: false,
                scripts: remainingPageScripts
            });
        }
        
        // Log phase summary
        console.log('📋 [Loader] Organized into phases:');
        phases.forEach((phase, index) => {
            console.log(`   Phase ${index}: ${phase.name} (${phase.scripts.length} scripts)`);
        });
        
        return phases;
    }
    
    // =========================================================================
    // MAIN INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize the loading process
     */
    async function initialize() {
        try {
            // Step 1: Get current page
            const pageName = getCurrentPage();
            if (!pageName) {
                throw new Error('Could not determine current page');
            }
            
            // Step 2: Load core dependencies
            await loadCoreDependencies();
            await waitForDependencies();
            
            // Step 3: Get scripts for page from ModuleRegistry
            const pageConfig = window.OsliraModuleRegistry.getPageConfig(pageName);
            
            if (!pageConfig) {
                throw new Error(`No configuration found for page: ${pageName}`);
            }
            
            console.log(`📄 [Loader] Page config:`, pageConfig);
            
            const pageScripts = pageConfig.scripts || [];
            
            if (pageScripts.length === 0) {
                console.warn('⚠️ [Loader] No scripts defined for this page');
            }
            
            // Step 4: Organize scripts into phases
            const phases = organizeIntoPhases(pageScripts);
            
            // Step 5: Configure PhasedLoader
            window.OsliraLoader
                .definePhases(phases)
                .configure({
                    parallel: true,
                    maxRetries: 3,
                    timeout: 10000,
                    cacheBust: false
                })
                .on('phaseComplete', (data) => {
                    console.log(`✅ [Loader] ${data.phase} complete in ${data.time.toFixed(2)}ms`);
                })
                .on('progress', (data) => {
                    const percent = Math.round((data.loaded / data.total) * 100);
                    console.log(`📊 [Loader] Progress: ${percent}% (${data.loaded}/${data.total})`);
                    
                    // Update progress bar if it exists
                    const progressBar = document.getElementById('load-progress');
                    if (progressBar) {
                        progressBar.style.width = percent + '%';
                    }
                })
                .on('allComplete', (data) => {
                    console.log(`🎉 [Loader] All scripts loaded in ${data.totalTime.toFixed(2)}ms`);
                    console.log(`   - Loaded: ${data.loadedScripts.length} scripts`);
                    console.log(`   - Failed: ${data.failedScripts.length} scripts`);
                    
                    // Hide loading screen
                    const loadingScreen = document.getElementById('app-loader');
                    if (loadingScreen) {
                        loadingScreen.style.display = 'none';
                    }
                    
                    // Make body visible
                    document.body.style.visibility = 'visible';
                    
                    // Emit global event
                    window.dispatchEvent(new CustomEvent('oslira:scripts:loaded', {
                        detail: {
                            page: pageName,
                            stats: data
                        }
                    }));
                })
                .on('error', (error) => {
                    console.error('❌ [Loader] Loading failed:', error);
                    
                    // Show error to user
                    const loadingScreen = document.getElementById('app-loader');
                    if (loadingScreen) {
                        loadingScreen.innerHTML = `
                            <div style="text-align: center; color: #dc2626;">
                                <h2>Loading Error</h2>
                                <p>Failed to load application resources.</p>
                                <p style="font-size: 12px; color: #6b7280;">${error.message}</p>
                                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Retry
                                </button>
                            </div>
                        `;
                    }
                });
            
            // Step 6: Start loading
            await window.OsliraLoader.load();
            
        } catch (error) {
            console.error('❌ [Loader] Initialization failed:', error);
            
            // Show error to user
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
                    <div style="text-align: center; max-width: 500px; padding: 40px;">
                        <h1 style="color: #dc2626; margin-bottom: 20px;">Failed to Load</h1>
                        <p style="color: #6b7280; margin-bottom: 30px;">${error.message}</p>
                        <button onclick="location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                            Reload Page
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    // =========================================================================
    // AUTO-START
    // =========================================================================
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM already loaded
        initialize();
    }
    
})();
