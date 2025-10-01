//public/pages/dashboard/modules/ui/stats-cards.js

class StatsCards {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
        this.stateManager = container.get('stateManager');
    }

    init() {
    this.setupEventHandlers();
}

setupEventHandlers() {
    // Make filterByPriority globally available
    window.filterByPriority = (priority) => {
        console.log(`🔍 Filtering by priority: ${priority}`);
        this.eventBus.emit('filter:priority', { priority });
    };
}

renderPriorityCards() {
    return `
<!-- Real-Time Intelligence Cards -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    <!-- Analysis Queue -->
    <div class="glass-white rounded-2xl p-6 hover-lift cursor-pointer" onclick="showAnalysisQueue()">
        <div class="flex items-start justify-between">
            <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ANALYSIS QUEUE</p>
                <h2 class="text-2xl font-bold text-gray-800">
                    <span id="active-analyses">3</span> active | <span id="pending-analyses">8</span> pending
                </h2>
                <p class="text-sm text-gray-600 mt-2">~<span id="queue-time">12</span> min remaining</p>
                <button class="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium mt-2 hover:bg-purple-200 transition-colors">
                    View Queue
                </button>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
            </div>
        </div>
    </div>
    
    <!-- Today's Discoveries -->
    <div class="glass-white rounded-2xl p-6 hover-lift cursor-pointer" onclick="showHighValueFinds()">
        <div class="flex items-start justify-between">
            <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">TODAY'S DISCOVERIES</p>
                <h2 class="text-2xl font-bold text-gray-800">
                    <span id="high-value-count">4</span> leads (Score 80+)
                </h2>
                <p class="text-sm text-gray-600 mt-2">Best: @<span id="best-lead">username</span> (<span id="best-score">94</span>)</p>
                <button class="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium mt-2 hover:bg-green-200 transition-colors">
                    View All
                </button>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
            </div>
        </div>
    </div>
    
    <!-- Saved Lists -->
    <div class="glass-white rounded-2xl p-6 hover-lift cursor-pointer" onclick="showSavedLists()">
        <div class="flex items-start justify-between">
            <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">SAVED LISTS</p>
                <div class="space-y-1 mt-2">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-700">Tech (<span id="tech-count">47</span>)</span>
                        <span class="text-sm text-gray-700">B2B (<span id="b2b-count">23</span>)</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-700">Fitness (<span id="fitness-count">31</span>)</span>
                        <span class="text-sm text-gray-700">New (<span id="new-count">12</span>)</span>
                    </div>
                </div>
                <button class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium mt-3 hover:bg-blue-200 transition-colors">
                    Manage
                </button>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
            </div>
        </div>
    </div>
</div>`;
}

renderPerformanceMetrics() {
    return `
<!-- Monthly Metrics -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Credits Used -->
    <div class="glass-white rounded-2xl p-6 hover-lift">
        <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
            </div>
            <span class="text-xs text-gray-500">32% used</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800">
            <span id="credits-used">3,247</span> / <span id="credits-total">10,000</span>
        </h3>
        <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Credits this month</p>
    </div>
    
    <!-- Leads Researched -->
    <div class="glass-white rounded-2xl p-6 hover-lift">
        <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
            </div>
            <span class="text-xs text-green-600 font-semibold">+23% from last month</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800" id="leads-researched">156</h3>
        <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Leads this month</p>
    </div>
    
    <!-- Analysis Depth -->
    <div class="glass-white rounded-2xl p-6 hover-lift">
        <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
            </div>
            <span class="text-xs text-red-600 font-semibold">NEEDS IMPROVEMENT</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800">
            <span id="avg-quality">47</span> / 100
        </h3>
        <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Avg quality score</p>
    </div>
    
    <!-- High-Quality Leads -->
    <div class="glass-white rounded-2xl p-6 hover-lift cursor-pointer" onclick="showHighQualityLeads()">
        <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
            </div>
            <span class="text-xs text-blue-600 font-semibold">VIEW LIST →</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800" id="premium-leads">28</h3>
        <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Premium leads (80+)</p>
    </div>
</div>`;
}

    updateStats(stats) {
        const elements = {
            'high-priority-count': stats.highValueLeads || 0,
            'medium-priority-count': stats.mediumPriorityLeads || 0,
            'low-priority-count': stats.lowPriorityLeads || 0,
            'total-leads': stats.totalLeads || 0,
            'success-rate': `${stats.successRate || 73}%`,
            'outreach-sent': stats.outreachSent || 0,
            'response-rate': `${stats.responseRate || 24}%`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    setupEventHandlers() {
        window.filterByPriority = (priority) => {
            console.log(`🔍 Filtering by priority: ${priority}`);
            this.eventBus.emit('filter:priority', { priority });
        };
    }

    showAnalysisQueue() {
    console.log('🔄 Opening analysis queue');
    
    // Try to get analysis queue from container
    const analysisQueue = this.container?.get('analysisQueue');
    if (analysisQueue && analysisQueue.showQueue) {
        analysisQueue.showQueue();
        return;
    }
    
    // Fallback: Show queue modal or panel
    const queueModal = document.getElementById('analysis-queue-modal');
    if (queueModal) {
        queueModal.classList.remove('hidden');
    } else {
        // Create and show queue display
        this.createAnalysisQueueModal();
    }
    
    // Emit event for other components
    this.eventBus.emit('ui:show-analysis-queue');
}

showHighValueFinds() {
    console.log('⭐ Showing high-value finds');
    
    // Filter leads by score >= 80
    const leads = this.stateManager.getState('allLeads') || [];
    const highValueLeads = leads.filter(lead => (lead.score || 0) >= 80);
    
    // Update table filter
    this.stateManager.setState('filteredLeads', highValueLeads);
    this.stateManager.setState('currentFilter', { type: 'score', value: '80+' });
    
    // Update UI to show filter is active
    const filterIndicator = document.getElementById('active-filter');
    if (filterIndicator) {
        filterIndicator.textContent = `High-Value Leads (${highValueLeads.length})`;
        filterIndicator.classList.remove('hidden');
    }
    
    // Emit filter event
    this.eventBus.emit('leads:filter-applied', { 
        type: 'high-value', 
        count: highValueLeads.length 
    });
    
    // Scroll to leads table
    const leadsSection = document.getElementById('leads-section');
    if (leadsSection) {
        leadsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

showSavedLists() {
    console.log('📁 Managing saved lists');
    
    // Check if saved lists modal exists
    let listsModal = document.getElementById('saved-lists-modal');
    if (!listsModal) {
        this.createSavedListsModal();
        listsModal = document.getElementById('saved-lists-modal');
    }
    
    // Show modal
    if (listsModal) {
        listsModal.classList.remove('hidden');
        this.populateSavedLists();
    }
    
    // Emit event
    this.eventBus.emit('ui:show-saved-lists');
}

showHighQualityLeads() {
    console.log('⭐ Filtering premium leads');
    
    // Filter leads by score >= 80 (premium threshold)
    const leads = this.stateManager.getState('allLeads') || [];
    const premiumLeads = leads.filter(lead => (lead.score || 0) >= 80);
    
    // Apply filter
    this.stateManager.setState('filteredLeads', premiumLeads);
    this.stateManager.setState('currentFilter', { type: 'premium', value: '80+' });
    
    // Update filter UI
    const filterIndicator = document.getElementById('active-filter');
    if (filterIndicator) {
        filterIndicator.textContent = `Premium Leads (${premiumLeads.length})`;
        filterIndicator.classList.remove('hidden');
    }
    
    // Add premium filter button if not exists
    this.addPremiumFilterButton();
    
    // Emit events
    this.eventBus.emit('leads:filter-applied', { 
        type: 'premium', 
        count: premiumLeads.length 
    });
    
    // Auto-scroll to results
    const leadsSection = document.getElementById('leads-section');
    if (leadsSection) {
        leadsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Helper method to create analysis queue modal
createAnalysisQueueModal() {
    const modalHTML = `
    <div id="analysis-queue-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold text-gray-900">Analysis Queue</h2>
                    <button onclick="document.getElementById('analysis-queue-modal').classList.add('hidden')" 
                            class="p-2 hover:bg-gray-100 rounded-full">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="queue-content" class="p-6 max-h-96 overflow-y-auto">
                <div class="text-center text-gray-500">Loading queue...</div>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.loadQueueContent();
}

// Helper method to create saved lists modal
createSavedListsModal() {
    const modalHTML = `
    <div id="saved-lists-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 hidden">
        <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold text-gray-900">Saved Lists</h2>
                    <button onclick="document.getElementById('saved-lists-modal').classList.add('hidden')" 
                            class="p-2 hover:bg-gray-100 rounded-full">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="lists-content" class="p-6 space-y-4">
                <div class="space-y-3" id="saved-lists-container">
                    <!-- Lists will be populated here -->
                </div>
                <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Create New List
                </button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Helper method to load queue content
loadQueueContent() {
    const queueContent = document.getElementById('queue-content');
    if (!queueContent) return;
    
    // Get queue data from analysis queue or state
    const analysisQueue = this.container?.get('analysisQueue');
    if (analysisQueue && analysisQueue.getQueueData) {
        const queueData = analysisQueue.getQueueData();
        this.renderQueueItems(queueData);
    } else {
        // Fallback: mock queue data
        queueContent.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                    <div class="font-medium">@nasa</div>
                    <div class="text-sm text-gray-600">Deep analysis • 2 min remaining</div>
                </div>
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <div class="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
            <div class="text-center text-gray-500 py-4">
                <div class="text-sm">Queue is processing efficiently</div>
            </div>
        </div>`;
    }
}

// Helper method to populate saved lists
populateSavedLists() {
    const container = document.getElementById('saved-lists-container');
    if (!container) return;
    
    // Get saved lists from state or localStorage
    const savedLists = this.getSavedLists();
    
    if (savedLists.length === 0) {
        container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
            <div class="text-sm">No saved lists yet</div>
            <div class="text-xs text-gray-400 mt-1">Create lists to organize your leads</div>
        </div>`;
        return;
    }
    
    container.innerHTML = savedLists.map(list => `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
         onclick="loadSavedList('${list.id}')">
        <div>
            <div class="font-medium">${list.name}</div>
            <div class="text-sm text-gray-600">${list.count} leads</div>
        </div>
        <div class="text-xs text-gray-400">${list.category}</div>
    </div>`).join('');
}

// Helper method to get saved lists
getSavedLists() {
    // Try to get from state manager first
    const lists = this.stateManager?.getState('savedLists');
    if (lists) return lists;
    
    // Fallback to localStorage
    try {
        const stored = localStorage.getItem('oslira_saved_lists');
        return stored ? JSON.parse(stored) : this.getDefaultLists();
    } catch {
        return this.getDefaultLists();
    }
}

// Helper method for default lists
getDefaultLists() {
    return [
        { id: 'tech', name: 'Tech', count: 47, category: 'Industry' },
        { id: 'b2b', name: 'B2B', count: 23, category: 'Type' },
        { id: 'fitness', name: 'Fitness', count: 31, category: 'Industry' },
        { id: 'new', name: 'New', count: 12, category: 'Recent' }
    ];
}

// Helper method to add premium filter button
addPremiumFilterButton() {
    const filtersContainer = document.getElementById('filters-container');
    if (!filtersContainer) return;
    
    // Check if premium filter already exists
    if (document.getElementById('premium-filter-btn')) return;
    
    const premiumButton = document.createElement('button');
    premiumButton.id = 'premium-filter-btn';
    premiumButton.className = 'px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full hover:bg-yellow-200 transition-colors';
    premiumButton.textContent = 'Premium Only';
    premiumButton.onclick = () => this.showHighQualityLeads();
    
    filtersContainer.appendChild(premiumButton);
}
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsCards;
} else {
    window.StatsCards = StatsCards;
}
