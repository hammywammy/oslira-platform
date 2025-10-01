//public/pages/dashboard/modules/core/DashboardEventSystem.js

/**
 * DASHBOARD EVENT SYSTEM - Clean Event Management
 * Handles all dashboard-wide events without legacy cruft
 */
class DashboardEventSystem {
    
    /**
     * Setup all event handlers for the dashboard
     */
    static setupHandlers(eventBus, container) {
        console.log('📡 [DashboardEventSystem] Setting up event handlers...');
        
        this.setupDataEvents(eventBus, container);
        this.setupAnalysisEvents(eventBus, container);
        this.setupBusinessEvents(eventBus, container);
        this.setupErrorEvents(eventBus, container);
        
        console.log('✅ [DashboardEventSystem] Event handlers ready');
    }
    
    /**
     * Data refresh and loading events
     */
    static setupDataEvents(eventBus, container) {
        // Data refresh requests
        eventBus.on(window.DASHBOARD_EVENTS.DATA_REFRESH, async (data) => {
            console.log('🔄 [DashboardEventSystem] Data refresh requested:', data.reason);
            
            try {
                const leadManager = container.get('leadManager');
                await leadManager.loadDashboardData();
                
                eventBus.emit(window.DASHBOARD_EVENTS.DATA_REFRESH_COMPLETE, {
                    reason: data.reason,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                console.error('❌ [DashboardEventSystem] Data refresh failed:', error);
                eventBus.emit(window.DASHBOARD_EVENTS.DATA_ERROR, {
                    source: 'data_refresh',
                    error,
                    timestamp: Date.now()
                });
            }
        });
        
        // Data loading events
        eventBus.on(window.DASHBOARD_EVENTS.DATA_LOADING_START, (data) => {
            const stateManager = container.get('stateManager');
            stateManager.setState('isLoading', true);
            stateManager.setState('loadingMessage', data.message || 'Loading...');
        });
        
        eventBus.on(window.DASHBOARD_EVENTS.DATA_LOADING_END, () => {
            const stateManager = container.get('stateManager');
            stateManager.setState('isLoading', false);
        });
    }
    
    /**
     * Analysis completion and queue events
     */
    static setupAnalysisEvents(eventBus, container) {
        // Analysis completed - refresh data
eventBus.on(window.DASHBOARD_EVENTS.ANALYSIS_COMPLETED, async (data) => {
    console.log('🎯 [DashboardEventSystem] Analysis completed:', data.username || data.analysis?.username);
            
            try {
                // Refresh dashboard data
                const leadManager = container.get('leadManager');
                await leadManager.loadDashboardData();
                
                // Update stats
                const statsCalculator = container.get('statsCalculator');
                await statsCalculator.refreshStats();
                
                // Notify UI
                eventBus.emit(window.DASHBOARD_EVENTS.UI_UPDATE, {
                    type: 'analysis_complete',
                    username: data.username
                });
                
            } catch (error) {
                console.error('❌ [DashboardEventSystem] Post-analysis refresh failed:', error);
                eventBus.emit(window.DASHBOARD_EVENTS.DATA_ERROR, {
                    source: 'analysis_completion',
                    error,
                    context: data
                });
            }
        });
        
        // Analysis queue updates
        eventBus.on(window.DASHBOARD_EVENTS.ANALYSIS_QUEUE_UPDATE, (data) => {
            const stateManager = container.get('stateManager');
            stateManager.setState('analysisQueue', data.queue);
            stateManager.setState('analysisInProgress', data.inProgress);
        });
    }
    
    /**
     * Business profile change events
     */
    static setupBusinessEvents(eventBus, container) {
        // Business changed - reload all business-dependent data
        eventBus.on(window.DASHBOARD_EVENTS.BUSINESS_CHANGED, async (data) => {
            console.log('🏢 [DashboardEventSystem] Business changed:', data.businessId);
            
            try {
                // Update state first
                const stateManager = container.get('stateManager');
                stateManager.setState('selectedBusiness', data.business);
                
                // Reload data for new business
                const leadManager = container.get('leadManager');
                await leadManager.loadDashboardData();
                
                // Update stats
                const statsCalculator = container.get('statsCalculator');
                await statsCalculator.refreshStats();
                
                // Update real-time subscription
                const realtimeManager = container.get('realtimeManager');
                await realtimeManager.updateSubscription(data.businessId);
                
                eventBus.emit(window.DASHBOARD_EVENTS.BUSINESS_CHANGE_COMPLETE, {
                    businessId: data.businessId,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                console.error('❌ [DashboardEventSystem] Business change failed:', error);
                eventBus.emit(window.DASHBOARD_EVENTS.DATA_ERROR, {
                    source: 'business_change',
                    error,
                    context: data
                });
            }
        });
        
        // Business list updated
        eventBus.on(window.DASHBOARD_EVENTS.BUSINESS_LIST_UPDATED, (data) => {
            const stateManager = container.get('stateManager');
            stateManager.setState('businesses', data.businesses);
        });
    }
    
    /**
     * Error and system events
     */
    static setupErrorEvents(eventBus, container) {
        // Global error handler
        eventBus.on(window.DASHBOARD_EVENTS.ERROR, (errorData) => {
            console.log('🚨 [DashboardEventSystem] Global error:', errorData);
            this.handleGlobalError(errorData, container);
        });
        
        // Data errors
        eventBus.on(window.DASHBOARD_EVENTS.DATA_ERROR, (errorData) => {
            console.log('📊 [DashboardEventSystem] Data error:', errorData);
            this.handleDataError(errorData, container);
        });
        
        // Connection status changes
        eventBus.on(window.DASHBOARD_EVENTS.CONNECTION_STATUS_CHANGED, (data) => {
            const stateManager = container.get('stateManager');
            stateManager.setState('connectionStatus', data.status);
            stateManager.setState('lastConnectionUpdate', Date.now());
        });
        
        // Auth state changes
        eventBus.on(window.DASHBOARD_EVENTS.AUTH_CHANGED, async (data) => {
            console.log('🔐 [DashboardEventSystem] Auth state changed:', data.status);
            
            if (data.status === 'signed_out') {
                // Clear sensitive data
                const stateManager = container.get('stateManager');
                stateManager.batchUpdate({
                    leads: [],
                    businesses: [],
                    selectedBusiness: null,
                    user: null
                });
                
                // Redirect to auth
                window.location.href = '/auth';
            }
        });
    }
    
    /**
     * Handle global errors
     */
    static handleGlobalError(errorData, container) {
        const { source, error, context } = errorData;
        
        switch (source) {
            case 'business_change':
                console.warn('⚠️ [DashboardEventSystem] Business change failed, reverting...');
                // Could implement business revert logic here
                break;
                
            case 'data_refresh':
                console.warn('⚠️ [DashboardEventSystem] Data refresh failed');
                this.showUserError('Failed to refresh data. Please try again.');
                break;
                
            case 'analysis_completion':
                console.warn('⚠️ [DashboardEventSystem] Analysis completion handling failed');
                // Continue - not critical
                break;
                
            default:
                console.error('❌ [DashboardEventSystem] Unhandled error:', error);
                this.showUserError('An unexpected error occurred.');
        }
    }
    
    /**
     * Handle data-specific errors
     */
    static handleDataError(errorData, container) {
        const { source, error } = errorData;
        
        const stateManager = container.get('stateManager');
        stateManager.setState('isLoading', false);
        
        // Update error state
        stateManager.setState('lastError', {
            source,
            message: error.message,
            timestamp: Date.now()
        });
        
        // Show user-friendly message
        this.showUserError(this.getErrorMessage(source, error));
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
            'stats_calculation': 'Failed to calculate statistics'
        };
        
        return messages[source] || 'An error occurred';
    }
    
    /**
     * Show error message to user
     */
    static showUserError(message) {
        if (window.osliraAuth?.showMessage) {
            window.osliraAuth.showMessage(message, 'error');
        } else {
            console.error('User Error:', message);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardEventSystem };
} else {
    window.DashboardEventSystem = DashboardEventSystem;
}
