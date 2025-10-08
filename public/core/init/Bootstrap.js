// =============================================================================
// BOOTSTRAP - 3-Phase Initialization Orchestrator
// Path: /public/core/init/Bootstrap.js
// Dependencies: Coordinator, Phases, all core services
// =============================================================================

/**
 * @class Bootstrap
 * @description Orchestrates sequential initialization across 3 phases
 * 
 * Phase 1: Infrastructure (Env, Config, Http, Logger, ErrorHandler)
 * Phase 2: Services (Auth, State, Events, DI)
 * Phase 3: Application (Page-specific initialization)
 * 
 * Features:
 * - Sequential phase execution
 * - Fail-fast error handling
 * - Progress tracking
 * - Error screen on failure
 * - Body visibility control
 */
class Bootstrap {
    constructor() {
        this.coordinator = window.Oslira?.init;
        this.phases = window.OsliraPhases;
        
        if (!this.coordinator) {
            throw new Error('[Bootstrap] Coordinator not found');
        }
        
        if (!this.phases) {
            throw new Error('[Bootstrap] Phases not found');
        }
        
        // State
        this.currentPhase = null;
        this.isBootstrapped = false;
        this.startTime = null;
        this.endTime = null;
        
        // Progress tracking
        this.phaseProgress = {
            [this.phases.INFRASTRUCTURE]: { started: false, completed: false, error: null },
            [this.phases.SERVICES]: { started: false, completed: false, error: null },
            [this.phases.APPLICATION]: { started: false, completed: false, error: null }
        };
        
        console.log('🚀 [Bootstrap] Instance created');
    }
    
    // =========================================================================
    // MAIN BOOTSTRAP FLOW
    // =========================================================================
    
    /**
     * Execute full bootstrap sequence
     */
    async bootstrap() {
        if (this.isBootstrapped) {
            console.log('⚠️ [Bootstrap] Already bootstrapped');
            return;
        }
        
        this.startTime = Date.now();
        console.log('🚀 [Bootstrap] Starting 3-phase initialization...');
        
        try {
            // Phase 1: Infrastructure
            await this.executePhase(this.phases.INFRASTRUCTURE);
            
            // Phase 2: Services
            await this.executePhase(this.phases.SERVICES);
            
            // Phase 3: Application
            await this.executePhase(this.phases.APPLICATION);
            
            // Bootstrap complete
            this.isBootstrapped = true;
            this.endTime = Date.now();
            
            const duration = this.endTime - this.startTime;
            console.log(`✅ [Bootstrap] All phases complete in ${duration}ms`);
            
            // Make body visible
            this.showBody();
            
            // Emit bootstrap complete event
            this.emitEvent('bootstrap:complete', { duration });
            
        } catch (error) {
            console.error('❌ [Bootstrap] Bootstrap failed:', error);
            
            // Show error screen
            this.showErrorScreen(error);
            
            // Report to Sentry
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: {
                        component: 'Bootstrap',
                        phase: this.currentPhase
                    }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Execute a single phase
     */
    async executePhase(phase) {
        this.currentPhase = phase;
        this.phaseProgress[phase].started = true;
        
        const phaseName = this.getPhaseNameString(phase);
        console.log(`📦 [Bootstrap] Phase ${phase}: ${phaseName} starting...`);
        
        const phaseStart = Date.now();
        
        try {
            switch (phase) {
                case this.phases.INFRASTRUCTURE:
                    await this.initializeInfrastructure();
                    break;
                    
                case this.phases.SERVICES:
                    await this.initializeServices();
                    break;
                    
                case this.phases.APPLICATION:
                    await this.initializeApplication();
                    break;
                    
                default:
                    throw new Error(`Unknown phase: ${phase}`);
            }
            
            const phaseDuration = Date.now() - phaseStart;
            this.phaseProgress[phase].completed = true;
            
            console.log(`✅ [Bootstrap] Phase ${phase}: ${phaseName} complete (${phaseDuration}ms)`);
            
            // Emit phase complete event
            this.emitEvent('bootstrap:phase-complete', { phase, phaseName, duration: phaseDuration });
            
        } catch (error) {
            this.phaseProgress[phase].error = error;
            console.error(`❌ [Bootstrap] Phase ${phase}: ${phaseName} failed:`, error);
            throw error;
        }
    }
    
    // =========================================================================
    // PHASE 1: INFRASTRUCTURE
    // =========================================================================
    
async initializeInfrastructure() {
    console.log('🏗️ [Bootstrap] Initializing infrastructure...');
    
    // 1. Wait for EnvDetector (auto-registered on load)
    const env = await this.coordinator.waitFor('EnvDetector');
    console.log('✅ [Bootstrap] EnvDetector ready');
    
    // 2. Wait for Logger (auto-registered on load)
    const logger = await this.coordinator.waitFor('Logger');
    console.log('✅ [Bootstrap] Logger ready');
    
    // 3. Wait for ErrorHandler (auto-registered after init)
    const errorHandler = await this.coordinator.waitFor('ErrorHandler');
    console.log('✅ [Bootstrap] ErrorHandler ready');
    
    // 4. Initialize ConfigProvider (registers itself after init)
    console.log('🔧 [Bootstrap] Initializing ConfigProvider...');
    const config = window.OsliraConfig;
    if (config && !config.isLoaded) {
        await config.initialize({ envDetector: env, logger });
        // ConfigProvider registers itself in initialize() method
    }
    console.log('✅ [Bootstrap] ConfigProvider ready');
    
    // 5. Initialize HttpClient (registers itself after init)
    console.log('🌐 [Bootstrap] Initializing HttpClient...');
    const http = window.OsliraHttp;
    if (http && !http.isInitialized) {
        await http.initialize({ logger });
        // HttpClient registers itself in initialize() method
    }
    console.log('✅ [Bootstrap] HttpClient ready');
    
    // 6. Initialize Monitoring (optional, registers itself after init)
    try {
        console.log('📊 [Bootstrap] Initializing Monitoring...');
        const monitoring = window.OsliraMonitoring;
        if (monitoring && typeof monitoring.initialize === 'function') {
            await monitoring.initialize({ logger });
            // Monitoring registers itself in initialize() method
        }
        console.log('✅ [Bootstrap] Monitoring ready');
    } catch (error) {
        console.log('ℹ️ [Bootstrap] Monitoring not available (optional)');
    }
    
    console.log('✅ [Bootstrap] Infrastructure phase complete');
}
    
    // =========================================================================
    // PHASE 2: SERVICES
    // =========================================================================
    
   async initializeServices() {
        console.log('🏗️ [Bootstrap] Phase 2: Services');
        
        try {
            // =================================================================
            // PATTERN A: Auto-Registered Services (wait only)
            // =================================================================
            
            // 1. Wait for EventBus (auto-registered after instantiation)
            const eventBus = await this.coordinator.waitFor('EventBus', 10000);
            console.log('✅ [Bootstrap] EventBus ready');
            
            // 2. Wait for Store (auto-registered after instantiation)
            const store = await this.coordinator.waitFor('Store', 10000);
            console.log('✅ [Bootstrap] Store ready');
            
            // 3. Wait for StateManager (auto-registered after instantiation)
            const stateManager = await this.coordinator.waitFor('StateManager', 10000);
            console.log('✅ [Bootstrap] StateManager ready');
            
            // 4. Wait for Selectors (auto-registered after instantiation)
            const selectors = await this.coordinator.waitFor('Selectors', 10000);
            console.log('✅ [Bootstrap] Selectors ready');
            
            // =================================================================
            // PATTERN B: Manual-Init Services (initialize then wait)
            // =================================================================
            
            // 5. Initialize AuthManager (registers itself after init)
            console.log('🔐 [Bootstrap] Initializing AuthManager...');
            const auth = window.OsliraAuth;
            if (auth && !auth.isInitialized) {
                const config = window.OsliraConfig;
                const logger = window.OsliraLogger;
                await auth.initialize({ config, logger });
                // AuthManager registers itself in initialize() method
            }
            console.log('✅ [Bootstrap] AuthManager ready');
            
            // 6. Initialize DI Container (registers itself after init)
            console.log('📦 [Bootstrap] Initializing Container...');
            const container = window.OsliraContainer;
            if (container && !container.isInitialized) {
                await container.initialize();
                // Container registers itself in initialize() method
            }
            console.log('✅ [Bootstrap] Container ready');
            
            console.log('✅ [Bootstrap] Services phase complete');
            
        } catch (error) {
            console.error('❌ [Bootstrap] Services phase failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // PHASE 3: APPLICATION
    // =========================================================================
    
    async initializeApplication() {
        console.log('🎯 [Bootstrap] Initializing application...');
        
        // Get page name from loader
        const pageName = window.OsliraLoader?.pageName;
        
        if (!pageName) {
            console.log('ℹ️ [Bootstrap] No page-specific initialization needed');
            return;
        }
        
        console.log(`🎯 [Bootstrap] Initializing page: ${pageName}`);
        
        // Get page app class from registry
        const registry = window.OsliraModuleRegistry;
        if (!registry) {
            throw new Error('ModuleRegistry not found');
        }
        
        const appClass = registry.getPageAppClass(pageName);
        
        if (!appClass) {
            console.log(`ℹ️ [Bootstrap] No app class registered for ${pageName}`);
            return;
        }
        
        // Wait for app class to be available
        console.log(`⏳ [Bootstrap] Waiting for ${appClass}...`);
        
        // Try to get app instance
        let maxAttempts = 50; // 5 seconds
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window[appClass]) {
                console.log(`✅ [Bootstrap] ${appClass} found`);
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window[appClass]) {
            throw new Error(`App class ${appClass} not found after ${maxAttempts * 100}ms`);
        }
        
        // Initialize app if it has initialize method
        const app = window[appClass];
        
        if (app && typeof app.initialize === 'function') {
            console.log(`🎯 [Bootstrap] Initializing ${appClass}...`);
            await app.initialize();
            console.log(`✅ [Bootstrap] ${appClass} initialized`);
        } else {
            console.log(`ℹ️ [Bootstrap] ${appClass} has no initialize method`);
        }
        
        console.log('✅ [Bootstrap] Application phase complete');
    }
    
    // =========================================================================
    // UI CONTROLS
    // =========================================================================
    
    /**
     * Show body (make visible after successful bootstrap)
     */
    showBody() {
        console.log('👁️ [Bootstrap] Making body visible...');
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
    }
    
    /**
     * Show error screen
     */
    showErrorScreen(error) {
        console.error('💥 [Bootstrap] Showing error screen');
        
        // Create error screen
        const errorScreen = document.createElement('div');
        errorScreen.id = 'bootstrap-error-screen';
        errorScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
        `;
        
        errorScreen.innerHTML = `
            <div style="text-align: center; max-width: 500px; padding: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                <h1 style="font-size: 2rem; margin-bottom: 1rem; font-weight: 600;">
                    Initialization Failed
                </h1>
                <p style="font-size: 1.125rem; margin-bottom: 2rem; opacity: 0.9;">
                    We encountered an error while loading the application.
                </p>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; text-align: left;">
                    <p style="font-family: monospace; font-size: 0.875rem; word-break: break-word;">
                        ${this.escapeHtml(error.message)}
                    </p>
                    ${this.currentPhase ? `
                        <p style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                            Failed at: Phase ${this.currentPhase}
                        </p>
                    ` : ''}
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="location.reload()" style="
                        background: white;
                        color: #667eea;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        🔄 Reload Page
                    </button>
                    <button onclick="localStorage.clear(); sessionStorage.clear(); location.reload()" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 1px solid rgba(255,255,255,0.3);
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        🗑️ Clear Cache & Reload
                    </button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorScreen);
        document.body.style.visibility = 'visible';
    }
    
    /**
     * Escape HTML for error display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // =========================================================================
    // EVENTS
    // =========================================================================
    
    /**
     * Emit bootstrap event
     */
    emitEvent(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        window.dispatchEvent(event);
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Get phase name as string
     */
    getPhaseNameString(phase) {
        const names = {
            [this.phases.INFRASTRUCTURE]: 'Infrastructure',
            [this.phases.SERVICES]: 'Services',
            [this.phases.APPLICATION]: 'Application'
        };
        return names[phase] || 'Unknown';
    }
    
    /**
     * Get bootstrap progress
     */
    getProgress() {
        return {
            currentPhase: this.currentPhase,
            isBootstrapped: this.isBootstrapped,
            phases: this.phaseProgress,
            duration: this.endTime ? this.endTime - this.startTime : null
        };
    }
    
    /**
     * Get bootstrap stats
     */
    getStats() {
        const completedPhases = Object.values(this.phaseProgress)
            .filter(p => p.completed).length;
        
        const failedPhases = Object.values(this.phaseProgress)
            .filter(p => p.error !== null).length;
        
        return {
            isBootstrapped: this.isBootstrapped,
            currentPhase: this.currentPhase,
            completedPhases,
            failedPhases,
            totalPhases: 3,
            duration: this.endTime ? this.endTime - this.startTime : null
        };
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Debug info
     */
    debug() {
        console.group('🚀 [Bootstrap] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Progress:', this.getProgress());
        console.groupEnd();
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
// Export to global namespace
window.OsliraBootstrap = Bootstrap;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Bootstrap;
}

console.log('✅ [Bootstrap] Class loaded and ready');

// =============================================================================
// AUTO-START BOOTSTRAP (Self-Executing)
// =============================================================================

/**
 * Bootstrap auto-starts when:
 * 1. All scripts are loaded (oslira:scripts:loaded event fired)
 * 2. DOM is ready
 * 3. No existing bootstrap instance
 * 
 * This ensures Bootstrap runs exactly once, at the right time.
 */
(function autoStartBootstrap() {
    console.log('🎬 [Bootstrap] Auto-start handler registered');
    
    let scriptsLoaded = false;
    let domReady = document.readyState === 'complete' || document.readyState === 'interactive';
    
    // Check if we should start bootstrap
    function tryStart() {
        // Don't start if already running
        if (window.Oslira?.bootstrap?.isBootstrapped) {
            console.log('ℹ️ [Bootstrap] Already bootstrapped, skipping auto-start');
            return;
        }
        
        // Start only when BOTH conditions met
        if (scriptsLoaded && domReady) {
            console.log('🚀 [Bootstrap] Auto-starting...');
            startBootstrap();
        }
    }
    
    // Listen for scripts loaded event
    function onScriptsLoaded() {
        console.log('📡 [Bootstrap] Scripts loaded event received');
        scriptsLoaded = true;
        tryStart();
    }
    
    // Listen for DOM ready
    function onDomReady() {
        console.log('📄 [Bootstrap] DOM ready');
        domReady = true;
        tryStart();
    }
    
    // Register event listeners
    // Use native DOM events since EventBus isn't initialized yet
    window.addEventListener('oslira:scripts:loaded', onScriptsLoaded);
    
    if (domReady) {
        onDomReady();
    } else {
        document.addEventListener('DOMContentLoaded', onDomReady);
        // Backup: if DOMContentLoaded already fired
        if (document.readyState !== 'loading') {
            setTimeout(onDomReady, 0);
        }
    }
    
// Actual bootstrap startup
async function startBootstrap() {
    try {
        // Create and store instance
        const bootstrap = new Bootstrap();
        
        if (!window.Oslira) {
            window.Oslira = {};
        }
        window.Oslira.bootstrap = bootstrap;
        
        // Run bootstrap (correct method name is 'bootstrap')
        await bootstrap.bootstrap();  // ✅ CORRECT
        
        console.log('✅ [Bootstrap] Auto-start completed successfully');
        
    } catch (error) {
        console.error('❌ [Bootstrap] Auto-start failed:', error);
        console.error('   Error details:', error.message);
        console.error('   Stack:', error.stack);
        
        // Show error to user
        if (window.OsliraErrorHandler) {
            window.OsliraErrorHandler.handleError(error, {
                component: 'Bootstrap',
                phase: 'auto-start',
                fatal: true
            });
        }
    }
}
})();
