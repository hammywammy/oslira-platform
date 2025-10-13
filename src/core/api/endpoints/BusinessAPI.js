// =============================================================================
// BUSINESS API - Business Profile Management Endpoints
// Path: /public/core/api/endpoints/BusinessAPI.js
// Dependencies: ApiClient
// =============================================================================

/**
 * @class BusinessAPI
 * @description Handles all business profile-related API calls
 * 
 * Endpoints:
 * - Business profile CRUD
 * - Business settings
 * - Business team members
 * - Business integration configs
 */
class BusinessAPI {
    constructor() {
        this.apiClient = null;
        this.isInitialized = false;
        
        console.log('🏢 [BusinessAPI] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize BusinessAPI with ApiClient dependency
     * @param {Object} dependencies - { apiClient }
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [BusinessAPI] Already initialized');
            return;
        }
        
        try {
            console.log('🏢 [BusinessAPI] Initializing...');
            
            this.apiClient = dependencies.apiClient;
            
            if (!this.apiClient) {
                throw new Error('ApiClient dependency missing');
            }
            
            this.isInitialized = true;
            console.log('✅ [BusinessAPI] Initialized successfully');
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Initialization failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'BusinessAPI', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // BUSINESS CRUD OPERATIONS
    // =========================================================================
    
    /**
     * Fetch all businesses for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of business profiles
     */
    async fetchBusinesses(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/businesses?user_id=${userId}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 } // Cache for 5 minutes
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch businesses');
            }
            
            return response.data || [];
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Fetch businesses failed:', error);
            throw error;
        }
    }
    
    /**
     * Get single business by ID
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Business profile
     */
    async getBusiness(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/businesses/${businessId}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch business');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Get business failed:', error);
            throw error;
        }
    }
    
    /**
     * Create new business profile
     * @param {Object} businessData - Business profile data
     * @returns {Promise<Object>} Created business
     */
    async createBusiness(businessData) {
        if (!businessData || !businessData.user_id) {
            throw new Error('User ID is required');
        }
        
        if (!businessData.business_name) {
            throw new Error('Business name is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/businesses',
                businessData
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to create business');
            }
            
            // Clear businesses cache for this user
            this.apiClient.clearCachePattern(`user_id=${businessData.user_id}`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Create business failed:', error);
            throw error;
        }
    }
    
    /**
     * Update business profile
     * @param {string} businessId - Business ID
     * @param {Object} updates - Business updates
     * @returns {Promise<Object>} Updated business
     */
    async updateBusiness(businessId, updates) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.put(
                `/v1/businesses/${businessId}`,
                updates
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update business');
            }
            
            // Clear business cache
            this.apiClient.clearCachePattern(`/v1/businesses/${businessId}`);
            this.apiClient.clearCachePattern('/v1/businesses?');
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Update business failed:', error);
            throw error;
        }
    }
    
    /**
     * Delete business profile
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deleteBusiness(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.delete(
                `/v1/businesses/${businessId}`
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to delete business');
            }
            
            // Clear all business-related cache
            this.apiClient.clearCachePattern(`/v1/businesses/${businessId}`);
            this.apiClient.clearCachePattern('/v1/businesses?');
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Delete business failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // BUSINESS VALIDATION
    // =========================================================================
    
    /**
     * Validate business profile data
     * @param {Object} businessData - Business data to validate
     * @returns {Promise<Object>} Validation results
     */
    async validateBusinessProfile(businessData) {
        if (!businessData) {
            throw new Error('Business data is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/businesses/validate',
                businessData,
                { skipCache: true }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Validation failed');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Validate business failed:', error);
            throw error;
        }
    }
    
    /**
     * Check if business name is available
     * @param {string} businessName - Business name to check
     * @param {string} excludeBusinessId - Business ID to exclude from check
     * @returns {Promise<boolean>} Name availability
     */
    async checkBusinessNameAvailability(businessName, excludeBusinessId = null) {
        if (!businessName) {
            throw new Error('Business name is required');
        }
        
        try {
            const queryParams = new URLSearchParams({
                name: businessName
            });
            
            if (excludeBusinessId) {
                queryParams.append('exclude_id', excludeBusinessId);
            }
            
            const response = await this.apiClient.get(
                `/v1/businesses/check-name?${queryParams.toString()}`,
                {},
                { enabled: false } // Don't cache availability checks
            );
            
            return response.success && response.data?.available === true;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Check name availability failed:', error);
            return false;
        }
    }
    
    // =========================================================================
    // BUSINESS SETTINGS
    // =========================================================================
    
    /**
     * Get business settings
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Business settings
     */
    async getBusinessSettings(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/businesses/${businessId}/settings`,
                {},
                { enabled: true, ttl: 10 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch settings');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Get business settings failed:', error);
            throw error;
        }
    }
    
    /**
     * Update business settings
     * @param {string} businessId - Business ID
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>} Updated settings
     */
    async updateBusinessSettings(businessId, settings) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.put(
                `/v1/businesses/${businessId}/settings`,
                settings
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update settings');
            }
            
            // Clear settings cache
            this.apiClient.clearCachePattern(`/v1/businesses/${businessId}/settings`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Update business settings failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // BUSINESS TEAM MEMBERS
    // =========================================================================
    
    /**
     * Get team members for business
     * @param {string} businessId - Business ID
     * @returns {Promise<Array>} Team members
     */
    async getTeamMembers(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/businesses/${businessId}/team`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch team members');
            }
            
            return response.data || [];
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Get team members failed:', error);
            throw error;
        }
    }
    
    /**
     * Invite team member
     * @param {string} businessId - Business ID
     * @param {Object} memberData - Member invitation data
     * @returns {Promise<Object>} Invitation result
     */
    async inviteTeamMember(businessId, memberData) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        if (!memberData || !memberData.email) {
            throw new Error('Member email is required');
        }
        
        try {
            const response = await this.apiClient.post(
                `/v1/businesses/${businessId}/team/invite`,
                memberData
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to invite team member');
            }
            
            // Clear team cache
            this.apiClient.clearCachePattern(`/v1/businesses/${businessId}/team`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Invite team member failed:', error);
            throw error;
        }
    }
    
    /**
     * Remove team member
     * @param {string} businessId - Business ID
     * @param {string} memberId - Member ID to remove
     * @returns {Promise<Object>} Removal confirmation
     */
    async removeTeamMember(businessId, memberId) {
        if (!businessId || !memberId) {
            throw new Error('Business ID and Member ID are required');
        }
        
        try {
            const response = await this.apiClient.delete(
                `/v1/businesses/${businessId}/team/${memberId}`
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to remove team member');
            }
            
            // Clear team cache
            this.apiClient.clearCachePattern(`/v1/businesses/${businessId}/team`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Remove team member failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // BUSINESS INTEGRATIONS
    // =========================================================================
    
    /**
     * Get integration configs for business
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Integration configurations
     */
    async getIntegrations(businessId) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/businesses/${businessId}/integrations`,
                {},
                { enabled: true, ttl: 10 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch integrations');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Get integrations failed:', error);
            throw error;
        }
    }
    
    /**
     * Update integration config
     * @param {string} businessId - Business ID
     * @param {string} integrationType - Integration type (e.g., 'instagram', 'stripe')
     * @param {Object} config - Integration configuration
     * @returns {Promise<Object>} Updated integration
     */
    async updateIntegration(businessId, integrationType, config) {
        if (!businessId || !integrationType) {
            throw new Error('Business ID and integration type are required');
        }
        
        try {
            const response = await this.apiClient.put(
                `/v1/businesses/${businessId}/integrations/${integrationType}`,
                config
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update integration');
            }
            
            // Clear integrations cache
            this.apiClient.clearCachePattern(`/v1/businesses/${businessId}/integrations`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Update integration failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // BUSINESS STATISTICS
    // =========================================================================
    
    /**
     * Get business statistics
     * @param {string} businessId - Business ID
     * @param {Object} options - Date range options
     * @returns {Promise<Object>} Business statistics
     */
    async getBusinessStats(businessId, options = {}) {
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
                `/v1/businesses/${businessId}/stats?${queryParams.toString()}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch business stats');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [BusinessAPI] Get business stats failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Clear all business cache
     */
    clearBusinessCache() {
        this.apiClient.clearCachePattern('/v1/businesses');
        console.log('🗑️ [BusinessAPI] Business cache cleared');
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
        console.log('🗑️ [BusinessAPI] Destroyed');
    }
}


