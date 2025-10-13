// =============================================================================
// AUTH API - Authentication & User Management Endpoints
// Path: /public/core/api/endpoints/AuthAPI.js
// Dependencies: ApiClient
// =============================================================================

/**
 * @class AuthAPI
 * @description Handles all authentication and user-related API calls
 * 
 * Endpoints:
 * - User profile CRUD
 * - Subscription queries
 * - Onboarding status
 * - Credit management
 * - Session validation
 */
class AuthAPI {
    constructor() {
        this.apiClient = null;
        this.isInitialized = false;
        
        console.log('🔐 [AuthAPI] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize AuthAPI with ApiClient dependency
     * @param {Object} dependencies - { apiClient }
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [AuthAPI] Already initialized');
            return;
        }
        
        try {
            console.log('🔐 [AuthAPI] Initializing...');
            
            this.apiClient = dependencies.apiClient || window.OsliraApiClient;
            
            if (!this.apiClient) {
                throw new Error('ApiClient dependency missing');
            }
            
            this.isInitialized = true;
            console.log('✅ [AuthAPI] Initialized successfully');
            
        } catch (error) {
            console.error('❌ [AuthAPI] Initialization failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'AuthAPI', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // USER PROFILE MANAGEMENT
    // =========================================================================
    
    /**
     * Get user profile by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User profile data
     */
    async getUserProfile(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/users/${userId}`,
                {},
                { enabled: true, ttl: 5 * 60 * 1000 } // Cache for 5 minutes
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch user profile');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Get user profile failed:', error);
            throw error;
        }
    }
    
    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} updates - Profile fields to update
     * @returns {Promise<Object>} Updated profile
     */
    async updateUserProfile(userId, updates) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const response = await this.apiClient.put(
                `/v1/users/${userId}`,
                updates
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update user profile');
            }
            
            // Clear user cache after update
            this.apiClient.clearCachePattern(`/v1/users/${userId}`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Update user profile failed:', error);
            throw error;
        }
    }
    
    /**
     * Create user record (used after OAuth callback)
     * @param {Object} userData - User data from auth provider
     * @returns {Promise<Object>} Created user record
     */
    async createUser(userData) {
        if (!userData || !userData.id || !userData.email) {
            throw new Error('User ID and email are required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/users',
                userData
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to create user');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Create user failed:', error);
            throw error;
        }
    }
    
    /**
     * Delete user account (soft delete)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deleteUser(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const response = await this.apiClient.delete(`/v1/users/${userId}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to delete user');
            }
            
            // Clear all user-related cache
            this.apiClient.clearCachePattern(`/v1/users/${userId}`);
            this.apiClient.clearCachePattern(`/v1/subscriptions`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Delete user failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // SUBSCRIPTION MANAGEMENT
    // =========================================================================
    
    /**
     * Get user's active subscription
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Subscription data
     */
    async getSubscription(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/subscriptions?user_id=${userId}&status=active`,
                {},
                { enabled: true, ttl: 2 * 60 * 1000 } // Cache for 2 minutes
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch subscription');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Get subscription failed:', error);
            throw error;
        }
    }
    
    /**
     * Get user's credit balance
     * @param {string} userId - User ID
     * @returns {Promise<number>} Credit balance
     */
    async getCreditBalance(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const subscription = await this.getSubscription(userId);
            return subscription?.credits_remaining || 0;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Get credit balance failed:', error);
            throw error;
        }
    }
    
    /**
     * Refresh user's credit balance (bypasses cache)
     * @param {string} userId - User ID
     * @returns {Promise<number>} Fresh credit balance
     */
    async refreshCreditBalance(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            // Clear cache first
            this.apiClient.clearCachePattern(`/v1/subscriptions`);
            
            const response = await this.apiClient.get(
                `/v1/subscriptions?user_id=${userId}&status=active`,
                {},
                { enabled: false } // Don't cache this refresh
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to refresh credit balance');
            }
            
            return response.data?.credits_remaining || 0;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Refresh credit balance failed:', error);
            throw error;
        }
    }
    
    /**
     * Update subscription details
     * @param {string} subscriptionId - Subscription ID
     * @param {Object} updates - Subscription fields to update
     * @returns {Promise<Object>} Updated subscription
     */
    async updateSubscription(subscriptionId, updates) {
        if (!subscriptionId) {
            throw new Error('Subscription ID is required');
        }
        
        try {
            const response = await this.apiClient.put(
                `/v1/subscriptions/${subscriptionId}`,
                updates
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update subscription');
            }
            
            // Clear subscription cache
            this.apiClient.clearCachePattern(`/v1/subscriptions`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Update subscription failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // ONBOARDING
    // =========================================================================
    
    /**
     * Check if user has completed onboarding
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Onboarding status
     */
    async checkOnboardingStatus(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const profile = await this.getUserProfile(userId);
            return profile?.onboarding_completed || false;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Check onboarding status failed:', error);
            throw error;
        }
    }
    
    /**
     * Complete onboarding for user
     * @param {string} userId - User ID
     * @param {Object} onboardingData - Onboarding completion data
     * @returns {Promise<Object>} Updated user profile
     */
    async completeOnboarding(userId, onboardingData = {}) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const response = await this.apiClient.post(
                `/v1/users/${userId}/complete-onboarding`,
                onboardingData
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to complete onboarding');
            }
            
            // Clear user cache
            this.apiClient.clearCachePattern(`/v1/users/${userId}`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Complete onboarding failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // SESSION VALIDATION
    // =========================================================================
    
    /**
     * Validate session token with server
     * @param {string} token - Access token to validate
     * @returns {Promise<boolean>} Token validity
     */
    async validateSession(token) {
        if (!token) {
            throw new Error('Token is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/auth/validate-session',
                { token },
                { skipCache: true } // Never cache validation
            );
            
            return response.success && response.data?.valid === true;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Validate session failed:', error);
            return false;
        }
    }
    
    /**
     * Refresh access token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} New tokens
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new Error('Refresh token is required');
        }
        
        try {
            const response = await this.apiClient.post(
                '/v1/auth/refresh',
                { refresh_token: refreshToken },
                { skipCache: true }
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to refresh token');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Refresh token failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // USER PREFERENCES
    // =========================================================================
    
    /**
     * Get user preferences
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User preferences
     */
    async getUserPreferences(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const response = await this.apiClient.get(
                `/v1/users/${userId}/preferences`,
                {},
                { enabled: true, ttl: 10 * 60 * 1000 } // Cache for 10 minutes
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch preferences');
            }
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Get user preferences failed:', error);
            throw error;
        }
    }
    
    /**
     * Update user preferences
     * @param {string} userId - User ID
     * @param {Object} preferences - Preference updates
     * @returns {Promise<Object>} Updated preferences
     */
    async updateUserPreferences(userId, preferences) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        try {
            const response = await this.apiClient.put(
                `/v1/users/${userId}/preferences`,
                preferences
            );
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update preferences');
            }
            
            // Clear preferences cache
            this.apiClient.clearCachePattern(`/v1/users/${userId}/preferences`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ [AuthAPI] Update user preferences failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Clear all auth-related cache
     */
    clearAuthCache() {
        this.apiClient.clearCachePattern('/v1/users');
        this.apiClient.clearCachePattern('/v1/subscriptions');
        this.apiClient.clearCachePattern('/v1/auth');
        
        console.log('🗑️ [AuthAPI] Auth cache cleared');
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
        console.log('🗑️ [AuthAPI] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraAuthAPI = AuthAPI;

console.log('✅ [AuthAPI] Class loaded and ready for initialization');
