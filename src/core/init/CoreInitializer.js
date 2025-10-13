// =============================================================================
// CORE INITIALIZER - Pure ES6 Dependency Management
// Path: /src/core/init/CoreInitializer.js
// Replaces: ServiceRegistry + Container
// =============================================================================

import EnvDetector from '../infrastructure/EnvDetector.js';
import Logger from '../infrastructure/Logger.js';
import ErrorHandler from '../infrastructure/ErrorHandler.js';
import EventBus from '../events/EventBus.js';
import HttpClient from '../infrastructure/HttpClient.js';
import ConfigProvider from '../infrastructure/ConfigProvider.js';
import Monitoring from '../infrastructure/Monitoring.js';

import Store from '../state/Store.js';
import StateManager from '../state/StateManager.js';
import Selectors from '../state/Selectors.js';

import ApiClient from '../api/ApiClient.js';
import AnalyticsAPI from '../api/endpoints/AnalyticsAPI.js';
import AuthAPI from '../api/endpoints/AuthAPI.js';
import BusinessAPI from '../api/endpoints/BusinessAPI.js';
import LeadsAPI from '../api/endpoints/LeadsAPI.js';

import AuthManager from '../auth/AuthManager.js';
import SessionValidator from '../auth/SessionValidator.js';
import TokenRefresher from '../auth/TokenRefresher.js';

import AnalyticsService from '../services/AnalyticsService.js';
import BusinessService from '../services/BusinessService.js';
import UserService from '../services/UserService.js';

/**
 * @class CoreInitializer
 * @description Pure ES6 module initialization with explicit dependency injection
 * 
 * Benefits over old DI Container:
 * - Clear dependency graph (you can see it!)
 * - No magic window lookups
 * - TypeScript ready
 * - Tree-shakeable
 * - Easier to debug
 */
export class CoreInitializer {
    constructor() {
        this.core = {};
        this.initialized = false;
        console.log('🚀 [CoreInitializer] Instance created');
    }
    
    /**
     * Initialize all core services in dependency order
     */
    async initialize() {
        if (this.initialized) {
            console.log('⚠️ [CoreInitializer] Already initialized');
            return this.core;
        }
        
        console.log('🚀 [CoreInitializer] Starting initialization...');
        const startTime = performance.now();
        
        try {
            // ================================================================
            // PHASE 1: Zero-Dependency Services
            // ================================================================
            console.log('📦 [Phase 1] Zero-dependency services...');
            
            this.core.envDetector = new EnvDetector();
            this.core.logger = new Logger();
            await this.core.logger.initialize();
            
            this.core.errorHandler = new ErrorHandler();
            await this.core.errorHandler.initialize({
                logger: this.core.logger
            });
            
            this.core.eventBus = new EventBus();
            await this.core.eventBus.initialize({
                logger: this.core.logger
            });
            
            // ================================================================
            // PHASE 2: Basic Infrastructure
            // ================================================================
            console.log('📦 [Phase 2] Basic infrastructure...');
            
            this.core.httpClient = new HttpClient();
            await this.core.httpClient.initialize({
                logger: this.core.logger
            });
            
            this.core.configProvider = new ConfigProvider();
            await this.core.configProvider.initialize({
                envDetector: this.core.envDetector,
                logger: this.core.logger,
                httpClient: this.core.httpClient
            });
            
            this.core.monitoring = new Monitoring();
            await this.core.monitoring.initialize({
                logger: this.core.logger
            });
            
            // ================================================================
            // PHASE 3: State Management
            // ================================================================
            console.log('📦 [Phase 3] State management...');
            
            this.core.store = new Store();
            await this.core.store.initialize({
                logger: this.core.logger
            });
            
            this.core.stateManager = new StateManager();
            await this.core.stateManager.initialize({
                store: this.core.store,
                logger: this.core.logger
            });
            
            this.core.selectors = new Selectors();
            await this.core.selectors.initialize({
                store: this.core.store
            });
            
            // ================================================================
            // PHASE 4: API Layer
            // ================================================================
            console.log('📦 [Phase 4] API layer...');
            
            this.core.apiClient = new ApiClient();
            await this.core.apiClient.initialize({
                httpClient: this.core.httpClient,
                logger: this.core.logger,
                envDetector: this.core.envDetector
            });
            
            this.core.analyticsAPI = new AnalyticsAPI();
            await this.core.analyticsAPI.initialize({
                apiClient: this.core.apiClient
            });
            
            this.core.authAPI = new AuthAPI();
            await this.core.authAPI.initialize({
                apiClient: this.core.apiClient
            });
            
            this.core.businessAPI = new BusinessAPI();
            await this.core.businessAPI.initialize({
                apiClient: this.core.apiClient
            });
            
            this.core.leadsAPI = new LeadsAPI();
            await this.core.leadsAPI.initialize({
                apiClient: this.core.apiClient
            });
            
            // ================================================================
            // PHASE 5: Authentication System
            // ================================================================
            console.log('📦 [Phase 5] Authentication system...');
            
            this.core.authManager = new AuthManager();
            await this.core.authManager.initialize({
                configProvider: this.core.configProvider,
                logger: this.core.logger,
                eventBus: this.core.eventBus
            });
            
            // Update API client with auth manager
            this.core.apiClient.authManager = this.core.authManager;
            
            this.core.sessionValidator = new SessionValidator();
            await this.core.sessionValidator.initialize({
                authManager: this.core.authManager
            });
            
            this.core.tokenRefresher = new TokenRefresher();
            await this.core.tokenRefresher.initialize({
                authManager: this.core.authManager
            });
            
            // ================================================================
            // PHASE 6: Business Services
            // ================================================================
            console.log('📦 [Phase 6] Business services...');
            
            this.core.analyticsService = new AnalyticsService();
            await this.core.analyticsService.initialize({
                analyticsAPI: this.core.analyticsAPI,
                stateManager: this.core.stateManager,
                logger: this.core.logger
            });
            
            this.core.businessService = new BusinessService();
            await this.core.businessService.initialize({
                businessAPI: this.core.businessAPI,
                authManager: this.core.authManager,
                stateManager: this.core.stateManager,
                logger: this.core.logger
            });
            
            this.core.userService = new UserService();
            await this.core.userService.initialize({
                authAPI: this.core.authAPI,
                authManager: this.core.authManager,
                stateManager: this.core.stateManager,
                logger: this.core.logger
            });
            
            // ================================================================
            // FINALIZATION
            // ================================================================
            
            this.initialized = true;
            const duration = (performance.now() - startTime).toFixed(0);
            
            console.log(`✅ [CoreInitializer] Complete in ${duration}ms`);
            console.log('📦 [CoreInitializer] Services initialized:', Object.keys(this.core).length);
            
            // Expose on window for backwards compatibility (temporary)
            this._exposeOnWindow();
            
            return this.core;
            
        } catch (error) {
            console.error('❌ [CoreInitializer] Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Expose core services on window (backwards compatibility)
     * TODO: Remove this once all onclick handlers are converted
     */
    _exposeOnWindow() {
        window.OsliraEnv = this.core.envDetector;
        window.OsliraLogger = this.core.logger;
        window.OsliraErrorHandler = this.core.errorHandler;
        window.OsliraEventBus = this.core.eventBus;
        window.OsliraHttpClient = this.core.httpClient;
        window.OsliraConfig = this.core.configProvider;
        window.OsliraMonitoring = this.core.monitoring;
        
        window.OsliraStore = this.core.store;
        window.OsliraStateManager = this.core.stateManager;
        window.OsliraSelectors = this.core.selectors;
        
        window.OsliraApiClient = this.core.apiClient;
        window.OsliraAnalyticsAPI = this.core.analyticsAPI;
        window.OsliraAuthAPI = this.core.authAPI;
        window.OsliraBusinessAPI = this.core.businessAPI;
        window.OsliraLeadsAPI = this.core.leadsAPI;
        
        window.OsliraAuth = this.core.authManager;
        window.OsliraSessionValidator = this.core.sessionValidator;
        window.OsliraTokenRefresher = this.core.tokenRefresher;
        
        window.OsliraAnalyticsService = this.core.analyticsService;
        window.OsliraBusinessService = this.core.businessService;
        window.OsliraUserService = this.core.userService;
        
        console.log('✅ [CoreInitializer] Window globals exposed for backwards compatibility');
    }
    
    /**
     * Get specific service
     */
    get(serviceName) {
        return this.core[serviceName];
    }
    
    /**
     * Check if initialized
     */
    isReady() {
        return this.initialized;
    }
}

// Export singleton instance
export const coreInit = new CoreInitializer();

// Default export
export default CoreInitializer;
