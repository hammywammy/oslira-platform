// =============================================================================
// BUSINESS SERVICE - Business Profile Business Logic
// Path: /public/core/services/BusinessService.js
// Dependencies: BusinessAPI, StateManager, EventBus, Logger
// =============================================================================

/**
 * @class BusinessService
 * @description Business logic for business profile management
 * 
 * Features:
 * - Business CRUD operations
 * - Profile validation
 * - Profile formatting
 * - Business selection
 * - Settings management
 */
class BusinessService {
    constructor(businessAPI, stateManager, eventBus, logger) {
        if (!businessAPI) throw new Error('[BusinessService] BusinessAPI required');
        if (!stateManager) throw new Error('[BusinessService] StateManager required');
        if (!eventBus) throw new Error('[BusinessService] EventBus required');
        if (!logger) throw new Error('[BusinessService] Logger required');
        
        this.businessAPI = businessAPI;
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.logger = logger;
        
        this.isInitialized = false;
        
        console.log('🏢 [BusinessService] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('[BusinessService] Already initialized');
            return;
        }
        
        try {
            // Load user's businesses
            await this.loadUserBusinesses();
            
            // Subscribe to auth events
            this.setupEventListeners();
            
            this.isInitialized = true;
            this.logger.info('[BusinessService] Initialized');
            
        } catch (error) {
            this.logger.error('[BusinessService] Initialization failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'BusinessService', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    setupEventListeners() {
        // Listen for auth changes
        this.eventBus.on('auth:signed-in', async () => {
            await this.loadUserBusinesses();
        });
        
        this.eventBus.on('auth:signed-out', () => {
            this.clearBusinesses();
        });
    }
    
    // =========================================================================
    // BUSINESS LOADING
    // =========================================================================
    
    /**
     * Load user's businesses
     * @returns {Promise<Array>} Businesses
     */
    async loadUserBusinesses() {
        try {
            this.logger.info('[BusinessService] Loading user businesses');
            
            const user = this.stateManager.getState('auth.user');
            
            if (!user) {
                this.logger.warn('[BusinessService] No user found');
                return [];
            }
            
            // Fetch from API
            const businesses = await this.businessAPI.getUserBusinesses(user.id);
            
            // Update state
            this.stateManager.setState('business.all', businesses);
            
            // Auto-select first business if none selected
            const selected = this.stateManager.getState('business.selected');
            if (!selected && businesses.length > 0) {
                await this.selectBusiness(businesses[0].id);
            }
            
            this.logger.info('[BusinessService] Businesses loaded', { count: businesses.length });
            
            return businesses;
            
        } catch (error) {
            this.logger.error('[BusinessService] Load businesses failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'BusinessService', action: 'loadBusinesses' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Refresh businesses
     */
    async refreshBusinesses() {
        return await this.loadUserBusinesses();
    }
    
    /**
     * Clear businesses from state
     */
    clearBusinesses() {
        this.stateManager.setState('business.all', []);
        this.stateManager.setState('business.selected', null);
    }
    
    // =========================================================================
    // BUSINESS CRUD
    // =========================================================================
    
    /**
     * Create new business
     * @param {Object} businessData - Business data
     * @returns {Promise<Object>} Created business
     */
    async createBusiness(businessData) {
        try {
            this.logger.info('[BusinessService] Creating business', { businessData });
            
            // Validate data
            this.validateBusinessData(businessData);
            
            // Format data
            const formatted = this.formatBusinessData(businessData);
            
            // Create via API
            const business = await this.businessAPI.createBusiness(formatted);
            
            // Add to state
            const allBusinesses = this.stateManager.getState('business.all') || [];
            this.stateManager.setState('business.all', [...allBusinesses, business]);
            
            // Auto-select if first business
            if (allBusinesses.length === 0) {
                await this.selectBusiness(business.id);
            }
            
            // Emit event
            this.eventBus.emit('business:created', { business });
            
            this.logger.info('[BusinessService] Business created', { businessId: business.id });
            
            return business;
            
        } catch (error) {
            this.logger.error('[BusinessService] Create business failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'BusinessService', action: 'createBusiness' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Update business
     * @param {string} businessId - Business ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Updated business
     */
    async updateBusiness(businessId, updates) {
        try {
            this.logger.info('[BusinessService] Updating business', { businessId, updates });
            
            // Format updates
            const formatted = this.formatBusinessData(updates);
            
            // Update via API
            const updatedBusiness = await this.businessAPI.updateBusiness(businessId, formatted);
            
            // Update in state
            const allBusinesses = this.stateManager.getState('business.all') || [];
            const updatedBusinesses = allBusinesses.map(business => 
                business.id === businessId ? updatedBusiness : business
            );
            this.stateManager.setState('business.all', updatedBusinesses);
            
            // Update selected if it's the current one
            const selected = this.stateManager.getState('business.selected');
            if (selected && selected.id === businessId) {
                this.stateManager.setState('business.selected', updatedBusiness);
            }
            
            // Emit event
            this.eventBus.emit('business:updated', { business: updatedBusiness });
            
            this.logger.info('[BusinessService] Business updated', { businessId });
            
            return updatedBusiness;
            
        } catch (error) {
            this.logger.error('[BusinessService] Update business failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'BusinessService', action: 'updateBusiness' },
                    extra: { businessId }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Delete business
     * @param {string} businessId - Business ID
     * @returns {Promise<boolean>} Success
     */
    async deleteBusiness(businessId) {
        try {
            this.logger.info('[BusinessService] Deleting business', { businessId });
            
            // Delete via API
            await this.businessAPI.deleteBusiness(businessId);
            
            // Remove from state
            const allBusinesses = this.stateManager.getState('business.all') || [];
            const filteredBusinesses = allBusinesses.filter(business => business.id !== businessId);
            this.stateManager.setState('business.all', filteredBusinesses);
            
            // Clear selection if deleted business was selected
            const selected = this.stateManager.getState('business.selected');
            if (selected && selected.id === businessId) {
                if (filteredBusinesses.length > 0) {
                    await this.selectBusiness(filteredBusinesses[0].id);
                } else {
                    this.stateManager.setState('business.selected', null);
                }
            }
            
            // Emit event
            this.eventBus.emit('business:deleted', { businessId });
            
            this.logger.info('[BusinessService] Business deleted', { businessId });
            
            return true;
            
        } catch (error) {
            this.logger.error('[BusinessService] Delete business failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'BusinessService', action: 'deleteBusiness' },
                    extra: { businessId }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // BUSINESS SELECTION
    // =========================================================================
    
    /**
     * Select business
     * @param {string} businessId - Business ID
     * @returns {Promise<Object>} Selected business
     */
    async selectBusiness(businessId) {
        try {
            this.logger.info('[BusinessService] Selecting business', { businessId });
            
            // Get business from state
            const allBusinesses = this.stateManager.getState('business.all') || [];
            const business = allBusinesses.find(b => b.id === businessId);
            
            if (!business) {
                throw new Error(`Business not found: ${businessId}`);
            }
            
            // Update state
            this.stateManager.setState('business.selected', business);
            
            // Save to localStorage for persistence
            localStorage.setItem('selectedBusinessId', businessId);
            
            // Emit event
            this.eventBus.emit('business:selected', { businessId, business });
            this.eventBus.emit('business:changed', { businessId, business });
            
            this.logger.info('[BusinessService] Business selected', { businessId });
            
            return business;
            
        } catch (error) {
            this.logger.error('[BusinessService] Select business failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'BusinessService', action: 'selectBusiness' },
                    extra: { businessId }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Get selected business
     * @returns {Object|null} Selected business
     */
    getSelectedBusiness() {
        return this.stateManager.getState('business.selected');
    }
    
    /**
     * Get selected business ID
     * @returns {string|null} Business ID
     */
    getSelectedBusinessId() {
        const business = this.getSelectedBusiness();
        return business ? business.id : null;
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate business data
     * @param {Object} businessData - Data to validate
     * @throws {Error} Validation error
     */
    validateBusinessData(businessData) {
        const errors = [];
        
        if (!businessData.name || businessData.name.trim().length === 0) {
            errors.push('Business name is required');
        }
        
        if (businessData.name && businessData.name.length > 100) {
            errors.push('Business name must be less than 100 characters');
        }
        
        if (businessData.instagram_username && !this.isValidInstagramUsername(businessData.instagram_username)) {
            errors.push('Invalid Instagram username format');
        }
        
        if (businessData.website && !this.isValidURL(businessData.website)) {
            errors.push('Invalid website URL format');
        }
        
        if (businessData.email && !this.isValidEmail(businessData.email)) {
            errors.push('Invalid email format');
        }
        
        if (errors.length > 0) {
            throw new Error('Validation failed: ' + errors.join(', '));
        }
    }
    
    /**
     * Validate Instagram username
     */
    isValidInstagramUsername(username) {
        if (!username) return true; // Optional field
        const cleaned = username.replace('@', '');
        return /^[a-zA-Z0-9._]{1,30}$/.test(cleaned);
    }
    
    /**
     * Validate URL
     */
    isValidURL(url) {
        if (!url) return true; // Optional field
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Validate email
     */
    isValidEmail(email) {
        if (!email) return true; // Optional field
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // =========================================================================
    // FORMATTING
    // =========================================================================
    
    /**
     * Format business data
     * @param {Object} businessData - Data to format
     * @returns {Object} Formatted data
     */
    formatBusinessData(businessData) {
        const formatted = { ...businessData };
        
        // Trim string fields
        if (formatted.name) {
            formatted.name = formatted.name.trim();
        }
        
        if (formatted.description) {
            formatted.description = formatted.description.trim();
        }
        
        // Normalize Instagram username
        if (formatted.instagram_username) {
            formatted.instagram_username = formatted.instagram_username
                .trim()
                .replace('@', '')
                .toLowerCase();
        }
        
        // Normalize website URL
        if (formatted.website) {
            formatted.website = this.normalizeURL(formatted.website);
        }
        
        // Normalize email
        if (formatted.email) {
            formatted.email = formatted.email.trim().toLowerCase();
        }
        
        return formatted;
    }
    
    /**
     * Normalize URL (add https:// if missing)
     */
    normalizeURL(url) {
        if (!url) return url;
        
        url = url.trim();
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        return url;
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Get business by ID
     * @param {string} businessId - Business ID
     * @returns {Object|null} Business
     */
    getBusinessById(businessId) {
        const allBusinesses = this.stateManager.getState('business.all') || [];
        return allBusinesses.find(b => b.id === businessId) || null;
    }
    
    /**
     * Check if user has businesses
     * @returns {boolean} Has businesses
     */
    hasBusinesses() {
        const businesses = this.stateManager.getState('business.all') || [];
        return businesses.length > 0;
    }
    
    /**
     * Get business count
     * @returns {number} Count
     */
    getBusinessCount() {
        const businesses = this.stateManager.getState('business.all') || [];
        return businesses.length;
    }
    
    /**
     * Get all businesses
     * @returns {Array} Businesses
     */
    getAllBusinesses() {
        return this.stateManager.getState('business.all') || [];
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    destroy() {
        this.eventBus.off('auth:signed-in');
        this.eventBus.off('auth:signed-out');
        this.isInitialized = false;
        this.logger.info('[BusinessService] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraBusinessService = BusinessService;
export default BusinessService;
console.log('✅ [BusinessService] Class loaded and ready');
