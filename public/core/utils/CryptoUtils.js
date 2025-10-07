// =============================================================================
// CRYPTO UTILS - Cryptographic Utilities
// Path: /public/core/utils/CryptoUtils.js
// Dependencies: Web Crypto API
// =============================================================================

/**
 * @class CryptoUtils
 * @description Cryptographic utilities for secure IDs, hashing, and encryption
 * 
 * Features:
 * - Generate secure random IDs
 * - SHA-256 hashing
 * - Base64 encoding/decoding
 * - UUID generation
 * - Random string generation
 * 
 * Note: Uses Web Crypto API (available in modern browsers)
 */
class CryptoUtils {
    constructor() {
        this.crypto = window.crypto || window.msCrypto;
        
        if (!this.crypto) {
            console.warn('⚠️ [CryptoUtils] Web Crypto API not available');
        }
        
        console.log('🔐 [CryptoUtils] Initialized');
    }
    
    // =========================================================================
    // RANDOM ID GENERATION
    // =========================================================================
    
    /**
     * Generate random UUID v4
     * @returns {string} UUID
     */
    uuid() {
        if (this.crypto && this.crypto.randomUUID) {
            return this.crypto.randomUUID();
        }
        
        // Fallback implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    
    /**
     * Generate short random ID (8 characters)
     * @returns {string} Random ID
     */
    shortId() {
        const array = new Uint8Array(6);
        this.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(36)).join('').substring(0, 8);
    }
    
    /**
     * Generate random ID with custom length
     * @param {number} length - Length of ID
     * @returns {string} Random ID
     */
    randomId(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const array = new Uint8Array(length);
        this.crypto.getRandomValues(array);
        
        return Array.from(array, byte => chars[byte % chars.length]).join('');
    }
    
    /**
     * Generate random hex string
     * @param {number} length - Length in bytes
     * @returns {string} Hex string
     */
    randomHex(length = 16) {
        const array = new Uint8Array(length);
        this.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Generate random number between min and max
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {number} Random number
     */
    randomNumber(min, max) {
        const range = max - min + 1;
        const array = new Uint32Array(1);
        this.crypto.getRandomValues(array);
        return min + (array[0] % range);
    }
    
    /**
     * Generate random string with custom charset
     * @param {number} length - Length of string
     * @param {string} charset - Character set to use
     * @returns {string} Random string
     */
    randomString(length = 16, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        const array = new Uint8Array(length);
        this.crypto.getRandomValues(array);
        return Array.from(array, byte => charset[byte % charset.length]).join('');
    }
    
    // =========================================================================
    // HASHING
    // =========================================================================
    
    /**
     * Generate SHA-256 hash
     * @param {string} message - Message to hash
     * @returns {Promise<string>} Hex hash
     */
    async sha256(message) {
        if (!this.crypto || !this.crypto.subtle) {
            throw new Error('Web Crypto API not available');
        }
        
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const hashBuffer = await this.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('❌ [CryptoUtils] SHA-256 hash failed:', error);
            throw error;
        }
    }
    
    /**
     * Generate SHA-1 hash (less secure, use sha256 when possible)
     * @param {string} message - Message to hash
     * @returns {Promise<string>} Hex hash
     */
    async sha1(message) {
        if (!this.crypto || !this.crypto.subtle) {
            throw new Error('Web Crypto API not available');
        }
        
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const hashBuffer = await this.crypto.subtle.digest('SHA-1', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('❌ [CryptoUtils] SHA-1 hash failed:', error);
            throw error;
        }
    }
    
    /**
     * Generate simple hash code (non-cryptographic)
     * @param {string} str - String to hash
     * @returns {number} Hash code
     */
    hashCode(str) {
        if (!str || typeof str !== 'string') return 0;
        
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    // =========================================================================
    // BASE64 ENCODING/DECODING
    // =========================================================================
    
    /**
     * Encode string to base64
     * @param {string} str - String to encode
     * @returns {string} Base64 encoded string
     */
    base64Encode(str) {
        if (!str || typeof str !== 'string') return '';
        
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (error) {
            console.error('❌ [CryptoUtils] Base64 encode failed:', error);
            return '';
        }
    }
    
    /**
     * Decode base64 string
     * @param {string} str - Base64 string to decode
     * @returns {string} Decoded string
     */
    base64Decode(str) {
        if (!str || typeof str !== 'string') return '';
        
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (error) {
            console.error('❌ [CryptoUtils] Base64 decode failed:', error);
            return '';
        }
    }
    
    /**
     * Encode ArrayBuffer to base64
     * @param {ArrayBuffer} buffer - Buffer to encode
     * @returns {string} Base64 string
     */
    bufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
        return btoa(binary);
    }
    
    /**
     * Decode base64 to ArrayBuffer
     * @param {string} base64 - Base64 string
     * @returns {ArrayBuffer} Buffer
     */
    base64ToBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    // =========================================================================
    // URL-SAFE ENCODING
    // =========================================================================
    
    /**
     * Encode string to URL-safe base64
     * @param {string} str - String to encode
     * @returns {string} URL-safe base64
     */
    base64UrlEncode(str) {
        const base64 = this.base64Encode(str);
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
    
    /**
     * Decode URL-safe base64
     * @param {string} str - URL-safe base64 to decode
     * @returns {string} Decoded string
     */
    base64UrlDecode(str) {
        let base64 = str
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Add padding
        const padding = base64.length % 4;
        if (padding) {
            base64 += '='.repeat(4 - padding);
        }
        
        return this.base64Decode(base64);
    }
    
    // =========================================================================
    // SIMPLE OBFUSCATION (NOT CRYPTOGRAPHICALLY SECURE)
    // =========================================================================
    
    /**
     * Simple XOR obfuscation (NOT secure, just basic obfuscation)
     * @param {string} str - String to obfuscate
     * @param {string} key - Obfuscation key
     * @returns {string} Obfuscated hex string
     */
    obfuscate(str, key = 'oslira') {
        if (!str || typeof str !== 'string') return '';
        
        let result = '';
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += charCode.toString(16).padStart(2, '0');
        }
        return result;
    }
    
    /**
     * Deobfuscate XOR string
     * @param {string} hex - Obfuscated hex string
     * @param {string} key - Obfuscation key
     * @returns {string} Original string
     */
    deobfuscate(hex, key = 'oslira') {
        if (!hex || typeof hex !== 'string') return '';
        
        let result = '';
        for (let i = 0; i < hex.length; i += 2) {
            const charCode = parseInt(hex.substr(i, 2), 16) ^ key.charCodeAt((i / 2) % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    }
    
    // =========================================================================
    // TOKEN GENERATION
    // =========================================================================
    
    /**
     * Generate secure token
     * @param {number} length - Token length in bytes
     * @returns {string} Hex token
     */
    generateToken(length = 32) {
        return this.randomHex(length);
    }
    
    /**
     * Generate API key
     * @returns {string} API key
     */
    generateApiKey() {
        const prefix = 'oslira';
        const token = this.randomHex(20);
        return `${prefix}_${token}`;
    }
    
    /**
     * Generate session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `sess_${this.randomHex(24)}`;
    }
    
    // =========================================================================
    // VERIFICATION
    // =========================================================================
    
    /**
     * Generate verification code (6 digits)
     * @returns {string} Verification code
     */
    generateVerificationCode() {
        return this.randomNumber(100000, 999999).toString();
    }
    
    /**
     * Generate OTP (One-Time Password)
     * @param {number} length - OTP length
     * @returns {string} OTP
     */
    generateOTP(length = 6) {
        const array = new Uint8Array(length);
        this.crypto.getRandomValues(array);
        return Array.from(array, byte => (byte % 10).toString()).join('');
    }
    
    // =========================================================================
    // COLOR GENERATION
    // =========================================================================
    
    /**
     * Generate random color hex
     * @returns {string} Color hex (e.g., #FF5733)
     */
    randomColor() {
        const hex = this.randomHex(3);
        return '#' + hex.toUpperCase();
    }
    
    /**
     * Generate consistent color from string (same string = same color)
     * @param {string} str - Input string
     * @returns {string} Color hex
     */
    colorFromString(str) {
        const hash = this.hashCode(str);
        const r = (hash & 0xFF0000) >> 16;
        const g = (hash & 0x00FF00) >> 8;
        const b = hash & 0x0000FF;
        
        return '#' + [r, g, b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Check if Web Crypto API is available
     * @returns {boolean} Available or not
     */
    isAvailable() {
        return !!(this.crypto && this.crypto.subtle);
    }
    
    /**
     * Get random bytes
     * @param {number} length - Number of bytes
     * @returns {Uint8Array} Random bytes
     */
    getRandomBytes(length) {
        const array = new Uint8Array(length);
        this.crypto.getRandomValues(array);
        return array;
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraCryptoUtils = new CryptoUtils();

console.log('✅ [CryptoUtils] Loaded and ready');
