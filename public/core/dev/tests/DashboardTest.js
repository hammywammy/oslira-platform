// =============================================================================
// DASHBOARD TEST - Dashboard Page Diagnostics
// Path: /public/core/dev/tests/DashboardTest.js
// =============================================================================

class DashboardTest {
    constructor() {
        this.results = [];
    }
    
    async run() {
        // Test DashboardApp
        if (!window.dashboard) {
            this.fail('DashboardApp not loaded', 'Check /pages/app/dashboard/core/DashboardApp.js');
            return this.results;
        }
        
        this.pass('DashboardApp loaded');
        
        // Test initialization
        this.testInitialization();
        
        // Test components
        this.testComponents();
        
        // Test modals
        this.testModals();
        
        // Test global functions
        this.testGlobalFunctions();
        
        // Test dependencies
        this.testDependencies();
        
        return this.results;
    }
    
    // =========================================================================
    // TESTS
    // =========================================================================
    
    testInitialization() {
        const app = window.dashboard;
        
        if (app.initialized) {
            this.pass('DashboardApp initialized');
        } else {
            this.fail('DashboardApp not initialized', 'Check DashboardApp.init() completion');
        }
    }
    
    testComponents() {
        const components = {
            'leadManager': 'Lead management system',
            'modalManager': 'Modal system',
            'businessManager': 'Business profiles',
            'header': 'Dashboard header',
            'sidebar': 'Sidebar navigation'
        };
        
        Object.entries(components).forEach(([key, description]) => {
            if (window.dashboard.components?.[key]) {
                this.pass(`${description} loaded`);
            } else {
                this.warn(`${description} not loaded`);
            }
        });
    }
    
    testModals() {
        const modals = {
            'researchModal': 'Research lead modal',
            'bulkModal': 'Bulk upload modal'
        };
        
        Object.entries(modals).forEach(([id, description]) => {
            const modal = document.getElementById(id);
            
            if (!modal) {
                this.fail(`${description} not in DOM`, 
                         'Check DashboardApp.initializeModals()');
                return;
            }
            
            const hasContent = modal.innerHTML.trim().length > 100;
            if (hasContent) {
                this.pass(`${description} rendered`);
            } else {
                this.fail(`${description} is empty`, 
                         `Check modal ${id} rendering`);
            }
        });
    }
    
    testGlobalFunctions() {
        const functions = {
            'openResearchModal': 'Open research modal',
            'openBulkModal': 'Open bulk modal',
            'submitResearch': 'Submit research form',
            'handleDropdownSelection': 'Mode dropdown handler'
        };
        
        Object.entries(functions).forEach(([fn, description]) => {
            if (typeof window[fn] === 'function') {
                this.pass(`${description} available`);
            } else {
                this.fail(`${description} missing`, 
                         'Check DashboardApp.exposePublicAPI()');
            }
        });
    }
    
    testDependencies() {
        // Test ResearchHandlers
        if (window.ResearchHandlers) {
            this.pass('ResearchHandlers loaded');
            
            // Test if it uses correct ApiClient
            const rh = new window.ResearchHandlers();
            if (rh.osliraAPI === window.OsliraApiClient) {
                this.pass('ResearchHandlers uses correct ApiClient');
            } else if (!rh.osliraAPI) {
                this.fail('ResearchHandlers.osliraAPI is undefined',
                         'Fix: Change constructor line to: this.osliraAPI = window.OsliraApiClient');
            } else {
                this.fail('ResearchHandlers uses wrong ApiClient reference',
                         'Fix: Change window.OsliraAPI to window.OsliraApiClient');
            }
        } else {
            this.warn('ResearchHandlers not loaded');
        }
        
        // Test LeadManager
        if (window.leadManagerInstance || window.dashboard.components?.leadManager) {
            this.pass('LeadManager instance available');
        } else {
            this.warn('LeadManager instance not found');
        }
        
        // Test ModalManager
        if (window.modalManagerInstance || window.dashboard.components?.modalManager) {
            this.pass('ModalManager instance available');
        } else {
            this.warn('ModalManager instance not found');
        }
    }
    
    // =========================================================================
    // HELPERS
    // =========================================================================
    
    pass(message) {
        this.results.push({ status: 'PASS', message });
    }
    
    fail(message, fix) {
        this.results.push({ status: 'FAIL', message, fix });
    }
    
    warn(message) {
        this.results.push({ status: 'WARN', message });
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.DashboardTest = DashboardTest;

console.log('✅ [DashboardTest] Loaded');
