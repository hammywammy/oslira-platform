// =============================================================================
// DASHBOARD ENTRY POINT (Vite)
// Path: /public/pages/app/dashboard/main.js
// Replaces: /core/init/Loader.js
// =============================================================================

console.log('🚀 [Dashboard] Starting...');

// =============================================================================
// LOAD SHARED CORE BUNDLE (Phases 0-8)
// =============================================================================
import '@/core/core-bundle.js';

// =============================================================================
// DASHBOARD-SPECIFIC MODULES (from ModuleRegistry)
// =============================================================================

// Phase 0: Dependency Injection System
import '@/core/di/ServiceRegistry.js';
import '@/core/di/Container.js';

// Phase 1: Infrastructure
import '@/core/ui/components/tooltip/TooltipManager.js';

// Phase 2: Dashboard Core App
import '@/pages/app/dashboard/core/DashboardApp.js';

// Phase 3: Domain Services
import '@/pages/app/dashboard/domain/leads/LeadService.js';
import '@/pages/app/dashboard/domain/leads/LeadValidation.js';

// Phase 4: UI Components
import '@/pages/app/dashboard/ui/components/IconComponents.js';
import '@/pages/app/dashboard/ui/components/LeadsTable.js';
import '@/pages/app/dashboard/ui/components/LeadsTableRenderer.js';

// Phase 5: Infrastructure
import '@/pages/app/dashboard/infrastructure/RealtimeManager.js';

// Phase 6: Domain - Rendering
import '@/pages/app/dashboard/ui/components/InsightsPanel.js';

// Phase 7: Application Layer
import '@/pages/app/dashboard/application/leads/LeadDisplayUseCase.js';
import '@/pages/app/dashboard/application/analysis/AnalyzeLeadUseCase.js';

// Phase 8: Domain - Analysis
import '@/pages/app/dashboard/domain/analysis/AnalysisFunctions.js';

// Phase 9: UI Modals - Personality Components
import '@/pages/app/dashboard/ui/modals/components/ModalComponentsPersonality.js';

// Phase 10: Modals - Configurations
import '@/pages/app/dashboard/ui/modals/configs/ResearchModal.js';
import '@/pages/app/dashboard/ui/modals/configs/AnalysisConfig.js';

// Phase 11: UI Modals - Xray Components
import '@/pages/app/dashboard/ui/modals/components/ModalComponentsXray.js';

// Phase 12: Domain - Stats
import '@/pages/app/dashboard/domain/stats/StatsCalculator.js';

// Phase 14: Analysis System - Queue
import '@/pages/app/dashboard/domain/analysis/AnalysisQueueRenderer.js';
import '@/pages/app/dashboard/ui/components/TipOfDay.js';
import '@/pages/app/dashboard/shared/DailyTips.js';
import '@/pages/app/dashboard/ui/modals/FilterModal.js';
import '@/pages/app/dashboard/domain/analysis/AnalysisQueue.js';
import '@/pages/app/dashboard/domain/analysis/AnalysisQueueAnimator.js';

// Phase 15: UI Modals - Deep Components
import '@/pages/app/dashboard/ui/modals/components/ModalComponentsDeep.js';

// Phase 16: Domain - Leads
import '@/pages/app/dashboard/domain/leads/LeadManager.js';

// Phase 17: UI Modals - Tab System
import '@/pages/app/dashboard/ui/modals/TabSystem.js';

// Phase 18: UI Modals - Modal Manager
import '@/pages/app/dashboard/ui/modals/ModalManager.js';
import '@/pages/app/dashboard/ui/modals/ModalBuilder.js';

// Phase 19: UI Components - Stats & Bulk
import '@/pages/app/dashboard/ui/components/StatsCards.js';
import '@/pages/app/dashboard/domain/bulk/BulkUpload.js';
import '@/pages/app/dashboard/ui/modals/configs/BulkModal.js';

// Phase 20: UI Modals - Core Components
import '@/pages/app/dashboard/ui/modals/components/ModalComponentsCore.js';

// Phase 21: UI Components - Header
import '@/pages/app/dashboard/ui/components/DashboardHeader.js';

// Phase 22: Domain - Business
import '@/pages/app/dashboard/domain/business/BusinessManager.js';

// Phase 24: Event System
import '@/pages/app/dashboard/core/DashboardEventSystem.js';

// Phase 99: DevConsole (Load last)
import '@/core/dev/tests/DashboardTest.js';
import '@/core/dev/DevConsole.js';

console.log('✅ [Dashboard] All modules loaded');

// =============================================================================
// INITIALIZATION
// =============================================================================

async function initializeDashboard() {
    const startTime = performance.now();
    
    try {
        console.log('🔧 [Dashboard] Initializing...');
        
        // Wait for DOM ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        console.log('📄 [Dashboard] DOM ready');
        
        // Initialize DashboardApp
        if (!window.DashboardApp) {
            throw new Error('DashboardApp not found on window');
        }
        
        const app = new window.DashboardApp();
        await app.init();  // ✅ FIXED: Changed from initialize() to init()
        
        const loadTime = performance.now() - startTime;
        console.log(`✅ [Dashboard] Initialized in ${loadTime.toFixed(2)}ms`);
        
        // Report metrics
        if (window.OsliraMonitoring) {
            window.OsliraMonitoring.recordMetric('dashboard_load_time', loadTime);
        }
        
    } catch (error) {
        console.error('❌ [Dashboard] Initialization failed:', error);
        
        // Show error UI
        if (window.OsliraErrorHandler) {
            window.OsliraErrorHandler.handleError(error, {
                context: 'dashboard_init',
                fatal: true
            });
        }
        
        // Show user-friendly error
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
                <div style="text-align: center;">
                    <h1 style="color: #dc2626; margin-bottom: 1rem;">Dashboard Failed to Load</h1>
                    <p style="color: #6b7280; margin-bottom: 2rem;">${error.message}</p>
                    <button onclick="window.location.reload()" 
                            style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Start initialization
initializeDashboard();
