// =============================================================================
// VALIDATION UTILS - Input Validation Utilities
// Path: /public/core/utils/ValidationUtils.js
// Dependencies: None
// =============================================================================

/**
 * @class ValidationUtils
 * @description Comprehensive validation rules for user input
 * 
 * Features:
 * - Email validation
 * - Phone validation
 * - URL validation
 * - Instagram username validation
 * - Password strength checking
 * - Custom validators
 */
class ValidationUtils {
    constructor() {
        // Regex patterns
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\d\s\-\+\(\)]+$/,
            url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            instagram: /^[a-zA-Z0-9._]{1,30}$/,
            username: /^[a-zA-Z0-9_-]{3,20}$/,
            alphanumeric: /^[a-zA-Z0-9]+$/,
            alpha: /^[a-zA-Z]+$/,
            numeric: /^[0-9]+$/,
            hex: /^[0-9A-Fa-f]+$/,
            uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        };
        
        console.log('✅ [ValidationUtils] Initialized');
    }
    
    // =========================================================================
    // EMAIL VALIDATION
    // =========================================================================
    
    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} Valid or not
     */
    isEmail(email) {
        if (!email || typeof email !== 'string') return false;
        
        // Basic regex check
        if (!this.patterns.email.test(email.trim())) return false;
        
        // Additional checks
        const parts = email.trim().split('@');
        if (parts.length !== 2) return false;
        
        const [local, domain] = parts;
        
        // Local part checks
        if (local.length === 0 || local.length > 64) return false;
        if (local.startsWith('.') || local.endsWith('.')) return false;
        if (local.includes('..')) return false;
        
        // Domain checks
        if (domain.length === 0 || domain.length > 255) return false;
        if (domain.startsWith('.') || domain.endsWith('.')) return false;
        if (!domain.includes('.')) return false;
        
        return true;
    }
    
    /**
     * Validate email with detailed error message
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Email is required' };
        }
        
        const trimmed = email.trim();
        
        if (trimmed.length === 0) {
            return { valid: false, error: 'Email is required' };
        }
        
        if (!this.patterns.email.test(trimmed)) {
            return { valid: false, error: 'Invalid email format' };
        }
        
        const parts = trimmed.split('@');
        if (parts.length !== 2) {
            return { valid: false, error: 'Invalid email format' };
        }
        
        const [local, domain] = parts;
        
        if (local.length > 64) {
            return { valid: false, error: 'Email local part too long' };
        }
        
        if (domain.length > 255) {
            return { valid: false, error: 'Email domain too long' };
        }
        
        return { valid: true, error: null };
    }
    
    // =========================================================================
    // PHONE VALIDATION
    // =========================================================================
    
    /**
     * Validate phone number
     * @param {string} phone - Phone to validate
     * @returns {boolean} Valid or not
     */
    isPhone(phone) {
        if (!phone || typeof phone !== 'string') return false;
        
        // Remove formatting
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        
        // Check if only digits and + remain
        if (!/^\+?[0-9]+$/.test(cleaned)) return false;
        
        // Check length (7-15 digits)
        const digits = cleaned.replace('+', '');
        if (digits.length < 7 || digits.length > 15) return false;
        
        return true;
    }
    
    /**
     * Validate phone with detailed error
     */
    validatePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return { valid: false, error: 'Phone number is required' };
        }
        
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        
        if (!/^\+?[0-9]+$/.test(cleaned)) {
            return { valid: false, error: 'Phone number contains invalid characters' };
        }
        
        const digits = cleaned.replace('+', '');
        
        if (digits.length < 7) {
            return { valid: false, error: 'Phone number too short' };
        }
        
        if (digits.length > 15) {
            return { valid: false, error: 'Phone number too long' };
        }
        
        return { valid: true, error: null };
    }
    
    /**
     * Format phone number (US format)
     */
    formatPhone(phone) {
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        }
        
        return phone;
    }
    
    // =========================================================================
    // URL VALIDATION
    // =========================================================================
    
    /**
     * Validate URL
     */
    isURL(url) {
        if (!url || typeof url !== 'string') return false;
        
        try {
            new URL(url);
            return this.patterns.url.test(url);
        } catch {
            return false;
        }
    }
    
    /**
     * Validate URL with detailed error
     */
    validateURL(url) {
        if (!url || typeof url !== 'string') {
            return { valid: false, error: 'URL is required' };
        }
        
        try {
            new URL(url);
            
            if (!this.patterns.url.test(url)) {
                return { valid: false, error: 'Invalid URL format' };
            }
            
            return { valid: true, error: null };
        } catch {
            return { valid: false, error: 'Invalid URL format' };
        }
    }
    
    // =========================================================================
    // INSTAGRAM USERNAME VALIDATION
    // =========================================================================
    
    /**
     * Validate Instagram username
     */
    isInstagramUsername(username) {
        if (!username || typeof username !== 'string') return false;
        
        const trimmed = username.trim().replace('@', '');
        
        if (trimmed.length === 0 || trimmed.length > 30) return false;
        
        return this.patterns.instagram.test(trimmed);
    }
    
    /**
     * Validate Instagram username with detailed error
     */
    validateInstagramUsername(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, error: 'Username is required' };
        }
        
        const trimmed = username.trim().replace('@', '');
        
        if (trimmed.length === 0) {
            return { valid: false, error: 'Username is required' };
        }
        
        if (trimmed.length > 30) {
            return { valid: false, error: 'Username too long (max 30 characters)' };
        }
        
        if (!this.patterns.instagram.test(trimmed)) {
            return { valid: false, error: 'Username can only contain letters, numbers, dots, and underscores' };
        }
        
        return { valid: true, error: null };
    }
    
    /**
     * Normalize Instagram username (remove @, trim, lowercase)
     */
    normalizeInstagramUsername(username) {
        if (!username) return '';
        return username.trim().replace('@', '').toLowerCase();
    }
    
    // =========================================================================
    // PASSWORD VALIDATION
    // =========================================================================
    
    /**
     * Check password strength
     * @returns {Object} { strength: 'weak'|'medium'|'strong', score: 0-100, issues: [] }
     */
    checkPasswordStrength(password) {
        if (!password || typeof password !== 'string') {
            return { strength: 'weak', score: 0, issues: ['Password is required'] };
        }
        
        const issues = [];
        let score = 0;
        
        // Length check
        if (password.length < 8) {
            issues.push('Password must be at least 8 characters');
        } else {
            score += 25;
            if (password.length >= 12) score += 10;
            if (password.length >= 16) score += 10;
        }
        
        // Lowercase check
        if (!/[a-z]/.test(password)) {
            issues.push('Password must contain lowercase letters');
        } else {
            score += 15;
        }
        
        // Uppercase check
        if (!/[A-Z]/.test(password)) {
            issues.push('Password must contain uppercase letters');
        } else {
            score += 15;
        }
        
        // Number check
        if (!/[0-9]/.test(password)) {
            issues.push('Password must contain numbers');
        } else {
            score += 15;
        }
        
        // Special character check
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            issues.push('Password must contain special characters');
        } else {
            score += 20;
        }
        
        // Determine strength
        let strength = 'weak';
        if (score >= 70) strength = 'strong';
        else if (score >= 40) strength = 'medium';
        
        return { strength, score, issues };
    }
    
    /**
     * Validate password with requirements
     */
    validatePassword(password, minLength = 8) {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Password is required' };
        }
        
        if (password.length < minLength) {
            return { valid: false, error: `Password must be at least ${minLength} characters` };
        }
        
        const strength = this.checkPasswordStrength(password);
        
        if (strength.strength === 'weak') {
            return { 
                valid: false, 
                error: 'Password too weak. ' + strength.issues[0]
            };
        }
        
        return { valid: true, error: null };
    }
    
    // =========================================================================
    // COMMON VALIDATIONS
    // =========================================================================
    
    /**
     * Check if value is empty
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim().length === 0) return true;
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === 'object' && Object.keys(value).length === 0) return true;
        return false;
    }
    
    /**
     * Validate required field
     */
    isRequired(value, fieldName = 'Field') {
        if (this.isEmpty(value)) {
            return { valid: false, error: `${fieldName} is required` };
        }
        return { valid: true, error: null };
    }
    
    /**
     * Validate min length
     */
    minLength(value, min, fieldName = 'Field') {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: `${fieldName} is required` };
        }
        
        if (value.length < min) {
            return { valid: false, error: `${fieldName} must be at least ${min} characters` };
        }
        
        return { valid: true, error: null };
    }
    
    /**
     * Validate max length
     */
    maxLength(value, max, fieldName = 'Field') {
        if (!value || typeof value !== 'string') {
            return { valid: true, error: null };
        }
        
        if (value.length > max) {
            return { valid: false, error: `${fieldName} must be less than ${max} characters` };
        }
        
        return { valid: true, error: null };
    }
    
    /**
     * Validate range
     */
    inRange(value, min, max, fieldName = 'Value') {
        const num = Number(value);
        
        if (isNaN(num)) {
            return { valid: false, error: `${fieldName} must be a number` };
        }
        
        if (num < min || num > max) {
            return { valid: false, error: `${fieldName} must be between ${min} and ${max}` };
        }
        
        return { valid: true, error: null };
    }
    
    /**
     * Validate number
     */
    isNumber(value) {
        return !isNaN(Number(value));
    }
    
    /**
     * Validate integer
     */
    isInteger(value) {
        return Number.isInteger(Number(value));
    }
    
    /**
     * Validate positive number
     */
    isPositive(value) {
        const num = Number(value);
        return !isNaN(num) && num > 0;
    }
    
    // =========================================================================
    // PATTERN MATCHING
    // =========================================================================
    
    /**
     * Check if value matches pattern
     */
    matchesPattern(value, pattern, fieldName = 'Field') {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: `${fieldName} is required` };
        }
        
        if (!pattern.test(value)) {
            return { valid: false, error: `${fieldName} format is invalid` };
        }
        
        return { valid: true, error: null };
    }
    
    /**
     * Validate alphanumeric
     */
    isAlphanumeric(value) {
        return this.patterns.alphanumeric.test(value);
    }
    
    /**
     * Validate alphabetic
     */
    isAlpha(value) {
        return this.patterns.alpha.test(value);
    }
    
    /**
     * Validate numeric string
     */
    isNumeric(value) {
        return this.patterns.numeric.test(value);
    }
    
    /**
     * Validate hex string
     */
    isHex(value) {
        return this.patterns.hex.test(value);
    }
    
    /**
     * Validate UUID
     */
    isUUID(value) {
        return this.patterns.uuid.test(value);
    }
    
    // =========================================================================
    // SANITIZATION
    // =========================================================================
    
    /**
     * Sanitize string (remove HTML tags)
     */
    sanitize(value) {
        if (!value || typeof value !== 'string') return '';
        return value.replace(/<[^>]*>/g, '').trim();
    }
    
    /**
     * Escape HTML
     */
    escapeHTML(value) {
        if (!value || typeof value !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    }
    
    /**
     * Strip whitespace
     */
    stripWhitespace(value) {
        if (!value || typeof value !== 'string') return '';
        return value.replace(/\s+/g, '');
    }
    
    /**
     * Normalize whitespace
     */
    normalizeWhitespace(value) {
        if (!value || typeof value !== 'string') return '';
        return value.replace(/\s+/g, ' ').trim();
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraValidationUtils = new ValidationUtils();

console.log('✅ [ValidationUtils] Loaded and ready');
