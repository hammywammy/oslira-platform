// =============================================================================
// AUTH APP - OAuth Handler
// Path: /public/pages/auth/AuthApp.js
// Dependencies: AuthManager (Phase 4), EnvDetector (Phase 0)
// =============================================================================

/**
 * @class AuthApp
 * @description Handles both login page AND OAuth callback
 * 
 * Pages:
 * - / (login page) - Shows login button, does NOT process callback
 * - /auth/callback (callback page) - Processes OAuth callback
 */
class AuthApp {
    constructor() {
        this.isInitialized = false;
        console.log('🔐 [AuthApp] Instance created');
        this.init();
    }
    
    async init() {
        try {
            // Wait for all scripts to load
            window.addEventListener('oslira:scripts:loaded', async () => {
                await this.initialize();
            });
            
        } catch (error) {
            console.error('❌ [AuthApp] Initialization failed:', error);
            this.showError('Failed to initialize auth handler');
        }
    }
    
    async initialize() {
        console.log('🔐 [AuthApp] Initializing...');
        
        try {
            // Verify required dependencies
            if (!window.OsliraAuth) {
                throw new Error('AuthManager not available');
            }
            
            if (!window.OsliraEnv) {
                throw new Error('EnvDetector not available');
            }
            
            // CRITICAL: Determine which page we're on
            const currentPath = window.location.pathname;
            const isCallbackPage = currentPath.includes('/callback') || 
                                   currentPath === '/auth/callback' ||
                                   currentPath === '/callback';
            
            console.log('📍 [AuthApp] Current path:', currentPath);
            console.log('📍 [AuthApp] Is callback page:', isCallbackPage);
            
            // Initialize AuthManager if not already initialized
            if (!window.OsliraAuth.isLoaded) {
                console.log('🔧 [AuthApp] Initializing AuthManager...');
                await window.OsliraAuth.initialize();
            }
            
            // Route to appropriate handler
            if (isCallbackPage) {
                console.log('🔄 [AuthApp] Processing OAuth callback...');
                await this.handleCallback();
            } else {
                console.log('🏠 [AuthApp] Login page - setting up UI...');
                await this.setupLoginPage();
            }
            
            this.isInitialized = true;
            console.log('✅ [AuthApp] Initialization complete');
            
        } catch (error) {
            console.error('❌ [AuthApp] Initialization failed:', error);
            this.showError(error.message || 'Initialization failed');
        }
    }
    
    // =========================================================================
    // LOGIN PAGE SETUP
    // =========================================================================
    
    /**
     * Setup login page (non-callback)
     */
    async setupLoginPage() {
        console.log('🏠 [AuthApp] Setting up login page...');
        
        // ====================================================================
        // CRITICAL FIX: Call isAuthenticated() as METHOD not property
        // ====================================================================
        if (window.OsliraAuth.isAuthenticated()) {
            console.log('✅ [AuthApp] User already authenticated, redirecting...');
            window.location.href = window.OsliraEnv.getAppUrl('/dashboard');
            return;
        }
        
        // Setup login button if it exists
        const loginButton = document.getElementById('google-signin-btn');
        if (loginButton) {
            loginButton.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    console.log('🔐 [AuthApp] Starting Google sign-in...');
                    loginButton.disabled = true;
                    loginButton.textContent = 'Signing in...';
                    
                    await window.OsliraAuth.signInWithGoogle();
                } catch (error) {
                    console.error('❌ [AuthApp] Sign-in failed:', error);
                    loginButton.disabled = false;
                    loginButton.textContent = 'Sign in with Google';
                    this.showError(error.message || 'Sign-in failed. Please try again.');
                }
            });
            
            console.log('✅ [AuthApp] Login button configured');
        }
        
        console.log('✅ [AuthApp] Login page ready');
    }
    
    // =========================================================================
    // CALLBACK HANDLING
    // =========================================================================
    
    /**
     * Handle OAuth callback
     */
    async handleCallback() {
        console.log('🔐 [AuthApp] Processing OAuth callback...');
        
        try {
            this.updateStatus('Processing authentication...');
            
            // Log URL for debugging (be careful not to log sensitive data)
            const urlParams = new URLSearchParams(window.location.search);
            const hasHash = window.location.hash.length > 0;
            
            console.log('🔐 [AuthApp] URL has hash:', hasHash);
            console.log('🔐 [AuthApp] URL params:', Array.from(urlParams.keys()));
            
            // Check for OAuth errors in URL
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');
            
            if (error) {
                console.error('❌ [AuthApp] OAuth error:', error, errorDescription);
                throw new Error(this.getErrorMessage(error, errorDescription));
            }
            
            // Let AuthManager handle the callback
            this.updateStatus('Verifying credentials...');
            
            const result = await window.OsliraAuth.handleCallback();
            
            if (!result || !result.session) {
                throw new Error('No valid session received');
            }
            
            console.log('✅ [AuthApp] Authentication successful');
            console.log('👤 [AuthApp] User:', result.session.user.email);
            
            // Determine redirect destination
            const redirectUrl = this.getRedirectUrl(result);
            
            console.log('🔐 [AuthApp] Redirecting to:', redirectUrl);
            this.updateStatus('Success! Redirecting...');
            
            // Redirect after short delay for UX
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
            
        } catch (error) {
            console.error('❌ [AuthApp] Callback processing failed:', error);
            this.showError(error.message || 'Authentication failed. Please try again.');
        }
    }
    
    // =========================================================================
    // REDIRECT LOGIC
    // =========================================================================
    
    /**
     * Determine where to redirect user after successful auth
     */
    getRedirectUrl(result) {
        // Priority 1: Use redirect from AuthManager.handleCallback()
        if (result.redirectTo) {
            return result.redirectTo;
        }
        
        // Priority 2: Check URL for return_to parameter
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('return_to');
        
        if (returnTo) {
            try {
                const returnUrl = decodeURIComponent(returnTo);
                // Validate it's an Oslira domain
                const url = new URL(returnUrl);
                if (url.hostname.endsWith(window.OsliraEnv.rootDomain)) {
                    return returnUrl;
                }
            } catch (e) {
                console.warn('⚠️ [AuthApp] Invalid return_to URL:', returnTo);
            }
        }
        
        // Priority 3: Check if user needs onboarding
        const user = result.session.user;
        
        // If user metadata indicates they need onboarding
        if (user.user_metadata?.needs_onboarding || result.needsOnboarding) {
            return window.OsliraEnv.getAppUrl('/onboarding');
        }
        
        // Priority 4: Default to dashboard
        return window.OsliraEnv.getAppUrl('/dashboard');
    }
    
    // =========================================================================
    // ERROR HANDLING
    // =========================================================================
    
    /**
     * Get user-friendly error message
     */
    getErrorMessage(error, description) {
        const errorMessages = {
            'access_denied': 'Sign-in was cancelled',
            'invalid_request': 'Invalid authentication request',
            'server_error': 'Server error occurred',
            'temporarily_unavailable': 'Service temporarily unavailable'
        };
        
        return errorMessages[error] || description || 'Authentication failed';
    }
    
    // =========================================================================
    // UI HELPERS
    // =========================================================================
    
    /**
     * Update status message (for callback page)
     */
    updateStatus(message) {
        const statusEl = document.getElementById('status-text');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
    
    /**
     * Show error state
     */
    showError(message) {
        console.error('❌ [AuthApp] Showing error:', message);
        
        // Hide loading
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
        
        // Show error
        const errorState = document.getElementById('error-state');
        const errorMessage = document.getElementById('error-message');
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        if (errorState) {
            errorState.classList.remove('hidden');
        }
        
        // Setup retry button
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                window.location.href = window.OsliraEnv.getAuthUrl();
            });
        }
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.AuthApp = new AuthApp();
console.log('✅ [AuthApp] Module loaded and ready');
