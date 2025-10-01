//public/pages/dashboard/modules/realtime/realtime-manager.js

/**
 * OSLIRA REALTIME MANAGER MODULE
 * Handles real-time subscriptions, connection management, and polling fallback
 * Extracted from dashboard.js - maintains exact functionality
 */
class RealtimeManager {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
        this.stateManager = container.get('stateManager');
        this.supabase = container.get('supabase');
        this.osliraAuth = container.get('osliraAuth');
        
        // Real-time state - EXACT FROM ORIGINAL
        this.realtimeSubscription = null;
        this.isRealtimeActive = false;
        this.pollingInterval = null;
        this.lastUpdateTimestamp = null;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.pollingIntervalMs = 30000; // 30 seconds
        
        // Bind methods for event listeners
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        console.log('🚀 [RealtimeManager] Initialized');
    }
    
    async init() {
        // Setup visibility change listener
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Listen for auth changes
        this.eventBus.on('auth:changed', this.handleAuthChange.bind(this));
        
        // Listen for cleanup events
        this.eventBus.on('dashboard:cleanup', this.cleanup.bind(this));
        
        console.log('✅ [RealtimeManager] Event listeners initialized');
    }
    
    // ===============================================================================
    // REALTIME SETUP - EXTRACTED FROM dashboard.js lines 5000-5150
    // ===============================================================================
    
    async setupRealtimeSubscription() {
        try {
            console.log('🔄 [RealtimeManager] Setting up real-time subscription...');
            
            // Wait for authentication
            const isAuthReady = await this.waitForAuth(10000);
            if (!isAuthReady) {
                console.warn('⚠️ [RealtimeManager] Auth not ready, falling back to polling');
                this.setupPollingFallback();
                return;
            }
            
            const user = this.osliraApp?.user;
            if (!user) {
                throw new Error('No authenticated user found');
            }
            
            // Clean up any existing subscription
            await this.cleanup();
            
            console.log(`🔗 [RealtimeManager] Subscribing to leads table for user: ${user.id}`);
            
            // Create the subscription - EXACT FROM ORIGINAL
            this.realtimeSubscription = this.supabase
                .channel('leads-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to all changes
                        schema: 'public',
                        table: 'leads',
                        filter: `user_id=eq.${user.id}` // Only this user's leads
                    },
                    (payload) => {
                        console.log('📡 [RealtimeManager] Real-time update received:', payload);
                        this.handleRealtimeUpdate(payload);
                    }
                )
                .subscribe((status) => {
                    console.log(`📡 [RealtimeManager] Subscription status: ${status}`);
                    
                    switch (status) {
                        case 'SUBSCRIBED':
                            this.isRealtimeActive = true;
                            this.connectionAttempts = 0;
                            this.stateManager.setState('connectionStatus', 'connected');
                            this.stateManager.setState('isRealtimeActive', true);
                            
                            this.eventBus.emit(DASHBOARD_EVENTS.REALTIME_CONNECTED);
                            console.log('✅ [RealtimeManager] Real-time subscription active');
                            
                            // Stop polling if it was running
                            this.stopPollingFallback();
                            break;
                            
                        case 'CHANNEL_ERROR':
                        case 'TIMED_OUT':
                        case 'CLOSED':
                            console.error(`❌ [RealtimeManager] Subscription error: ${status}`);
                            this.isRealtimeActive = false;
                            this.stateManager.setState('connectionStatus', 'disconnected');
                            this.stateManager.setState('isRealtimeActive', false);
                            
                            this.eventBus.emit(DASHBOARD_EVENTS.REALTIME_DISCONNECTED, { status });
                            
                            // Retry connection or fallback to polling
                            this.handleConnectionFailure();
                            break;
                    }
                });
                
// Connection timeout with cleanup
this.connectionTimeout = setTimeout(() => {
    if (!this.isRealtimeActive) {
        console.warn('⚠️ [RealtimeManager] Real-time connection timeout, using polling');
        this.cleanup().then(() => {
            this.setupPollingFallback();
        });
    }
}, 10000); // Increased to 10 seconds

// Clear timeout if connection succeeds
if (this.isRealtimeActive && this.connectionTimeout) {
    clearTimeout(this.connectionTimeout);
    this.connectionTimeout = null;
}
            
        } catch (error) {
            console.error('❌ [RealtimeManager] Failed to setup real-time subscription:', error);
            this.isRealtimeActive = false;
            this.stateManager.setState('connectionStatus', 'error');
            
            // Fallback to polling
            this.setupPollingFallback();
            
            this.eventBus.emit(DASHBOARD_EVENTS.ERROR, {
                source: 'realtime',
                error: error.message
            });
        }
    }

    // ===============================================================================
// CONNECTION STATE MANAGEMENT
// ===============================================================================

resetConnectionState() {
    console.log('🔄 [RealtimeManager] Resetting connection state...');
    
    this.isRealtimeActive = false;
    this.connectionAttempts = 0;
    this.lastUpdateTimestamp = null;
    
    if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
    }
    
    this.stateManager.batchUpdate({
        'isRealtimeActive': false,
        'connectionStatus': 'disconnected',
        'lastUpdateTimestamp': null
    });
    
    console.log('✅ [RealtimeManager] Connection state reset');
}
    
    // ===============================================================================
    // REALTIME UPDATE HANDLER - EXTRACTED FROM dashboard.js lines 5200-5350
    // ===============================================================================
    
    handleRealtimeUpdate(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        console.log(`📡 [RealtimeManager] Processing ${eventType} event`);
        
        // Update timestamp
        this.lastUpdateTimestamp = Date.now();
        this.stateManager.setState('lastUpdateTimestamp', this.lastUpdateTimestamp);
        
        // Emit the update event for other modules to handle
        this.eventBus.emit(DASHBOARD_EVENTS.REALTIME_UPDATE, {
            eventType,
            newRecord,
            oldRecord,
            timestamp: this.lastUpdateTimestamp
        });
        
        switch (eventType) {
            case 'INSERT':
                if (newRecord) {
                    console.log('📨 [RealtimeManager] New lead added:', newRecord.username);
                    
                    // Show notification
                    this.osliraApp?.showMessage(
                        `New lead analyzed: @${newRecord.username}`,
                        'success'
                    );
                    
                    // Trigger data refresh after delay to allow for analysis data
                    setTimeout(() => {
                        this.eventBus.emit(DASHBOARD_EVENTS.DATA_REFRESH, {
                            reason: 'new_lead',
                            leadId: newRecord.id
                        });
                    }, 3000);
                }
                break;
                
            case 'UPDATE':
                if (newRecord) {
                    console.log('✏️ [RealtimeManager] Lead updated:', newRecord.username);
                    
                    // Trigger data refresh
                    setTimeout(() => {
                        this.eventBus.emit(DASHBOARD_EVENTS.DATA_REFRESH, {
                            reason: 'lead_updated',
                            leadId: newRecord.id
                        });
                    }, 500);
                }
                break;
                
            case 'DELETE':
                if (oldRecord) {
                    console.log('🗑️ [RealtimeManager] Lead deleted:', oldRecord.username);
                    
                    // Trigger data refresh
                    setTimeout(() => {
                        this.eventBus.emit(DASHBOARD_EVENTS.DATA_REFRESH, {
                            reason: 'lead_deleted',
                            leadId: oldRecord.id
                        });
                    }, 500);
                }
                break;
        }
    }
    
    // ===============================================================================
    // POLLING FALLBACK - EXTRACTED FROM dashboard.js lines 5400-5480
    // ===============================================================================
    
    startPollingFallback() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        console.log('🔄 [RealtimeManager] Starting polling fallback...');
        
this.pollingInterval = setInterval(() => {
    if (!document.hidden && !this.isRealtimeActive) {
        // Only log every 5th poll to reduce spam
        if (Date.now() % 150000 < 30000) { // Log roughly every 5 minutes
            console.log('📊 [RealtimeManager] Polling for updates...');
        }
        
        // Emit refresh event
        this.eventBus.emit(DASHBOARD_EVENTS.DATA_REFRESH, {
            reason: 'polling',
            timestamp: Date.now()
        });
    }
}, this.pollingIntervalMs);
        
        this.stateManager.setState('connectionStatus', 'polling');
        console.log(`✅ [RealtimeManager] Polling started (${this.pollingIntervalMs}ms intervals)`);
    }
    
    setupPollingFallback() {
        if (!this.isRealtimeActive) {
            this.startPollingFallback();
        }
    }
    
    // EXTRACTED FROM dashboard.js lines 5500-5550
    stopPollingFallback() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('⏹️ [RealtimeManager] Polling fallback stopped');
        }
    }
    
    // ===============================================================================
    // CONNECTION MANAGEMENT
    // ===============================================================================
    
handleConnectionFailure() {
    this.connectionAttempts++;
    
    if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`🔄 [RealtimeManager] Retrying connection (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        
        // Exponential backoff with maximum delay
        const retryDelay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
        
        // Clear any existing subscription before retrying
        this.cleanup().then(() => {
            setTimeout(() => {
                this.setupRealtimeSubscription();
            }, retryDelay);
        });
        
    } else {
        console.warn('⚠️ [RealtimeManager] Max connection attempts reached, falling back to polling');
        this.cleanup().then(() => {
            this.setupPollingFallback();
        });
    }
}
    
    // EXTRACTED FROM dashboard.js lines 5600-5680
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('👁️ [RealtimeManager] Page hidden, pausing updates');
            this.stopPollingFallback();
        } else {
            console.log('👁️ [RealtimeManager] Page visible, resuming updates');
            
            if (!this.isRealtimeActive) {
                this.startPollingFallback();
            }
            
            // Trigger immediate refresh when page becomes visible
            this.eventBus.emit(DASHBOARD_EVENTS.DATA_REFRESH, {
                reason: 'page_visible',
                timestamp: Date.now()
            });
        }
    }
    
    // ===============================================================================
    // AUTHENTICATION HANDLING - EXTRACTED FROM dashboard.js lines 5700-5780
    // ===============================================================================
    
async waitForAuth(timeout = 5000) {
    console.log('🔐 [RealtimeManager] Waiting for authentication...');
    
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = timeout / 100;
        
        const checkAuth = async () => {
            const user = this.osliraApp?.user;
            
            // Simplified auth check - just verify user exists
            if (user && user.id) {
                console.log('✅ [RealtimeManager] User authentication confirmed');
                resolve(true);
                return;
            }
                
            attempts++;
            if (attempts >= maxAttempts) {
                console.warn('⚠️ [RealtimeManager] Authentication timeout after', timeout, 'ms');
                resolve(false);
                return;
            }
            
            setTimeout(checkAuth, 100);
        };
        
        checkAuth();
    });
}
    
    handleAuthChange(authData) {
        if (authData.user) {
            console.log('🔐 [RealtimeManager] User authenticated, setting up real-time');
            this.setupRealtimeSubscription();
        } else {
            console.log('🔐 [RealtimeManager] User logged out, cleaning up real-time');
            this.cleanup();
        }
    }
    
    // ===============================================================================
    // CONNECTION STATUS & UTILITIES
    // ===============================================================================
    
    getConnectionStatus() {
        return {
            isRealtimeActive: this.isRealtimeActive,
            hasPollingFallback: !!this.pollingInterval,
            connectionAttempts: this.connectionAttempts,
            lastUpdate: this.lastUpdateTimestamp,
            status: this.stateManager.getState('connectionStatus')
        };
    }
    
    forceReconnect() {
        console.log('🔄 [RealtimeManager] Force reconnecting...');
        this.connectionAttempts = 0;
        this.cleanup().then(() => {
            this.setupRealtimeSubscription();
        });
    }
    
    // Test connection with a simple query
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('leads')
                .select('id')
                .limit(1);
                
            if (error) throw error;
            
            console.log('✅ [RealtimeManager] Connection test successful');
            return true;
        } catch (error) {
            console.error('❌ [RealtimeManager] Connection test failed:', error);
            return false;
        }
    }
    
    // ===============================================================================
    // CLEANUP - EXTRACTED FROM dashboard.js lines 5800-5880
    // ===============================================================================
    
    async cleanup() {
        console.log('🧹 [RealtimeManager] Cleaning up resources...');
        
        // Clean up real-time subscription
        if (this.realtimeSubscription) {
            try {
                await this.realtimeSubscription.unsubscribe();
                console.log('✅ [RealtimeManager] Real-time subscription cleaned up');
            } catch (error) {
                console.warn('⚠️ [RealtimeManager] Real-time cleanup warning:', error);
            }
            this.realtimeSubscription = null;
        }
        
        // Clean up polling interval
        this.stopPollingFallback();
        
        // Reset state
        this.isRealtimeActive = false;
        this.connectionAttempts = 0;
        this.lastUpdateTimestamp = null;
        
        // Update state manager
        this.stateManager.batchUpdate({
            'isRealtimeActive': false,
            'connectionStatus': 'disconnected',
            'lastUpdateTimestamp': null
        });
        
        // Clean up event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        console.log('✅ [RealtimeManager] Cleanup completed');
    }
    
    // ===============================================================================
    // DEBUGGING & MONITORING
    // ===============================================================================
    
    getDebugInfo() {
        return {
            isRealtimeActive: this.isRealtimeActive,
            hasSubscription: !!this.realtimeSubscription,
            pollingActive: !!this.pollingInterval,
            connectionAttempts: this.connectionAttempts,
            lastUpdate: this.lastUpdateTimestamp ? new Date(this.lastUpdateTimestamp).toISOString() : null,
            connectionStatus: this.stateManager.getState('connectionStatus'),
            supabaseConnected: !!this.supabase,
            userAuthenticated: !!this.osliraApp?.user
        };
    }
    
    logConnectionStats() {
        const stats = this.getDebugInfo();
        console.table(stats);
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RealtimeManager };
} else {
    window.RealtimeManager = RealtimeManager;
}
