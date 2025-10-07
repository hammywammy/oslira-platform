// =============================================================================
// TOKEN REFRESHER - Automatic Token Refresh System
// Path: /public/core/auth/TokenRefresher.js
// Dependencies: AuthManager
// =============================================================================

/**
 * @class TokenRefresher
 * @description Automatically refreshes auth tokens before expiration
 * 
 * Features:
 * - Proactive token refresh (5 min before expiry)
 * - Retry logic with exponential backoff
 * - Automatic sign-out on refresh failure
 * - Network failure tolerance
 * - Configurable refresh timing
 */
class TokenRefresher {
    constructor(authManager) {
        this.authManager = authManager;
        
        // Refresh config
        this.refreshBeforeExpiry = 5 * 60 * 1000; // Refresh 5 min before expiry
        this.checkInterval = 60 * 1000; // Check every 60 seconds
        this.maxRetries = 3;
        
        // State
        this.refreshTimer = null;
        this.isRefreshing = false;
        this.retryCount = 0;
        
        // Stats
        this.lastRefresh = null;
        this.refreshCount = 0;
        this.failureCount = 0;
        
        console.log('🔄 [TokenRefresher] Instance created');
    }
    
    // =========================================================================
    // LIFECYCLE
    // =========================================================================
    
    /**
     * Start automatic token refresh
     */
    start() {
        if (this.refreshTimer) {
            console.log('⚠️ [TokenRefresher] Already started');
            return;
        }
        
        console.log('🔄 [TokenRefresher] Starting automatic token refresh...');
        
        // Check immediately
        this._checkAndRefresh().catch(error => {
            console.error('❌ [TokenRefresher] Initial check failed:', error);
        });
        
        // Setup periodic check
        this.refreshTimer = setInterval(() => {
            this._checkAndRefresh().catch(error => {
                console.error('❌ [TokenRefresher] Periodic check failed:', error);
            });
        }, this.checkInterval);
        
        console.log(`✅ [TokenRefresher] Started (check interval: ${this.checkInterval / 1000}s)`);
    }
    
    /**
     * Stop automatic token refresh
     */
    stop() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('🔄 [TokenRefresher] Stopped');
        }
    }
    
    // =========================================================================
    // TOKEN REFRESH LOGIC
    // =========================================================================
    
    /**
     * Check if token needs refresh and refresh if needed
     */
    async _checkAndRefresh() {
        // Skip if no session
        if (!this.authManager.session) {
            return;
        }
        
        // Skip if already refreshing
        if (this.isRefreshing) {
            console.log('⏳ [TokenRefresher] Refresh already in progress');
            return;
        }
        
        // Check if token needs refresh
        if (!this._needsRefresh()) {
            return;
        }
        
        console.log('🔄 [TokenRefresher] Token needs refresh');
        
        // Attempt refresh
        await this._refreshToken();
    }
    
    /**
     * Check if token needs refresh
     */
    _needsRefresh() {
        const session = this.authManager.session;
        
        if (!session || !session.expires_at) {
            return false;
        }
        
        // Get token expiry time
        const expiryTime = session.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        
        // Refresh if token expires within threshold
        const needsRefresh = timeUntilExpiry <= this.refreshBeforeExpiry;
        
        if (needsRefresh) {
            console.log(`🔄 [TokenRefresher] Token expires in ${Math.floor(timeUntilExpiry / 1000)}s`);
        }
        
        return needsRefresh;
    }
    
    /**
     * Refresh token with retry logic
     */
    async _refreshToken() {
        this.isRefreshing = true;
        
        try {
            console.log(`🔄 [TokenRefresher] Attempting refresh (retry ${this.retryCount}/${this.maxRetries})...`);
            
            // Use Supabase built-in refresh
            const { data, error } = await this.authManager.supabase.auth.refreshSession();
            
            if (error) {
                throw error;
            }
            
            if (!data.session) {
                throw new Error('No session returned from refresh');
            }
            
            // Update stats
            this.lastRefresh = Date.now();
            this.refreshCount++;
            this.retryCount = 0;
            this.failureCount = 0;
            
            console.log('✅ [TokenRefresher] Token refreshed successfully');
            
            // Emit refresh event
            this._emitEvent('token-refreshed', {
                session: data.session,
                refreshCount: this.refreshCount
            });
            
        } catch (error) {
            console.error('❌ [TokenRefresher] Refresh failed:', error);
            
            this.failureCount++;
            this.retryCount++;
            
            // Track in Sentry
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: {
                        component: 'TokenRefresher',
                        action: 'refresh-token',
                        retryCount: this.retryCount,
                        failureCount: this.failureCount
                    }
                });
            }
            
            // Handle refresh failure
            await this._handleRefreshFailure(error);
            
        } finally {
            this.isRefreshing = false;
        }
    }
    
    /**
     * Handle refresh failure with retry/sign-out logic
     */
    async _handleRefreshFailure(error) {
        // Check if we should retry
        if (this.retryCount < this.maxRetries) {
            const backoffDelay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
            console.log(`🔄 [TokenRefresher] Retrying in ${backoffDelay / 1000}s...`);
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            
            // Retry refresh
            await this._refreshToken();
            return;
        }
        
        // Max retries exceeded - sign out user
        console.error('❌ [TokenRefresher] Max retries exceeded, signing out...');
        
        try {
            await this.authManager.signOut();
            
            // Redirect to auth page
            const authUrl = window.OsliraEnv.getAuthUrl();
            window.location.href = authUrl;
            
        } catch (signOutError) {
            console.error('❌ [TokenRefresher] Sign out failed:', signOutError);
            
            // Force reload to clear state
            window.location.reload();
        }
    }
    
    // =========================================================================
    // MANUAL REFRESH (For Components)
    // =========================================================================
    
    /**
     * Manually trigger token refresh
     */
    async refreshNow() {
        console.log('🔄 [TokenRefresher] Manual refresh triggered');
        
        // Reset retry count for manual refresh
        this.retryCount = 0;
        
        await this._refreshToken();
    }
    
    /**
     * Force refresh regardless of expiry time
     */
    async forceRefresh() {
        console.log('🔄 [TokenRefresher] Force refresh triggered');
        
        // Reset retry count
        this.retryCount = 0;
        
        // Skip expiry check
        await this._refreshToken();
    }
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    /**
     * Set refresh threshold (time before expiry to trigger refresh)
     */
    setRefreshThreshold(thresholdMs) {
        if (thresholdMs < 60000) {
            console.warn('⚠️ [TokenRefresher] Threshold too short, minimum is 1 minute');
            thresholdMs = 60000;
        }
        
        this.refreshBeforeExpiry = thresholdMs;
        console.log(`🔄 [TokenRefresher] Refresh threshold updated: ${thresholdMs / 1000}s before expiry`);
    }
    
    /**
     * Set check interval
     */
    setCheckInterval(intervalMs) {
        if (intervalMs < 30000) {
            console.warn('⚠️ [TokenRefresher] Interval too short, minimum is 30 seconds');
            intervalMs = 30000;
        }
        
        this.checkInterval = intervalMs;
        console.log(`🔄 [TokenRefresher] Check interval updated: ${intervalMs / 1000}s`);
        
        // Restart if already running
        if (this.refreshTimer) {
            this.stop();
            this.start();
        }
    }
    
    /**
     * Set max retries
     */
    setMaxRetries(retries) {
        if (retries < 1) {
            console.warn('⚠️ [TokenRefresher] Max retries must be at least 1');
            retries = 1;
        }
        
        this.maxRetries = retries;
        console.log(`🔄 [TokenRefresher] Max retries updated: ${retries}`);
    }
    
    // =========================================================================
    // TOKEN EXPIRY INFO
    // =========================================================================
    
    /**
     * Get time until token expires
     */
    getTimeUntilExpiry() {
        const session = this.authManager.session;
        
        if (!session || !session.expires_at) {
            return null;
        }
        
        const expiryTime = session.expires_at * 1000;
        const now = Date.now();
        const timeRemaining = Math.max(0, expiryTime - now);
        
        return timeRemaining;
    }
    
    /**
     * Get token expiry date
     */
    getExpiryDate() {
        const session = this.authManager.session;
        
        if (!session || !session.expires_at) {
            return null;
        }
        
        return new Date(session.expires_at * 1000);
    }
    
    /**
     * Check if token is expired
     */
    isTokenExpired() {
        const timeUntilExpiry = this.getTimeUntilExpiry();
        return timeUntilExpiry !== null && timeUntilExpiry <= 0;
    }
    
    /**
     * Get time until next refresh
     */
    getTimeUntilNextRefresh() {
        const timeUntilExpiry = this.getTimeUntilExpiry();
        
        if (timeUntilExpiry === null) {
            return null;
        }
        
        const timeUntilRefresh = timeUntilExpiry - this.refreshBeforeExpiry;
        return Math.max(0, timeUntilRefresh);
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get refresh statistics
     */
    getStats() {
        return {
            refreshCount: this.refreshCount,
            failureCount: this.failureCount,
            lastRefresh: this.lastRefresh,
            timeSinceLastRefresh: this.lastRefresh ? 
                Date.now() - this.lastRefresh : null,
            retryCount: this.retryCount,
            isRunning: !!this.refreshTimer,
            isRefreshing: this.isRefreshing,
            timeUntilExpiry: this.getTimeUntilExpiry(),
            timeUntilNextRefresh: this.getTimeUntilNextRefresh(),
            tokenExpired: this.isTokenExpired()
        };
    }
    
    /**
     * Get formatted time until expiry
     */
    getFormattedTimeUntilExpiry() {
        const ms = this.getTimeUntilExpiry();
        
        if (ms === null) {
            return 'No session';
        }
        
        if (ms <= 0) {
            return 'Expired';
        }
        
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        if (minutes > 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        
        return `${seconds}s`;
    }
    
    // =========================================================================
    // EVENT SYSTEM
    // =========================================================================
    
    /**
     * Emit token refresh event
     */
    _emitEvent(type, data) {
        const event = new CustomEvent(`token:${type}`, { detail: data });
        window.dispatchEvent(event);
        console.log(`📡 [TokenRefresher] Event emitted: token:${type}`);
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
            config: {
                refreshBeforeExpiryMs: this.refreshBeforeExpiry,
                refreshBeforeExpiryMinutes: this.refreshBeforeExpiry / 60000,
                checkIntervalMs: this.checkInterval,
                checkIntervalSeconds: this.checkInterval / 1000,
                maxRetries: this.maxRetries
            },
            expiry: {
                timeUntilExpiry: this.getFormattedTimeUntilExpiry(),
                expiryDate: this.getExpiryDate()?.toISOString(),
                isExpired: this.isTokenExpired()
            }
        };
    }
    
    /**
     * Print debug info to console
     */
    debug() {
        console.group('🔄 [TokenRefresher] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Config:', {
            refreshThreshold: `${this.refreshBeforeExpiry / 1000}s`,
            checkInterval: `${this.checkInterval / 1000}s`,
            maxRetries: this.maxRetries
        });
        console.log('Token Info:', {
            timeUntilExpiry: this.getFormattedTimeUntilExpiry(),
            expiryDate: this.getExpiryDate()?.toISOString(),
            timeUntilNextRefresh: this.getTimeUntilNextRefresh() ? 
                `${Math.floor(this.getTimeUntilNextRefresh() / 1000)}s` : 'N/A'
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
        console.log('🗑️ [TokenRefresher] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraTokenRefresher = TokenRefresher;

console.log('✅ [TokenRefresher] Class loaded and ready');
