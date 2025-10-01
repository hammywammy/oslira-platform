// =============================================================================
// ONBOARDING RULES & BUSINESS LOGIC
// =============================================================================

class OnboardingRules {
    constructor() {
        this.TOTAL_STEPS = 10;
        
this.STEP_FIELDS = {
    1: ['company-name', 'industry', 'company-size', 'website'],
    2: ['primary-objective'],
    3: ['challenges'],
    4: ['target-description', 'target-size'],
    5: ['communication', 'communication-tone'],
    6: ['budget', 'monthly-lead-goal'],
    7: ['team-size', 'campaign-manager'],
    8: ['integrations'],
    9: ['phone-number', 'sms-opt-in'],
    10: []
};
        
this.VALIDATION_RULES = {
    'company-name': { required: true, minLength: 2 },
    'industry': { required: true },
    'industry-other': { required: true, maxLength: 30 },
    'company-size': { required: true },
    'website': { required: false },
    'primary-objective': { required: true },
    'challenges': { required: true },
    'target-description': { required: true, minLength: 10 },
    'target-size': { required: true },
    'communication': { required: true },
    'communication-tone': { required: true },
    'budget': { required: true },
    'monthly-lead-goal': { required: true },
    'team-size': { required: true },
    'campaign-manager': { required: true },
    'integrations': { required: false },
    'phone-number': { required: false },
    'sms-opt-in': { required: false }
};
        
this.CHARACTER_LIMITS = {
            'business-name': {
                min: 2,
                max: 100,
                reason: 'Business names are typically 2-100 characters'
            },
            'industry-other': {
                min: 2,
                max: 30,
                reason: 'Custom industry name should be concise'
            },
'target-description': {
    min: 20,
    max: 500,
    reason: 'Detailed audience description for AI analysis'
},
            'value-proposition': {
                min: 20,
                max: 300,
                reason: 'Concise but detailed value prop (2-3 sentences ideal)'
            },
            'key-results': {
                min: 0,  // Optional field
                max: 800,
                reason: 'Detailed success outcomes for AI summary generation'
            },
'phone-number': {
                min: 0,
                max: 20,
                reason: 'Phone number without country code'
            }
        };
        
        // Business niche to CTA mapping for smart defaults
        this.CTA_DEFAULTS = {
            'coaching': 'Book Your Free Discovery Call',
            'consulting': 'Schedule a Strategy Session',
            'e-commerce': 'Shop Now - Free Shipping',
            'saas': 'Start Your Free Trial',
            'real-estate': 'Get Your Free Property Valuation',
            'fitness': 'Join Our Fitness Challenge',
            'education': 'Enroll in Our Next Cohort',
            'agency': 'Get Your Free Marketing Audit',
            'healthcare': 'Book Your Consultation',
            'legal': 'Schedule Your Free Case Review'
        };
        
        // Field validation patterns
        this.VALIDATION_PATTERNS = {
            'business-name': /^[a-zA-Z0-9\s\-'&\.]+$/,
            'phone-number': /^\+?[\d\s\-()]{10,}$/,
            'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        };
    }
    
    // =============================================================================
    // STEP VALIDATION LOGIC
    // =============================================================================
    
    getFieldsForStep(stepNumber) {
        return this.STEP_FIELDS[stepNumber] || [];
    }
    
    getValidationRules(fieldId) {
        return this.VALIDATION_RULES[fieldId] || {};
    }
    
    getCharacterLimits(fieldId) {
        return this.CHARACTER_LIMITS[fieldId] || null;
    }
    
    getSmartDefault(fieldId, businessNiche) {
        if (fieldId === 'preferred-cta' && businessNiche) {
            return this.CTA_DEFAULTS[businessNiche] || null;
        }
        return null;
    }
    
    // =============================================================================
    // BUSINESS VALIDATION RULES
    // =============================================================================
    
    validateBusinessName(businessName) {
        const trimmed = businessName.trim();
        
        if (trimmed.length === 0) {
            return { valid: false, message: 'Business name is required' };
        }
        
        if (trimmed.length < 2) {
            return { valid: false, message: 'Business name must be at least 2 characters' };
        }
        
        if (trimmed.length > 50) {
            return { valid: false, message: 'Business name must be 50 characters or less' };
        }
        
const validPattern = /^[a-zA-Z0-9\s]+$/;
        if (!validPattern.test(trimmed)) {
            return { 
                valid: false, 
                message: 'Business name can only contain letters, numbers, and spaces'
            };
        }
        
        return { valid: true, message: '' };
    }
    
    validateSuccessOutcome(outcome) {
        const trimmed = outcome.trim();
        
        if (trimmed.length === 0) {
            return { valid: false, message: 'Success outcome is required' };
        }
        
        if (trimmed.length < 10) {
            return { valid: false, message: 'Please provide more detail about your success outcome' };
        }
        
        return { valid: true, message: '' };
    }
    
    validateCommunicationStyle(style) {
        if (!style || style.trim().length === 0) {
            return { valid: false, message: 'Communication style is required' };
        }
        
        return { valid: true, message: '' };
    }
    
    validatePhoneNumber(phone) {
        if (!phone || phone.trim().length === 0) {
            return { valid: true, message: '' }; // Phone is optional
        }
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length < 10 || cleaned.length > 15) {
            return { valid: false, message: 'Please enter a valid phone number (10-15 digits)' };
        }
        
        return { valid: true, message: '' };
    }
    
    // =============================================================================
    // CHARACTER LIMIT VALIDATION
    // =============================================================================
    
    validateCharacterLimit(fieldId, value) {
        const limits = this.getCharacterLimits(fieldId);
        if (!limits) return { valid: true, message: '' };
        
        const currentLength = value.length;
        
        // Check minimum length (for required fields)
        if (limits.min > 0 && currentLength > 0 && currentLength < limits.min) {
            return { 
                valid: false, 
                message: `Minimum ${limits.min} characters required`,
                warning: true 
            };
        }
        
        // Check maximum length
        if (currentLength > limits.max) {
            return { 
                valid: false, 
                message: `Maximum ${limits.max} characters allowed` 
            };
        }
        
        return { valid: true, message: '' };
    }
    
    getCharacterUsageStatus(fieldId, value) {
        const limits = this.getCharacterLimits(fieldId);
        if (!limits) return 'normal';
        
        const percentage = value.length / limits.max;
        
        if (percentage >= 0.9) return 'warning';
        if (value.length >= limits.max) return 'limit-reached';
        return 'normal';
    }
    
    // =============================================================================
    // FORM DATA VALIDATION
    // =============================================================================
    
    validateRequiredFields(formData) {
        const errors = [];
        const requiredFields = [
            { key: 'business_name', label: 'Business Name' },
            { key: 'business_niche', label: 'Business Niche' },
            { key: 'target_audience', label: 'Target Audience' },
            { key: 'target_problems', label: 'Target Problems' },
            { key: 'value_proposition', label: 'Value Proposition' },
            { key: 'success_outcome', label: 'Success Outcome' },
            { key: 'call_to_action', label: 'Call to Action' }
        ];
        
        requiredFields.forEach(field => {
            if (!formData[field.key] || formData[field.key].trim().length === 0) {
                errors.push(`${field.label} is required`);
            }
        });
        
        return errors;
    }
    
    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================
    
    sanitizePhoneNumber(phone) {
        if (!phone) return '';
        
        // Remove all non-numeric characters except + for international
        const cleaned = phone.replace(/[^\d+]/g, '');
        
        // Validate international format
        if (cleaned.startsWith('+')) {
            return cleaned.length <= 16 ? cleaned : cleaned.substring(0, 16);
        }
        
        // Domestic format - remove leading 1 if present
        const domesticCleaned = cleaned.replace(/^1/, '');
        return domesticCleaned.length <= 10 ? domesticCleaned : domesticCleaned.substring(0, 10);
    }
    
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length <= 10) {
            if (cleaned.length >= 6) {
                return cleaned.replace(/(\d{3})(\d{3})(\d{0,4})/, '($1) $2-$3');
            } else if (cleaned.length >= 3) {
                return cleaned.replace(/(\d{3})(\d{0,3})/, '($1) $2');
            }
        }
        
        return phone;
    }
    
    getTotalSteps() {
        return this.TOTAL_STEPS;
    }
    
    isValidStep(stepNumber) {
        return stepNumber >= 1 && stepNumber <= this.TOTAL_STEPS;
    }
}

// Export to window for non-module usage
window.OnboardingRules = OnboardingRules;
