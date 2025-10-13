// =============================================================================
// HOMEPAGE MAIN - ES6 Module Entry Point
// Path: /src/pages/www/main.js
// =============================================================================

console.log('🏠 [Homepage] Starting ES6 module initialization...');

// =============================================================================
// PHASE 1: IMPORT CORE BUNDLE
// =============================================================================
import coreBundle from '../../core/core-bundle.js';

// Wait for core to be ready
console.log('⏳ [Homepage] Waiting for core bundle...');

// =============================================================================
// PHASE 2: IMPORT PAGE-SPECIFIC MODULES
// =============================================================================
import HomeState from './HomeState.js';
import HomeHandlers from './HomeHandlers.js';
import HomeApp from './HomeApp.js';

// =============================================================================
// PHASE 3: INITIALIZE HOMEPAGE APPLICATION
// =============================================================================
async function initializeHomepage() {
    try {
        console.log('🚀 [Homepage] Initializing page application...');
        
        // Step 1: Initialize HomeState
        const homeState = new HomeState();
        await homeState.initialize();
        window.HomeState = homeState; // Temporary backwards compat
        
        // Step 2: Initialize HomeHandlers  
        const homeHandlers = new HomeHandlers();
        await homeHandlers.initialize();
        window.HomeHandlers = homeHandlers; // Temporary backwards compat
        
        // Step 3: Initialize HomeApp
        const homeApp = new HomeApp();
        await homeApp.initialize();
        window.HomeApp = homeApp; // Temporary backwards compat
        
        console.log('✅ [Homepage] Application ready!');
        
        // Optional: Dispatch ready event
        window.dispatchEvent(new CustomEvent('homepage:ready', {
            detail: { homeState, homeHandlers, homeApp }
        }));
        
    } catch (error) {
        console.error('❌ [Homepage] Initialization failed:', error);
        
        // Show user-friendly error
        document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1 style="color: #dc2626;">⚠️ Unable to load page</h1>
                <p style="color: #6b7280;">Please refresh the page or contact support if the issue persists.</p>
                <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; text-align: left; overflow: auto;">
${error.stack}
                </pre>
            </div>
        `;
    }
}

// =============================================================================
// PHASE 4: START INITIALIZATION
// =============================================================================
initializeHomepage();
