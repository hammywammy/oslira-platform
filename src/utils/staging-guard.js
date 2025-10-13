// =============================================================================
// SECURE STAGING GUARD - RATE LIMITED & TAMPER-RESISTANT
// Prevents console manipulation and limits attempts
// =============================================================================
const DISABLE_LOGS_IN_PRODUCTION = true;
const DISABLE_LOGS_IN_STAGING = false;

const shouldDisableLogs = (
    (DISABLE_LOGS_IN_PRODUCTION && window.OsliraEnv.IS_PRODUCTION) ||
    (DISABLE_LOGS_IN_STAGING && window.OsliraEnv.IS_STAGING)
);

// *** IMPLEMENT LOG DISABLING WITH DYNAMIC MESSAGE ***
if (shouldDisableLogs) {
    const currentEnv = window.OsliraEnv.ENV;
    
    // Store original console methods
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug,
        trace: console.trace,
        group: console.group,
        groupEnd: console.groupEnd,
        groupCollapsed: console.groupCollapsed,
        table: console.table,
        time: console.time,
        timeEnd: console.timeEnd
    };
    
    // Override console methods with no-op functions
    console.log = function() {};
    console.warn = function() {};
    console.error = function() {};
    console.info = function() {};
    console.debug = function() {};
    console.trace = function() {};
    console.group = function() {};
    console.groupEnd = function() {};
    console.groupCollapsed = function() {};
    console.table = function() {};
    console.time = function() {};
    console.timeEnd = function() {};
    
    // Prevent console restoration attempts
    Object.defineProperty(window, 'console', {
        value: console,
        writable: false,
        configurable: false
    });
}

(function() {
    'use strict';
    
// Use centralized environment detection - NO DUPLICATE LOGIC
const isStaging = window.OsliraEnv.IS_STAGING;

if (!isStaging) { 
    console.log('🔓 Production environment - no password protection needed');
    return;
}

    
    console.log('🔒 Staging environment detected - secure protection check');
    
    // Security constants
    const SESSION_KEY = 'stg_auth_' + btoa(window.location.hostname).slice(0, 8);
    const ATTEMPTS_KEY = 'stg_attempts_' + btoa(window.location.hostname).slice(0, 8);
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const RATE_LIMIT_DURATION = 60 * 60 * 1000; // 1 hour
    const MAX_ATTEMPTS = 3;
    
    // Obfuscated key generation (makes it harder to guess localStorage keys)
    function generateSecureKey(base) {
        const timestamp = Math.floor(Date.now() / RATE_LIMIT_DURATION);
        return base + '_' + btoa(timestamp.toString()).slice(0, 6);
    }
    
    // Get current rate limit window
    function getCurrentWindow() {
        return Math.floor(Date.now() / RATE_LIMIT_DURATION);
    }
    
    // Check authentication with tamper detection
    function isAuthenticated() {
        try {
            const authData = localStorage.getItem(SESSION_KEY);
            if (!authData) return false;
            
            const parsed = JSON.parse(authData);
            const { timestamp, verified, checksum } = parsed;
            
            // Verify checksum to detect tampering
            const expectedChecksum = generateChecksum(timestamp, verified);
            if (checksum !== expectedChecksum) {
                console.warn('🛡️ Tampering detected - clearing auth');
                localStorage.removeItem(SESSION_KEY);
                return false;
            }
            
            const isExpired = Date.now() - timestamp > SESSION_DURATION;
            
            if (isExpired) {
                localStorage.removeItem(SESSION_KEY);
                return false;
            }
            
            return verified;
        } catch (error) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
    }
    
    // Generate checksum for tamper detection
    function generateChecksum(timestamp, verified) {
        const data = timestamp + verified + window.location.hostname;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    // Save authentication with tamper protection
    function saveAuthentication() {
        const timestamp = Date.now();
        const verified = true;
        const checksum = generateChecksum(timestamp, verified);
        
        const authData = {
            verified,
            timestamp,
            checksum
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(authData));
        
        // Clear failed attempts
        clearFailedAttempts();
    }
    
    // Check rate limiting
    function isRateLimited() {
        const currentWindow = getCurrentWindow();
        const attemptsKey = ATTEMPTS_KEY + '_' + currentWindow;
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
        
        return attempts >= MAX_ATTEMPTS;
    }
    
    // Record failed attempt
    function recordFailedAttempt() {
        const currentWindow = getCurrentWindow();
        const attemptsKey = ATTEMPTS_KEY + '_' + currentWindow;
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
        localStorage.setItem(attemptsKey, (attempts + 1).toString());
        
        // Clean up old attempt records
        cleanupOldAttempts();
    }
    
    // Clear failed attempts for current window
    function clearFailedAttempts() {
        const currentWindow = getCurrentWindow();
        const attemptsKey = ATTEMPTS_KEY + '_' + currentWindow;
        localStorage.removeItem(attemptsKey);
    }
    
    // Get remaining attempts
    function getRemainingAttempts() {
        const currentWindow = getCurrentWindow();
        const attemptsKey = ATTEMPTS_KEY + '_' + currentWindow;
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
        return Math.max(0, MAX_ATTEMPTS - attempts);
    }
    
    // Get time until rate limit resets
    function getTimeUntilReset() {
        const currentWindow = getCurrentWindow();
        const nextWindow = (currentWindow + 1) * RATE_LIMIT_DURATION;
        return nextWindow - Date.now();
    }
    
    // Clean up old attempt records
    function cleanupOldAttempts() {
        const currentWindow = getCurrentWindow();
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(ATTEMPTS_KEY)) {
                const windowFromKey = key.split('_').pop();
                if (windowFromKey && parseInt(windowFromKey) < currentWindow - 1) {
                    localStorage.removeItem(key);
                }
            }
        });
    }
    
    // Format time remaining
    function formatTimeRemaining(ms) {
        const minutes = Math.ceil(ms / (1000 * 60));
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    }
    
    // Block page content immediately if not authenticated
    if (!isAuthenticated()) {
        console.log('🔒 Staging access required - blocking page');
        
        // Hide the entire page
        document.documentElement.style.visibility = 'hidden';
        
        // Show protection when DOM is ready
        const showProtection = () => {
            if (isRateLimited()) {
                showRateLimitMessage();
            } else {
                createPasswordPrompt();
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showProtection);
        } else {
            showProtection();
        }
    } else {
        console.log('✅ Staging access verified - allowing page access');
    }
    
    // Show rate limit message
    function showRateLimitMessage() {
        document.documentElement.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';
        
        const timeRemaining = getTimeUntilReset();
        
        const overlay = document.createElement('div');
        overlay.id = 'staging-rate-limit-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        `;
        
        modal.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 8px 0; color: #dc2626; font-size: 24px; font-weight: 600;">
                    🚫 Too Many Attempts
                </h2>
                <p style="margin: 0; color: #6b7280; font-size: 16px;">
                    You've exceeded the maximum number of password attempts.<br>
                    Please try again in <strong>${formatTimeRemaining(timeRemaining)}</strong>.
                </p>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                    <strong>Security Notice:</strong><br>
                    Maximum ${MAX_ATTEMPTS} attempts per hour to protect against unauthorized access.
                </p>
            </div>
            
            <button 
                onclick="window.location.reload()"
                style="
                    width: 100%;
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                "
                onmouseover="this.style.background='#4b5563'"
                onmouseout="this.style.background='#6b7280'"
            >
                Refresh Page
            </button>
            
            <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                Rate limit resets automatically
            </p>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
    
    // Create password prompt overlay
    function createPasswordPrompt() {
        // Get password from API
        fetch('/api/config')
            .then(response => response.json())
            .then(config => {
                const STAGING_PASSWORD = config.stagingPassword;
                
                if (!STAGING_PASSWORD) {
                    console.log('🔓 No staging password configured - allowing access');
                    document.documentElement.style.visibility = 'visible';
                    return;
                }
                
                showPasswordModal(STAGING_PASSWORD);
            })
            .catch(error => {
                console.error('Failed to load staging config:', error);
                document.documentElement.style.visibility = 'visible';
            });
    }
    
    function showPasswordModal(STAGING_PASSWORD) {
        document.documentElement.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';
        
        const remainingAttempts = getRemainingAttempts();
        
        const overlay = document.createElement('div');
        overlay.id = 'staging-password-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        `;
        
        modal.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                    🔒 Staging Environment
                </h2>
                <p style="margin: 0; color: #6b7280; font-size: 16px;">
                    This is a development environment.<br>
                    Please enter the access password to continue.
                </p>
            </div>
            
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px; margin: 16px 0;">
                <p style="margin: 0; color: #9a3412; font-size: 14px;">
                    <strong>Attempts remaining:</strong> ${remainingAttempts} of ${MAX_ATTEMPTS}
                </p>
            </div>
            
            <form id="staging-password-form" style="margin-bottom: 20px;">
                <input 
                    type="password" 
                    id="staging-password-input"
                    placeholder="Enter staging password"
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 16px;
                        margin-bottom: 16px;
                        box-sizing: border-box;
                        outline: none;
                    "
                    autocomplete="current-password"
                    required
                />
                <button 
                    type="submit"
                    style="
                        width: 100%;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.2s;
                    "
                >
                    Access Staging Environment
                </button>
            </form>
            
            <div id="staging-error-message" style="
                color: #dc2626;
                font-size: 14px;
                margin-top: 12px;
                display: none;
            "></div>
            
            <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                Environment: ${window.OsliraEnv.hostname}<br>
                Rate limited: ${MAX_ATTEMPTS} attempts per hour
            </p>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Focus on input
        const input = document.getElementById('staging-password-input');
        setTimeout(() => input.focus(), 100);
        
        // Handle form submission
        const form = document.getElementById('staging-password-form');
        const errorDiv = document.getElementById('staging-error-message');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const enteredPassword = input.value.trim();
            
            if (enteredPassword === STAGING_PASSWORD) {
                console.log('✅ Staging password correct - granting access');
                saveAuthentication();
                document.body.removeChild(overlay);
                document.body.style.overflow = '';
                showSuccessMessage();
            } else {
                console.log('❌ Staging password incorrect');
                recordFailedAttempt();
                
                const newRemainingAttempts = getRemainingAttempts();
                
                if (newRemainingAttempts === 0) {
                    // Rate limited - reload to show rate limit screen
                    window.location.reload();
                } else {
                    // Update attempts remaining display
                    const attemptsDisplay = modal.querySelector('div[style*="background: #fff7ed"] p');
                    if (attemptsDisplay) {
                        attemptsDisplay.innerHTML = `<strong>Attempts remaining:</strong> ${newRemainingAttempts} of ${MAX_ATTEMPTS}`;
                    }
                    
                    errorDiv.textContent = `Incorrect password. ${newRemainingAttempts} attempts remaining.`;
                    errorDiv.style.display = 'block';
                    input.value = '';
                    input.focus();
                    
                    // Shake animation
                    modal.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        modal.style.animation = '';
                    }, 500);
                }
            }
        });
        
        // Add shake animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 20%, 40%, 60%, 80% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Show success message
    function showSuccessMessage() {
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
        `;
        success.textContent = '✅ Access granted to staging environment';
        
        document.body.appendChild(success);
        
        setTimeout(() => {
            success.style.opacity = '0';
            success.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(success)) {
                    document.body.removeChild(success);
                }
            }, 300);
        }, 3000);
    }
    
    // Tamper protection - make it harder to bypass via console
    Object.defineProperty(window, 'stagingBypass', {
        get: function() {
            console.warn('🛡️ Staging bypass attempt detected');
            recordFailedAttempt();
            return undefined;
        },
        configurable: false
    });
    
    // Hide internal functions from global scope
    // (they're already in IIFE, but this adds extra protection)
    
})();
