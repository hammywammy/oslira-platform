// =============================================================================
// AUTH APP - Main Authentication Page Controller
// Path: /public/pages/auth/AuthApp.js
// Dependencies: AuthManager (Phase 2), NavigationHelper (Phase 1), EnvDetector (Phase 0)
// =============================================================================

/**
 * @class AuthApp
 * @description Controls the main authentication page (Google OAuth)
 * 
 * Responsibilities:
 * - Initialize page UI
 * - Handle Google sign-in button
 * - Display loading/error/success states
 * - Handle URL error parameters
 * - Setup environment-aware navigation links
 * 
 * Integration:
 * - Waits for oslira:scripts:loaded event
 * - All dependencies loaded by Loader.js
 * - Zero manual script loading
 */
class AuthApp {
    constructor() {
        this.isInitialized = false;
        this.isLoading = false;
        
        console.log('🔐 [AuthApp] Instance created');
    }
    
    // =========================================================================
    // MAIN INITIALIZATION (Called by Bootstrap)
    // =========================================================================
    
    async init() {
        if (this.isInitialized) {
            console.log('⚠️ [AuthApp] Already initialized');
            return;
        }
        
        try {
            // Wait for all scripts to load
            window.addEventListener('oslira:scripts:loaded', async () => {
                await this.initialize();
            });
            
        } catch (error) {
            console.error('❌ [AuthApp] Initialization failed:', error);
        }
    }
    
    async initialize() {
        console.log('🔐 [AuthApp] Starting initialization...');
        
        try {
            // Verify required dependencies
            if (!window.OsliraAuth) {
                throw new Error('AuthManager not available');
            }
            
            if (!window.OsliraEnv) {
                throw new Error('EnvDetector not available');
            }
            
            // Check if user is already authenticated
            await this.checkExistingAuth();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Handle URL error parameters
            this.handleUrlErrors();
            
            // Show page content (loading screen is auto-hidden by Loader.js)
            // Body visibility is set by Loader.js after scripts load
            
            this.isInitialized = true;
            console.log('✅ [AuthApp] Initialization complete');
            
        } catch (error) {
            console.error('❌ [AuthApp] Initialization failed:', error);
            this.showError('Failed to load authentication. Please refresh the page.');
            document.body.style.visibility = 'visible';
        }
    }
    
    // =========================================================================
    // AUTH STATE CHECK
    // =========================================================================
    
    /**
     * Check if user is already authenticated and redirect if so
     */
    async checkExistingAuth() {
        try {
            // Wait for AuthManager to be ready
            if (!window.OsliraAuth.isLoaded) {
                await window.OsliraAuth.initialize();
            }
            
            // Check if user is authenticated
            if (window.OsliraAuth.isAuthenticated()) {
                console.log('✅ [AuthApp] User already authenticated, redirecting...');
                
                // Get appropriate redirect URL
                const needsOnboarding = window.OsliraAuth.user?.user_metadata?.needs_onboarding;
                const redirectUrl = needsOnboarding 
                    ? window.OsliraEnv.getAppUrl('/onboarding')
                    : window.OsliraEnv.getAppUrl('/dashboard');
                
                // Redirect after short delay
                this.showSuccess('Already signed in! Redirecting...');
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            }
            
        } catch (error) {
            // Not authenticated or error checking - that's fine, let user sign in
            console.log('🔐 [AuthApp] User not authenticated, showing sign-in');
        }
    }
    
    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        console.log('🎯 [AuthApp] Setting up event listeners...');
        
        // Google sign-in button
        const googleBtn = document.getElementById('google-signin-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleAuth());
            console.log('✅ [AuthApp] Google button listener attached');
        } else {
            console.warn('⚠️ [AuthApp] Google sign-in button not found');
        }
        
        // Retry button (if error state visible)
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => window.location.reload());
        }
    }
    
    // =========================================================================
    // URL ERROR HANDLING
    // =========================================================================
    
    /**
     * Handle error parameters in URL (from redirects)
     */
    handleUrlErrors() {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (!error) {
            return;
        }
        
        console.log('⚠️ [AuthApp] URL error parameter detected:', error);
        
        const errorMessages = {
            'authentication-failed': 'Authentication failed. Please try again.',
            'callback-failed': 'Login process failed. Please try again.',
            'access-denied': 'Sign-in was cancelled.',
            'session_expired': 'Your session expired. Please sign in again.',
            'invalid_session': 'Invalid session. Please sign in again.'
        };
        
        const message = errorMessages[error] || 'An error occurred. Please try again.';
        
        // Show error after brief delay for smoother UX
        setTimeout(() => this.showError(message), 500);
        
        // Clean up URL (remove error parameter)
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
    
    // =========================================================================
    // GOOGLE OAUTH HANDLER
    // =========================================================================
    
    /**
     * Handle Google sign-in button click
     */
    async handleGoogleAuth() {
        if (this.isLoading) {
            console.log('⚠️ [AuthApp] Already processing sign-in');
            return;
        }
        
        console.log('🔐 [AuthApp] Google sign-in initiated');
        
        try {
            // Verify AuthManager is available
            if (!window.OsliraAuth) {
                throw new Error('Authentication system not available');
            }
            
            // Clear any existing errors
            this.hideError();
            
            // Show loading state
            this.showLoading('Connecting to Google...');
            
            // Initiate Google OAuth flow (will redirect to Google)
            await window.OsliraAuth.signInWithGoogle();
            
            // If we reach here, redirect is happening
            console.log('🔐 [AuthApp] Redirecting to Google OAuth...');
            
        } catch (error) {
            console.error('❌ [AuthApp] Google sign-in failed:', error);
            this.hideLoading();
            
            // Determine error message
            let errorMessage = 'Google sign-in failed. Please try again.';
            
            if (error.message.includes('popup')) {
                errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('not available')) {
                errorMessage = 'Authentication system failed to load. Please refresh the page.';
            }
            
            this.showError(errorMessage);
        }
    }
    
    // =========================================================================
    // UI STATE MANAGEMENT
    // =========================================================================
    
    /**
     * Show loading state
     */
    showLoading(message) {
        this.isLoading = true;
        console.log('⏳ [AuthApp] Showing loading:', message);
        
        const loadingState = document.getElementById('loading-state');
        const loadingMessage = document.getElementById('loading-message');
        
        if (loadingMessage && message) {
            loadingMessage.textContent = message;
        }
        
        if (loadingState) {
            loadingState.classList.remove('hidden');
            loadingState.classList.add('show');
        }
        
        // Disable all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
        });
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        this.isLoading = false;
        console.log('✅ [AuthApp] Hiding loading');
        
        const loadingState = document.getElementById('loading-state');
        
        if (loadingState) {
            loadingState.classList.add('hidden');
            loadingState.classList.remove('show');
        }
        
        // Re-enable all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
        });
    }
    
    /**
     * Show error state
     */
    showError(message) {
        console.error('❌ [AuthApp] Showing error:', message);
        
        const errorState = document.getElementById('error-state');
        const errorMessage = document.getElementById('error-message');
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        if (errorState) {
            errorState.classList.remove('hidden');
            errorState.classList.add('show');
        }
    }
    
    /**
     * Hide error state
     */
    hideError() {
        const errorState = document.getElementById('error-state');
        
        if (errorState) {
            errorState.classList.add('hidden');
            errorState.classList.remove('show');
        }
    }
    
    /**
     * Show success state
     */
    showSuccess(message) {
        console.log('✅ [AuthApp] Showing success:', message);
        
        const successState = document.getElementById('success-state');
        const successMessage = document.getElementById('success-message');
        
        if (successMessage) {
            successMessage.textContent = message;
        }
        
        if (successState) {
            successState.classList.remove('hidden');
            successState.classList.add('show');
        }
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.AuthApp = new AuthApp();
console.log('✅ [AuthApp] Module loaded, waiting for bootstrap');
