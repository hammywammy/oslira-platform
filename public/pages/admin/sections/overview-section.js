// =============================================================================
// OVERVIEW SECTION - Admin Dashboard Metrics
// =============================================================================

class OverviewSection {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.data = null;
        
        console.log('📊 [OverviewSection] Initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize(container) {
        this.container = container;
        
        try {
            await this.loadData();
            this.render();
            
            console.log('✅ [OverviewSection] Section ready');
            
        } catch (error) {
            console.error('❌ [OverviewSection] Initialization failed:', error);
            this.renderError(error.message);
        }
    }
    
    async refresh() {
        console.log('🔄 [OverviewSection] Refreshing data...');
        await this.loadData();
        this.render();
    }
    
    // =========================================================================
    // DATA LOADING
    // =========================================================================
    
    async loadData() {
        try {
const apiUrl = window.OsliraEnv.getConfig('apiUrl') || 'https://api.oslira.com';
const token = window.OsliraAuth.getSession()?.access_token;
const response = await fetch(`${apiUrl}/admin/overview`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
const data = await response.json();
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load overview data');
            }
            
            this.data = response.data;
            console.log('✅ [OverviewSection] Data loaded:', this.data);
            
        } catch (error) {
            console.error('❌ [OverviewSection] Data loading failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // RENDERING
    // =========================================================================
    
    render() {
        if (!this.container) return;
        
        const { metrics, charts, systemStatus } = this.data;
        
        this.container.innerHTML = `
            <!-- Section Header -->
            <div class="admin-section-header">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Platform Overview</h1>
                    <p class="text-slate-600 mt-1">Real-time metrics and system health</p>
                </div>
                <button onclick="window.AdminCore.refreshCurrentSection()" class="btn-secondary">
                    <span class="mr-2">🔄</span>
                    Refresh
                </button>
            </div>
            
            <!-- Metric Cards Grid -->
            <div class="admin-metrics-grid">
                ${this.renderMetricCard('Total Users', metrics.totalUsers.value, metrics.totalUsers.trend, '👥', 'blue')}
                ${this.renderMetricCard('MRR', `$${metrics.mrr.value.toLocaleString()}`, `${metrics.mrr.activeSubscriptions} active`, '💰', 'green')}
                ${this.renderMetricCard('Credit Burn Rate', `${metrics.creditBurnRate.value}/day`, `${metrics.creditBurnRate.trend > 0 ? '+' : ''}${metrics.creditBurnRate.trend}%`, '🔥', 'orange')}
                ${this.renderMetricCard('Active Jobs', metrics.activeJobs.value, 'Processing now', '⚙️', 'purple')}
            </div>
            
            <!-- Charts Row -->
            <div class="admin-charts-grid">
                <!-- Signup Trend Chart -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="text-lg font-semibold text-slate-900">New Signups (30 Days)</h3>
                    </div>
                    <div class="admin-card-content">
                        ${this.renderSignupChart(charts.signupTrend)}
                    </div>
                </div>
                
                <!-- System Status -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="text-lg font-semibold text-slate-900">System Status</h3>
                    </div>
                    <div class="admin-card-content">
                        ${this.renderSystemStatus(systemStatus)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMetricCard(label, value, trend, icon, color) {
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
                    <div class="metric-trend">${trend}</div>
                </div>
            </div>
        `;
    }
    
    renderSignupChart(signupData) {
        // Simple bar chart visualization
        const maxCount = Math.max(...signupData.map(d => d.count));
        
        // Get last 7 days for compact view
        const last7Days = signupData.slice(-7);
        
        return `
            <div class="admin-mini-chart">
                ${last7Days.map(day => {
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return `
                        <div class="chart-bar-container" title="${day.date}: ${day.count} signups">
                            <div class="chart-bar" style="height: ${height}%"></div>
                            <div class="chart-label">${new Date(day.date).getDate()}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="chart-summary mt-4">
                <span class="text-sm text-slate-600">
                    Total (7d): <strong class="text-slate-900">${last7Days.reduce((sum, d) => sum + d.count, 0)}</strong>
                </span>
            </div>
        `;
    }
    
    renderSystemStatus(status) {
        return `
            <div class="system-status-grid">
                <div class="status-item">
                    <span class="status-label">API Uptime</span>
                    <span class="status-value status-success">
                        <span class="status-dot bg-green-500"></span>
                        ${status.apiUptime}
                    </span>
                </div>
                
                <div class="status-item">
                    <span class="status-label">Sentry Errors (24h)</span>
                    <span class="status-value ${status.sentryErrors > 0 ? 'status-warning' : 'status-success'}">
                        <span class="status-dot ${status.sentryErrors > 0 ? 'bg-yellow-500' : 'bg-green-500'}"></span>
                        ${status.sentryErrors}
                    </span>
                </div>
                
                <div class="status-item">
                    <span class="status-label">Active Analysis Jobs</span>
                    <span class="status-value ${status.activeJobs > 10 ? 'status-warning' : 'status-info'}">
                        <span class="status-dot ${status.activeJobs > 10 ? 'bg-yellow-500' : 'bg-blue-500'}"></span>
                        ${status.activeJobs}
                    </span>
                </div>
            </div>
            
            ${status.activeJobs > 10 ? `
                <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-sm text-yellow-800">
                        ⚠️ High number of active jobs detected. Check System Monitor for details.
                    </p>
                </div>
            ` : ''}
        `;
    }
    
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="admin-error-state">
                <div class="error-icon">⚠️</div>
                <h3 class="text-xl font-semibold text-slate-900 mb-2">Failed to Load Overview</h3>
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

window.OverviewSection = OverviewSection;

console.log('📦 [OverviewSection] Module loaded');
