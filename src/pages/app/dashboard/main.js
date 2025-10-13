// =============================================================================
// DASHBOARD ENTRY POINT (Vite + ES6 Modules)
// =============================================================================

console.log('🚀 [Dashboard] Starting...');

// =============================================================================
// IMPORT CSS (Vite processes these)
// =============================================================================
import '../../../assets/css/base.css';
import '../../../assets/css/tailwind.css';
import '../../../core/ui/components/buttons/buttons.css';
import '../../../core/ui/components/layouts/app-sidebar/AppSidebar.css';
import './css/dashboard.css';
import './css/components/header.css';
import './css/components/stats-cards.css';
import './css/components/analysis-queue.css';

import '@/core/core-bundle.js'; 
// =============================================================================
// IMPORT DASHBOARD MODULES
// =============================================================================
import DashboardApp from './core/DashboardApp.js';
import LeadService from './domain/leads/LeadService.js';
import LeadValidation from './domain/leads/LeadValidation.js';
import LeadsTable from './ui/components/LeadsTable.js';
import LeadsTableRenderer from './ui/components/LeadsTableRenderer.js';
import RealtimeManager from './infrastructure/RealtimeManager.js';
import InsightsPanel from './ui/components/InsightsPanel.js';
import LeadDisplayUseCase from './application/leads/LeadDisplayUseCase.js';
import AnalyzeLeadUseCase from './application/analysis/AnalyzeLeadUseCase.js';
import AnalysisFunctions from './domain/analysis/AnalysisFunctions.js';
import ResearchModal from './ui/modals/configs/ResearchModal.js';
import AnalysisConfig from './ui/modals/configs/AnalysisConfig.js';
import StatsCalculator from './domain/stats/StatsCalculator.js';
import AnalysisQueueRenderer from './domain/analysis/AnalysisQueueRenderer.js';
import TipOfDay from './ui/components/TipOfDay.js';
import DailyTips from './shared/DailyTips.js';
import FilterModal from './ui/modals/FilterModal.js';
import AnalysisQueue from './domain/analysis/AnalysisQueue.js';
import AnalysisQueueAnimator from './domain/analysis/AnalysisQueueAnimator.js';
import LeadManager from './domain/leads/LeadManager.js';
import TabSystem from './ui/modals/TabSystem.js';
import ModalManager from './ui/modals/ModalManager.js';
import ModalBuilder from './ui/modals/ModalBuilder.js';
import StatsCards from './ui/components/StatsCards.js';
import BulkUpload from './domain/bulk/BulkUpload.js';
import BulkModal from './ui/modals/configs/BulkModal.js';
import DashboardHeader from './ui/components/DashboardHeader.js';
import BusinessManager from './domain/business/BusinessManager.js';
import DashboardEventSystem from './core/DashboardEventSystem.js';

// =============================================================================
// EXPOSE ON WINDOW FOR BACKWARDS COMPATIBILITY
// =============================================================================
// Expose core modules
Object.assign(window, Core);

// Expose dashboard modules
window.DashboardApp = DashboardApp;
window.LeadService = LeadService;
window.LeadManager = LeadManager;
window.ModalManager = ModalManager;
window.BusinessManager = BusinessManager;
window.StatsCards = StatsCards;
window.DashboardHeader = DashboardHeader;
// ... add others as needed

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
        const app = new DashboardApp();
        await app.init();
        
        const loadTime = performance.now() - startTime;
        console.log(`✅ [Dashboard] Initialized in ${loadTime.toFixed(2)}ms`);
        
        // Report metrics
        if (window.OsliraMonitoring) {
            window.OsliraMonitoring.recordMetric('dashboard_load_time', loadTime);
        }
        
    } catch (error) {
        console.error('❌ [Dashboard] Initialization failed:', error);
        
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
