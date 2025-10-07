/**
 * MODULE REGISTRY - Page/Component Definitions
 * Single source of truth for script dependencies
 * 
 * Responsibilities:
 * - Define all pages in the system
 * - List required scripts for each page
 * - Provide lookup methods
 * 
 * Does NOT:
 * - Load anything
 * - Initialize anything
 * - Validate dependencies (just declares them)
 */

class OsliraModuleRegistry {
    constructor() {
        this.pages = this.initializePages();
        console.log('📋 [Registry] Initialized with', Object.keys(this.pages).length, 'pages');
    }
    
    initializePages() {
        return {
            // ═══════════════════════════════════════════════════
            // DASHBOARD (Most Complex)
            // ═══════════════════════════════════════════════════
            dashboard: {
                appClass: 'DashboardApp',
                scripts: [
                    // Core infrastructure
                    '/core/api-client.js',
                    '/core/sidebar/sidebar-manager.js',
                    
                    // Dashboard core
                    '/pages/dashboard/modules/core/DashboardCore.js',
                    '/pages/dashboard/modules/core/DashboardErrorSystem.js',
                    '/pages/dashboard/modules/core/DashboardEventSystem.js',
                    '/pages/dashboard/modules/core/dashboard-app.js',
                    '/pages/dashboard/modules/core/dependency-container.js',
                    '/pages/dashboard/modules/core/event-bus.js',
                    '/pages/dashboard/modules/core/state-manager.js',
                    
                    // Modal system
                    '/pages/dashboard/modules/modals/components/tab-system.js',
                    '/pages/dashboard/modules/modals/components/modal-components-core.js',
                    '/pages/dashboard/modules/modals/components/modal-components-deep.js',
                    '/pages/dashboard/modules/modals/components/modal-components-xray.js',
                    '/pages/dashboard/modules/modals/components/modal-components-personality.js',
                    '/pages/dashboard/modules/modals/configs/analysis-configs.js',
                    '/pages/dashboard/modules/modals/modal-builder.js',
                    
                    // Analysis system
                    '/pages/dashboard/modules/analysis/analysis-functions.js',
                    '/pages/dashboard/modules/analysis/analysis-modal.js',
                    '/pages/dashboard/modules/analysis/analysis-queue-styles.js',
                    '/pages/dashboard/modules/analysis/analysis-queue-renderer.js',
                    '/pages/dashboard/modules/analysis/analysis-queue-animator.js',
                    '/pages/dashboard/modules/analysis/analysis-queue.js',
                    
                    // Business logic modules
                    '/pages/dashboard/modules/bulk/bulk-upload.js',
                    '/pages/dashboard/modules/business/business-manager.js',
                    '/pages/dashboard/modules/handlers/lead-analysis-handlers.js',
                    '/pages/dashboard/modules/handlers/research-handlers.js',
                    '/pages/dashboard/modules/leads/lead-manager.js',
                    '/pages/dashboard/modules/leads/lead-renderer.js',
                    '/pages/dashboard/modules/realtime/realtime-manager.js',
                    '/pages/dashboard/modules/stats/stats-calculator.js',
                    
                    // UI modules
                    '/pages/dashboard/modules/ui/filter-modal.js',
                    '/pages/dashboard/modules/modals/research-modal.js',
                    '/pages/dashboard/modules/modals/bulk-modal.js',
                    '/pages/dashboard/modules/ui/icon-components.js',
                    '/pages/dashboard/modules/ui/stats-cards.js',
                    '/pages/dashboard/modules/ui/dashboard-header.js',
                    '/pages/dashboard/modules/ui/dashboard-styles.js',
                    '/pages/dashboard/modules/ui/insights-panel.js',
                    '/pages/dashboard/modules/ui/leads-table.js',
                    '/pages/dashboard/modules/ui/modal-manager.js',
                    '/pages/dashboard/modules/ui/tip-of-day.js',
                    
                    // Utils
                    '/pages/dashboard/modules/utils/dashboard-greetings.js',
                    '/pages/dashboard/modules/utils/daily-tips.js',
                    
                    // Orchestrator (MUST BE LAST)
                    '/pages/dashboard/dashboard.js'
                ],
                requiresAuth: true
            },
            
            // ═══════════════════════════════════════════════════
            // HOME PAGE (Simple)
            // ═══════════════════════════════════════════════════
            home: {
                appClass: 'HomeApp',
                scripts: [
                    '/core/header/header-manager.js',
                    '/core/footer/footer-manager.js',
                    '/pages/home/homeHandlers.js',
                    '/pages/home/home.js'
                ],
                requiresAuth: false
            },
            
            // ═══════════════════════════════════════════════════
            // AUTH PAGE (Simplest)
            // ═══════════════════════════════════════════════════
home: {
    appClass: 'HomeApp',
    scripts: [
        // header-manager already loaded inline in HTML
        '/core/footer/footer-manager.js',
        '/pages/home/homeHandlers.js',
        '/pages/home/home-app.js'  // ← NEW FILE
    ],
    requiresAuth: false
},
            
            // ═══════════════════════════════════════════════════
            // ONBOARDING
            // ═══════════════════════════════════════════════════
            onboarding: {
                appClass: 'OnboardingApp',
                scripts: [
                    '/core/api-client.js',
                    '/core/form-manager.js',
                    '/pages/onboarding/onboarding-rules.js',
                    '/pages/onboarding/onboarding-validator.js',
                    '/pages/onboarding/onboarding.js'
                ],
                requiresAuth: true
            },
            
            // ═══════════════════════════════════════════════════
            // ADMIN
            // ═══════════════════════════════════════════════════
            admin: {
                appClass: 'AdminApp',
                scripts: [
                    '/core/api-client.js',
                    '/core/adminsidebar/sidebar-manager.js',
                    '/pages/admin/sections/overview-section.js',
                    '/pages/admin/sections/users-section.js',
                    '/pages/admin/sections/businesses-section.js',
                    '/pages/admin/sections/revenue-section.js',
                    '/pages/admin/sections/remaining-sections.js',
                    '/pages/admin/admin.js'
                ],
                requiresAuth: false // Has its own password auth
            },
            
            // ═══════════════════════════════════════════════════
            // SETTINGS
            // ═══════════════════════════════════════════════════
            settings: {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/sidebar/sidebar-manager.js',
                    '/pages/settings/settings-nav.js'
                ],
                requiresAuth: true
            },
            
            'settings-profile': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/sidebar/sidebar-manager.js',
                    '/pages/settings/settings-nav.js'
                ],
                requiresAuth: true
            },
            
            'settings-account': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/sidebar/sidebar-manager.js',
                    '/pages/settings/settings-nav.js'
                ],
                requiresAuth: true
            },
            
            'settings-billing': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/sidebar/sidebar-manager.js',
                    '/pages/settings/settings-nav.js'
                ],
                requiresAuth: true
            },
            
            'settings-usage': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/sidebar/sidebar-manager.js',
                    '/pages/settings/settings-nav.js'
                ],
                requiresAuth: true
            }
        };
    }
    
    // ═══════════════════════════════════════════════════════════
    // LOOKUP METHODS
    // ═══════════════════════════════════════════════════════════
    
    getPageConfig(pageName) {
        return this.pages[pageName] || null;
    }
    
    getPageScripts(pageName) {
        const config = this.getPageConfig(pageName);
        return config ? config.scripts : [];
    }
    
    getPageAppClass(pageName) {
        const config = this.getPageConfig(pageName);
        return config ? config.appClass : null;
    }
    
    requiresAuth(pageName) {
        const config = this.getPageConfig(pageName);
        return config ? config.requiresAuth : false;
    }
    
    getAllPages() {
        return Object.keys(this.pages);
    }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL EXPORT
// ═══════════════════════════════════════════════════════════
window.OsliraRegistry = new OsliraModuleRegistry();
console.log('✅ [Registry] Module loaded and ready');
