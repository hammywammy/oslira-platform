// =============================================================================
// FORM VALIDATOR - Complete Form Validation System
// Path: /public/core/ui/FormValidator.js
// Dependencies: Logger, ValidationUtils
// =============================================================================

/**
 * @class FormValidator
 * @description Reusable form validation with real-time feedback and accessibility
 * 
 * Features:
 * - Real-time validation on blur/input
 * - Async validation support (email checks, etc.)
 * - Custom validation rules
 * - Accessible error messages (ARIA)
 * - Field-level and form-level validation
 * - Debounced async validation
 */
class FormValidator {
    constructor(formElement, options = {}) {
        if (!formElement) {
            throw new Error('[FormValidator] Form element required');
        }
        
        this.form = typeof formElement === 'string' 
            ? document.querySelector(formElement) 
            : formElement;
            
        if (!this.form) {
            throw new Error('[FormValidator] Form element not found');
        }
        
        // Options
        this.options = {
            validateOnBlur: true,
            validateOnInput: false,
            showErrorsImmediately: false,
            scrollToFirstError: true,
            focusFirstError: true,
            debounceDelay: 300,
            ...options
        };
        
        // State
        this.fields = new Map();
        this.errors = new Map();
        this.touched = new Set();
        this.isValidating = false;
        this.isValid = false;
        
        // Utils
        this.validationUtils = window.OsliraValidationUtils;
        this.logger = window.OsliraLogger;
        
        console.log('✅ [FormValidator] Instance created for form:', this.form.id || 'unnamed');
        
        // Auto-initialize
        this.initialize();
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    initialize() {
        // Setup form submission handler
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Find all validatable fields
        this.discoverFields();
        
        // Setup field listeners
        this.setupFieldListeners();
        
        // Prevent browser default validation
        this.form.setAttribute('novalidate', 'novalidate');
        
        this.logger?.debug('[FormValidator] Initialized', {
            formId: this.form.id,
            fieldCount: this.fields.size
        });
    }
    
    /**
     * Discover all validatable fields in form
     */
    discoverFields() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            // Skip fields without validation rules
            const rules = this.extractValidationRules(field);
            if (Object.keys(rules).length === 0) return;
            
            this.fields.set(field.name || field.id, {
                element: field,
                rules,
                asyncValidators: []
            });
        });
    }
    
    /**
     * Extract validation rules from field attributes
     */
    extractValidationRules(field) {
        const rules = {};
        
        // Required
        if (field.hasAttribute('required') || field.hasAttribute('data-required')) {
            rules.required = true;
        }
        
        // Type-based validation
        if (field.type === 'email') {
            rules.email = true;
        }
        
        if (field.type === 'url') {
            rules.url = true;
        }
        
        if (field.type === 'number') {
            rules.number = true;
            if (field.min) rules.min = parseFloat(field.min);
            if (field.max) rules.max = parseFloat(field.max);
        }
        
        // Length validation
        if (field.minLength) {
            rules.minLength = parseInt(field.minLength);
        }
        
        if (field.maxLength) {
            rules.maxLength = parseInt(field.maxLength);
        }
        
        // Pattern validation
        if (field.pattern) {
            rules.pattern = new RegExp(field.pattern);
        }
        
        // Custom data attributes
        if (field.hasAttribute('data-validation')) {
            const customRule = field.getAttribute('data-validation');
            rules.custom = customRule;
        }
        
        return rules;
    }
    
    /**
     * Setup event listeners for fields
     */
    setupFieldListeners() {
        this.fields.forEach((fieldConfig, fieldName) => {
            const field = fieldConfig.element;
            
            // Blur validation
            if (this.options.validateOnBlur) {
                field.addEventListener('blur', () => {
                    this.touched.add(fieldName);
                    this.validateField(fieldName);
                });
            }
            
            // Input validation (debounced)
            if (this.options.validateOnInput) {
                field.addEventListener('input', this.debounce(() => {
                    if (this.touched.has(fieldName)) {
                        this.validateField(fieldName);
                    }
                }, this.options.debounceDelay));
            }
        });
    }
    
    // =========================================================================
    // VALIDATION RULES
    // =========================================================================
    
    /**
     * Add validation rule to field
     */
    addRule(fieldName, ruleName, ruleConfig) {
        const fieldConfig = this.fields.get(fieldName);
        if (!fieldConfig) {
            this.logger?.warn('[FormValidator] Field not found:', fieldName);
            return;
        }
        
        fieldConfig.rules[ruleName] = ruleConfig;
    }
    
    /**
     * Add async validator to field
     */
    addAsyncValidator(fieldName, validator) {
        const fieldConfig = this.fields.get(fieldName);
        if (!fieldConfig) {
            this.logger?.warn('[FormValidator] Field not found:', fieldName);
            return;
        }
        
        fieldConfig.asyncValidators.push(validator);
    }
    
    /**
     * Remove validation rule from field
     */
    removeRule(fieldName, ruleName) {
        const fieldConfig = this.fields.get(fieldName);
        if (!fieldConfig) return;
        
        delete fieldConfig.rules[ruleName];
    }
    
    // =========================================================================
    // FIELD VALIDATION
    // =========================================================================
    
    /**
     * Validate single field
     */
    async validateField(fieldName) {
        const fieldConfig = this.fields.get(fieldName);
        if (!fieldConfig) {
            this.logger?.warn('[FormValidator] Field not found:', fieldName);
            return false;
        }
        
        const field = fieldConfig.element;
        const value = field.value.trim();
        const rules = fieldConfig.rules;
        
        // Clear previous errors
        this.clearFieldError(fieldName);
        
        // Validate synchronous rules
        for (const [ruleName, ruleConfig] of Object.entries(rules)) {
            const error = await this.validateRule(value, ruleName, ruleConfig, field);
            
            if (error) {
                this.setFieldError(fieldName, error);
                return false;
            }
        }
        
        // Validate async validators
        for (const validator of fieldConfig.asyncValidators) {
            try {
                const result = await validator(value, field);
                if (result !== true) {
                    this.setFieldError(fieldName, result);
                    return false;
                }
            } catch (error) {
                this.logger?.error('[FormValidator] Async validation failed', error);
                this.setFieldError(fieldName, 'Validation error occurred');
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Validate single rule
     */
    async validateRule(value, ruleName, ruleConfig, field) {
        switch (ruleName) {
            case 'required':
                if (!value || value.length === 0) {
                    return this.getErrorMessage(field, 'required', 'This field is required');
                }
                break;
                
            case 'email':
                if (value && !this.validationUtils?.isEmail(value)) {
                    return this.getErrorMessage(field, 'email', 'Please enter a valid email address');
                }
                break;
                
            case 'url':
                if (value && !this.validationUtils?.isURL(value)) {
                    return this.getErrorMessage(field, 'url', 'Please enter a valid URL');
                }
                break;
                
            case 'number':
                if (value && !this.validationUtils?.isNumber(value)) {
                    return this.getErrorMessage(field, 'number', 'Please enter a valid number');
                }
                break;
                
            case 'min':
                const numValue = parseFloat(value);
                if (value && numValue < ruleConfig) {
                    return this.getErrorMessage(field, 'min', `Value must be at least ${ruleConfig}`);
                }
                break;
                
            case 'max':
                const maxNumValue = parseFloat(value);
                if (value && maxNumValue > ruleConfig) {
                    return this.getErrorMessage(field, 'max', `Value must be at most ${ruleConfig}`);
                }
                break;
                
            case 'minLength':
                if (value && value.length < ruleConfig) {
                    return this.getErrorMessage(field, 'minLength', `Must be at least ${ruleConfig} characters`);
                }
                break;
                
            case 'maxLength':
                if (value && value.length > ruleConfig) {
                    return this.getErrorMessage(field, 'maxLength', `Must be less than ${ruleConfig} characters`);
                }
                break;
                
            case 'pattern':
                if (value && !ruleConfig.test(value)) {
                    return this.getErrorMessage(field, 'pattern', 'Please match the requested format');
                }
                break;
                
            case 'custom':
                // Handle custom validation function
                if (typeof ruleConfig === 'function') {
                    const result = await ruleConfig(value, field);
                    if (result !== true) {
                        return result || 'Validation failed';
                    }
                }
                break;
        }
        
        return null;
    }
    
    /**
     * Get error message for field/rule
     */
    getErrorMessage(field, ruleName, defaultMessage) {
        // Check for custom error message in data attribute
        const customMessage = field.getAttribute(`data-error-${ruleName}`);
        if (customMessage) return customMessage;
        
        // Check for generic error message
        const genericMessage = field.getAttribute('data-error');
        if (genericMessage) return genericMessage;
        
        // Return default
        return defaultMessage;
    }
    
    // =========================================================================
    // FORM VALIDATION
    // =========================================================================
    
    /**
     * Validate entire form
     */
    async validate() {
        this.isValidating = true;
        this.errors.clear();
        
        const validationPromises = [];
        
        // Validate all fields
        for (const fieldName of this.fields.keys()) {
            this.touched.add(fieldName);
            validationPromises.push(this.validateField(fieldName));
        }
        
        const results = await Promise.all(validationPromises);
        
        this.isValid = results.every(result => result === true);
        this.isValidating = false;
        
        // Focus first error if configured
        if (!this.isValid && this.options.focusFirstError) {
            this.focusFirstError();
        }
        
        // Scroll to first error if configured
        if (!this.isValid && this.options.scrollToFirstError) {
            this.scrollToFirstError();
        }
        
        return this.isValid;
    }
    
    /**
     * Check if form is valid (without triggering validation)
     */
    checkValidity() {
        return this.errors.size === 0;
    }
    
    // =========================================================================
    // ERROR MANAGEMENT
    // =========================================================================
    
    /**
     * Set error for field
     */
    setFieldError(fieldName, errorMessage) {
        this.errors.set(fieldName, errorMessage);
        
        const fieldConfig = this.fields.get(fieldName);
        if (!fieldConfig) return;
        
        const field = fieldConfig.element;
        
        // Mark field as invalid
        field.setAttribute('aria-invalid', 'true');
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        // Show error message
        this.showErrorMessage(field, errorMessage);
    }
    
    /**
     * Clear error for field
     */
    clearFieldError(fieldName) {
        this.errors.delete(fieldName);
        
        const fieldConfig = this.fields.get(fieldName);
        if (!fieldConfig) return;
        
        const field = fieldConfig.element;
        
        // Mark field as valid
        field.setAttribute('aria-invalid', 'false');
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        
        // Hide error message
        this.hideErrorMessage(field);
    }
    
    /**
     * Show error message for field
     */
    showErrorMessage(field, message) {
        // Find or create error container
        let errorElement = this.getErrorElement(field);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.setAttribute('role', 'alert');
            errorElement.style.cssText = `
                color: #EF4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: block;
            `;
            
            // Insert after field
            field.parentNode.insertBefore(errorElement, field.nextSibling);
            
            // Link error to field for accessibility
            const errorId = `${field.name || field.id}-error`;
            errorElement.id = errorId;
            field.setAttribute('aria-describedby', errorId);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    /**
     * Hide error message for field
     */
    hideErrorMessage(field) {
        const errorElement = this.getErrorElement(field);
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    }
    
    /**
     * Get error element for field
     */
    getErrorElement(field) {
        const errorId = `${field.name || field.id}-error`;
        return document.getElementById(errorId);
    }
    
    /**
     * Get all errors
     */
    getErrors() {
        return Object.fromEntries(this.errors);
    }
    
    /**
     * Get error for specific field
     */
    getFieldError(fieldName) {
        return this.errors.get(fieldName);
    }
    
    /**
     * Check if field has error
     */
    hasError(fieldName) {
        return this.errors.has(fieldName);
    }
    
    // =========================================================================
    // FORM SUBMISSION
    // =========================================================================
    
    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        this.logger?.debug('[FormValidator] Form submission started');
        
        // Validate form
        const isValid = await this.validate();
        
        if (!isValid) {
            this.logger?.warn('[FormValidator] Form validation failed', {
                errors: this.getErrors()
            });
            
            // Emit validation failed event
            this.form.dispatchEvent(new CustomEvent('validation:failed', {
                detail: { errors: this.getErrors() }
            }));
            
            return false;
        }
        
        this.logger?.debug('[FormValidator] Form validation passed');
        
        // Emit validation success event
        this.form.dispatchEvent(new CustomEvent('validation:success', {
            detail: { data: this.getFormData() }
        }));
        
        return true;
    }
    
    /**
     * Get form data as object
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Focus first field with error
     */
    focusFirstError() {
        for (const [fieldName, error] of this.errors.entries()) {
            const fieldConfig = this.fields.get(fieldName);
            if (fieldConfig) {
                fieldConfig.element.focus();
                break;
            }
        }
    }
    
    /**
     * Scroll to first field with error
     */
    scrollToFirstError() {
        for (const [fieldName, error] of this.errors.entries()) {
            const fieldConfig = this.fields.get(fieldName);
            if (fieldConfig) {
                fieldConfig.element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                break;
            }
        }
    }
    
    /**
     * Reset form validation
     */
    reset() {
        this.errors.clear();
        this.touched.clear();
        this.isValid = false;
        
        // Clear all field errors
        this.fields.forEach((fieldConfig, fieldName) => {
            this.clearFieldError(fieldName);
        });
        
        // Reset form
        this.form.reset();
        
        this.logger?.debug('[FormValidator] Form reset');
    }
    
    /**
     * Debounce helper
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Destroy validator
     */
    destroy() {
        // Remove error messages
        this.fields.forEach((fieldConfig) => {
            this.hideErrorMessage(fieldConfig.element);
        });
        
        // Clear state
        this.fields.clear();
        this.errors.clear();
        this.touched.clear();
        
        this.logger?.debug('[FormValidator] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraFormValidator = FormValidator;

console.log('✅ [FormValidator] Class loaded and ready');
