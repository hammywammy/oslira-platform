// =============================================================================
// BUSINESSES SECTION - Business Performance Analytics
// =============================================================================

class BusinessesSection {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.businesses = [];
        this.pagination = {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0
        };
        this.searchQuery = '';
        this.searchTimeout = null;
        this.selectedBusiness = null;
        
        console.log('🏢 [BusinessesSection] Initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize(container) {
        this.container = container;
        
        try {
            await this.loadBusinesses();
            this.render();
            this.attachEventListeners();
            
            console.log('✅ [BusinessesSection] Section ready');
            
        } catch (error) {
            console.error('❌ [BusinessesSection] Initialization failed:', error);
            this.renderError(error.message);
        }
    }
    
    async refresh() {
        console.log('🔄 [BusinessesSection] Refreshing data...');
        await this.loadBusinesses();
        this.render();
        this.attachEventListeners();
    }
    
    // =========================================================================
    // DATA LOADING
    // =========================================================================
    
 async loadBusinesses() {
    try {
        const { page, limit } = this.pagination;
        const apiUrl = window.OsliraEnv.WORKER_URL || 'https://api.oslira.com';
        const token = window.OsliraAuth.getSession()?.access_token;
        
        const response = await fetch(`${apiUrl}/admin/businesses?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load businesses');
        }

        this.businesses = result.data.businesses;
        this.pagination = result.data.pagination;

        console.log('✅ [BusinessesSection] Businesses loaded:', this.businesses.length);

    } catch (error) {
        console.error('❌ [BusinessesSection] Loading failed:', error);
        throw error;
    }
}
    
async searchBusinesses(query) {
    if (!query || query.length < 2) {
        await this.loadBusinesses();
        return;
    }

    try {
        const apiUrl = window.OsliraEnv.WORKER_URL || 'https://api.oslira.com';
        const token = window.OsliraAuth.getSession()?.access_token;
        
        const response = await fetch(`${apiUrl}/admin/businesses/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Search failed');
        }

        this.businesses = result.data.businesses;
        this.pagination.total = this.businesses.length;

        console.log('✅ [BusinessesSection] Search results:', this.businesses.length);

    } catch (error) {
        console.error('❌ [BusinessesSection] Search failed:', error);
        this.eventBus.emit('admin:show-toast', {
            message: 'Search failed: ' + error.message,
            type: 'error'
        });
    }
}
    
async loadBusinessAnalytics(businessId) {
    try {
        const apiUrl = window.OsliraEnv.WORKER_URL || 'https://api.oslira.com';
        const token = window.OsliraAuth.getSession()?.access_token;
        
        const response = await fetch(`${apiUrl}/admin/businesses/${businessId}/analytics`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load analytics');
        }

        this.selectedBusiness = result.data;
        console.log('✅ [BusinessesSection] Analytics loaded for:', businessId);

        return result.data;

    } catch (error) {
        console.error('❌ [BusinessesSection] Analytics loading failed:', error);
        throw error;
    }
}
    
    // =========================================================================
    // RENDERING
    // =========================================================================
    
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <!-- Section Header -->
            <div class="admin-section-header">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Business Profiles</h1>
                    <p class="text-slate-600 mt-1">Performance analytics and lead insights</p>
                </div>
                <button onclick="window.AdminCore.refreshCurrentSection()" class="btn-secondary">
                    <span class="mr-2">🔄</span>
                    Refresh
                </button>
            </div>
            
            <!-- Search Bar -->
            <div class="admin-search-bar">
                <input 
                    type="text" 
                    id="business-search-input"
                    class="admin-search-input" 
                    placeholder="Search by business name, niche, or owner email..."
                    value="${this.searchQuery}"
                >
                <button class="admin-search-button">
                    <span>🔍</span>
                </button>
            </div>
            
            <!-- Businesses Table -->
            <div class="admin-card">
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Business Name</th>
                                <th>Niche</th>
                                <th>Owner</th>
                                <th>Created</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.businesses.length > 0 ? this.renderBusinessRows() : this.renderEmptyState()}
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                ${this.renderPagination()}
            </div>
        `;
    }
    
    renderBusinessRows() {
        return this.businesses.map(business => {
            const createdDate = new Date(business.created_at).toLocaleDateString();
            const owner = business.users;
            
            return `
                <tr class="admin-table-row" data-business-id="${business.id}">
                    <td>
                        <div class="font-semibold text-slate-900">${business.business_name || 'Unnamed'}</div>
                    </td>
                    <td>
                        <span class="badge badge-blue">${business.business_niche || 'N/A'}</span>
                    </td>
                    <td>
                        <div class="text-sm">
                            <div class="text-slate-900">${owner?.full_name || 'Unknown'}</div>
                            <div class="text-slate-600">${owner?.email || 'N/A'}</div>
                        </div>
                    </td>
                    <td>
                        <span class="text-sm text-slate-600">${createdDate}</span>
                    </td>
                    <td>
                        ${business.is_active !== false 
                            ? '<span class="badge badge-green">Active</span>' 
                            : '<span class="badge badge-gray">Inactive</span>'}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button 
                                class="action-btn action-btn-view" 
                                onclick="window.BusinessesSection.viewAnalytics('${business.id}')"
                                title="View Analytics">
                                📊
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    renderEmptyState() {
        return `
            <tr>
                <td colspan="6" class="text-center py-12">
                    <div class="text-slate-400 text-lg">
                        ${this.searchQuery 
                            ? '🔍 No businesses found matching your search' 
                            : '🏢 No businesses yet'}
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderPagination() {
        if (this.searchQuery || this.pagination.totalPages <= 1) {
            return '';
        }
        
        const { page, totalPages } = this.pagination;
        
        return `
            <div class="admin-pagination">
                <button 
                    class="pagination-btn ${page === 1 ? 'disabled' : ''}"
                    ${page === 1 ? 'disabled' : ''}
                    onclick="window.BusinessesSection.goToPage(${page - 1})">
                    ← Previous
                </button>
                
                <span class="pagination-info">
                    Page ${page} of ${totalPages}
                </span>
                
                <button 
                    class="pagination-btn ${page === totalPages ? 'disabled' : ''}"
                    ${page === totalPages ? 'disabled' : ''}
                    onclick="window.BusinessesSection.goToPage(${page + 1})">
                    Next →
                </button>
            </div>
        `;
    }
    
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="admin-error-state">
                <div class="error-icon">⚠️</div>
                <h3 class="text-xl font-semibold text-slate-900 mb-2">Failed to Load Businesses</h3>
                <p class="text-slate-600 mb-4">${message}</p>
                <button onclick="window.AdminCore.refreshCurrentSection()" class="btn-primary">
                    Try Again
                </button>
            </div>
        `;
    }
    
    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    
    attachEventListeners() {
        const searchInput = document.getElementById('business-search-input');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                this.searchQuery = query;
                
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.searchBusinesses(query).then(() => {
                        this.render();
                        this.attachEventListeners();
                    });
                }, 300);
            });
        }
    }
    
    // =========================================================================
    // BUSINESS ACTIONS
    // =========================================================================
    
    async viewAnalytics(businessId) {
        console.log('📊 [BusinessesSection] View analytics:', businessId);
        
        try {
            const data = await this.loadBusinessAnalytics(businessId);
            this.showAnalyticsModal(data);
            
        } catch (error) {
            console.error('❌ [BusinessesSection] View analytics failed:', error);
            this.eventBus.emit('admin:show-toast', {
                message: 'Failed to load analytics',
                type: 'error'
            });
        }
    }
    
    showAnalyticsModal(data) {
        const { business, analytics, topLeads } = data;
        
        const modalHTML = `
            <div class="admin-modal-overlay" onclick="window.BusinessesSection.closeModal()">
                <div class="admin-modal" onclick="event.stopPropagation()">
                    <div class="admin-modal-header">
                        <h2 class="text-2xl font-bold text-slate-900">${business.business_name}</h2>
                        <button onclick="window.BusinessesSection.closeModal()" class="modal-close-btn">×</button>
                    </div>
                    
                    <div class="admin-modal-content">
                        <!-- Business Info -->
                        <div class="mb-6">
                            <div class="text-sm text-slate-600 mb-2">
                                <strong>Niche:</strong> ${business.business_niche}
                            </div>
                            <div class="text-sm text-slate-600">
                                <strong>Target Audience:</strong> ${business.target_audience || 'Not specified'}
                            </div>
                        </div>
                        
                        <!-- Performance Metrics -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div class="metric-card-small">
                                <div class="metric-label">Total Leads</div>
                                <div class="metric-value">${analytics.totalLeads}</div>
                            </div>
                            <div class="metric-card-small">
                                <div class="metric-label">Total Analyses</div>
                                <div class="metric-value">${analytics.totalRuns}</div>
                            </div>
                            <div class="metric-card-small">
                                <div class="metric-label">Avg Score</div>
                                <div class="metric-value">${analytics.avgScore}</div>
                            </div>
                            <div class="metric-card-small">
                                <div class="metric-label">Premium Leads</div>
                                <div class="metric-value">${analytics.premiumLeads}</div>
                            </div>
                        </div>
                        
                        <!-- Analysis Type Breakdown -->
                        <div class="mb-6">
                            <h3 class="font-semibold text-slate-900 mb-3">Analysis Type Distribution</h3>
                            <div class="flex gap-4">
                                <div class="flex-1 text-center p-3 bg-blue-50 rounded-lg">
                                    <div class="text-2xl font-bold text-blue-600">${analytics.analysisTypeBreakdown.light}</div>
                                    <div class="text-xs text-slate-600">Light</div>
                                </div>
                                <div class="flex-1 text-center p-3 bg-purple-50 rounded-lg">
                                    <div class="text-2xl font-bold text-purple-600">${analytics.analysisTypeBreakdown.deep}</div>
                                    <div class="text-xs text-slate-600">Deep</div>
                                </div>
                                <div class="flex-1 text-center p-3 bg-orange-50 rounded-lg">
                                    <div class="text-2xl font-bold text-orange-600">${analytics.analysisTypeBreakdown.xray}</div>
                                    <div class="text-xs text-slate-600">X-Ray</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Top Leads -->
                        ${topLeads.length > 0 ? `
                            <div>
                                <h3 class="font-semibold text-slate-900 mb-3">Top 5 Leads</h3>
                                <div class="space-y-2">
                                    ${topLeads.map(lead => `
                                        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <span class="text-sm font-medium text-slate-900">Score: ${lead.overall_score}</span>
                                            <span class="text-xs text-slate-600">${lead.analysis_type}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : '<p class="text-slate-600 text-center py-4">No leads analyzed yet</p>'}
                    </div>
                    
                    <div class="admin-modal-footer">
                        <button onclick="window.BusinessesSection.closeModal()" class="btn-secondary">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.getElementById('admin-modals-container');
        if (modalContainer) {
            modalContainer.innerHTML = modalHTML;
        }
    }
    
    closeModal() {
        const modalContainer = document.getElementById('admin-modals-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
    }
    
    async goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages) return;
        
        this.pagination.page = page;
        await this.loadBusinesses();
        this.render();
        this.attachEventListeners();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================

window.BusinessesSection = BusinessesSection;

console.log('📦 [BusinessesSection] Module loaded');
