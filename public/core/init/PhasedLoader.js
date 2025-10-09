// =============================================================================
// PHASED LOADER - Parallel Script Loading with Dependency Management
// Path: /public/core/init/PhasedLoader.js
// Dependencies: None (loads first)
// =============================================================================

/**
 * @class PhasedLoader
 * @description Loads scripts in parallel phases with dependency management
 * 
 * Features:
 * - Parallel loading within phases
 * - Sequential phase execution
 * - Dependency validation
 * - Error handling with retry
 * - Performance tracking
 * - Progress callbacks
 * - Cache-busting support
 */
class PhasedLoader {
    constructor() {
        this.phases = [];
        this.loadedScripts = new Set();
        this.failedScripts = new Set();
        this.loadTimes = new Map();
        this.currentPhase = 0;
        this.startTime = null;
        
        // Configuration
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 10000,
            cacheBust: false,
            parallel: true
        };
        
        // Callbacks
        this.onPhaseComplete = null;
        this.onAllComplete = null;
        this.onError = null;
        this.onProgress = null;
        
        console.log('📦 [PhasedLoader] Instance created');
    }
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    /**
     * Define loading phases
     */
    definePhases(phases) {
        this.phases = phases.map((phase, index) => ({
            id: index,
            name: phase.name || `Phase ${index + 1}`,
            scripts: phase.scripts || [],
            critical: phase.critical || false,
            timeout: phase.timeout || this.config.timeout
        }));
        
        console.log(`📋 [PhasedLoader] Defined ${this.phases.length} phases`);
        return this;
    }
    
    /**
     * Set configuration
     */
    configure(options) {
        this.config = { ...this.config, ...options };
        return this;
    }
    
    /**
     * Set callbacks
     */
    on(event, callback) {
        switch(event) {
            case 'phaseComplete':
                this.onPhaseComplete = callback;
                break;
            case 'allComplete':
                this.onAllComplete = callback;
                break;
            case 'error':
                this.onError = callback;
                break;
            case 'progress':
                this.onProgress = callback;
                break;
        }
        return this;
    }
    
    // =========================================================================
    // LOADING
    // =========================================================================
    
    /**
     * Start loading all phases
     */
    async load() {
        this.startTime = performance.now();
        console.log('🚀 [PhasedLoader] Starting phased load...');
        
        try {
            for (let i = 0; i < this.phases.length; i++) {
                this.currentPhase = i;
                await this.loadPhase(this.phases[i]);
            }
            
            const totalTime = performance.now() - this.startTime;
            console.log(`✅ [PhasedLoader] All phases complete in ${totalTime.toFixed(2)}ms`);
            
            if (this.onAllComplete) {
                this.onAllComplete({
                    totalTime,
                    loadedScripts: Array.from(this.loadedScripts),
                    failedScripts: Array.from(this.failedScripts),
                    loadTimes: Object.fromEntries(this.loadTimes)
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ [PhasedLoader] Loading failed:', error);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }
    
    /**
     * Load a single phase
     */
    async loadPhase(phase) {
        const phaseStart = performance.now();
        console.log(`📦 [PhasedLoader] Loading ${phase.name}...`);
        
        try {
            // Load all scripts in phase in parallel
            const loadPromises = phase.scripts.map(script => 
                this.loadScript(script, phase.critical)
            );
            
            await Promise.all(loadPromises);
            
            const phaseTime = performance.now() - phaseStart;
            console.log(`✅ [PhasedLoader] ${phase.name} complete in ${phaseTime.toFixed(2)}ms`);
            
            if (this.onPhaseComplete) {
                this.onPhaseComplete({
                    phase: phase.name,
                    phaseIndex: phase.id,
                    time: phaseTime,
                    scriptsLoaded: phase.scripts.length
                });
            }
            
        } catch (error) {
            if (phase.critical) {
                console.error(`❌ [PhasedLoader] Critical phase ${phase.name} failed:`, error);
                throw error;
            } else {
                console.warn(`⚠️ [PhasedLoader] Non-critical phase ${phase.name} failed:`, error);
            }
        }
    }
    
    /**
     * Load a single script
     */
    async loadScript(scriptPath, critical = false) {
        // Skip if already loaded
        if (this.loadedScripts.has(scriptPath)) {
            console.log(`⏭️ [PhasedLoader] Already loaded: ${scriptPath}`);
            return;
        }
        
        // Skip if previously failed and not critical
        if (this.failedScripts.has(scriptPath) && !critical) {
            console.log(`⏭️ [PhasedLoader] Previously failed: ${scriptPath}`);
            return;
        }
        
        const scriptStart = performance.now();
        let retries = 0;
        
        while (retries <= this.config.maxRetries) {
            try {
                await this._loadScriptTag(scriptPath);
                
                const loadTime = performance.now() - scriptStart;
                this.loadedScripts.add(scriptPath);
                this.loadTimes.set(scriptPath, loadTime);
                
                console.log(`✅ [PhasedLoader] Loaded: ${scriptPath} (${loadTime.toFixed(2)}ms)`);
                
                if (this.onProgress) {
                    this.onProgress({
                        script: scriptPath,
                        loaded: this.loadedScripts.size,
                        total: this._getTotalScriptCount(),
                        phase: this.currentPhase
                    });
                }
                
                return;
                
            } catch (error) {
                retries++;
                
                if (retries <= this.config.maxRetries) {
                    console.warn(`⚠️ [PhasedLoader] Retry ${retries}/${this.config.maxRetries} for: ${scriptPath}`);
                    await this._delay(this.config.retryDelay * retries);
                } else {
                    console.error(`❌ [PhasedLoader] Failed to load: ${scriptPath}`, error);
                    this.failedScripts.add(scriptPath);
                    
                    if (critical) {
                        throw new Error(`Critical script failed to load: ${scriptPath}`);
                    }
                }
            }
        }
    }
    
    /**
     * Load script tag (internal)
     */
    _loadScriptTag(scriptPath) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.config.cacheBust ? 
                `${scriptPath}?v=${Date.now()}` : 
                scriptPath;
            script.async = true;
            
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error(`Script load timeout: ${scriptPath}`));
            }, this.config.timeout);
            
            const cleanup = () => {
                clearTimeout(timeout);
                script.onload = null;
                script.onerror = null;
            };
            
            script.onload = () => {
                cleanup();
                resolve();
            };
            
            script.onerror = () => {
                cleanup();
                reject(new Error(`Script load error: ${scriptPath}`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Delay helper
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get total script count
     */
    _getTotalScriptCount() {
        return this.phases.reduce((total, phase) => total + phase.scripts.length, 0);
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Check if script is loaded
     */
    isLoaded(scriptPath) {
        return this.loadedScripts.has(scriptPath);
    }
    
    /**
     * Get load statistics
     */
    getStats() {
        return {
            totalScripts: this._getTotalScriptCount(),
            loadedScripts: this.loadedScripts.size,
            failedScripts: this.failedScripts.size,
            averageLoadTime: this._getAverageLoadTime(),
            totalTime: this.startTime ? performance.now() - this.startTime : 0
        };
    }
    
    /**
     * Get average load time
     */
    _getAverageLoadTime() {
        if (this.loadTimes.size === 0) return 0;
        const sum = Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0);
        return sum / this.loadTimes.size;
    }
    
    /**
     * Reset loader
     */
    reset() {
        this.loadedScripts.clear();
        this.failedScripts.clear();
        this.loadTimes.clear();
        this.currentPhase = 0;
        this.startTime = null;
        console.log('🔄 [PhasedLoader] Reset complete');
    }
}

// =============================================================================
// PHASE DEFINITIONS
// =============================================================================

/**
 * Define standard phase structure
 */
const STANDARD_PHASES = {
    // Phase 0: Critical Infrastructure (No dependencies)
    CRITICAL: {
        name: 'Critical Infrastructure',
        critical: true,
        scripts: [
            '/core/infrastructure/EnvDetector.js',
            '/core/infrastructure/Logger.js',
            '/core/infrastructure/ErrorHandler.js',
            '/core/events/EventBus.js'
        ]
    },
    
    // Phase 1: Core Infrastructure (Depends on Phase 0)
    INFRASTRUCTURE: {
        name: 'Core Infrastructure',
        critical: true,
        scripts: [
            '/core/infrastructure/HttpClient.js',
            '/core/infrastructure/ConfigProvider.js',
            '/core/state/Store.js',
            '/core/state/StateManager.js',
            '/core/utils/NavigationHelper.js'
        ]
    },
    
    // Phase 2: Services (Depends on Phase 1)
    SERVICES: {
        name: 'Services',
        critical: true,
        scripts: [
            '/core/auth/AuthManager.js',
            '/core/state/Selectors.js',
            '/core/infrastructure/DependencyContainer.js'
        ]
    },
    
    // Phase 3: UI Components (Depends on Phase 2)
    UI_CORE: {
        name: 'UI Core',
        critical: false,
        scripts: [
            '/core/ui/components/layouts/AppHeader.js',
            '/core/ui/components/layouts/AppFooter.js',
            '/core/ui/components/layouts/Sidebar.js'
        ]
    },
    
    // Phase 4: Page-Specific (Depends on Phase 3)
    PAGE: {
        name: 'Page Scripts',
        critical: false,
        scripts: [] // Will be populated based on current page
    }
};

// =============================================================================
// GLOBAL EXPORT & INITIALIZATION
// =============================================================================

// Create singleton instance
const phasedLoader = new PhasedLoader();

// Export
window.OsliraPhasedLoader = PhasedLoader;
window.OsliraLoader = phasedLoader;
window.STANDARD_PHASES = STANDARD_PHASES;

console.log('✅ [PhasedLoader] Loaded and ready');

// Example usage (will be called from bootstrap)
/*
window.OsliraLoader
    .definePhases([
        STANDARD_PHASES.CRITICAL,
        STANDARD_PHASES.INFRASTRUCTURE,
        STANDARD_PHASES.SERVICES,
        STANDARD_PHASES.UI_CORE,
        STANDARD_PHASES.PAGE
    ])
    .configure({
        parallel: true,
        maxRetries: 3,
        timeout: 10000
    })
    .on('phaseComplete', (data) => {
        console.log(`Phase complete: ${data.phase} in ${data.time}ms`);
    })
    .on('allComplete', (data) => {
        console.log('All scripts loaded!', data);
        // Emit event for app initialization
        window.dispatchEvent(new Event('oslira:scripts:loaded'));
    })
    .on('error', (error) => {
        console.error('Loading failed:', error);
    })
    .load();
*/
