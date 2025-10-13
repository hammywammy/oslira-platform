// =============================================================================
// HOMEPAGE MAIN - ES6 Module Entry Point
// Path: /src/pages/www/main.js
// =============================================================================

console.log('🏠 [Homepage] Starting...');

// =============================================================================
// IMPORT CORE (This handles ALL your core services)
// =============================================================================
import '../../core/core-bundle.js';

// =============================================================================
// IMPORT PAGE-SPECIFIC SCRIPTS (Only what exists)
// =============================================================================
import './HomeHandlers.js';
import './HomeApp.js';

// =============================================================================
// INITIALIZE
// =============================================================================
console.log('✅ [Homepage] All modules loaded');

// Wait for DOM then initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 [Homepage] DOM ready, initializing app...');
    
    try {
        // Initialize HomeApp (which will auto-init HomeHandlers)
        if (window.HomeApp) {
            const app = new window.HomeApp();
            await app.initialize();
        }
        
        console.log('✅ [Homepage] Ready!');
    } catch (error) {
        console.error('❌ [Homepage] Init failed:', error);
    }
});
