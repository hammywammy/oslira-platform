// =============================================================================
// DASHBOARD ENTRY POINT - Pure ES6 Module System
// Path: /src/pages/app/dashboard/main.js
// =============================================================================

console.log('🚀 [Dashboard] Starting...');

// =============================================================================
// IMPORT CSS
// =============================================================================
import '../../../assets/css/base.css';
import '../../../assets/css/tailwind.css';
import '../../../core/ui/components/buttons/buttons.css';
import '../../../core/ui/components/layouts/app-sidebar/AppSidebar.css';
import './css/dashboard.css';
import './css/components/header.css';
import './css/components/stats-cards.css';
import './css/components/analysis-queue.css';

// =============================================================================
// IMPORT & INITIALIZE CORE SYSTEM
// =============================================================================
import coreBundle, { coreInit } from '@/core/core-bundle.js';

// Wait for core to be ready
console.log('⏳ [Dashboard] Waiting for core initialization...');
const core = await coreBundle;
console.log('✅ [Dashboard] Core initialized:', Object.keys(core).length, 'services');

// =============================================================================
// IMPORT & INITIALIZE DASHBOARD
// =============================================================================
import { DashboardInitializer } from './init/DashboardInitializer.js';

const dashboardInit = new DashboardInitializer(core);
const dashboard = await dashboardInit.initialize();

console.log('✅ [Dashboard] Dashboard initialized:', Object.keys(dashboard).length, 'components');

// =============================================================================
// RENDER UI
// =============================================================================

// Render sidebar
const SidebarManager = (await import('@/core/ui/components/layouts/app-sidebar/AppSidebar.js')).default;
const sidebarManager = new SidebarManager();
await sidebarManager.render('#sidebar-container');

// Render dashboard header
await dashboard.dashboardHeader.render('#dashboard-header', {
    authManager: core.authManager,
    eventBus: core.eventBus,
    stateManager: core.stateManager
});

// Render leads table
await dashboard.leadsTable.render('#leads-table-container');

// Render stats cards
await dashboard.statsCards.render('#stats-cards-container', {
    stateManager: core.stateManager,
    statsCalculator: dashboard.statsCalculator
});

// Initialize realtime updates
await dashboard.realtimeManager.connect();

// =============================================================================
// REMOVE LOADING SCREEN
// =============================================================================
const loader = document.getElementById('app-loader');
if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
}

document.body.style.visibility = 'visible';

console.log('✅ [Dashboard] Fully loaded and rendered');

// =============================================================================
// EXPORT FOR DEBUGGING
// =============================================================================
export { core, dashboard };
