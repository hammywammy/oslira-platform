//public/pages/dashboard/modules/stats/stats-calculator.js

/**
 * OSLIRA STATS CALCULATOR MODULE
 * Handles dashboard statistics calculation, caching, and UI updates
 * Extracted from dashboard.js - maintains exact functionality
 */
class StatsCalculator {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
        this.stateManager = container.get('stateManager');
        this.supabase = container.get('supabase');
        this.osliraAuth = container.get('osliraAuth');
        
        // Stats cache
        this.statsCache = new Map();
        this.lastStatsUpdate = null;
        this.cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

        this.statsRefreshTimeout = null;
        console.log('🚀 [StatsCalculator] Initialized');
    }
    
    async init() {
        // Listen to data changes for stats recalculation
        this.stateManager.subscribe('leads', this.handleLeadsChanged.bind(this));
        
        // Listen for stats refresh requests
        this.eventBus.on(DASHBOARD_EVENTS.STATS_REFRESH, this.refreshStats.bind(this));
        this.eventBus.on(DASHBOARD_EVENTS.DATA_LOADED, this.handleDataLoaded.bind(this));
        
        console.log('✅ [StatsCalculator] Event listeners initialized');
    }
    
    // ===============================================================================
    // MAIN STATS CALCULATION - EXTRACTED FROM dashboard.js lines 900-1200
    // ===============================================================================
// Plan credit limits
getPlanCredits(planType) {
    const planCredits = {
        'free': 25,
        'starter': 100,
        'pro': 300,
        'agency': 1000,
        'enterprise': 5000
    };
    return planCredits[planType] || 25;
}

// EXTRACTED FROM dashboard.js lines 900-1050
async refreshStats() {
    if (this.statsRefreshTimeout) {
        clearTimeout(this.statsRefreshTimeout);
    }
    
    this.statsRefreshTimeout = setTimeout(async () => {
        try {
            console.log('📊 [StatsCalculator] Updating dashboard stats with database queries...');
            
            const currentBusiness = this.stateManager.getState('selectedBusiness');
            if (!currentBusiness) {
                console.log('⏭️ [StatsCalculator] No business selected, using default stats');
                this.renderStats(this.getDefaultStats());
                return;
            }
            
            const businessId = currentBusiness.id;
            const userId = this.osliraAuth?.user?.id;
            
            if (!userId) {
                console.log('⏳ [StatsCalculator] Waiting for authentication...');
                this.updateStatsFromCachedData();
                return;
            }
            
            // Get subscription data
            const planType = this.osliraAuth?.user?.plan_type || 'free';
            const creditsRemaining = this.osliraAuth?.user?.credits || 0;
            const planCredits = this.getPlanCredits(planType);
            
            // Calculate leads from current month
            const leadsThisMonth = await this.getLeadsThisMonth(userId, businessId);
            
            // Get all leads for other stats
            const allLeads = this.stateManager.getState('leads') || [];
            
            const stats = {
                // Credits this month: remaining / plan total
                creditsRemaining,
                planCredits,
                creditsUsed: planCredits - creditsRemaining,
                creditsPercentage: Math.round((creditsRemaining / planCredits) * 100),
                
                // Leads this month
                leadsThisMonth: leadsThisMonth.length,
                
                // Average quality score
                averageScore: this.calculateAverageScore(allLeads),
                
                // Premium leads (80+)
                premiumLeads: allLeads.filter(lead => (lead.score || 0) >= 80).length,
                
                lastUpdate: new Date().toISOString()
            };
            
            this.renderStats(stats);
            this.stateManager.setState('stats', stats);
            
        } catch (error) {
            console.error('❌ [StatsCalculator] Failed to refresh stats:', error);
            this.updateStatsFromCachedData();
        }
    }, 300);
}

async getLeadsThisMonth(userId, businessId) {
    try {
        // Get first day of current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const { data, error } = await this.supabase
            .from('leads')
            .select('lead_id, username, first_discovered_at')
            .eq('user_id', userId)
            .eq('business_id', businessId)
            .gte('first_discovered_at', firstDayOfMonth.toISOString());
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ [StatsCalculator] Failed to get leads this month:', error);
        return [];
    }
}

calculateAverageScore(leads) {
    if (!leads || leads.length === 0) return 0;
    
    const scoresWithValues = leads.filter(lead => lead.score != null && lead.score > 0);
    if (scoresWithValues.length === 0) return 0;
    
    return Math.round(
        scoresWithValues.reduce((sum, lead) => sum + lead.score, 0) / scoresWithValues.length
    );
}

renderStats(stats) {
    console.log('🎨 [StatsCalculator] Rendering stats to UI:', stats);
    
    // Credits this month
    const creditsUsedEl = document.getElementById('credits-used');
    const creditsTotalEl = document.getElementById('credits-total');
    const creditsPercentEl = document.querySelector('.glass-white .text-xs.text-gray-500');
    
    if (creditsUsedEl) creditsUsedEl.textContent = stats.creditsUsed || 0;
    if (creditsTotalEl) creditsTotalEl.textContent = this.formatNumber(stats.planCredits);
    if (creditsPercentEl) {
        const percentage = Math.round(((stats.creditsUsed || 0) / stats.planCredits) * 100);
        creditsPercentEl.textContent = `${percentage}% used`;
    }
    
    // Leads this month
    const leadsResearchedEl = document.getElementById('leads-researched');
    if (leadsResearchedEl) leadsResearchedEl.textContent = stats.leadsThisMonth || 0;
    
    // Average quality score
    const avgQualityEl = document.getElementById('avg-quality');
    const avgQualityContainer = avgQualityEl?.closest('.glass-white');
    if (avgQualityEl) {
        avgQualityEl.textContent = stats.averageScore || 0;
        
        // Update status indicator
        const statusIndicator = avgQualityContainer?.querySelector('.text-xs.font-semibold');
        if (statusIndicator) {
            if (stats.averageScore >= 80) {
                statusIndicator.textContent = 'EXCELLENT';
                statusIndicator.className = 'text-xs text-green-600 font-semibold';
            } else if (stats.averageScore >= 60) {
                statusIndicator.textContent = 'GOOD';
                statusIndicator.className = 'text-xs text-blue-600 font-semibold';
            } else {
                statusIndicator.textContent = 'NEEDS IMPROVEMENT';
                statusIndicator.className = 'text-xs text-red-600 font-semibold';
            }
        }
    }
    
    // Premium leads
    const premiumLeadsEl = document.getElementById('premium-leads');
    if (premiumLeadsEl) premiumLeadsEl.textContent = stats.premiumLeads || 0;
    
    console.log('✅ [StatsCalculator] Stats UI updated successfully');
}

    calculateStats(leads) {
    console.log('🔢 [StatsCalculator] Calculating stats from lead data...');
    
    if (!leads || leads.length === 0) {
        return this.getDefaultStats();
    }
    
    // Get subscription data for credits
    const planType = this.osliraAuth?.user?.plan_type || 'free';
    const creditsRemaining = this.osliraAuth?.user?.credits || 0;
    const planCredits = this.getPlanCredits(planType);
    
    const stats = {
        // Credits
        creditsRemaining,
        planCredits,
        creditsUsed: planCredits - creditsRemaining,
        creditsPercentage: Math.round((creditsRemaining / planCredits) * 100),
        
        // Leads (from current loaded data, not monthly filtered)
        totalLeads: leads.length,
        leadsThisMonth: leads.length, // Will be overridden by refreshStats with actual monthly data
        
        // Average quality score
        averageScore: this.calculateAverageScore(leads),
        
        // Premium leads (80+)
        premiumLeads: leads.filter(lead => (lead.score || 0) >= 80).length,
        
        // Analysis type counts (for backwards compatibility)
        deepAnalyses: leads.filter(lead => lead.analysis_type === 'deep').length,
        lightAnalyses: leads.filter(lead => lead.analysis_type === 'light').length,
        
        lastUpdate: new Date().toISOString(),
        calculatedFromLeads: true
    };
    
    console.log('📊 [StatsCalculator] Stats calculated from leads:', stats);
    return stats;
}

    calculateGrowthRate(runs, days) {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const recentRuns = runs.filter(run => new Date(run.created_at) > cutoffDate);
    
    // Simple growth calculation based on analysis volume
    const previousPeriodStart = new Date(cutoffDate.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodRuns = runs.filter(run => {
        const runDate = new Date(run.created_at);
        return runDate > previousPeriodStart && runDate <= cutoffDate;
    });
    
    if (previousPeriodRuns.length === 0) return recentRuns.length > 0 ? 100 : 0;
    
    return Math.round(((recentRuns.length - previousPeriodRuns.length) / previousPeriodRuns.length) * 100);
}
    
    // EXTRACTED FROM dashboard.js lines 7250-7400
    updateStatsUI(stats) {
        // Alternative method for updating specific UI elements
        const elements = {
            'dashboard-total-leads': stats.totalLeads,
            'dashboard-avg-score': `${stats.averageScore}%`,
            'dashboard-high-value': stats.highValueLeads,
            'dashboard-deep-count': stats.deepAnalyses,
            'dashboard-light-count': stats.lightAnalyses
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = typeof value === 'number' ? this.formatNumber(value) : value;
            }
        });
        
        // Update progress bars if they exist
        this.updateProgressBars(stats);
    }
    
    updateCreditsDisplay(credits) {
        const creditsElements = [
            'current-credits',
            'user-credits', 
            'credits-remaining',
            'header-credits'
        ];
        
        creditsElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = this.formatNumber(credits);
                
                // Add low credits warning
                if (credits < 5) {
                    el.classList.add('low-credits');
                    el.title = 'Low credits remaining';
                } else {
                    el.classList.remove('low-credits');
                    el.title = '';
                }
            }
        });
    }
    
    updateProgressBars(stats) {
        // High-value leads progress bar
        const highValueProgress = document.getElementById('high-value-progress');
        if (highValueProgress && stats.totalLeads > 0) {
            const percentage = (stats.highValueLeads / stats.totalLeads) * 100;
            highValueProgress.style.width = `${Math.min(percentage, 100)}%`;
        }
        
        // Deep vs Light analysis chart
        const deepAnalysisProgress = document.getElementById('deep-analysis-progress');
        if (deepAnalysisProgress && stats.totalLeads > 0) {
            const percentage = (stats.deepAnalyses / stats.totalLeads) * 100;
            deepAnalysisProgress.style.width = `${Math.min(percentage, 100)}%`;
        }
    }
    
    // ===============================================================================
    // CACHED DATA FALLBACK
    // ===============================================================================
    
    updateStatsFromCachedData() {
        console.log('📊 [StatsCalculator] Using cached lead data for stats calculation');
        
        const leads = this.stateManager.getState('leads') || [];
        const stats = this.calculateStats(leads);
        
        this.renderStats(stats);
        this.stateManager.setState('stats', stats);
        
        return stats;
    }
    
    // ===============================================================================
    // INSIGHTS GENERATION
    // ===============================================================================
    
generateInsights(statsData) {
    const insights = [];
    
    // Performance insights based on new metrics
    if (statsData.averageScore > 0) {
        if (statsData.averageScore >= 80) {
            insights.push({
                type: 'success',
                icon: '🎯',
                title: 'Excellent Lead Quality',
                message: `Your average analysis score is ${statsData.averageScore}/100. You're targeting high-quality leads!`
            });
        } else if (statsData.averageScore >= 60) {
            insights.push({
                type: 'info',
                icon: '📈',
                title: 'Good Progress',
                message: `Average score: ${statsData.averageScore}/100. Consider focusing on higher-engagement profiles.`
            });
        } else {
            insights.push({
                type: 'warning',
                icon: '🔍',
                title: 'Improve Targeting',
                message: `Average score: ${statsData.averageScore}/100. Refine your lead selection criteria.`
            });
        }
    }

    // Conversion rate insights using new metrics
    if (statsData.totalAnalyses > 5) {
        if (statsData.conversionRate >= 30) {
            insights.push({
                type: 'success',
                icon: '✨',
                title: 'High Conversion Rate',
                message: `${statsData.conversionRate}% of your analyses score 75+. Excellent targeting!`
            });
        } else if (statsData.conversionRate < 15) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Low Conversion Rate',
                message: `Only ${statsData.conversionRate}% score 75+. Consider refining your targeting.`
            });
        }
    }

    // Analysis depth insights
    if (statsData.totalAnalyses > 0) {
        const deepPercentage = Math.round(((statsData.deepAnalyses + statsData.xrayAnalyses) / statsData.totalAnalyses) * 100);
        
        if (deepPercentage < 20) {
            insights.push({
                type: 'tip',
                icon: '💡',
                title: 'Upgrade Analysis Depth',
                message: 'Consider more deep/x-ray analyses for detailed insights and outreach messages.'
            });
        }
    }

    // Credits warning
    if (statsData.creditsRemaining < 10) {
        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Low Credits',
            message: `Only ${statsData.creditsRemaining} credits remaining. Consider upgrading your plan.`
        });
    }

    // Activity insights
    if (statsData.recentAnalyses === 0 && statsData.totalAnalyses > 0) {
        insights.push({
            type: 'info',
            icon: '📅',
            title: 'No Recent Activity',
            message: 'No analyses in the past week. Time to find new leads!'
        });
    }

    this.renderInsights(insights);
    return insights;
}
    
    renderInsights(insights) {
        const insightsContainer = document.getElementById('dashboard-insights');
        if (!insightsContainer) return;
        
        if (insights.length === 0) {
            insightsContainer.innerHTML = '';
            return;
        }
        
        const insightsHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.message}</p>
                </div>
            </div>
        `).join('');
        
        insightsContainer.innerHTML = `
            <div class="insights-header">
                <h3>📊 Dashboard Insights</h3>
            </div>
            <div class="insights-grid">
                ${insightsHTML}
            </div>
        `;
    }
    
    // ===============================================================================
    // CACHE MANAGEMENT
    // ===============================================================================
    
    getCachedStats() {
        const cached = this.statsCache.get('stats');
        if (!cached) return null;
        
        const isExpired = Date.now() - cached.timestamp > this.cacheExpiryMs;
        if (isExpired) {
            this.statsCache.delete('stats');
            return null;
        }
        
        return cached.stats;
    }
    
    setCachedStats(stats) {
        this.statsCache.set('stats', {
            stats: { ...stats },
            timestamp: Date.now()
        });
        this.lastStatsUpdate = Date.now();
    }
    
    clearStatsCache() {
        this.statsCache.clear();
        this.lastStatsUpdate = null;
        console.log('🧹 [StatsCalculator] Stats cache cleared');
    }
    
    // ===============================================================================
    // UTILITY METHODS
    // ===============================================================================
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num?.toString() || '0';
    }
    
    formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        
        return date.toLocaleDateString();
    }
    
    getScoreClass(score) {
        if (score >= 80) return 'score-high';
        if (score >= 60) return 'score-medium';
        return 'score-low';
    }
    
    getDefaultStats() {
        return {
            totalLeads: 0,
            averageScore: 0,
            highValueLeads: 0,
            deepAnalyses: 0,
            lightAnalyses: 0,
            creditsRemaining: this.osliraAuth?.user?.credits || 0,
planCredits: this.getPlanCredits(this.osliraAuth?.user?.plan_type || 'free'),
creditsUsed: 0,
creditsPercentage: 0,
leadsThisMonth: 0,
premiumLeads: 0,
            lastUpdate: new Date().toISOString()
        };
    }
    
    // ===============================================================================
    // EVENT HANDLERS
    // ===============================================================================
    
    handleLeadsChanged(leads) {
        console.log('📊 [StatsCalculator] Leads data changed, recalculating stats');
        
        // Calculate stats from new data
        const stats = this.calculateStats(leads);
        this.renderStats(stats);
        this.stateManager.setState('stats', stats);
        
        // Generate insights
        this.generateInsights(stats);
    }
    
    handleDataLoaded(data) {
        console.log('📊 [StatsCalculator] Data loaded, updating stats');
        this.refreshStats();
    }
    
    // ===============================================================================
    // CLEANUP
    // ===============================================================================
    
    async cleanup() {
        console.log('🧹 [StatsCalculator] Cleaning up...');
        this.clearStatsCache();
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StatsCalculator };
} else {
    window.StatsCalculator = StatsCalculator;
}
