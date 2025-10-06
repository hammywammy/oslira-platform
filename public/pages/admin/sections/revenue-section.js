// =============================================================================
// REVENUE SECTION - Financial Dashboard
// =============================================================================

class RevenueSection {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.data = null;
        
        console.log('💰 [RevenueSection] Initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize(container) {
        this.container = container;
        
        try {
            await this.loadData();
            this.render();
            
            console.log('✅ [RevenueSection] Section ready');
            
        } catch (error) {
            console.error('❌ [RevenueSection] Initialization failed:', error);
            this.renderError(error.message);
        }
    }
    
    async refresh() {
        console.log('🔄 [RevenueSection] Refreshing data...');
        await this.loadData();
        this.render();
    }
    
    // =========================================================================
    // DATA LOADING
    // =========================================================================
    
    async loadData() {
        try {
            const response = await window.OsliraAPI.get('/admin/revenue');
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load revenue data');
            }
            
            this.data = response.data;
            console.log('✅ [RevenueSection] Data loaded:', this.data);
            
        } catch (error) {
            console.error('❌ [RevenueSection] Data loading failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // RENDERING
    // =========================================================================
    
    render() {
        if (!this.container) return;
        
        const { revenue, creditEconomics } = this.data;
        
        this.container.innerHTML = `
            <!-- Section Header -->
            <div class="admin-section-header">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Revenue Dashboard</h1>
                    <p class="text-slate-600 mt-1">Financial metrics and credit economics</p>
                </div>
                <button onclick="window.AdminCore.refreshCurrentSection()" class="btn-secondary">
                    <span class="mr-2">🔄</span>
                    Refresh
                </button>
            </div>
            
            <!-- Revenue Metrics Grid -->
            <div class="admin-metrics-grid">
                ${this.renderMetricCard('MRR', `$${revenue.mrr.toLocaleString()}`, 'Monthly Recurring Revenue', '💵', 'green')}
                ${this.renderMetricCard('ARR', `$${revenue.arr.toLocaleString()}`, 'Annual Run Rate', '📈', 'blue')}
                ${this.renderMetricCard('Active Subs', revenue.activeSubscriptions, 'Paying customers', '👥', 'purple')}
                ${this.renderMetricCard('Utilization', creditEconomics.utilizationRate, 'Credit usage rate', '⚡', 'orange')}
            </div>
            
            <!-- Revenue Breakdown -->
            <div class="admin-card mb-6">
                <div class="admin-card-header">
                    <h3 class="text-lg font-semibold text-slate-900">Revenue by Plan</h3>
                </div>
                <div class="admin-card-content">
                    ${this.renderPlanBreakdown(revenue.planBreakdown)}
                </div>
            </div>
            
            <!-- Credit Economics -->
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3 class="text-lg font-semibold text-slate-900">Credit Economics</h3>
                </div>
                <div class="admin-card-content">
                    ${this.renderCreditEconomics(creditEconomics)}
                </div>
            </div>
        `;
    }
    
    renderMetricCard(label, value, subtitle, icon, color) {
        const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            orange: 'bg-orange-50 text-orange-600',
            purple: 'bg-purple-50 text-purple-600'
        };
        
        return `
            <div class="admin-metric-card">
                <div class="metric-icon ${colorClasses[color] || colorClasses.blue}">
                    ${icon}
                </div>
                <div class="metric-content">
                    <div class="metric-label">${label}</div>
                    <div class="metric-value">${value}</div>
                    <div class="metric-trend">${subtitle}</div>
                </div>
            </div>
        `;
    }
    
    renderPlanBreakdown(planBreakdown) {
        const plans = Object.entries(planBreakdown);
        
        if (plans.length === 0) {
            return '<p class="text-slate-600 text-center py-8">No active subscriptions</p>';
        }
        
        const total = plans.reduce((sum, [_, count]) => sum + count, 0);
        
        return `
            <div class="space-y-4">
                ${plans.map(([planName, count]) => {
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    return `
                        <div class="plan-breakdown-item">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium text-slate-900">${planName}</span>
                                <span class="text-sm text-slate-600">${count} subscribers (${percentage}%)</span>
                            </div>
                            <div class="w-full bg-slate-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    renderCreditEconomics(economics) {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="economics-stat">
                    <div class="stat-label">Total Credits Allocated</div>
                    <div class="stat-value text-blue-600">${economics.totalCreditsAllocated.toLocaleString()}</div>
                    <div class="stat-description">Credits purchased/assigned to users</div>
                </div>
                
                <div class="economics-stat">
                    <div class="stat-label">Total Credits Used</div>
                    <div class="stat-value text-purple-600">${economics.totalCreditsUsed.toLocaleString()}</div>
                    <div class="stat-description">Credits consumed for analyses</div>
                </div>
                
                <div class="economics-stat">
                    <div class="stat-label">Utilization Rate</div>
                    <div class="stat-value text-green-600">${economics.utilizationRate}</div>
                    <div class="stat-description">Percentage of allocated credits used</div>
                </div>
                
                <div class="economics-stat">
                    <div class="stat-label">Average Cost Per Credit</div>
                    <div class="stat-value text-orange-600">$${economics.avgCostPerCredit}</div>
                    <div class="stat-description">Actual cost per credit consumed</div>
                </div>
            </div>
            
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 class="font-semibold text-blue-900 mb-2">💡 Credit Insights</h4>
                <ul class="text-sm text-blue-800 space-y-1">
                    <li>• Utilization rate indicates how efficiently credits are being used</li>
                    <li>• Low utilization (&lt;50%) may indicate over-allocation or low engagement</li>
                    <li>• High utilization (&gt;80%) indicates strong product-market fit</li>
                </ul>
            </div>
        `;
    }
    
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="admin-error-state">
                <div class="error-icon">⚠️</div>
                <h3 class="text-xl font-semibold text-slate-900 mb-2">Failed to Load Revenue Data</h3>
                <p class="text-slate-600 mb-4">${message}</p>
                <button onclick="window.AdminCore.refreshCurrentSection()" class="btn-primary">
                    Try Again
                </button>
            </div>
        `;
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================

window.RevenueSection = RevenueSection;

console.log('📦 [RevenueSection] Module loaded');
