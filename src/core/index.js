// =============================================================================
// CORE EXPORTS - Centralized ES6 Module Exports
// Path: src/core/index.js
// =============================================================================

// Infrastructure
export { default as EnvDetector } from './infrastructure/EnvDetector.js';
export { default as Logger } from './infrastructure/Logger.js';
export { default as ErrorHandler } from './infrastructure/ErrorHandler.js';
export { default as HttpClient } from './infrastructure/HttpClient.js';
export { default as ConfigProvider } from './infrastructure/ConfigProvider.js';
export { default as Monitoring } from './infrastructure/Monitoring.js';

// Events
export { default as EventBus } from './events/EventBus.js';

// Utils
export { default as CryptoUtils } from './utils/CryptoUtils.js';
export { default as DateUtils } from './utils/DateUtils.js';
export { default as FormatUtils } from './utils/FormatUtils.js';
export { default as NavigationHelper } from './utils/NavigationHelper.js';
export { default as ValidationUtils } from './utils/ValidationUtils.js';

// DI
export { default as ServiceRegistry } from './di/ServiceRegistry.js';
export { default as Container } from './di/Container.js';

// State
export { default as Store } from './state/Store.js';
export { default as StateManager } from './state/StateManager.js';
export { default as Selectors } from './state/Selectors.js';

// API
export { default as ApiClient } from './api/ApiClient.js';
export { default as AnalyticsAPI } from './api/endpoints/AnalyticsAPI.js';
export { default as AuthAPI } from './api/endpoints/AuthAPI.js';
export { default as BusinessAPI } from './api/endpoints/BusinessAPI.js';
export { default as LeadsAPI } from './api/endpoints/LeadsAPI.js';

// Auth
export { default as AuthManager } from './auth/AuthManager.js';
export { default as SessionValidator } from './auth/SessionValidator.js';
export { default as TokenRefresher } from './auth/TokenRefresher.js';

// Services
export { default as AnalyticsService } from './services/AnalyticsService.js';
export { default as BusinessService } from './services/BusinessService.js';
export { default as UserService } from './services/UserService.js';

// UI Components
export { default as AppFooter } from './ui/components/layouts/AppFooter.js';
export { default as AppHeader } from './ui/components/layouts/AppHeader.js';
export { default as AppSidebar } from './ui/components/layouts/app-sidebar/AppSidebar.js';
export { default as TooltipManager } from './ui/components/tooltip/TooltipManager.js';
export { default as FormValidator } from './ui/FormValidator.js';
export { default as UIOrchestrator } from './ui/UIOrchestrator.js';

// Dev Tools
export { default as DevConsole } from './dev/DevConsole.js';
export { default as DashboardTest } from './dev/tests/DashboardTest.js';
