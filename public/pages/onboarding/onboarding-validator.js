// =============================================================================
// ONBOARDING VALIDATION ENGINE
// =============================================================================

class OnboardingValidator {
    constructor() {
        this.rules = new window.OnboardingRules();
        this.errors = new Map();
        this.characterCounters = new Map();
        this.initialized = false;
    }
    
    // =============================================================================
    // INITIALIZATION & STYLING
    // =============================================================================
    
    initialize() {
        if (this.initialized) return;
        
        this.addCharacterLimitStyles();
        this.setupCharacterLimits();
        this.setupPasteProtection();
        this.setupRealTimeValidation();
        
        this.initialized = true;
        console.log('✅ [OnboardingValidator] Initialized successfully');
    }
    
    addCharacterLimitStyles() {
        const styles = `
            <style>
            /* Character Counter Styles */
            .character-counter {
                font-size: 0.875rem;
                color: var(--text-secondary, #6b7280);
                text-align: right;
                margin-top: 0.25rem;
                font-family: monospace;
            }
            
            .character-counter.warning {
                color: var(--color-orange-600, #ea580c);
                font-weight: 500;
            }
            
            .character-counter.limit-reached {
                color: var(--color-red-600, #dc2626);
                font-weight: 600;
            }
            
            .character-counter .current {
                font-weight: 600;
            }
            
            /* Field Warning States */
            .form-input.warning,
            .form-textarea.warning,
            .form-select.warning {
                border-color: var(--color-orange-500, #f97316) !important;
            }
            
            .form-input.error,
            .form-textarea.error,
            .form-select.error {
                border-color: var(--color-red-500, #ef4444) !important;
                animation: highlightPulse 2s ease-in-out;
            }
            
            /* Error Message Styles */
            .field-error {
                color: var(--color-red-600, #dc2626);
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .field-error i {
                font-size: 1rem;
            }
            
            /* Validation Notification */
            .validation-notification {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 12px;
                padding: 1rem;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: var(--color-red-700, #b91c1c);
                font-weight: 500;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
            }
            
            .validation-notification i {
                color: var(--color-red-600, #dc2626);
                font-size: 1.25rem;
            }
            
            .onboarding-form-group.has-error .onboarding-form-input,
            .onboarding-form-group.has-error .onboarding-form-textarea,
            .onboarding-form-group.has-error .onboarding-form-select {
                border-color: var(--color-red-500, #ef4444) !important;
            }
            
            @keyframes highlightPulse {
                0%, 100% { border-color: var(--color-red-500, #ef4444); }
                50% { border-color: var(--color-red-300, #fca5a5); }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // =============================================================================
    // CHARACTER LIMIT MANAGEMENT
    // =============================================================================
    
    setupCharacterLimits() {
        Object.keys(this.rules.CHARACTER_LIMITS).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const limits = this.rules.CHARACTER_LIMITS[fieldId];
            
            if (!field) return;
            
            // Add maxlength attribute
            field.setAttribute('maxlength', limits.max);
            
            // Add character counter
            this.addCharacterCounter(fieldId, limits.max);
            
            // Initialize counter
            this.updateCharacterCounter(fieldId);
        });
    }
    
    addCharacterCounter(fieldId, maxLength) {
        const field = document.getElementById(fieldId);
        const fieldContainer = field.closest('.form-group') || field.closest('.onboarding-form-group');
        
        if (!fieldContainer) return;
        
        // Create character counter element
        const counter = document.createElement('div');
        counter.id = `${fieldId}-counter`;
        counter.className = 'character-counter';
        counter.innerHTML = `<span class="current">0</span>/<span class="max">${maxLength}</span>`;
        
        // Insert after the field
        field.parentNode.insertBefore(counter, field.nextSibling);
        
        // Store reference
        this.characterCounters.set(fieldId, counter);
    }
    
    updateCharacterCounter(fieldId) {
        const field = document.getElementById(fieldId);
        const counter = this.characterCounters.get(fieldId) || document.getElementById(`${fieldId}-counter`);
        const limits = this.rules.getCharacterLimits(fieldId);
        
        if (!field || !counter || !limits) return;
        
        const currentLength = field.value.length;
        const currentSpan = counter.querySelector('.current');
        
        if (currentSpan) {
            currentSpan.textContent = currentLength;
            
            // Apply status classes
            const status = this.rules.getCharacterUsageStatus(fieldId, field.value);
            counter.classList.remove('warning', 'limit-reached');
            
            if (status === 'warning') {
                counter.classList.add('warning');
            } else if (status === 'limit-reached') {
                counter.classList.add('limit-reached');
            }
        }
    }
    
    // =============================================================================
    // PASTE PROTECTION
    // =============================================================================
    
    setupPasteProtection() {
        Object.keys(this.rules.CHARACTER_LIMITS).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const limits = this.rules.CHARACTER_LIMITS[fieldId];
            
            if (!field) return;
            
            field.addEventListener('paste', (e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const currentText = field.value;
                const maxAllowed = limits.max - currentText.length;
                
                if (pastedText.length > maxAllowed) {
                    e.preventDefault();
                    
                    // Insert truncated version
                    const truncatedText = pastedText.substring(0, maxAllowed);
                    const cursorPos = field.selectionStart;
                    
                    field.value = currentText.substring(0, cursorPos) + 
                                 truncatedText + 
                                 currentText.substring(field.selectionEnd);
                    
                    // Update cursor position
                    const newCursorPos = cursorPos + truncatedText.length;
                    field.setSelectionRange(newCursorPos, newCursorPos);
                    
                    // Update character counter
                    this.updateCharacterCounter(fieldId);
                    
                    // Show truncation warning
                    this.showTruncationWarning(fieldId, pastedText.length - truncatedText.length);
                }
            });
        });
    }
    
    showTruncationWarning(fieldId, truncatedChars) {
        // Remove existing warning
        const existingWarning = document.getElementById(`${fieldId}-truncation-warning`);
        if (existingWarning) {
            existingWarning.remove();
        }
        
        // Create new warning
        const warning = document.createElement('div');
        warning.id = `${fieldId}-truncation-warning`;
        warning.className = 'field-error';
        warning.innerHTML = `<i class="fas fa-scissors"></i> Text was truncated by ${truncatedChars} characters to fit the limit.`;
        
        // Insert after field
        const field = document.getElementById(fieldId);
        field.parentNode.insertBefore(warning, field.nextSibling);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            warning.remove();
        }, 3000);
    }
    
    // =============================================================================
    // REAL-TIME VALIDATION
    // =============================================================================
    
setupRealTimeValidation() {
        // Add input event listeners for real-time feedback
        const fields = document.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            // Character counter updates
            if (this.rules.getCharacterLimits(field.id)) {
                field.addEventListener('input', () => {
                    this.updateCharacterCounter(field.id);
                });
            }
            
            // Real-time validation on blur
            field.addEventListener('blur', () => {
                if (field.value.trim().length > 0) {
                    this.validateField(field.id);
                }
            });
            
            // Special handling for company-name - validate on input
            if (field.id === 'company-name') {
                field.addEventListener('input', () => {
                    this.validateField(field.id);
                });
            }
        });
    }
    
    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return true;
        
        const value = field.value.trim();
        const rules = this.rules.getValidationRules(fieldId);
        
        // Clear previous errors
        this.clearFieldError(fieldId);
        
        // Skip validation if field is empty and not required
        if (!rules || (!rules.required && value.length === 0)) {
            return true;
        }
        
        // Character limit validation
        const charLimitResult = this.validateCharacterLimit(fieldId, value);
        if (!charLimitResult.valid && !charLimitResult.warning) {
            this.showFieldError(fieldId, charLimitResult.message);
            return false;
        }
        
        // Business logic validation
        const businessValidation = this.validateBusinessLogic(fieldId, value);
        if (!businessValidation.valid) {
            this.showFieldError(fieldId, businessValidation.message);
            return false;
        }
        
        return true;
    }
    
    // =============================================================================
    // STEP VALIDATION
    // =============================================================================
    
    validateStep(stepNumber, getFieldValueFn) {
        console.log(`🔍 [OnboardingValidator] Validating step ${stepNumber}`);
        
        const fieldsForStep = this.rules.getFieldsForStep(stepNumber);
        if (!fieldsForStep || fieldsForStep.length === 0) return true;
        
        let isValid = true;
        this.clearAllErrors(); // Clear previous errors
        
        for (const fieldId of fieldsForStep) {
            const rules = this.rules.getValidationRules(fieldId);
            if (!rules) continue;
            
            const value = getFieldValueFn(fieldId);
            
            // Required field validation
// Required field validation
const trimmedValue = Array.isArray(value) ? (value.length === 0 ? '' : value.join(',')) : (value || '').trim();
if (rules.required && (!value || trimmedValue.length === 0)) {
    this.showFieldError(fieldId, 'This field is required');
                isValid = false;
                continue;
            }
            
// Skip further validation if field is empty and not required
const processedValue = Array.isArray(value) ? (value.length === 0 ? '' : value.join(',')) : (value || '');
if (!processedValue || processedValue.trim().length === 0) continue;
            
            // Character limit validation
            const charLimitResult = this.validateCharacterLimit(fieldId, value);
            if (!charLimitResult.valid && !charLimitResult.warning) {
                isValid = false;
                continue;
            }
            
            // Minimum length validation
            if (rules.minLength && value.length < rules.minLength) {
                this.showFieldError(fieldId, `Minimum ${rules.minLength} characters required`);
                isValid = false;
                continue;
            }
            
            // Field-specific business validation
            const businessValidation = this.validateBusinessLogic(fieldId, value);
            if (!businessValidation.valid) {
                this.showFieldError(fieldId, businessValidation.message);
                isValid = false;
            }
        }
        
        return isValid;
    }

    showStepValidationFailed() {
    console.log('[OnboardingValidator] Showing step validation failed message');
    
    // Show the validation error div
    const errorDiv = document.getElementById('validation-error');
    if (errorDiv) {
        errorDiv.classList.remove('hidden');
        errorDiv.style.display = 'block';
        
        // Hide after 4 seconds
        setTimeout(() => {
            errorDiv.classList.add('hidden');
            errorDiv.style.display = 'none';
        }, 4000);
    }
    
    // Scroll to first error field
    const firstErrorField = document.querySelector('.onboarding-field-error');
    if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
    }
}
    
    validateCharacterLimit(fieldId, value = null) {
        const field = document.getElementById(fieldId);
        const fieldValue = value || (field ? field.value : '');
        
        return this.rules.validateCharacterLimit(fieldId, fieldValue);
    }
    
validateBusinessLogic(fieldId, value) {
        switch (fieldId) {
            case 'company-name':
                return this.rules.validateBusinessName(value);
                
            case 'success-outcome':
                return this.rules.validateSuccessOutcome(value);
                
            case 'communication-style':
            case 'communication-tone':
                return this.rules.validateCommunicationStyle(value);
                
            case 'phone-number':
                return this.rules.validatePhoneNumber(value);
                
            default:
                return { valid: true, message: '' };
        }
    }
    
    // =============================================================================
    // FORM DATA VALIDATION
    // =============================================================================
    
    validateAllFields(formData) {
        const errors = this.rules.validateRequiredFields(formData);
        
        // Additional business logic validation
        for (const [key, value] of Object.entries(formData)) {
            const fieldId = key.replace('_', '-');
            const businessValidation = this.validateBusinessLogic(fieldId, value);
            
            if (!businessValidation.valid) {
                errors.push(`${key}: ${businessValidation.message}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // =============================================================================
    // ERROR MANAGEMENT
    // =============================================================================
    
    showFieldError(fieldId, message) {
        // Store error
        this.errors.set(fieldId, message);
        
        // Get field and container
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const fieldContainer = field.closest('.onboarding-form-group') || field.closest('.form-group');
        
        // Add error styling
        field.classList.add('error');
        if (fieldContainer) {
            fieldContainer.classList.add('has-error');
        }
        
        // Remove existing error message
        const existingError = document.getElementById(`${fieldId}-error`);
        if (existingError) {
            existingError.remove();
        }
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.id = `${fieldId}-error`;
        errorElement.className = 'field-error';
        errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        // Insert error message after field (or after counter if exists)
        const counter = document.getElementById(`${fieldId}-counter`);
        const insertAfter = counter || field;
        insertAfter.parentNode.insertBefore(errorElement, insertAfter.nextSibling);
    }
    
    clearFieldError(fieldId) {
        // Remove stored error
        this.errors.delete(fieldId);
        
        // Remove error styling
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('error', 'warning');
            
            // Remove error message
            const errorElement = document.getElementById(`${fieldId}-error`);
            if (errorElement) {
                errorElement.remove();
            }
            
            // Remove container error styling
            const fieldContainer = field.closest('.onboarding-form-group') || field.closest('.form-group');
            if (fieldContainer) {
                fieldContainer.classList.remove('has-error');
            }
        }
    }
    
    clearAllErrors() {
        // Clear all stored errors
        for (const [fieldId] of this.errors) {
            this.clearFieldError(fieldId);
        }
        
        // Clear any submission errors
        const submissionError = document.getElementById('submission-error');
        if (submissionError) {
            submissionError.style.display = 'none';
        }
        
        // Clear any validation notifications
        const notifications = document.querySelectorAll('.validation-notification');
        notifications.forEach(notification => notification.remove());
    }
    
    showSubmissionError(message) {
        let errorElement = document.getElementById('submission-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'submission-error';
            errorElement.className = 'validation-notification';
            
            const form = document.querySelector('.onboarding-form');
            if (form) {
                form.insertBefore(errorElement, form.firstChild);
            }
        }
        
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        errorElement.style.display = 'flex';
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    showStepValidationFailed() {
        const notification = document.createElement('div');
        notification.className = 'validation-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Please complete all required fields before continuing.</span>
        `;
        
        const currentStep = document.querySelector('.onboarding-step:not([style*="display: none"])');
        if (currentStep) {
            currentStep.insertBefore(notification, currentStep.firstChild);
            notification.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
    
    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================
    
    isInitialized() {
        return this.initialized;
    }
    
    getFieldErrors() {
        return Array.from(this.errors.entries());
    }
    
    hasErrors() {
        return this.errors.size > 0;
    }
    
logFieldUsage() {
        const fields = document.querySelectorAll('input, textarea, select');
        const usage = {};
        
        fields.forEach(field => {
            if (field.value && field.value.trim().length > 0) {
                usage[field.id] = {
                    length: field.value.length,
                    wordCount: field.value.trim().split(/\s+/).length,
                    completed: true
                };
            } else {
                usage[field.id] = {
                    length: 0,
                    wordCount: 0,
                    completed: false
                };
            }
        });
        
        console.log('📊 [OnboardingValidator] Field usage statistics:', usage);
        return usage;
    }
    
    showValidationSummary() {
        const errors = this.getFieldErrors();
        if (errors.length === 0) {
            console.log('✅ [OnboardingValidator] All fields valid');
            return;
        }
        
        console.log('❌ [OnboardingValidator] Validation errors:');
        errors.forEach(([fieldId, message]) => {
            console.log(`  - ${fieldId}: ${message}`);
        });
    }
    
    // =============================================================================
    // ADVANCED VALIDATION HELPERS
    // =============================================================================
    
    validateFieldWithDebounce(fieldId, delay = 500) {
        // Clear existing timeout for this field
        if (this.debounceTimeouts && this.debounceTimeouts[fieldId]) {
            clearTimeout(this.debounceTimeouts[fieldId]);
        }
        
        // Initialize debounce timeouts if not exists
        if (!this.debounceTimeouts) {
            this.debounceTimeouts = {};
        }
        
        // Set new timeout
        this.debounceTimeouts[fieldId] = setTimeout(() => {
            this.validateField(fieldId);
        }, delay);
    }
    
    highlightIncompleteFields() {
        const currentStep = document.querySelector('.onboarding-step:not([style*="display: none"])');
        if (!currentStep) return;
        
        const fields = currentStep.querySelectorAll('input, textarea, select');
        let incompleteFields = [];
        
        fields.forEach(field => {
            const rules = this.rules.getValidationRules(field.id);
            if (rules && rules.required && (!field.value || field.value.trim().length === 0)) {
                field.classList.add('warning');
                incompleteFields.push(field.id);
            }
        });
        
        return incompleteFields;
    }
    
    focusFirstErrorField() {
        if (this.errors.size === 0) return false;
        
        const firstErrorFieldId = this.errors.keys().next().value;
        const field = document.getElementById(firstErrorFieldId);
        
        if (field) {
            field.focus();
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
        }
        
        return false;
    }
    
    getValidationProgress() {
        const allFields = document.querySelectorAll('input, textarea, select');
        let completed = 0;
        let total = 0;
        
        allFields.forEach(field => {
            const rules = this.rules.getValidationRules(field.id);
            if (rules && rules.required) {
                total++;
                if (field.value && field.value.trim().length > 0) {
                    completed++;
                }
            }
        });
        
        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }
    
    showProgressIndicator() {
        const progress = this.getValidationProgress();
        console.log(`📈 [OnboardingValidator] Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
        
        // Update any progress indicators in the UI
        const progressBar = document.querySelector('.validation-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress.percentage}%`;
        }
        
        const progressText = document.querySelector('.validation-progress-text');
        if (progressText) {
            progressText.textContent = `${progress.completed} of ${progress.total} completed`;
        }
        
        return progress;
    }
    
    // =============================================================================
    // CLEANUP & DESTROY
    // =============================================================================
    
    destroy() {
        // Clear all timeouts
        if (this.debounceTimeouts) {
            Object.values(this.debounceTimeouts).forEach(timeout => {
                clearTimeout(timeout);
            });
            this.debounceTimeouts = {};
        }
        
        // Clear all errors
        this.clearAllErrors();
        
        // Remove event listeners (if we stored references)
        // Note: In a production system, you'd want to store listener references for proper cleanup
        
        // Clear internal state
        this.errors.clear();
        this.characterCounters.clear();
        this.initialized = false;
        
        console.log('🧹 [OnboardingValidator] Validator destroyed and cleaned up');
    }
    
    // =============================================================================
    // DEBUG UTILITIES
    // =============================================================================
    
    debugValidationState() {
        return {
            initialized: this.initialized,
            errors: Object.fromEntries(this.errors),
            characterCounters: Array.from(this.characterCounters.keys()),
            progress: this.getValidationProgress(),
            rules: {
                totalSteps: this.rules.getTotalSteps(),
                characterLimits: Object.keys(this.rules.CHARACTER_LIMITS),
                validationRules: Object.keys(this.rules.VALIDATION_RULES)
            }
        };
    }
}

// Export to window for non-module usage
window.OnboardingValidator = OnboardingValidator;
