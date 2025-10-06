// =============================================================================
// ADMIN GUARD - Password Protection for Admin Panel
// Blocks ALL content until admin status + password verified
// Must run BEFORE any other admin scripts
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
async function isAuthenticated() {
    const authData = localStorage.getItem(SESSION_KEY);
    if (!authData) return false;
    
    // Existing validation...
    const parsed = JSON.parse(authData);
    
    // ADD: Server-side session validation
    try {
        const response = await fetch(`${window.OsliraEnv.getWorkerUrl()}/admin/validate-session`, {
            headers: {
                'Authorization': `Bearer ${await window.OsliraAuth.getToken()}`,
                'X-Session-ID': parsed.checksum
            }
        });
        return response.ok;
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return false;
    }
}
    
    // Save authentication
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
    
    // Rate limiting functions
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
    
    // Wait for environment to be ready
    async function waitForEnvironment() {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.OsliraEnv && window.OsliraAuth) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(check);
                resolve();
            }, 10000);
        });
    }
    
async function verifyAdminAccess() {
    try {
        if (!window.OsliraAuth) {
            throw new Error('Auth system not available');
        }
        
        await window.OsliraAuth.waitForAuth();
        
        if (!window.OsliraAuth.isAuthenticated()) {
            console.log('🚫 [AdminGuard] User not authenticated');
            window.location.href = window.OsliraEnv.getAuthUrl();
            return false;
        }
        
        const user = window.OsliraAuth.getCurrentUser();
        
        // Check if user is admin (check both possible locations)
        const isAdmin = user.user_metadata?.is_admin || user.is_admin;
        
        if (!isAdmin) {
            console.log('🚫 [AdminGuard] User is not admin, redirecting to dashboard');
            // Show a message before redirecting
            document.body.innerHTML = `
                <div style="
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
                ">
                    <div style="
                        background: white;
                        padding: 48px;
                        border-radius: 16px;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                        text-align: center;
                        max-width: 450px;
                        width: 90%;
                    ">
                        <div style="font-size: 64px; margin-bottom: 24px;">🚫</div>
                        <h2 style="margin: 0 0 16px 0; color: #dc2626; font-size: 28px; font-weight: 700;">
                            Access Denied
                        </h2>
                        <p style="margin: 0 0 32px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                            You do not have administrator privileges.<br>
                            This area is restricted to admin users only.
                        </p>
                        <button 
                            onclick="window.location.href='${window.OsliraEnv.getAppUrl('/dashboard')}'"
                            style="
                                width: 100%;
                                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                                color: white;
                                border: none;
                                padding: 14px;
                                border-radius: 10px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                            "
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            `;
            document.documentElement.style.visibility = 'visible';
            document.documentElement.style.opacity = '1';
            return false;
        }
        
        console.log('✅ [AdminGuard] Admin status verified');
        return user.id;
            
            console.log('✅ [AdminGuard] Admin status verified');
            return user.id;
            
        } catch (error) {
            console.error('❌ [AdminGuard] Admin verification failed:', error);
            return false;
        }
    }
    
    // Show rate limit message
    function showRateLimitScreen() {
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
        document.body.innerHTML = '';
        document.body.style.overflow = 'hidden';
        
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
            <div style="
                background: white;
                padding: 48px;
                border-radius: 16px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                text-align: center;
                max-width: 450px;
                width: 90%;
            ">
                <div style="font-size: 64px; margin-bottom: 24px;">🚫</div>
                <h2 style="margin: 0 0 16px 0; color: #dc2626; font-size: 28px; font-weight: 700;">
                    Too Many Attempts
                </h2>
                <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                    You've exceeded the maximum number of admin password attempts.<br>
                    Please try again in <strong style="color: #1e293b;">${formatTimeRemaining(timeRemaining)}</strong>.
                </p>
                
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                        <strong>Security Notice:</strong><br>
                        Maximum ${MAX_ATTEMPTS} attempts per hour to protect against unauthorized access.
                    </p>
                </div>
                
                <button 
                    onclick="window.location.href='${window.OsliraEnv?.getAppUrl('/dashboard') || '/dashboard'}'"
                    style="
                        width: 100%;
                        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                        color: white;
                        border: none;
                        padding: 14px;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 20px rgba(59, 130, 246, 0.3)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                >
                    Return to Dashboard
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    // Show password prompt
    async function showPasswordPrompt(userId) {
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
        document.body.innerHTML = '';
        document.body.style.overflow = 'hidden';
        
        // Fetch admin token from backend
        let ADMIN_TOKEN;
        try {
            const apiUrl = window.OsliraEnv.getConfig('apiUrl') || 'https://api.oslira.com';
            const token = window.OsliraAuth.getSession()?.access_token;
            
            const response = await fetch(`${apiUrl}/config/public`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const config = await response.json();
            ADMIN_TOKEN = config.data?.adminToken;
            
            if (!ADMIN_TOKEN) {
                console.log('⚠️ [AdminGuard] No admin token configured - allowing access');
                allowAccess(userId);
                return;
            }
            
        } catch (error) {
            console.error('❌ [AdminGuard] Failed to fetch admin token:', error);
            showError('Failed to load configuration. Please refresh.');
            return;
        }
        
        const remainingAttempts = getRemainingAttempts();
        
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
            <div style="
                background: white;
                padding: 48px;
                border-radius: 16px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                text-align: center;
                max-width: 450px;
                width: 90%;
            ">
                <div style="font-size: 64px; margin-bottom: 24px;">🔐</div>
                <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 28px; font-weight: 700;">
                    Admin Panel Access
                </h2>
                <p style="margin: 0 0 32px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                    This area requires additional verification.<br>
                    Enter the admin password to continue.
                </p>
                
                <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 16px; margin: 0 0 24px 0;">
                    <p style="margin: 0; color: #9a3412; font-size: 14px; font-weight: 600;">
                        Attempts remaining: ${remainingAttempts} of ${MAX_ATTEMPTS}
                    </p>
                </div>
                
                <form id="admin-password-form" style="margin-bottom: 24px;">
                    <input 
                        type="password" 
                        id="admin-password-input"
                        placeholder="Enter admin password"
                        style="
                            width: 100%;
                            padding: 14px;
                            border: 2px solid #e2e8f0;
                            border-radius: 10px;
                            font-size: 16px;
                            margin-bottom: 16px;
                            box-sizing: border-box;
                            outline: none;
                            transition: border-color 0.2s;
                        "
                        onfocus="this.style.borderColor='#3b82f6'"
                        onblur="this.style.borderColor='#e2e8f0'"
                        autocomplete="current-password"
                        required
                    />
                    <button 
                        type="submit"
                        style="
                            width: 100%;
                            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                            color: white;
                            border: none;
                            padding: 14px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: transform 0.2s, box-shadow 0.2s;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 20px rgba(59, 130, 246, 0.3)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                    >
                        Access Admin Panel
                    </button>
                </form>
                
                <div id="admin-error-message" style="
                    color: #dc2626;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 12px;
                    background: #fef2f2;
                    border-radius: 8px;
                    margin-top: 16px;
                    display: none;
                "></div>
                
                <button 
                    onclick="window.location.href='${window.OsliraEnv?.getAppUrl('/dashboard') || '/dashboard'}'"
                    style="
                        width: 100%;
                        background: transparent;
                        color: #64748b;
                        border: 2px solid #e2e8f0;
                        padding: 12px;
                        border-radius: 10px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-top: 16px;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.borderColor='#cbd5e1'; this.style.color='#475569'"
                    onmouseout="this.style.borderColor='#e2e8f0'; this.style.color='#64748b'"
                >
                    Return to Dashboard
                </button>
                
                <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 12px;">
                    Environment: ${window.OsliraEnv?.hostname || 'unknown'}<br>
                    Rate limited: ${MAX_ATTEMPTS} attempts per hour
                </p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Focus input
        const input = document.getElementById('admin-password-input');
        const form = document.getElementById('admin-password-form');
        const errorDiv = document.getElementById('admin-error-message');
        const modal = overlay.querySelector('div');
        
        setTimeout(() => input.focus(), 100);
        
// Handle form submission
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const enteredPassword = input.value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (!enteredPassword) {
        errorDiv.textContent = 'Please enter a password';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Disable button during verification
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
    submitBtn.style.opacity = '0.6';
    
    try {
        // Call backend to verify password
        const response = await fetch(`${window.OsliraEnv.getWorkerUrl()}/admin/verify-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: enteredPassword,
                userId: userId
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data?.valid) {
            console.log('✅ [AdminGuard] Admin password correct');
            saveAuthentication(userId);
            allowAccess(userId);
        } else {
            console.log('❌ [AdminGuard] Admin password incorrect');
            recordFailedAttempt();
            
            const newRemaining = getRemainingAttempts();
            
            if (newRemaining === 0) {
                showRateLimitScreen();
            } else {
                const attemptsDisplay = modal.querySelector('div[style*="background: #fff7ed"] p');
                if (attemptsDisplay) {
                    attemptsDisplay.textContent = `Attempts remaining: ${newRemaining} of ${MAX_ATTEMPTS}`;
                }
                
                errorDiv.textContent = `Incorrect password. ${newRemaining} ${newRemaining === 1 ? 'attempt' : 'attempts'} remaining.`;
                errorDiv.style.display = 'block';
                input.value = '';
                input.focus();
                
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Access Admin Panel';
                submitBtn.style.opacity = '1';
            }
        }
    } catch (error) {
        console.error('❌ [AdminGuard] Password verification failed:', error);
        errorDiv.textContent = 'Verification failed. Please try again.';
        errorDiv.style.display = 'block';
        
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Access Admin Panel';
        submitBtn.style.opacity = '1';
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
    
 // Show error screen with details
function showError(message, details = null) {
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';
    document.body.innerHTML = '';
    document.body.style.overflow = 'hidden';
    
    console.error('❌ [AdminGuard] Error:', message, details);
    
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
        padding: 20px;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            text-align: center;
            max-width: 500px;
            width: 90%;
        ">
            <div style="font-size: 64px; margin-bottom: 24px;">⚠️</div>
            <h2 style="margin: 0 0 16px 0; color: #dc2626; font-size: 28px; font-weight: 700;">
                Initialization Error
            </h2>
            <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                ${message}
            </p>
            ${details ? `
                <details style="text-align: left; margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; font-family: monospace; color: #475569;">
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">Technical Details</summary>
                    <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">${JSON.stringify(details, null, 2)}</pre>
                </details>
            ` : ''}
            <button 
                onclick="window.location.reload()"
                style="
                    width: 100%;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                "
            >
                Reload Page
            </button>
            <button 
                onclick="localStorage.clear(); window.location.reload()"
                style="
                    width: 100%;
                    background: transparent;
                    color: #64748b;
                    border: 2px solid #e2e8f0;
                    padding: 12px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 12px;
                "
            >
                Clear Cache & Reload
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Main guard execution
async function executeGuard() {
    console.log('🚀 [AdminGuard] Starting execution...');
    
    try {
        // Step 1: Wait for environment
        console.log('⏳ [AdminGuard] Waiting for environment...');
        await waitForEnvironment();
        console.log('✅ [AdminGuard] Environment ready');
        
        // Step 2: Check if already authenticated with password
        if (isAuthenticated()) {
            const authData = JSON.parse(localStorage.getItem(SESSION_KEY));
            console.log('✅ [AdminGuard] Valid session found, allowing access');
            allowAccess(authData.userId);
            return;
        }
        
        // Step 3: Check rate limit
        if (isRateLimited()) {
            console.log('🚫 [AdminGuard] Rate limited');
            showRateLimitScreen();
            return;
        }
        
        // Step 4: Verify user is authenticated with Supabase
        console.log('🔐 [AdminGuard] Checking Supabase authentication...');
        if (!window.OsliraAuth) {
            throw new Error('OsliraAuth not available. Please refresh the page.');
        }
        
        await window.OsliraAuth.waitForAuth();
        
        if (!window.OsliraAuth.isAuthenticated()) {
            console.log('🚫 [AdminGuard] User not authenticated with Supabase');
            window.location.href = window.OsliraEnv.getAuthUrl();
            return;
        }
        
        console.log('✅ [AdminGuard] Supabase authentication verified');
        
        // Step 5: Check admin status
        console.log('🔍 [AdminGuard] Verifying admin status...');
        const user = window.OsliraAuth.getCurrentUser();
        
        if (!user) {
            throw new Error('User object not available');
        }
        
        console.log('👤 [AdminGuard] User loaded:', {
            id: user.id,
            email: user.email,
            has_user_metadata: !!user.user_metadata,
            has_is_admin: !!user.is_admin,
            user_metadata_is_admin: user.user_metadata?.is_admin
        });
        
        const isAdmin = user.user_metadata?.is_admin || user.is_admin;
        
        if (!isAdmin) {
            console.log('🚫 [AdminGuard] User is not admin');
            showAccessDenied();
            return;
        }
        
        console.log('✅ [AdminGuard] Admin status verified');
        
        // Step 6: Show password prompt
        console.log('🔐 [AdminGuard] Showing password prompt...');
        await showPasswordPrompt(user.id);
        
    } catch (error) {
        console.error('❌ [AdminGuard] Fatal error during execution:', error);
        showError(
            'Admin guard initialization failed. This could be due to a network issue or configuration problem.',
            {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            }
        );
    }
}

// Show access denied screen for non-admin users
function showAccessDenied() {
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';
    document.body.innerHTML = '';
    document.body.style.overflow = 'hidden';
    
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
        <div style="
            background: white;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            text-align: center;
            max-width: 450px;
            width: 90%;
        ">
            <div style="font-size: 64px; margin-bottom: 24px;">🚫</div>
            <h2 style="margin: 0 0 16px 0; color: #dc2626; font-size: 28px; font-weight: 700;">
                Access Denied
            </h2>
            <p style="margin: 0 0 32px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                You do not have administrator privileges.<br>
                This area is restricted to admin users only.
            </p>
            <button 
                onclick="window.location.href='${window.OsliraEnv.getAppUrl('/dashboard')}'"
                style="
                    width: 100%;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                "
            >
                Return to Dashboard
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Execute when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', executeGuard);
} else {
    executeGuard();
}
    
    // Allow access to admin panel
    function allowAccess(userId) {
        console.log('✅ [AdminGuard] Access granted - loading admin panel');
        
        // Restore page visibility
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
        document.body.style.overflow = '';
        
        // Clear body (remove password screen)
        document.body.innerHTML = `
            <!-- Skip Navigation -->
            <a href="#admin-main-content" class="skip-nav">Skip to main content</a>
            
            <!-- Main Content Area -->
            <main id="admin-main-content" class="admin-main-content">
                <div class="admin-gradient-bg"></div>
                <div id="admin-content-container" class="admin-content-container">
                    <div id="admin-loading" class="admin-loading-state">
                        <div class="loading-spinner"></div>
                        <p class="text-slate-600 mt-4">Loading admin panel...</p>
                    </div>
                    <div id="admin-error" class="admin-error-state hidden">
                        <div class="error-icon">⚠️</div>
                        <h2 class="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                        <p class="text-slate-600 mb-4" id="admin-error-message"></p>
                        <button onclick="location.reload()" class="btn-primary">Reload Page</button>
                    </div>
                    <div id="admin-section-content" class="admin-section-content hidden"></div>
                </div>
            </main>
            
            <div id="admin-toast-container" class="admin-toast-container"></div>
            <div id="admin-modals-container"></div>
        `;
        
        // Dispatch event to signal admin scripts can load
        window.dispatchEvent(new CustomEvent('admin:guard:passed', {
            detail: { userId }
        }));
        
        // Store auth status globally
        window.ADMIN_AUTHORIZED = true;
    }
    
    // Main guard execution
    async function executeGuard() {
        try {
            // Wait for environment
            await waitForEnvironment();
            
            // Check if already authenticated
            if (isAuthenticated()) {
                const authData = JSON.parse(localStorage.getItem(SESSION_KEY));
                console.log('✅ [AdminGuard] Session valid - allowing access');
                allowAccess(authData.userId);
                return;
            }
            
            // Check rate limit
            if (isRateLimited()) {
                console.log('🚫 [AdminGuard] Rate limited');
                showRateLimitScreen();
                return;
            }
            
            // Verify admin status
            const userId = await verifyAdminAccess();
            if (!userId) {
                return; // Already redirected
            }
            
            // Show password prompt
            await showPasswordPrompt(userId);
            
        } catch (error) {
            console.error('❌ [AdminGuard] Guard execution failed:', error);
            showError('Admin guard initialization failed. Please refresh.');
        }
    }
    
    // Execute when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeGuard);
    } else {
        executeGuard();
    }
    
})();
