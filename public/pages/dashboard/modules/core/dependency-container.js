//public/pages/dashboard/modules/core/dependency-container.js

/**
 * OSLIRA DEPENDENCY CONTAINER
 * Simple dependency injection container for module coordination
 * Ensures proper initialization order and module access
 */
class DependencyContainer {
    constructor() {
        this.dependencies = new Map();
        this.singletons = new Map();
        this.factories = new Map();
        this.initializationOrder = [];
        this.initialized = false;
        
        console.log('🚀 [DependencyContainer] Initialized');
    }
    
    /**
     * Register a singleton instance
     */
registerSingleton(name, instance) {
    if (this.dependencies.has(name) && !this.factories.has(name)) {
        throw new Error(`Dependency '${name}' already registered`);
    }
    
    // Clean up factory if we're replacing it with a singleton
    if (this.factories.has(name)) {
        this.factories.delete(name);
        console.log(`🔄 [DependencyContainer] Replaced factory with singleton: ${name}`);
    }
    
    this.dependencies.set(name, instance);
    this.singletons.set(name, instance);
    
    // Only add to initialization order if not already present
    if (!this.initializationOrder.includes(name)) {
        this.initializationOrder.push(name);
    }
    
    console.log(`📋 [DependencyContainer] Singleton registered: ${name}`);
    return this;
}
    
    /**
     * Register a factory function
     */
    registerFactory(name, factoryFn, dependencies = []) {
        if (this.dependencies.has(name)) {
            throw new Error(`Dependency '${name}' already registered`);
        }
        
        this.factories.set(name, {
            factory: factoryFn,
            dependencies,
            instance: null
        });
        
        console.log(`🏭 [DependencyContainer] Factory registered: ${name}`, dependencies);
        return this;
    }
    
    /**
     * Register a value/instance
     */
    register(name, instance) {
        return this.registerSingleton(name, instance);
    }
    
    /**
     * Get dependency instance
     */
get(name) {
    // Check if it's a factory
    if (this.factories.has(name)) {
        const factoryInfo = this.factories.get(name);
        
        // Create instance if not already created
        if (!factoryInfo.instance) {
            const deps = factoryInfo.dependencies.map(dep => this.get(dep));
            const result = factoryInfo.factory(...deps);
            
            // Handle async factories
            if (result && typeof result.then === 'function') {
                throw new Error(`Async factory '${name}' must be resolved before use. Use getAsync() or ensure factory is pre-resolved.`);
            }
            
            factoryInfo.instance = result;
            console.log(`🏗️ [DependencyContainer] Factory instance created: ${name}`);
        }
        
        return factoryInfo.instance;
    }
        
        // Check regular dependencies
        if (this.dependencies.has(name)) {
            return this.dependencies.get(name);
        }
        
        throw new Error(`Dependency '${name}' not found. Available: ${Array.from(this.dependencies.keys()).join(', ')}`);
    }

    /**
 * Get dependency instance (async version for async factories)
 */
async getAsync(name) {
    // Check if it's a singleton
    if (this.singletons.has(name)) {
        return this.singletons.get(name);
    }
    
    // Check if it's a factory
    if (this.factories.has(name)) {
        const factoryInfo = this.factories.get(name);
        
        // Create instance if not already created
        if (!factoryInfo.instance) {
            const deps = await Promise.all(
                factoryInfo.dependencies.map(dep => this.getAsync(dep))
            );
            factoryInfo.instance = await factoryInfo.factory(...deps);
            console.log(`🏗️ [DependencyContainer] Async factory instance created: ${name}`);
        }
        
        return factoryInfo.instance;
    }
    
    // Check regular dependencies
    if (this.dependencies.has(name)) {
        return this.dependencies.get(name);
    }
    
    throw new Error(`Dependency '${name}' not found. Available: ${Array.from(this.dependencies.keys()).join(', ')}`);
}
    
    /**
     * Check if dependency exists
     */
    has(name) {
        return this.dependencies.has(name) || this.factories.has(name);
    }
    
    /**
     * Initialize all dependencies in correct order
     */
    async initialize() {
        if (this.initialized) {
            console.log('⚠️ [DependencyContainer] Already initialized');
            return;
        }
        
        console.log('🔄 [DependencyContainer] Starting initialization...');
        
        // Get dependency graph for factories
        const factoryNames = Array.from(this.factories.keys());
        const sortedFactories = this.topologicalSort(factoryNames);
        
// Initialize factories in dependency order
for (const factoryName of sortedFactories) {
    if (!this.factories.get(factoryName).instance) {
        try {
            // Skip async factories that haven't been pre-resolved
            const factoryInfo = this.factories.get(factoryName);
            if (!factoryInfo.instance) {
                // Check if it's an async factory
                const result = factoryInfo.factory();
                if (result && typeof result.then === 'function') {
                    console.warn(`⚠️ [DependencyContainer] Skipping async factory '${factoryName}' - should be pre-resolved`);
                    continue;
                }
            }
            
            const instance = this.get(factoryName);
            
            // Call init method if it exists
            if (instance && typeof instance.init === 'function') {
                console.log(`🔧 [DependencyContainer] Initializing: ${factoryName}`);
                await instance.init();
            }
            
            this.initializationOrder.push(factoryName);
        } catch (error) {
            console.error(`❌ [DependencyContainer] Failed to initialize ${factoryName}:`, error);
            // Don't throw for non-critical failures
            if (factoryName === 'analysisFunctions' || factoryName === 'supabase') {
                throw error; // Critical dependencies
            }
        }
    }
}
        
        // Initialize singletons that have init methods
        for (const [name, instance] of this.singletons.entries()) {
            if (instance && typeof instance.init === 'function') {
                try {
                    console.log(`🔧 [DependencyContainer] Initializing singleton: ${name}`);
                    await instance.init();
                } catch (error) {
                    console.error(`❌ [DependencyContainer] Failed to initialize singleton ${name}:`, error);
                    throw error;
                }
            }
        }
        
        this.initialized = true;
        console.log('✅ [DependencyContainer] Initialization completed');
        console.log('📋 [DependencyContainer] Initialization order:', this.initializationOrder);
    }
    
    /**
     * Cleanup all dependencies
     */
    async cleanup() {
        console.log('🧹 [DependencyContainer] Starting cleanup...');
        
        // Cleanup in reverse initialization order
        const cleanupOrder = [...this.initializationOrder].reverse();
        
        for (const name of cleanupOrder) {
            try {
                const instance = this.dependencies.get(name) || this.factories.get(name)?.instance;
                
                if (instance && typeof instance.cleanup === 'function') {
                    console.log(`🧹 [DependencyContainer] Cleaning up: ${name}`);
                    await instance.cleanup();
                }
            } catch (error) {
                console.error(`❌ [DependencyContainer] Cleanup failed for ${name}:`, error);
            }
        }
        
        // Clear all dependencies
        this.dependencies.clear();
        this.singletons.clear();
        this.factories.clear();
        this.initializationOrder = [];
        this.initialized = false;
        
        console.log('✅ [DependencyContainer] Cleanup completed');
    }
    
    /**
     * Get initialization status
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * Get list of all registered dependencies
     */
    list() {
        const singletons = Array.from(this.singletons.keys()).map(name => ({ name, type: 'singleton' }));
        const factories = Array.from(this.factories.keys()).map(name => ({ name, type: 'factory' }));
        const regular = Array.from(this.dependencies.keys())
            .filter(name => !this.singletons.has(name))
            .map(name => ({ name, type: 'instance' }));
        
        return [...singletons, ...factories, ...regular];
    }
    
    /**
     * Get container status for debugging
     */
    getStatus() {
        return {
            initialized: this.initialized,
            totalDependencies: this.dependencies.size + this.factories.size,
            singletons: this.singletons.size,
            factories: this.factories.size,
            initializationOrder: this.initializationOrder,
            availableDependencies: this.list()
        };
    }
    
    /**
     * Validate all dependencies are resolvable
     */
    validate() {
        const issues = [];
        
        // Check factory dependencies
        for (const [name, factoryInfo] of this.factories.entries()) {
            for (const dep of factoryInfo.dependencies) {
                if (!this.has(dep)) {
                    issues.push({
                        type: 'missing_dependency',
                        factory: name,
                        missingDependency: dep
                    });
                }
            }
        }
        
        // Check for circular dependencies
        const circularDeps = this.findCircularDependencies();
        if (circularDeps.length > 0) {
            issues.push({
                type: 'circular_dependency',
                cycles: circularDeps
            });
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }
    
    /**
     * Create a scoped child container
     */
    createChild() {
        const child = new DependencyContainer();
        
        // Copy parent dependencies
        for (const [name, instance] of this.dependencies.entries()) {
            child.dependencies.set(name, instance);
        }
        
        // Copy parent singletons
        for (const [name, instance] of this.singletons.entries()) {
            child.singletons.set(name, instance);
        }
        
        console.log('👶 [DependencyContainer] Child container created');
        return child;
    }
    
    // Private methods
    topologicalSort(factoryNames) {
        const visited = new Set();
        const visiting = new Set();
        const result = [];
        
        const visit = (name) => {
            if (visiting.has(name)) {
                throw new Error(`Circular dependency detected involving: ${name}`);
            }
            
            if (visited.has(name)) {
                return;
            }
            
            visiting.add(name);
            
            const factory = this.factories.get(name);
            if (factory) {
                for (const dep of factory.dependencies) {
                    if (factoryNames.includes(dep)) {
                        visit(dep);
                    }
                }
            }
            
            visiting.delete(name);
            visited.add(name);
            result.push(name);
        };
        
        for (const name of factoryNames) {
            if (!visited.has(name)) {
                visit(name);
            }
        }
        
        return result;
    }
    
    findCircularDependencies() {
        const cycles = [];
        const visited = new Set();
        const path = [];
        
        const dfs = (name) => {
            if (path.includes(name)) {
                const cycleStart = path.indexOf(name);
                cycles.push([...path.slice(cycleStart), name]);
                return;
            }
            
            if (visited.has(name)) {
                return;
            }
            
            visited.add(name);
            path.push(name);
            
            const factory = this.factories.get(name);
            if (factory) {
                for (const dep of factory.dependencies) {
                    if (this.factories.has(dep)) {
                        dfs(dep);
                    }
                }
            }
            
            path.pop();
        };
        
        for (const name of this.factories.keys()) {
            if (!visited.has(name)) {
                dfs(name);
            }
        }
        
        return cycles;
    }
}

// Helper function for quick container setup
function createDashboardContainer() {
    const container = new DependencyContainer();
    
    // Register core dependencies that will be available globally
    container.registerSingleton('eventBus', new DashboardEventBus());
    container.registerSingleton('stateManager', new DashboardStateManager(container.get('eventBus')));
    
    container.registerSingleton('osliraAuth', window.osliraAuth);
    
    // Register API wrapper if available
    if (window.osliraAuth?.api) {
        container.registerSingleton('api', window.osliraAuth.api);
    }
    
    return container;
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DependencyContainer, createDashboardContainer };
} else {
    window.DependencyContainer = DependencyContainer;
    window.createDashboardContainer = createDashboardContainer;
}
