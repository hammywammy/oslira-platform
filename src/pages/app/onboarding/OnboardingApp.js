class OnboardingApp {
    constructor() {
        this.user = { email: 'demo@oslira.com', id: 'demo-123', full_name: 'Demo User' };
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        console.log('✅ [OnboardingApp] DEMO MODE - No auth required');
    }

    async initialize() {
        console.log('🚀 [OnboardingApp] Starting initialization...');
        
        try {
            await this.setupUI();
            this.setupEventListeners();
            this.hideLoader();
            this.showOnboardingForm();
            console.log('✅ [OnboardingApp] Initialization complete');
        } catch (error) {
            console.error('❌ [OnboardingApp] Initialization failed:', error);
            this.showError('Failed to load onboarding');
        }
    }

    async setupUI() {
        console.log('🎨 [OnboardingApp] Setting up UI...');
        
        // Prefill user email if field exists
        const emailInput = document.getElementById('user-email');
        if (emailInput) emailInput.value = this.user.email;
        
        const nameInput = document.getElementById('user-name');
        if (nameInput) nameInput.value = this.user.full_name;
    }

    setupEventListeners() {
        // Next button
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        // Previous button
        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep());
        }

        // Submit button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitOnboarding());
        }

        // Skip button
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipOnboarding());
        }
    }

    showOnboardingForm() {
        this.hideElement('loading-state');
        this.hideElement('error-state');
        this.showElement('onboarding-form');
        this.showStep(1);
        this.updateNavigationButtons();
    }

    showStep(stepNumber) {
        // Hide all steps
        for (let i = 1; i <= this.totalSteps; i++) {
            this.hideElement(`step-${i}`);
        }
        
        // Show current step
        this.showElement(`step-${stepNumber}`);
        this.currentStep = stepNumber;
        
        // Update progress indicator
        this.updateProgress();
    }

    updateProgress() {
        const progress = (this.currentStep / this.totalSteps) * 100;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        const stepIndicator = document.getElementById('step-indicator');
        if (stepIndicator) {
            stepIndicator.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');

        if (prevBtn) prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-block';
        if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-block' : 'none';
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.showStep(this.currentStep + 1);
            this.updateNavigationButtons();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
            this.updateNavigationButtons();
        }
    }

    async submitOnboarding() {
        console.log('✅ [OnboardingApp] DEMO MODE - Skipping to dashboard');
        window.location.href = '/dashboard';
    }

    skipOnboarding() {
        console.log('⏭️ [OnboardingApp] Skipping onboarding');
        window.location.href = '/dashboard';
    }

    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) loader.style.display = 'none';
        document.body.style.visibility = 'visible';
    }

    showError(message) {
        this.hideElement('loading-state');
        this.hideElement('onboarding-form');
        this.showElement('error-state');
        
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) errorMessage.textContent = message;
    }

    showElement(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    }

    hideElement(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.OnboardingApp = new OnboardingApp();
        window.OnboardingApp.initialize();
    });
} else {
    window.OnboardingApp = new OnboardingApp();
    window.OnboardingApp.initialize();
}
