// =============================================================================
// DASHBOARD INITIALIZER - Pure ES6 Module Initialization
// Path: /src/pages/app/dashboard/init/DashboardInitializer.js
// =============================================================================

import LeadService from '../domain/leads/LeadService.js';
import LeadValidation from '../domain/leads/LeadValidation.js';
import LeadManager from '../domain/leads/LeadManager.js';
import LeadsTable from '../ui/components/LeadsTable.js';
import LeadsTableRenderer from '../ui/components/LeadsTableRenderer.js';
import RealtimeManager from '../infrastructure/RealtimeManager.js';
import InsightsPanel from '../ui/components/InsightsPanel.js';
import LeadDisplayUseCase from '../application/leads/LeadDisplayUseCase.js';
import AnalyzeLeadUseCase from '../application/analysis/AnalyzeLeadUseCase.js';
import AnalysisFunctions from '../domain/analysis/AnalysisFunctions.js';
import AnalysisQueue from '../domain/analysis/AnalysisQueue.js';
import AnalysisQueueRenderer from '../domain/analysis/AnalysisQueueRenderer.js';
import AnalysisQueueAnimator from '../domain/analysis/AnalysisQueueAnimator.js';
import StatsCalculator from '../domain/stats/StatsCalculator.js';
import StatsCards from '../ui/components/StatsCards.js';
import DashboardHeader from '../ui/components/DashboardHeader.js';
import BusinessManager from '../domain/business/BusinessManager.js';
import ModalManager from '../ui/modals/ModalManager.js';
import ModalBuilder from '../ui/modals/ModalBuilder.js';
import TabSystem from '../ui/modals/TabSystem.js';
import TipOfDay from '../ui/components/TipOfDay.js';
import DailyTips from '../shared/DailyTips.js';
import FilterModal from '../ui/modals/FilterModal.js';
import BulkUpload from '../domain/bulk/BulkUpload.js';
import DashboardEventSystem from '../core/DashboardEventSystem.js';

/**
 * @class DashboardInitializer
 * @description Orchestrates dashboard initialization with core dependencies
 */
export class DashboardInitializer {
    constructor(core) {
        this.core = core; // Core services from CoreInitializer
        this.dashboard = {};
        this.initialized = false;
    }
    
    async initialize() {
        if (this.initialized) {
            console.log('⚠️ [DashboardInitializer] Already initialized');
            return this.dashboard;
        }
        
        console.log('📊 [DashboardInitializer] Starting dashboard initialization...');
        const startTime = performance.now();
        
        try {
            // ================================================================
            // PHASE 1: Domain Services
            // ================================================================
            console.log('📦 [Dashboard Phase 1] Domain services...');
            
            this.dashboard.leadValidation = new LeadValidation();
            
            this.dashboard.leadService = new LeadService();
            await this.dashboard.leadService.initialize({
                leadsAPI: this.core.leadsAPI,
                stateManager: this.core.stateManager,
                eventBus: this.core.eventBus,
                logger: this.core.logger
            });
            
            this.dashboard.leadManager = new LeadManager();
            await this.dashboard.leadManager.initialize({
                leadService: this.dashboard.leadService,
                stateManager: this.core.stateManager,
                eventBus: this.core.eventBus
            });
            
            this.dashboard.businessManager = new BusinessManager();
            await this.dashboard.businessManager.initialize({
                businessService: this.core.businessService,
                stateManager: this.core.stateManager,
                eventBus: this.core.eventBus
            });
            
            // ================================================================
            // PHASE 2: Analysis System
            // ================================================================
            console.log('📦 [Dashboard Phase 2] Analysis system...');
            
            this.dashboard.analysisFunctions = new AnalysisFunctions();
            
            this.dashboard.analysisQueue = new AnalysisQueue();
            await this.dashboard.analysisQueue.initialize({
                eventBus: this.core.eventBus,
                stateManager: this.core.stateManager
            });
            
            this.dashboard.analysisQueueRenderer = new AnalysisQueueRenderer();
            this.dashboard.analysisQueueAnimator = new AnalysisQueueAnimator();
            
            this.dashboard.analyzeLeadUseCase = new AnalyzeLeadUseCase();
            await this.dashboard.analyzeLeadUseCase.initialize({
                leadsAPI: this.core.leadsAPI,
                analysisQueue: this.dashboard.analysisQueue,
                eventBus: this.core.eventBus,
                stateManager: this.core.stateManager
            });
            
            // ================================================================
            // PHASE 3: UI Components
            // ================================================================
            console.log('📦 [Dashboard Phase 3] UI components...');
            
            this.dashboard.statsCalculator = new StatsCalculator();
            this.dashboard.statsCards = new StatsCards();
            
            this.dashboard.leadsTableRenderer = new LeadsTableRenderer();
            this.dashboard.leadsTable = new LeadsTable();
            await this.dashboard.leadsTable.initialize({
                leadService: this.dashboard.leadService,
                renderer: this.dashboard.leadsTableRenderer,
                stateManager: this.core.stateManager,
                eventBus: this.core.eventBus
            });
            
            this.dashboard.insightsPanel = new InsightsPanel();
            this.dashboard.dashboardHeader = new DashboardHeader();
            
            this.dashboard.tipOfDay = new TipOfDay();
            this.dashboard.dailyTips = new DailyTips();
            
            // ================================================================
            // PHASE 4: Modals
            // ================================================================
            console.log('📦 [Dashboard Phase 4] Modal system...');
            
            this.dashboard.tabSystem = new TabSystem();
            this.dashboard.modalBuilder = new ModalBuilder();
            
            this.dashboard.modalManager = new ModalManager();
            await this.dashboard.modalManager.initialize({
                modalBuilder: this.dashboard.modalBuilder,
                eventBus: this.core.eventBus
            });
            
            this.dashboard.filterModal = new FilterModal();
            this.dashboard.bulkUpload = new BulkUpload();
            
            // ================================================================
            // PHASE 5: Infrastructure
            // ================================================================
            console.log('📦 [Dashboard Phase 5] Infrastructure...');
            
            this.dashboard.realtimeManager = new RealtimeManager();
            await this.dashboard.realtimeManager.initialize({
                authManager: this.core.authManager,
                stateManager: this.core.stateManager,
                eventBus: this.core.eventBus
            });
            
            this.dashboard.eventSystem = new DashboardEventSystem();
            await this.dashboard.eventSystem.initialize({
                eventBus: this.core.eventBus,
                stateManager: this.core.stateManager
            });
            
            // ================================================================
            // PHASE 6: Use Cases
            // ================================================================
            console.log('📦 [Dashboard Phase 6] Use cases...');
            
            this.dashboard.leadDisplayUseCase = new LeadDisplayUseCase();
            await this.dashboard.leadDisplayUseCase.initialize({
                leadService: this.dashboard.leadService,
                modalManager: this.dashboard.modalManager,
                stateManager: this.core.stateManager
            });
            
            // ================================================================
            // FINALIZATION
            // ================================================================
            
            this.initialized = true;
            const duration = (performance.now() - startTime).toFixed(0);
            
            console.log(`✅ [DashboardInitializer] Complete in ${duration}ms`);
            console.log('📊 [DashboardInitializer] Components initialized:', Object.keys(this.dashboard).length);
            
            // Expose on window for backwards compatibility (onclick handlers, etc.)
            this._exposeOnWindow();
            
            return this.dashboard;
            
        } catch (error) {
            console.error('❌ [DashboardInitializer] Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Expose dashboard components on window (backwards compatibility)
     * TODO: Remove once all onclick handlers converted to proper event listeners
     */
    _exposeOnWindow() {
        // Expose classes for onclick handlers
        window.LeadService = LeadService;
        window.LeadManager = this.dashboard.leadManager;
        window.ModalManager = this.dashboard.modalManager;
        window.BusinessManager = this.dashboard.businessManager;
        window.StatsCards = this.dashboard.statsCards;
        window.DashboardHeader = this.dashboard.dashboardHeader;
        window.LeadsTable = this.dashboard.leadsTable;
        window.AnalysisQueue = this.dashboard.analysisQueue;
        
        // Store dashboard instance globally
        window.dashboard = this.dashboard;
        
        console.log('✅ [DashboardInitializer] Window globals exposed for backwards compatibility');
    }
}

export default DashboardInitializer;
