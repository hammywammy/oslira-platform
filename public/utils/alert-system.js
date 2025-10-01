/*!
 * Oslira Universal Alert System v1.0.0
 * Complete working version with all methods
 */

(function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    const CONFIG = {
        maxVisible: 3,
        zIndex: 99999,
        topOffset: 20,
        containerId: 'oslira-alert-container',
        historyKey: 'oslira-alerts-history',
        maxHistory: 100,
        dedupeWindowMs: 3000,
        animationDuration: 300,
        defaultTimeout: {
            success: 5000,
            info: 5000,
            warning: 8000,
            error: null // Sticky by default
        }
    };

    // =========================================================================
    // ERROR MAPPINGS
    // =========================================================================
    const ERROR_MAPPINGS = {
            'Token has expired or is invalid': {
        title: 'Invalid Code',
        message: 'The verification code you entered is incorrect or has expired. Please try again.',
        suggestions: ['Double-check the 6-digit code', 'Request a new code if needed']
    },
    'For security purposes': {
        title: 'Rate Limited',
        message: 'Please wait before requesting another code.',
        suggestions: ['Wait a moment', 'Try again in a few seconds']
    },
        'Failed to fetch': {
            title: 'Connection Problem',
            message: 'Unable to connect. Please check your internet connection.',
            suggestions: ['Check your internet', 'Try refreshing the page']
        },
        'JWT expired': {
            title: 'Session Expired',
            message: 'Your session has expired. Please log in again.',
            actions: [{ label: 'Go to Login', action: 'redirect:/auth.html' }]
        },
        'Insufficient credits': {
            title: 'Not Enough Credits',
            message: 'You need more credits for this action.',
            actions: [{ label: 'Get Credits', action: 'redirect:/pricing.html' }]
        },
        'Profile not found': {
            title: 'Profile Not Found',
            message: 'We couldn\'t find that Instagram profile.',
            suggestions: ['Verify the username', 'Remove @ symbol', 'Check if profile is public']
        }
    };

    // =========================================================================
    // CRITICAL ERROR PATTERNS
    // =========================================================================
const CRITICAL_PATTERNS = [
    /unauthorized|forbidden|401|403/i,
    /session\s*expired|jwt\s*expired/i,
    /not\s*authenticated|not\s*logged/i,
    /insufficient|credits|payment|stripe/i,
    /subscription|billing/i,
    /failed\s*to\s*save|could\s*not\s*save/i,
    /data\s*loss|lost\s*data/i,
    /critical|fatal|severe/i,
    /database|connection\s*failed/i,
    /api\s*error|server\s*error|500|502|503/i,
    /analysis\s*failed|failed\s*to\s*analyze/i,
    /export\s*failed|download\s*failed/i,
    /could\s*not\s*load|failed\s*to\s*load/i,
    /rate\s*limit|too\s*many\s*requests|429/i,
    /email\s*rate\s*limit/i,
    /for\s*security\s*purposes.*after\s*\d+\s*seconds/i,  // ← Add this line
    /you\s*can\s*only\s*request\s*this\s*after/i, 
    /authentication\s*failed|login\s*failed|signin\s*failed/i,
    /incorrect\s*password|invalid\s*login|invalid\s*credentials/i
];

    // =========================================================================
    // IGNORE PATTERNS
    // =========================================================================
    const IGNORE_PATTERNS = [
        /^📊|^🔍|^✅|^❌|^🎯|^📝|^🚀|^🔧|^⚡|^🌐/,
        /debug:|info:|trace:/i,
        /ResizeObserver|Non-Error promise rejection captured/i,
        /gtag|google|analytics|facebook|stripe\.js/i,
        /extension:|chrome-extension:/i,
        /no\s*business\s*profiles/i,
        /no\s*leads\s*found/i,
        /waiting|pending|loading/i
    ];

    // =========================================================================
    // ALERT SYSTEM CLASS
    // =========================================================================
    class OsliraAlertSystem {
        constructor() {
            this.queue = [];
            this.visible = new Map();
            this.history = [];
            this.dedupeMap = new Map();
            this.initialized = false;
            this.container = null;
            this.originalConsole = null;
            this.pausedAlerts = new Set();
        }

        init() {
            if (this.initialized) return;
            
            // Store original console methods BEFORE staging guard disables them
            this.originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info
            };
            
            this.createContainer();
            this.loadHistory();
            this.createStyles();
            this.setupGlobalErrorHandling();
            this.setupCompatibilityLayer();
            this.detectPageContext();
            
            this.initialized = true;
            
            // Use original console.log to announce readiness
            if (this.originalConsole?.log) {
                this.originalConsole.log('✅ Alert System ready');
            }
        }

        // ---------------------------------------------------------------------
        // CRITICAL ERROR DETECTION
        // ---------------------------------------------------------------------
        isErrorCritical(error, context = {}) {
            const errorStr = typeof error === 'string' ? error : error?.message || error?.toString() || '';
            
            // Check ignore patterns first
            for (const pattern of IGNORE_PATTERNS) {
                if (pattern.test(errorStr)) {
                    return false;
                }
            }
            
            // Check critical patterns
            for (const pattern of CRITICAL_PATTERNS) {
                if (pattern.test(errorStr)) {
                    return true;
                }
            }
            
            // Context-based decisions
            if (context.critical || context.userAction) {
                return true;
            }
            
            return error instanceof Error && !errorStr.includes('console.');
        }

        // ---------------------------------------------------------------------
        // ERROR TRANSFORMATION
        // ---------------------------------------------------------------------
transformError(error) {
    const errorStr = typeof error === 'string' ? error : error?.message || '';
    
    // Handle specific rate limit messages FIRST (before generic mappings)
    if (errorStr.includes('For security purposes, you can only request this after')) {
        const match = errorStr.match(/after (\d+) seconds?/);
        const seconds = match ? match[1] : 'a few';
        return {
            title: 'Too Many Requests',
            message: `Please wait ${seconds} seconds before requesting another code.`,
            details: errorStr
        };
    }
    
    for (const [pattern, mapping] of Object.entries(ERROR_MAPPINGS)) {
        if (errorStr.includes(pattern)) {
            return mapping;
        }
    }
    
    return {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        details: errorStr
    };
}

        // ---------------------------------------------------------------------
        // MAIN API METHODS
        // ---------------------------------------------------------------------
        notify(severity, options) {
            if (typeof options === 'string') {
                options = { message: options };
            }
            
            const alert = {
                id: options.id || this.generateId(),
                severity: severity,
                title: options.title || this.getDefaultTitle(severity),
                message: options.message,
                details: options.details,
                actions: options.actions || [],
                suggestions: options.suggestions,
                timeoutMs: options.timeoutMs !== undefined ? options.timeoutMs : CONFIG.defaultTimeout[severity],
                dedupeKey: options.dedupeKey,
                timestamp: Date.now(),
                context: options.context
            };
            
            // Deduplication check
            if (alert.dedupeKey && this.dedupeMap.has(alert.dedupeKey)) {
                const existing = this.dedupeMap.get(alert.dedupeKey);
                if (Date.now() - existing.timestamp < CONFIG.dedupeWindowMs) {
                    this.updateDupeCount(existing.id);
                    return existing.id;
                }
            }
            
            this.queue.push(alert);
            
            if (alert.dedupeKey) {
                this.dedupeMap.set(alert.dedupeKey, alert);
            }
            
            this.processQueue();
            this.addToHistory(alert);
            
            return alert.id;
        }

        success(options) { return this.notify('success', options); }
        info(options) { return this.notify('info', options); }
        warning(options) { return this.notify('warning', options); }
        
error(error, options = {}) {
    // Authentication context is always critical
    if (options.context === 'authentication' || options.critical) {
        let errorOptions = options;
        
        if (error instanceof Error || typeof error === 'string') {
            const transformed = this.transformError(error);
            errorOptions = {
                ...transformed,
                ...options,
                details: options.details || error
            };
        }
        
        return this.notify('error', errorOptions);
    }
    
    // Normal critical error filtering for other contexts
    if (!this.isErrorCritical(error, options.context)) {
        if (this.originalConsole?.log) {
            this.originalConsole.log('🔇 Non-critical error suppressed:', error);
        }
        return null;
    }
    
    let errorOptions = options;
    
    if (error instanceof Error || typeof error === 'string') {
        const transformed = this.transformError(error);
        errorOptions = {
            ...transformed,
            ...options,
            details: options.details || error
        };
    }
    
    return this.notify('error', errorOptions);
}
        // ---------------------------------------------------------------------
        // DOM CREATION
        // ---------------------------------------------------------------------
        createContainer() {
            const existing = document.getElementById(CONFIG.containerId);
            if (existing) existing.remove();
            
            this.container = document.createElement('div');
            this.container.id = CONFIG.containerId;
            this.container.setAttribute('role', 'region');
            this.container.setAttribute('aria-label', 'Notifications');
            this.container.setAttribute('aria-live', 'polite');
            
            document.body.appendChild(this.container);
        }

        createStyles() {
            const styleId = 'oslira-alert-styles';
            if (document.getElementById(styleId)) return;
            
            const styles = document.createElement('style');
            styles.id = styleId;
            styles.textContent = `
                #${CONFIG.containerId} {
                    position: fixed;
                    top: ${CONFIG.topOffset}px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: ${CONFIG.zIndex};
                    pointer-events: none;
                    max-width: 480px;
                    min-width: 320px;
                    width: 90vw;
                }
                
                .oslira-alert {
                    pointer-events: auto;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    margin-bottom: 12px;
                    overflow: hidden;
                    animation: osliraSlideDown 0.3s ease-out;
                    position: relative;
                    border: 1px solid rgba(0,0,0,0.05);
                }
                
                .oslira-alert.removing {
                    animation: osliraSlideUp 0.3s ease-out forwards;
                }
                
                .oslira-alert-content {
                    padding: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }
                
                .oslira-alert-icon {
                    flex-shrink: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    color: white;
                }
                
                .oslira-alert-success .oslira-alert-icon { background: #10b981; }
                .oslira-alert-info .oslira-alert-icon { background: #3b82f6; }
                .oslira-alert-warning .oslira-alert-icon { background: #f59e0b; }
                .oslira-alert-error .oslira-alert-icon { background: #ef4444; }
                
                .oslira-alert-body {
                    flex: 1;
                    min-width: 0;
                }
                
                .oslira-alert-title {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                    font-size: 15px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .oslira-alert-message {
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.5;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .oslira-alert-suggestions {
                    margin-top: 8px;
                    padding: 8px;
                    background: rgba(0,0,0,0.03);
                    border-radius: 6px;
                    font-size: 13px;
                }
                
                .oslira-alert-suggestions .suggestions-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: #374151;
                }
                
                .oslira-alert-suggestions ul {
                    margin: 0;
                    padding-left: 20px;
                    color: #6b7280;
                }
                
                .oslira-alert-close {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    color: #9ca3af;
                    cursor: pointer;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    font-size: 18px;
                }
                
                .oslira-alert-close:hover {
                    background: rgba(0,0,0,0.05);
                    color: #6b7280;
                }
                
                .oslira-alert-actions {
                    padding: 0 16px 12px 52px;
                    display: flex;
                    gap: 8px;
                }
                
                .oslira-alert-action {
                    padding: 6px 12px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    color: #374151;
                    border-radius: 6px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .oslira-alert-action:hover {
                    background: #f3f4f6;
                    transform: translateY(-1px);
                }
                
                @keyframes osliraSlideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes osliraSlideUp {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                }
            `;
            
            document.head.appendChild(styles);
        }

        renderAlert(alert) {
            const alertEl = document.createElement('div');
            alertEl.id = `alert-${alert.id}`;
            alertEl.className = `oslira-alert oslira-alert-${alert.severity}`;
            alertEl.setAttribute('role', alert.severity === 'error' ? 'alert' : 'status');
            
            // Create suggestions HTML
            const suggestionsHtml = alert.suggestions ? `
                <div class="oslira-alert-suggestions">
                    <div class="suggestions-title">Try:</div>
                    <ul>
                        ${alert.suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            ` : '';
            
            // Create actions HTML
            const actionsHtml = alert.actions.length > 0 ? `
                <div class="oslira-alert-actions">
                    ${alert.actions.map(action => `
                        <button class="oslira-alert-action" data-action="${action.action || ''}" data-alert-id="${alert.id}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            ` : '';
            
            alertEl.innerHTML = `
                <div class="oslira-alert-content">
                    <div class="oslira-alert-icon">${this.getIcon(alert.severity)}</div>
                    <div class="oslira-alert-body">
                        <div class="oslira-alert-title">${alert.title}</div>
                        <div class="oslira-alert-message">${alert.message}</div>
                        ${suggestionsHtml}
                    </div>
                    <button class="oslira-alert-close" data-alert-id="${alert.id}" aria-label="Dismiss">
                        ✕
                    </button>
                </div>
                ${actionsHtml}
            `;
            
            // Add event listeners
            this.attachAlertEvents(alertEl, alert);
            
            return alertEl;
        }

        attachAlertEvents(alertEl, alert) {
            // Close button
            const closeBtn = alertEl.querySelector('.oslira-alert-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.dismiss(alert.id));
            }
            
            // Action buttons
            alertEl.querySelectorAll('.oslira-alert-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    this.handleAction(action, alert);
                });
            });
        }

        handleAction(action, alert) {
            if (!action) return;
            
            if (action.startsWith('redirect:')) {
                const url = action.replace('redirect:', '');
                window.location.href = url;
            } else if (action === 'retry') {
                window.dispatchEvent(new CustomEvent('alert-retry', { detail: alert }));
            } else if (action === 'reload') {
                window.location.reload();
            }
            
            this.dismiss(alert.id);
        }

        // ---------------------------------------------------------------------
        // QUEUE MANAGEMENT
        // ---------------------------------------------------------------------
        processQueue() {
            while (this.queue.length > 0 && this.visible.size < CONFIG.maxVisible) {
                const alert = this.queue.shift();
                this.showAlert(alert);
            }
        }

        showAlert(alert) {
            const alertEl = this.renderAlert(alert);
            this.container.appendChild(alertEl);
            this.visible.set(alert.id, alert);
            
            if (alert.timeoutMs) {
                alert.timeoutId = setTimeout(() => this.dismiss(alert.id), alert.timeoutMs);
            }
            
            alertEl.offsetHeight; // Trigger reflow
        }

        dismiss(alertId) {
            const alert = this.visible.get(alertId);
            if (!alert) return;
            
            const alertEl = document.getElementById(`alert-${alertId}`);
            if (alertEl) {
                alertEl.classList.add('removing');
                setTimeout(() => {
                    alertEl.remove();
                    this.visible.delete(alertId);
                    this.processQueue();
                }, CONFIG.animationDuration);
            }
            
            if (alert.timeoutId) {
                clearTimeout(alert.timeoutId);
            }
        }

        // ---------------------------------------------------------------------
        // HISTORY MANAGEMENT
        // ---------------------------------------------------------------------
        addToHistory(alert) {
            this.history.unshift(alert);
            if (this.history.length > CONFIG.maxHistory) {
                this.history = this.history.slice(0, CONFIG.maxHistory);
            }
            this.saveHistory();
        }

        saveHistory() {
            try {
                localStorage.setItem(CONFIG.historyKey, JSON.stringify(this.history));
            } catch (e) {
                console.warn('Failed to save alert history:', e);
            }
        }

        loadHistory() {
            try {
                const saved = localStorage.getItem(CONFIG.historyKey);
                if (saved) {
                    this.history = JSON.parse(saved);
                }
            } catch (e) {
                console.warn('Failed to load alert history:', e);
            }
        }

        // ---------------------------------------------------------------------
        // GLOBAL ERROR HANDLING
        // ---------------------------------------------------------------------
        setupGlobalErrorHandling() {
            // Capture unhandled errors
            window.addEventListener('error', (event) => {
                if (this.isErrorCritical(event.error || event.message, { context: 'global' })) {
                    this.error(event.error || event.message, {
                        context: 'JavaScript Error'
                    });
                }
            });
            
            // Capture unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                if (this.isErrorCritical(event.reason, { context: 'promise' })) {
                    this.error(event.reason, {
                        context: 'Unhandled Promise'
                    });
                }
            });
        }

        // ---------------------------------------------------------------------
        // COMPATIBILITY LAYER
        // ---------------------------------------------------------------------
        setupCompatibilityLayer() {
            // Support for existing OsliraApp.showMessage
            window.OsliraApp = window.OsliraApp || {};
            window.OsliraApp.showMessage = (message, type = 'info', duration) => {
                const method = type === 'error' ? 'error' : type;
                return this[method]({
                    message: message,
                    timeoutMs: duration
                });
            };
            
            // Support for showError functions
            window.showError = (message) => this.error(message);
            window.showSuccess = (message) => this.success({ message });
            window.showMessage = window.OsliraApp.showMessage;
        }

        // ---------------------------------------------------------------------
        // PAGE CONTEXT DETECTION
        // ---------------------------------------------------------------------
        detectPageContext() {
            const path = window.location.pathname;
            if (path.includes('dashboard')) {
                CONFIG.topOffset = 80;
            }
        }

        // ---------------------------------------------------------------------
        // UTILITY METHODS
        // ---------------------------------------------------------------------
        generateId() {
            return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        getIcon(severity) {
            const icons = { success: '✓', info: 'i', warning: '!', error: '✕' };
            return icons[severity] || 'i';
        }

        getDefaultTitle(severity) {
            const titles = { success: 'Success', info: 'Information', warning: 'Warning', error: 'Error' };
            return titles[severity] || 'Notification';
        }

        updateDupeCount(alertId) {
            const alertEl = document.getElementById(`alert-${alertId}`);
            if (!alertEl) return;
            
            let badge = alertEl.querySelector('.oslira-alert-dupe-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'oslira-alert-dupe-badge';
                badge.style.cssText = `
                    background: rgba(0,0,0,0.2);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 11px;
                    margin-left: 8px;
                `;
                alertEl.querySelector('.oslira-alert-title').appendChild(badge);
            }
            
            const currentCount = parseInt(badge.textContent || '1') + 1;
            badge.textContent = `×${currentCount}`;
        }

        // ---------------------------------------------------------------------
        // PUBLIC API FOR TESTING
        // ---------------------------------------------------------------------
        test() {
            console.log('🧪 Running Alert System tests...');
            
            this.success({ message: 'Test success message' });
            this.info({ message: 'Test info message' });
            this.warning({ message: 'Test warning message' });
            this.error('Test error message');
            
            console.log('✅ Tests dispatched. Check UI for results.');
        }

        getStats() {
            return {
                visible: this.visible.size,
                queued: this.queue.length,
                historyCount: this.history.length
            };
        }
    }

    // =========================================================================
    // INSTANTIATION
    // =========================================================================
    const alertSystem = new OsliraAlertSystem();
    
    // Expose global APIs
    window.AlertSystem = alertSystem;
    window.Alert = alertSystem;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => alertSystem.init());
    } else {
        setTimeout(() => alertSystem.init(), 0);
    }

})();
