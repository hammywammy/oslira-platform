// =============================================================================
// PHASED LOADER - Parallel Script Loading with Dependency Management
// Path: /public/core/init/PhasedLoader.js
// Dependencies: None (loaded by Loader.js)
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
            critical: phase.critical !== undefined ? phase.critical : false,
            timeout: phase.timeout || this.config.timeout
        }));
        
        console.log(`📋 [PhasedLoader] Defined ${this.phases.length} phases with ${this._getTotalScriptCount()} total scripts`);
        return this;
    }
    
    /**
     * Set configuration
     */
    configure(options) {
        this.config = { ...this.config, ...options };
        console.log('⚙️ [PhasedLoader] Configuration updated:', this.config);
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
        console.log(`📦 [PhasedLoader] Phase ${phase.id}: ${phase.name} (${phase.scripts.length} scripts)...`);
        
        try {
            // Load all scripts in phase in parallel
            const loadPromises = phase.scripts.map(script => 
                this.loadScript(script, phase.critical)
            );
            
            await Promise.all(loadPromises);
            
            const phaseTime = performance.now() - phaseStart;
            console.log(`✅ [PhasedLoader] Phase ${phase.id} complete in ${phaseTime.toFixed(2)}ms`);
            
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
                console.warn(`⚠️ [PhasedLoader] Non-critical phase ${phase.name} had errors:`, error);
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
            console.log(`⏭️ [PhasedLoader] Previously failed (skipping): ${scriptPath}`);
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
                
                console.log(`✅ [PhasedLoader] ${scriptPath} (${loadTime.toFixed(2)}ms)`);
                
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
                    console.warn(`⚠️ [PhasedLoader] Retry ${retries}/${this.config.maxRetries}: ${scriptPath}`);
                    await this._delay(this.config.retryDelay * retries);
                } else {
                    console.error(`❌ [PhasedLoader] Failed: ${scriptPath}`, error);
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
                reject(new Error(`Timeout: ${scriptPath}`));
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
                reject(new Error(`Load error: ${scriptPath}`));
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
    
    /**
     * Debug info
     */
    debug() {
        console.group('🐛 [PhasedLoader] Debug Info');
        console.log('Phases:', this.phases.length);
        console.log('Total Scripts:', this._getTotalScriptCount());
        console.log('Loaded:', this.loadedScripts.size);
        console.log('Failed:', this.failedScripts.size);
        console.log('Config:', this.config);
        console.groupEnd();
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================

// Create singleton instance
const phasedLoader = new PhasedLoader();

// Export class and instance
window.OsliraPhasedLoader = PhasedLoader;
window.OsliraLoader = phasedLoader;

console.log('✅ [PhasedLoader] Loaded and ready');
