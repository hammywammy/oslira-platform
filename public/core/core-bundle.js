// src/core-bundle.js
console.log('📦 [Core Bundle] Loading...');

// Phase 0: Critical Infrastructure
import '@/core/infrastructure/EnvDetector.js';
import '@/core/infrastructure/Logger.js';
import '@/core/infrastructure/ErrorHandler.js';
import '@/core/events/EventBus.js';

// Phase 1: Core Infrastructure
import '@/core/infrastructure/HttpClient.js';
import '@/core/infrastructure/ConfigProvider.js';
import '@/core/infrastructure/Monitoring.js';

// Phase 1: Utils (ALL from your utils folder)
import '@/core/utils/CryptoUtils.js';
import '@/core/utils/DateUtils.js';
import '@/core/utils/FormatUtils.js';
import '@/core/utils/NavigationHelper.js';
import '@/core/utils/ValidationUtils.js';

// Phase 2: Dependency Injection
import '@/core/di/ServiceRegistry.js';
import '@/core/di/Container.js';

// Phase 3: State Layer
import '@/core/state/Store.js';
import '@/core/state/StateManager.js';
import '@/core/state/Selectors.js';

// Phase 4: API Layer
import '@/core/api/ApiClient.js';
import '@/core/api/endpoints/AnalyticsAPI.js';
import '@/core/api/endpoints/AuthAPI.js';
import '@/core/api/endpoints/BusinessAPI.js';
import '@/core/api/endpoints/LeadsAPI.js';

// Phase 5: Auth System
import '@/core/auth/AuthManager.js';
import '@/core/auth/SessionValidator.js';
import '@/core/auth/TokenRefresher.js';

// Phase 6: Services
import '@/core/services/AnalyticsService.js';
import '@/core/services/BusinessService.js';
import '@/core/services/UserService.js';

// Phase 7: Core UI Components (shared by all pages)
import '@/core/ui/components/layouts/AppFooter.js';
import '@/core/ui/components/layouts/AppHeader.js';
import '@/core/ui/components/layouts/app-sidebar/AppSidebar.js';
import '@/core/ui/components/tooltip/TooltipManager.js';
import '@/core/ui/FormValidator.js';
import '@/core/ui/UIOrchestrator.js';

// Phase 8: DevTools (keep for debugging)
import '@/core/dev/DevConsole.js';
import '@/core/dev/tests/DashboardTest.js';

console.log('✅ [Core Bundle] Loaded');
