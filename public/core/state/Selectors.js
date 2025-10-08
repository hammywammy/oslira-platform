// =============================================================================
// SELECTORS - Memoized State Selectors
// Path: /public/core/state/Selectors.js
// Dependencies: Store
// =============================================================================

/**
 * @class Selectors
 * @description Memoized pure functions for querying state efficiently
 * 
 * Features:
 * - Memoized selectors (cache results until state changes)
 * - Computed derived state
 * - Performance optimized
 * - No side effects
 */
class Selectors {
    constructor(store) {
        if (!store) {
            throw new Error('[Selectors] Store instance required');
        }
        
        this.store = store;
        this.cache = new Map();
        this.isInitialized = false;
        
        console.log('🔍 [Selectors] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize selectors
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ [Selectors] Already initialized');
            return;
        }
        
        try {
            // Subscribe to state changes to invalidate cache
            this.store.subscribe('*', () => {
                this.invalidateCache();
            });
            
            this.isInitialized = true;
            console.log('✅ [Selectors] Initialized');
            
        } catch (error) {
            console.error('❌ [Selectors] Initialization failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // MEMOIZATION HELPERS
    // =========================================================================
    
    /**
     * Memoize selector result
     */
    memoize(key, fn) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        const result = fn();
        this.cache.set(key, result);
        return result;
    }
    
    /**
     * Invalidate all cached results
     */
    invalidateCache() {
        this.cache.clear();
    }
    
    /**
     * Invalidate specific cache key
     */
    invalidateCacheKey(key) {
        this.cache.delete(key);
    }
    
    // =========================================================================
    // AUTH SELECTORS
    // =========================================================================
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.memoize('auth.user', () => {
            return this.store.getState('auth.user');
        });
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.memoize('auth.isAuthenticated', () => {
            const user = this.store.getState('auth.user');
            return user !== null && user !== undefined;
        });
    }
    
    /**
     * Get user credits
     */
    getUserCredits() {
        return this.memoize('auth.credits', () => {
            const user = this.store.getState('auth.user');
            return user?.credits || 0;
        });
    }
    
    /**
     * Get user plan type
     */
    getUserPlanType() {
        return this.memoize('auth.planType', () => {
            const user = this.store.getState('auth.user');
            return user?.plan_type || 'free';
        });
    }
    
    /**
     * Check if user has active subscription
     */
    hasActiveSubscription() {
        return this.memoize('auth.hasSubscription', () => {
            const user = this.store.getState('auth.user');
            return user?.subscription_status === 'active';
        });
    }
    
    // =========================================================================
    // BUSINESS SELECTORS
    // =========================================================================
    
    /**
     * Get all businesses
     */
    getAllBusinesses() {
        return this.memoize('business.all', () => {
            return this.store.getState('business.all') || [];
        });
    }
    
    /**
     * Get selected business
     */
    getSelectedBusiness() {
        return this.memoize('business.selected', () => {
            return this.store.getState('business.selected');
        });
    }
    
    /**
     * Get selected business ID
     */
    getSelectedBusinessId() {
        return this.memoize('business.selectedId', () => {
            const business = this.store.getState('business.selected');
            return business?.id || null;
        });
    }
    
    /**
     * Check if user has businesses
     */
    hasBusinesses() {
        return this.memoize('business.hasBusinesses', () => {
            const businesses = this.store.getState('business.all') || [];
            return businesses.length > 0;
        });
    }
    
    /**
     * Get business by ID
     */
    getBusinessById(businessId) {
        const cacheKey = `business.byId.${businessId}`;
        return this.memoize(cacheKey, () => {
            const businesses = this.store.getState('business.all') || [];
            return businesses.find(b => b.id === businessId);
        });
    }
    
    // =========================================================================
    // LEAD SELECTORS
    // =========================================================================
    
    /**
     * Get all leads
     */
    getAllLeads() {
        return this.memoize('leads.all', () => {
            return this.store.getState('leads.all') || [];
        });
    }
    
    /**
     * Get filtered leads
     */
    getFilteredLeads() {
        return this.memoize('leads.filtered', () => {
            return this.store.getState('leads.filtered') || [];
        });
    }
    
    /**
     * Get selected leads
     */
    getSelectedLeads() {
        return this.memoize('leads.selected', () => {
            return this.store.getState('leads.selected') || [];
        });
    }
    
    /**
     * Get total lead count
     */
    getTotalLeadCount() {
        return this.memoize('leads.count', () => {
            const leads = this.store.getState('leads.all') || [];
            return leads.length;
        });
    }
    
    /**
     * Get filtered lead count
     */
    getFilteredLeadCount() {
        return this.memoize('leads.filteredCount', () => {
            const leads = this.store.getState('leads.filtered') || [];
            return leads.length;
        });
    }
    
    /**
     * Get selected lead count
     */
    getSelectedLeadCount() {
        return this.memoize('leads.selectedCount', () => {
            const selected = this.store.getState('leads.selected') || [];
            return selected.length;
        });
    }
    
    /**
     * Get lead by ID
     */
    getLeadById(leadId) {
        const cacheKey = `leads.byId.${leadId}`;
        return this.memoize(cacheKey, () => {
            const leads = this.store.getState('leads.all') || [];
            return leads.find(l => l.id === leadId);
        });
    }
    
    /**
     * Get high-quality leads (score >= 70)
     */
    getHighQualityLeads() {
        return this.memoize('leads.highQuality', () => {
            const leads = this.store.getState('leads.all') || [];
            return leads.filter(l => (l.score || 0) >= 70);
        });
    }
    
    /**
     * Get leads by status
     */
    getLeadsByStatus(status) {
        const cacheKey = `leads.byStatus.${status}`;
        return this.memoize(cacheKey, () => {
            const leads = this.store.getState('leads.all') || [];
            return leads.filter(l => l.status === status);
        });
    }
    
    /**
     * Get leads created today
     */
    getLeadsCreatedToday() {
        return this.memoize('leads.createdToday', () => {
            const leads = this.store.getState('leads.all') || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return leads.filter(l => {
                const created = new Date(l.created_at);
                return created >= today;
            });
        });
    }
    
    // =========================================================================
    // ANALYTICS SELECTORS
    // =========================================================================
    
    /**
     * Get analytics stats
     */
    getAnalyticsStats() {
        return this.memoize('analytics.stats', () => {
            return this.store.getState('analytics.stats') || {};
        });
    }
    
    /**
     * Get conversion rate
     */
    getConversionRate() {
        return this.memoize('analytics.conversionRate', () => {
            const stats = this.store.getState('analytics.stats') || {};
            return stats.conversion_rate || 0;
        });
    }
    
    /**
     * Get average lead score
     */
    getAverageLeadScore() {
        return this.memoize('analytics.avgScore', () => {
            const leads = this.store.getState('leads.all') || [];
            if (leads.length === 0) return 0;
            
            const total = leads.reduce((sum, lead) => sum + (lead.score || 0), 0);
            return Math.round(total / leads.length);
        });
    }
    
    /**
     * Get lead quality distribution
     */
    getLeadQualityDistribution() {
        return this.memoize('analytics.qualityDistribution', () => {
            const leads = this.store.getState('leads.all') || [];
            
            const distribution = {
                high: 0,    // 70-100
                medium: 0,  // 40-69
                low: 0      // 0-39
            };
            
            leads.forEach(lead => {
                const score = lead.score || 0;
                if (score >= 70) distribution.high++;
                else if (score >= 40) distribution.medium++;
                else distribution.low++;
            });
            
            return distribution;
        });
    }
    
    // =========================================================================
    // UI SELECTORS
    // =========================================================================
    
    /**
     * Get loading state
     */
    isLoading() {
        return this.memoize('ui.loading', () => {
            return this.store.getState('ui.loading') || false;
        });
    }
    
    /**
     * Get sidebar collapsed state
     */
    isSidebarCollapsed() {
        return this.memoize('ui.sidebarCollapsed', () => {
            return this.store.getState('ui.sidebarCollapsed') || false;
        });
    }
    
    /**
     * Get active modal
     */
    getActiveModal() {
        return this.memoize('ui.activeModal', () => {
            return this.store.getState('ui.activeModal');
        });
    }
    
    /**
     * Get active filters
     */
    getActiveFilters() {
        return this.memoize('ui.filters', () => {
            return this.store.getState('ui.filters') || {};
        });
    }
    
    /**
     * Check if filters are active
     */
    hasActiveFilters() {
        return this.memoize('ui.hasFilters', () => {
            const filters = this.store.getState('ui.filters') || {};
            return Object.keys(filters).length > 0;
        });
    }
    
    // =========================================================================
    // COMPLEX COMPUTED SELECTORS
    // =========================================================================
    
    /**
     * Get dashboard summary
     */
    getDashboardSummary() {
        return this.memoize('computed.dashboardSummary', () => {
            const leads = this.store.getState('leads.all') || [];
            const businesses = this.store.getState('business.all') || [];
            const user = this.store.getState('auth.user');
            
            return {
                totalLeads: leads.length,
                totalBusinesses: businesses.length,
                creditsRemaining: user?.credits || 0,
                highQualityLeads: leads.filter(l => (l.score || 0) >= 70).length,
                leadsCreatedToday: leads.filter(l => {
                    const created = new Date(l.created_at);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return created >= today;
                }).length
            };
        });
    }
    
    /**
     * Get lead statistics
     */
    getLeadStatistics() {
        return this.memoize('computed.leadStats', () => {
            const leads = this.store.getState('leads.all') || [];
            
            if (leads.length === 0) {
                return {
                    total: 0,
                    avgScore: 0,
                    highQuality: 0,
                    mediumQuality: 0,
                    lowQuality: 0,
                    newToday: 0
                };
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let totalScore = 0;
            let highQuality = 0;
            let mediumQuality = 0;
            let lowQuality = 0;
            let newToday = 0;
            
            leads.forEach(lead => {
                const score = lead.score || 0;
                totalScore += score;
                
                if (score >= 70) highQuality++;
                else if (score >= 40) mediumQuality++;
                else lowQuality++;
                
                const created = new Date(lead.created_at);
                if (created >= today) newToday++;
            });
            
            return {
                total: leads.length,
                avgScore: Math.round(totalScore / leads.length),
                highQuality,
                mediumQuality,
                lowQuality,
                newToday
            };
        });
    }
    
    /**
     * Get user permissions
     */
    getUserPermissions() {
        return this.memoize('computed.permissions', () => {
            const user = this.store.getState('auth.user');
            const planType = user?.plan_type || 'free';
            
            return {
                canCreateLeads: true,
                canAnalyzeLeads: planType !== 'free',
                canExportLeads: planType !== 'free',
                canAccessAnalytics: planType !== 'free',
                canManageTeam: planType === 'enterprise',
                maxBusinesses: planType === 'free' ? 1 : (planType === 'pro' ? 5 : Infinity),
                maxLeadsPerMonth: planType === 'free' ? 100 : (planType === 'pro' ? 1000 : Infinity)
            };
        });
    }
    
    // =========================================================================
    // CACHE MANAGEMENT
    // =========================================================================
    
    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }
    
    /**
     * Get cache keys
     */
    getCacheKeys() {
        return Array.from(this.cache.keys());
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🔍 [Selectors] Cache cleared');
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get selector statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            isInitialized: this.isInitialized
        };
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Debug info
     */
    debug() {
        console.group('🔍 [Selectors] Debug Info');
        console.log('Cache size:', this.cache.size);
        console.log('Cached keys:', this.getCacheKeys());
        console.log('Initialized:', this.isInitialized);
        console.groupEnd();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.cache.clear();
        this.isInitialized = false;
        console.log('🗑️ [Selectors] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT (Safe Singleton Pattern)
// =============================================================================

if (!window.OsliraSelectors) {
    const store = window.OsliraStore;
    const instance = new Selectors(store);
    
    window.OsliraSelectors = instance;
    
    // Auto-initialize
    instance.initialize();
    
    console.log('✅ [Selectors] Loaded and initialized');
    
    if (window.Oslira?.init) {
        window.Oslira.init.register('Selectors', instance);
        console.log('📋 [Selectors] Registered with Coordinator');
    }
} else {
    console.log('⚠️ [Selectors] Already loaded, skipping re-initialization');
}
