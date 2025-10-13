// =============================================================================
// USER SERVICE - User Management Business Logic
// Path: /public/core/services/UserService.js
// Dependencies: AuthAPI, AuthManager, StateManager, Logger
// =============================================================================

/**
 * @class UserService
 * @description Business logic for user management
 * 
 * Features:
 * - User profile management
 * - Preferences management
 * - Subscription management
 * - Credits tracking
 * - Account settings
 */
class UserService {
    constructor(authAPI, authManager, stateManager, logger) {
        if (!authAPI) throw new Error('[UserService] AuthAPI required');
        if (!authManager) throw new Error('[UserService] AuthManager required');
        if (!stateManager) throw new Error('[UserService] StateManager required');
        if (!logger) throw new Error('[UserService] Logger required');
        
        this.authAPI = authAPI;
        this.authManager = authManager;
        this.stateManager = stateManager;
        this.logger = logger;
        
        this.isInitialized = false;
        
        console.log('👤 [UserService] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('[UserService] Already initialized');
            return;
        }
        
        try {
            // Load user profile if authenticated
            const user = this.authManager.getCurrentUser();
            if (user) {
                await this.loadUserProfile();
            }
            
            this.isInitialized = true;
            this.logger.info('[UserService] Initialized');
            
        } catch (error) {
            this.logger.error('[UserService] Initialization failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'UserService', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // USER PROFILE
    // =========================================================================
    
    /**
     * Load user profile
     * @returns {Promise<Object>} User profile
     */
    async loadUserProfile() {
        try {
            this.logger.info('[UserService] Loading user profile');
            
            const user = this.authManager.getCurrentUser();
            
            if (!user) {
                throw new Error('No authenticated user');
            }
            
            // Fetch full profile from API
            const profile = await this.authAPI.getUserProfile(user.id);
            
            // Update state
            this.stateManager.setState('auth.user', profile);
            
            this.logger.info('[UserService] User profile loaded');
            
            return profile;
            
        } catch (error) {
            this.logger.error('[UserService] Load user profile failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'UserService', action: 'loadUserProfile' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Update user profile
     * @param {Object} updates - Profile updates
     * @returns {Promise<Object>} Updated profile
     */
    async updateUserProfile(updates) {
        try {
            this.logger.info('[UserService] Updating user profile', { updates });
            
            const user = this.authManager.getCurrentUser();
            
            if (!user) {
                throw new Error('No authenticated user');
            }
            
            // Validate updates
            this.validateProfileUpdates(updates);
            
            // Update via API
            const updatedProfile = await this.authAPI.updateUserProfile(user.id, updates);
            
            // Update state
            this.stateManager.setState('auth.user', updatedProfile);
            
            this.logger.info('[UserService] User profile updated');
            
            return updatedProfile;
            
        } catch (error) {
            this.logger.error('[UserService] Update user profile failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'UserService', action: 'updateUserProfile' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Get current user
     * @returns {Object|null} User
     */
    getCurrentUser() {
        return this.stateManager.getState('auth.user');
    }
    
    /**
     * Get user ID
     * @returns {string|null} User ID
     */
    getUserId() {
        const user = this.getCurrentUser();
        return user ? user.id : null;
    }
    
    /**
     * Get user email
     * @returns {string|null} Email
     */
    getUserEmail() {
        const user = this.getCurrentUser();
        return user ? user.email : null;
    }
    
    // =========================================================================
    // PREFERENCES
    // =========================================================================
    
    /**
     * Load user preferences
     * @returns {Promise<Object>} Preferences
     */
    async loadUserPreferences() {
        try {
            this.logger.info('[UserService] Loading user preferences');
            
            const user = this.authManager.getCurrentUser();
            
            if (!user) {
                throw new Error('No authenticated user');
            }
            
            const preferences = await this.authAPI.getUserPreferences(user.id);
            
            // Update state
            this.stateManager.setState('user.preferences', preferences);
            
            this.logger.info('[UserService] User preferences loaded');
            
            return preferences;
            
        } catch (error) {
            this.logger.error('[UserService] Load preferences failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'UserService', action: 'loadPreferences' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Update user preferences
     * @param {Object} preferences - Preferences to update
     * @returns {Promise<Object>} Updated preferences
     */
    async updateUserPreferences(preferences) {
        try {
            this.logger.info('[UserService] Updating user preferences', { preferences });
            
            const user = this.authManager.getCurrentUser();
            
            if (!user) {
                throw new Error('No authenticated user');
            }
            
            const updated = await this.authAPI.updateUserPreferences(user.id, preferences);
            
            // Update state
            this.stateManager.setState('user.preferences', updated);
            
            this.logger.info('[UserService] User preferences updated');
            
            return updated;
            
        } catch (error) {
            this.logger.error('[UserService] Update preferences failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'UserService', action: 'updatePreferences' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Get user preferences
     * @returns {Object} Preferences
     */
    getUserPreferences() {
        return this.stateManager.getState('user.preferences') || {};
    }
    
    /**
     * Get specific preference
     * @param {string} key - Preference key
     * @param {*} defaultValue - Default value if not set
     * @returns {*} Preference value
     */
    getPreference(key, defaultValue = null) {
        const preferences = this.getUserPreferences();
        return preferences[key] !== undefined ? preferences[key] : defaultValue;
    }
    
    /**
     * Set specific preference
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     * @returns {Promise<Object>} Updated preferences
     */
    async setPreference(key, value) {
        const preferences = this.getUserPreferences();
        preferences[key] = value;
        return await this.updateUserPreferences(preferences);
    }
    
    // =========================================================================
    // SUBSCRIPTION MANAGEMENT
    // =========================================================================
    
    /**
     * Get user subscription
     * @returns {Promise<Object>} Subscription
     */
    async getUserSubscription() {
        try {
            this.logger.info('[UserService] Getting user subscription');
            
            const user = this.authManager.getCurrentUser();
            
            if (!user) {
                throw new Error('No authenticated user');
            }
            
            const subscription = await this.authAPI.getUserSubscription(user.id);
            
            // Update state
            this.stateManager.setState('user.subscription', subscription);
            
            this.logger.info('[UserService] User subscription loaded');
            
            return subscription;
            
        } catch (error) {
            this.logger.error('[UserService] Get subscription failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'UserService', action: 'getSubscription' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Get subscription status
     * @returns {string|null} Subscription status
     */
    getSubscriptionStatus() {
        const user = this.getCurrentUser();
        return user?.subscription_status || null;
    }
    
    /**
     * Get plan type
     * @returns {string|null} Plan type
     */
    getPlanType() {
        const user = this.getCurrentUser();
        return user?.plan_type || null;
    }
    
    /**
     * Check if user has active subscription
     * @returns {boolean} Has active subscription
     */
    hasActiveSubscription() {
        return this.getSubscriptionStatus() === 'active';
    }
    
    /**
     * Check if user is on specific plan
     * @param {string} planType - Plan type to check
     * @returns {boolean} Is on plan
     */
    isOnPlan(planType) {
        return this.getPlanType() === planType;
    }
    
    /**
     * Check if user is on free plan
     * @returns {boolean} Is on free plan
     */
    isFreePlan() {
        return this.isOnPlan('free') || !this.getPlanType();
    }
    
    /**
     * Check if user is on pro plan
     * @returns {boolean} Is on pro plan
     */
    isProPlan() {
        return this.isOnPlan('pro');
    }
    
    /**
     * Check if user is on enterprise plan
     * @returns {boolean} Is on enterprise plan
     */
    isEnterprisePlan() {
        return this.isOnPlan('enterprise');
    }
    
    // =========================================================================
    // CREDITS MANAGEMENT
    // =========================================================================
    
    /**
     * Get user credits
     * @returns {number} Credits remaining
     */
    getUserCredits() {
        const user = this.getCurrentUser();
        return user?.credits || 0;
    }
    
    /**
     * Update user credits in state
     * @param {number} credits - New credit amount
     */
    updateCredits(credits) {
        const user = this.getCurrentUser();
        if (user) {
            user.credits = credits;
            this.stateManager.setState('auth.user', user);
        }
    }
    
    /**
     * Deduct credits
     * @param {number} amount - Amount to deduct
     * @returns {number} New credit amount
     */
    deductCredits(amount) {
        const current = this.getUserCredits();
        const newAmount = Math.max(0, current - amount);
        this.updateCredits(newAmount);
        return newAmount;
    }
    
    /**
     * Add credits
     * @param {number} amount - Amount to add
     * @returns {number} New credit amount
     */
    addCredits(amount) {
        const current = this.getUserCredits();
        const newAmount = current + amount;
        this.updateCredits(newAmount);
        return newAmount;
    }
    
    /**
     * Check if user has enough credits
     * @param {number} required - Required credits
     * @returns {boolean} Has enough credits
     */
    hasEnoughCredits(required) {
        return this.getUserCredits() >= required;
    }
    
    // =========================================================================
    // PERMISSIONS
    // =========================================================================
    
    /**
     * Get user permissions based on plan
     * @returns {Object} Permissions
     */
    getUserPermissions() {
        const planType = this.getPlanType() || 'free';
        
        const permissions = {
            free: {
                canCreateLeads: true,
                canAnalyzeLeads: false,
                canExportLeads: false,
                canAccessAnalytics: false,
                canManageTeam: false,
                maxBusinesses: 1,
                maxLeadsPerMonth: 100,
                maxAnalysisPerDay: 0
            },
            pro: {
                canCreateLeads: true,
                canAnalyzeLeads: true,
                canExportLeads: true,
                canAccessAnalytics: true,
                canManageTeam: false,
                maxBusinesses: 5,
                maxLeadsPerMonth: 1000,
                maxAnalysisPerDay: 50
            },
            enterprise: {
                canCreateLeads: true,
                canAnalyzeLeads: true,
                canExportLeads: true,
                canAccessAnalytics: true,
                canManageTeam: true,
                maxBusinesses: Infinity,
                maxLeadsPerMonth: Infinity,
                maxAnalysisPerDay: Infinity
            }
        };
        
        return permissions[planType] || permissions.free;
    }
    
    /**
     * Check if user can perform action
     * @param {string} action - Action to check
     * @returns {boolean} Can perform action
     */
    canPerformAction(action) {
        const permissions = this.getUserPermissions();
        return permissions[action] === true;
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate profile updates
     * @param {Object} updates - Updates to validate
     * @throws {Error} Validation error
     */
    validateProfileUpdates(updates) {
        const errors = [];
        
        if (updates.email && !this.isValidEmail(updates.email)) {
            errors.push('Invalid email format');
        }
        
        if (updates.name && updates.name.trim().length === 0) {
            errors.push('Name cannot be empty');
        }
        
        if (updates.name && updates.name.length > 100) {
            errors.push('Name must be less than 100 characters');
        }
        
        if (errors.length > 0) {
            throw new Error('Validation failed: ' + errors.join(', '));
        }
    }
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // =========================================================================
    // ACCOUNT ACTIONS
    // =========================================================================
    
    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} Success
     */
    async changePassword(currentPassword, newPassword) {
        try {
            this.logger.info('[UserService] Changing password');
            
            // Validate password strength
            this.validatePassword(newPassword);
            
            // Use Supabase to change password
            const { error } = await this.authManager.supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                throw error;
            }
            
            this.logger.info('[UserService] Password changed successfully');
            
            return true;
            
        } catch (error) {
            this.logger.error('[UserService] Change password failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'UserService', action: 'changePassword' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Validate password strength
     */
    validatePassword(password) {
        if (!password || password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        
        if (!/[a-z]/.test(password)) {
            throw new Error('Password must contain lowercase letters');
        }
        
        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must contain uppercase letters');
        }
        
        if (!/[0-9]/.test(password)) {
            throw new Error('Password must contain numbers');
        }
    }
    
    /**
     * Request password reset
     * @param {string} email - User email
     * @returns {Promise<boolean>} Success
     */
    async requestPasswordReset(email) {
        try {
            this.logger.info('[UserService] Requesting password reset', { email });
            
            const { error } = await this.authManager.supabase.auth.resetPasswordForEmail(email);
            
            if (error) {
                throw error;
            }
            
            this.logger.info('[UserService] Password reset email sent');
            
            return true;
            
        } catch (error) {
            this.logger.error('[UserService] Request password reset failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'UserService', action: 'requestPasswordReset' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Get user display name
     * @returns {string} Display name
     */
    getUserDisplayName() {
        const user = this.getCurrentUser();
        return user?.name || user?.email || 'User';
    }
    
    /**
     * Get user initials
     * @returns {string} Initials
     */
    getUserInitials() {
        const name = this.getUserDisplayName();
        const parts = name.split(' ');
        
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        
        return name.substring(0, 2).toUpperCase();
    }
    
    /**
     * Check if user is authenticated
     * @returns {boolean} Is authenticated
     */
    isAuthenticated() {
        return this.authManager.isAuthenticated();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    destroy() {
        this.isInitialized = false;
        this.logger.info('[UserService] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
// ES6 Module Export
export default UserService;
window.OsliraUserService = UserService;

console.log('✅ [UserService] Class loaded and ready');
