/**
 * LOADER - Script Loading System
 * Responsibilities:
 * - Load core scripts (supabase, config-manager, auth-manager)
 * - Load page-specific scripts (from ModuleRegistry)
 * - De-duplication (don't load same script twice)
 * - Parallel loading where possible
 * 
 * Does NOT:
 * - Initialize anything
 * - Call app.init()
 * - Handle dependencies between modules
 */

class OsliraLoader {
    constructor() {
        this.loadedScripts = new Set();
        this.loadingPromises = new Map();
        this.failedScripts = new Set();
        
        console.log('📦 [Loader] Initialized');
    }
    
    // ═══════════════════════════════════════════════════════════
    // CORE SCRIPTS LOADING (Sequential Phases)
    // ═══════════════════════════════════════════════════════════
    
    async loadCore() {
        console.log('🔧 [Loader] Loading core scripts...');
        
        try {
            // ─────────────────────────────────────────────────────
            // PHASE 1: Supabase (must be first)
            // ─────────────────────────────────────────────────────
            console.log('📦 [Loader] Phase 1: Loading Supabase CDN...');
            await this.loadScript(
                'supabase',
                'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
            );
            
            if (!window.supabase?.createClient) {
                throw new Error('Supabase CDN failed to expose createClient');
            }
            console.log('✅ [Loader] Supabase ready');
            
            // ─────────────────────────────────────────────────────
            // PHASE 2: Config + Auth (parallel, both need supabase)
            // ─────────────────────────────────────────────────────
            console.log('📦 [Loader] Phase 2: Loading config + auth in parallel...');
            await Promise.all([
                this.loadScript('config-manager', '/core/config-manager.js'),
                this.loadScript('auth-manager', '/core/auth-manager.js')
            ]);
            
            if (!window.OsliraConfig) {
                throw new Error('config-manager failed to expose OsliraConfig');
            }
            if (!window.OsliraAuth) {
                throw new Error('auth-manager failed to expose OsliraAuth');
            }
            
            console.log('✅ [Loader] Core scripts loaded successfully');
            
        } catch (error) {
            console.error('❌ [Loader] Core scripts failed:', error);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // PAGE SCRIPTS LOADING (Parallel)
    // ═══════════════════════════════════════════════════════════
    
    async loadPageScripts(pageName) {
        console.log(`📄 [Loader] Loading scripts for page: ${pageName}`);
        
        // Get script list from registry
        if (!window.OsliraRegistry) {
            throw new Error('ModuleRegistry not loaded');
        }
        
        const scripts = window.OsliraRegistry.getPageScripts(pageName);
        
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
    
    // ═══════════════════════════════════════════════════════════
    // SCRIPT LOADING (With De-duplication)
    // ═══════════════════════════════════════════════════════════
    
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
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`✅ [Loader] ${name} loaded successfully`);
                this.loadedScripts.add(name);
                this.loadingPromises.delete(name);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ [Loader] ${name} failed to load from ${src}`);
                this.failedScripts.add(name);
                this.loadingPromises.delete(name);
                reject(new Error(`Failed to load: ${name}`));
            };
            
            document.head.appendChild(script);
        });
        
        this.loadingPromises.set(name, promise);
        return promise;
    }
    
    // ═══════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════
    
    extractScriptName(scriptPath) {
        return scriptPath.split('/').pop().replace('.js', '');
    }
    
    isLoaded(scriptName) {
        return this.loadedScripts.has(scriptName);
    }
    
    getLoadedScripts() {
        return Array.from(this.loadedScripts);
    }
    
    getFailedScripts() {
        return Array.from(this.failedScripts);
    }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL EXPORT
// ═══════════════════════════════════════════════════════════
window.OsliraLoader = new OsliraLoader();
console.log('✅ [Loader] Module loaded and ready');
