// public/pages/app/dashboard/core/DashboardEventSystem.js

/**
 * DASHBOARD EVENT SYSTEM - Event Coordination Layer (MIGRATED)
 * 
 * PURPOSE: Dashboard-specific event handling and business logic coordination
 * DEPENDENCIES: Core EventBus (window.OsliraEventBus), Core ErrorHandler
 * 
 * This file ONLY handles:
 * 1. Dashboard-specific event orchestration
 * 2. Cross-module coordination (leads, stats, business switching)
 * 3. Dashboard error handling delegation
 * 
 * Core handles: Event infrastructure, error logging, state management
 * 
 * ✅ MIGRATED: No longer uses container.get() - uses window.* directly
 */
// Dashboard Event Constants
const DASHBOARD_EVENTS = {
    // Data Events
    LOADING_START: 'dashboard:loading:start',
    DATA_LOADING_START: 'dashboard:data:loading:start',
    DATA_LOADING_END: 'dashboard:data:loading:end',
    DATA_REFRESH_COMPLETE: 'dashboard:data:refresh:complete',
    DATA_LOADED: 'dashboard:data:loaded',
    DATA_ERROR: 'dashboard:data:error',
    DATA_REFRESH_REQUESTED: 'dashboard:data:refresh:requested',
    
    // Analysis Events
    ANALYSIS_STARTED: 'dashboard:analysis:started',
    ANALYSIS_COMPLETED: 'dashboard:analysis:completed',
    ANALYSIS_FAILED: 'dashboard:analysis:failed',
    ANALYSIS_QUEUE_UPDATE: 'dashboard:analysis:queue:update',
    
    // Business Events
    BUSINESS_CHANGED: 'dashboard:business:changed',
    BUSINESS_CHANGE_COMPLETE: 'dashboard:business:change:complete',
    BUSINESS_LIST_UPDATED: 'dashboard:business:list:updated',
    BUSINESS_LOADED: 'dashboard:business:loaded',
    
    // UI Events
    UI_UPDATE: 'dashboard:ui:update',
    
    // Error Events
    ERROR: 'dashboard:error',
    WARNING: 'dashboard:warning',
    
    // Connection Events
    CONNECTION_STATUS_CHANGED: 'dashboard:connection:status:changed',
    REALTIME_CONNECTED: 'dashboard:realtime:connected',
    REALTIME_DISCONNECTED: 'dashboard:realtime:disconnected',
    REALTIME_UPDATE: 'dashboard:realtime:update',
    
    // Auth Events
    AUTH_CHANGED: 'dashboard:auth:changed'
};

class DashboardEventSystem {
    
    /**
     * Setup all event handlers for the dashboard
     * Called by DashboardApp after initialization
     * 
     * @param {OsliraEventBus} eventBus - Core's EventBus instance (window.OsliraEventBus)
     * @param {Object} dashboard - Dashboard app instance (for compatibility)
     */
    static setupHandlers(eventBus, dashboard = null) {
        console.log('📡 [DashboardEventSystem] Setting up event handlers...');
        
        // Verify we're using Core's EventBus
        if (eventBus !== window.EventBus && eventBus !== window.OsliraEventBus) {
            console.warn('⚠️ [DashboardEventSystem] Not using Core EventBus!');
        }
        
        this.setupDataEvents(eventBus);
        this.setupAnalysisEvents(eventBus);
        this.setupBusinessEvents(eventBus);
        this.setupErrorEvents(eventBus);
        this.setupConnectionEvents(eventBus);
        
        console.log('✅ [DashboardEventSystem] Event handlers ready');
    }
    
    /**
     * Data refresh and loading events
     */
    static setupDataEvents(eventBus) {
        // Data refresh requested
        eventBus.on(DASHBOARD_EVENTS.LOADING_START, async (data) => {
            console.log('🔄 [DashboardEventSystem] Data refresh requested:', data?.reason);
            
            try {
                // Use global window reference instead of container
                const leadManager = window.LeadManager;
                if (!leadManager) {
                    throw new Error('LeadManager not available');
                }
                
                await leadManager.loadDashboardData();
                
                eventBus.emit(DASHBOARD_EVENTS.DATA_REFRESH_COMPLETE, {
                    reason: data?.reason,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                console.error('❌ [DashboardEventSystem] Data refresh failed:', error);
                
                // Use Core's error handler
                window.ErrorHandler.handleError(error, {
                    context: 'data_refresh',
                    severity: 'medium'
                });
                
                eventBus.emit(DASHBOARD_EVENTS.DATA_ERROR, {
                    source: 'data_refresh',
                    error,
                    timestamp: Date.now()
                });
            }
        });
        
        // Data loading start
        eventBus.on(DASHBOARD_EVENTS.DATA_LOADING_START, (data) => {
            const stateManager = window.StateManager || window.OsliraStateManager;
            if (stateManager) {
                stateManager.setState('isLoading', true);
                stateManager.setState('loadingMessage', data?.message || 'Loading...');
            }
        });
        
        // Data loading end
        eventBus.on(DASHBOARD_EVENTS.DATA_LOADING_END, () => {
            const stateManager = window.StateManager || window.OsliraStateManager;
            if (stateManager) {
                stateManager.setState('isLoading', false);
                stateManager.setState('loadingMessage', null);
            }
        });
        
        // Data refresh complete
        eventBus.on(DASHBOARD_EVENTS.DATA_REFRESH_COMPLETE, (data) => {
            console.log('✅ [DashboardEventSystem] Data refresh complete:', data?.reason);
        });
    }
    
    /**
     * Analysis completion and queue events
     */
    static setupAnalysisEvents(eventBus) {
        // Analysis completed - refresh dashboard data
        eventBus.on(DASHBOARD_EVENTS.ANALYSIS_COMPLETED, async (data) => {
            const username = data?.username || data?.analysis?.username;
            console.log('🎯 [DashboardEventSystem] Analysis completed:', username);
            
            try {
                // Refresh dashboard data using global window references
                const leadManager = window.LeadManager;
                if (leadManager) {
                    await leadManager.loadDashboardData();
                }
                
                // Update stats
                const statsCalculator = window.StatsCalculator;
                if (statsCalculator) {
                    await statsCalculator.refreshStats();
                }
                
                // Notify UI
                eventBus.emit(DASHBOARD_EVENTS.UI_UPDATE, {
                    type: 'analysis_complete',
                    username: username
                });
                
                console.log('✅ [DashboardEventSystem] Post-analysis refresh complete');
                
            } catch (error) {
                console.error('❌ [DashboardEventSystem] Post-analysis refresh failed:', error);
                
                // Use Core's error handler
                window.ErrorHandler.handleError(error, {
                    context: 'analysis_completion',
                    severity: 'low' // Non-critical - analysis succeeded, just refresh failed
                });
                
                eventBus.emit(DASHBOARD_EVENTS.DATA_ERROR, {
                    source: 'analysis_completion',
                    error,
                    context: data
                });
            }
        });
        
        // Analysis started
        eventBus.on(DASHBOARD_EVENTS.ANALYSIS_STARTED, (data) => {
            console.log('🚀 [DashboardEventSystem] Analysis started:', data?.username);
        });
        
        // Analysis failed
        eventBus.on(DASHBOARD_EVENTS.ANALYSIS_FAILED, (data) => {
            console.error('❌ [DashboardEventSystem] Analysis failed:', data?.username);
            
            // Use Core's error handler
            window.ErrorHandler.handleError(data?.error || new Error('Analysis failed'), {
                context: 'analysis_execution',
                severity: 'medium',
                metadata: { username: data?.username }
            });
        });
        
        // Analysis queue updates
        eventBus.on(DASHBOARD_EVENTS.ANALYSIS_QUEUE_UPDATE, (data) => {
            const stateManager = window.StateManager || window.OsliraStateManager;
            if (stateManager) {
                stateManager.setState('analysisQueue', data?.queue);
                stateManager.setState('analysisInProgress', data?.inProgress);
            }
        });
    }
    
    /**
     * Business profile change events
     */
    static setupBusinessEvents(eventBus) {
        // Business changed - reload all business-dependent data
        eventBus.on(DASHBOARD_EVENTS.BUSINESS_CHANGED, async (data) => {
            console.log('🏢 [DashboardEventSystem] Business changed:', data?.businessId);
            
            try {
                const stateManager = window.StateManager || window.OsliraStateManager;
                
                if (stateManager) {
                    // Update state first
                    stateManager.setState('selectedBusiness', data?.business);
                    stateManager.setState('isLoading', true);
                    stateManager.setState('loadingMessage', 'Switching business...');
                }
                
                // Reload data for new business
                const leadManager = window.LeadManager;
                if (leadManager) {
                    await leadManager.loadDashboardData();
                }
                
                // Update stats
                const statsCalculator = window.StatsCalculator;
                if (statsCalculator) {
                    await statsCalculator.refreshStats();
                }
                
                // Update real-time subscription
                const realtimeManager = window.RealtimeManager;
                if (realtimeManager && realtimeManager.updateSubscription) {
                    await realtimeManager.updateSubscription(data?.businessId);
                }
                
                // Update loading state
                if (stateManager) {
                    stateManager.setState('isLoading', false);
                    stateManager.setState('loadingMessage', null);
                }
                
                // Emit completion event
                eventBus.emit(DASHBOARD_EVENTS.BUSINESS_CHANGE_COMPLETE, {
                    businessId: data?.businessId,
                    timestamp: Date.now()
                });
                
                console.log('✅ [DashboardEventSystem] Business change complete');
                
            } catch (error) {
                console.error('❌ [DashboardEventSystem] Business change failed:', error);
                
                // Use Core's error handler
                window.ErrorHandler.handleError(error, {
                    context: 'business_change',
                    severity: 'high',
                    metadata: { businessId: data?.businessId }
                });
                
                // Update state
                const stateManager = window.StateManager || window.OsliraStateManager;
                if (stateManager) {
                    stateManager.setState('isLoading', false);
                    stateManager.setState('loadingMessage', null);
                }
                
                eventBus.emit(DASHBOARD_EVENTS.DATA_ERROR, {
                    source: 'business_change',
                    error,
                    context: data
                });
            }
        });
        
        // Business list updated
        eventBus.on(DASHBOARD_EVENTS.BUSINESS_LIST_UPDATED, (data) => {
            console.log('📋 [DashboardEventSystem] Business list updated');
            const stateManager = window.StateManager || window.OsliraStateManager;
            if (stateManager) {
                stateManager.setState('businesses', data?.businesses);
            }
        });
        
        // Business loaded
        eventBus.on(DASHBOARD_EVENTS.BUSINESS_LOADED, (data) => {
            console.log('🏢 [DashboardEventSystem] Business loaded:', data?.business?.business_name);
        });
    }
    
    /**
     * Error and system events
     */
    static setupErrorEvents(eventBus) {
        // Global dashboard error
        eventBus.on(DASHBOARD_EVENTS.ERROR, (errorData) => {
            console.error('🚨 [DashboardEventSystem] Dashboard error:', errorData);
            
            // Delegate to Core's error handler
            window.ErrorHandler.handleError(errorData?.error || new Error(errorData?.message), {
                context: errorData?.source || 'dashboard_general',
                severity: errorData?.severity || 'medium',
                metadata: errorData?.context
            });
            
            this.handleDashboardError(errorData);
        });
        
        // Data-specific errors
        eventBus.on(DASHBOARD_EVENTS.DATA_ERROR, (errorData) => {
            console.error('📊 [DashboardEventSystem] Data error:', errorData?.source);
            
            this.handleDataError(errorData);
        });
        
        // Warning events
        eventBus.on(DASHBOARD_EVENTS.WARNING, (warningData) => {
            console.warn('⚠️ [DashboardEventSystem] Warning:', warningData?.message);
            
            // Log to Core's logger
            const logger = window.Logger || window.OsliraLogger;
            if (logger && logger.warn) {
                logger.warn('[Dashboard]', warningData?.message, warningData?.context);
            }
        });
    }
    
    /**
     * Connection and real-time events
     */
    static setupConnectionEvents(eventBus) {
        // Connection status changed
        eventBus.on(DASHBOARD_EVENTS.CONNECTION_STATUS_CHANGED, (data) => {
            console.log('🔌 [DashboardEventSystem] Connection status:', data?.status);
            
            const stateManager = window.StateManager || window.OsliraStateManager;
            if (stateManager) {
                stateManager.setState('connectionStatus', data?.status);
                stateManager.setState('lastConnectionUpdate', Date.now());
            }
        });
        
        // Real-time connected
        eventBus.on(DASHBOARD_EVENTS.REALTIME_CONNECTED, () => {
            console.log('✅ [DashboardEventSystem] Real-time connected');
        });
        
        // Real-time disconnected
        eventBus.on(DASHBOARD_EVENTS.REALTIME_DISCONNECTED, () => {
            console.warn('⚠️ [DashboardEventSystem] Real-time disconnected');
        });
        
        // Real-time update
        eventBus.on(DASHBOARD_EVENTS.REALTIME_UPDATE, async (data) => {
            console.log('📡 [DashboardEventSystem] Real-time update:', data?.type);
            
            // Handle different update types
            switch (data?.type) {
                case 'lead_created':
                case 'lead_updated':
                case 'lead_deleted':
                    // Refresh lead data
                    const leadManager = window.LeadManager;
                    if (leadManager) {
                        await leadManager.loadDashboardData();
                    }
                    break;
                    
                case 'analysis_completed':
                    // Handled by ANALYSIS_COMPLETED event
                    break;
                    
                default:
                    console.log('🔔 [DashboardEventSystem] Unhandled real-time update:', data?.type);
            }
        });
        
        // Auth state changes
        eventBus.on(DASHBOARD_EVENTS.AUTH_CHANGED, async (data) => {
            console.log('🔐 [DashboardEventSystem] Auth state changed:', data?.status);
            
            if (data?.status === 'signed_out') {
                // Clear sensitive data
                const stateManager = window.StateManager || window.OsliraStateManager;
                if (stateManager) {
                    stateManager.batchUpdate({
                        leads: [],
                        businesses: [],
                        selectedBusiness: null,
                        user: null
                    }, true); // Silent update
                }
                
                // Redirect to auth using Core's navigation helper
                const nav = window.NavigationHelper || window.OsliraNav;
                if (nav && nav.navigateTo) {
                    nav.navigateTo('auth');
                }
            }
        });
    }
    
    /**
     * Handle dashboard errors
     * Coordinates error recovery and user notification
     */
    static handleDashboardError(errorData) {
        const { source, error, context } = errorData;
        
        // Update state
        const stateManager = window.StateManager || window.OsliraStateManager;
        if (stateManager) {
            stateManager.setState('lastError', {
                source,
                message: error?.message || String(error),
                timestamp: Date.now()
            });
        }
        
        // Handle specific error types
        switch (source) {
            case 'business_change':
                console.warn('⚠️ [DashboardEventSystem] Business change failed');
                this.showUserError('Failed to switch business. Please try again.');
                break;
                
            case 'data_refresh':
                console.warn('⚠️ [DashboardEventSystem] Data refresh failed');
                this.showUserError('Failed to refresh data. Please try again.');
                break;
                
            case 'analysis_completion':
                console.warn('⚠️ [DashboardEventSystem] Post-analysis refresh failed');
                // Non-critical - don't show error to user
                break;
                
            case 'lead_loading':
                console.error('❌ [DashboardEventSystem] Lead loading failed');
                this.showUserError('Failed to load leads. Please refresh the page.');
                break;
                
            default:
                console.error('❌ [DashboardEventSystem] Unhandled error:', source);
                this.showUserError('An unexpected error occurred.');
        }
    }
    
    /**
     * Handle data-specific errors
     */
    static handleDataError(errorData) {
        const { source, error } = errorData;
        
        // Stop loading state
        const stateManager = window.StateManager || window.OsliraStateManager;
        if (stateManager) {
            stateManager.setState('isLoading', false);
            stateManager.setState('loadingMessage', null);
            
            // Update error state
            stateManager.setState('lastError', {
                source,
                message: error?.message || String(error),
                timestamp: Date.now()
            });
        }
        
        // Show user-friendly message
        const message = this.getErrorMessage(source, error);
        this.showUserError(message);
    }
    
    /**
     * Get user-friendly error message
     */
    static getErrorMessage(source, error) {
        const messages = {
            'data_refresh': 'Failed to refresh dashboard data',
            'business_change': 'Failed to switch business profile',
            'analysis_completion': 'Analysis completed but data refresh failed',
            'lead_loading': 'Failed to load leads',
            'stats_calculation': 'Failed to calculate statistics',
            'realtime_connection': 'Real-time connection failed'
        };
        
        return messages[source] || 'An error occurred';
    }
    
    /**
     * Show error message to user
     * Uses Core's notification system if available
     */
    static showUserError(message) {
        // Try Core's notification system (if it exists)
        if (window.Notifications?.error) {
            window.Notifications.error(message);
            return;
        }
        
        // Fallback to Auth
        if (window.AuthManager?.showMessage) {
            window.AuthManager.showMessage(message, 'error');
            return;
        }
        
        // Last resort - console
        console.error('💬 [User Error]:', message);
    }
    
    /**
     * Show success message to user
     */
    static showUserSuccess(message) {
        // Try Core's notification system
        if (window.Notifications?.success) {
            window.Notifications.success(message);
            return;
        }
        
        // Fallback to Auth
        if (window.AuthManager?.showMessage) {
            window.AuthManager.showMessage(message, 'success');
            return;
        }
        
        // Last resort - console
        console.log('✅ [User Success]:', message);
    }
}

// ES6 Module Export
export default DashboardApp;
// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardEventSystem };
} else {
    window.DashboardEventSystem = DashboardEventSystem;
}
