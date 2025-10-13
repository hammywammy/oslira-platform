// =============================================================================
// LEAD DISPLAY USE CASE - Orchestration Layer
// Path: /public/pages/app/dashboard/application/leads/LeadDisplayUseCase.js
// Dependencies: LeadService, LeadsTableRenderer, StateManager, EventBus
// =============================================================================

/**
 * @class LeadDisplayUseCase
 * @description Orchestrates lead display - coordinates service + renderer + state
 * 
 * Responsibilities:
 * - Get data from state
 * - Call service for business logic
 * - Call renderer for HTML
 * - Update DOM
 * - Handle events
 */
class LeadDisplayUseCase {
    constructor() {
        // Core dependencies
        this.eventBus = window.OsliraEventBus;
        this.stateManager = window.OsliraStateManager;
        this.osliraAuth = window.OsliraAuth;
        this.logger = window.OsliraLogger;
        
        // Injected services
        this.leadService = new window.LeadService();
        this.renderer = new window.LeadsTableRenderer(this.leadService);
        
        // Validate dependencies
        if (!this.eventBus || !this.stateManager || !this.osliraAuth) {
            throw new Error('[LeadDisplayUseCase] Missing required Core dependencies');
        }
        
        // Performance caching
        this.renderCache = new Map();
        this.dateFormatCache = new Map();
        this.maxCacheSize = 1000;
        
        // Pagination state
        this.currentPage = 1;
        this.leadsPerPage = 10;
        
        // Debounce timers
        this.renderTimeout = null;
        this.cleanupInterval = null;
        
        // State tracking
        this.isRendering = false;
        this.lastRenderTime = null;
        
        console.log('🚀 [LeadDisplayUseCase] Initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async init() {
        try {
            // Setup state subscriptions with error boundaries
            this.setupStateSubscriptions();
            
            // Setup periodic cache cleanup
            this.setupCacheCleanup();
            
            // Setup accessibility
            this.setupAccessibility();
            
            // Make available globally for pagination
            window.leadRenderer = this;
            
            console.log('✅ [LeadDisplayUseCase] Event listeners initialized');
            return true;
            
        } catch (error) {
            console.error('❌ [LeadDisplayUseCase] Initialization failed:', error);
            this.logger?.error('[LeadDisplayUseCase] Init failed', error);
            throw error;
        }
    }
    
    setupStateSubscriptions() {
        // Leads data changes
        this.stateManager.subscribe('leads', (leads) => {
            try {
                this.handleLeadsChanged(leads);
            } catch (error) {
                console.error('❌ [LeadDisplayUseCase] Leads change handler failed:', error);
            }
        });
        
        // Filtered leads changes
        this.stateManager.subscribe('filteredLeads', (leads) => {
            try {
                this.handleFilteredLeadsChanged(leads);
            } catch (error) {
                console.error('❌ [LeadDisplayUseCase] Filtered leads handler failed:', error);
            }
        });
        
        // Selection changes
        this.stateManager.subscribe('selectedLeads', (selection) => {
            try {
                this.handleSelectionChanged(selection);
            } catch (error) {
                console.error('❌ [LeadDisplayUseCase] Selection handler failed:', error);
            }
        });
    }
    
    setupCacheCleanup() {
        // Clean up old cache entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            if (this.renderCache.size > this.maxCacheSize) {
                const entriesToDelete = this.renderCache.size - this.maxCacheSize;
                const keys = Array.from(this.renderCache.keys());
                for (let i = 0; i < entriesToDelete; i++) {
                    this.renderCache.delete(keys[i]);
                }
                console.log(`🧹 [LeadDisplayUseCase] Cleaned ${entriesToDelete} cache entries`);
            }
            
            // Clean date cache
            if (this.dateFormatCache.size > 500) {
                this.dateFormatCache.clear();
            }
        }, 5 * 60 * 1000);
    }
    
    setupAccessibility() {
        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.leads-table')) {
                this.handleKeyboardNavigation(e);
            }
        });
    }
    
    // =========================================================================
    // EVENT HANDLERS (Debounced for Performance)
    // =========================================================================
    
    handleLeadsChanged(leads) {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.renderTimeout = setTimeout(() => {
            console.log('🔄 [LeadDisplayUseCase] Leads data changed, re-rendering');
            this.displayLeads(leads);
            this.renderTimeout = null;
        }, 50);
    }
    
    handleFilteredLeadsChanged(filteredLeads) {
        console.log('🔄 [LeadDisplayUseCase] Filtered leads changed, resetting to page 1');
        this.currentPage = 1;
        this.displayLeads(filteredLeads);
    }
    
    handleSelectionChanged(selectedLeads) {
        console.log('🔄 [LeadDisplayUseCase] Selection changed, updating UI');
        this.updateBulkActionsVisibility(selectedLeads?.size > 0);
        this.updateSelectionUI();
    }
    
    // =========================================================================
    // MAIN ORCHESTRATION
    // =========================================================================
    
    displayLeads(leads = null) {
        // Prevent concurrent renders
        if (this.isRendering) {
            console.log('⚠️ [LeadDisplayUseCase] Render already in progress');
            return;
        }
        
        this.isRendering = true;
        const renderStartTime = performance.now();
        
        try {
            // Determine leads to display
            const leadsToDisplay = leads || 
                                  this.stateManager.getState('visibleLeads') || 
                                  this.stateManager.getState('filteredLeads') || 
                                  this.stateManager.getState('leads') || [];
            
            let tableBody = document.getElementById('leads-table-body');
            const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
            
            console.log('🔍 [LeadDisplayUseCase] Rendering:', {
                leadsToDisplay: leadsToDisplay.length,
                isLoading: this.stateManager.getState('isLoading'),
                tableBodyExists: !!tableBody,
                page: this.currentPage
            });
            
            // Ensure table structure exists
            if (!tableBody) {
                this.createTableStructureIfMissing();
                tableBody = document.getElementById('leads-table-body');
                if (!tableBody) {
                    throw new Error('Could not create table structure');
                }
            }
            
            // Handle loading state
            if (this.stateManager.getState('isLoading')) {
                this.renderLoadingState(tableBody);
                return;
            }
            
            // Handle empty state
            if (leadsToDisplay.length === 0) {
                this.renderEmptyState(tableBody);
                this.updateLeadCounts(0, 0);
                this.renderPagination(0, 0);
                return;
            }
            
            // Calculate pagination
            const pagination = this.calculatePagination(leadsToDisplay);
            
            // Store current scroll position
            const currentScroll = window.scrollY;
            
            // Render paginated leads using renderer
            const html = this.renderer.render(
                pagination.paginatedLeads,
                selectedLeads,
                this.renderCache,
                this.dateFormatCache
            );
            tableBody.innerHTML = html;
            
            // Render pagination controls
            this.renderPagination(pagination.totalLeads, pagination.totalPages);
            
            // Restore scroll position
            requestAnimationFrame(() => {
                window.scrollTo(0, currentScroll);
            });
            
            // Update UI elements
            this.updateLeadCounts(leadsToDisplay.length, selectedLeads.size);
            this.updateBulkActionsVisibility(selectedLeads.size > 0);
            
            // Emit completion event
            this.eventBus.emit('leads:rendered', {
                count: leadsToDisplay.length,
                selected: selectedLeads.size,
                renderTime: performance.now() - renderStartTime
            });
            
            // Track performance
            this.lastRenderTime = performance.now() - renderStartTime;
            console.log(`✅ [LeadDisplayUseCase] Rendered in ${this.lastRenderTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error('❌ [LeadDisplayUseCase] Render failed:', error);
            this.logger?.error('[LeadDisplayUseCase] Display failed', error);
            this.handleRenderError(error);
        } finally {
            this.isRendering = false;
        }
    }
    
    calculatePagination(leads) {
        const totalLeads = leads.length;
        const totalPages = Math.ceil(totalLeads / this.leadsPerPage);
        const startIndex = (this.currentPage - 1) * this.leadsPerPage;
        const endIndex = Math.min(startIndex + this.leadsPerPage, totalLeads);
        const paginatedLeads = leads.slice(startIndex, endIndex);
        
        return {
            totalLeads,
            totalPages,
            startIndex,
            endIndex,
            paginatedLeads
        };
    }
    
    // =========================================================================
    // UI UPDATES
    // =========================================================================
    
    updateLeadCounts(visibleCount, selectedCount) {
        const allLeads = this.stateManager.getState('leads') || [];
        const actualTotal = allLeads.length;
        
        const resultsCount = document.getElementById('results-count');
        const totalCountEl = document.getElementById('total-count');
        const leadCountDisplay = document.getElementById('lead-count-display');
        
        if (resultsCount) resultsCount.textContent = `Showing ${visibleCount} leads`;
        if (totalCountEl) totalCountEl.textContent = `Total: ${actualTotal}`;
        if (leadCountDisplay) {
            leadCountDisplay.textContent = actualTotal === 0 ? 'No leads in pipeline' :
                                          actualTotal === 1 ? '1 lead in pipeline' :
                                          `${actualTotal} leads in pipeline`;
        }
    }
    
    updateBulkActionsVisibility(show) {
        const toolbar = document.getElementById('bulk-actions-toolbar');
        const selectionCount = document.getElementById('selection-count');
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        
        if (toolbar) {
            toolbar.classList.toggle('hidden', !show || selectedLeads.size === 0);
            if (selectionCount && selectedLeads.size > 0) {
                selectionCount.textContent = `${selectedLeads.size} selected`;
            }
        }
    }
    
    updateSelectionUI() {
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        const checkboxes = document.querySelectorAll('.lead-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectedLeads.has(checkbox.dataset.leadId);
        });
    }
    
    // =========================================================================
    // PAGINATION
    // =========================================================================
    
    renderPagination(totalLeads, totalPages) {
        const paginationStart = document.getElementById('pagination-start');
        const paginationTotal = document.getElementById('pagination-total');
        const paginationControls = document.getElementById('pagination-controls');
        
        if (!paginationStart || !paginationTotal || !paginationControls) return;
        
        const startIndex = (this.currentPage - 1) * this.leadsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.leadsPerPage, totalLeads);
        
        paginationStart.textContent = totalLeads > 0 ? `${startIndex}-${endIndex}` : '0';
        paginationTotal.textContent = totalLeads;
        
        if (totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }
        
        // Get HTML from renderer
        const paginationHTML = this.renderer.renderPaginationControls(this.currentPage, totalPages);
        paginationControls.innerHTML = paginationHTML;
    }
    
    goToPage(pageNumber) {
        const leadsToDisplay = this.stateManager.getState('visibleLeads') || 
                              this.stateManager.getState('filteredLeads') || 
                              this.stateManager.getState('leads') || [];
        
        const totalPages = Math.ceil(leadsToDisplay.length / this.leadsPerPage);
        
        if (pageNumber < 1 || pageNumber > totalPages) return;
        
        this.currentPage = pageNumber;
        
        const tableContainer = document.querySelector('.leads-table-container');
        if (tableContainer) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        this.displayLeads();
    }
    
    // =========================================================================
    // STATE RENDERING
    // =========================================================================
    
    renderLoadingState(tableBody) {
        const html = this.renderer.renderLoadingState();
        tableBody.innerHTML = html;
    }
    
    renderEmptyState(tableBody) {
        const html = this.renderer.renderEmptyState();
        tableBody.innerHTML = html;
    }
    
    handleRenderError(error) {
        const tableBody = document.getElementById('leads-table-body');
        if (!tableBody) return;
        
        const html = this.renderer.renderErrorState();
        tableBody.innerHTML = html;
    }
    
    createTableStructureIfMissing() {
        const leadsContainer = document.querySelector('.leads-table-container');
        if (!leadsContainer) {
            console.error('❌ [LeadDisplayUseCase] Leads container not found');
            return;
        }
        
        const html = this.renderer.createTableStructure();
        leadsContainer.innerHTML = html;
        console.log('✅ [LeadDisplayUseCase] Table structure created');
    }
    
    // =========================================================================
    // ACCESSIBILITY
    // =========================================================================
    
    handleKeyboardNavigation(event) {
        const { key, target } = event;
        const currentRow = target.closest('tr');
        if (!currentRow) return;
        
        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                currentRow.nextElementSibling?.querySelector('input, button')?.focus();
                break;
            case 'ArrowUp':
                event.preventDefault();
                currentRow.previousElementSibling?.querySelector('input, button')?.focus();
                break;
            case 'Space':
                if (target.type === 'checkbox') {
                    event.preventDefault();
                    target.checked = !target.checked;
                    target.dispatchEvent(new Event('change'));
                }
                break;
        }
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.renderCache.clear();
        this.dateFormatCache.clear();
        
        console.log('🧹 [LeadDisplayUseCase] Cleanup completed');
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    getDebugInfo() {
        return {
            isRendering: this.isRendering,
            lastRenderTime: this.lastRenderTime,
            currentPage: this.currentPage,
            cacheSize: this.renderCache.size,
            dateCacheSize: this.dateFormatCache.size,
            hasDependencies: {
                eventBus: !!this.eventBus,
                stateManager: !!this.stateManager,
                osliraAuth: !!this.osliraAuth,
                logger: !!this.logger
            }
        };
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================

// ES6 Module Export
export default LeadDisplayUseCase;
window.LeadDisplayUseCase = LeadDisplayUseCase;

// ✅ BACKWARD COMPATIBILITY: Keep old name working
window.LeadRenderer = LeadDisplayUseCase;

console.log('✅ [LeadDisplayUseCase] Loaded');
