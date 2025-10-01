// =============================================================================
// OSLIRA FORM MANAGER - Universal Form Handler
// =============================================================================

class OsliraFormManager {
    constructor(form, options = {}) {
        this.form = form;
        this.options = {
            validateOnBlur: true,
            validateOnChange: false,
            showErrorsInline: true,
            submitHandler: null,
            resetOnSubmit: false,
            ...options
        };
        
        this.validators = new Map();
        this.state = {
            isValid: false,
            isSubmitting: false,
            errors: new Map(),
            touchedFields: new Set()
        };
        
        this.init();
    }
    
    init() {
        if (!this.form) {
            throw new Error('Form element is required');
        }
        
        this.form.classList.add('oslira-form');
        this.setupEventListeners();
        this.setupValidationRules();
        console.log('📝 [Form] Form manager initialized for:', this.form.id || 'unnamed form');
    }
    
    // =============================================================================
    // VALIDATION SYSTEM
    // =============================================================================
    
    setupValidationRules() {
        const fields = this.form.querySelectorAll('[data-validate], [required]');
        
        fields.forEach(field => {
            const rules = this.parseValidationRules(field);
            if (rules.length > 0) {
                this.validators.set(field.name || field.id, rules);
            }
        });
        
        console.log(`📝 [Form] Validation rules setup for ${fields.length} fields`);
    }
    
    parseValidationRules(field) {
        const rules = [];
        
        // Required validation
        if (field.hasAttribute('required') || field.dataset.required === 'true') {
            rules.push({
                type: 'required',
                message: field.dataset.requiredMessage || `${this.getFieldLabel(field)} is required`
            });
        }
        
        // Email validation
        if (field.type === 'email' || field.dataset.validate?.includes('email')) {
            rules.push({
                type: 'email',
                message: field.dataset.emailMessage || 'Please enter a valid email address'
            });
        }
        
        // Password validation
        if (field.type === 'password' || field.dataset.validate?.includes('password')) {
            const minLength = parseInt(field.dataset.minLength) || 8;
            rules.push({
                type: 'password',
                minLength: minLength,
                message: field.dataset.passwordMessage || `Password must be at least ${minLength} characters`
            });
        }
        
        // Min/Max length
        if (field.dataset.minLength) {
            rules.push({
                type: 'minLength',
                value: parseInt(field.dataset.minLength),
                message: field.dataset.minLengthMessage || `Minimum ${field.dataset.minLength} characters required`
            });
        }
        
        if (field.dataset.maxLength) {
            rules.push({
                type: 'maxLength', 
                value: parseInt(field.dataset.maxLength),
                message: field.dataset.maxLengthMessage || `Maximum ${field.dataset.maxLength} characters allowed`
            });
        }
        
        // Custom pattern validation
        if (field.dataset.pattern) {
            rules.push({
                type: 'pattern',
                pattern: new RegExp(field.dataset.pattern),
                message: field.dataset.patternMessage || 'Please enter a valid value'
            });
        }
        
        // Custom validation function
        if (field.dataset.customValidator && window[field.dataset.customValidator]) {
            rules.push({
                type: 'custom',
                validator: window[field.dataset.customValidator],
                message: field.dataset.customMessage || 'Invalid value'
            });
        }
        
        return rules;
    }
    
    getFieldLabel(field) {
        const label = this.form.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : field.name || 'Field';
    }
    
    // =============================================================================
    // VALIDATION EXECUTION
    // =============================================================================
    
    async validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"], [id="${fieldName}"]`);
        const rules = this.validators.get(fieldName);
        
        if (!field || !rules) {
            return { isValid: true, errors: [] };
        }
        
        const errors = [];
        const value = field.value.trim();
        
        for (const rule of rules) {
            const result = await this.executeValidationRule(rule, value, field);
            if (!result.isValid) {
                errors.push(result.message);
            }
        }
        
        const isValid = errors.length === 0;
        
        // Update state
        if (isValid) {
            this.state.errors.delete(fieldName);
        } else {
            this.state.errors.set(fieldName, errors);
        }
        
        // Show/hide errors
        if (this.options.showErrorsInline) {
            this.displayFieldErrors(field, errors);
        }
        
        // Update field styling
        field.classList.toggle('field-valid', isValid);
        field.classList.toggle('field-invalid', !isValid);
        
        return { isValid, errors };
    }
    
    async executeValidationRule(rule, value, field) {
        switch (rule.type) {
            case 'required':
                return {
                    isValid: value.length > 0,
                    message: rule.message
                };
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return {
                    isValid: !value || emailRegex.test(value),
                    message: rule.message
                };
                
            case 'password':
                const hasMinLength = value.length >= rule.minLength;
                const hasLetter = /[a-zA-Z]/.test(value);
                const hasNumber = /\d/.test(value);
                const isValidPassword = hasMinLength && hasLetter && hasNumber;
                
                return {
                    isValid: !value || isValidPassword,
                    message: rule.message
                };
                
            case 'minLength':
                return {
                    isValid: !value || value.length >= rule.value,
                    message: rule.message
                };
                
            case 'maxLength':
                return {
                    isValid: !value || value.length <= rule.value,
                    message: rule.message
                };
                
            case 'pattern':
                return {
                    isValid: !value || rule.pattern.test(value),
                    message: rule.message
                };
                
            case 'custom':
                try {
                    const result = await rule.validator(value, field);
                    return {
                        isValid: result === true,
                        message: result === true ? '' : rule.message
                    };
                } catch (error) {
                    return {
                        isValid: false,
                        message: 'Validation error'
                    };
                }
                
            default:
                return { isValid: true, message: '' };
        }
    }
    
    async validateForm() {
        const fieldNames = Array.from(this.validators.keys());
        const results = await Promise.all(
            fieldNames.map(fieldName => this.validateField(fieldName))
        );
        
        const isValid = results.every(result => result.isValid);
        this.state.isValid = isValid;
        
        // Update form styling
        this.form.classList.toggle('form-valid', isValid);
        this.form.classList.toggle('form-invalid', !isValid);
        
        console.log(`📝 [Form] Validation complete: ${isValid ? 'VALID' : 'INVALID'}`);
        return { isValid, errors: this.state.errors };
    }
    
    // =============================================================================
    // ERROR DISPLAY
    // =============================================================================
    
    displayFieldErrors(field, errors) {
        // Remove existing error display
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        if (errors.length > 0) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.innerHTML = errors.map(error => `<span>${error}</span>`).join('');
            
            // Insert after field or field wrapper
            const wrapper = field.closest('.field-wrapper') || field;
            wrapper.parentNode.insertBefore(errorDiv, wrapper.nextSibling);
        }
    }
    
    clearAllErrors() {
        this.state.errors.clear();
        this.form.querySelectorAll('.field-error').forEach(el => el.remove());
        this.form.querySelectorAll('.field-invalid').forEach(el => {
            el.classList.remove('field-invalid');
        });
        this.form.classList.remove('form-invalid');
    }
    
    showFormError(message) {
        let errorDiv = this.form.querySelector('.form-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            this.form.insertBefore(errorDiv, this.form.firstChild);
        }
        
        errorDiv.innerHTML = `<span>${message}</span>`;
        errorDiv.style.display = 'block';
    }
    
    hideFormError() {
        const errorDiv = this.form.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    // =============================================================================
    // EVENT HANDLING
    // =============================================================================
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Field validation on blur/change
        this.form.addEventListener('blur', this.handleFieldBlur.bind(this), true);
        this.form.addEventListener('input', this.handleFieldChange.bind(this));
        
        // Clear errors on focus
        this.form.addEventListener('focus', this.handleFieldFocus.bind(this), true);
    }
    
    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.state.isSubmitting) {
            return;
        }
        
        console.log('📝 [Form] Form submission started');
        this.state.isSubmitting = true;
        this.form.classList.add('form-submitting');
        
        try {
            // Validate entire form
            const { isValid } = await this.validateForm();
            
            if (!isValid) {
                console.log('📝 [Form] Validation failed, preventing submission');
                return;
            }
            
            // Call custom submit handler if provided
            if (this.options.submitHandler) {
                await this.options.submitHandler(this.getFormData(), this.form);
            }
            
            // Reset form if configured
            if (this.options.resetOnSubmit) {
                this.resetForm();
            }
            
            console.log('📝 [Form] Form submitted successfully');
            
        } catch (error) {
            console.error('📝 [Form] Submit error:', error);
            this.showFormError(error.message || 'An error occurred');
        } finally {
            this.state.isSubmitting = false;
            this.form.classList.remove('form-submitting');
        }
    }
    
    async handleFieldBlur(event) {
        if (!this.options.validateOnBlur) return;
        
        const field = event.target;
        const fieldName = field.name || field.id;
        
        if (fieldName && this.validators.has(fieldName)) {
            this.state.touchedFields.add(fieldName);
            await this.validateField(fieldName);
        }
    }
    
    async handleFieldChange(event) {
        if (!this.options.validateOnChange) return;
        
        const field = event.target;
        const fieldName = field.name || field.id;
        
        if (fieldName && this.validators.has(fieldName) && this.state.touchedFields.has(fieldName)) {
            await this.validateField(fieldName);
        }
    }
    
    handleFieldFocus(event) {
        const field = event.target;
        const fieldName = field.name || field.id;
        
        if (fieldName && this.state.errors.has(fieldName)) {
            field.classList.remove('field-invalid');
            
            // Clear inline errors
            const errorDiv = field.parentNode.querySelector('.field-error');
            if (errorDiv) {
                errorDiv.style.opacity = '0.5';
            }
        }
        
        this.hideFormError();
    }
    
    // =============================================================================
    // UTILITY METHODS
    // =============================================================================
    
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, etc.)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    setFieldValue(fieldName, value) {
        const field = this.form.querySelector(`[name="${fieldName}"], [id="${fieldName}"]`);
        if (field) {
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    getFieldValue(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"], [id="${fieldName}"]`);
        return field ? field.value : null;
    }
    
    resetForm() {
        this.form.reset();
        this.clearAllErrors();
        this.state.touchedFields.clear();
        this.state.isValid = false;
        this.form.classList.remove('form-valid', 'form-invalid');
        
        console.log('📝 [Form] Form reset complete');
    }
    
    enableSubmit() {
        const submitBtn = this.form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }
    
    disableSubmit() {
        const submitBtn = this.form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }
    
    // =============================================================================
    // PUBLIC API
    // =============================================================================
    
    async validate() {
        return await this.validateForm();
    }
    
    isValid() {
        return this.state.isValid;
    }
    
    getErrors() {
        return Object.fromEntries(this.state.errors);
    }
    
    clearErrors() {
        this.clearAllErrors();
    }
    
    showError(message) {
        this.showFormError(message);
    }
    
    hideError() {
        this.hideFormError();
    }
    
    getData() {
        return this.getFormData();
    }
    
    reset() {
        this.resetForm();
    }
    
    destroy() {
        // Remove event listeners
        this.form.removeEventListener('submit', this.handleSubmit.bind(this));
        this.form.removeEventListener('blur', this.handleFieldBlur.bind(this), true);
        this.form.removeEventListener('input', this.handleFieldChange.bind(this));
        this.form.removeEventListener('focus', this.handleFieldFocus.bind(this), true);
        
        // Clear state
        this.validators.clear();
        this.state.errors.clear();
        this.state.touchedFields.clear();
        
        // Remove classes
        this.form.classList.remove('oslira-form', 'form-valid', 'form-invalid', 'form-submitting');
        
        console.log('🗑️ [Form] Form manager destroyed');
    }
}

// Export for global use
window.OsliraFormManager = OsliraFormManager;

console.log('📝 [Form] Form Manager loaded');
