// =============================================================================
// LEADS API - Lead Management & Analysis Endpoints
// Path: /public/core/api/endpoints/LeadsAPI.js
// Dependencies: ApiClient
// =============================================================================

/**
 * @class LeadsAPI
 * @description Handles all lead-related API calls
 * 
 * Endpoints:
 * - Lead CRUD operations
 * - Lead analysis (AI scoring)
 * - Bulk operations
 * - Lead search & filtering
 * - Lead statistics
 */
class LeadsAPI {
    constructor() {
        this.apiClient = null;
        this.isInitialized = false;
        
        console.log('🎯 [LeadsAPI] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize LeadsAPI with ApiClient dependency
     * @param {Object} dependencies - { apiClient }
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [LeadsAPI] Already initialized');
            return;
        }
        
        try {
            console.log('🎯 [LeadsAPI] Initializing...');
            
            this.apiClient = dependencies.apiClient || window.OsliraApiClient;
            
            if (!this.apiClient) {
                throw new Error('ApiClient dependency missing');
            }
            
            this.isInitialized = true;
            console.log('✅ [LeadsAPI] Initialized successfully');
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Initialization failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'LeadsAPI', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // LEAD CRUD OPERATIONS
    // =========================================================================
    
    /**
     * Fetch all leads for a business
     * @param {string} businessId - Business ID
     * @param {Object} options - Query options (limit, offset, sort)
     * @returns {Promise<Array>} Array of leads
     */
    async fetchLeads(businessId, options = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        const {
            limit = 100,
            offset = 0,
            sortBy = 'created_at',
            sortOrder = 'desc',
            status = null
        } = options;
        
        try {
            const queryParams = new URLSearchParams({
                business_id: businessId,
                limit,
                offset,
                sort_by: sortBy,
                sort_order: sortOrder
            });
            
            if (status) {
                queryParams.append('status', status);
            }
            
            const response = await this.apiClient.get(
                `/v1/leads?${queryParams.toString()}`,
                {},
                { enabled: true, ttl: 2 * 60 * 1000 } // Cache for 2 minutes
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch leads');
            }
            
            return response.data || [];
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Fetch leads failed:', error);
            throw error;
        }
    }
    
    /**
     * Get single lead by ID
     * @param {string} leadId - Lead ID
     * @returns {Promise<Object>} Lead data
     */
    async getLead(leadId) {
        if (!leadId) {
            throw new Error('Lead ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/leads/${leadId}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch lead');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Get lead failed:', error);
            throw error;
        }
    }
    
    /**
     * Create new lead
     * @param {Object} leadData - Lead data
     * @returns {Promise<Object>} Created lead
     */
    async createLead(leadData) {
        if (!leadData || !leadData.business_id) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/leads',
                leadData
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to create lead');
            }
            
            // Clear leads cache for this business
            this.apiClient.clearCachePattern(`business_id=${leadData.business_id}`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Create lead failed:', error);
            throw error;
        }
    }
    
    /**
     * Update lead
     * @param {string} leadId - Lead ID
     * @param {Object} updates - Lead updates
     * @returns {Promise<Object>} Updated lead
     */
    async updateLead(leadId, updates) {
        if (!leadId) {
            throw new Error('Lead ID is required');
        }
        
        try {
            const response = await this.apiClient.put(
                `/v1/leads/${leadId}`,
                updates
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update lead');
            }
            
            // Clear lead cache
            this.apiClient.clearCachePattern(`/v1/leads/${leadId}`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Update lead failed:', error);
            throw error;
        }
    }
    
    /**
     * Delete lead
     * @param {string} leadId - Lead ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deleteLead(leadId) {
        if (!leadId) {
            throw new Error('Lead ID is required');
        }
        
        try {
            const response = await this.apiClient.delete(`/v1/leads/${leadId}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to delete lead');
            }
            
            // Clear lead cache
            this.apiClient.clearCachePattern(`/v1/leads/${leadId}`);
            this.apiClient.clearCachePattern(`/v1/leads?`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Delete lead failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // LEAD ANALYSIS
    // =========================================================================
    
    /**
     * Analyze single lead with AI
     * @param {Object} leadData - Lead profile data
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeLead(leadData) {
        if (!leadData || !leadData.instagram_username) {
            throw new Error('Instagram username is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/analyze',
                leadData,
                { skipCache: true } // Never cache analysis requests
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to analyze lead');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Analyze lead failed:', error);
            throw error;
        }
    }
    
    /**
     * Bulk analyze multiple leads
     * @param {Array} leads - Array of lead profiles
     * @returns {Promise<Array>} Analysis results
     */
    async bulkAnalyze(leads) {
        if (!Array.isArray(leads) || leads.length === 0) {
            throw new Error('Leads array is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/bulk-analyze',
                { profiles: leads },
                { skipCache: true }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to bulk analyze leads');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Bulk analyze failed:', error);
            throw error;
        }
    }
    
    /**
     * Re-analyze existing lead
     * @param {string} leadId - Lead ID
     * @returns {Promise<Object>} Updated analysis
     */
    async reanalyzeLead(leadId) {
        if (!leadId) {
            throw new Error('Lead ID is required');
        }
        
        try {
            const response = await this.apiClient.post(
                `/v1/leads/${leadId}/reanalyze`,
                {},
                { skipCache: true }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to reanalyze lead');
            }
            
            // Clear lead cache
            this.apiClient.clearCachePattern(`/v1/leads/${leadId}`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Reanalyze lead failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // LEAD SEARCH & FILTERING
    // =========================================================================
    
    /**
     * Search leads by query
     * @param {string} businessId - Business ID
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Matching leads
     */
    async searchLeads(businessId, query, filters = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const queryParams = new URLSearchParams({
                business_id: businessId,
                q: query || '',
                ...filters
            });
            
            const response = await this.apiClient.get(
                `/v1/leads/search?${queryParams.toString()}`,
                {},
                { enabled: true, ttl: 1 * 60 * 1000 } // Cache for 1 minute
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to search leads');
            }
            
            return response.data || [];
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Search leads failed:', error);
            throw error;
        }
    }
    
    /**
     * Filter leads by criteria
     * @param {string} businessId - Business ID
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Filtered leads
     */
    async filterLeads(businessId, filters) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/leads/filter',
                {
                    business_id: businessId,
                    filters
                },
                { skipCache: true }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to filter leads');
            }
            
            return response.data || [];
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Filter leads failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // BULK OPERATIONS
    // =========================================================================
    
    /**
     * Bulk create leads
     * @param {Array} leads - Array of lead data
     * @returns {Promise<Object>} Creation results
     */
    async bulkCreateLeads(leads) {
        if (!Array.isArray(leads) || leads.length === 0) {
            throw new Error('Leads array is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/leads/bulk',
                { leads }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to bulk create leads');
            }
            
            // Clear leads cache
            this.apiClient.clearCachePattern('/v1/leads');
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Bulk create leads failed:', error);
            throw error;
        }
    }
    
    /**
     * Bulk update leads
     * @param {Array} leadIds - Array of lead IDs
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Update results
     */
    async bulkUpdateLeads(leadIds, updates) {
        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            throw new Error('Lead IDs array is required');
        }
        
        try {
            const response = await this.apiClient.put(
                '/v1/leads/bulk',
                { lead_ids: leadIds, updates }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to bulk update leads');
            }
            
            // Clear affected leads cache
            leadIds.forEach(id => {
                this.apiClient.clearCachePattern(`/v1/leads/${id}`);
            });
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Bulk update leads failed:', error);
            throw error;
        }
    }
    
    /**
     * Bulk delete leads
     * @param {Array} leadIds - Array of lead IDs
     * @returns {Promise<Object>} Deletion results
     */
    async bulkDeleteLeads(leadIds) {
        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            throw new Error('Lead IDs array is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/leads/bulk-delete',
                { lead_ids: leadIds }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to bulk delete leads');
            }
            
            // Clear leads cache
            this.apiClient.clearCachePattern('/v1/leads');
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Bulk delete leads failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // LEAD STATISTICS
    // =========================================================================
    
    /**
     * Get lead statistics for business
     * @param {string} businessId - Business ID
     * @param {Object} options - Date range options
     * @returns {Promise<Object>} Lead statistics
     */
    async getLeadStats(businessId, options = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        const {
            startDate = null,
            endDate = null,
            groupBy = 'day'
        } = options;
        
        try {
            const queryParams = new URLSearchParams({
                business_id: businessId,
                group_by: groupBy
            });
            
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);
            
            const response = await this.apiClient.get(
                `/v1/leads/stats?${queryParams.toString()}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch lead stats');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Get lead stats failed:', error);
            throw error;
        }
    }
    
    /**
     * Get lead conversion metrics
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Conversion metrics
     */
    async getConversionMetrics(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/leads/metrics/conversion?business_id=${businessId}`,
                {},
                { enabled: true, ttl: 10 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch conversion metrics');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Get conversion metrics failed:', error);
            throw error;
        }
    }

 /**
 * Fetch leads for dashboard (with nested runs)
 * @param {string} businessId - Business ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Leads with runs
 */
async fetchDashboardLeads(businessId, limit = 50) {
    if (!businessId) {
        throw new Error('Business ID is required');
    }
    
    try {
        console.log(`🔍 [LeadsAPI] Fetching dashboard leads for business: ${businessId}`);
        
        const response = await this.apiClient.get(
            `/v1/leads/dashboard?business_id=${businessId}&limit=${limit}`,
            {},
            { enabled: true, ttl: 2 * 60 * 1000 }
        );
        
        console.log('📦 [LeadsAPI] Response received:', {
            hasResponse: !!response,
            hasSuccess: response?.success,
            hasData: !!response?.data,
            dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
            dataLength: response?.data?.length
        });
        
        // ✅ CRITICAL FIX: Handle the response properly
        // The backend returns { success: true, data: [...], requestId: "..." }
        if (response && response.success === true) {
            const leads = response.data || [];
            console.log(`✅ [LeadsAPI] Fetched ${leads.length} dashboard leads`);
            return leads;
        }
        
        // Handle explicit failure response
        if (response && response.success === false) {
            const errorMsg = response.error || 'Failed to fetch dashboard leads';
            console.error('❌ [LeadsAPI] API returned error:', errorMsg);
            throw new Error(errorMsg);
        }
        
        // Handle unexpected response format
        console.error('❌ [LeadsAPI] Unexpected response format:', response);
        throw new Error('Unexpected response format from API');
        
    } catch (error) {
        console.error('❌ [LeadsAPI] Fetch dashboard leads failed:', error);
        console.error('❌ [LeadsAPI] Error details:', {
            message: error.message,
            stack: error.stack,
            businessId,
            limit
        });
        throw error;
    }
}
    
    // =========================================================================
    // LEAD TAGS & NOTES
    // =========================================================================
    
    /**
     * Add tag to lead
     * @param {string} leadId - Lead ID
     * @param {string} tag - Tag to add
     * @returns {Promise<Object>} Updated lead
     */
    async addLeadTag(leadId, tag) {
        if (!leadId || !tag) {
            throw new Error('Lead ID and tag are required');
        }
        
        try {
            const response = await this.apiClient.post(
                `/v1/leads/${leadId}/tags`,
                { tag }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to add tag');
            }
            
            this.apiClient.clearCachePattern(`/v1/leads/${leadId}`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Add lead tag failed:', error);
            throw error;
        }
    }
    
    /**
     * Add note to lead
     * @param {string} leadId - Lead ID
     * @param {string} note - Note content
     * @returns {Promise<Object>} Created note
     */
    async addLeadNote(leadId, note) {
        if (!leadId || !note) {
            throw new Error('Lead ID and note are required');
        }
        
        try {
            const response = await this.apiClient.post(
                `/v1/leads/${leadId}/notes`,
                { note }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to add note');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [LeadsAPI] Add lead note failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Clear all leads cache
     */
    clearLeadsCache() {
        this.apiClient.clearCachePattern('/v1/leads');
        console.log('🗑️ [LeadsAPI] Leads cache cleared');
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
        console.log('🗑️ [LeadsAPI] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT - CREATE SINGLETON INSTANCE
// =============================================================================

// Export the class
window.LeadsAPI = LeadsAPI;

// Create singleton instance (like other core services)
if (!window.OsliraLeadsAPI) {
    window.OsliraLeadsAPI = new LeadsAPI();
    console.log('✅ [LeadsAPI] Singleton instance created and ready for initialization');
} else {
    console.log('⚠️ [LeadsAPI] Instance already exists, skipping re-initialization');
}
