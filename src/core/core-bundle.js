// =============================================================================
// CORE BUNDLE - Shared infrastructure loaded by ALL pages
// Path: /public/core/core-bundle.js
// =============================================================================

console.log('📦 [Core Bundle] Loading...');

// =============================================================================
// PHASE 0: CRITICAL INFRASTRUCTURE
// =============================================================================
import './infrastructure/EnvDetector.js';
import './infrastructure/Logger.js';
import './infrastructure/ErrorHandler.js';
import './events/EventBus.js';

// =============================================================================
// PHASE 1: CORE INFRASTRUCTURE
// =============================================================================
import './infrastructure/HttpClient.js';
import './infrastructure/ConfigProvider.js';
import './infrastructure/Monitoring.js';

// =============================================================================
// PHASE 1: UTILS
// =============================================================================
import './utils/CryptoUtils.js';
import './utils/DateUtils.js';
import './utils/FormatUtils.js';
import './utils/NavigationHelper.js';
import './utils/ValidationUtils.js';

// =============================================================================
// PHASE 2: DEPENDENCY INJECTION
// =============================================================================
import './di/ServiceRegistry.js';
import './di/Container.js';

// =============================================================================
// PHASE 3: STATE LAYER
// =============================================================================
import './state/Store.js';
import './state/StateManager.js';
import './state/Selectors.js';

// =============================================================================
// PHASE 4: API LAYER
// =============================================================================
import './api/ApiClient.js';
import './api/endpoints/AnalyticsAPI.js';
import './api/endpoints/AuthAPI.js';
import './api/endpoints/BusinessAPI.js';
import './api/endpoints/LeadsAPI.js';

// =============================================================================
// PHASE 5: AUTH SYSTEM
// =============================================================================
import './auth/AuthManager.js';
import './auth/SessionValidator.js';
import './auth/TokenRefresher.js';

// =============================================================================
// PHASE 6: SERVICES
// =============================================================================
import './services/AnalyticsService.js';
import './services/BusinessService.js';
import './services/UserService.js';

// =============================================================================
// PHASE 7: CORE UI COMPONENTS (Shared by all pages)
// =============================================================================
import './ui/components/layouts/AppFooter.js';
import './ui/components/layouts/AppHeader.js';
import './ui/components/layouts/app-sidebar/AppSidebar.js';
import './ui/components/tooltip/TooltipManager.js';
import './ui/FormValidator.js';
import './ui/UIOrchestrator.js';

// =============================================================================
// PHASE 8: DEV TOOLS
// =============================================================================
import './dev/DevConsole.js';
import './dev/tests/DashboardTest.js';

console.log('✅ [Core Bundle] All modules loaded');
