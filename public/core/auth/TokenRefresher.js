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
            console.log(`🔄 [TokenRefresher] Token expires in ${Math.floor(timeU
