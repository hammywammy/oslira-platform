// =============================================================================
// MODULE REGISTRY - Page Script Definitions (Init Layer)
// Path: /public/core/init/ModuleRegistry.js
// Dependencies: None (pure configuration)
// =============================================================================
 
/**
 * @class ModuleRegistry
 * @description Defines which scripts to load for each page
 * 
 * This is the SINGLE SOURCE OF TRUTH for page-script mapping.
 * Bootstrap uses this to know what to load.
 * 
 * ✅ ONLY INCLUDES ACTUAL FILES - No assumptions, no placeholders
 */
class ModuleRegistry {
    constructor() {
        this.pages = this.initializePages();
        
        console.log('📋 [ModuleRegistry] Initialized with', Object.keys(this.pages).length, 'pages');
    }
    
    // =========================================================================
    // PAGE DEFINITIONS
    // =========================================================================
    
    initializePages() {
        return {
            // =================================================================
            // HOME PAGE (Marketing Root) - HAS JS
            // =================================================================
            home: {
                appClass: 'HomeApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/HomeApp.js'
                ],
                requiresAuth: false,
                description: 'Marketing homepage'
            },
            
// =================================================================
// AUTH PAGES - Google OAuth Authentication
// =================================================================
auth: {
    appClass: 'AuthApp',
    scripts: [
        '/core/auth/AuthManager.js',      // Phase 2 - Core auth service
        '/pages/auth/AuthApp.js'          // Phase 3 - Page controller
    ],
    requiresAuth: false,
    description: 'Google OAuth sign-in page'
},

'auth-callback': {
    appClass: 'AuthCallbackApp',
    scripts: [
        '/core/auth/AuthManager.js',      // Phase 2 - Core auth service
        '/pages/auth/AuthCallbackApp.js'  // Phase 3 - Callback handler
    ],
    requiresAuth: false,
    description: 'OAuth callback processor'
},


// =============================================================================
// MODULE REGISTRY - UPDATED FOR 5-FILE REFACTORING
// Path: /public/core/init/ModuleRegistry.js
// =============================================================================

dashboard: {
    appClass: 'DashboardApp',
    scripts: [
        // ============================================================
        // PHASE 0: DEPENDENCY INJECTION SYSTEM
        // ============================================================
        '/core/di/ServiceRegistry.js',
        '/core/di/Container.js',
        
        // ============================================================
        // PHASE 1: INFRASTRUCTURE
        // ============================================================
        '/core/ui/components/tooltip/TooltipManager.js',
        
        // ============================================================
        // PHASE 2: DASHBOARD CORE APP
        // ============================================================
        '/pages/app/dashboard/core/DashboardApp.js',
        
        // ============================================================
        // PHASE 3: NEW - DOMAIN SERVICES (BUSINESS LOGIC)
        // ============================================================
        '/pages/app/dashboard/domain/leads/LeadService.js',  // ✅ ADD THIS
        '/pages/app/dashboard/domain/leads/LeadValidation.js',  // ✅ ADD THIS
        
        // ============================================================
        // PHASE 4: UI COMPONENTS (MUST BE BEFORE ANYTHING THAT USES THEM)
        // ============================================================
        '/pages/app/dashboard/ui/components/IconComponents.js',
        '/pages/app/dashboard/ui/components/LeadsTable.js',
        '/pages/app/dashboard/ui/components/LeadsTableRenderer.js',  // ✅ ADD THIS (NEW RENDERER)
        
        // ============================================================
        // PHASE 5: INFRASTRUCTURE
        // ============================================================
        '/pages/app/dashboard/infrastructure/RealtimeManager.js',
        
        // ============================================================
        // PHASE 6: DOMAIN - RENDERING 
        // ============================================================
        '/pages/app/dashboard/ui/components/InsightsPanel.js',
        
        // ============================================================
        // PHASE 7: NEW - APPLICATION LAYER (USE CASES)
        // ============================================================
        '/pages/app/dashboard/application/leads/LeadDisplayUseCase.js',  // ✅ ADD THIS
        '/pages/app/dashboard/application/analysis/AnalyzeLeadUseCase.js',  // ✅ ADD THIS
        
        // ============================================================
        // PHASE 8: DOMAIN - ANALYSIS
        // ============================================================
        '/pages/app/dashboard/domain/analysis/AnalysisFunctions.js',
        
        // ============================================================
        // PHASE 9: UI MODALS - PERSONALITY COMPONENTS
        // ============================================================
        '/pages/app/dashboard/ui/modals/components/ModalComponentsPersonality.js',
        
        // ============================================================
        // PHASE 10: MODALS - CONFIGURATIONS
        // ============================================================
        '/pages/app/dashboard/ui/modals/configs/ResearchModal.js',  // ✅ ALREADY EXISTS - UPDATED
        '/pages/app/dashboard/ui/modals/configs/AnalysisConfig.js',
        
        // ============================================================
        // PHASE 11: UI MODALS - XRAY COMPONENTS
        // ============================================================
        '/pages/app/dashboard/ui/modals/components/ModalComponentsXray.js',
        
        // ============================================================
        // PHASE 12: DOMAIN - STATS
        // ============================================================
        '/pages/app/dashboard/domain/stats/StatsCalculator.js',
        
        
        // ============================================================
        // PHASE 14: ANALYSIS SYSTEM - QUEUE
        // ============================================================
        '/pages/app/dashboard/domain/analysis/AnalysisQueueRenderer.js',
        '/pages/app/dashboard/ui/components/TipOfDay.js',
        '/pages/app/dashboard/shared/DailyTips.js',
        '/pages/app/dashboard/ui/modals/FilterModal.js',
        '/pages/app/dashboard/domain/analysis/AnalysisQueue.js',
        '/pages/app/dashboard/domain/analysis/AnalysisQueueAnimator.js',
        
        // ============================================================
        // PHASE 15: UI MODALS - DEEP COMPONENTS
        // ============================================================
        '/pages/app/dashboard/ui/modals/components/ModalComponentsDeep.js',
        
        // ============================================================
        // PHASE 16: DOMAIN - LEADS (UPDATED)
        // ============================================================
        '/pages/app/dashboard/domain/leads/LeadManager.js',  // ✅ MODIFIED - Now uses LeadsAPI
        
        // ============================================================
        // PHASE 17: UI MODALS - TAB SYSTEM
        // ============================================================
        '/pages/app/dashboard/ui/modals/TabSystem.js',
        
        // ============================================================
        // PHASE 18: UI MODALS - MODAL MANAGER
        // ============================================================
        '/pages/app/dashboard/ui/modals/ModalManager.js',
        '/pages/app/dashboard/ui/modals/ModalBuilder.js',
        
        // ============================================================
        // PHASE 19: UI COMPONENTS - STATS & BULK
        // ============================================================
        '/pages/app/dashboard/ui/components/StatsCards.js',
        '/pages/app/dashboard/domain/bulk/BulkUpload.js',
        '/pages/app/dashboard/ui/modals/configs/BulkModal.js',
        
        // ============================================================
        // PHASE 20: UI MODALS - CORE COMPONENTS
        // ============================================================
        '/pages/app/dashboard/ui/modals/components/ModalComponentsCore.js',
        
        // ============================================================
        // PHASE 21: UI COMPONENTS - HEADER
        // ============================================================
        '/pages/app/dashboard/ui/components/DashboardHeader.js',
        
        // ============================================================
        // PHASE 22: DOMAIN - BUSINESS
        // ============================================================
        '/pages/app/dashboard/domain/business/BusinessManager.js',
        
        // ============================================================
        // PHASE 23: SHARED COMPONENTS (Sidebar)
        // ============================================================
        '/core/ui/components/layouts/app-sidebar/AppSidebar.js',
        
        // ============================================================
        // PHASE 24: EVENT SYSTEM (MUST BE LAST FOR MAIN FILES)
        // ============================================================
        '/pages/app/dashboard/core/DashboardEventSystem.js', 

                
        // ============================================================
        // PHASE 99: DEVCONSOLE (Load last)
        // ============================================================
        '/core/dev/tests/DashboardTest.js',
        '/core/dev/DevConsole.js'
    ],
    requiresAuth: true,
    description: 'Lead research dashboard'
},
            
            // =================================================================
            // SETTINGS - HAS JS
            // =================================================================
            settings: {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'
                ],
                requiresAuth: true,
                description: 'Settings page'
            },
            
            'settings-profile': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'
                ],
                requiresAuth: true,
                description: 'Profile settings'
            },
            
            'settings-account': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'
                ],
                requiresAuth: true,
                description: 'Account settings'
            },
            
            'settings-billing': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'
                ],
                requiresAuth: true,
                description: 'Billing settings'
            },
            
            'settings-usage': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'
                ],
                requiresAuth: true,
                description: 'Usage settings'
            },
            
            // =================================================================
            // ONBOARDING - HAS JS
            // =================================================================
onboarding: {
    appClass: 'OnboardingApp',
    scripts: [
        '/pages/app/onboarding/OnboardingRules.js',      // ← ADD THIS
        '/pages/app/onboarding/OnboardingValidator.js',  // ← ADD THIS
        '/pages/app/onboarding/OnboardingApp.js'         // ← Keep this last
    ],
    requiresAuth: true,
    description: 'User onboarding flow'
},
            
            // =================================================================
            // ADMIN - HAS JS
            // =================================================================
            admin: {
                appClass: 'AdminApp',
                scripts: [
                    '/core/ui/components/layouts/AdminSidebar.js',
                    '/pages/app/admin/AdminApp.js'
                ],
                requiresAuth: true,
                description: 'Admin panel'
            },
            
            // =================================================================
            // SUBSCRIPTION - HAS JS
            // =================================================================
            subscription: {
                appClass: 'SubscriptionApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/subscription/subscription.js'
                ],
                requiresAuth: true,
                description: 'Subscription management'
            },
            
            // =================================================================
            // HTML-ONLY PAGES (No JS app files exist)
            // Inline scripts in HTML handle initialization
            // =================================================================
            
            // LEADS - HTML only
            leads: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js'
                ],
                requiresAuth: true,
                description: 'Lead research page'
            },
            
            // MESSAGES - HTML only
            messages: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js'
                ],
                requiresAuth: true,
                description: 'Messages center'
            },
            
            // ANALYTICS - HTML only
            analytics: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js'
                ],
                requiresAuth: true,
                description: 'Analytics page'
            },
            
            // CAMPAIGNS - HTML only
            campaigns: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js'
                ],
                requiresAuth: true,
                description: 'Campaigns page'
            },
            
            // INTEGRATIONS - HTML only
            integrations: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js'
                ],
                requiresAuth: true,
                description: 'Integrations page'
            },
            
            // =================================================================
            // PUBLIC/MARKETING PAGES - HTML only
            // =================================================================
            about: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'About page'
            },
            
            pricing: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Pricing page'
            },
            
            'security-page': {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Security page'
            },
            
            help: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Help center'
            },
            
            docs: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Documentation'
            },
            
            api: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'API documentation'
            },
            
            'case-studies': {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Case studies'
            },
            
            // =================================================================
            // LEGAL PAGES - HTML only
            // =================================================================
            terms: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Terms of service'
            },
            
            privacy: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Privacy policy'
            },
            
            refund: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Refund policy'
            },
            
            disclaimer: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Disclaimer'
            },
            
            // =================================================================
            // CONTACT PAGES - HTML only
            // =================================================================
            'contact-hub': {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Contact hub'
            },
            
            'bug-report': {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Bug report form'
            },
            
            // =================================================================
            // SUPPORT PAGES - HTML only
            // =================================================================
            support: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Support center'
            },
            
            sales: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Sales contact'
            },
            
            security: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'Security contact'
            },
            
            // =================================================================
            // STATUS PAGE - HTML only
            // =================================================================
            status: {
                appClass: null,
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js'
                ],
                requiresAuth: false,
                description: 'System status'
            }
        };
    }
    
    // =========================================================================
    // LOOKUP METHODS
    // =========================================================================
    
    /**
     * Get page configuration
     */
getPageConfig(pageName) {
    const config = this.pages[pageName];
    
    if (!config) {
        console.warn(`⚠️ [ModuleRegistry] No config found for page: ${pageName}`);
        return null;
    }
    
    // Return copy with guaranteed scripts array
    return {
        ...config,
        scripts: config.scripts || []
    };
}
    
    /**
     * Get scripts for a page
     */
    getPageScripts(pageName) {
        const config = this.getPageConfig(pageName);
        return config ? config.scripts : [];
    }
    
    /**
     * Get app class for a page
     */
    getPageAppClass(pageName) {
        const config = this.getPageConfig(pageName);
        return config ? config.appClass : null;
    }
    
    /**
     * Check if page requires auth
     */
    requiresAuth(pageName) {
        const config = this.getPageConfig(pageName);
        return config ? config.requiresAuth : false;
    }
    
    /**
     * Get all page names
     */
    getAllPages() {
        return Object.keys(this.pages);
    }
    
    /**
     * Check if page exists
     */
    hasPage(pageName) {
        return pageName in this.pages;
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate registry
     */
    validate() {
        const errors = [];
        
        for (const [pageName, config] of Object.entries(this.pages)) {
            // Check required fields
            if (config.appClass === undefined) {
                errors.push(`Page ${pageName}: missing appClass`);
            }
            
            if (!Array.isArray(config.scripts)) {
                errors.push(`Page ${pageName}: scripts must be an array`);
            }
            
            if (config.requiresAuth === undefined) {
                errors.push(`Page ${pageName}: missing requiresAuth`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get statistics
     */
    getStats() {
        const stats = {
            totalPages: Object.keys(this.pages).length,
            authRequired: 0,
            publicPages: 0,
            totalScripts: 0,
            pagesWithAppClass: 0,
            htmlOnlyPages: 0
        };
        
        for (const config of Object.values(this.pages)) {
            if (config.requiresAuth) {
                stats.authRequired++;
            } else {
                stats.publicPages++;
            }
            
            stats.totalScripts += config.scripts.length;
            
            if (config.appClass) {
                stats.pagesWithAppClass++;
            } else {
                stats.htmlOnlyPages++;
            }
        }
        
        return stats;
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            stats: this.getStats(),
            validation: this.validate(),
            pages: Object.keys(this.pages)
        };
    }
    
    /**
     * Print debug info
     */
    debug() {
        console.group('📋 [ModuleRegistry] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Validation:', this.validate());
        console.log('Pages:', Object.keys(this.pages));
        console.groupEnd();
    }
    
    /**
     * Print page list
     */
    printPages() {
        console.group('📋 [ModuleRegistry] All Pages');
        
        for (const [name, config] of Object.entries(this.pages)) {
            console.log(`${name}:`, {
                appClass: config.appClass,
                scripts: config.scripts.length,
                requiresAuth: config.requiresAuth,
                description: config.description
            });
        }
        
        console.groupEnd();
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraModuleRegistry = new ModuleRegistry();

console.log('✅ [ModuleRegistry] Loaded with', window.OsliraModuleRegistry.getStats().totalPages, 'pages');
