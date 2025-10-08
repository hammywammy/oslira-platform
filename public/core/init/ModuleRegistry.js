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
            // HOME PAGE (Marketing Root)
            // =================================================================
home: {
    appClass: 'HomeApp',
    scripts: [
        '/core/ui/components/layouts/AppHeader.js',
        '/core/ui/components/layouts/AppFooter.js',
        '/pages/www/HomeApp.js'  // ✅ CORRECT PATH
    ],
            
            // =================================================================
            // AUTH PAGES
            // =================================================================
            auth: {
                appClass: 'AuthApp',
                scripts: [
                    '/pages/auth/auth-app.js'
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
            // DASHBOARD (Most Complex)
            // =================================================================
            dashboard: {
                appClass: 'DashboardApp',
                scripts: [
                    // Sidebar
                    '/core/ui/components/layouts/AppSidebar.js',
                    
                    // Dashboard core
                    '/pages/dashboard/dashboard-app.js'
                ],
                requiresAuth: true,
                description: 'Main dashboard'
            },
            
            // =================================================================
            // SETTINGS
            // =================================================================
            settings: {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/settings/settings-app.js'
                ],
                requiresAuth: true,
                description: 'Settings page'
            },
            
            'settings-profile': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/settings/settings-app.js'
                ],
                requiresAuth: true,
                description: 'Profile settings'
            },
            
            'settings-account': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/settings/settings-app.js'
                ],
                requiresAuth: true,
                description: 'Account settings'
            },
            
            'settings-billing': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/settings/settings-app.js'
                ],
                requiresAuth: true,
                description: 'Billing settings'
            },
            
            'settings-usage': {
                appClass: 'SettingsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/settings/settings-app.js'
                ],
                requiresAuth: true,
                description: 'Usage settings'
            },
            
            // =================================================================
            // ONBOARDING
            // =================================================================
            onboarding: {
                appClass: 'OnboardingApp',
                scripts: [
                    '/pages/onboarding/onboarding-app.js'
                ],
                requiresAuth: true,
                description: 'User onboarding flow'
            },
            
            // =================================================================
            // ADMIN
            // =================================================================
            admin: {
                appClass: 'AdminApp',
                scripts: [
                    '/core/ui/components/layouts/AdminSidebar.js',
                    '/pages/admin/admin-app.js'
                ],
                requiresAuth: true,
                description: 'Admin panel'
            },
            
            // =================================================================
            // OTHER APP PAGES
            // =================================================================
            leads: {
                appClass: 'LeadsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/leads/leads-app.js'
                ],
                requiresAuth: true,
                description: 'Lead research page'
            },
            
            analytics: {
                appClass: 'AnalyticsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/analytics/analytics-app.js'
                ],
                requiresAuth: true,
                description: 'Analytics page'
            },
            
            campaigns: {
                appClass: 'CampaignsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/campaigns/campaigns-app.js'
                ],
                requiresAuth: true,
                description: 'Campaigns page'
            },
            
            automations: {
                appClass: 'AutomationsApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/automations/automations-app.js'
                ],
                requiresAuth: true,
                description: 'Automations page'
            },
            
            subscription: {
                appClass: 'SubscriptionApp',
                scripts: [
                    '/core/ui/components/layouts/AppSidebar.js',
                    '/pages/subscription/subscription-app.js'
                ],
                requiresAuth: true,
                description: 'Subscription management'
            },
            
            // =================================================================
            // PUBLIC PAGES
            // =================================================================
            about: {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/static/static-app.js'
                ],
                requiresAuth: false,
                description: 'About page'
            },
            
            pricing: {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/static/static-app.js'
                ],
                requiresAuth: false,
                description: 'Pricing page'
            },
            
            'security-page': {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/static/static-app.js'
                ],
                requiresAuth: false,
                description: 'Security page'
            },
            
            help: {
                appClass: 'StaticPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/static/static-app.js'
                ],
                requiresAuth: false,
                description: 'Help center'
            },
            
            // =================================================================
            // LEGAL PAGES
            // =================================================================
            terms: {
                appClass: 'LegalPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/legal/legal-app.js'
                ],
                requiresAuth: false,
                description: 'Terms of service'
            },
            
            privacy: {
                appClass: 'LegalPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/legal/legal-app.js'
                ],
                requiresAuth: false,
                description: 'Privacy policy'
            },
            
            refund: {
                appClass: 'LegalPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/legal/legal-app.js'
                ],
                requiresAuth: false,
                description: 'Refund policy'
            },
            
            disclaimer: {
                appClass: 'LegalPageApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/legal/legal-app.js'
                ],
                requiresAuth: false,
                description: 'Disclaimer'
            },
            
            // =================================================================
            // CONTACT PAGES
            // =================================================================
            'contact-hub': {
                appClass: 'ContactApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/contact/contact-app.js'
                ],
                requiresAuth: false,
                description: 'Contact hub'
            },
            
            'contact-support': {
                appClass: 'ContactApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/contact/contact-app.js'
                ],
                requiresAuth: false,
                description: 'Support contact'
            },
            
            // =================================================================
            // STATUS PAGE
            // =================================================================
            status: {
                appClass: 'StatusApp',
                scripts: [
                    '/core/ui/components/layouts/AppHeader.js',
                    '/core/ui/components/layouts/AppFooter.js',
                    '/pages/status/status-app.js'
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
