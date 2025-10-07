/**
 * BOOTSTRAP - Application Entry Point
 * The ONLY file loaded directly in HTML <script> tags
 * Responsibilities:
 * - Wait for env-manager (loaded before bootstrap)
 * - Wait for AWS config fetch
 * - Load core scripts via Loader
 * - Initialize app via Orchestrator
 */

(async function() {
    'use strict';
    
    const startTime = performance.now();
    console.log('🚀 [Bootstrap] Application starting...');
    
    try {
        // ═══════════════════════════════════════════════════════════
        // STEP 1: Verify env-manager exists (must load before bootstrap)
        // ═══════════════════════════════════════════════════════════
        if (typeof window.OsliraEnv === 'undefined') {
            throw new Error('env-manager.js must be loaded before bootstrap.js');
        }
        console.log('✅ [Bootstrap] env-manager detected');
        
        // ═══════════════════════════════════════════════════════════
        // STEP 2: Wait for AWS config to be fetched
        // ═══════════════════════════════════════════════════════════
        console.log('⏳ [Bootstrap] Waiting for config from AWS...');
        await window.OsliraEnv.ready();
        console.log('✅ [Bootstrap] Config ready');
        
        // ═══════════════════════════════════════════════════════════
        // STEP 3: Load core scripts (supabase, config-manager, auth-manager)
        // ═══════════════════════════════════════════════════════════
        if (typeof window.OsliraLoader === 'undefined') {
            throw new Error('loader.js failed to load');
        }
        
        console.log('📦 [Bootstrap] Loading core dependencies...');
        await window.OsliraLoader.loadCore();
        console.log('✅ [Bootstrap] Core dependencies loaded');
        
        // ═══════════════════════════════════════════════════════════
        // STEP 4: Initialize the application
        // ═══════════════════════════════════════════════════════════
        if (typeof window.OsliraOrchestrator === 'undefined') {
            throw new Error('orchestrator.js failed to load');
        }
        
        console.log('🎯 [Bootstrap] Initializing application...');
        await window.OsliraOrchestrator.init();
        
        const totalTime = (performance.now() - startTime).toFixed(0);
        console.log(`✅ [Bootstrap] Application ready in ${totalTime}ms`);
        
    } catch (error) {
        console.error('💥 [Bootstrap] FATAL ERROR:', error);
        showFatalError(error);
    }
    
    // ═══════════════════════════════════════════════════════════
    // FATAL ERROR UI
    // ═══════════════════════════════════════════════════════════
    function showFatalError(error) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fef2f2; font-family: system-ui, -apple-system, sans-serif;">
                <div style="text-align: center; max-width: 500px; padding: 40px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                    <h1 style="font-size: 24px; color: #991b1b; margin-bottom: 12px;">Application Failed to Load</h1>
                    <p style="color: #7f1d1d; margin-bottom: 24px;">${error.message}</p>
                    <button onclick="window.location.reload()" style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 500;">
                        🔄 Reload Page
                    </button>
                    <details style="margin-top: 24px; text-align: left; background: white; padding: 16px; border-radius: 8px; border: 1px solid #fecaca;">
                        <summary style="cursor: pointer; color: #991b1b; font-weight: 500;">Technical Details</summary>
                        <pre style="margin-top: 12px; font-size: 12px; color: #7f1d1d; overflow-x: auto;">${error.stack || error.message}</pre>
                    </details>
                </div>
            </div>
        `;
    }
    
})();
