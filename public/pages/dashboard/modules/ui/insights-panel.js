//public/pages/dashboard/modules/ui/insights-panel.js

class InsightsPanel {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
    }

    renderInsightsPanel() {
        return `
<!-- AI-Generated Insights - Full Width -->
<div class="mb-8">
    <div class="glass-white rounded-2xl p-6">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-gray-800">AI-Generated Insights</h3>
            <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i data-feather="cpu" class="w-4 h-4 text-white"></i>
            </div>
        </div>
        
        <!-- Insights Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- Insight 1 -->
            <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div class="flex items-start space-x-3">
                    <i data-feather="trending-up" class="w-5 h-5 text-green-600 mt-0.5"></i>
                    <div>
                        <p class="text-sm font-medium text-gray-800">High Conversion Pattern</p>
                        <p class="text-xs text-gray-600 mt-1">Leads with >10K followers have 20% higher response rate</p>
                    </div>
                </div>
            </div>
            
            <!-- Insight 2 -->
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div class="flex items-start space-x-3">
                    <i data-feather="clock" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                    <div>
                        <p class="text-sm font-medium text-gray-800">Optimal Timing</p>
                        <p class="text-xs text-gray-600 mt-1">Best time to contact: Weekday mornings 9-11 AM</p>
                    </div>
                </div>
            </div>
            
            <!-- Insight 3 -->
            <div class="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <div class="flex items-start space-x-3">
                    <i data-feather="users" class="w-5 h-5 text-purple-600 mt-0.5"></i>
                    <div>
                        <p class="text-sm font-medium text-gray-800">Platform Performance</p>
                        <p class="text-xs text-gray-600 mt-1">LinkedIn leads convert 35% better than Twitter</p>
                    </div>
                </div>
            </div>
            
            <!-- Insight 4 -->
            <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div class="flex items-start space-x-3">
                    <i data-feather="alert-triangle" class="w-5 h-5 text-yellow-600 mt-0.5"></i>
                    <div>
                        <p class="text-sm font-medium text-gray-800">Nurturing Opportunity</p>
                        <p class="text-xs text-gray-600 mt-1">5 low-score leads converted after follow-up</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Performance Stats and AI Recommendation Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Weekly Performance -->
            <div class="p-4 border border-gray-200 rounded-xl">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">This Week's Performance</h4>
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-600">Response Rate</span>
                        <span class="text-xs font-semibold text-green-600">↑ 6%</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-600">Avg Lead Score</span>
                        <span class="text-xs font-semibold text-green-600">↑ 3.2</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-600">Conversion Rate</span>
                        <span class="text-xs font-semibold text-yellow-600">→ 0%</span>
                    </div>
                </div>
            </div>
            
            <!-- AI Recommendation -->
            <div class="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                <p class="text-sm font-semibold mb-2">💡 AI Recommendation</p>
                <p class="text-sm">Focus on high-priority LinkedIn leads this week for maximum ROI. Data shows 35% better conversion rates compared to other platforms.</p>
            </div>
        </div>
    </div>
</div>`;
    }

    updateInsights(insights) {
        // Update insights with real data when available
        console.log('📊 [InsightsPanel] Updating insights:', insights);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InsightsPanel;
} else {
    window.InsightsPanel = InsightsPanel;
}
