//public/pages/dashboard/modules/core/DashboardErrorSystem.js

/**
 * DASHBOARD ERROR SYSTEM - Clean Error Management
 * Handles all error scenarios with proper user feedback
 */
class DashboardErrorSystem {
    
    /**
     * Handle initialization errors
     */
    static handleInitializationError(error, context = {}) {
        console.error('🚨 [DashboardErrorSystem] Initialization error:', error);
        
        // Determine error type and appropriate response
        const errorType = this.classifyError(error);
        
        switch (errorType) {
            case 'AUTH_ERROR':
                this.handleAuthError(error);
                break;
                
            case 'NETWORK_ERROR':
                this.handleNetworkError(error);
                break;
                
            case 'DEPENDENCY_ERROR':
                this.handleDependencyError(error);
                break;
                
            case 'SCHEMA_ERROR':
                this.handleSchemaError(error);
                break;
                
            default:
                this.handleGenericError(error);
        }
        
        // Show fallback error state
        this.displayErrorState(error, errorType);
    }
    
    /**
     * Handle runtime errors during operation
     */
    static handleRuntimeError(error, context = {}) {
        console.error('🚨 [DashboardErrorSystem] Runtime error:', error);
        
        const errorType = this.classifyError(error);
        
        // Don't show full error state for runtime errors - just notify user
        this.showUserNotification(error, errorType, context);
        
        // Log for debugging
        this.logError(error, context);
        
        return this.getRecoveryAction(errorType);
    }
    
    /**
     * Classify error type
     */
    static classifyError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('auth') || message.includes('unauthorized')) {
            return 'AUTH_ERROR';
        }
        
        if (message.includes('network') || message.includes('fetch')) {
            return 'NETWORK_ERROR';
        }
        
        if (message.includes('not loaded') || message.includes('not available')) {
            return 'DEPENDENCY_ERROR';
        }
        
        if (message.includes('column') && message.includes('does not exist')) {
            return 'SCHEMA_ERROR';
        }
        
        if (message.includes('supabase.from is not a function')) {
            return 'DEPENDENCY_ERROR';
        }
        
        return 'GENERIC_ERROR';
    }
    
    /**
     * Handle authentication errors
     */
    static handleAuthError(error) {
        console.log('🔐 [DashboardErrorSystem] Authentication error detected');
        
        // Clear any cached auth data
        if (window.SimpleAuth?.signOut) {
            window.SimpleAuth.signOut();
        }
        
        // Redirect to auth page
        setTimeout(() => {
            window.location.href = '/auth?error=session_expired';
        }, 2000);
        
        this.showUserMessage('Session expired. Redirecting to login...', 'warning');
    }
    
    /**
     * Handle network connectivity errors
     */
    static handleNetworkError(error) {
        console.log('🌐 [DashboardErrorSystem] Network error detected');
        
        this.showUserMessage('Connection issue detected. Please check your internet connection.', 'error');
        
        // Could implement retry logic here
        return 'RETRY_AVAILABLE';
    }
    
    /**
     * Handle missing dependency errors
     */
    static handleDependencyError(error) {
        console.log('📦 [DashboardErrorSystem] Dependency error detected');
        
        this.showUserMessage('Loading error. Please refresh the page.', 'error');
        
        // Auto-refresh after delay
        setTimeout(() => {
            window.location.reload();
        }, 3000);
        
        return 'AUTO_REFRESH';
    }
    
    /**
     * Handle database schema errors
     */
    static handleSchemaError(error) {
        console.log('🗄️ [DashboardErrorSystem] Schema error detected');
        
        this.showUserMessage('Database update detected. Some features may be limited.', 'warning');
        
        return 'DEGRADED_MODE';
    }
    
    /**
     * Handle generic/unknown errors
     */
    static handleGenericError(error) {
        console.log('❓ [DashboardErrorSystem] Generic error detected');
        
        this.showUserMessage('An unexpected error occurred. Please try refreshing the page.', 'error');
        
        return 'USER_RETRY';
    }
    
    /**
     * Display error state UI
     */
    static displayErrorState(error, errorType) {
        const container = document.querySelector('.dashboard-container');
        if (!container) return;
        
        const errorConfig = this.getErrorConfig(errorType);
        
        container.innerHTML = `
            <div class="error-state">
                <div class="error-content">
                    <div class="error-icon">${errorConfig.icon}</div>
                    <h2>${errorConfig.title}</h2>
                    <p>${errorConfig.message}</p>
                    <div class="error-actions">
                        ${this.getErrorActions(errorType)}
                    </div>
                    <details class="error-details">
                        <summary>Technical Details</summary>
                        <pre>${error.message}</pre>
                    </details>
                </div>
            </div>
        `;
    }
    
    /**
     * Get error configuration
     */
    static getErrorConfig(errorType) {
        const configs = {
            AUTH_ERROR: {
                icon: '🔐',
                title: 'Authentication Required',
                message: 'Your session has expired. You will be redirected to login.'
            },
            NETWORK_ERROR: {
                icon: '🌐',
                title: 'Connection Problem',
                message: 'Unable to connect to the server. Please check your internet connection.'
            },
            DEPENDENCY_ERROR: {
                icon: '📦',
                title: 'Loading Error',
                message: 'Some components failed to load. The page will refresh automatically.'
            },
            SCHEMA_ERROR: {
                icon: '🗄️',
                title: 'Database Update',
                message: 'The database has been updated. Some features may be temporarily limited.'
            },
            GENERIC_ERROR: {
                icon: '⚠️',
                title: 'Something Went Wrong',
                message: 'An unexpected error occurred. Please try refreshing the page.'
            }
        };
        
        return configs[errorType] || configs.GENERIC_ERROR;
    }
    
    /**
     * Get error action buttons
     */
    static getErrorActions(errorType) {
        const actions = {
            AUTH_ERROR: `
                <button onclick="window.location.href='/auth'" class="btn btn-primary">
                    Go to Login
                </button>
            `,
            NETWORK_ERROR: `
                <button onclick="window.location.reload()" class="btn btn-primary">
                    Retry
                </button>
                <button onclick="DashboardErrorSystem.checkConnection()" class="btn btn-secondary">
                    Check Connection
                </button>
            `,
            DEPENDENCY_ERROR: `
                <button onclick="window.location.reload()" class="btn btn-primary">
                    Refresh Page
                </button>
            `,
            SCHEMA_ERROR: `
                <button onclick="window.location.reload()" class="btn btn-primary">
                    Refresh
                </button>
                <button onclick="window.location.href='/'" class="btn btn-secondary">
                    Go Home
                </button>
            `,
            GENERIC_ERROR: `
                <button onclick="window.location.reload()" class="btn btn-primary">
                    Refresh Page
                </button>
                <button onclick="window.location.href='/'" class="btn btn-secondary">
                    Go Home
                </button>
            `
        };
        
        return actions[errorType] || actions.GENERIC_ERROR;
    }
    
    /**
     * Show user notification for runtime errors
     */
    static showUserNotification(error, errorType, context) {
        const message = this.getUserMessage(errorType, context);
        const type = this.getNotificationType(errorType);
        
        this.showUserMessage(message, type);
    }
    
    /**
     * Get user-friendly message
     */
    static getUserMessage(errorType, context) {
        const messages = {
            AUTH_ERROR: 'Authentication issue. Please sign in again.',
            NETWORK_ERROR: 'Connection problem. Please check your internet.',
            DEPENDENCY_ERROR: 'Loading issue. Please refresh the page.',
            SCHEMA_ERROR: 'Data structure update detected.',
            GENERIC_ERROR: 'An error occurred. Please try again.'
        };
        
        return messages[errorType] || messages.GENERIC_ERROR;
    }
    
    /**
     * Get notification type for UI
     */
    static getNotificationType(errorType) {
        const types = {
            AUTH_ERROR: 'warning',
            NETWORK_ERROR: 'error',
            DEPENDENCY_ERROR: 'error',
            SCHEMA_ERROR: 'warning',
            GENERIC_ERROR: 'error'
        };
        
        return types[errorType] || 'error';
    }
    
    /**
     * Show message to user
     */
    static showUserMessage(message, type = 'error') {
        if (window.osliraAuth?.showMessage) {
            window.osliraAuth.showMessage(message, type);
        } else {
            // Fallback to console and alert
            console.error('User Message:', message);
            if (type === 'error') {
                alert(message);
            }
        }
    }
    
    /**
     * Get recovery action for error type
     */
    static getRecoveryAction(errorType) {
        const actions = {
            AUTH_ERROR: 'REDIRECT_AUTH',
            NETWORK_ERROR: 'RETRY_AVAILABLE',
            DEPENDENCY_ERROR: 'AUTO_REFRESH',
            SCHEMA_ERROR: 'DEGRADED_MODE',
            GENERIC_ERROR: 'USER_RETRY'
        };
        
        return actions[errorType] || 'USER_RETRY';
    }
    
    /**
     * Log error for debugging/monitoring
     */
    static logError(error, context) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Error Log:', errorLog);
        
        // Could send to monitoring service here
        // this.sendToMonitoring(errorLog);
    }
    
    /**
     * Check connection status (for network errors)
     */
    static checkConnection() {
        if (navigator.onLine) {
            this.showUserMessage('Connection appears to be working. Try refreshing the page.', 'info');
        } else {
            this.showUserMessage('No internet connection detected. Please check your connection.', 'warning');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardErrorSystem };
} else {
    window.DashboardErrorSystem = DashboardErrorSystem;
}
