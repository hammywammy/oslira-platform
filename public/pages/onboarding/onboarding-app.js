// =============================================================================
// ONBOARDING APP - Bootstrap System Integration
// Path: /pages/onboarding/onboarding-app.js
// Replaces: /pages/onboarding/onboarding.js
// =============================================================================

class OnboardingApp {
    constructor() {
        this.initialized = false;
        this.user = null;
        this.supabase = null;
        this.currentStep = 1;
        this.rules = null;
        this.validator = null;
        this.totalSteps = 8;
        this.isSubmissionInProgress = false;
        this.progressTracker = this.initializeProgressTracker();
        
        console.log('🎯 [OnboardingApp] Instance created');
    }
    
    // ═══════════════════════════════════════════════════════════
    // MAIN INITIALIZATION (Called by Orchestrator)
    // ═══════════════════════════════════════════════════════════
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [OnboardingApp] Already initialized');
            return;
        }
        
        console.log('🚀 [OnboardingApp] Starting initialization...');
        
        try {
            // Step 1: Initialize validation system
            this.rules = new window.OnboardingRules();
            this.validator = new window.OnboardingValidator();
            this.totalSteps = this.rules.getTotalSteps();
            
            // Step 2: Setup authentication
            await this.setupAuthentication();
            
            // Step 3: Initialize validator
            this.validator.initialize();
            
            // Step 4: Setup UI
            this.showOnboardingForm();
            
            // Step 5: Setup event listeners
            this.setupEventListeners();
            
            // Step 6: Make page visible
            document.body.style.visibility = 'visible';
            
            this.initialized = true;
            console.log('✅ [OnboardingApp] Initialization complete');
            
        } catch (error) {
            console.error('❌ [OnboardingApp] Initialization failed:', error);
            this.showError('Failed to load account setup. Please try refreshing the page.');
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // AUTHENTICATION
    // ═══════════════════════════════════════════════════════════
    
    async setupAuthentication() {
        if (!window.OsliraAuth) {
            throw new Error('OsliraAuth not available');
        }
        
        await window.OsliraAuth.initialize();
        const session = window.OsliraAuth.getCurrentSession();
        
        if (!session || !session.user) {
            console.log('❌ [OnboardingApp] No valid session, redirecting to auth');
            window.location.href = window.OsliraEnv.getAuthUrl();
            return;
        }
        
        this.user = session.user;
        this.supabase = window.OsliraAuth.supabase;
        
        console.log('✅ [OnboardingApp] User authenticated:', this.user.email);
        
        // Verify API client is available
        if (!window.OsliraAPI || typeof window.OsliraAPI.request !== 'function') {
            throw new Error('API client not properly initialized');
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // UI MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    
    showOnboardingForm() {
        this.hideElement('loading-state');
        this.hideElement('error-state');
        this.showElement('onboarding-form');
        
        this.currentStep = 1;
        this.showStep(1);
        this.updateNavigationButtons();
        this.prefillUserData();
        this.prefillSignatureName();
        
        console.log('[OnboardingApp] Onboarding form displayed, starting at step 1');
    }
    
    showError(message) {
        this.hideElement('loading-state');
        this.hideElement('onboarding-form');
        
        const errorMessageEl = document.getElementById('error-message');
        if (errorMessageEl) {
            errorMessageEl.textContent = message;
        }
        
        this.showElement('error-state');
    }
    
    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    }
    
    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
            element.classList.remove('hidden');
        }
    }
    
    updateNavigationButtons() {
        const prevButton = document.getElementById('back-btn');
        const nextButton = document.getElementById('next-btn');
        const submitButton = document.getElementById('finish-btn');
        const skipButton = document.getElementById('skip-btn');
        
        if (prevButton) {
            prevButton.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        }
        
        if (skipButton) {
            skipButton.style.display = 'none'; // No skippable steps
        }
        
        if (this.currentStep === this.totalSteps) {
            if (nextButton) nextButton.style.display = 'none';
            if (submitButton) submitButton.style.display = 'inline-flex';
        } else {
            if (nextButton) nextButton.style.display = 'inline-flex';
            if (submitButton) submitButton.style.display = 'none';
        }
        
        console.log(`[OnboardingApp] Navigation buttons updated for step ${this.currentStep}/${this.totalSteps}`);
    }
    
    updateProgress() {
        const progress = (this.currentStep / this.totalSteps) * 100;
        const progressFill = document.getElementById('progress-fill');
        const progressStep = document.getElementById('progress-step');
        const progressPercent = document.getElementById('progress-percent');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressStep) progressStep.textContent = this.currentStep;
        if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
        
        console.log(`📊 [OnboardingApp] Progress updated: Step ${this.currentStep}/${this.totalSteps} (${Math.round(progress)}%)`);
    }
    
    // ═══════════════════════════════════════════════════════════
    // STEP NAVIGATION
    // ═══════════════════════════════════════════════════════════
    
    showStep(stepNumber) {
        console.log(`[OnboardingApp] Showing step ${stepNumber}`);
        
        // Hide all steps
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.getElementById(`step-${i}`);
            if (step) {
                step.classList.remove('active');
                step.style.display = 'none';
            }
        }
        
        // Show target step
        const targetStep = document.getElementById(`step-${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
            targetStep.style.display = 'block';
            console.log(`[OnboardingApp] Step ${stepNumber} is now visible`);
            
            this.hideElement('error-state');
            this.hideElement('loading-state');
            this.showElement('onboarding-form');
        } else {
            console.error(`[OnboardingApp] Step ${stepNumber} element not found!`);
        }
        
        this.updateProgress();
        this.updateNavigationButtons();
        
        // Focus first input
        setTimeout(() => {
            const firstInput = document.querySelector(`#step-${stepNumber} input, #step-${stepNumber} select, #step-${stepNumber} textarea`);
            if (firstInput) firstInput.focus();
        }, 100);
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.validator.clearAllErrors();
            
            const currentStepElement = document.getElementById(`step-${this.currentStep}`);
            if (currentStepElement) {
                currentStepElement.classList.remove('active');
                currentStepElement.style.display = 'none';
            }
            
            this.currentStep--;
            
            const prevStepElement = document.getElementById(`step-${this.currentStep}`);
            if (prevStepElement) {
                prevStepElement.classList.add('active');
                prevStepElement.style.display = 'block';
                
                const firstInput = prevStepElement.querySelector('input, textarea, select');
                if (firstInput) setTimeout(() => firstInput.focus(), 100);
            }
            
            this.updateProgress();
            this.updateNavigationButtons();
            
            console.log(`[OnboardingApp] Moved back to step ${this.currentStep}`);
        }
    }
    
    nextStep() {
        console.log(`[OnboardingApp] nextStep called, currentStep: ${this.currentStep}, totalSteps: ${this.totalSteps}`);
        
        if (this.currentStep < this.totalSteps) {
            if (!this.validator.validateStep(this.currentStep, this.getFieldValue.bind(this))) {
                console.log(`[OnboardingApp] Step ${this.currentStep} validation failed`);
                this.validator.showStepValidationFailed();
                return;
            }
            
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigationButtons();
        } else {
            this.submitOnboarding();
        }
    }
    
    skipStep() {
        console.log('⏭️ [OnboardingApp] Skipping current step');
        if (this.currentStep < this.totalSteps) {
            this.nextStep();
        } else {
            this.submitOnboarding();
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // DATA COLLECTION
    // ═══════════════════════════════════════════════════════════
    
    getFieldValue(fieldId) {
        console.log(`[OnboardingApp] Getting field value for: ${fieldId}`);
        
        // Special handling for specific fields
        const specialFields = {
            'signature-name': () => document.getElementById('signature-name')?.value.trim() || '',
            'primary-objective': () => document.querySelector('input[name="primary-objective"]:checked')?.value || '',
            'company-size': () => document.querySelector('input[name="company-size"]:checked')?.value || '',
            'communication-tone': () => document.querySelector('input[name="communication-tone"]:checked')?.value || '',
            'team-size': () => document.querySelector('input[name="team-size"]:checked')?.value || '',
            'campaign-manager': () => document.querySelector('input[name="campaign-manager"]:checked')?.value || '',
            'target-size': () => Array.from(document.querySelectorAll('input[name="target-size"]:checked')).map(cb => cb.value),
            'challenges': () => Array.from(document.querySelectorAll('input[name="challenges"]:checked')).map(cb => cb.value),
            'communication': () => Array.from(document.querySelectorAll('input[name="communication"]:checked')).map(cb => cb.value)
        };
        
        // Handle industry field specially
        if (fieldId === 'industry') {
            const select = document.getElementById('industry');
            const value = select ? select.value : '';
            
            if (value === 'other') {
                const otherInput = document.getElementById('industry-other');
                return otherInput ? otherInput.value.trim() : '';
            }
            
            return value;
        }
        
        if (fieldId === 'industry-other') {
            const input = document.getElementById('industry-other');
            return input ? input.value.trim() : '';
        }
        
        // Check special fields
        if (specialFields[fieldId]) {
            const value = specialFields[fieldId]();
            console.log(`[OnboardingApp] ${fieldId} value:`, value);
            return value;
        }
        
        // Default: standard input/textarea/select
        const field = document.getElementById(fieldId);
        const value = field ? field.value.trim() : '';
        console.log(`[OnboardingApp] ${fieldId} value: ${value}`);
        return value;
    }
    
    // ═══════════════════════════════════════════════════════════
    // PREFILLING
    // ═══════════════════════════════════════════════════════════
    
    async prefillSignatureName() {
        try {
            const authSystem = window.OsliraAuth || window.SimpleAuth;
            if (!authSystem?.supabase) return;
            
            const { data: { session } } = await authSystem.supabase.auth.getSession();
            if (!session) return;
            
            const { data: userData, error } = await authSystem.supabase
                .from('users')
                .select('full_name')
                .eq('id', session.user.id)
                .single();
            
            if (error || !userData?.full_name) return;
            
            // Extract first name only
            const firstName = userData.full_name.split(' ')[0].trim();
            
            const signatureInput = document.getElementById('signature-name');
            if (signatureInput && !signatureInput.value) {
                signatureInput.value = firstName;
                
                // Update character counter
                if (this.validator && this.validator.updateCharacterCounter) {
                    this.validator.updateCharacterCounter('signature-name');
                }
                
                console.log('✅ [OnboardingApp] Pre-filled signature name from user profile');
            }
        } catch (error) {
            console.warn('⚠️ [OnboardingApp] Could not prefill signature name:', error);
        }
    }
    
    prefillUserData() {
        console.log('🔧 [OnboardingApp] Pre-filling user data from Google OAuth...');
        
        if (!this.user || !this.user.user_metadata) {
            console.log('⚠️ [OnboardingApp] No user metadata available for pre-filling');
            return;
        }
        
        const businessNameField = document.getElementById('company-name');
        if (businessNameField && !businessNameField.value) {
            const fullName = this.user.user_metadata.full_name || this.user.user_metadata.name || '';
            if (fullName) {
                businessNameField.placeholder = `e.g. "${fullName} Consulting" or "${fullName.split(' ')[0]} Agency"`;
            }
        }
        
        console.log('✅ [OnboardingApp] User data pre-filling complete');
    }
    
    // ═══════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════
    
    setupEventListeners() {
        console.log('🔗 [OnboardingApp] Setting up event listeners...');
        
        // Bind methods to window for onclick handlers in HTML
        window.nextStep = this.nextStep.bind(this);
        window.prevStep = this.prevStep.bind(this);
        window.submitOnboarding = this.submitOnboarding.bind(this);
        window.skipStep = this.skipStep.bind(this);
        
        console.log('✅ [OnboardingApp] Event listeners setup complete');
    }
    
    // ═══════════════════════════════════════════════════════════
    // PROGRESS TRACKING SYSTEM
    // ═══════════════════════════════════════════════════════════
    
    initializeProgressTracker() {
        return {
            startTime: null,
            currentProgress: 0,
            targetProgress: 0,
            estimatedDuration: 25000,
            actualElapsed: 0,
            smoothingInterval: null,
            currentStep: 0,
            steps: [
                { name: 'Validating form data', weight: 5 },
                { name: 'Creating business profile', weight: 15 },
                { name: 'Generating AI insights', weight: 60 },
                { name: 'Finalizing setup', weight: 20 }
            ]
        };
    }
    
    showSubmissionProgress() {
        const onboardingForm = document.getElementById('onboarding-form');
        if (onboardingForm) onboardingForm.style.display = 'none';
        
        this.progressTracker.startTime = Date.now();
        this.progressTracker.currentProgress = 0;
        this.progressTracker.targetProgress = 0;
        this.progressTracker.actualElapsed = 0;
        this.progressTracker.currentStep = 0;
        
        const progressOverlay = document.createElement('div');
        progressOverlay.id = 'submission-progress-overlay';
        progressOverlay.className = 'fixed inset-0 flex items-center justify-center z-50';
        progressOverlay.style.backdropFilter = 'blur(10px)';
        progressOverlay.style.webkitBackdropFilter = 'blur(10px)';
        progressOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        
        progressOverlay.innerHTML = `
            <div class="max-w-lg mx-auto text-center p-8 bg-white rounded-2xl shadow-2xl border">
                <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-brain text-white text-2xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Generating Business Intelligence</h2>
                <p id="progress-step-text" class="text-gray-600 mb-6">Validating form data...</p>
                <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div id="progress-bar-fill" class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span id="progress-percentage" class="font-semibold text-gray-700">0%</span>
                    <span id="progress-time" class="text-gray-500">~25s remaining</span>
                </div>
                <div class="mt-4 text-xs text-gray-400">
                    <div class="flex items-center justify-center space-x-2">
                        <div class="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
                        <span>Processing your business data</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(progressOverlay);
        this.startSmoothProgressAnimation();
        window.submissionProgressOverlay = progressOverlay;
    }
    
    startSmoothProgressAnimation() {
        if (this.progressTracker.smoothingInterval) {
            clearInterval(this.progressTracker.smoothingInterval);
        }
        
        this.progressTracker.smoothingInterval = setInterval(() => {
            this.updateSmoothProgress();
        }, 50);
    }
    
    updateSmoothProgress() {
        const now = Date.now();
        this.progressTracker.actualElapsed = now - this.progressTracker.startTime;
        
        if (this.progressTracker.targetProgress === 0) {
            const timeBasedProgress = Math.min((this.progressTracker.actualElapsed / this.progressTracker.estimatedDuration) * 100, 95);
            this.progressTracker.targetProgress = timeBasedProgress;
        }
        
        const progressDiff = this.progressTracker.targetProgress - this.progressTracker.currentProgress;
        const smoothingFactor = 0.1;
        this.progressTracker.currentProgress += progressDiff * smoothingFactor;
        
        if (this.progressTracker.currentProgress > this.progressTracker.targetProgress) {
            this.progressTracker.currentProgress = this.progressTracker.targetProgress;
        }
        
        this.updateProgressDisplay();
    }
    
    updateProgressDisplay() {
        const progressPercentageEl = document.getElementById('progress-percentage');
        const progressTimeEl = document.getElementById('progress-time');
        const progressBarFill = document.getElementById('progress-bar-fill');
        
        if (!progressPercentageEl || !progressTimeEl || !progressBarFill) return;
        
        const displayProgress = Math.floor(this.progressTracker.currentProgress);
        
        progressBarFill.style.width = `${this.progressTracker.currentProgress}%`;
        progressPercentageEl.textContent = `${displayProgress}%`;
        
        let remainingTime;
        
        if (this.progressTracker.currentProgress > 5) {
            const progressRate = this.progressTracker.currentProgress / this.progressTracker.actualElapsed;
            const estimatedTotal = 100 / progressRate;
            remainingTime = Math.max(0, (estimatedTotal - this.progressTracker.actualElapsed) / 1000);
        } else {
            remainingTime = (this.progressTracker.estimatedDuration - this.progressTracker.actualElapsed) / 1000;
        }
        
        if (remainingTime > 60) {
            progressTimeEl.textContent = `~${Math.ceil(remainingTime / 60)}m remaining`;
        } else if (remainingTime > 0) {
            progressTimeEl.textContent = `~${Math.ceil(remainingTime)}s remaining`;
        } else {
            progressTimeEl.textContent = 'Almost done...';
        }
    }
    
    setProgressStep(stepIndex, stepProgress = 0) {
        if (stepIndex >= this.progressTracker.steps.length) return;
        
        let targetProgress = 0;
        
        for (let i = 0; i < stepIndex; i++) {
            targetProgress += this.progressTracker.steps[i].weight;
        }
        
        targetProgress += (this.progressTracker.steps[stepIndex].weight * stepProgress);
        
        this.progressTracker.targetProgress = Math.min(targetProgress, 100);
        this.progressTracker.currentStep = stepIndex;
        
        const stepTextEl = document.getElementById('progress-step-text');
        if (stepTextEl) {
            stepTextEl.textContent = this.progressTracker.steps[stepIndex].name;
        }
        
        console.log(`📊 Progress Target: ${Math.floor(this.progressTracker.targetProgress)}% - ${this.progressTracker.steps[stepIndex].name}`);
    }
    
    updateSubmissionMessage(message) {
        const stepTextEl = document.getElementById('progress-step-text');
        if (stepTextEl) stepTextEl.textContent = message;
    }
    
    cleanupProgressTracking() {
        if (this.progressTracker.smoothingInterval) {
            clearInterval(this.progressTracker.smoothingInterval);
            this.progressTracker.smoothingInterval = null;
        }
        
        this.progressTracker = this.initializeProgressTracker();
    }
    
    hideSubmissionProgress() {
        this.cleanupProgressTracking();
        
        const overlay = window.submissionProgressOverlay || document.getElementById('submission-progress-overlay');
        if (overlay) overlay.remove();
        
        const onboardingForm = document.getElementById('onboarding-form');
        if (onboardingForm) onboardingForm.style.display = 'block';
    }
    
    // ═══════════════════════════════════════════════════════════
    // ONBOARDING SUBMISSION
    // ═══════════════════════════════════════════════════════════
    
    async submitOnboarding() {
        if (this.isSubmissionInProgress) {
            console.warn('🚨 [OnboardingApp] Duplicate submission blocked');
            return;
        }
        
        this.isSubmissionInProgress = true;
        console.log('📤 [OnboardingApp] Starting submission process');
        
        try {
            this.showSubmissionProgress();
            this.setProgressStep(0, 0.2);
            
            const authSystem = window.OsliraAuth || window.SimpleAuth;
            
            if (!window.OsliraAuth?.supabase) {
                throw new Error('Authentication system not available');
            }
            
            this.setProgressStep(0, 0.6);
            
            const { data: sessionData, error: sessionError } = await authSystem.supabase.auth.getSession();
            if (sessionError || !sessionData?.session) {
                console.error('❌ [OnboardingApp] No valid session:', sessionError);
                throw new Error('Authentication expired. Please refresh the page and log in again.');
            }
            
            const session = sessionData.session;
            const user = session.user;
            
            console.log('✅ [OnboardingApp] Session verified:', {
                userId: user.id,
                email: user.email,
                hasToken: !!session.access_token
            });
            
            this.setProgressStep(1, 0.1);
            
            // Save signature name to users table
            const signatureName = this.getFieldValue('signature-name');
            const { error: nameUpdateError } = await authSystem.supabase
                .from('users')
                .update({ signature_name: signatureName })
                .eq('id', user.id);
            
            if (nameUpdateError) {
                console.error('❌ [OnboardingApp] Failed to save signature name:', nameUpdateError);
            }
            
            // Collect form data
            const formData = {
                business_name: this.getFieldValue('company-name'),
                business_niche: this.getFieldValue('industry'),
                target_audience: this.getFieldValue('target-description'),
                company_size: this.getFieldValue('company-size'),
                website: this.getFieldValue('website'),
                monthly_lead_goal: this.getFieldValue('monthly-lead-goal') ? 
                    parseInt(this.getFieldValue('monthly-lead-goal')) : null,
                primary_objective: this.getFieldValue('primary-objective'),
                communication_style: this.getFieldValue('communication-tone') || null,
                team_size: this.getFieldValue('team-size'),
                campaign_manager: this.getFieldValue('campaign-manager'),
                challenges: Array.isArray(this.getFieldValue('challenges')) ? 
                    this.getFieldValue('challenges') : [],
                target_company_sizes: Array.isArray(this.getFieldValue('target-size')) ? 
                    this.getFieldValue('target-size') : [],
                target_problems: Array.isArray(this.getFieldValue('challenges')) && this.getFieldValue('challenges').length > 0 ? 
                    'Main challenges: ' + this.getFieldValue('challenges').join(', ') : null,
                value_proposition: 'Value proposition to be refined during campaign setup',
                message_example: this.getFieldValue('communication-tone') ? 
                    `Sample message using ${this.getFieldValue('communication-tone')} communication style - to be generated by AI` : null,
                success_outcome: this.getFieldValue('monthly-lead-goal') ? 
                    `Target: ${this.getFieldValue('monthly-lead-goal')} qualified leads per month` : null,
                call_to_action: 'Call-to-action strategy to be developed during campaign creation',
                user_id: user.id
            };
            
            this.setProgressStep(1, 0.5);
            console.log('📝 [OnboardingApp] Creating profile and generating business context...');
            
            let workerUrl;
            if (window.OsliraEnv?.WORKER_URL) {
                workerUrl = window.OsliraEnv.WORKER_URL;
            } else if (window.OsliraConfig?.getWorkerUrl) {
                workerUrl = await window.OsliraConfig.getWorkerUrl();
            } else {
                workerUrl = 'https://api-staging.oslira.com';
            }
            
            console.log('🔧 [OnboardingApp] Using API URL:', workerUrl);
            
            this.setProgressStep(1, 0.8);
            
            console.log('📤 [OnboardingApp] Creating business profile...');
            
            const profileResponse = await fetch(`${workerUrl}/business-profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': window.OsliraEnv.SUPABASE_ANON_KEY
                },
                body: JSON.stringify(formData)
            });
            
            if (!profileResponse.ok) {
                const errorText = await profileResponse.text();
                console.error('❌ [OnboardingApp] Profile creation failed:', {
                    status: profileResponse.status,
                    statusText: profileResponse.statusText,
                    body: errorText
                });
                throw new Error(`Failed to create business profile: ${profileResponse.status} - ${errorText}`);
            }
            
            const profileResult = await profileResponse.json();
            
            if (!profileResult || !profileResult.success) {
                throw new Error(profileResult?.error || 'Failed to create business profile');
            }
            
            const profileId = profileResult.data.id;
            const userId = profileResult.data.user_id;
            console.log('✅ [OnboardingApp] Profile created:', profileId);
            
            this.setProgressStep(2, 0.1);
            
            this.updateSubmissionMessage('Generating AI business insights...');
            console.log('🤖 [OnboardingApp] Generating business context...');
            
            try {
                this.setProgressStep(2, 0.3);
                
                const contextResponse = await fetch(`${workerUrl}/v1/generate-business-context`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': window.OsliraEnv.SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({
                        business_data: formData,
                        user_id: userId,
                        request_type: 'onboarding'
                    })
                });
                
                this.setProgressStep(2, 0.7);
                
                if (contextResponse.ok) {
                    const contextResult = await contextResponse.json();
                    
                    if (contextResult && contextResult.success) {
                        console.log('✅ [OnboardingApp] Business context generated successfully');
                        
                        this.setProgressStep(2, 0.9);
                        
                        this.updateSubmissionMessage('Finalizing your profile...');
                        console.log('📝 [OnboardingApp] Updating profile with AI context...');
                        
                        this.setProgressStep(3, 0.2);
                        
                        const updateResponse = await fetch(`${workerUrl}/business-profiles/${profileId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`,
                                'apikey': window.OsliraEnv.SUPABASE_ANON_KEY
                            },
                            body: JSON.stringify({
                                business_one_liner: contextResult.data.business_one_liner,
                                business_context_pack: contextResult.data.business_context_pack,
                                context_version: contextResult.data.context_version
                            })
                        });
                        
                        this.setProgressStep(3, 0.5);
                        
                        if (updateResponse.ok) {
                            const updateResult = await updateResponse.json();
                            if (updateResult && updateResult.success) {
                                console.log('✅ [OnboardingApp] Profile updated with business context');
                            } else {
                                console.warn('⚠️ [OnboardingApp] Failed to update profile with context, continuing anyway');
                            }
                        } else {
                            console.warn('⚠️ [OnboardingApp] Context update request failed, continuing anyway');
                        }
                    } else {
                        console.warn('⚠️ [OnboardingApp] Context generation unsuccessful, continuing without it');
                        this.setProgressStep(2, 1.0);
                    }
                } else {
                    console.warn('⚠️ [OnboardingApp] Context generation request failed, continuing without it');
                    this.setProgressStep(2, 1.0);
                }
            } catch (contextError) {
                console.warn('⚠️ [OnboardingApp] Context generation failed, continuing without it:', contextError);
                this.setProgressStep(2, 1.0);
            }
            
            this.setProgressStep(3, 0.7);
            this.updateSubmissionMessage('Completing setup...');
            
            // Mark onboarding as complete
            const { error: updateUserError } = await authSystem.supabase
                .from('users')
                .update({ onboarding_completed: true })
                .eq('id', user.id);
            
            if (updateUserError) {
                console.warn('⚠️ [OnboardingApp] Failed to update user status:', updateUserError);
            }
            
            // Create subscription record with free plan defaults
            console.log('💳 [OnboardingApp] Creating subscription record...');
            const { error: subscriptionError } = await authSystem.supabase
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    plan_type: 'free',
                    credits_remaining: 25,
                    status: 'active'
                });
            
            if (subscriptionError) {
                console.error('❌ [OnboardingApp] Failed to create subscription:', subscriptionError);
                throw new Error('Failed to initialize subscription. Please contact support.');
            }
            
            console.log('✅ [OnboardingApp] Subscription record created');
            
            this.setProgressStep(3, 1.0);
            this.updateSubmissionMessage('Setup complete! Redirecting...');
            
            console.log('✅ [OnboardingApp] Onboarding complete, redirecting...');
            
            setTimeout(() => {
                window.location.href = window.OsliraEnv.getAppUrl('/dashboard');
            }, 1000);
            
        } catch (error) {
            this.isSubmissionInProgress = false;
            
            console.error('❌ [OnboardingApp] Submission failed:', error);
            
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            if (error.message.includes('Invalid signature')) {
                errorMessage = 'Authentication expired. Please refresh the page and try again.';
            } else if (error.message.includes('Authentication expired')) {
                errorMessage = 'Your session has expired. Please log in again.';
            } else if (error.message.includes('Failed to create business profile')) {
                errorMessage = 'Server error occurred while creating your profile. Please try again.';
            }
            
            this.cleanupProgressTracking();
            this.hideSubmissionProgress();
            
            if (this.validator && this.validator.showSubmissionError) {
                this.validator.showSubmissionError(errorMessage);
            } else {
                alert(errorMessage);
            }
            
            if (error.message.includes('Authentication') || error.message.includes('Invalid signature')) {
                setTimeout(() => {
                    window.location.href = window.OsliraEnv.getAuthUrl();
                }, 3000);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL EXPORT (CRITICAL - Orchestrator needs this)
// ═══════════════════════════════════════════════════════════
window.OnboardingApp = OnboardingApp;
console.log('✅ [OnboardingApp] Module loaded and ready');
