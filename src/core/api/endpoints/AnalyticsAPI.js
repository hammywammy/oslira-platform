// =============================================================================
// ANALYTICS API - Analytics & Metrics Endpoints
// Path: /public/core/api/endpoints/AnalyticsAPI.js
// Dependencies: ApiClient
// =============================================================================

/**
 * @class AnalyticsAPI
 * @description Handles all analytics and metrics-related API calls
 * 
 * Endpoints:
 * - Dashboard summary statistics
 * - Trend analysis
 * - Performance metrics
 * - Conversion tracking
 * - Custom reports
 */
class AnalyticsAPI {
    constructor() {
        this.apiClient = null;
        this.isInitialized = false;
        
        console.log('📊 [AnalyticsAPI] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize AnalyticsAPI with ApiClient dependency
     * @param {Object} dependencies - { apiClient }
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [AnalyticsAPI] Already initialized');
            return;
        }
        
        try {
            console.log('📊 [AnalyticsAPI] Initializing...');
            
            this.apiClient = dependencies.apiClient;
            
            if (!this.apiClient) {
                throw new Error('ApiClient dependency missing');
            }
            
            this.isInitialized = true;
            console.log('✅ [AnalyticsAPI] Initialized successfully');
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Initialization failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'AnalyticsAPI', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // DASHBOARD SUMMARY
    // =========================================================================
    
    /**
     * Get dashboard summary statistics
     * @param {string} businessId - Business ID
     * @param {Object} options - Date range options
     * @returns {Promise<Object>} Summary statistics
     */
    async getDashboardSummary(businessId, options = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        const {
            startDate = null,
            endDate = null,
            range = '30d'
        } = options;
        
        try {
            const queryParams = new URLSearchParams({
                business_id: businessId,
                range
            });
            
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);
            
            const response = await this.apiClient.get(
                `/analytics/summary?${queryParams.toString()}`,
                {},
                { enabled: true, ttl: 2 * 60 * 1000 } // Cache for 2 minutes
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch dashboard summary');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get dashboard summary failed:', error);
            throw error;
        }
    }
    
    /**
     * Get key performance indicators (KPIs)
     * @param {string} businessId - Business ID
     * @param {string} period - Time period (today, week, month, year)
     * @returns {Promise<Object>} KPI metrics
     */
    async getKPIs(businessId, period = 'month') {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/analytics/kpis?business_id=${businessId}&period=${period}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch KPIs');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get KPIs failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // TREND ANALYSIS
    // =========================================================================
    
    /**
     * Get trend data over time
     * @param {string} businessId - Business ID
     * @param {Object} options - Trend options
     * @returns {Promise<Object>} Trend data
     */
    async getTrends(businessId, options = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        const {
            metric = 'leads',
            interval = 'day',
            startDate = null,
            endDate = null
        } = options;
        
        try {
            const queryParams = new URLSearchParams({
                business_id: businessId,
                metric,
                interval
            });
            
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);
            
            const response = await this.apiClient.get(
                `/analytics/trends?${queryParams.toString()}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch trends');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get trends failed:', error);
            throw error;
        }
    }
    
    /**
     * Get comparison data (current vs previous period)
     * @param {string} businessId - Business ID
     * @param {string} metric - Metric to compare
     * @param {string} period - Time period
     * @returns {Promise<Object>} Comparison data
     */
    async getComparison(businessId, metric, period = '30d') {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/analytics/comparison?business_id=${businessId}&metric=${metric}&period=${period}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch comparison data');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get comparison failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // CONVERSION METRICS
    // =========================================================================
    
    /**
     * Get conversion funnel data
     * @param {string} businessId - Business ID
     * @param {Object} options - Funnel options
     * @returns {Promise<Object>} Conversion funnel data
     */
    async getConversionFunnel(businessId, options = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        const {
            startDate = null,
            endDate = null
        } = options;
        
        try {
            const queryParams = new URLSearchParams({
                business_id: businessId
            });
            
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);
            
            const response = await this.apiClient.get(
                `/analytics/conversion-funnel?${queryParams.toString()}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch conversion funnel');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get conversion funnel failed:', error);
            throw error;
        }
    }
    
    /**
     * Get conversion rate by source
     * @param {string} businessId - Business ID
     * @returns {Promise<Array>} Conversion rates by source
     */
    async getConversionBySource(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/analytics/conversion-by-source?business_id=${businessId}`,
                {},
                { enabled: true, ttl: 10 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch conversion by source');
            }
            
            return response.data || [];
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get conversion by source failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // LEAD PERFORMANCE METRICS
    // =========================================================================
    
    /**
     * Get lead quality distribution
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Lead quality breakdown
     */
    async getLeadQualityDistribution(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/analytics/lead-quality?business_id=${businessId}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch lead quality distribution');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get lead quality distribution failed:', error);
            throw error;
        }
    }
    
    /**
     * Get lead score distribution
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Score distribution data
     */
    async getLeadScoreDistribution(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/analytics/lead-scores?business_id=${businessId}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch lead score distribution');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get lead score distribution failed:', error);
            throw error;
        }
    }
    
    /**
     * Get top performing leads
     * @param {string} businessId - Business ID
     * @param {number} limit - Number of leads to return
     * @returns {Promise<Array>} Top performing leads
     */
    async getTopLeads(businessId, limit = 10) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/analytics/top-leads?business_id=${businessId}&limit=${limit}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch top leads');
            }
            
            return response.data || [];
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get top leads failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // ENGAGEMENT METRICS
    // =========================================================================
    
    /**
     * Get engagement metrics
     * @param {string} businessId - Business ID
     * @param {Object} options - Engagement options
     * @returns {Promise<Object>} Engagement data
     */
    async getEngagementMetrics(businessId, options = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        const {
            startDate = null,
            endDate = null
        } = options;
        
        try {
            const queryParams = new URLSearchParams({
                business_id: businessId
            });
            
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);
            
            const response = await this.apiClient.get(
                `/analytics/engagement?${queryParams.toString()}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch engagement metrics');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get engagement metrics failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // CUSTOM REPORTS
    // =========================================================================
    
    /**
     * Generate custom report
     * @param {string} businessId - Business ID
     * @param {Object} reportConfig - Report configuration
     * @returns {Promise<Object>} Generated report
     */
    async generateCustomReport(businessId, reportConfig) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        if (!reportConfig) {
            throw new Error('Report configuration is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/analytics/custom-report',
                {
                    business_id: businessId,
                    ...reportConfig
                },
                { skipCache: true }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to generate custom report');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Generate custom report failed:', error);
            throw error;
        }
    }
    
    /**
     * Export analytics data
     * @param {string} businessId - Business ID
     * @param {Object} exportConfig - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportAnalytics(businessId, exportConfig) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        const {
            format = 'csv',
            startDate = null,
            endDate = null,
            metrics = []
        } = exportConfig;
        
        try {
            const response = await this.apiClient.post(
                '/analytics/export',
                {
                    business_id: businessId,
                    format,
                    start_date: startDate,
                    end_date: endDate,
                    metrics
                },
                { skipCache: true }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to export analytics');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Export analytics failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // REAL-TIME METRICS
    // =========================================================================
    
    /**
     * Get real-time activity feed
     * @param {string} businessId - Business ID
     * @param {number} limit - Number of activities to return
     * @returns {Promise<Array>} Recent activities
     */
    async getRealtimeActivity(businessId, limit = 20) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/analytics/realtime/activity?business_id=${businessId}&limit=${limit}`,
                {},
                { enabled: false } // Don't cache real-time data
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch realtime activity');
            }
            
            return response.data || [];
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get realtime activity failed:', error);
            throw error;
        }
    }
    
    /**
     * Get current active users count
     * @param {string} businessId - Business ID
     * @returns {Promise<number>} Active users count
     */
    async getActiveUsersCount(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/analytics/realtime/active-users?business_id=${businessId}`,
                {},
                { enabled: false }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch active users count');
            }
            
            return response.data?.count || 0;
            
        } catch (error) {
            console.error('❌ [AnalyticsAPI] Get active users count failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Clear all analytics cache
     */
    clearAnalyticsCache() {
        this.apiClient.clearCachePattern('/analytics');
        console.log('🗑️ [AnalyticsAPI] Analytics cache cleared');
    }
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            hasApiClient: !!this.apiClient
        };
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Clean up resources
     */
    destroy() {
        this.isInitialized = false;
        console.log('🗑️ [AnalyticsAPI] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraAnalyticsAPI = AnalyticsAPI;

export default AnalyticsAPI;

console.log('✅ [AnalyticsAPI] Class loaded and ready for initialization');
