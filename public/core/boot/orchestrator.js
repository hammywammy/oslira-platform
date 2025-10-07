/**
 * ORCHESTRATOR - Application Initialization
 * Coordinates between Loader, Registry, and Page Apps
 * 
 * Responsibilities:
 * - Detect current page
 * - Load page scripts (via Loader)
 * - Get page config (from Registry)
 * - Instantiate page app
 * - Call app.init()
 * - Fire ready event
 * 
 * Does NOT:
 * - Load files (Loader's job)
 * - Render UI (App's job)
 * - Handle page-specific logic (App's job)
 */

class OsliraOrchestrator {
    constructor() {
        this.initialized = false;
        this.currentApp = null;
    }
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [Orchestrator] Already initialized');
            return;
        }
        
        const startTime = performance.now();
        console.log('🎯 [Orchestrator] Starting initialization...');
        
        try {
            // ═══════════════════════════════════════════════════
            // STEP 1: Detect current page
            // ═══════════════════════════════════════════════════
            const pageName = window.OsliraEnv.CURRENT_PAGE;
            console.log(`📄 [Orchestrator] Current page: ${pageName}`);
            
            if (!pageName) {
                throw new Error('Unable to detect current page');
            }
            
            // ═══════════════════════════════════════════════════
            // STEP 2: Get page configuration
            // ═══════════════════════════════════════════════════
            const pageConfig = window.OsliraRegistry.getPageConfig(pageName);
            
            if (!pageConfig) {
                throw new Error(`No configuration found for page: ${pageName}`);
            }
            
            console.log(`📋 [Orchestrator] Page config:`, {
                appClass: pageConfig.appClass,
                scriptCount: pageConfig.scripts.length,
                requiresAuth: pageConfig.requiresAuth
            });
            
            // ═══════════════════════════════════════════════════
            // STEP 3: Auth check (if required)
            // ═══════════════════════════════════════════════════
            if (pageConfig.requiresAuth) {
                await this.enforceAuthentication(pageName);
            }
            
            // ═══════════════════════════════════════════════════
            // STEP 4: Load page scripts
            // ═══════════════════════════════════════════════════
            console.log(`📦 [Orchestrator] Loading ${pageConfig.scripts.length} scripts...`);
            await window.OsliraLoader.loadPageScripts(pageName);
            console.log('✅ [Orchestrator] All scripts loaded');
            
            // ═══════════════════════════════════════════════════
            // STEP 5: Instantiate page app
            // ═══════════════════════════════════════════════════
            const AppClass = window[pageConfig.appClass];
            
            if (!AppClass) {
                throw new Error(`App class '${pageConfig.appClass}' not found in window`);
            }
            
            console.log(`🏗️  [Orchestrator] Instantiating ${pageConfig.appClass}...`);
            this.currentApp = new AppClass();
            
            // ═══════════════════════════════════════════════════
            // STEP 6: Initialize the app
            // ═══════════════════════════════════════════════════
            if (typeof this.currentApp.init !== 'function') {
                throw new Error(`${pageConfig.appClass} must have an init() method`);
            }
            
            console.log(`🔧 [Orchestrator] Calling ${pageConfig.appClass}.init()...`);
            await this.currentApp.init();
            console.log('✅ [Orchestrator] App initialized successfully');
            
            // ═══════════════════════════════════════════════════
            // STEP 7: Fire ready event
            // ═══════════════════════════════════════════════════
            const readyEvent = new CustomEvent('oslira:ready', {
                detail: {
                    page: pageName,
                    app: this.currentApp,
                    timestamp: Date.now()
                }
            });
            window.dispatchEvent(readyEvent);
            
            this.initialized = true;
            
            const totalTime = (performance.now() - startTime).toFixed(0);
            console.log(`✅ [Orchestrator] Initialization complete in ${totalTime}ms`);
            
        } catch (error) {
            console.error('💥 [Orchestrator] Initialization failed:', error);
            this.showErrorUI(error);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // AUTH ENFORCEMENT
    // ═══════════════════════════════════════════════════════════
    
    async enforceAuthentication(pageName) {
        console.log('🔐 [Orchestrator] Checking authentication...');
        
        // Wait for auth to be ready
        let attempts = 0;
        while (!window.OsliraAuth?.isLoaded && attempts < 50) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        
        if (!window.OsliraAuth?.isLoaded) {
            throw new Error('Auth system not ready');
        }
        
        // Check if user is authenticated
        if (!window.OsliraAuth.session || !window.OsliraAuth.user) {
            console.warn('⚠️ [Orchestrator] Not authenticated, redirecting to auth...');
            window.location.href = window.OsliraEnv.getAuthUrl();
            throw new Error('Authentication required');
        }
        
        console.log('✅ [Orchestrator] User authenticated:', window.OsliraAuth.user.email);
    }
    
    // ═══════════════════════════════════════════════════════════
    // ERROR UI
    // ═══════════════════════════════════════════════════════════
    
    showErrorUI(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            text-align: center;
            z-index: 10000;
        `;
        
        errorDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h2 style="font-size: 20px; color: #dc2626; margin-bottom: 12px;">Initialization Failed</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">${error.message}</p>
            <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                Reload Page
            </button>
            <details style="margin-top: 20px; text-align: left;">
                <summary style="cursor: pointer; color: #6b7280; font-size: 14px;">Technical Details</summary>
                <pre style="margin-top: 12px; font-size: 12px; color: #374151; overflow-x: auto; background: #f9fafb; padding: 12px; border-radius: 6px;">${error.stack || error.message}</pre>
            </details>
        `;
        
        document.body.appendChild(errorDiv);
    }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL EXPORT
// ═══════════════════════════════════════════════════════════
window.OsliraOrchestrator = new OsliraOrchestrator();
console.log('✅ [Orchestrator] Module loaded and ready');
