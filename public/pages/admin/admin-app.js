//public/pages/admin/admin-app.js

/**
 * ADMIN APP - Bootstrap System Compatible
 * Handles initialization via orchestrator pattern
 */
class AdminApp {
    constructor() {
        this.core = null;
        this.initialized = false;
        console.log('🎯 [AdminApp] Instance created');
    }
    
    async init() {
        try {
            console.log('🚀 [AdminApp] Starting initialization...');
            
            // Wait for config to be ready
            await window.OsliraEnv.ready();
            console.log('✅ [AdminApp] Config ready');
            
            // Create and initialize admin core (will handle password prompt)
            this.core = new AdminCore();
            await this.core.initialize();
            
            this.initialized = true;
            console.log('✅ [AdminApp] Admin panel ready');
            
            // Make page visible
            document.body.style.visibility = 'visible';
            
        } catch (error) {
            console.error('❌ [AdminApp] Initialization failed:', error);
            this.showError(error.message || 'Failed to initialize admin panel');
            throw error;
        }
    }
    
    showError(message) {
        const loadingEl = document.getElementById('admin-loading');
        const errorEl = document.getElementById('admin-error');
        const errorMessageEl = document.getElementById('admin-error-message');
        
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
        if (errorMessageEl) {
            errorMessageEl.textContent = message;
        }
        
        document.body.style.visibility = 'visible';
    }
}

// Export to window for orchestrator
window.AdminApp = AdminApp;
console.log('✅ [AdminApp] Module loaded and ready');
