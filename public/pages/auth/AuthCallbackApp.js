// =============================================================================
// AUTH CALLBACK APP - OAuth Callback Processor
// Path: /public/pages/auth/AuthCallbackApp.js
// Dependencies: AuthManager (Phase 2), EnvDetector (Phase 0)
// =============================================================================

/**
 * @class AuthCallbackApp
 * @description Handles OAuth callback from Google via Supabase
 * 
 * Flow:
 * 1. Wait for oslira:scripts:loaded event
 * 2. Extract hash fragments from URL
 * 3. Let Supabase/AuthManager process the callback
 * 4. Redirect to appropriate destination
 * 
 * Features:
 * - Automatic hash processing
 * - Error handling with retry
 * - Loading state management
 * - Smart redirect logic
 */
class AuthCallbackApp {
    constructor() {
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
        try {
            // Wait for all scripts to load
            window.addEventListener('oslira:scripts:loaded', async () => {
                await this.initialize();
            });
            
        } catch (error) {
            console.error('❌ [AuthCallbackApp] Initialization failed:', error);
            this.showError('Failed to initialize callback handler');
        }
    }
    
    async initialize() {
        console.log('🔐 [AuthCallbackApp] Processing OAuth callback...');
        
        try {
            // Verify required dependencies
            if (!window.OsliraAuth) {
                throw new Error('AuthManager not available');
            }
            
            if (!window.OsliraEnv) {
                throw new Error('EnvDetector not available');
            }
            
            // Update status
            this.updateStatus('Processing authentication...');
            
            // Log URL for debugging (careful not to log sensitive data in production)
            const urlParams = new URLSearchParams(window.location.search);
            const hasHash = window.location.hash.length > 0;
            
            console.log('🔐 [AuthCallbackApp] URL has hash:', hasHash);
            console.log('🔐 [AuthCallbackApp] URL params:', Array.from(urlParams.keys()));
            
            // Check for OAuth errors in URL
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');
            
            if (error) {
                console.error('❌ [AuthCallbackApp] OAuth error:', error, errorDescription);
                throw new Error(this.getErrorMessage(error, errorDescription));
            }
            
            // Let AuthManager handle the callback (it processes the hash automatically)
            this.updateStatus('Verifying credentials...');
            
            const result = await window.OsliraAuth.handleCallback();
            
            if (!result || !result.session) {
                throw new Error('No valid session received');
            }
            
            console.log('✅ [AuthCallbackApp] Authentication successful');
            console.log('👤 [AuthCallbackApp] User:', result.session.user.email);
            
            // Determine redirect destination
            const redirectUrl = this.getRedirectUrl(result);
            
            console.log('🔐 [AuthCallbackApp] Redirecting to:', redirectUrl);
            this.updateStatus('Success! Redirecting...');
            
            // Redirect after short delay for UX
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ [AuthCallbackApp] Callback processing failed:', error);
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
                console.warn('⚠️ [AuthCallbackApp] Invalid return_to URL:', returnTo);
            }
        }
        
        // Priority 3: Check if user needs onboarding
        // (You can expand this based on user profile data)
        const user = result.session.user;
        
        // If user metadata indicates they need onboarding
        if (user.user_metadata?.needs_onboarding) {
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
     * Update status message
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
        console.error('❌ [AuthCallbackApp] Showing error:', message);
        
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
window.AuthCallbackApp = new AuthCallbackApp();
console.log('✅ [AuthCallbackApp] Module loaded and ready');
