// =============================================================================
// ADMIN GUARD - Password Protection for Admin Panel
// Minimal, clean implementation - no script loading
// =============================================================================

(function() {
    'use strict';
    
    console.log('🔒 [AdminGuard] Initializing protection...');
    
    // Security constants
    const SESSION_KEY = 'admin_auth_' + btoa(window.location.hostname).slice(0, 8);
    const ATTEMPTS_KEY = 'admin_attempts_' + btoa(window.location.hostname).slice(0, 8);
    const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
    const RATE_LIMIT_DURATION = 60 * 60 * 1000; // 1 hour
    const MAX_ATTEMPTS = 5;
    
    // Block page immediately
    document.documentElement.style.visibility = 'hidden';
    document.documentElement.style.opacity = '0';
    
    // Generate checksum for tamper detection
    function generateChecksum(timestamp, verified) {
        const data = timestamp + verified + window.location.hostname;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    // Check if already authenticated
    function isAuthenticated() {
        try {
            const authData = localStorage.getItem(SESSION_KEY);
            if (!authData) return false;
            
            const parsed = JSON.parse(authData);
            const { timestamp, verified, checksum, userId } = parsed;
            
            if (!timestamp || !verified || !checksum || !userId) {
                localStorage.removeItem(SESSION_KEY);
                return false;
            }
            
            const expectedChecksum = generateChecksum(timestamp, verified);
            if (checksum !== expectedChecksum) {
                localStorage.removeItem(SESSION_KEY);
                return false;
            }
            
            const isExpired = Date.now() - timestamp > SESSION_DURATION;
            if (isExpired) {
                localStorage.removeItem(SESSION_KEY);
                return false;
            }
            
            return verified && userId;
        } catch (error) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
    }
    
    function saveAuthentication(userId) {
        const timestamp = Date.now();
        const verified = true;
        const checksum = generateChecksum(timestamp, verified);
        
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            verified,
            timestamp,
            checksum,
            userId
        }));
        
        clearFailedAttempts();
    }
    
    // Rate limiting
    function getCurrentWindow() {
        return Math.floor(Date.now() / RATE_LIMIT_DURATION);
    }
    
    function isRateLimited() {
        const currentWindow = getCurrentWindow();
        const attemptsKey = ATTEMPTS_KEY + '_' + currentWindow;
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
        return attempts >= MAX_ATTEMPTS;
    }
    
    function recordFailedAttempt() {
        const currentWindow = getCurrentWindow();
        const attemptsKey = ATTEMPTS_KEY + '_' + currentWindow;
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
        localStorage.setItem(attemptsKey, (attempts + 1).toString());
    }
    
    function clearFailedAttempts() {
        const currentWindow = getCurrentWindow();
        const attemptsKey = ATTEMPTS_KEY + '_' + currentWindow;
        localStorage.removeItem(attemptsKey);
    }
    
    function getRemainingAttempts() {
        const currentWindow = getCurrentWindow();
        const attemptsKey = ATTEMPTS_KEY + '_' + currentWindow;
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
        return Math.max(0, MAX_ATTEMPTS - attempts);
    }
    
    function getTimeUntilReset() {
        const currentWindow = getCurrentWindow();
        const nextWindow = (currentWindow + 1) * RATE_LIMIT_DURATION;
        return nextWindow - Date.now();
    }
    
    function formatTimeRemaining(ms) {
        const minutes = Math.ceil(ms / (1000 * 60));
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    }
    
    function showRateLimitScreen() {
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
        document.body.innerHTML = '';
        
        const timeRemaining = getTimeUntilReset();
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 48px; border-radius: 16px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); text-align: center; max-width: 450px; width: 90%;">
                <div style="font-size: 64px; margin-bottom: 24px;">🚫</div>
                <h2 style="margin: 0 0 16px 0; color: #dc2626; font-size: 28px; font-weight: 700;">Too Many Attempts</h2>
                <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px;">Please try again in <strong>${formatTimeRemaining(timeRemaining)}</strong>.</p>
                <button onclick="window.location.href='/dashboard'" style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;">
                    Return to Dashboard
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    async function showPasswordPrompt(userId) {
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
        document.body.innerHTML = '';
        
        // Fetch admin token
        let ADMIN_TOKEN;
        try {
            const apiUrl = window.OsliraEnv?.WORKER_URL || 'https://api.oslira.com';
            const response = await fetch(`${apiUrl}/config/public`);
            const config = await response.json();
            ADMIN_TOKEN = config.data?.adminToken;
            
            if (!ADMIN_TOKEN) {
                console.log('⚠️ [AdminGuard] No admin token - allowing access');
                allowAccess(userId);
                return;
            }
        } catch (error) {
            console.error('❌ [AdminGuard] Config fetch failed:', error);
            showError('Failed to load configuration. Please refresh.');
            return;
        }
        
        const remainingAttempts = getRemainingAttempts();
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 48px; border-radius: 16px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); text-align: center; max-width: 450px; width: 90%;">
                <div style="font-size: 64px; margin-bottom: 24px;">🔐</div>
                <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 28px; font-weight: 700;">Admin Panel Access</h2>
                <p style="margin: 0 0 32px 0; color: #64748b; font-size: 16px;">Enter the admin password to continue.</p>
                <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 16px; margin: 0 0 24px 0;">
                    <p style="margin: 0; color: #9a3412; font-size: 14px; font-weight: 600;">Attempts: ${remainingAttempts}/${MAX_ATTEMPTS}</p>
                </div>
                <form id="admin-password-form">
                    <input type="password" id="admin-password-input" placeholder="Enter password" style="width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 16px; margin-bottom: 16px; box-sizing: border-box;" required />
                    <button type="submit" style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;">Access Panel</button>
                </form>
                <div id="admin-error" style="color: #dc2626; font-size: 14px; padding: 12px; background: #fef2f2; border-radius: 8px; margin-top: 16px; display: none;"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const input = document.getElementById('admin-password-input');
        const form = document.getElementById('admin-password-form');
        const errorDiv = document.getElementById('admin-error');
        
        setTimeout(() => input.focus(), 100);
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = input.value.trim();
            if (!password) return;
            
            const submitBtn = form.querySelector('button');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
            
            try {
                const response = await fetch(`${window.OsliraEnv.WORKER_URL}/admin/verify-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password, userId })
                });
                
                const result = await response.json();
                
                if (result.success && result.data?.valid) {
                    saveAuthentication(userId);
                    allowAccess(userId);
                } else {
                    recordFailedAttempt();
                    const newRemaining = getRemainingAttempts();
                    
                    if (newRemaining === 0) {
                        showRateLimitScreen();
                    } else {
                        errorDiv.textContent = `Incorrect. ${newRemaining} ${newRemaining === 1 ? 'attempt' : 'attempts'} left.`;
                        errorDiv.style.display = 'block';
                        input.value = '';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Access Panel';
                    }
                }
            } catch (error) {
                errorDiv.textContent = 'Verification failed. Try again.';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Access Panel';
            }
        });
    }
    
    function showError(message) {
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
        document.body.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="background: white; padding: 48px; border-radius: 16px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); text-align: center; max-width: 500px; width: 90%;">
                    <div style="font-size: 64px; margin-bottom: 24px;">⚠️</div>
                    <h2 style="margin: 0 0 16px 0; color: #dc2626; font-size: 28px; font-weight: 700;">Error</h2>
                    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px;">${message}</p>
                    <button onclick="window.location.reload()" style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;">Reload</button>
                </div>
            </div>
        `;
    }
    
    function allowAccess(userId) {
        console.log('✅ [AdminGuard] Access granted');
        
        document.querySelectorAll('style').forEach(style => {
            if (style.textContent.includes('visibility: hidden')) {
                style.remove();
            }
        });
        
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
        document.body.style.overflow = '';
        
        document.body.innerHTML = `
            <main id="admin-main-content" class="admin-main-content">
                <div id="admin-content-container" class="admin-content-container">
                    <div id="admin-loading" class="admin-loading-state">
                        <div class="loading-spinner"></div>
                        <p class="text-slate-600 mt-4">Loading admin panel...</p>
                    </div>
                    <div id="admin-error" class="admin-error-state hidden">
                        <div class="error-icon">⚠️</div>
                        <h2>Something went wrong</h2>
                        <p id="admin-error-message"></p>
                        <button onclick="location.reload()">Reload</button>
                    </div>
                    <div id="admin-section-content" class="admin-section-content hidden"></div>
                </div>
            </main>
            <div id="admin-toast-container"></div>
            <div id="admin-modals-container"></div>
        `;
        
        window.dispatchEvent(new CustomEvent('admin:guard:passed', { detail: { userId } }));
        window.ADMIN_AUTHORIZED = true;
        
        console.log('🚀 [AdminGuard] Ready for script loader');
    }
    
    async function executeGuard() {
        console.log('🚀 [AdminGuard] Starting...');
        
        try {
            // Step 1: Check cached password session
            if (isAuthenticated()) {
                const authData = JSON.parse(localStorage.getItem(SESSION_KEY));
                allowAccess(authData.userId);
                return;
            }
            
            // Step 2: Check rate limit
            if (isRateLimited()) {
                showRateLimitScreen();
                return;
            }
            
            // Step 3: Verify OsliraEnv loaded
            if (!window.OsliraEnv) {
                showError('Core dependencies not loaded. Please refresh.');
                return;
            }
            
            // Step 4: Show password prompt
            const mockUserId = 'temp-admin-user';
            await showPasswordPrompt(mockUserId);
            
        } catch (error) {
            console.error('❌ [AdminGuard] Fatal error:', error);
            showError('Initialization failed. Please refresh.');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeGuard);
    } else {
        executeGuard();
    }
    
    window.clearAdminSession = function() {
        localStorage.removeItem(SESSION_KEY);
        const currentWindow = getCurrentWindow();
        localStorage.removeItem(ATTEMPTS_KEY + '_' + currentWindow);
        window.location.reload();
    };
    
})();
