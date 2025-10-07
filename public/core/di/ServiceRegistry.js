// =============================================================================
// SERVICE REGISTRY - Service Definitions & Dependencies
// Path: /public/core/di/ServiceRegistry.js
// Dependencies: None (pure configuration)
// =============================================================================

/**
 * @class ServiceRegistry
 * @description Central registry of all services and their dependencies
 * 
 * Features:
 * - Service definitions with dependencies
 * - Initialization order determination
 * - Singleton vs factory patterns
 * - Service metadata
 */
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.initialized = false;
        
        console.log('📋 [ServiceRegistry] Instance created');
        this.registerAllServices();
    }
    
    // =========================================================================
    // SERVICE REGISTRATION
    // =========================================================================
    
    /**
     * Register all services with their dependencies
     */
    registerAllServices() {
        console.log('📋 [ServiceRegistry] Registering services...');
        
        // =================================================================
        // PHASE 1: INFRASTRUCTURE (No Dependencies)
        // =================================================================
        
        this.register({
            name: 'EnvDetector',
            class: 'OsliraEnvDetector',
            instance: 'OsliraEnv',
            dependencies: [],
            singleton: true,
            autoInit: true,
            phase: 1,
            description: 'Environment and page detection'
        });
        
        this.register({
            name: 'Logger',
            class: 'OsliraLogger',
            instance: 'OsliraLogger',
            dependencies: [],
            singleton: true,
            autoInit: true,
            phase: 1,
            description: 'Logging system with Sentry integration'
        });
        
        this.register({
            name: 'ErrorHandler',
            class: 'OsliraErrorHandler',
            instance: 'OsliraErrorHandler',
            dependencies: ['Logger'],
            singleton: true,
            autoInit: true,
            phase: 1,
            description: 'Global error handling'
        });
        
        // =================================================================
        // PHASE 2: CONFIGURATION
        // =================================================================
        
        this.register({
            name: 'ConfigProvider',
            class: 'OsliraConfigProvider',
            instance: 'OsliraConfig',
            dependencies: ['EnvDetector', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 2,
            description: 'Configuration management from AWS'
        });
        
        this.register({
            name: 'HttpClient',
            class: 'OsliraHttpClient',
            instance: 'OsliraHttpClient',
            dependencies: ['Logger', 'ConfigProvider'],
            singleton: true,
            autoInit: true,
            phase: 2,
            description: 'HTTP client with retry and timeout'
        });
        
        // =================================================================
        // PHASE 3: AUTHENTICATION
        // =================================================================
        
        this.register({
            name: 'AuthManager',
            class: 'OsliraAuthManager',
            instance: 'OsliraAuth',
            dependencies: ['EnvDetector', 'ConfigProvider', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 3,
            description: 'Authentication system'
        });
        
        this.register({
            name: 'SessionValidator',
            class: 'OsliraSessionValidator',
            instance: null, // Created by AuthManager
            dependencies: ['AuthManager'],
            singleton: false,
            autoInit: false,
            phase: 3,
            description: 'Session validation'
        });
        
        this.register({
            name: 'TokenRefresher',
            class: 'OsliraTokenRefresher',
            instance: null, // Created by AuthManager
            dependencies: ['AuthManager'],
            singleton: false,
            autoInit: false,
            phase: 3,
            description: 'Token refresh system'
        });
        
        // =================================================================
        // PHASE 4: STATE MANAGEMENT
        // =================================================================
        
        this.register({
            name: 'Store',
            class: 'OsliraStore',
            instance: 'OsliraStore',
            dependencies: ['Logger'],
            singleton: true,
            autoInit: true,
            phase: 4,
            description: 'Immutable state store'
        });
        
        this.register({
            name: 'StateManager',
            class: 'OsliraStateManager',
            instance: 'OsliraStateManager',
            dependencies: ['Store', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 4,
            description: 'State management with computed values'
        });
        
        this.register({
            name: 'Selectors',
            class: 'OsliraSelectors',
            instance: 'OsliraSelectors',
            dependencies: ['Store'],
            singleton: true,
            autoInit: true,
            phase: 4,
            description: 'Memoized state selectors'
        });
        
        // =================================================================
        // PHASE 5: EVENTS
        // =================================================================
        
        this.register({
            name: 'EventBus',
            class: 'OsliraEventBus',
            instance: 'OsliraEventBus',
            dependencies: ['Logger'],
            singleton: true,
            autoInit: true,
            phase: 5,
            description: 'Event bus for pub/sub'
        });
        
        // =================================================================
        // PHASE 6: API LAYER
        // =================================================================
        
        this.register({
            name: 'ApiClient',
            class: 'OsliraApiClient',
            instance: 'OsliraApiClient',
            dependencies: ['HttpClient', 'Logger', 'AuthManager'],
            singleton: true,
            autoInit: true,
            phase: 6,
            description: 'API client with caching'
        });
        
        this.register({
            name: 'AuthAPI',
            class: 'OsliraAuthAPI',
            instance: 'OsliraAuthAPI',
            dependencies: ['ApiClient'],
            singleton: true,
            autoInit: true,
            phase: 6,
            description: 'Authentication API endpoints'
        });
        
        this.register({
            name: 'LeadsAPI',
            class: 'OsliraLeadsAPI',
            instance: 'OsliraLeadsAPI',
            dependencies: ['ApiClient'],
            singleton: true,
            autoInit: true,
            phase: 6,
            description: 'Leads API endpoints'
        });
        
        this.register({
            name: 'BusinessAPI',
            class: 'OsliraBusinessAPI',
            instance: 'OsliraBusinessAPI',
            dependencies: ['ApiClient'],
            singleton: true,
            autoInit: true,
            phase: 6,
            description: 'Business API endpoints'
        });
        
        this.register({
            name: 'AnalyticsAPI',
            class: 'OsliraAnalyticsAPI',
            instance: 'OsliraAnalyticsAPI',
            dependencies: ['ApiClient'],
            singleton: true,
            autoInit: true,
            phase: 6,
            description: 'Analytics API endpoints'
        });
        
        // =================================================================
        // PHASE 7: BUSINESS SERVICES
        // =================================================================
        
        this.register({
            name: 'LeadService',
            class: 'OsliraLeadService',
            instance: 'OsliraLeadService',
            dependencies: ['LeadsAPI', 'StateManager', 'EventBus', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 7,
            description: 'Lead business logic'
        });
        
        this.register({
            name: 'AnalyticsService',
            class: 'OsliraAnalyticsService',
            instance: 'OsliraAnalyticsService',
            dependencies: ['AnalyticsAPI', 'StateManager', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 7,
            description: 'Analytics business logic'
        });
        
        this.register({
            name: 'BusinessService',
            class: 'OsliraBusinessService',
            instance: 'OsliraBusinessService',
            dependencies: ['BusinessAPI', 'StateManager', 'EventBus', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 7,
            description: 'Business profile logic'
        });
        
        this.register({
            name: 'UserService',
            class: 'OsliraUserService',
            instance: 'OsliraUserService',
            dependencies: ['AuthAPI', 'AuthManager', 'StateManager', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 7,
            description: 'User management logic'
        });
        
        // =================================================================
        // PHASE 8: UI LAYER
        // =================================================================
        
        this.register({
            name: 'UIOrchestrator',
            class: 'OsliraUIOrchestrator',
            instance: 'OsliraUI',
            dependencies: ['EventBus', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 8,
            description: 'UI orchestration (modals, toasts)'
        });
        
        this.register({
            name: 'FormValidator',
            class: 'OsliraFormValidator',
            instance: null, // Factory pattern
            dependencies: ['Logger'],
            singleton: false,
            autoInit: false,
            phase: 8,
            description: 'Form validation system'
        });
        
        this.register({
            name: 'AppSidebar',
            class: 'OsliraAppSidebar',
            instance: 'OsliraAppSidebar',
            dependencies: ['AuthManager', 'BusinessService', 'EventBus', 'Logger'],
            singleton: true,
            autoInit: false, // Manually initialized by pages
            phase: 8,
            description: 'Application sidebar'
        });
        
        this.register({
            name: 'AdminSidebar',
            class: 'OsliraAdminSidebar',
            instance: 'OsliraAdminSidebar',
            dependencies: ['AuthManager', 'EventBus', 'Logger'],
            singleton: true,
            autoInit: false,
            phase: 8,
            description: 'Admin sidebar'
        });
        
        this.initialized = true;
        console.log(`✅ [ServiceRegistry] Registered ${this.services.size} services`);
    }
    
    // =========================================================================
    // REGISTRATION API
    // =========================================================================
    
    /**
     * Register a service
     */
    register(config) {
        const {
            name,
            class: className,
            instance,
            dependencies = [],
            singleton = true,
            autoInit = true,
            phase = 1,
            description = ''
        } = config;
        
        if (!name) {
            throw new Error('Service name is required');
        }
        
        if (!className) {
            throw new Error(`Service ${name} must have a class name`);
        }
        
        if (this.services.has(name)) {
            throw new Error(`Service ${name} already registered`);
        }
        
        this.services.set(name, {
            name,
            className,
            instance,
            dependencies,
            singleton,
            autoInit,
            phase,
            description,
            initialized: false
        });
    }
    
    // =========================================================================
    // SERVICE LOOKUP
    // =========================================================================
    
    /**
     * Get service definition
     */
    getService(name) {
        return this.services.get(name);
    }
    
    /**
     * Get all services
     */
    getAllServices() {
        return Array.from(this.services.values());
    }
    
    /**
     * Get services by phase
     */
    getServicesByPhase(phase) {
        return this.getAllServices().filter(s => s.phase === phase);
    }
    
    /**
     * Get services that auto-initialize
     */
    getAutoInitServices() {
        return this.getAllServices().filter(s => s.autoInit);
    }
    
    /**
     * Get singleton services
     */
    getSingletonServices() {
        return this.getAllServices().filter(s => s.singleton);
    }
    
    /**
     * Check if service exists
     */
    hasService(name) {
        return this.services.has(name);
    }
    
    // =========================================================================
    // DEPENDENCY RESOLUTION
    // =========================================================================
    
    /**
     * Get service dependencies (direct only)
     */
    getServiceDependencies(name) {
        const service = this.getService(name);
        return service ? service.dependencies : [];
    }
    
    /**
     * Get all dependencies (recursive)
     */
    getAllDependencies(name, visited = new Set()) {
        if (visited.has(name)) {
            return [];
        }
        
        visited.add(name);
        
        const service = this.getService(name);
        if (!service) {
            return [];
        }
        
        const allDeps = [...service.dependencies];
        
        for (const dep of service.dependencies) {
            const subDeps = this.getAllDependencies(dep, visited);
            allDeps.push(...subDeps);
        }
        
        return [...new Set(allDeps)]; // Remove duplicates
    }
    
    /**
     * Get initialization order for a service (topological sort)
     */
    getInitializationOrder(name) {
        const order = [];
        const visited = new Set();
        const visiting = new Set();
        
        const visit = (serviceName) => {
            if (visited.has(serviceName)) {
                return;
            }
            
            if (visiting.has(serviceName)) {
                throw new Error(`Circular dependency detected: ${serviceName}`);
            }
            
            visiting.add(serviceName);
            
            const service = this.getService(serviceName);
            if (!service) {
                throw new Error(`Service not found: ${serviceName}`);
            }
            
            // Visit dependencies first
            for (const dep of service.dependencies) {
                visit(dep);
            }
            
            visiting.delete(serviceName);
            visited.add(serviceName);
            order.push(serviceName);
        };
        
        visit(name);
        return order;
    }
    
    /**
     * Get full initialization order for all auto-init services
     */
    getFullInitializationOrder() {
        const autoInitServices = this.getAutoInitServices();
        const order = [];
        const visited = new Set();
        
        // Sort by phase first
        autoInitServices.sort((a, b) => a.phase - b.phase);
        
        for (const service of autoInitServices) {
            const serviceOrder = this.getInitializationOrder(service.name);
            
            for (const name of serviceOrder) {
                if (!visited.has(name)) {
                    const svc = this.getService(name);
                    if (svc && svc.autoInit) {
                        order.push(name);
                        visited.add(name);
                    }
                }
            }
        }
        
        return order;
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate all service definitions
     */
    validate() {
        const errors = [];
        
        for (const service of this.services.values()) {
            // Check if class exists
            if (!window[service.className]) {
                errors.push(`Service ${service.name}: Class ${service.className} not found`);
            }
            
            // Check if dependencies exist
            for (const dep of service.dependencies) {
                if (!this.hasService(dep)) {
                    errors.push(`Service ${service.name}: Dependency ${dep} not registered`);
                }
            }
        }
        
        // Check for circular dependencies
        try {
            this.getFullInitializationOrder();
        } catch (error) {
            errors.push(`Circular dependency detected: ${error.message}`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Check for circular dependencies
     */
    hasCircularDependencies() {
        try {
            this.getFullInitializationOrder();
            return false;
        } catch (error) {
            return true;
        }
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get registry statistics
     */
    getStats() {
        const services = this.getAllServices();
        
        return {
            totalServices: services.length,
            autoInitServices: services.filter(s => s.autoInit).length,
            singletonServices: services.filter(s => s.singleton).length,
            phaseBreakdown: this.getPhaseBreakdown(),
            initialized: services.filter(s => s.initialized).length
        };
    }
    
    /**
     * Get phase breakdown
     */
    getPhaseBreakdown() {
        const breakdown = {};
        
        for (const service of this.services.values()) {
            if (!breakdown[service.phase]) {
                breakdown[service.phase] = 0;
            }
            breakdown[service.phase]++;
        }
        
        return breakdown;
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Print service tree
     */
    printServiceTree() {
        console.group('📋 [ServiceRegistry] Service Tree');
        
        const phases = [...new Set(this.getAllServices().map(s => s.phase))].sort();
        
        for (const phase of phases) {
            console.group(`Phase ${phase}`);
            
            const services = this.getServicesByPhase(phase);
            for (const service of services) {
                const deps = service.dependencies.length > 0 ? 
                    ` → [${service.dependencies.join(', ')}]` : '';
                console.log(`${service.name}${deps}`);
            }
            
            console.groupEnd();
        }
        
        console.groupEnd();
    }
    
    /**
     * Print initialization order
     */
    printInitializationOrder() {
        console.group('📋 [ServiceRegistry] Initialization Order');
        
        const order = this.getFullInitializationOrder();
        order.forEach((name, index) => {
            const service = this.getService(name);
            console.log(`${index + 1}. ${name} (Phase ${service.phase})`);
        });
        
        console.groupEnd();
    }
    
    /**
     * Debug info
     */
    debug() {
        console.group('📋 [ServiceRegistry] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Validation:', this.validate());
        console.groupEnd();
        
        this.printServiceTree();
        this.printInitializationOrder();
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraServiceRegistry = ServiceRegistry;

// Create singleton instance
window.OsliraRegistry = new ServiceRegistry();

console.log('✅ [ServiceRegistry] Loaded and initialized');
