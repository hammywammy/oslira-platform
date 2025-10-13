// =============================================================================
// SESSION VALIDATOR - Server-Side Session Validation
// Path: /public/core/auth/SessionValidator.js
// Dependencies: AuthManager
// =============================================================================

/**
 * @class SessionValidator
 * @description Validates auth tokens against server every 10 minutes
 * 
 * Features:
 * - Periodic server-side validation
 * - Automatic sign-out on invalid sessions
 * - Network failure tolerance
 * - Configurable validation interval
 */
class SessionValidator {
    constructor(authManager) {
        this.authManager = authManager;
        
        // Validation config
        this.validationInterval = 10 * 60 * 1000; // 10 minutes
        this.validationTimer = null;
        this.isValidating = false;
        
        // Stats
        this.lastValidation = null;
        this.validationCount = 0;
        this.failureCount = 0;
        
        console.log('🔒 [SessionValidator] Instance created');
    }
    
    // =========================================================================
    // LIFECYCLE
    // =========================================================================
    
    /**
     * Start periodic validation
     */
    start() {
        if (this.validationTimer) {
            console.log('⚠️ [SessionValidator] Already started');
            return;
        }
        
        console.log('🔒 [SessionValidator] Starting periodic validation...');
        
        // Run initial validation
        this.validate().catch(error => {
            console.error('❌ [SessionValidator] Initial validation failed:', error);
        });
        
        // Setup periodic validation
        this.validationTimer = setInterval(() => {
            this.validate().catch(error => {
                console.error('❌ [SessionValidator] Periodic validation failed:', error);
            });
        }, this.validationInterval);
        
        console.log(`✅ [SessionValidator] Started (interval: ${this.validationInterval / 1000}s)`);
    }
    
    /**
     * Stop periodic validation
     */
    stop() {
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
            this.validationTimer = null;
            console.log('🔒 [SessionValidator] Stopped');
        }
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate current session
     * @returns {Promise<boolean>} Session validity
     */
    async validate() {
        // Skip if already validating
        if (this.isValidating) {
            console.log('⏳ [SessionValidator] Validation already in progress');
            return false;
        }
        
        // Skip if no session
        if (!this.authManager.session) {
            console.log('ℹ️ [SessionValidator] No session to validate');
            return false;
        }
        
        this.isValidating = true;
        this.validationCount++;
        
        console.log(`🔒 [SessionValidator] Validating session (attempt ${this.validationCount})...`);
        
        try {
            // Method 1: Validate with Supabase getUser() (server-side check)
            const isValid = await this._validateWithSupabase();
            
            // Update stats
            this.lastValidation = Date.now();
            
            if (isValid) {
                console.log('✅ [SessionValidator] Session valid');
                this.failureCount = 0;
            } else {
                console.warn('⚠️ [SessionValidator] Session invalid');
                this.failureCount++;
                
                // Sign out if session is invalid
                await this._handleInvalidSession();
            }
            
            return isValid;
            
        } catch (error) {
            console.error('❌ [SessionValidator] Validation error:', error);
            this.failureCount++;
            
            // Track in Sentry
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: {
                        component: 'SessionValidator',
                        action: 'validate',
                        failureCount: this.failureCount
                    }
                });
            }
            
            // Don't sign out on network errors (tolerance)
            if (this.failureCount >= 3) {
                console.warn('⚠️ [SessionValidator] Multiple validation failures, signing out...');
                await this._handleInvalidSession();
            }
            
            return false;
            
        } finally {
            this.isValidating = false;
        }
    }
    
    /**
     * Validate session with Supabase server
     */
    async _validateWithSupabase() {
        try {
            // Use getUser() which validates token server-side
            const { data: { user }, error } = await this.authManager.supabase.auth.getUser();
            
            if (error) {
                console.error('❌ [SessionValidator] Supabase validation error:', error);
                
                // Check if error is auth-related
                if (error.status === 401 || error.status === 403) {
                    return false; // Invalid session
                }
                
                // Network/server errors - don't invalidate session
                throw error;
            }
            
            // Session is valid if user returned
            return !!user;
            
        } catch (error) {
            console.error('❌ [SessionValidator] Supabase validation failed:', error);
            throw error;
        }
    }
    
    /**
     * Handle invalid session (sign out user)
     */
    async _handleInvalidSession() {
        try {
            console.warn('🔒 [SessionValidator] Invalid session detected, signing out...');
            
            // Sign out via AuthManager
            await this.authManager.signOut();
            
            // Redirect to auth page
            const authUrl = window.OsliraEnv.getAuthUrl();
            window.location.href = authUrl;
            
        } catch (error) {
            console.error('❌ [SessionValidator] Sign out failed:', error);
            
            // Force reload to clear state
            window.location.reload();
        }
    }
    
    // =========================================================================
    // MANUAL VALIDATION (For Components)
    // =========================================================================
    
    /**
     * Manually trigger validation
     * @returns {Promise<boolean>} Session validity
     */
    async validateNow() {
        console.log('🔒 [SessionValidator] Manual validation triggered');
        return await this.validate();
    }
    
    /**
     * Check if session needs validation
     * @returns {boolean} True if validation is overdue
     */
    needsValidation() {
        if (!this.lastValidation) {
            return true;
        }
        
        const timeSinceLastValidation = Date.now() - this.lastValidation;
        return timeSinceLastValidation >= this.validationInterval;
    }
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    /**
     * Set validation interval
     * @param {number} intervalMs - Interval in milliseconds
     */
    setInterval(intervalMs) {
        if (intervalMs < 60000) {
            console.warn('⚠️ [SessionValidator] Interval too short, minimum is 1 minute');
            intervalMs = 60000;
        }
        
        this.validationInterval = intervalMs;
        console.log(`🔒 [SessionValidator] Interval updated: ${intervalMs / 1000}s`);
        
        // Restart if already running
        if (this.validationTimer) {
            this.stop();
            this.start();
        }
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get validation statistics
     */
    getStats() {
        return {
            validationCount: this.validationCount,
            failureCount: this.failureCount,
            lastValidation: this.lastValidation,
            timeSinceLastValidation: this.lastValidation ? 
                Date.now() - this.lastValidation : null,
            nextValidation: this.lastValidation ? 
                this.lastValidation + this.validationInterval : null,
            isRunning: !!this.validationTimer,
            isValidating: this.isValidating
        };
    }
    
    /**
     * Get time until next validation
     */
    getTimeUntilNextValidation() {
        if (!this.lastValidation) {
            return 0;
        }
        
        const nextValidation = this.lastValidation + this.validationInterval;
        const timeRemaining = Math.max(0, nextValidation - Date.now());
        
        return timeRemaining;
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            ...this.getStats(),
            intervalMs: this.validationInterval,
            intervalSeconds: this.validationInterval / 1000,
            intervalMinutes: this.validationInterval / 60000
        };
    }
    
    /**
     * Print debug info to console
     */
    debug() {
        console.group('🔒 [SessionValidator] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Config:', {
            interval: `${this.validationInterval / 1000}s`,
            isRunning: !!this.validationTimer
        });
        console.groupEnd();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        this.authManager = null;
        console.log('🗑️ [SessionValidator] Destroyed');
    }
}



// =============================================================================
// ES6 MODULE EXPORT
// =============================================================================
export default SessionValidator;
