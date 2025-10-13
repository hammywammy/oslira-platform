// =============================================================================
// DEPENDENCY INJECTION CONTAINER
// Path: /public/core/di/Container.js
// Dependencies: ServiceRegistry
// =============================================================================

/**
 * @class Container
 * @description Manages service instantiation and dependency injection
 * 
 * Features:
 * - Automatic dependency resolution
 * - Topological sorting for init order
 * - Singleton management
 * - Lazy initialization
 * - Circular dependency detection
 * - Service lifecycle management
 */
class Container {
    constructor() {
        this.registry = null;
        this.instances = new Map();
        this.initializing = new Set();
        this.initialized = new Set();
        
        // Stats
        this.initCount = 0;
        this.errorCount = 0;
        this.startTime = null;
        this.endTime = null;
        
        console.log('📦 [Container] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize container with service registry
     */
async initialize() {
        console.log('📦 [Container] Initializing...');
        this.startTime = performance.now();
        
        try {
            // Get service registry
            this.registry = window.OsliraServiceRegistry;
            
            if (!this.registry) {
                throw new Error('ServiceRegistry not available');
            }
            
            // Validate registry
            const validation = this.registry.validate();
            if (!validation.valid) {
                console.error('❌ [Container] Registry validation failed:', validation.errors);
                throw new Error(`Registry validation failed: ${validation.errors.join(', ')}`);
            }
            
            console.log('✅ [Container] Registry validated');
            
            // Initialize all auto-init services
            await this.initializeAllServices();
            
            this.endTime = performance.now();
            this.isInitialized = true;
            
            // Register with Coordinator AFTER successful initialization (Pattern B)
            if (window.Oslira?.init) {
                window.Oslira.init.register('Container', this);
                console.log('📋 [Container] Registered with Coordinator');
            }
            
            const duration = (this.endTime - this.startTime).toFixed(0);
            console.log(`✅ [Container] Initialization complete in ${duration}ms`);
            console.log(`📦 [Container] ${this.initCount} services initialized`);
            
        } catch (error) {
            this.endTime = performance.now();
            console.error('❌ [Container] Initialization failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'Container', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Initialize all auto-init services in correct order
     */
    async initializeAllServices() {
        const initOrder = this.registry.getFullInitializationOrder();
        
        console.log(`📦 [Container] Initializing ${initOrder.length} services...`);
        
        for (const serviceName of initOrder) {
            await this.initializeService(serviceName);
        }
    }
    
    // =========================================================================
    // SERVICE INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize a single service with its dependencies
     */
    async initializeService(name) {
        // Check if already initialized
        if (this.initialized.has(name)) {
            console.log(`⏭️ [Container] ${name} already initialized`);
            return this.instances.get(name);
        }
        
        // Check if currently initializing (circular dependency)
        if (this.initializing.has(name)) {
            throw new Error(`Circular dependency detected while initializing ${name}`);
        }
        
        this.initializing.add(name);
        
        try {
            console.log(`📦 [Container] Initializing ${name}...`);
            
            // Get service definition
            const service = this.registry.getService(name);
            if (!service) {
                throw new Error(`Service ${name} not found in registry`);
            }
            
            // Initialize dependencies first
            const dependencies = await this.resolveDependencies(service.dependencies);
            
            // Get or create instance
            let instance;
            
            if (service.singleton) {
                // Singleton: use existing instance or create new
                if (service.instance && window[service.instance]) {
                    instance = window[service.instance];
                    console.log(`📦 [Container] Using existing singleton: ${name}`);
                } else {
                    instance = await this.createInstance(service, dependencies);
                }
            } else {
                // Factory: always create new instance
                instance = await this.createInstance(service, dependencies);
            }
            
            // Store instance
            this.instances.set(name, instance);
            
            // Mark as initialized
            this.initialized.add(name);
            this.initializing.delete(name);
            this.initCount++;
            
            // Update service state in registry
            service.initialized = true;
            
            console.log(`✅ [Container] ${name} initialized`);
            
            return instance;
            
        } catch (error) {
            this.initializing.delete(name);
            this.errorCount++;
            
            console.error(`❌ [Container] Failed to initialize ${name}:`, error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: {
                        component: 'Container',
                        service: name,
                        action: 'initialize'
                    }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Create service instance
     */
    async createInstance(service, dependencies) {
        try {
            // Get class constructor
            const ServiceClass = window[service.className];
            
            if (!ServiceClass) {
                throw new Error(`Class ${service.className} not found`);
            }
            
            // Create instance (no constructor params - use initialize method)
            const instance = new ServiceClass();
            
            // Call initialize method if exists
            if (typeof instance.initialize === 'function') {
                const depObject = this.buildDependencyObject(service.dependencies, dependencies);
                await instance.initialize(depObject);
            }
            
            return instance;
            
        } catch (error) {
            console.error(`❌ [Container] Failed to create instance of ${service.name}:`, error);
            throw error;
        }
    }
    
    /**
     * Resolve all dependencies for a service
     */
    async resolveDependencies(dependencyNames) {
        const dependencies = [];
        
        for (const depName of dependencyNames) {
            const dep = await this.get(depName);
            dependencies.push(dep);
        }
        
        return dependencies;
    }
    
    /**
     * Build dependency object for initialize method
     */
    buildDependencyObject(names, instances) {
        const deps = {};
        
        names.forEach((name, index) => {
            // Use camelCase version of name
            const key = name.charAt(0).toLowerCase() + name.slice(1);
            deps[key] = instances[index];
        });
        
        return deps;
    }
    
    // =========================================================================
    // SERVICE RETRIEVAL
    // =========================================================================
    
    /**
     * Get service instance (initializes if needed)
     */
    async get(name) {
        // Return existing instance
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }
        
        // Check if service exists
        const service = this.registry.getService(name);
        if (!service) {
            throw new Error(`Service ${name} not found in registry`);
        }
        
        // Initialize if auto-init
        if (service.autoInit) {
            return await this.initializeService(name);
        }
        
        // For non-auto-init services, throw error
        throw new Error(`Service ${name} is not auto-initialized. Call initializeService() manually.`);
    }
    
    /**
     * Get service instance synchronously (throws if not initialized)
     */
    getSync(name) {
        if (!this.instances.has(name)) {
            throw new Error(`Service ${name} not initialized yet`);
        }
        
        return this.instances.get(name);
    }
    
    /**
     * Check if service is initialized
     */
    has(name) {
        return this.instances.has(name);
    }
    
    /**
     * Get multiple services at once
     */
    async getMultiple(names) {
        const instances = [];
        
        for (const name of names) {
            instances.push(await this.get(name));
        }
        
        return instances;
    }
    
    // =========================================================================
    // MANUAL SERVICE MANAGEMENT
    // =========================================================================
    
    /**
     * Manually register a service instance
     */
    register(name, instance) {
        if (this.instances.has(name)) {
            console.warn(`⚠️ [Container] Overwriting existing instance: ${name}`);
        }
        
        this.instances.set(name, instance);
        this.initialized.add(name);
        
        console.log(`📦 [Container] Manually registered: ${name}`);
    }
    
    /**
     * Create factory instance (non-singleton)
     */
    async createFactory(name, customDeps = {}) {
        const service = this.registry.getService(name);
        
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        
        if (service.singleton) {
            console.warn(`⚠️ [Container] ${name} is a singleton, returning existing instance`);
            return await this.get(name);
        }
        
        // Resolve dependencies
        const dependencies = await this.resolveDependencies(service.dependencies);
        const depObject = this.buildDependencyObject(service.dependencies, dependencies);
        
        // Merge with custom deps
        const finalDeps = { ...depObject, ...customDeps };
        
        // Create instance
        return await this.createInstance(service, Object.values(finalDeps));
    }
    
    // =========================================================================
    // SERVICE LIFECYCLE
    // =========================================================================
    
    /**
     * Destroy service instance
     */
    async destroy(name) {
        const instance = this.instances.get(name);
        
        if (!instance) {
            console.warn(`⚠️ [Container] Service ${name} not found`);
            return;
        }
        
        try {
            // Call destroy method if exists
            if (typeof instance.destroy === 'function') {
                await instance.destroy();
            }
            
            // Remove from container
            this.instances.delete(name);
            this.initialized.delete(name);
            
            console.log(`🗑️ [Container] Destroyed: ${name}`);
            
        } catch (error) {
            console.error(`❌ [Container] Failed to destroy ${name}:`, error);
            throw error;
        }
    }
    
    /**
     * Destroy all services
     */
    async destroyAll() {
        console.log('🗑️ [Container] Destroying all services...');
        
        const services = Array.from(this.instances.keys());
        
        for (const name of services) {
            await this.destroy(name);
        }
        
        console.log('✅ [Container] All services destroyed');
    }
    
    /**
     * Restart service (destroy and reinitialize)
     */
    async restart(name) {
        console.log(`🔄 [Container] Restarting ${name}...`);
        
        await this.destroy(name);
        await this.initializeService(name);
        
        console.log(`✅ [Container] ${name} restarted`);
    }
    
    // =========================================================================
    // HEALTH CHECKS
    // =========================================================================
    
    /**
     * Check health of all services
     */
    async healthCheck() {
        const results = {
            healthy: [],
            unhealthy: [],
            unknown: []
        };
        
        for (const [name, instance] of this.instances.entries()) {
            if (typeof instance.healthCheck === 'function') {
                try {
                    const isHealthy = await instance.healthCheck();
                    if (isHealthy) {
                        results.healthy.push(name);
                    } else {
                        results.unhealthy.push(name);
                    }
                } catch (error) {
                    results.unhealthy.push(name);
                }
            } else {
                results.unknown.push(name);
            }
        }
        
        return results;
    }
    
    /**
     * Verify all required services are initialized
     */
    verifyServices() {
        const autoInitServices = this.registry.getAutoInitServices();
        const missing = [];
        
        for (const service of autoInitServices) {
            if (!this.initialized.has(service.name)) {
                missing.push(service.name);
            }
        }
        
        return {
            verified: missing.length === 0,
            missing
        };
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get container statistics
     */
    getStats() {
        return {
            totalServices: this.instances.size,
            initialized: this.initialized.size,
            initializing: this.initializing.size,
            initCount: this.initCount,
            errorCount: this.errorCount,
            initTime: this.endTime && this.startTime ? 
                (this.endTime - this.startTime).toFixed(0) + 'ms' : null
        };
    }
    
    /**
     * Get initialization time breakdown
     */
    getInitializationBreakdown() {
        const breakdown = [];
        
        for (const name of this.initialized) {
            const service = this.registry.getService(name);
            if (service) {
                breakdown.push({
                    name,
                    phase: service.phase,
                    dependencies: service.dependencies.length
                });
            }
        }
        
        return breakdown.sort((a, b) => a.phase - b.phase);
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * List all initialized services
     */
    listServices() {
        console.group('📦 [Container] Initialized Services');
        
        for (const name of this.initialized) {
            const service = this.registry.getService(name);
            console.log(`✓ ${name} (Phase ${service?.phase || '?'})`);
        }
        
        console.groupEnd();
    }
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            stats: this.getStats(),
            verification: this.verifyServices(),
            breakdown: this.getInitializationBreakdown()
        };
    }
    
    /**
     * Print debug info
     */
    debug() {
        console.group('📦 [Container] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Verification:', this.verifyServices());
        console.groupEnd();
        
        this.listServices();
    }
    
    // =========================================================================
    // DEPENDENCY GRAPH UTILITIES
    // =========================================================================
    
    /**
     * Get dependency graph for visualization
     */
    getDependencyGraph() {
        const graph = {
            nodes: [],
            edges: []
        };
        
        for (const service of this.registry.getAllServices()) {
            graph.nodes.push({
                id: service.name,
                phase: service.phase,
                initialized: this.initialized.has(service.name)
            });
            
            for (const dep of service.dependencies) {
                graph.edges.push({
                    from: dep,
                    to: service.name
                });
            }
        }
        
        return graph;
    }
    
    /**
     * Export dependency graph as DOT format (for Graphviz)
     */
    exportGraphDOT() {
        let dot = 'digraph Services {\n';
        dot += '  rankdir=TB;\n';
        dot += '  node [shape=box];\n\n';
        
        const graph = this.getDependencyGraph();
        
        // Nodes
        for (const node of graph.nodes) {
            const color = node.initialized ? 'green' : 'red';
            dot += `  "${node.id}" [color=${color}];\n`;
        }
        
        dot += '\n';
        
        // Edges
        for (const edge of graph.edges) {
            dot += `  "${edge.from}" -> "${edge.to}";\n`;
        }
        
        dot += '}\n';
        
        return dot;
    }
}

// =============================================================================
// GLOBAL EXPORT (Safe Singleton Pattern)
// =============================================================================

if (!window.OsliraContainer) {
    const instance = new Container();
    
    window.OsliraContainer = instance;
    
    console.log('✅ [Container] Class loaded, awaiting initialization');
    
    // NOTE: Container follows Pattern B (Manual-Init)
    // Registration happens inside the initialize() method
} else {
    console.log('⚠️ [Container] Already loaded, skipping re-initialization');
}
