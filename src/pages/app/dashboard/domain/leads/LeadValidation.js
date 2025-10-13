// =============================================================================
// LEAD VALIDATION - Pure Validation Logic
// Path: /public/pages/app/dashboard/domain/leads/LeadValidation.js
// Dependencies: NONE (pure functions)
// =============================================================================

class LeadValidation {
    
    // =========================================================================
    // USERNAME VALIDATION
    // =========================================================================
    
    validateInstagramUsername(username) {
        // Empty check
        if (!username || username.length === 0) {
            return { isValid: false, error: 'Username is required' };
        }
        
        // Length check (1-30 characters)
        if (username.length > 30) {
            return { isValid: false, error: 'Username must be 30 characters or less' };
        }
        
        // Character validation (letters, numbers, periods, underscores only)
        const validCharsRegex = /^[a-zA-Z0-9._]+$/;
        if (!validCharsRegex.test(username)) {
            return { isValid: false, error: 'Username can only contain letters, numbers, periods (.), and underscores (_)' };
        }
        
        // No leading dot
        if (username.startsWith('.')) {
            return { isValid: false, error: 'Username cannot start with a period' };
        }
        
        // No trailing dot
        if (username.endsWith('.')) {
            return { isValid: false, error: 'Username cannot end with a period' };
        }
        
        // No consecutive dots
        if (username.includes('..')) {
            return { isValid: false, error: 'Username cannot contain consecutive periods (..)' };
        }
        
        return { isValid: true, error: null };
    }
    
    // =========================================================================
    // USERNAME CLEANING
    // =========================================================================
    
    cleanUsername(username) {
        if (!username) return '';
        
        return username
            .trim()
            .replace(/^@/, '')
            .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
            .replace(/\/$/, '')
            .split('/')[0];
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
// ES6 Module Export
export default LeadValidation;
window.LeadValidation = LeadValidation;
console.log('✅ [LeadValidation] Loaded');
