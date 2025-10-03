/**
 * DEPENDENCY READINESS MANAGER
 * Handles race conditions in parallel script loading
 * Provides retry mechanism with exponential backoff
 */
class DependencyReadinessManager {
    constructor() {
        this.maxRetries = 10;
        this.baseDelay = 50; // ms
        this.maxDelay = 2000; // ms
        this.readinessChecks = new Map();
        
        console.log('🔧 [DependencyReadiness] Manager initialized');
    }
    
    /**
     * Register a dependency readiness check
     */
    registerCheck(name, checkFn) {
        this.readinessChecks.set(name, checkFn);
    }
    
    /**
     * Wait for a dependency to be ready with exponential backoff
     */
    async waitForDependency(name, customCheck = null) {
        const checkFn = customCheck || this.readinessChecks.get(name);
        
        if (!checkFn) {
            throw new Error(`No readiness check registered for: ${name}`);
        }
        
        let attempt = 0;
        
        while (attempt < this.maxRetries) {
            if (checkFn()) {
                console.log(`✅ [DependencyReadiness] ${name} ready after ${attempt} attempts`);
                return true;
            }
            
            // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, 1600ms, 2000ms...
            const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
        }
        
        throw new Error(`Dependency ${name} not ready after ${this.maxRetries} attempts`);
    }
    
    /**
     * Wait for multiple dependencies in parallel
     */
    async waitForMultiple(dependencies) {
        return Promise.all(
            dependencies.map(dep => this.waitForDependency(dep))
        );
    }
    
    /**
     * Check if dependency is immediately ready (no waiting)
     */
    isReady(name) {
        const checkFn = this.readinessChecks.get(name);
        return checkFn ? checkFn() : false;
    }
}

// Create global instance
window.DependencyReadiness = new DependencyReadinessManager();

// Register common checks
window.DependencyReadiness.registerCheck('DashboardHeader', () => {
    return typeof window.DashboardHeader === 'function';
});

window.DependencyReadiness.registerCheck('AnalysisFunctions', () => {
    return typeof window.AnalysisFunctions === 'function';
});

window.DependencyReadiness.registerCheck('LeadManager', () => {
    return typeof window.LeadManager === 'function';
});

window.DependencyReadiness.registerCheck('LeadRenderer', () => {
    return typeof window.LeadRenderer === 'function';
});

window.DependencyReadiness.registerCheck('ModalManager', () => {
    return typeof window.ModalManager === 'function';
});

window.DependencyReadiness.registerCheck('BusinessManager', () => {
    return typeof window.BusinessManager === 'function';
});

window.DependencyReadiness.registerCheck('RealtimeManager', () => {
    return typeof window.RealtimeManager === 'function';
});

window.DependencyReadiness.registerCheck('StatsCalculator', () => {
    return typeof window.StatsCalculator === 'function';
});

window.DependencyReadiness.registerCheck('AnalysisQueue', () => {
    return typeof window.AnalysisQueue === 'function';
});

console.log('✅ [DependencyReadiness] Module loaded with registered checks');
