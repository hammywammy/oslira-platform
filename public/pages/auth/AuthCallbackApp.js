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
 * 2. Let AuthManager process OAuth callback
 * 3. Determine destination (onboarding vs dashboard)
 * 4. Use AuthManager to navigate with session transfer
 * 
 * Features:
 * - Automatic OAuth processing
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
            
            // Log URL for debugging
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
            
            // ====================================================================
            // STEP 1: Let AuthManager process OAuth callback
            // Returns: { session, user, needsOnboarding }
            // ====================================================================
            
            this.updateStatus('Verifying credentials...');
            
            const result = await window.OsliraAuth.handleCallback();
            
            if (!result || !result.session) {
                throw new Error('No valid session received');
            }
            
            console.log('✅ [AuthCallbackApp] Authentication successful');
            console.log('👤 [AuthCallbackApp] User:', result.session.user.email);
            console.log('📊 [AuthCallbackApp] Needs onboarding:', result.needsOnboarding);
            
            // ====================================================================
            // STEP 2: Determine destination path
            // Priority: return_to > onboarding > dashboard
            // ====================================================================
            
            const destinationPath = this.getRedirectPath(result);
            
            console.log('🔐 [AuthCallbackApp] Destination path:', destinationPath);
            this.updateStatus('Success! Redirecting...');
            
            // ====================================================================
            // STEP 3: Use AuthManager to navigate with session transfer
            // This handles cross-subdomain token passing automatically
            // ====================================================================
            
            await window.OsliraAuth.navigateToApp(destinationPath);
            
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
     * Returns PATH only (not full URL) - AuthManager handles URL building
     */
    getRedirectPath(result) {
        console.log('🔐 [AuthCallbackApp] Determining redirect path...');
        
        // Priority 1: Check URL for return_to parameter
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('return_to');
        
        if (returnTo) {
            try {
                const returnUrl = decodeURIComponent(returnTo);
                // Validate it's an Oslira domain
                const url = new URL(returnUrl);
                if (url.hostname.endsWith(window.OsliraEnv.rootDomain)) {
                    console.log('✅ [AuthCallbackApp] Using return_to parameter:', returnUrl);
                    // Return the full URL for return_to case
                    return returnUrl;
                }
            } catch (e) {
                console.warn('⚠️ [AuthCallbackApp] Invalid return_to URL:', returnTo);
            }
        }
        
        // Priority 2: Check if user needs onboarding
        if (result.needsOnboarding) {
            console.log('✅ [AuthCallbackApp] User needs onboarding');
            return '/onboarding';
        }
        
        // Priority 3: Default to dashboard
        console.log('✅ [AuthCallbackApp] Redirecting to dashboard');
        return '/dashboard';
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
