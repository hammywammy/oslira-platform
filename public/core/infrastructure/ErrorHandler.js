// =============================================================================
// ERROR HANDLER - Global Error Capture System
// Path: /public/core/infrastructure/ErrorHandler.js
// Dependencies: Logger
// =============================================================================

/**
 * @class ErrorHandler
 * @description Catches all unhandled errors and rejections
 * 
 * Features:
 * - Global error event listeners
 * - Unhandled promise rejection capture
 * - Error categorization
 * - Sentry integration via Logger
 * - User-friendly error messages
 * - Error recovery strategies
 */
class ErrorHandler {
    constructor() {
        this.isInitialized = false;
        this.logger = null;
        
        // Error tracking
        this.errorCount = 0;
        this.errorHistory = [];
        this.maxHistorySize = 50;
        
        // Error categories
        this.categories = {
            NETWORK: 'network',
            AUTH: 'auth',
            API: 'api',
            RENDER: 'render',
            RUNTIME: 'runtime',
            UNKNOWN: 'unknown'
        };
        
        // Handlers
        this.errorHandler = null;
        this.rejectionHandler = null;
        
        console.log('🛡️ [ErrorHandler] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize error handler
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [ErrorHandler] Already initialized');
            return;
        }
        
        try {
            console.log('🛡️ [ErrorHandler] Initializing...');
            
            // Get logger
            this.logger = dependencies.logger || window.OsliraLogger;
            
            if (!this.logger) {
                console.warn('⚠️ [ErrorHandler] Logger not available');
            }
            
            // Setup global error handlers
            this.setupGlobalHandlers();
            
            this.isInitialized = true;
            console.log('✅ [ErrorHandler] Initialized');
            
        } catch (error) {
            console.error('❌ [ErrorHandler] Initialization failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // GLOBAL ERROR HANDLERS
    // =========================================================================
    
    /**
     * Setup global error event listeners
     */
    setupGlobalHandlers() {
        // Catch unhandled errors
        this.errorHandler = (event) => {
            this.handleError(event.error || event.message, {
                type: 'window.onerror',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
            
            // Prevent default browser error handling
            event.preventDefault();
        };
        
        window.addEventListener('error', this.errorHandler);
        
        // Catch unhandled promise rejections
        this.rejectionHandler = (event) => {
            this.handleRejection(event.reason, {
                type: 'unhandledrejection',
                promise: event.promise
            });
            
            // Prevent default browser rejection handling
            event.preventDefault();
        };
        
        window.addEventListener('unhandledrejection', this.rejectionHandler);
        
        console.log('✅ [ErrorHandler] Global handlers setup');
    }
    
    /**
     * Remove global handlers
     */
    removeGlobalHandlers() {
        if (this.errorHandler) {
            window.removeEventListener('error', this.errorHandler);
            this.errorHandler = null;
        }
        
        if (this.rejectionHandler) {
            window.removeEventListener('unhandledrejection', this.rejectionHandler);
            this.rejectionHandler = null;
        }
        
        console.log('🛡️ [ErrorHandler] Global handlers removed');
    }
    
    // =========================================================================
    // ERROR HANDLING
    // =========================================================================
    
    /**
     * Handle error
     */
    handleError(error, context = {}) {
        this.errorCount++;
        
        // Normalize error
        const normalizedError = this._normalizeError(error);
        
        // Categorize error
        const category = this._categorizeError(normalizedError, context);
        
        // Create error entry
        const errorEntry = {
            error: normalizedError,
            category,
            context,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Add to history
        this._addToHistory(errorEntry);
        
        // Log error
        if (this.logger) {
            this.logger.error(normalizedError.message, {
                component: 'ErrorHandler',
                category,
                stack: normalizedError.stack,
                ...context
            });
        } else {
            console.error('🛡️ [ErrorHandler] Error caught:', normalizedError);
        }
        
        // Show user-friendly message (in production)
        if (this._shouldShowUserMessage(category)) {
            this._showUserMessage(category, normalizedError);
        }
        
        return errorEntry;
    }
    
    /**
     * Handle promise rejection
     */
    handleRejection(reason, context = {}) {
        console.error('🛡️ [ErrorHandler] Unhandled rejection:', reason);
        
        // Convert reason to error
        const error = reason instanceof Error ? reason : new Error(String(reason));
        
        return this.handleError(error, {
            ...context,
            isRejection: true
        });
    }
    
    // =========================================================================
    // ERROR NORMALIZATION
    // =========================================================================
    
    /**
     * Normalize error to standard format
     */
    _normalizeError(error) {
        // Already an Error object
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        
        // String error
        if (typeof error === 'string') {
            return {
                name: 'Error',
                message: error,
                stack: null
            };
        }
        
        // Object with message
        if (error && typeof error === 'object' && error.message) {
            return {
                name: error.name || 'Error',
                message: error.message,
                stack: error.stack || null
            };
        }
        
        // Unknown error type
        return {
            name: 'UnknownError',
            message: String(error),
            stack: null
        };
    }
    
    // =========================================================================
    // ERROR CATEGORIZATION
    // =========================================================================
    
    /**
     * Categorize error by type
     */
    _categorizeError(error, context) {
        const message = error.message.toLowerCase();
        
        // Network errors
        if (message.includes('network') || 
            message.includes('fetch') || 
            message.includes('timeout') ||
            message.includes('cors')) {
            return this.categories.NETWORK;
        }
        
        // Auth errors
        if (message.includes('auth') || 
            message.includes('token') || 
            message.includes('unauthorized') ||
            message.includes('forbidden')) {
            return this.categories.AUTH;
        }
        
        // API errors
        if (message.includes('api') || 
            message.includes('request') || 
            message.includes('response') ||
            context.type === 'api') {
            return this.categories.API;
        }
        
        // Render errors
        if (message.includes('render') || 
            message.includes('component') || 
            error.name === 'TypeError') {
            return this.categories.RENDER;
        }
        
        // Runtime errors
        if (error.name === 'ReferenceError' || 
            error.name === 'SyntaxError') {
            return this.categories.RUNTIME;
        }
        
        return this.categories.UNKNOWN;
    }
    
    // =========================================================================
    // USER MESSAGES
    // =========================================================================
    
    /**
     * Check if should show user message
     */
    _shouldShowUserMessage(category) {
        // Only show in production
        const isProduction = !window.location.hostname.includes('localhost');
        
        // Don't spam users with messages
        const recentErrors = this.errorHistory.filter(
            e => Date.now() - e.timestamp < 5000
        );
        
        return isProduction && recentErrors.length <= 3;
    }
    
    /**
     * Show user-friendly error message
     */
    _showUserMessage(category, error) {
        const messages = {
            [this.categories.NETWORK]: 'Network connection issue. Please check your internet connection.',
            [this.categories.AUTH]: 'Authentication error. Please try signing in again.',
            [this.categories.API]: 'Unable to connect to server. Please try again.',
            [this.categories.RENDER]: 'Display error occurred. Refreshing the page may help.',
            [this.categories.RUNTIME]: 'Application error occurred. Please refresh the page.',
            [this.categories.UNKNOWN]: 'An unexpected error occurred. Please try again.'
        };
        
        const message = messages[category] || messages[this.categories.UNKNOWN];
        
        // Use UI system if available
        if (window.OsliraUI) {
            window.OsliraUI.toast.error(message);
        } else {
            alert(message);
        }
    }
    
    // =========================================================================
    // ERROR HISTORY
    // =========================================================================
    
    /**
     * Add error to history
     */
    _addToHistory(errorEntry) {
        this.errorHistory.push(errorEntry);
        
        // Trim history if too large
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
    }
    
    /**
     * Get error history
     */
    getHistory(category = null) {
        if (category) {
            return this.errorHistory.filter(e => e.category === category);
        }
        return [...this.errorHistory];
    }
    
    /**
     * Clear error history
     */
    clearHistory() {
        const count = this.errorHistory.length;
        this.errorHistory = [];
        console.log(`🛡️ [ErrorHandler] History cleared (${count} entries)`);
    }
    
    // =========================================================================
    // MANUAL ERROR REPORTING
    // =========================================================================
    
    /**
     * Manually report an error
     */
    reportError(error, context = {}) {
        return this.handleError(error, {
            ...context,
            manual: true
        });
    }
    
    /**
     * Report warning (non-critical)
     */
    reportWarning(message, context = {}) {
        if (this.logger) {
            this.logger.warn(message, {
                component: 'ErrorHandler',
                ...context
            });
        }
    }
    
    // =========================================================================
    // ERROR RECOVERY
    // =========================================================================
    
    /**
     * Try to recover from error
     */
    tryRecover(category) {
        console.log(`🛡️ [ErrorHandler] Attempting recovery for: ${category}`);
        
        switch (category) {
            case this.categories.NETWORK:
                // Wait for network to recover
                return this._waitForNetwork();
                
            case this.categories.AUTH:
                // Redirect to auth page
                window.location.href = window.OsliraEnv?.getAuthUrl() || '/auth';
                return;
                
            case this.categories.API:
                // Retry after delay
                return new Promise(resolve => setTimeout(resolve, 3000));
                
            default:
                // No recovery strategy
                return Promise.resolve();
        }
    }
    
    /**
     * Wait for network connection
     */
    _waitForNetwork() {
        return new Promise((resolve) => {
            if (navigator.onLine) {
                resolve();
                return;
            }
            
            const checkConnection = () => {
                if (navigator.onLine) {
                    window.removeEventListener('online', checkConnection);
                    resolve();
                }
            };
            
            window.addEventListener('online', checkConnection);
        });
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get error statistics
     */
    getStats() {
        const byCategory = {};
        
        for (const category of Object.values(this.categories)) {
            byCategory[category] = this.errorHistory.filter(
                e => e.category === category
            ).length;
        }
        
        return {
            totalErrors: this.errorCount,
            recentErrors: this.errorHistory.length,
            byCategory,
            lastError: this.errorHistory[this.errorHistory.length - 1] || null
        };
    }
    
    /**
     * Get error rate (errors per minute)
     */
    getErrorRate() {
        const oneMinuteAgo = Date.now() - 60000;
        const recentErrors = this.errorHistory.filter(
            e => e.timestamp > oneMinuteAgo
        );
        
        return recentErrors.length;
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            hasLogger: !!this.logger,
            stats: this.getStats(),
            errorRate: this.getErrorRate(),
            recentErrors: this.errorHistory.slice(-5)
        };
    }
    
    /**
     * Print debug info
     */
    debug() {
        console.group('🛡️ [ErrorHandler] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Error Rate:', this.getErrorRate(), 'errors/min');
        console.log('Recent Errors:', this.errorHistory.slice(-5));
        console.groupEnd();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Destroy error handler
     */
    destroy() {
        this.removeGlobalHandlers();
        this.clearHistory();
        this.errorCount = 0;
        this.isInitialized = false;
        
        console.log('🗑️ [ErrorHandler] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraErrorHandler = new ErrorHandler();

// Auto-initialize (depends on Logger which auto-inits)
setTimeout(() => {
    window.OsliraErrorHandler.initialize().catch(console.error);
}, 100);

console.log('✅ [ErrorHandler] Loaded, awaiting initialization');
if (window.Oslira?.init) {
    window.Oslira.init.register('Logger', window.OsliraLogger);
    console.log('📋 [Logger] Registered with Coordinator');
}
