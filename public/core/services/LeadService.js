// =============================================================================
// LEAD SERVICE - Lead Business Logic
// Path: /public/core/services/LeadService.js
// Dependencies: LeadsAPI, StateManager, EventBus, Logger
// =============================================================================

/**
 * @class LeadService
 * @description Business logic for lead management
 * 
 * Features:
 * - Lead CRUD operations
 * - Lead scoring and filtering
 * - Lead sorting and searching
 * - Deduplication
 * - Batch operations
 * - Analytics calculations
 */
class LeadService {
    constructor(leadsAPI, stateManager, eventBus, logger) {
        if (!leadsAPI) throw new Error('[LeadService] LeadsAPI required');
        if (!stateManager) throw new Error('[LeadService] StateManager required');
        if (!eventBus) throw new Error('[LeadService] EventBus required');
        if (!logger) throw new Error('[LeadService] Logger required');
        
        this.leadsAPI = leadsAPI;
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.logger = logger;
        
        this.isInitialized = false;
        
        // Score thresholds
        this.scoreThresholds = {
            high: 70,
            medium: 40,
            low: 0
        };
        
        console.log('📊 [LeadService] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('[LeadService] Already initialized');
            return;
        }
        
        try {
            // Subscribe to relevant events
            this.setupEventListeners();
            
            this.isInitialized = true;
            this.logger.info('[LeadService] Initialized');
            
        } catch (error) {
            this.logger.error('[LeadService] Initialization failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'LeadService', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    setupEventListeners() {
        // Listen for business changes to reload leads
        this.eventBus.on('business:changed', async (data) => {
            await this.loadLeadsForBusiness(data.businessId);
        });
        
        // Listen for auth changes
        this.eventBus.on('auth:signed-out', () => {
            this.clearLeads();
        });
    }
    
    // =========================================================================
    // LEAD LOADING
    // =========================================================================
    
    /**
     * Load leads for business
     * @param {string} businessId - Business ID
     * @param {Object} options - Load options
     * @returns {Promise<Array>} Leads
     */
    async loadLeadsForBusiness(businessId, options = {}) {
        if (!businessId) {
            throw new Error('Business ID is required');
        }
        
        try {
            this.logger.info('[LeadService] Loading leads', { businessId });
            
            // Set loading state
            this.stateManager.setState('ui.loading', true);
            
            // Fetch from API
            const leads = await this.leadsAPI.getLeads(businessId, options);
            
            // Update state
            this.stateManager.setState('leads.all', leads);
            this.stateManager.setState('leads.filtered', leads);
            
            // Emit event
            this.eventBus.emit('lead:loaded', { businessId, count: leads.length });
            
            this.logger.info('[LeadService] Leads loaded', { count: leads.length });
            
            return leads;
            
        } catch (error) {
            this.logger.error('[LeadService] Load leads failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'LeadService', action: 'loadLeads' },
                    extra: { businessId }
                });
            }
            
            throw error;
        } finally {
            this.stateManager.setState('ui.loading', false);
        }
    }
    
    /**
     * Refresh current leads
     */
    async refreshLeads() {
        const selectedBusiness = this.stateManager.getState('business.selected');
        
        if (!selectedBusiness) {
            this.logger.warn('[LeadService] No business selected');
            return;
        }
        
        return await this.loadLeadsForBusiness(selectedBusiness.id);
    }
    
    /**
     * Clear all leads from state
     */
    clearLeads() {
        this.stateManager.setState('leads.all', []);
        this.stateManager.setState('leads.filtered', []);
        this.stateManager.setState('leads.selected', []);
    }
    
    // =========================================================================
    // LEAD CRUD
    // =========================================================================
    
    /**
     * Create new lead
     * @param {Object} leadData - Lead data
     * @returns {Promise<Object>} Created lead
     */
    async createLead(leadData) {
        try {
            this.logger.info('[LeadService] Creating lead', { leadData });
            
            // Validate required fields
            this.validateLeadData(leadData);
            
            // Create via API
            const lead = await this.leadsAPI.createLead(leadData);
            
            // Add to state
            const allLeads = this.stateManager.getState('leads.all') || [];
            this.stateManager.setState('leads.all', [lead, ...allLeads]);
            
            // Update filtered
            this.applyCurrentFilters();
            
            // Emit event
            this.eventBus.emit('lead:created', { lead });
            
            this.logger.info('[LeadService] Lead created', { leadId: lead.id });
            
            return lead;
            
        } catch (error) {
            this.logger.error('[LeadService] Create lead failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'LeadService', action: 'createLead' }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Update lead
     * @param {string} leadId - Lead ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Updated lead
     */
    async updateLead(leadId, updates) {
        try {
            this.logger.info('[LeadService] Updating lead', { leadId, updates });
            
            // Update via API
            const updatedLead = await this.leadsAPI.updateLead(leadId, updates);
            
            // Update in state
            const allLeads = this.stateManager.getState('leads.all') || [];
            const updatedLeads = allLeads.map(lead => 
                lead.id === leadId ? updatedLead : lead
            );
            this.stateManager.setState('leads.all', updatedLeads);
            
            // Update filtered
            this.applyCurrentFilters();
            
            // Emit event
            this.eventBus.emit('lead:updated', { lead: updatedLead });
            
            this.logger.info('[LeadService] Lead updated', { leadId });
            
            return updatedLead;
            
        } catch (error) {
            this.logger.error('[LeadService] Update lead failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'LeadService', action: 'updateLead' },
                    extra: { leadId }
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Delete lead
     * @param {string} leadId - Lead ID
     * @returns {Promise<boolean>} Success
     */
    async deleteLead(leadId) {
        try {
            this.logger.info('[LeadService] Deleting lead', { leadId });
            
            // Delete via API
            await this.leadsAPI.deleteLead(leadId);
            
            // Remove from state
            const allLeads = this.stateManager.getState('leads.all') || [];
            const filteredLeads = allLeads.filter(lead => lead.id !== leadId);
            this.stateManager.setState('leads.all', filteredLeads);
            
            // Update filtered
            this.applyCurrentFilters();
            
            // Emit event
            this.eventBus.emit('lead:deleted', { leadId });
            
            this.logger.info('[LeadService] Lead deleted', { leadId });
            
            return true;
            
        } catch (error) {
            this.logger.error('[LeadService] Delete lead failed', error);
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'LeadService', action: 'deleteLead' },
                    extra: { leadId }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // LEAD ANALYSIS
    // =========================================================================
    
    /**
     * Analyze lead
     * @param {string} leadId - Lead ID
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeLead(leadId) {
        try {
            this.logger.info('[LeadService] Analyzing lead', { leadId });
            
            // Emit start event
            this.eventBus.emit('lead:analysis-started', { leadId });
            
            // Analyze via API
            const analysis = await this.leadsAPI.analyzeLead(leadId);
            
            // Update lead in state with new score
            if (analysis.score !== undefined) {
                await this.updateLead(leadId, { score: analysis.score });
            }
            
            // Emit complete event
            this.eventBus.emit('lead:analysis-completed', { leadId, analysis });
            
            this.logger.info('[LeadService] Lead analyzed', { leadId, score: analysis.score });
            
            return analysis;
            
        } catch (error) {
            this.logger.error('[LeadService] Analyze lead failed', error);
            
            // Emit failure event
            this.eventBus.emit('lead:analysis-failed', { leadId, error });
            
            if (window.Sentry) {
                window.Sentry.captureException(error, {
                    tags: { component: 'LeadService', action: 'analyzeLead' },
                    extra: { leadId }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // SCORING
    // =========================================================================
    
    /**
     * Calculate lead quality from score
     * @param {number} score - Lead score
     * @returns {string} Quality level (high/medium/low)
     */
    getLeadQuality(score) {
        if (score >= this.scoreThresholds.high) return 'high';
        if (score >= this.scoreThresholds.medium) return 'medium';
        return 'low';
    }
    
    /**
     * Get leads by quality
     * @param {string} quality - Quality level
     * @returns {Array} Filtered leads
     */
    getLeadsByQuality(quality) {
        const allLeads = this.stateManager.getState('leads.all') || [];
        
        return allLeads.filter(lead => {
            const score = lead.score || 0;
            return this.getLeadQuality(score) === quality;
        });
    }
    
    /**
     * Calculate average lead score
     * @returns {number} Average score
     */
    getAverageScore() {
        const allLeads = this.stateManager.getState('leads.all') || [];
        
        if (allLeads.length === 0) return 0;
        
        const total = allLeads.reduce((sum, lead) => sum + (lead.score || 0), 0);
        return Math.round(total / allLeads.length);
    }
    
    // =========================================================================
    // FILTERING
    // =========================================================================
    
    /**
     * Filter leads
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered leads
     */
    filterLeads(filters) {
        const allLeads = this.stateManager.getState('leads.all') || [];
        
        let filtered = [...allLeads];
        
        // Filter by score range
        if (filters.minScore !== undefined) {
            filtered = filtered.filter(lead => (lead.score || 0) >= filters.minScore);
        }
        
        if (filters.maxScore !== undefined) {
            filtered = filtered.filter(lead => (lead.score || 0) <= filters.maxScore);
        }
        
        // Filter by quality
        if (filters.quality) {
            filtered = filtered.filter(lead => {
                const quality = this.getLeadQuality(lead.score || 0);
                return quality === filters.quality;
            });
        }
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(lead => lead.status === filters.status);
        }
        
        // Filter by search term
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(lead => {
                const searchableFields = [
                    lead.name,
                    lead.username,
                    lead.email,
                    lead.bio
                ].filter(Boolean).join(' ').toLowerCase();
                
                return searchableFields.includes(searchLower);
            });
        }
        
        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filtered = filtered.filter(lead => new Date(lead.created_at) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            filtered = filtered.filter(lead => new Date(lead.created_at) <= endDate);
        }
        
        // Update state
        this.stateManager.setState('leads.filtered', filtered);
        this.stateManager.setState('ui.filters', filters);
        
        // Emit event
        this.eventBus.emit('lead:filtered', { count: filtered.length, filters });
        
        return filtered;
    }
    
    /**
     * Clear filters
     */
    clearFilters() {
        const allLeads = this.stateManager.getState('leads.all') || [];
        this.stateManager.setState('leads.filtered', allLeads);
        this.stateManager.setState('ui.filters', {});
        
        this.eventBus.emit('lead:filter-cleared');
    }
    
    /**
     * Apply current filters
     */
    applyCurrentFilters() {
        const filters = this.stateManager.getState('ui.filters') || {};
        if (Object.keys(filters).length > 0) {
            this.filterLeads(filters);
        } else {
            const allLeads = this.stateManager.getState('leads.all') || [];
            this.stateManager.setState('leads.filtered', allLeads);
        }
    }
    
    // =========================================================================
    // SORTING
    // =========================================================================
    
    /**
     * Sort leads
     * @param {string} field - Field to sort by
     * @param {string} direction - Sort direction (asc/desc)
     * @returns {Array} Sorted leads
     */
    sortLeads(field, direction = 'desc') {
        const filtered = this.stateManager.getState('leads.filtered') || [];
        
        const sorted = [...filtered].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Handle null/undefined
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Handle dates
            if (field === 'created_at' || field === 'updated_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }
            
            // Handle numbers
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            // Handle strings
            const comparison = String(aVal).localeCompare(String(bVal));
            return direction === 'asc' ? comparison : -comparison;
        });
        
        this.stateManager.setState('leads.filtered', sorted);
        
        this.eventBus.emit('lead:sorted', { field, direction });
        
        return sorted;
    }
    
    // =========================================================================
    // DEDUPLICATION
    // =========================================================================
    
    /**
     * Find duplicate leads
     * @returns {Array} Groups of duplicate leads
     */
    findDuplicates() {
        const allLeads = this.stateManager.getState('leads.all') || [];
        
        const duplicateGroups = [];
        const seen = new Map();
        
        allLeads.forEach(lead => {
            const key = this.getDedupeKey(lead);
            
            if (seen.has(key)) {
                seen.get(key).push(lead);
            } else {
                seen.set(key, [lead]);
            }
        });
        
        // Get only groups with duplicates
        seen.forEach(group => {
            if (group.length > 1) {
                duplicateGroups.push(group);
            }
        });
        
        return duplicateGroups;
    }
    
    /**
     * Get deduplication key for lead
     */
    getDedupeKey(lead) {
        // Use username or email as unique identifier
        return (lead.username || lead.email || '').toLowerCase();
    }
    
    // =========================================================================
    // SELECTION
    // =========================================================================
    
    /**
     * Select lead
     */
    selectLead(leadId) {
        const selected = this.stateManager.getState('leads.selected') || [];
        
        if (!selected.includes(leadId)) {
            this.stateManager.setState('leads.selected', [...selected, leadId]);
            this.eventBus.emit('lead:selected', { leadId });
        }
    }
    
    /**
     * Deselect lead
     */
    deselectLead(leadId) {
        const selected = this.stateManager.getState('leads.selected') || [];
        this.stateManager.setState('leads.selected', selected.filter(id => id !== leadId));
        this.eventBus.emit('lead:deselected', { leadId });
    }
    
    /**
     * Select all leads
     */
    selectAll() {
        const filtered = this.stateManager.getState('leads.filtered') || [];
        const ids = filtered.map(lead => lead.id);
        this.stateManager.setState('leads.selected', ids);
        this.eventBus.emit('lead:select-all', { count: ids.length });
    }
    
    /**
     * Deselect all leads
     */
    deselectAll() {
        this.stateManager.setState('leads.selected', []);
        this.eventBus.emit('lead:deselect-all');
    }
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    /**
     * Validate lead data
     */
    validateLeadData(leadData) {
        const errors = [];
        
        if (!leadData.business_id) {
            errors.push('Business ID is required');
        }
        
        if (!leadData.username && !leadData.email) {
            errors.push('Username or email is required');
        }
        
        if (errors.length > 0) {
            throw new Error('Validation failed: ' + errors.join(', '));
        }
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    destroy() {
        this.eventBus.off('business:changed');
        this.eventBus.off('auth:signed-out');
        this.isInitialized = false;
        this.logger.info('[LeadService] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraLeadService = LeadService;

console.log('✅ [LeadService] Class loaded and ready');
