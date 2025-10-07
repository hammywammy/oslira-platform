// =============================================================================
// MONITORING - Performance & Metrics Tracking (Complete)
// Path: /public/core/infrastructure/Monitoring.js
// Dependencies: Logger (optional)
// =============================================================================

/**
 * @class Monitoring
 * @description Track performance metrics and system health
 * 
 * Features:
 * - Performance timing tracking
 * - Resource usage monitoring
 * - Custom metrics
 * - Health checks
 * - Performance budgets
 * - Real User Monitoring (RUM) metrics
 */
class Monitoring {
    constructor() {
        this.isInitialized = false;
        this.logger = null;
        
        // Metrics storage
        this.metrics = new Map();
        this.timings = new Map();
        this.marks = new Map();
        
        // Performance budgets (ms)
        this.budgets = {
            pageLoad: 3000,
            timeToInteractive: 5000,
            firstContentfulPaint: 1500,
            largestContentfulPaint: 2500,
            cumulativeLayoutShift: 0.1,
            firstInputDelay: 100
        };
        
        // Health status
        this.health = {
            status: 'healthy',
            lastCheck: null,
            issues: []
        };
        
        console.log('📊 [Monitoring] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize monitoring
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [Monitoring] Already initialized');
            return;
        }
        
        try {
            console.log('📊 [Monitoring] Initializing...');
            
            this.logger = dependencies.logger || window.OsliraLogger;
            
            // Setup performance observers
            this.setupPerformanceObservers();
            
            // Track page load metrics
            this.trackPageLoad();
            
            // Setup periodic health checks
            this.startHealthChecks();
            
            this.isInitialized = true;
            console.log('✅ [Monitoring] Initialized');
            
        } catch (error) {
            console.error('❌ [Monitoring] Initialization failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // PERFORMANCE OBSERVERS
    // =========================================================================
    
    /**
     * Setup performance observers for Web Vitals
     */
    setupPerformanceObservers() {
        try {
            // Observe navigation timing
            if (window.PerformanceObserver) {
                // First Contentful Paint
                const fcpObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            this.recordMetric('fcp', entry.startTime);
                            this.checkBudget('firstContentfulPaint', entry.startTime);
                        }
                    }
                });
                fcpObserver.observe({ entryTypes: ['paint'] });
                
                // Largest Contentful Paint
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.recordMetric('lcp', lastEntry.startTime);
                    this.checkBudget('largestContentfulPaint', lastEntry.startTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // First Input Delay
                const fidObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordMetric('fid', entry.processingStart - entry.startTime);
                        this.checkBudget('firstInputDelay', entry.processingStart - entry.startTime);
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                
                // Cumulative Layout Shift
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            this.recordMetric('cls', clsValue);
                            this.checkBudget('cumulativeLayoutShift', clsValue);
                        }
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                
                console.log('✅ [Monitoring] Performance observers setup');
            }
        } catch (error) {
            console.error('❌ [Monitoring] Failed to setup observers:', error);
        }
    }
    
    // =========================================================================
    // PAGE LOAD TRACKING
    // =========================================================================
    
    /**
     * Track page load performance
     */
    trackPageLoad() {
        if (document.readyState === 'complete') {
            this._capturePageLoadMetrics();
        } else {
            window.addEventListener('load', () => {
                this._capturePageLoadMetrics();
            });
        }
    }
    
    /**
     * Capture page load metrics
     */
    _capturePageLoadMetrics() {
        try {
            const perfData = window.performance.timing;
            const navigation = window.performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                // Modern Navigation Timing API
                this.recordMetric('domContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
                this.recordMetric('pageLoad', navigation.loadEventEnd - navigation.fetchStart);
                this.recordMetric('domInteractive', navigation.domInteractive - navigation.fetchStart);
                
                this.checkBudget('pageLoad', navigation.loadEventEnd - navigation.fetchStart);
            } else if (perfData) {
                // Fallback to older Timing API
                this.recordMetric('pageLoad', perfData.loadEventEnd - perfData.navigationStart);
                this.recordMetric('domContentLoaded', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
                
                this.checkBudget('pageLoad', perfData.loadEventEnd - perfData.navigationStart);
            }
            
            if (this.logger) {
                this.logger.info('[Monitoring] Page load metrics captured', this.getMetrics());
            }
        } catch (error) {
            console.error('❌ [Monitoring] Failed to capture page load metrics:', error);
        }
    }
    
    // =========================================================================
    // CUSTOM METRICS
    // =========================================================================
    
    /**
     * Record custom metric
     */
    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        this.metrics.get(name).push({
            value,
            timestamp: Date.now()
        });
        
        // Keep only last 100 entries per metric
        if (this.metrics.get(name).length > 100) {
            this.metrics.get(name).shift();
        }
    }
    
    /**
     * Get metric values
     */
    getMetric(name) {
        return this.metrics.get(name) || [];
    }
    
    /**
     * Get latest metric value
     */
    getLatestMetric(name) {
        const metric = this.metrics.get(name);
        return metric && metric.length > 0 ? metric[metric.length - 1].value : null;
    }
    
    /**
     * Get all metrics
     */
    getMetrics() {
        const allMetrics = {};
        
        for (const [name, values] of this.metrics.entries()) {
            allMetrics[name] = values[values.length - 1]?.value || null;
        }
        
        return allMetrics;
    }
    
    /**
     * Clear metric
     */
    clearMetric(name) {
        this.metrics.delete(name);
    }
    
    /**
     * Clear all metrics
     */
    clearAllMetrics() {
        this.metrics.clear();
    }
    
    // =========================================================================
    // PERFORMANCE TIMING
    // =========================================================================
    
    /**
     * Start timing
     */
    startTiming(name) {
        this.timings.set(name, performance.now());
    }
    
    /**
     * End timing and record metric
     */
    endTiming(name) {
        const startTime = this.timings.get(name);
        
        if (!startTime) {
            console.warn(`⚠️ [Monitoring] Timing "${name}" not found`);
            return null;
        }
        
        const duration = performance.now() - startTime;
        this.timings.delete(name);
        
        this.recordMetric(name, duration);
        
        return duration;
    }
    
    /**
     * Mark performance point
     */
    mark(name) {
        if (window.performance.mark) {
            performance.mark(name);
        }
        this.marks.set(name, performance.now());
    }
    
    /**
     * Measure between two marks
     */
    measure(name, startMark, endMark) {
        try {
            if (window.performance.measure) {
                performance.measure(name, startMark, endMark);
                
                const measures = performance.getEntriesByName(name, 'measure');
                if (measures.length > 0) {
                    const duration = measures[measures.length - 1].duration;
                    this.recordMetric(name, duration);
                    return duration;
                }
            }
            
            // Fallback to manual calculation
            const start = this.marks.get(startMark);
            const end = this.marks.get(endMark);
            
            if (start && end) {
                const duration = end - start;
                this.recordMetric(name, duration);
                return duration;
            }
        } catch (error) {
            console.error('❌ [Monitoring] Measure failed:', error);
        }
        
        return null;
    }
    
    // =========================================================================
    // PERFORMANCE BUDGETS
    // =========================================================================
    
    /**
     * Check if metric exceeds budget
     */
    checkBudget(name, value) {
        const budget = this.budgets[name];
        
        if (!budget) {
            return true;
        }
        
        const exceedsBudget = value > budget;
        
        if (exceedsBudget) {
            const message = `Performance budget exceeded: ${name} (${value.toFixed(2)}ms > ${budget}ms)`;
            
            console.warn(`⚠️ [Monitoring] ${message}`);
            
            if (this.logger) {
                this.logger.warn(message, {
                    component: 'Monitoring',
                    metric: name,
                    value,
                    budget
                });
            }
            
            this.health.issues.push({
                type: 'budget',
                metric: name,
                value,
                budget,
                timestamp: Date.now()
            });
        }
        
        return !exceedsBudget;
    }
    
    /**
     * Set performance budget
     */
    setBudget(name, value) {
        this.budgets[name] = value;
    }
    
    /**
     * Get all budgets
     */
    getBudgets() {
        return { ...this.budgets };
    }
    
    // =========================================================================
    // RESOURCE MONITORING
    // =========================================================================
    
    /**
     * Get memory usage (if available)
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
                usagePercent: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
            };
        }
        return null;
    }
    
    /**
     * Get network information
     */
    getNetworkInfo() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }
    
    /**
     * Get device info
     */
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory || null,
            maxTouchPoints: navigator.maxTouchPoints || 0
        };
    }
    
    // =========================================================================
    // HEALTH CHECKS
    // =========================================================================
    
    /**
     * Start periodic health checks
     */
    startHealthChecks() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Every minute
        
        // Initial check
        this.performHealthCheck();
    }
    
    /**
     * Stop health checks
     */
    stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
    
    /**
     * Perform health check
     */
    performHealthCheck() {
        this.health.lastCheck = Date.now();
        this.health.issues = [];
        
        // Check memory usage
        const memory = this.getMemoryUsage();
        if (memory && memory.usagePercent > 90) {
            this.health.issues.push({
                type: 'memory',
                severity: 'high',
                message: `High memory usage: ${memory.usagePercent}%`
            });
        }
        
        // Check error rate (if ErrorHandler available)
        if (window.OsliraErrorHandler) {
            const errorRate = window.OsliraErrorHandler.getErrorRate();
            if (errorRate > 10) {
                this.health.issues.push({
                    type: 'errors',
                    severity: 'medium',
                    message: `High error rate: ${errorRate} errors/min`
                });
            }
        }
        
        // Check performance metrics
        const lcp = this.getLatestMetric('lcp');
        if (lcp && lcp > this.budgets.largestContentfulPaint * 2) {
            this.health.issues.push({
                type: 'performance',
                severity: 'medium',
                message: `Poor LCP: ${lcp.toFixed(2)}ms`
            });
        }
        
        // Determine overall health status
        if (this.health.issues.length === 0) {
            this.health.status = 'healthy';
        } else {
            const hasHighSeverity = this.health.issues.some(i => i.severity === 'high');
            this.health.status = hasHighSeverity ? 'critical' : 'degraded';
        }
        
        if (this.logger && this.health.issues.length > 0) {
            this.logger.warn('[Monitoring] Health issues detected', {
                status: this.health.status,
                issues: this.health.issues
            });
        }
    }
    
    /**
     * Get health status
     */
    getHealthStatus() {
        return {
            ...this.health,
            memory: this.getMemoryUsage(),
            network: this.getNetworkInfo()
        };
    }
    
    // =========================================================================
    // WEB VITALS SUMMARY
    // =========================================================================
    
    /**
     * Get Web Vitals summary
     */
    getWebVitals() {
        return {
            fcp: this.getLatestMetric('fcp'),
            lcp: this.getLatestMetric('lcp'),
            fid: this.getLatestMetric('fid'),
            cls: this.getLatestMetric('cls'),
            ttfb: this.getLatestMetric('ttfb')
        };
    }
    
    /**
     * Get Web Vitals score (0-100)
     */
    getWebVitalsScore() {
        const vitals = this.getWebVitals();
        let score = 100;
        
        // FCP score (deduct up to 20 points)
        if (vitals.fcp) {
            if (vitals.fcp > 3000) score -= 20;
            else if (vitals.fcp > 1800) score -= 10;
        }
        
        // LCP score (deduct up to 30 points)
        if (vitals.lcp) {
            if (vitals.lcp > 4000) score -= 30;
            else if (vitals.lcp > 2500) score -= 15;
        }
        
        // FID score (deduct up to 20 points)
        if (vitals.fid) {
            if (vitals.fid > 300) score -= 20;
            else if (vitals.fid > 100) score -= 10;
        }
        
        // CLS score (deduct up to 30 points)
        if (vitals.cls) {
            if (vitals.cls > 0.25) score -= 30;
            else if (vitals.cls > 0.1) score -= 15;
        }
        
        return Math.max(0, score);
    }
    
    // =========================================================================
    // REPORTING
    // =========================================================================
    
    /**
     * Generate performance report
     */
    generateReport() {
        return {
            timestamp: Date.now(),
            metrics: this.getMetrics(),
            webVitals: this.getWebVitals(),
            webVitalsScore: this.getWebVitalsScore(),
            health: this.getHealthStatus(),
            memory: this.getMemoryUsage(),
            network: this.getNetworkInfo(),
            device: this.getDeviceInfo(),
            budgets: this.getBudgets()
        };
    }
    
    /**
     * Export report as JSON
     */
    exportReport() {
        return JSON.stringify(this.generateReport(), null, 2);
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalMetrics: this.metrics.size,
            activeTimings: this.timings.size,
            marks: this.marks.size,
            healthStatus: this.health.status,
            healthIssues: this.health.issues.length,
            lastHealthCheck: this.health.lastCheck
        };
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
            webVitals: this.getWebVitals(),
            webVitalsScore: this.getWebVitalsScore(),
            health: this.health,
            recentMetrics: Array.from(this.metrics.keys()).slice(0, 10)
        };
    }
    
    /**
     * Print debug info
     */
    debug() {
        console.group('📊 [Monitoring] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Web Vitals:', this.getWebVitals());
        console.log('Score:', this.getWebVitalsScore());
        console.log('Health:', this.health);
        console.groupEnd();
    }
    
    /**
     * Print full report
     */
    printReport() {
        console.group('📊 [Monitoring] Performance Report');
        console.log('Metrics:', this.getMetrics());
        console.log('Web Vitals:', this.getWebVitals());
        console.log('Score:', this.getWebVitalsScore());
        console.log('Health:', this.getHealthStatus());
        console.log('Memory:', this.getMemoryUsage());
        console.log('Network:', this.getNetworkInfo());
        console.log('Device:', this.getDeviceInfo());
        console.groupEnd();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Destroy monitoring
     */
    destroy() {
        this.stopHealthChecks();
        this.clearAllMetrics();
        this.timings.clear();
        this.marks.clear();
        this.isInitialized = false;
        
        console.log('🗑️ [Monitoring] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraMonitoring = Monitoring;

// Create singleton instance (initialize later via container)
window.OsliraMonitor = new Monitoring();

console.log('✅ [Monitoring] Class loaded, awaiting initialization');
