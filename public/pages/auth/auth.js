// =============================================================================
// AUTH.JS - Google OAuth Only
// File: public/pages/auth/auth.js
// =============================================================================

class OsliraAuthPage {
    constructor() {
        this.isLoading = false;
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    async initialize() {
        console.log('🔐 [Auth] Initializing Google OAuth authentication...');
        
        if (!window.OsliraAuth) {
            throw new Error('Auth manager not available');
        }
        
        await window.OsliraAuth.initialize();
        this.setupEventListeners();
        this.handleUrlErrors();
        
        document.body.style.visibility = 'visible';
        console.log('✅ [Auth] Authentication system ready');
    }

    // =============================================================================
    // ERROR HANDLING
    // =============================================================================

    handleUrlErrors() {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
            let errorMessage = 'Authentication failed. Please try again.';
            
            switch (error) {
                case 'authentication-failed':
                    errorMessage = 'Authentication failed. Please try again.';
                    break;
                case 'callback-failed':
                    errorMessage = 'Login process failed. Please try again.';
                    break;
                case 'access-denied':
                    errorMessage = 'Sign-in was cancelled.';
                    break;
                default:
                    errorMessage = 'An error occurred. Please try again.';
            }
            
            setTimeout(() => this.showError(errorMessage), 500);
        }
    }

    // =============================================================================
    // EVENT LISTENERS
    // =============================================================================

    setupEventListeners() {
        const googleBtn = document.getElementById('google-signin-btn');
        const retryBtn = document.getElementById('retry-btn');
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleAuth());
        }
        
        if (retryBtn) {
            retryBtn.addEventListener('click', () => window.location.reload());
        }
    }

    // =============================================================================
    // GOOGLE OAUTH HANDLER
    // =============================================================================

    async handleGoogleAuth() {
        if (this.isLoading) return;
        
        try {
            this.hideError();
            this.showLoading('Connecting to Google...');
            await window.OsliraAuth.signInWithGoogle();
        } catch (error) {
            console.error('❌ [Auth] Google sign-in failed:', error);
            this.hideLoading();
            this.showError('Google sign-in failed. Please try again.');
        }
    }

    // =============================================================================
    // UI STATE MANAGEMENT
    // =============================================================================

    showLoading(message) {
        this.isLoading = true;
        const loadingStateEl = document.getElementById('loading-state');
        const loadingTextEl = document.getElementById('loading-message');
        
        if (loadingTextEl && message) {
            loadingTextEl.textContent = message;
        }
        
        if (loadingStateEl) {
            loadingStateEl.classList.remove('hidden');
            loadingStateEl.classList.add('show');
        }
        
        document.querySelectorAll('button').forEach(el => el.disabled = true);
    }

    hideLoading() {
        this.isLoading = false;
        const loadingStateEl = document.getElementById('loading-state');
        
        if (loadingStateEl) {
            loadingStateEl.classList.add('hidden');
            loadingStateEl.classList.remove('show');
        }
        
        document.querySelectorAll('button').forEach(el => el.disabled = false);
    }

    showError(message) {
        const errorMsgEl = document.getElementById('error-message');
        const errorStateEl = document.getElementById('error-state');
        
        if (errorMsgEl) {
            errorMsgEl.textContent = message;
        }
        
        if (errorStateEl) {
            errorStateEl.classList.remove('hidden');
            errorStateEl.classList.add('show');
        }
    }

    hideError() {
        const errorStateEl = document.getElementById('error-state');
        
        if (errorStateEl) {
            errorStateEl.classList.add('hidden');
            errorStateEl.classList.remove('show');
        }
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

window.addEventListener('oslira:scripts:loaded', async () => {
    try {
        console.log('🔐 [Auth] Scripts loaded, initializing...');
        const authPage = new OsliraAuthPage();
        await authPage.initialize();
    } catch (error) {
        console.error('❌ [Auth] Initialization failed:', error);
        
        const errorMsgEl = document.getElementById('error-message');
        const errorStateEl = document.getElementById('error-state');
        
        if (errorMsgEl) {
            errorMsgEl.textContent = 'Failed to load authentication system. Please refresh.';
        }
        
        if (errorStateEl) {
            errorStateEl.classList.remove('hidden');
            errorStateEl.classList.add('show');
        }
        
        document.body.style.visibility = 'visible';
    }
});

console.log('🔐 [Auth] Script loaded');
