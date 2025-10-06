// =============================================================================
// USAGE ANALYTICS SECTION
// =============================================================================

class UsageSection {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.data = null;
        this.range = '30d';
        this.groupBy = 'day';
        
        console.log('📈 [UsageSection] Initialized');
    }
    
    async initialize(container) {
        this.container = container;
        
        try {
            await this.loadData();
            this.render();
            this.attachEventListeners();
            
            console.log('✅ [UsageSection] Section ready');
            
        } catch (error) {
            console.error('❌ [UsageSection] Initialization failed:', error);
            this.renderError(error.message);
        }
    }
    
    async refresh() {
        console.log('🔄 [UsageSection] Refreshing data...');
        await this.loadData();
        this.render();
        this.attachEventListeners();
    }
    
async loadData() {
    try {
        const apiUrl = window.OsliraEnv.getConfig('apiUrl') || 'https://api.oslira.com';
        const token = window.OsliraAuth.getSession()?.access_token;
        
        const response = await fetch(`${apiUrl}/admin/usage?range=${this.range}&groupBy=${this.groupBy}`, {
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
            throw new Error(result.error || 'Failed to load usage data');
        }

        this.data = result.data;
        console.log('✅ [UsageSection] Data loaded');

    } catch (error) {
        console.error('❌ [UsageSection] Data loading failed:', error);
        throw error;
    }
}
    
    render() {
        if (!this.container) return;
        
        const { usageData, performance } = this.data;
        
        this.container.innerHTML = `
            <div class="admin-section-header">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Usage Analytics</h1>
                    <p class="text-slate-600 mt-1">Platform usage patterns and performance</p>
                </div>
                <div class="flex gap-2">
                    <select id="usage-range" class="admin-select">
                        <option value="7d" ${this.range === '7d' ? 'selected' : ''}>Last 7 Days</option>
                        <option value="30d" ${this.range === '30d' ? 'selected' : ''}>Last 30 Days</option>
                        <option value="90d" ${this.range === '90d' ? 'selected' : ''}>Last 90 Days</option>
                    </select>
                    <select id="usage-groupby" class="admin-select">
                        <option value="day" ${this.groupBy === 'day' ? 'selected' : ''}>By Day</option>
                        <option value="week" ${this.groupBy === 'week' ? 'selected' : ''}>By Week</option>
                        <option value="month" ${this.groupBy === 'month' ? 'selected' : ''}>By Month</option>
                    </select>
                    <button onclick="window.UsageSection.refresh()" class="btn-secondary">🔄 Refresh</button>
                </div>
            </div>
            
            <div class="admin-metrics-grid mb-6">
                <div class="admin-metric-card">
                    <div class="metric-icon bg-blue-50 text-blue-600">⚡</div>
                    <div class="metric-content">
                        <div class="metric-label">Total Analyses</div>
                        <div class="metric-value">${performance.totalAnalyses}</div>
                    </div>
                </div>
                <div class="admin-metric-card">
                    <div class="metric-icon bg-green-50 text-green-600">⏱️</div>
                    <div class="metric-content">
                        <div class="metric-label">Avg Processing Time</div>
                        <div class="metric-value">${performance.avgProcessingTime}</div>
                    </div>
                </div>
                <div class="admin-metric-card">
                    <div class="metric-icon bg-purple-50 text-purple-600">🔢</div>
                    <div class="metric-content">
                        <div class="metric-label">Avg Token Usage</div>
                        <div class="metric-value">${performance.avgTokenUsage}</div>
                    </div>
                </div>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3 class="text-lg font-semibold text-slate-900">Usage Over Time</h3>
                </div>
                <div class="admin-card-content">
                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Total Analyses</th>
                                    <th>Light / Deep / Xray</th>
                                    <th>Avg Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usageData.map(period => `
                                    <tr>
                                        <td class="font-medium">${period.period}</td>
                                        <td>${period.totalAnalyses}</td>
                                        <td>
                                            <div class="flex gap-2">
                                                <span class="badge badge-blue">${period.light}</span>
                                                <span class="badge badge-purple">${period.deep}</span>
                                                <span class="badge badge-orange">${period.xray}</span>
                                            </div>
                                        </td>
                                        <td><span class="font-semibold">${period.avgScore}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        const rangeSelect = document.getElementById('usage-range');
        const groupBySelect = document.getElementById('usage-groupby');
        
        if (rangeSelect) {
            rangeSelect.addEventListener('change', (e) => {
                this.range = e.target.value;
                this.refresh();
            });
        }
        
        if (groupBySelect) {
            groupBySelect.addEventListener('change', (e) => {
                this.groupBy = e.target.value;
                this.refresh();
            });
        }
    }
    
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="admin-error-state">
                <div class="error-icon">⚠️</div>
                <h3 class="text-xl font-semibold text-slate-900 mb-2">Failed to Load Usage Data</h3>
                <p class="text-slate-600 mb-4">${message}</p>
                <button onclick="window.UsageSection.refresh()" class="btn-primary">Try Again</button>
            </div>
        `;
    }
}

// =============================================================================
// SYSTEM MONITOR SECTION
// =============================================================================

class SystemSection {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.data = null;
        
        console.log('🖥️ [SystemSection] Initialized');
    }
    
    async initialize(container) {
        this.container = container;
        
        try {
            await this.loadData();
            this.render();
            
            console.log('✅ [SystemSection] Section ready');
            
        } catch (error) {
            console.error('❌ [SystemSection] Initialization failed:', error);
            this.renderError(error.message);
        }
    }
    
    async refresh() {
        console.log('🔄 [SystemSection] Refreshing data...');
        await this.loadData();
        this.render();
    }
    
async loadData() {
    try {
        const apiUrl = window.OsliraEnv.getConfig('apiUrl') || 'https://api.oslira.com';
        const token = window.OsliraAuth.getSession()?.access_token;
        
        const response = await fetch(`${apiUrl}/admin/system`, {
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
            throw new Error(result.error || 'Failed to load system data');
        }

        this.data = result.data;
        console.log('✅ [SystemSection] Data loaded');

    } catch (error) {
        console.error('❌ [SystemSection] Data loading failed:', error);
        throw error;
    }
}

    
    render() {
        if (!this.container) return;
        
        const { activeJobs, stuckJobs, recentFailures, systemMetrics } = this.data;
        
        this.container.innerHTML = `
            <div class="admin-section-header">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">System Monitor</h1>
                    <p class="text-slate-600 mt-1">Real-time system health and active jobs</p>
                </div>
                <button onclick="window.SystemSection.refresh()" class="btn-secondary">🔄 Refresh</button>
            </div>
            
            ${stuckJobs > 0 ? `
                <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-red-800 font-semibold">⚠️ ${stuckJobs} stuck job(s) detected (running &gt;5min)</p>
                </div>
            ` : ''}
            
            <div class="admin-card mb-6">
                <div class="admin-card-header">
                    <h3 class="text-lg font-semibold text-slate-900">Active Analysis Jobs (${activeJobs.length})</h3>
                </div>
                <div class="admin-card-content">
                    ${activeJobs.length > 0 ? `
                        <div class="admin-table-container">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Lead</th>
                                        <th>Type</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${activeJobs.map(job => `
                                        <tr class="${job.duration > 300 ? 'bg-yellow-50' : ''}">
                                            <td class="text-sm">${job.user_email}</td>
                                            <td class="text-sm font-medium">@${job.username}</td>
                                            <td><span class="badge badge-blue">${job.analysis_type}</span></td>
                                            <td>${job.duration}s</td>
                                            <td><span class="badge ${job.duration > 300 ? 'badge-orange' : 'badge-green'}">${job.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<p class="text-slate-600 text-center py-8">No active jobs</p>'}
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="admin-card">
                    <div class="admin-card-content text-center">
                        <div class="text-3xl font-bold text-blue-600">${systemMetrics.totalActiveJobs}</div>
                        <div class="text-sm text-slate-600 mt-2">Active Jobs</div>
                    </div>
                </div>
                <div class="admin-card">
                    <div class="admin-card-content text-center">
                        <div class="text-3xl font-bold text-green-600">${systemMetrics.apiUptime}</div>
                        <div class="text-sm text-slate-600 mt-2">API Uptime</div>
                    </div>
                </div>
                <div class="admin-card">
                    <div class="admin-card-content text-center">
                        <div class="text-3xl font-bold text-purple-600">${systemMetrics.averageQueueTime}</div>
                        <div class="text-sm text-slate-600 mt-2">Avg Queue Time</div>
                    </div>
                </div>
            </div>
            
            ${recentFailures.length > 0 ? `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="text-lg font-semibold text-slate-900">Recent Failures</h3>
                    </div>
                    <div class="admin-card-content">
                        <div class="space-y-2">
                            ${recentFailures.map(failure => `
                                <div class="p-3 bg-red-50 border border-red-200 rounded">
                                    <div class="text-sm font-medium text-red-900">${failure.error_message}</div>
                                    <div class="text-xs text-red-700 mt-1">${new Date(failure.created_at).toLocaleString()}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="admin-error-state">
                <div class="error-icon">⚠️</div>
                <h3 class="text-xl font-semibold text-slate-900 mb-2">Failed to Load System Data</h3>
                <p class="text-slate-600 mb-4">${message}</p>
                <button onclick="window.SystemSection.refresh()" class="btn-primary">Try Again</button>
            </div>
        `;
    }
}

// =============================================================================
// LEADS ANALYTICS SECTION
// =============================================================================

class LeadsSection {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.data = null;
        
        console.log('🎯 [LeadsSection] Initialized');
    }
    
    async initialize(container) {
        this.container = container;
        
        try {
            await this.loadData();
            this.render();
            
            console.log('✅ [LeadsSection] Section ready');
            
        } catch (error) {
            console.error('❌ [LeadsSection] Initialization failed:', error);
            this.renderError(error.message);
        }
    }
    
    async refresh() {
        console.log('🔄 [LeadsSection] Refreshing data...');
        await this.loadData();
        this.render();
    }
    
  async loadData() {
    try {
        const apiUrl = window.OsliraEnv.getConfig('apiUrl') || 'https://api.oslira.com';
        const token = window.OsliraAuth.getSession()?.access_token;
        
        const response = await fetch(`${apiUrl}/admin/leads`, {
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
            throw new Error(result.error || 'Failed to load leads data');
        }

        this.data = result.data;
        console.log('✅ [LeadsSection] Data loaded');

    } catch (error) {
        console.error('❌ [LeadsSection] Data loading failed:', error);
        throw error;
    }
}
    
    render() {
        if (!this.container) return;
        
        const { leadOverview, analysisPerformance } = this.data;
        
        this.container.innerHTML = `
            <div class="admin-section-header">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Leads & Analysis</h1>
                    <p class="text-slate-600 mt-1">Lead quality trends and analysis performance</p>
                </div>
                <button onclick="window.LeadsSection.refresh()" class="btn-secondary">🔄 Refresh</button>
            </div>
            
            <div class="admin-metrics-grid mb-6">
                <div class="admin-metric-card">
                    <div class="metric-icon bg-blue-50 text-blue-600">🎯</div>
                    <div class="metric-content">
                        <div class="metric-label">Total Leads</div>
                        <div class="metric-value">${leadOverview.totalLeads}</div>
                    </div>
                </div>
                <div class="admin-metric-card">
                    <div class="metric-icon bg-purple-50 text-purple-600">⭐</div>
                    <div class="metric-content">
                        <div class="metric-label">Avg Score</div>
                        <div class="metric-value">${leadOverview.avgScore}</div>
                    </div>
                </div>
            </div>
            
            <div class="admin-card mb-6">
                <div class="admin-card-header">
                    <h3 class="text-lg font-semibold text-slate-900">Lead Quality Tiers</h3>
                </div>
                <div class="admin-card-content">
                    <div class="grid grid-cols-3 gap-4">
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-3xl font-bold text-green-600">${leadOverview.qualityTiers.premium}</div>
                            <div class="text-sm text-slate-600 mt-2">Premium (90+)</div>
                        </div>
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-3xl font-bold text-blue-600">${leadOverview.qualityTiers.good}</div>
                            <div class="text-sm text-slate-600 mt-2">Good (70-89)</div>
                        </div>
                        <div class="text-center p-4 bg-slate-50 rounded-lg">
                            <div class="text-3xl font-bold text-slate-600">${leadOverview.qualityTiers.poor}</div>
                            <div class="text-sm text-slate-600 mt-2">Poor (&lt;70)</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3 class="text-lg font-semibold text-slate-900">Analysis Performance by Type</h3>
                </div>
                <div class="admin-card-content">
                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Total Runs</th>
                                    <th>Avg Time</th>
                                    <th>Avg Cost</th>
                                    <th>Success Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${analysisPerformance.map(perf => `
                                    <tr>
                                        <td><span class="badge badge-${perf.type === 'light' ? 'blue' : perf.type === 'deep' ? 'purple' : 'orange'}">${perf.type}</span></td>
                                        <td>${perf.totalRuns}</td>
                                        <td>${perf.avgCompletionTime}</td>
                                        <td>$${perf.avgCost}</td>
                                        <td><span class="font-semibold text-green-600">${perf.successRate}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="admin-error-state">
                <div class="error-icon">⚠️</div>
                <h3 class="text-xl font-semibold text-slate-900 mb-2">Failed to Load Leads Data</h3>
                <p class="text-slate-600 mb-4">${message}</p>
                <button onclick="window.LeadsSection.refresh()" class="btn-primary">Try Again</button>
            </div>
        `;
    }
}

// =============================================================================
// GLOBAL EXPORTS
// =============================================================================

window.UsageSection = UsageSection;
window.SystemSection = SystemSection;
window.LeadsSection = LeadsSection;

console.log('📦 [Remaining Sections] All modules loaded');
