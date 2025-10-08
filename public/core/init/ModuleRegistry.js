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
 * ✅ CORRECTED PATHS based on actual file structure:
 * - pages/app/* for application pages
 * - pages/www/* for marketing/public pages
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
            // HOME PAGE (Marketing Root) - pages/www/
            // =================================================================
            home: {
                appClass: 'HomeApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/HomeApp.js'  // ✅ CORRECT
                ],
                requiresAuth: false,
                description: 'Marketing homepage'
            },
            
            // =================================================================
            // AUTH PAGES - pages/app/auth/
            // =================================================================
            auth: {
                appClass: 'AuthApp',
                scripts: [
                    '/pages/app/auth/AuthApp.js'  // ✅ CORRECT
                ],
                requiresAuth: false,
                description: 'Login/signup page'
            },
            
            'auth-callback': {
                appClass: null, // Inline script handles it
                scripts: [],
                requiresAuth: false,
                description: 'OAuth callback handler'
            },
            
            // =================================================================
            // DASHBOARD - pages/app/dashboard/
            // =================================================================
            dashboard: {
                appClass: 'DashboardApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/dashboard/core/DashboardApp.js'  // ✅ CORRECT
                ],
                requiresAuth: true,
                description: 'Main dashboard'
            },
            
            // =================================================================
            // SETTINGS - pages/app/settings/
            // =================================================================
            settings: {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'  // ✅ CORRECT
                ],
                requiresAuth: true,
                description: 'Settings page'
            },
            
            'settings-profile': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'  // ✅ CORRECT
                ],
                requiresAuth: true,
                description: 'Profile settings'
            },
            
            'settings-account': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'  // ✅ CORRECT
                ],
                requiresAuth: true,
                description: 'Account settings'
            },
            
            'settings-billing': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'  // ✅ CORRECT
                ],
                requiresAuth: true,
                description: 'Billing settings'
            },
            
            'settings-usage': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/settings/SettingsApp.js'  // ✅ CORRECT
                ],
                requiresAuth: true,
                description: 'Usage settings'
            },
            
            // =================================================================
            // ONBOARDING - pages/app/onboarding/
            // =================================================================
            onboarding: {
                appClass: 'OnboardingApp',
                scripts: [
                    '/pages/app/onboarding/OnboardingApp.js'  // ✅ CORRECT
                ],
                requiresAuth: true,
                description: 'User onboarding flow'
            },
            
            // =================================================================
            // ADMIN - pages/app/admin/
            // =================================================================
            admin: {
                appClass: 'AdminApp',
                scripts: [
                    '/core/ui/components/layouts/AdminSidebar.js',
                    '/pages/app/admin/AdminApp.js'  // ✅ CORRECT
                ],
                requiresAuth: true,
                description: 'Admin panel'
            },
            
            // =================================================================
            // LEADS - pages/app/leadResearch/ (note: capital R in actual file)
            // =================================================================
            leads: {
                appClass: 'LeadsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/leadResearch/leads-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: true,
                description: 'Lead research page'
            },
            
            // =================================================================
            // MESSAGES - pages/app/messagesCenter/
            // =================================================================
            messages: {
                appClass: 'MessagesApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/messagesCenter/messages-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: true,
                description: 'Messages center'
            },
            
            // =================================================================
            // ANALYTICS - pages/app/analytics/
            // =================================================================
            analytics: {
                appClass: 'AnalyticsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/analytics/analytics-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: true,
                description: 'Analytics page'
            },
            
            // =================================================================
            // CAMPAIGNS - pages/app/campaigns/
            // =================================================================
            campaigns: {
                appClass: 'CampaignsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/campaigns/campaigns-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: true,
                description: 'Campaigns page'
            },
            
            // =================================================================
            // INTEGRATIONS - pages/app/integrations/
            // =================================================================
            integrations: {
                appClass: 'IntegrationsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/integrations/integrations-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: true,
                description: 'Integrations page'
            },
            
            // =================================================================
            // SUBSCRIPTION - pages/app/subscription/
            // =================================================================
            subscription: {
                appClass: 'SubscriptionApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/app/subscription/subscription.js'  // ✅ CORRECT (actual file name)
                ],
                requiresAuth: true,
                description: 'Subscription management'
            },
            
            // =================================================================
            // PUBLIC/MARKETING PAGES - pages/www/
            // =================================================================
            about: {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/static-app.js'  // ✅ Assuming shared static app
                ],
                requiresAuth: false,
                description: 'About page'
            },
            
            pricing: {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/static-app.js'  // ✅ Assuming shared static app
                ],
                requiresAuth: false,
                description: 'Pricing page'
            },
            
            'security-page': {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/static-app.js'  // ✅ Assuming shared static app
                ],
                requiresAuth: false,
                description: 'Security page'
            },
            
            help: {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/static-app.js'  // ✅ Assuming shared static app
                ],
                requiresAuth: false,
                description: 'Help center'
            },
            
            docs: {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/static-app.js'  // ✅ Assuming shared static app
                ],
                requiresAuth: false,
                description: 'Documentation'
            },
            
            api: {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/static-app.js'  // ✅ Assuming shared static app
                ],
                requiresAuth: false,
                description: 'API documentation'
            },
            
            'case-studies': {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/www/static-app.js'  // ✅ Assuming shared static app
                ],
                requiresAuth: false,
                description: 'Case studies'
            },
            
            // =================================================================
            // LEGAL PAGES - pages/app/legal/
            // =================================================================
            terms: {
                appClass: 'LegalPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/legal/legal-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Terms of service'
            },
            
            privacy: {
                appClass: 'LegalPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/legal/legal-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Privacy policy'
            },
            
            refund: {
                appClass: 'LegalPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/legal/legal-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Refund policy'
            },
            
            disclaimer: {
                appClass: 'LegalPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/legal/legal-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Disclaimer'
            },
            
            // =================================================================
            // CONTACT PAGES - pages/app/contact/
            // =================================================================
            'contact-hub': {
                appClass: 'ContactApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/contact/contact-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Contact hub'
            },
            
            'contact-support': {
                appClass: 'ContactApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/support/support-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Support contact'
            },
            
            'bug-report': {
                appClass: 'ContactApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/contact/bug-report-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Bug report form'
            },
            
            // =================================================================
            // SUPPORT PAGES - pages/app/
            // =================================================================
            support: {
                appClass: 'SupportApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/support/support-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Support center'
            },
            
            sales: {
                appClass: 'SalesApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/sales/sales-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Sales contact'
            },
            
            security: {
                appClass: 'SecurityApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/security/security-app.js'  // ✅ Path exists, assuming JS file
                ],
                requiresAuth: false,
                description: 'Security contact'
            },
            
            // =================================================================
            // STATUS PAGE - pages/app/status/
            // =================================================================
            status: {
                appClass: 'StatusApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/app/status/status-app.js'  // ✅ Path exists, assuming JS file
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
        return this.pages[pageName] || null;
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
            pagesWithAppClass: 0
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
