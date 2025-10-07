// =============================================================================
// PHASES - Initialization Phase Constants
// Path: /public/core/init/Phases.js
// Dependencies: None
// =============================================================================

/**
 * @constant Phases
 * @description Centralized constants for initialization phases
 * 
 * Phase Definitions:
 * - 0: LOADER - Script loading (handled by Loader.js)
 * - 1: INFRASTRUCTURE - Env, Config, Http, Logger, ErrorHandler
 * - 2: SERVICES - Auth, State, Events, DI
 * - 3: APPLICATION - Page-specific initialization
 * - 4-10: Reserved for future phases
 */

const OsliraPhases = Object.freeze({
    // =============================================================================
    // CORE PHASES
    // =============================================================================
    
    /**
     * Phase 0: Loader
     * Handled automatically by Loader.js
     * Loads all core and page scripts
     */
    LOADER: 0,
    
    /**
     * Phase 1: Infrastructure
     * Core infrastructure services that everything depends on
     * - EnvDetector: Environment detection
     * - ConfigProvider: Configuration management
     * - HttpClient: HTTP requests
     * - Logger: Logging system
     * - ErrorHandler: Global error handling
     * - Monitoring: Performance monitoring (optional)
     */
    INFRASTRUCTURE: 1,
    
    /**
     * Phase 2: Services
     * Business services and state management
     * - EventBus: Event system
     * - Store: Immutable state store
     * - StateManager: State management
     * - Selectors: State selectors
     * - AuthManager: Authentication
     * - Container: Dependency injection
     * - All registered services (via DI)
     */
    SERVICES: 2,
    
    /**
     * Phase 3: Application
     * Page-specific initialization
     * - Load page app class
     * - Initialize page components
     * - Render UI
     */
    APPLICATION: 3,
    
    // =============================================================================
    // EXTENDED PHASES (Reserved for future use)
    // =============================================================================
    
    /**
     * Phase 4: Real-time (Future)
     * WebSocket connections, real-time subscriptions
     */
    REALTIME: 4,
    
    /**
     * Phase 5: Analytics (Future)
     * Analytics tracking, user behavior monitoring
     */
    ANALYTICS: 5,
    
    /**
     * Phase 6: Integrations (Future)
     * Third-party integrations
     */
    INTEGRATIONS: 6,
    
    /**
     * Phase 7: Background Tasks (Future)
     * Background sync, workers
     */
    BACKGROUND: 7,
    
    /**
     * Phase 8: Optimization (Future)
     * Performance optimizations, lazy loading
     */
    OPTIMIZATION: 8,
    
    /**
     * Phase 9: Extensions (Future)
     * Plugin system, extensions
     */
    EXTENSIONS: 9,
    
    /**
     * Phase 10: Finalization (Future)
     * Final setup, cleanup, ready state
     */
    FINALIZATION: 10
});

// =============================================================================
// PHASE METADATA
// =============================================================================

/**
 * Phase metadata for debugging and documentation
 */
const OsliraPhaseMetadata = Object.freeze({
    [OsliraPhases.LOADER]: {
        name: 'Loader',
        description: 'Script loading and dependency management',
        critical: true,
        timeout: 30000, // 30 seconds
        services: ['Loader']
    },
    
    [OsliraPhases.INFRASTRUCTURE]: {
        name: 'Infrastructure',
        description: 'Core infrastructure services',
        critical: true,
        timeout: 10000, // 10 seconds
        services: [
            'EnvDetector',
            'ConfigProvider',
            'HttpClient',
            'Logger',
            'ErrorHandler',
            'Monitoring'
        ]
    },
    
    [OsliraPhases.SERVICES]: {
        name: 'Services',
        description: 'Business services and state management',
        critical: true,
        timeout: 15000, // 15 seconds
        services: [
            'EventBus',
            'Store',
            'StateManager',
            'Selectors',
            'AuthManager',
            'Container',
            'ApiClient',
            'LeadsAPI',
            'BusinessAPI',
            'AnalyticsAPI',
            'AuthAPI',
            'LeadService',
            'AnalyticsService',
            'BusinessService',
            'UserService',
            'UIOrchestrator'
        ]
    },
    
    [OsliraPhases.APPLICATION]: {
        name: 'Application',
        description: 'Page-specific initialization',
        critical: true,
        timeout: 5000, // 5 seconds
        services: [] // Dynamic based on page
    },
    
    [OsliraPhases.REALTIME]: {
        name: 'Real-time',
        description: 'WebSocket and real-time connections',
        critical: false,
        timeout: 10000,
        services: []
    },
    
    [OsliraPhases.ANALYTICS]: {
        name: 'Analytics',
        description: 'Analytics and tracking',
        critical: false,
        timeout: 5000,
        services: []
    },
    
    [OsliraPhases.INTEGRATIONS]: {
        name: 'Integrations',
        description: 'Third-party integrations',
        critical: false,
        timeout: 10000,
        services: []
    },
    
    [OsliraPhases.BACKGROUND]: {
        name: 'Background',
        description: 'Background tasks and workers',
        critical: false,
        timeout: 5000,
        services: []
    },
    
    [OsliraPhases.OPTIMIZATION]: {
        name: 'Optimization',
        description: 'Performance optimizations',
        critical: false,
        timeout: 5000,
        services: []
    },
    
    [OsliraPhases.EXTENSIONS]: {
        name: 'Extensions',
        description: 'Plugin system and extensions',
        critical: false,
        timeout: 5000,
        services: []
    },
    
    [OsliraPhases.FINALIZATION]: {
        name: 'Finalization',
        description: 'Final setup and ready state',
        critical: false,
        timeout: 5000,
        services: []
    }
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get phase name
 */
function getPhaseNameOslira(phase) {
    const metadata = OsliraPhaseMetadata[phase];
    return metadata ? metadata.name : 'Unknown';
}

/**
 * Get phase description
 */
function getPhaseDescriptionOslira(phase) {
    const metadata = OsliraPhaseMetadata[phase];
    return metadata ? metadata.description : 'Unknown phase';
}

/**
 * Check if phase is critical
 */
function isPhaseCriticalOslira(phase) {
    const metadata = OsliraPhaseMetadata[phase];
    return metadata ? metadata.critical : true;
}

/**
 * Get phase timeout
 */
function getPhaseTimeoutOslira(phase) {
    const metadata = OsliraPhaseMetadata[phase];
    return metadata ? metadata.timeout : 10000;
}

/**
 * Get phase services
 */
function getPhaseServicesOslira(phase) {
    const metadata = OsliraPhaseMetadata[phase];
    return metadata ? metadata.services : [];
}

/**
 * Get all phase names
 */
function getAllPhaseNamesOslira() {
    return Object.keys(OsliraPhases).map(key => ({
        key,
        value: OsliraPhases[key],
        name: getPhaseNameOslira(OsliraPhases[key])
    }));
}

/**
 * Validate phase number
 */
function isValidPhaseOslira(phase) {
    return Object.values(OsliraPhases).includes(phase);
}

// =============================================================================
// GLOBAL EXPORTS
// =============================================================================

window.OsliraPhases = OsliraPhases;
window.OsliraPhaseMetadata = OsliraPhaseMetadata;

// Utility functions
window.OsliraPhaseUtils = Object.freeze({
    getName: getPhaseNameOslira,
    getDescription: getPhaseDescriptionOslira,
    isCritical: isPhaseCriticalOslira,
    getTimeout: getPhaseTimeoutOslira,
    getServices: getPhaseServicesOslira,
    getAllNames: getAllPhaseNamesOslira,
    isValid: isValidPhaseOslira
});

console.log('✅ [Phases] Constants loaded and ready');

// =============================================================================
// DEBUG HELPERS
// =============================================================================

/**
 * Print phase information
 */
window.debugPhases = function() {
    console.group('📋 Phase Information');
    
    Object.entries(OsliraPhases).forEach(([key, value]) => {
        const metadata = OsliraPhaseMetadata[value];
        if (metadata) {
            console.group(`Phase ${value}: ${key}`);
            console.log('Name:', metadata.name);
            console.log('Description:', metadata.description);
            console.log('Critical:', metadata.critical);
            console.log('Timeout:', metadata.timeout + 'ms');
            console.log('Services:', metadata.services);
            console.groupEnd();
        }
    });
    
    console.groupEnd();
};

console.log('💡 [Phases] Run window.debugPhases() to see all phase information');
