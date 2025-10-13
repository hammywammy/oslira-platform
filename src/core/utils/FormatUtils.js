// =============================================================================
// FORMAT UTILS - Number, Currency, and Text Formatting Utilities
// Path: /public/core/utils/FormatUtils.js
// Dependencies: None
// =============================================================================

/**
 * @class FormatUtils
 * @description Utility functions for formatting numbers, currency, and text
 * 
 * Features:
 * - Number formatting with locale support
 * - Currency formatting
 * - Percentage formatting
 * - File size formatting
 * - Text truncation
 * - Case conversion
 */
class FormatUtils {
    constructor() {
        // Default locale
        this.locale = 'en-US';
        
        // Currency symbols
        this.currencySymbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            CAD: 'CA$',
            AUD: 'A$'
        };
        
        console.log('💵 [FormatUtils] Initialized');
    }
    
    // =========================================================================
    // NUMBER FORMATTING
    // =========================================================================
    
    /**
     * Format number with thousands separator
     * @param {number} num - Number to format
     * @param {number} decimals - Decimal places (default: 0)
     * @returns {string} Formatted number
     */
    number(num, decimals = 0) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        
        return new Intl.NumberFormat(this.locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }
    
    /**
     * Format number with compact notation (1.2K, 1.5M, etc.)
     */
    compact(num, decimals = 1) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        
        const absNum = Math.abs(num);
        
        if (absNum >= 1e9) {
            return (num / 1e9).toFixed(decimals) + 'B';
        }
        if (absNum >= 1e6) {
            return (num / 1e6).toFixed(decimals) + 'M';
        }
        if (absNum >= 1e3) {
            return (num / 1e3).toFixed(decimals) + 'K';
        }
        
        return this.number(num, decimals);
    }
    
    /**
     * Format number with ordinal suffix (1st, 2nd, 3rd, etc.)
     */
    ordinal(num) {
        if (num === null || num === undefined || isNaN(num)) return '';
        
        const n = Math.abs(num);
        const lastDigit = n % 10;
        const lastTwoDigits = n % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return num + 'th';
        }
        
        switch (lastDigit) {
            case 1: return num + 'st';
            case 2: return num + 'nd';
            case 3: return num + 'rd';
            default: return num + 'th';
        }
    }
    
    /**
     * Format decimal number
     */
    decimal(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return '0.00';
        return Number(num).toFixed(decimals);
    }
    
    // =========================================================================
    // CURRENCY FORMATTING
    // =========================================================================
    
    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: 'USD')
     * @param {number} decimals - Decimal places (default: 2)
     * @returns {string} Formatted currency
     */
    currency(amount, currency = 'USD', decimals = 2) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            amount = 0;
        }
        
        try {
            return new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(amount);
        } catch (error) {
            // Fallback if currency not supported
            const symbol = this.currencySymbols[currency] || currency;
            return `${symbol}${this.number(amount, decimals)}`;
        }
    }
    
    /**
     * Format currency with compact notation
     */
    currencyCompact(amount, currency = 'USD') {
        if (amount === null || amount === undefined || isNaN(amount)) {
            amount = 0;
        }
        
        const symbol = this.currencySymbols[currency] || currency;
        const absAmount = Math.abs(amount);
        
        if (absAmount >= 1e9) {
            return symbol + (amount / 1e9).toFixed(1) + 'B';
        }
        if (absAmount >= 1e6) {
            return symbol + (amount / 1e6).toFixed(1) + 'M';
        }
        if (absAmount >= 1e3) {
            return symbol + (amount / 1e3).toFixed(1) + 'K';
        }
        
        return this.currency(amount, currency);
    }
    
    /**
     * Format currency without decimals
     */
    currencyWhole(amount, currency = 'USD') {
        return this.currency(amount, currency, 0);
    }
    
    // =========================================================================
    // PERCENTAGE FORMATTING
    // =========================================================================
    
    /**
     * Format percentage
     * @param {number} value - Value to format (0-1 or 0-100)
     * @param {number} decimals - Decimal places (default: 0)
     * @param {boolean} isDecimal - Whether value is 0-1 (true) or 0-100 (false)
     * @returns {string} Formatted percentage
     */
    percentage(value, decimals = 0, isDecimal = false) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0%';
        }
        
        const percent = isDecimal ? value * 100 : value;
        return this.decimal(percent, decimals) + '%';
    }
    
    /**
     * Format percentage with + or - sign
     */
    percentageChange(value, decimals = 1, isDecimal = false) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0%';
        }
        
        const percent = isDecimal ? value * 100 : value;
        const formatted = this.decimal(Math.abs(percent), decimals);
        
        if (percent > 0) return '+' + formatted + '%';
        if (percent < 0) return '-' + formatted + '%';
        return formatted + '%';
    }
    
    // =========================================================================
    // FILE SIZE FORMATTING
    // =========================================================================
    
    /**
     * Format file size in bytes to human-readable format
     * @param {number} bytes - Size in bytes
     * @param {number} decimals - Decimal places (default: 2)
     * @returns {string} Formatted size
     */
    fileSize(bytes, decimals = 2) {
        if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) {
            return '0 Bytes';
        }
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return this.decimal(bytes / Math.pow(k, i), decimals) + ' ' + sizes[i];
    }
    
    // =========================================================================
    // TEXT FORMATTING
    // =========================================================================
    
    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @param {string} suffix - Suffix to add (default: '...')
     * @returns {string} Truncated text
     */
    truncate(text, maxLength, suffix = '...') {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        
        return text.substring(0, maxLength - suffix.length) + suffix;
    }
    
    /**
     * Truncate text at word boundary
     */
    truncateWords(text, maxWords, suffix = '...') {
        if (!text || typeof text !== 'string') return '';
        
        const words = text.split(/\s+/);
        if (words.length <= maxWords) return text;
        
        return words.slice(0, maxWords).join(' ') + suffix;
    }
    
    /**
     * Convert to title case
     */
    titleCase(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    /**
     * Convert to sentence case
     */
    sentenceCase(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    
    /**
     * Convert to camel case
     */
    camelCase(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
            .replace(/^[A-Z]/, (match) => match.toLowerCase());
    }
    
    /**
     * Convert to kebab case
     */
    kebabCase(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }
    
    /**
     * Convert to snake case
     */
    snakeCase(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s-]+/g, '_')
            .toLowerCase();
    }
    
    /**
     * Capitalize first letter
     */
    capitalize(text) {
        if (!text || typeof text !== 'string') return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    /**
     * Convert to uppercase
     */
    uppercase(text) {
        if (!text || typeof text !== 'string') return '';
        return text.toUpperCase();
    }
    
    /**
     * Convert to lowercase
     */
    lowercase(text) {
        if (!text || typeof text !== 'string') return '';
        return text.toLowerCase();
    }
    
    // =========================================================================
    // PLURALIZATION
    // =========================================================================
    
    /**
     * Pluralize word based on count
     * @param {number} count - Count
     * @param {string} singular - Singular form
     * @param {string} plural - Plural form (optional)
     * @returns {string} Pluralized text with count
     */
    pluralize(count, singular, plural = null) {
        if (count === null || count === undefined || isNaN(count)) {
            count = 0;
        }
        
        const word = Math.abs(count) === 1 ? singular : (plural || singular + 's');
        return `${this.number(count)} ${word}`;
    }
    
    /**
     * Get plural form of word
     */
    plural(count, singular, plural = null) {
        if (count === null || count === undefined || isNaN(count)) {
            count = 0;
        }
        
        return Math.abs(count) === 1 ? singular : (plural || singular + 's');
    }
    
    // =========================================================================
    // LIST FORMATTING
    // =========================================================================
    
    /**
     * Format array as comma-separated list
     * @param {Array} items - Items to format
     * @param {string} conjunction - Conjunction word (default: 'and')
     * @returns {string} Formatted list
     */
    list(items, conjunction = 'and') {
        if (!Array.isArray(items) || items.length === 0) return '';
        
        if (items.length === 1) return String(items[0]);
        if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
        
        const allButLast = items.slice(0, -1).join(', ');
        const last = items[items.length - 1];
        
        return `${allButLast}, ${conjunction} ${last}`;
    }
    
    // =========================================================================
    // PHONE NUMBER FORMATTING
    // =========================================================================
    
    /**
     * Format phone number (US format)
     */
    phone(phoneNumber) {
        if (!phoneNumber) return '';
        
        const cleaned = String(phoneNumber).replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        }
        
        return phoneNumber;
    }
    
    // =========================================================================
    // SOCIAL MEDIA FORMATTING
    // =========================================================================
    
    /**
     * Format Instagram handle (add @ if missing)
     */
    instagramHandle(handle) {
        if (!handle) return '';
        const cleaned = handle.trim().replace('@', '');
        return '@' + cleaned;
    }
    
    /**
     * Format Twitter handle (add @ if missing)
     */
    twitterHandle(handle) {
        if (!handle) return '';
        const cleaned = handle.trim().replace('@', '');
        return '@' + cleaned;
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Set locale
     */
    setLocale(locale) {
        this.locale = locale;
        console.log(`💵 [FormatUtils] Locale set to ${locale}`);
    }
    
    /**
     * Get locale
     */
    getLocale() {
        return this.locale;
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraFormatUtils = new FormatUtils();

console.log('✅ [FormatUtils] Loaded and ready');
