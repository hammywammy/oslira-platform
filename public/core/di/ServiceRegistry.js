// =============================================================================
// SERVICE REGISTRY - Complete Service Registration
// Path: /public/core/di/ServiceRegistry.js
// Dependencies: None
// =============================================================================

/**
 * @class ServiceRegistry
 * @description Central registry of all services with their dependencies
 * 
 * COMPLETE REGISTRATION - ALL SYSTEM SERVICES
 */
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.initialized = false;
        
        console.log('📋 [ServiceRegistry] Instance created');
        
        // Auto-register all services
        this.registerAllServices();
    }
    
    // =========================================================================
    // AUTO-REGISTRATION
    // =========================================================================
    
    registerAllServices() {
        console.log('📝 [ServiceRegistry] Registering all services...');
        
        // =================================================================
        // PHASE 2: INFRASTRUCTURE
        // =================================================================
        
        this.register({
            name: 'EnvDetector',
            class: 'OsliraEnvDetector',
            instance: 'OsliraEnv',
            dependencies: [],
            singleton: true,
            autoInit: true,
            phase: 2,
            description: 'Environment detection'
        });
        
        this.register({
            name: 'ConfigProvider',
            class: 'OsliraConfigProvider',
            instance: 'OsliraConfig',
            dependencies: ['EnvDetector'],
            singleton: true,
            autoInit: true,
            phase: 2,
            description: 'Configuration management'
        });
        
        this.register({
            name: 'HttpClient',
            class: 'OsliraHttpClient',
            instance: 'OsliraHttp',
            dependencies: ['Logger'],
            singleton: true,
            autoInit: true,
            phase: 2,
            description: 'HTTP client with retry logic'
        });
        
        this.register({
            name: 'Logger',
            class: 'OsliraLogger',
            instance: 'OsliraLogger',
            dependencies: [],
            singleton: true,
            autoInit: true,
            phase: 2,
            description: 'Logging system with Sentry'
        });
        
        this.register({
            name: 'ErrorHandler',
            class: 'OsliraErrorHandler',
            instance: 'OsliraErrorHandler',
            dependencies: ['Logger'],
            singleton: true,
            autoInit: true,
            phase: 2,
            description: 'Global error handler'
        });
        
        this.register({
            name: 'Monitoring',
            class: 'OsliraMonitoring',
            instance: 'OsliraMonitoring',
            dependencies: ['Logger'],
            singleton: true,
            autoInit: false, // Optional
            phase: 2,
            description: 'Performance monitoring'
        });
        
        // =================================================================
        // PHASE 3: AUTHENTICATION
        // =================================================================
        
        this.register({
            name: 'AuthManager',
            class: 'OsliraAuthManager',
            instance: 'OsliraAuth',
            dependencies: ['ConfigProvider', 'Logger'],
            singleton: true,
            autoInit: true,
            phase: 3,
            description: 'Authentication manager'
        });
        
        this.register({
            name: 'SessionValidator',
            class: 'OsliraSessionValidator',
            instance: 'OsliraSessionValidator',
            dependencies: ['AuthManager'],
            singleton: true,
            autoInit: false, // Started by AuthManager
            phase: 3,
            description: 'Session validation'
        });
        
        this.register({
            name: 'TokenRefresher',
            class: 'OsliraTokenRefresher',
            instance: 'OsliraTokenRefresher',
            dependencies: ['AuthManager'],
            singleton: true,
            autoInit: false, // Started by AuthManager
            phase: 3,
            description: 'Token refresh manager'
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
        
        // =================================================================
        // PHASE 10: UTILITIES
        // =================================================================
        
        this.register({
            name: 'DateUtils',
            class: 'OsliraDateUtils',
            instance: 'OsliraDateUtils',
            dependencies: [],
            singleton: true,
            autoInit: false, // Utilities don't need init
            phase: 10,
            description: 'Date formatting and parsing'
        });
        
        this.register({
            name: 'ValidationUtils',
            class: 'OsliraValidationUtils',
            instance: 'OsliraValidationUtils',
            dependencies: [],
            singleton: true,
            autoInit: false,
            phase: 10,
            description: 'Input validation utilities'
        });
        
        this.register({
            name: 'FormatUtils',
            class: 'OsliraFormatUtils',
            instance: 'OsliraFormatUtils',
            dependencies: [],
            singleton: true,
            autoInit: false,
            phase: 10,
            description: 'Number and text formatting'
        });
        
        this.register({
            name: 'CryptoUtils',
            class: 'OsliraCryptoUtils',
            instance: 'OsliraCryptoUtils',
            dependencies: [],
            singleton: true,
            autoInit: false,
            phase: 10,
            description: 'Cryptographic utilities'
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
            phase = 0,
            description = ''
        } = config;
        
        if (!name || !className) {
            throw new Error('[ServiceRegistry] Service must have name and class');
        }
        
        if (this.services.has(name)) {
            console.warn(`⚠️ [ServiceRegistry] Service ${name} already registered`);
            return;
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
    
    /**
     * Get service configuration
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
     * Get auto-init services
     */
    getAutoInitServices() {
        return this.getAllServices().filter(s => s.autoInit);
    }
    
    // =========================================================================
    // DEPENDENCY RESOLUTION
    // =========================================================================
    
    /**
     * Get initialization order (topological sort)
     */
    getFullInitializationOrder() {
        const autoInitServices = this.getAutoInitServices();
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
        
        // Visit all auto-init services
        for (const service of autoInitServices) {
            visit(service.name);
        }
        
        return order;
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate registry
     */
    validate() {
        const errors = [];
        
        for (const service of this.services.values()) {
            // Check dependencies exist
            for (const dep of service.dependencies) {
                if (!this.services.has(dep)) {
                    errors.push(`${service.name}: missing dependency ${dep}`);
                }
            }
        }
        
        // Check for circular dependencies
        try {
            this.getFullInitializationOrder();
        } catch (error) {
            errors.push(error.message);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Get statistics
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
    
    /**
     * Debug info
     */
    debug() {
        console.group('📋 [ServiceRegistry] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Validation:', this.validate());
        console.log('Init Order:', this.getFullInitializationOrder());
        console.groupEnd();
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraServiceRegistry = new ServiceRegistry();

console.log('✅ [ServiceRegistry] Loaded with', window.OsliraServiceRegistry.getStats().totalServices, 'services');
