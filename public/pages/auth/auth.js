// =============================================================================
// AUTH.JS - Separated Authentication Logic
// =============================================================================

class OsliraAuth {
    constructor() {
        this.currentStep = 'options';
        this.currentEmail = '';
        this.authMode = null;
        this.isLoading = false;
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    async initialize() {
        console.log('🔐 [Auth] Initializing authentication system...');
        
if (window.OsliraAuth) {
    await window.OsliraAuth.initialize();
}
        
        this.setupEventListeners();
        this.showStep('options');
        
        // Handle URL error parameters
        this.handleUrlErrors();
        
        document.body.style.visibility = 'visible';
        console.log('✅ [Auth] Authentication system ready');
    }

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
            
            setTimeout(() => {
                this.showError(errorMessage);
            }, 500);
        }
    }

    // =============================================================================
    // STEP MANAGEMENT
    // =============================================================================

    showStep(stepName) {
        const steps = ['auth-options', 'email-input-step', 'otp-verification-step', 'password-input-step'];
        
        // Hide all steps
        steps.forEach(step => {
            const element = document.getElementById(step);
            if (element) element.style.display = 'none';
        });
        
        this.currentStep = stepName;
        
        switch(stepName) {
            case 'options':
                this.showOptionsStep();
                break;
            case 'email':
                this.showEmailStep();
                break;
            case 'otp-verification':
                this.showOtpStep();
                break;
            case 'password':
                this.showPasswordStep();
                break;
        }
    }

    showOptionsStep() {
        document.getElementById('auth-options').style.display = 'block';
        document.getElementById('auth-title').textContent = 'Start your free trial';
        document.getElementById('auth-subtitle').textContent = 'Get 5 free lead analyses, then upgrade for unlimited access';
    }

    showEmailStep() {
        document.getElementById('email-input-step').style.display = 'block';
        document.getElementById('auth-title').textContent = 'Enter your email';
        document.getElementById('auth-subtitle').textContent = "We'll check if you have an account";
        setTimeout(() => document.getElementById('auth-email').focus(), 100);
    }

    showOtpStep() {
        document.getElementById('otp-verification-step').style.display = 'block';
        document.getElementById('otp-email').textContent = this.currentEmail;
        document.getElementById('auth-title').textContent = 'Verify your email';
        document.getElementById('auth-subtitle').textContent = 'Enter the code we sent you';
        setTimeout(() => document.getElementById('otp-code').focus(), 100);
    }

    showPasswordStep() {
        document.getElementById('password-input-step').style.display = 'block';
        this.updatePasswordStepUI();
        setTimeout(() => document.getElementById('auth-password').focus(), 100);
    }

    updatePasswordStepUI() {
        const userContext = document.getElementById('user-context');
        const submitBtn = document.getElementById('submit-auth');
        
        if (this.authMode === 'signin') {
            document.getElementById('auth-title').textContent = 'Welcome back';
            document.getElementById('auth-subtitle').textContent = '';
            userContext.innerHTML = `<p class="welcome-back">Welcome back, <strong>${this.currentEmail}</strong></p>`;
            submitBtn.textContent = 'Sign in';
            document.getElementById('auth-password').setAttribute('autocomplete', 'current-password');
        } else if (this.authMode === 'set-password') {
            document.getElementById('auth-title').textContent = 'Set your password';  
            document.getElementById('auth-subtitle').textContent = 'Email verified ✓';
            userContext.innerHTML = `<p class="create-account">Set password for <strong>${this.currentEmail}</strong></p>`;
            submitBtn.textContent = 'Set password';
            document.getElementById('auth-password').setAttribute('autocomplete', 'new-password');
        } else {
            document.getElementById('auth-title').textContent = 'Create your account';  
            document.getElementById('auth-subtitle').textContent = '';
            userContext.innerHTML = `<p class="create-account">Create account for <strong>${this.currentEmail}</strong></p>`;
            submitBtn.textContent = 'Create account';
            document.getElementById('auth-password').setAttribute('autocomplete', 'new-password');
        }
    }

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    async handleEmailSubmit(e) {
        e.preventDefault();
        if (this.isLoading) return;
        
        const email = document.getElementById('auth-email').value.trim();
        
        if (!this.validateEmail(email)) {
            this.showFieldError('auth-email', 'Please enter a valid email address');
            return;
        }
        
        try {
            this.hideError();
            this.showLoading('Checking account...');
            this.currentEmail = email;
            
const userCheck = await window.OsliraAuth.checkUserExists(email);

if (userCheck.exists && userCheck.completed) {
    // User completed signup - go to signin
    console.log('✅ [Auth] User exists with completed signup, switching to signin');
    this.authMode = 'signin';
    this.hideLoading(); // Fix: Enable inputs before showing password step
    this.showStep('password');
} else {
    // User doesn't exist in custom table - send OTP (new signup or restart)
    console.log('📧 [Auth] New user or incomplete signup, sending OTP');
    this.authMode = 'signup';
    
    // Clear any existing session before starting new signup
    await window.OsliraAuth.supabase.auth.signOut();
    
    await this.sendEmailVerification(email);
}
            
        } catch (error) {
            console.error('❌ [Auth] Email check failed:', error);
            this.hideLoading();
            this.authMode = 'signup';
            this.showStep('password');
        }
    }

async sendEmailVerification(email) {
    try {
        this.showLoading('Sending verification code...');
        
        // Use the signup method instead of signInWithOtp to force OTP
        const { data, error } = await window.OsliraeAuth.supabase.auth.signUp({
            email: email,
            password: 'temp_password_' + Math.random(), // Temporary password
            options: {
                emailRedirectTo: undefined,
                data: {
                    temp_signup: true // Mark as temporary
                }
            }
        });
        
        if (error) throw error;
        
        console.log('✅ Signup OTP sent successfully:', data);
        this.hideLoading();
        this.showStep('otp-verification');
        
    } catch (error) {
        console.error('❌ [Auth] Email verification failed:', error);
        this.hideLoading();
        
        // Your existing error handling...
        if (error.message?.includes('rate limit') || 
            error.message?.includes('too many') ||
            error.message?.includes('Email rate limit exceeded')) {
            
            const retryMatch = error.message.match(/try again in (\d+)/);
            const retryTime = retryMatch ? retryMatch[1] : '60';
            
            this.showAlert(
                `Email rate limit exceeded. Please try again in ${retryTime} seconds.`, 
                'error'
            );
            return;
        }
        
        this.showAlert(error.message || 'Failed to send verification code. Please try again.', 'error');
    }
}

async handleOtpSubmit(e) {
    e.preventDefault();
    if (this.isLoading) return;
    
    const otpCode = document.getElementById('otp-code').value.trim();
    
    if (!otpCode || otpCode.length !== 6) {
        this.showFieldError('otp-code', 'Please enter a valid 6-digit code');
        return;
    }
    
    try {
        this.hideError();
        this.showLoading('Verifying code...');
        
        const { data, error } = await window.OsliraAuth.supabase.auth.verifyOtp({
            email: this.currentEmail,
            token: otpCode,
            type: 'email'
        });
        
        if (error) throw error;
        
        console.log('✅ OTP verified, user in auth.users:', data);
        window.OsliraAuth.session = data.session;
        
        this.authMode = 'set-password';
        this.showLoading('Email verified! Set your password...');
        
        setTimeout(() => {
            this.hideLoading();
            this.showStep('password');
        }, 1000);
        
    } catch (error) {
        console.error('❌ [Auth] OTP verification failed:', error);
        this.hideLoading();
        this.showFieldError('otp-code', 'Invalid or expired code. Please try again.');
    }
}
async resendOtp() {
    try {
        this.showLoading('Resending code...');
        await this.sendEmailVerification(this.currentEmail);
        
        // Ensure success alert shows after loading is hidden
        setTimeout(() => {
            this.showAlert('Verification code resent! Check your email.', 'success');
        }, 100);
        
    } catch (error) {
        this.hideLoading();
        this.showAlert('Failed to resend code. Please try again.', 'error');
    }
}

    async handlePasswordSubmit(e) {
        e.preventDefault();
        if (this.isLoading) return;
        
        const password = document.getElementById('auth-password').value;
        
        if (!this.validatePassword(password)) {
            this.showFieldError('auth-password', 'Password must be at least 6 characters');
            return;
        }
        
try {
    this.hideError();
    
    if (this.authMode === 'signin') {
        await this.handleSignin(password);
    } else if (this.authMode === 'set-password') {
        await this.handleSetPassword(password);
    } else {
        // This should never happen in OTP flow - all signups go through set-password
        console.error('❌ [Auth] Invalid auth mode:', this.authMode);
        this.showAlert('Authentication flow error. Please refresh and try again.', 'error');
        return;
    }
            
} catch (error) {
    console.error(`❌ [Auth] ${this.authMode} failed:`, error);
    this.hideLoading();
    
    if (this.authMode === 'signin') {
        // Show specific error for authentication failures
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('invalid_grant') ||
            error.message?.includes('Email not confirmed')) {
            this.showAlert('Incorrect email or password. Please try again.', 'error');
        } else {
            this.showAlert('Sign in failed. Please try again.', 'error');
        }
    } else {
        this.showAlert(error.message || 'Authentication failed. Please try again.', 'error');
    }
}
    }

async handleSignin(password) {
    this.showLoading('Signing you in...');
    
    const result = await window.OsliraAuth.signInWithPassword(this.currentEmail, password);
    
    this.showLoading('Welcome back! Redirecting...');
    setTimeout(() => {
        window.location.href = '/dashboard';
    }, 1000);
}
    
async handleSetPassword(password) {
    this.showLoading('Setting your password...');
    
    try {
        // Set password for existing auth user
        const { error } = await window.OsliraAuth.supabase.auth.updateUser({
            password: password
        });
        
        if (error) throw error;
        
// NOW create the user record in custom users table - THIS IS THE ONLY PLACE
const { data: { user } } = await window.OsliraAuth.supabase.auth.getUser();

if (user) {
    console.log('💾 [Auth] Creating user record in custom users table (ONLY after password set)...');
    
    const { error: insertError } = await window.OsliraAuth.supabase
        .from('users')
        .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            created_via: 'email',
            phone_verified: true,  // OTP was verified
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }]);
        
    if (insertError) {
        console.error('❌ [Auth] Failed to create user record:', insertError);
        // If user creation fails, this is a critical error
        throw new Error('Failed to create user account. Please try again.');
    } else {
        console.log('✅ [Auth] User record created in custom table - SIGNUP COMPLETE');
    }
} else {
    throw new Error('User session not found after password set');
}
        
        this.showLoading('Password set! Redirecting to onboarding...');
        setTimeout(() => {
            window.location.href = '/onboarding';
        }, 1000);
        
    } catch (error) {
        console.error('❌ [Auth] Set password failed:', error);
        throw error;
    }
}

async resendOtp() {
    try {
        // Clear any existing OTP
        sessionStorage.removeItem(`otp_${this.currentEmail}`);
        
        this.showLoading('Resending code...');
        await this.sendEmailVerification(this.currentEmail);
    } catch (error) {
        this.hideLoading();
        this.showAlert('Failed to resend code. Please try again.', 'error');
    }
}

async handleSignup(password) {
    // THIS FUNCTION SHOULD NEVER BE CALLED
    // All new signups go through OTP → handleSetPassword flow
    console.error('❌ [Auth] handleSignup() called - this should not happen in OTP flow');
    this.showAlert('Invalid signup flow detected. Please refresh and try again.', 'error');
}

    async handleGoogleAuth() {
        if (this.isLoading) return;
        
        try {
            this.hideError();
            this.showLoading('Connecting to Google...');
            
            await window.OsliraAuth.signInWithGoogle();
            
        } catch (error) {
            console.error('❌ [Auth] Google sign-in failed:', error);
            this.hideLoading();
            this.showAlert('Google sign-in failed. Please try again.', 'error');
        }
    }

showAlert(message, type = 'info') {
    if (window.Alert) {
        if (type === 'error') {
            // Force authentication errors to show as critical
            window.Alert.error(message, { 
                critical: true, 
                context: 'authentication',
                timeout: null 
            });
        } else if (type === 'success') {
            window.Alert.success({ message });
        } else {
            window.Alert.info({ message });
        }
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

    // =============================================================================
    // EVENT LISTENERS
    // =============================================================================

    setupEventListeners() {
        // Navigation
        document.getElementById('email-continue-btn')?.addEventListener('click', () => {
            this.hideError();
            this.showStep('email');
        });
        
        document.getElementById('back-to-options')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideError();
            this.clearFieldErrors();
            this.showStep('options');
        });
        
        document.getElementById('back-to-email')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideError();
            this.clearFieldErrors();
            this.showStep('email');
        });
        
        document.getElementById('back-to-email-otp')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideError();
            this.clearFieldErrors();
            this.showStep('email');
        });
        
        // Form submissions
        document.getElementById('email-form')?.addEventListener('submit', (e) => this.handleEmailSubmit(e));
        document.getElementById('otp-form')?.addEventListener('submit', (e) => this.handleOtpSubmit(e));
        document.getElementById('password-form')?.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        document.getElementById('google-signin-btn')?.addEventListener('click', () => this.handleGoogleAuth());
        
        // OTP actions
        document.getElementById('resend-otp')?.addEventListener('click', () => this.resendOtp());
        
        // Clear errors on input
        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('input', () => {
                input.classList.remove('error');
                const errorEl = document.getElementById(input.id + '-error');
                if (errorEl) {
                    errorEl.style.display = 'none';
                }
            });
        });
    }

    // =============================================================================
    // VALIDATION & UTILITIES
    // =============================================================================

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(fieldId + '-error');
        
        if (field) field.classList.add('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    clearFieldErrors() {
        document.querySelectorAll('.form-input').forEach(field => field.classList.remove('error'));
        document.querySelectorAll('.form-error').forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
    }

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
    
    document.querySelectorAll('.auth-container input, .auth-container button').forEach(el => {
        el.disabled = true;
    });
}

hideLoading() {
    this.isLoading = false;
    const loadingStateEl = document.getElementById('loading-state');
    if (loadingStateEl) {
        loadingStateEl.classList.add('hidden');
        loadingStateEl.classList.remove('show');
    }
    
    document.querySelectorAll('.auth-container input, .auth-container button').forEach(el => {
        el.disabled = false;
    });
}

    showAlert(message, type = 'error') {
        if (window.Alert && window.Alert[type]) {
            window.Alert[type](message);
        } else {
            if (type === 'error') {
                this.showError(message);
            } else {
                this.showSuccess(message);
            }
        }
    }

showError(message) {
    const errorMsgEl = document.getElementById('error-message');
    const errorStateEl = document.getElementById('error-state');
    
    if (errorMsgEl) errorMsgEl.innerHTML = message;
    if (errorStateEl) {
        errorStateEl.classList.remove('hidden');
        errorStateEl.classList.add('show');
    }
}

hideError() {
    const errorEl = document.getElementById('error-state');
    if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.classList.remove('show');
    }
}

    showSuccess(message) {
        const successMsgEl = document.getElementById('success-message');
        const successStateEl = document.getElementById('success-state');
        
        if (successMsgEl) successMsgEl.innerHTML = message;
        if (successStateEl) successStateEl.classList.remove('hidden');
    }

    hideSuccess() {
        const successEl = document.getElementById('success-state');
        if (successEl) successEl.classList.add('hidden');
    }
}

// Initialize auth when scripts are loaded
window.addEventListener('oslira:scripts:loaded', async () => {
    try {
        console.log('🔐 [Auth] Scripts loaded, initializing...');
        window.osliraAuth = new OsliraAuth();
        await window.osliraAuth.initialize();
    } catch (error) {
        console.error('❌ [Auth] Initialization failed:', error);
        document.getElementById('error-message').innerHTML = 'Failed to load authentication system. Please refresh the page.';
        document.getElementById('error-state').classList.remove('hidden');
        document.body.style.visibility = 'visible';
    }
});
