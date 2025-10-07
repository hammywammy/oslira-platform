// =============================================================================
// AUTH APP - Bootstrap System Integration
// Path: /pages/auth/auth-app.js
// Replaces: /pages/auth/auth.js
// =============================================================================

/**
 * AUTH APP - Google OAuth Authentication
 * 
 * Responsibilities:
 * - Handle Google OAuth sign-in
 * - Display loading/error/success states
 * - Handle URL error parameters
 * - Setup legal footer links
 * 
 * Does NOT:
 * - Wait for dependencies (orchestrator handles this)
 * - Manually load scripts
 * - Use setTimeout fallbacks
 */

class AuthApp {
    constructor() {
        this.initialized = false;
        this.isLoading = false;
        
        console.log('🔐 [AuthApp] Instance created');
    }
    
    // ═══════════════════════════════════════════════════════════
    // MAIN INITIALIZATION (Called by Orchestrator)
    // ═══════════════════════════════════════════════════════════
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [AuthApp] Already initialized');
            return;
        }
        
        console.log('🔐 [AuthApp] Starting initialization...');
        
        try {
            // Step 1: Setup legal footer links
            this.setupLegalLinks();
            
            // Step 2: Setup event listeners
            this.setupEventListeners();
            
            // Step 3: Handle URL error parameters
            this.handleUrlErrors();
            
            // Step 4: Show page content
            document.body.style.visibility = 'visible';
            
            this.initialized = true;
            console.log('✅ [AuthApp] Initialization complete');
            
        } catch (error) {
            console.error('❌ [AuthApp] Initialization failed:', error);
            this.showError('Failed to load authentication system. Please refresh.');
            document.body.style.visibility = 'visible';
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // LEGAL LINKS SETUP
    // ═══════════════════════════════════════════════════════════
    
    setupLegalLinks() {
        console.log('🔗 [AuthApp] Setting up legal links...');
        
        if (!window.OsliraEnv) {
            console.warn('⚠️ [AuthApp] OsliraEnv not available, skipping legal links');
            return;
        }
        
        document.querySelectorAll('[data-legal-link]').forEach(link => {
            const type = link.getAttribute('data-legal-link');
            let targetUrl;
            
            switch (type) {
                case 'terms':
                    targetUrl = window.OsliraEnv.getLegalUrl('terms');
                    break;
                case 'privacy':
                    targetUrl = window.OsliraEnv.getLegalUrl('privacy');
                    break;
                case 'contact':
                    targetUrl = window.OsliraEnv.getContactUrl('');
                    break;
            }
            
            if (targetUrl) {
                link.href = targetUrl;
                console.log(`✅ [AuthApp] Set ${type} link to: ${targetUrl}`);
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════
    
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
        
        // Retry button (if visible)
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => window.location.reload());
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // URL ERROR HANDLING
    // ═══════════════════════════════════════════════════════════
    
    handleUrlErrors() {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (!error) {
            return;
        }
        
        console.log('⚠️ [AuthApp] URL error parameter detected:', error);
        
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
            case 'session_expired':
                errorMessage = 'Your session expired. Please sign in again.';
                break;
            default:
                errorMessage = 'An error occurred. Please try again.';
        }
        
        // Show error after a brief delay for smoother UX
        setTimeout(() => this.showError(errorMessage), 500);
    }
    
    // ═══════════════════════════════════════════════════════════
    // GOOGLE OAUTH HANDLER
    // ═══════════════════════════════════════════════════════════
    
    async handleGoogleAuth() {
        if (this.isLoading) {
            console.log('⚠️ [AuthApp] Already processing sign-in');
            return;
        }
        
        console.log('🔐 [AuthApp] Google sign-in initiated');
        
        try {
            // Check if OsliraAuth is available
            if (!window.OsliraAuth) {
                throw new Error('Authentication system not available');
            }
            
            // Clear any existing errors
            this.hideError();
            
            // Show loading state
            this.showLoading('Connecting to Google...');
            
            // Initiate Google OAuth flow
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
    
    // ═══════════════════════════════════════════════════════════
    // UI STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    
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
    
    hideError() {
        const errorState = document.getElementById('error-state');
        
        if (errorState) {
            errorState.classList.add('hidden');
            errorState.classList.remove('show');
        }
    }
    
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

// ═══════════════════════════════════════════════════════════
// GLOBAL EXPORT
// ═══════════════════════════════════════════════════════════
window.AuthApp = AuthApp;
console.log('✅ [AuthApp] Module loaded and ready');
