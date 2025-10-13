// =============================================================================
// CORE BUNDLE - Pure ES6 Module System
// Path: /src/core/core-bundle.js
// =============================================================================

console.log('📦 [Core Bundle] Loading...');

// =============================================================================
// IMPORT & INITIALIZE CORE SYSTEM
// =============================================================================
import { coreInit } from './init/CoreInitializer.js';

// Initialize core services
const initPromise = coreInit.initialize();

// =============================================================================
// IMPORT UI COMPONENTS (No initialization needed - they're just classes)
// =============================================================================
import './ui/components/layouts/AppFooter.js';
import './ui/components/layouts/AppHeader.js';
import './ui/components/layouts/app-sidebar/AppSidebar.js';
import './ui/components/tooltip/TooltipManager.js';
import './ui/FormValidator.js';
import './ui/UIOrchestrator.js';

// =============================================================================
// IMPORT UTILITIES (No initialization needed)
// =============================================================================
import './utils/CryptoUtils.js';
import './utils/DateUtils.js';
import './utils/FormatUtils.js';
import './utils/NavigationHelper.js';
import './utils/ValidationUtils.js';

// =============================================================================
// DEV TOOLS
// =============================================================================
import './dev/DevConsole.js';
import './dev/tests/DashboardTest.js';

// =============================================================================
// WAIT FOR CORE INITIALIZATION
// =============================================================================
await initPromise;

console.log('✅ [Core Bundle] All modules loaded and initialized');

// =============================================================================
// EXPORT FOR ES6 IMPORTS
// =============================================================================
export { coreInit };
export default coreInit.core;
