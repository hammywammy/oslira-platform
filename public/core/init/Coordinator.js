// =============================================================================
// COORDINATOR - Async Service Initialization Coordinator
// Path: /public/core/init/Coordinator.js
// Dependencies: None (loads early)
// =============================================================================

/**
 * @class CoordinatorMonitoring
 * @description Internal monitoring helper for Coordinator (simplified)
 */
class CoordinatorMonitoring {
    constructor() {
        this.metrics = new Map();
        this.startTime = null;
        this.endTime = null;
        
        console.log('📊 [CoordinatorMonitoring] Instance created');
    }
    
    start() {
        this.startTime = Date.now();
    }
    
    end() {
        this.endTime = Date.now();
    }
    
    recordMetric(name, value) {
        this.metrics.set(name, {
            value,
            timestamp: Date.now()
        });
    }
    
    getMetrics() {
        const result = {};
        for (const [name, data] of this.metrics.entries()) {
            result[name] = data.value;
        }
        return result;
    }
    
    getDuration() {
        if (!this.startTime || !this.endTime) {
            return null;
        }
        return this.endTime - this.startTime;
    }
}

/**
 * @class Coordinator
 * @description Coordinates async service initialization with waitFor() pattern
 * 
 * Features:
 * - Async service registration
 * - waitFor() to prevent race conditions
 * - Timeout handling
 * - Service ready tracking
 * - Progress monitoring
 */
class Coordinator {
    constructor() {
        this.services = new Map();
        this.readyServices = new Set();
        this.pendingWaiters = new Map();
        this.monitoring = new CoordinatorMonitoring();
        
        console.log('🎯 [Coordinator] Instance created');
    }
    
    // =========================================================================
    // SERVICE REGISTRATION
    // =========================================================================
    
    /**
     * Register a service as ready
     * @param {string} name - Service name
     * @param {Object} instance - Service instance
     */
    register(name, instance) {
        if (this.readyServices.has(name)) {
            console.warn(`⚠️ [Coordinator] Service ${name} already registered`);
            return;
        }
        
        this.services.set(name, instance);
        this.readyServices.add(name);
        
        console.log(`✅ [Coordinator] ${name} registered and ready`);
        
        // Resolve any pending waiters
        this.resolvePendingWaiters(name, instance);
    }
    
    /**
     * Check if service is ready
     * @param {string} name - Service name
     * @returns {boolean}
     */
    isReady(name) {
        return this.readyServices.has(name);
    }
    
    /**
     * Get service if ready
     * @param {string} name - Service name
     * @returns {Object|null}
     */
    get(name) {
        if (!this.isReady(name)) {
            console.warn(`⚠️ [Coordinator] Service ${name} not ready yet`);
            return null;
        }
        return this.services.get(name);
    }
    
    // =========================================================================
    // ASYNC WAITING
    // =========================================================================
    
    /**
     * Wait for service to be ready
     * @param {string} name - Service name
     * @param {number} timeout - Timeout in ms (default: 30000)
     * @returns {Promise<Object>}
     */
    async waitFor(name, timeout = 30000) {
        // If already ready, return immediately
        if (this.isReady(name)) {
            return this.services.get(name);
        }
        
        console.log(`⏳ [Coordinator] Waiting for ${name}...`);
        
        // Create promise that resolves when service is ready
        return new Promise((resolve, reject) => {
            // Setup timeout
            const timeoutId = setTimeout(() => {
                this.removePendingWaiter(name, resolve);
                reject(new Error(`Timeout waiting for ${name} (${timeout}ms)`));
            }, timeout);
            
            // Add to pending waiters
            if (!this.pendingWaiters.has(name)) {
                this.pendingWaiters.set(name, []);
            }
            
            this.pendingWaiters.get(name).push({
                resolve,
                reject,
                timeoutId
            });
        });
    }
    
    /**
     * Wait for multiple services
     * @param {string[]} names - Service names
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<Object[]>}
     */
    async waitForAll(names, timeout = 30000) {
        console.log(`⏳ [Coordinator] Waiting for ${names.length} services...`);
        
        const promises = names.map(name => this.waitFor(name, timeout));
        return Promise.all(promises);
    }
    
    /**
     * Resolve pending waiters for a service
     * @param {string} name - Service name
     * @param {Object} instance - Service instance
     */
    resolvePendingWaiters(name, instance) {
        const waiters = this.pendingWaiters.get(name);
        
        if (!waiters || waiters.length === 0) {
            return;
        }
        
        console.log(`📢 [Coordinator] Resolving ${waiters.length} waiters for ${name}`);
        
        waiters.forEach(waiter => {
            clearTimeout(waiter.timeoutId);
            waiter.resolve(instance);
        });
        
        this.pendingWaiters.delete(name);
    }
    
    /**
     * Remove pending waiter
     * @param {string} name - Service name
     * @param {Function} resolve - Resolve function
     */
    removePendingWaiter(name, resolve) {
        const waiters = this.pendingWaiters.get(name);
        
        if (!waiters) {
            return;
        }
        
        const index = waiters.findIndex(w => w.resolve === resolve);
        if (index > -1) {
            clearTimeout(waiters[index].timeoutId);
            waiters.splice(index, 1);
        }
        
        if (waiters.length === 0) {
            this.pendingWaiters.delete(name);
        }
    }
    
    // =========================================================================
    // STATUS & DEBUGGING
    // =========================================================================
    
    /**
     * Get all ready services
     * @returns {string[]}
     */
    getReadyServices() {
        return Array.from(this.readyServices);
    }
    
    /**
     * Get pending waiters info
     * @returns {Object}
     */
    getPendingWaiters() {
        const pending = {};
        
        for (const [name, waiters] of this.pendingWaiters.entries()) {
            pending[name] = waiters.length;
        }
        
        return pending;
    }
    
    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return {
            totalServices: this.services.size,
            readyServices: this.readyServices.size,
            pendingWaiters: this.pendingWaiters.size,
            monitoring: this.monitoring.getMetrics()
        };
    }
    
    /**
     * Debug info
     */
    debug() {
        console.group('🎯 [Coordinator] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Ready Services:', this.getReadyServices());
        console.log('Pending Waiters:', this.getPendingWaiters());
        console.groupEnd();
    }
    
    /**
     * List all services
     */
    listServices() {
        console.group('🎯 [Coordinator] Registered Services');
        
        for (const name of this.readyServices) {
            console.log(`✓ ${name}`);
        }
        
        console.groupEnd();
    }
    
    // =========================================================================
    // MONITORING
    // =========================================================================
    
    /**
     * Start monitoring
     */
    startMonitoring() {
        this.monitoring.start();
    }
    
    /**
     * End monitoring
     */
    endMonitoring() {
        this.monitoring.end();
    }
    
    /**
     * Record metric
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     */
    recordMetric(name, value) {
        this.monitoring.recordMetric(name, value);
    }
    
    /**
     * Get monitoring report
     * @returns {Object}
     */
    getMonitoringReport() {
        return {
            duration: this.monitoring.getDuration(),
            metrics: this.monitoring.getMetrics(),
            services: this.getStats()
        };
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Clear all pending waiters
     */
    clearPendingWaiters() {
        for (const [name, waiters] of this.pendingWaiters.entries()) {
            waiters.forEach(waiter => {
                clearTimeout(waiter.timeoutId);
                waiter.reject(new Error(`Coordinator cleared while waiting for ${name}`));
            });
        }
        
        this.pendingWaiters.clear();
    }
    
    /**
     * Reset coordinator
     */
    reset() {
        this.clearPendingWaiters();
        this.services.clear();
        this.readyServices.clear();
        
        console.log('🔄 [Coordinator] Reset complete');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraCoordinator = new Coordinator();
window.Oslira = window.Oslira || {};
window.Oslira.init = window.OsliraCoordinator;

console.log('✅ [Coordinator] Loaded and ready');
