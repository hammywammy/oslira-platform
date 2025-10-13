// =============================================================================
// LOGGER - Centralized Logging System with Sentry Integration
// Path: /public/core/infrastructure/Logger.js
// Dependencies: None (loads first)
// =============================================================================

/**
 * @class Logger
 * @description Production-ready logging system with Sentry integration
 * 
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Sentry integration for errors
 * - Environment-aware (verbose in dev, quiet in prod)
 * - Structured logging with metadata
 * - Performance timing
 * - Log buffering and batching
 */
class Logger {
    constructor() {
        this.isInitialized = false;
        
        // Log levels
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
        
        // Current log level (set based on environment)
        this.currentLevel = this.levels.INFO;
        
        // Log buffer (for potential remote logging)
        this.logBuffer = [];
        this.maxBufferSize = 100;
        
        // Statistics
        this.stats = {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0
        };
        
        // Performance timers
        this.timers = new Map();
        
        console.log('📝 [Logger] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize logger
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [Logger] Already initialized');
            return;
        }
        
        try {
            console.log('📝 [Logger] Initializing...');
            
            // Detect environment
            this._detectEnvironment();
            
            // Setup Sentry if available
            this._setupSentry();
            
            this.isInitialized = true;
            console.log('✅ [Logger] Initialized');
            
        } catch (error) {
            console.error('❌ [Logger] Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Detect environment and set log level
     */
    _detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.currentLevel = this.levels.DEBUG;
            console.log('📝 [Logger] Development mode - verbose logging enabled');
        } else if (hostname.includes('staging') || hostname.includes('oslira.org')) {
            this.currentLevel = this.levels.INFO;
            console.log('📝 [Logger] Staging mode - info logging enabled');
        } else {
            this.currentLevel = this.levels.WARN;
            console.log('📝 [Logger] Production mode - warnings and errors only');
        }
    }
    
    /**
     * Setup Sentry integration
     */
    _setupSentry() {
        if (window.Sentry) {
            console.log('📝 [Logger] Sentry integration available');
            this.hasSentry = true;
        } else {
            console.log('📝 [Logger] Sentry not available');
            this.hasSentry = false;
        }
    }
    
    // =========================================================================
    // CORE LOGGING METHODS
    // =========================================================================
    
    /**
     * Log debug message
     */
    debug(message, data = {}) {
        if (this.currentLevel > this.levels.DEBUG) {
            return;
        }
        
        this.stats.debug++;
        
        const logEntry = this._createLogEntry('DEBUG', message, data);
        console.debug(`🔍 [${logEntry.component || 'App'}] ${message}`, data);
        
        this._addToBuffer(logEntry);
    }
    
    /**
     * Log info message
     */
    info(message, data = {}) {
        if (this.currentLevel > this.levels.INFO) {
            return;
        }
        
        this.stats.info++;
        
        const logEntry = this._createLogEntry('INFO', message, data);
        console.log(`ℹ️ [${logEntry.component || 'App'}] ${message}`, data);
        
        this._addToBuffer(logEntry);
    }
    
    /**
     * Log warning message
     */
    warn(message, data = {}) {
        if (this.currentLevel > this.levels.WARN) {
            return;
        }
        
        this.stats.warn++;
        
        const logEntry = this._createLogEntry('WARN', message, data);
        console.warn(`⚠️ [${logEntry.component || 'App'}] ${message}`, data);
        
        this._addToBuffer(logEntry);
        
        // Send to Sentry as breadcrumb
        if (this.hasSentry) {
            Sentry.addBreadcrumb({
                category: 'log',
                message,
                level: 'warning',
                data
            });
        }
    }
    
    /**
     * Log error message
     */
    error(message, data = {}) {
        this.stats.error++;
        
        const logEntry = this._createLogEntry('ERROR', message, data);
        console.error(`❌ [${logEntry.component || 'App'}] ${message}`, data);
        
        this._addToBuffer(logEntry);
        
        // Send to Sentry
        if (this.hasSentry) {
            // If data contains an error object, capture it
            if (data.error instanceof Error) {
                Sentry.captureException(data.error, {
                    tags: {
                        component: data.component || 'Unknown',
                        action: data.action || 'Unknown'
                    },
                    extra: data
                });
            } else {
                // Otherwise, capture as message
                Sentry.captureMessage(message, {
                    level: 'error',
                    tags: {
                        component: data.component || 'Unknown',
                        action: data.action || 'Unknown'
                    },
                    extra: data
                });
            }
        }
    }
    
    // =========================================================================
    // LOG ENTRY CREATION
    // =========================================================================
    
    /**
     * Create structured log entry
     */
    _createLogEntry(level, message, data) {
        return {
            level,
            message,
            data,
            timestamp: Date.now(),
            component: data.component || null,
            action: data.action || null,
            userId: this._getUserId(),
            sessionId: this._getSessionId()
        };
    }
    
    /**
     * Get current user ID (if available)
     */
    _getUserId() {
        try {
            return window.OsliraAuth?.user?.id || null;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Get session ID
     */
    _getSessionId() {
        try {
            return window.OsliraAuth?.session?.access_token?.substring(0, 10) || null;
        } catch (error) {
            return null;
        }
    }
    
    // =========================================================================
    // LOG BUFFER
    // =========================================================================
    
    /**
     * Add log entry to buffer
     */
    _addToBuffer(logEntry) {
        this.logBuffer.push(logEntry);
        
        // Trim buffer if too large
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
    }
    
    /**
     * Get log buffer
     */
    getBuffer() {
        return [...this.logBuffer];
    }
    
    /**
     * Clear log buffer
     */
    clearBuffer() {
        const count = this.logBuffer.length;
        this.logBuffer = [];
        console.log(`📝 [Logger] Buffer cleared (${count} entries)`);
    }
    
    /**
     * Export logs as JSON
     */
    exportLogs() {
        return JSON.stringify(this.logBuffer, null, 2);
    }
    
    // =========================================================================
    // PERFORMANCE TIMING
    // =========================================================================
    
    /**
     * Start performance timer
     */
    time(label) {
        this.timers.set(label, performance.now());
    }
    
    /**
     * End performance timer and log duration
     */
    timeEnd(label) {
        const startTime = this.timers.get(label);
        
        if (!startTime) {
            this.warn(`Timer "${label}" does not exist`);
            return;
        }
        
        const duration = performance.now() - startTime;
        this.timers.delete(label);
        
        this.info(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        
        return duration;
    }
    
    /**
     * Get elapsed time for timer (without ending it)
     */
    getTime(label) {
        const startTime = this.timers.get(label);
        
        if (!startTime) {
            return null;
        }
        
        return performance.now() - startTime;
    }
    
    // =========================================================================
    // GROUPED LOGGING
    // =========================================================================
    
    /**
     * Start log group
     */
    group(label) {
        console.group(label);
    }
    
    /**
     * Start collapsed log group
     */
    groupCollapsed(label) {
        console.groupCollapsed(label);
    }
    
    /**
     * End log group
     */
    groupEnd() {
        console.groupEnd();
    }
    
    // =========================================================================
    // TABLE LOGGING
    // =========================================================================
    
    /**
     * Log data as table
     */
    table(data) {
        console.table(data);
    }
    
    // =========================================================================
    // ASSERT LOGGING
    // =========================================================================
    
    /**
     * Assert condition and log if false
     */
    assert(condition, message, data = {}) {
        if (!condition) {
            this.error(`Assertion failed: ${message}`, data);
        }
    }
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    /**
     * Set log level
     */
    setLevel(level) {
        if (typeof level === 'string') {
            level = this.levels[level.toUpperCase()];
        }
        
        if (level === undefined) {
            throw new Error('Invalid log level');
        }
        
        this.currentLevel = level;
        console.log(`📝 [Logger] Log level set to: ${this._getLevelName(level)}`);
    }
    
    /**
     * Get level name
     */
    _getLevelName(level) {
        for (const [name, value] of Object.entries(this.levels)) {
            if (value === level) {
                return name;
            }
        }
        return 'UNKNOWN';
    }
    
    /**
     * Enable verbose logging
     */
    enableVerbose() {
        this.setLevel(this.levels.DEBUG);
    }
    
    /**
     * Disable verbose logging
     */
    disableVerbose() {
        this.setLevel(this.levels.INFO);
    }
    
    /**
     * Set max buffer size
     */
    setMaxBufferSize(size) {
        if (size < 1) {
            throw new Error('Buffer size must be at least 1');
        }
        
        this.maxBufferSize = size;
        
        // Trim current buffer if needed
        if (this.logBuffer.length > size) {
            this.logBuffer = this.logBuffer.slice(-size);
        }
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get logging statistics
     */
    getStats() {
        return {
            ...this.stats,
            total: this.stats.debug + this.stats.info + this.stats.warn + this.stats.error,
            bufferSize: this.logBuffer.length,
            maxBufferSize: this.maxBufferSize,
            currentLevel: this._getLevelName(this.currentLevel),
            activeTimers: this.timers.size
        };
    }
    
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0
        };
        console.log('📝 [Logger] Statistics reset');
    }
    
    // =========================================================================
    // SENTRY UTILITIES
    // =========================================================================
    
    /**
     * Set Sentry user context
     */
    setUser(user) {
        if (this.hasSentry && user) {
            Sentry.setUser({
                id: user.id,
                email: user.email,
                username: user.signature_name || user.full_name
            });
            
            this.debug('Sentry user context set', { userId: user.id });
        }
    }
    
    /**
     * Clear Sentry user context
     */
    clearUser() {
        if (this.hasSentry) {
            Sentry.setUser(null);
            this.debug('Sentry user context cleared');
        }
    }
    
    /**
     * Add Sentry breadcrumb
     */
    addBreadcrumb(category, message, data = {}) {
        if (this.hasSentry) {
            Sentry.addBreadcrumb({
                category,
                message,
                level: 'info',
                data
            });
        }
    }
    
    /**
     * Set Sentry tag
     */
    setTag(key, value) {
        if (this.hasSentry) {
            Sentry.setTag(key, value);
        }
    }
    
    /**
     * Set Sentry context
     */
    setContext(name, data) {
        if (this.hasSentry) {
            Sentry.setContext(name, data);
        }
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
            stats: this.getStats(),
            hasSentry: this.hasSentry,
            recentLogs: this.logBuffer.slice(-10)
        };
    }
    
    /**
     * Print debug info
     */
    debug() {
        console.group('📝 [Logger] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Recent Logs:', this.logBuffer.slice(-10));
        console.groupEnd();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Destroy logger
     */
    destroy() {
        this.clearBuffer();
        this.timers.clear();
        this.resetStats();
        this.isInitialized = false;
        
        console.log('🗑️ [Logger] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================

// Export for ES6 modules
export default Logger;

// Also keep window global for backwards compatibility
if (typeof window !== 'undefined') {
    window.DashboardApp = Logger;
}
