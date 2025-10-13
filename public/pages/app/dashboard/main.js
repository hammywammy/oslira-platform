// src/pages/dashboard/main.js
console.log('🚀 [Dashboard] Starting...');

// Load shared core bundle
import '../../core-bundle.js';

// Dashboard-specific imports (from ModuleRegistry dashboard config)
import '@/core/di/ServiceRegistry.js';
import '@/core/di/Container.js';
import '@/core/ui/components/tooltip/TooltipManager.js';
import '@dashboard/core/DashboardApp.js';
import '@dashboard/domain/leads/LeadService.js';
import '@dashboard/domain/leads/LeadValidation.js';
import '@dashboard/ui/components/IconComponents.js';
import '@dashboard/ui/components/LeadsTable.js';
import '@dashboard/ui/components/LeadsTableRenderer.js';
import '@dashboard/infrastructure/RealtimeManager.js';
import '@dashboard/ui/components/InsightsPanel.js';
import '@dashboard/application/leads/LeadDisplayUseCase.js';
import '@dashboard/application/analysis/AnalyzeLeadUseCase.js';
import '@dashboard/domain/analysis/AnalysisFunctions.js';
import '@dashboard/ui/modals/components/ModalComponentsPersonality.js';
import '@dashboard/ui/modals/configs/ResearchModal.js';
import '@dashboard/ui/modals/configs/AnalysisConfig.js';
import '@dashboard/ui/modals/components/ModalComponentsXray.js';
import '@dashboard/domain/stats/StatsCalculator.js';
import '@dashboard/domain/analysis/AnalysisQueueRenderer.js';
import '@dashboard/ui/components/TipOfDay.js';
import '@dashboard/shared/DailyTips.js';
import '@dashboard/ui/modals/FilterModal.js';
import '@dashboard/domain/analysis/AnalysisQueue.js';
import '@dashboard/domain/analysis/AnalysisQueueAnimator.js';
import '@dashboard/ui/modals/components/ModalComponentsDeep.js';
import '@dashboard/domain/leads/LeadManager.js';
import '@dashboard/ui/modals/TabSystem.js';
import '@dashboard/ui/modals/ModalManager.js';
import '@dashboard/ui/modals/ModalBuilder.js';
import '@dashboard/ui/components/StatsCards.js';
import '@dashboard/domain/bulk/BulkUpload.js';
import '@dashboard/ui/modals/configs/BulkModal.js';
import '@dashboard/ui/modals/components/ModalComponentsCore.js';
import '@dashboard/ui/components/DashboardHeader.js';
import '@dashboard/domain/business/BusinessManager.js';
import '@/core/ui/components/layouts/app-sidebar/AppSidebar.js';
import '@dashboard/core/DashboardEventSystem.js';
import '@/core/dev/tests/DashboardTest.js';
import '@/core/dev/DevConsole.js';

// Initialize dashboard
async function initDashboard() {
    const startTime = performance.now();
    
    try {
        console.log('📦 [Dashboard] All modules loaded');
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Initialize app
        const app = new window.DashboardApp();
        await app.initialize();
        
        const loadTime = performance.now() - startTime;
        console.log(`✅ [Dashboard] Initialized in ${loadTime.toFixed(2)}ms`);
        
    } catch (error) {
        console.error('❌ [Dashboard] Initialization failed:', error);
        
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
                <div style="text-align: center;">
                    <h1 style="color: #ef4444;">Dashboard Load Failed</h1>
                    <p style="color: #6b7280;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Reload
                    </button>
                </div>
            </div>
        `;
    }
}

initDashboard();
