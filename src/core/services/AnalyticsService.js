// =============================================================================
// ANALYTICS SERVICE - Analytics Business Logic
// Path: /public/core/services/AnalyticsService.js
// Dependencies: AnalyticsAPI, StateManager, Logger
// =============================================================================

/**
 * @class AnalyticsService
 * @description Business logic for analytics and reporting
 * 
 * Features:
 * - Dashboard statistics
 * - Trend analysis
 * - Conversion metrics
 * - Performance reports
 * - Data aggregation
 */
class AnalyticsService {
    constructor(analyticsAPI, stateManager, logger) {
        if (!analyticsAPI) throw new Error('[AnalyticsService] AnalyticsAPI required');
        if (!stateManager) throw new Error('[AnalyticsService] StateManager required');
        if (!logger) throw new Error('[AnalyticsService] Logger required');
        
        this.analyticsAPI = analyticsAPI;
        this.stateManager = stateManager;
        this.logger = logger;
        
        this.isInitialized = false;
        
        // Cache
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        
        console.log('📈 [AnalyticsService] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('[AnalyticsService] Already initialized');
            return;
        }
        
        try {
            this.isInitialized = true;
            this.logger.info('[AnalyticsService] Initialized');
            
        } catch (error) {
            this.logger.error('[AnalyticsService] Initialization failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'AnalyticsService', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // DASHBOARD STATS
    // =========================================================================
    
    /**
     * Load dashboard stats
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Dashboard stats
     */
    async loadDashboardStats(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            this.logger.info('[AnalyticsService] Loading dashboard stats', { businessId });
            
            // Check cache
            const cached = this.getCachedData(`dashboard:${businessId}`);
            if (cached) {
                this.logger.debug('[AnalyticsService] Using cached dashboard stats');
                return cached;
            }
            
            // Fetch from API
            const stats = await this.analyticsAPI.getDashboardStats(businessId);
            
            // Update state
            this.stateManager.setState('analytics.stats', stats);
            
            // Cache result
            this.setCachedData(`dashboard:${businessId}`, stats);
            
            this.logger.info('[AnalyticsService] Dashboard stats loaded');
            
            return stats;
            
        } catch (error) {
            this.logger.error('[AnalyticsService] Load dashboard stats failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'AnalyticsService', action: 'loadDashboardStats' },
                    extra: { businessId }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Calculate dashboard summary from local state
     * @returns {Object} Dashboard summary
     */
    calculateDashboardSummary() {
        const leads = this.stateManager.getState('leads.all') || [];
        const businesses = this.stateManager.getState('business.all') || [];
        const user = this.stateManager.getState('auth.user');
        
        // Calculate today's leads
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const leadsToday = leads.filter(lead => {
            const created = new Date(lead.created_at);
            return created >= today;
        }).length;
        
        // Calculate high quality leads
        const highQualityLeads = leads.filter(lead => (lead.score || 0) >= 70).length;
        
        // Calculate average score
        const avgScore = leads.length > 0 
            ? Math.round(leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / leads.length)
            : 0;
        
        return {
            totalLeads: leads.length,
            leadsToday,
            highQualityLeads,
            avgScore,
            totalBusinesses: businesses.length,
            creditsRemaining: user?.credits || 0
        };
    }
    
    // =========================================================================
    // TRENDS
    // =========================================================================
    
    /**
     * Get lead trends
     * @param {string} businessId - Business ID
     * @param {Object} options - Date range options
     * @returns {Promise<Object>} Trend data
     */
    async getLeadTrends(businessId, options = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            this.logger.info('[AnalyticsService] Getting lead trends', { businessId, options });
            
            const cacheKey = `trends:${businessId}:${JSON.stringify(options)}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            
            const trends = await this.analyticsAPI.getLeadTrends(businessId, options);
            
            this.setCachedData(cacheKey, trends);
            
            return trends;
            
        } catch (error) {
            this.logger.error('[AnalyticsService] Get lead trends failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'AnalyticsService', action: 'getLeadTrends' },
                    extra: { businessId, options }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Calculate local trends from state
     * @param {number} days - Number of days to analyze
     * @returns {Array} Trend data by day
     */
    calculateLocalTrends(days = 7) {
        const leads = this.stateManager.getState('leads.all') || [];
        
        const trends = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const leadsOnDay = leads.filter(lead => {
                const created = new Date(lead.created_at);
                return created >= date && created < nextDate;
            });
            
            trends.push({
                date: date.toISOString().split('T')[0],
                count: leadsOnDay.length,
                avgScore: leadsOnDay.length > 0
                    ? Math.round(leadsOnDay.reduce((sum, lead) => sum + (lead.score || 0), 0) / leadsOnDay.length)
                    : 0
            });
        }
        
        return trends;
    }
    
    // =========================================================================
    // CONVERSION METRICS
    // =========================================================================
    
    /**
     * Get conversion metrics
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Conversion metrics
     */
    async getConversionMetrics(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            this.logger.info('[AnalyticsService] Getting conversion metrics', { businessId });
            
            const cacheKey = `conversion:${businessId}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            
            const metrics = await this.analyticsAPI.getConversionMetrics(businessId);
            
            this.setCachedData(cacheKey, metrics);
            
            return metrics;
            
        } catch (error) {
            this.logger.error('[AnalyticsService] Get conversion metrics failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'AnalyticsService', action: 'getConversionMetrics' },
                    extra: { businessId }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Calculate conversion rate from local data
     * @returns {number} Conversion rate (0-100)
     */
    calculateConversionRate() {
        const leads = this.stateManager.getState('leads.all') || [];
        
        if (leads.length === 0) return 0;
        
        const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
        
        return Math.round((convertedLeads / leads.length) * 100);
    }
    
    // =========================================================================
    // QUALITY DISTRIBUTION
    // =========================================================================
    
    /**
     * Get lead quality distribution
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Quality distribution
     */
    async getLeadQualityDistribution(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            this.logger.info('[AnalyticsService] Getting quality distribution', { businessId });
            
            const cacheKey = `quality:${businessId}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            
            const distribution = await this.analyticsAPI.getLeadQualityDistribution(businessId);
            
            this.setCachedData(cacheKey, distribution);
            
            return distribution;
            
        } catch (error) {
            this.logger.error('[AnalyticsService] Get quality distribution failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'AnalyticsService', action: 'getQualityDistribution' },
                    extra: { businessId }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Calculate quality distribution from local data
     * @returns {Object} Distribution by quality level
     */
    calculateQualityDistribution() {
        const leads = this.stateManager.getState('leads.all') || [];
        
        const distribution = {
            high: 0,
            medium: 0,
            low: 0
        };
        
        leads.forEach(lead => {
            const score = lead.score || 0;
            if (score >= 70) distribution.high++;
            else if (score >= 40) distribution.medium++;
            else distribution.low++;
        });
        
        return distribution;
    }
    
    /**
     * Calculate quality distribution as percentages
     * @returns {Object} Distribution percentages
     */
    calculateQualityPercentages() {
        const leads = this.stateManager.getState('leads.all') || [];
        const total = leads.length;
        
        if (total === 0) {
            return { high: 0, medium: 0, low: 0 };
        }
        
        const distribution = this.calculateQualityDistribution();
        
        return {
            high: Math.round((distribution.high / total) * 100),
            medium: Math.round((distribution.medium / total) * 100),
            low: Math.round((distribution.low / total) * 100)
        };
    }
    
    // =========================================================================
    // TOP PERFORMERS
    // =========================================================================
    
    /**
     * Get top performing leads
     * @param {string} businessId - Business ID
     * @param {number} limit - Number of leads to return
     * @returns {Promise<Array>} Top leads
     */
    async getTopLeads(businessId, limit = 10) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            this.logger.info('[AnalyticsService] Getting top leads', { businessId, limit });
            
            const cacheKey = `top:${businessId}:${limit}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            
            const topLeads = await this.analyticsAPI.getTopLeads(businessId, limit);
            
            this.setCachedData(cacheKey, topLeads);
            
            return topLeads;
            
        } catch (error) {
            this.logger.error('[AnalyticsService] Get top leads failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'AnalyticsService', action: 'getTopLeads' },
                    extra: { businessId, limit }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Get top leads from local data
     * @param {number} limit - Number of leads
     * @returns {Array} Top leads
     */
    getTopLeadsLocal(limit = 10) {
        const leads = this.stateManager.getState('leads.all') || [];
        
        return [...leads]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, limit);
    }
    
    // =========================================================================
    // PERFORMANCE METRICS
    // =========================================================================
    
    /**
     * Calculate performance metrics
     * @returns {Object} Performance metrics
     */
    calculatePerformanceMetrics() {
        const leads = this.stateManager.getState('leads.all') || [];
        
        if (leads.length === 0) {
            return {
                totalLeads: 0,
                avgScore: 0,
                highQualityRate: 0,
                conversionRate: 0,
                growthRate: 0
            };
        }
        
        // Average score
        const avgScore = Math.round(
            leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / leads.length
        );
        
        // High quality rate
        const highQuality = leads.filter(lead => (lead.score || 0) >= 70).length;
        const highQualityRate = Math.round((highQuality / leads.length) * 100);
        
        // Conversion rate
        const converted = leads.filter(lead => lead.status === 'converted').length;
        const conversionRate = Math.round((converted / leads.length) * 100);
        
        // Growth rate (last 7 days vs previous 7 days)
        const growthRate = this.calculateGrowthRate();
        
        return {
            totalLeads: leads.length,
            avgScore,
            highQualityRate,
            conversionRate,
            growthRate
        };
    }
    
    /**
     * Calculate growth rate
     * @returns {number} Growth rate percentage
     */
    calculateGrowthRate() {
        const leads = this.stateManager.getState('leads.all') || [];
        
        if (leads.length === 0) return 0;
        
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const lastWeek = leads.filter(lead => {
            const created = new Date(lead.created_at);
            return created >= sevenDaysAgo && created < now;
        }).length;
        
        const previousWeek = leads.filter(lead => {
            const created = new Date(lead.created_at);
            return created >= fourteenDaysAgo && created < sevenDaysAgo;
        }).length;
        
        if (previousWeek === 0) return lastWeek > 0 ? 100 : 0;
        
        return Math.round(((lastWeek - previousWeek) / previousWeek) * 100);
    }
    
    // =========================================================================
    // CACHING
    // =========================================================================
    
    /**
     * Get cached data
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        // Check expiration
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * Set cached data
     */
    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + this.cacheTTL
        });
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('[AnalyticsService] Cache cleared');
    }
    
    /**
     * Clear specific cache key
     */
    clearCacheKey(key) {
        this.cache.delete(key);
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    destroy() {
        this.cache.clear();
        this.isInitialized = false;
        this.logger.info('[AnalyticsService] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraAnalyticsService = AnalyticsService;
export default AnalyticsService;
console.log('✅ [AnalyticsService] Class loaded and ready');
