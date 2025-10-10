//public/pages/dashboard/modules/ui/stats-cards.js

/**
 * STATS CARDS - Migrated to New System (No Container)
 * Handles statistics display cards, filtering, and interactions
 */
class StatsCards {
    constructor() {
        // Use global window objects directly (no container)
        this.eventBus = window.EventBus || window.OsliraEventBus;
        this.stateManager = window.StateManager || window.OsliraStateManager;
        this.osliraAuth = window.OsliraAuth;
        
        console.log('📊 [StatsCards] Instance created (Migrated System)');
    }

    init() {
        this.setupEventHandlers();
        this.setupClickHandlers();
        console.log('✅ [StatsCards] Initialized');
    }

    setupClickHandlers() {
        // Use event delegation for premium view link
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'premium-view-link') {
                e.preventDefault();
                e.stopPropagation();
                this.showHighQualityLeads();
            }
        });
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
                ${window.IconComponents.getAnalysisQueueIcon()}
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
                ${window.IconComponents.getDiscoveriesIcon()}
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
                ${window.IconComponents.getSavedListsIcon()}
            </div>
        </div>
    </div>
</div>`;
    }
    
    renderPerformanceMetrics() {
        return `
<!-- Monthly Metrics -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Credits Remaining -->
    <div class="glass-white rounded-2xl p-6 hover-lift">
        <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                ${window.IconComponents.getCreditsIcon()}
            </div>
            <span id="credits-percent" class="text-xs text-gray-500">0% used</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800">
            <span id="credits-used">300</span> / <span id="credits-total">300</span>
        </h3>
        <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Credits Remaining This Month</p>
    </div>
    
    <!-- Leads Researched -->
    <div class="glass-white rounded-2xl p-6 hover-lift">
        <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                ${window.IconComponents.getSearchIcon()}
            </div>
            <span class="text-xs text-green-600 font-semibold">+23% from last month</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800" id="leads-researched">4</h3>
        <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Leads Researched This Month</p>
    </div>
    
    <!-- Avg Quality Score -->
    <div class="glass-white rounded-2xl p-6 hover-lift">
        <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                ${window.IconComponents.getBarChartIcon()}
            </div>
            <span class="text-xs text-red-600 font-semibold">NEEDS IMPROVEMENT</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800">
            <span id="avg-quality">47</span> / 100
        </h3>
        <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Avg quality score</p>
    </div>
    
    <!-- Premium Leads -->
    <div class="glass-white rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                ${window.IconComponents.getPremiumStarIcon()}
            </div>
            <span id="premium-view-link" class="text-xs text-blue-600 font-semibold cursor-pointer hover:text-blue-700 transition-colors">VIEW</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800" id="premium-leads">1</h3>
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

    showAnalysisQueue() {
        console.log('🔄 Opening analysis queue');
        
        // Try to get analysis queue from window
        if (window.AnalysisQueue && window.AnalysisQueue.showQueue) {
            window.AnalysisQueue.showQueue();
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
        console.log('⭐ Sorting table by high score to low score');
        
        // Get all leads
        const leads = this.stateManager.getState('leads') || [];
        
        // Sort by score descending (high to low)
        const sortedLeads = [...leads].sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Update state with sorted leads
        this.stateManager.setState('filteredLeads', sortedLeads);
        
        // Update sort dropdown to reflect the change
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.value = 'score-desc';
            
            // Trigger visual feedback on dropdown
            sortFilter.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => {
                sortFilter.classList.remove('ring-2', 'ring-blue-500');
            }, 1000);
        }
        
        // Show filter indicator badge
        this.showFilterBadge('Score (High to Low)', sortedLeads.length);
        
        // Display sorted leads using global LeadRenderer
        if (window.LeadRenderer) {
            window.LeadRenderer.displayLeads(sortedLeads);
        }
        
        // Emit event
        this.eventBus.emit('leads:sorted', { 
            type: 'score', 
            order: 'desc',
            count: sortedLeads.length 
        });
        
        // Auto-scroll to results
        const leadsSection = document.getElementById('leads-section') || 
                            document.querySelector('.leads-table-container');
        if (leadsSection) {
            leadsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showFilterBadge(filterText, count) {
        // Check if badge container exists in table header
        let badgeContainer = document.getElementById('active-filter-badge');
        
        if (!badgeContainer) {
            // Create badge container if it doesn't exist
            const tableHeader = document.querySelector('.glass-white.rounded-2xl .p-6.pb-4');
            if (tableHeader) {
                const titleDiv = tableHeader.querySelector('.flex.items-center.justify-between.mb-4 > div');
                if (titleDiv) {
                    badgeContainer = document.createElement('div');
                    badgeContainer.id = 'active-filter-badge';
                    badgeContainer.className = 'mt-2';
                    titleDiv.appendChild(badgeContainer);
                }
            }
        }
        
        if (badgeContainer) {
            badgeContainer.innerHTML = `
                <div class="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg animate-fadeIn">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                    </svg>
                    <span class="text-sm font-medium text-blue-700">Active Filter: ${filterText}</span>
                    <span class="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">${count} leads</span>
                    <button onclick="window.statsCards.clearFilter()" class="ml-1 text-blue-600 hover:text-blue-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
        }
    }

    clearFilter() {
        console.log('🔄 Clearing filter');
        
        // Reset to all leads
        const allLeads = this.stateManager.getState('leads') || [];
        this.stateManager.setState('filteredLeads', allLeads);
        
        // Reset sort dropdown to default
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.value = 'date-desc';
        }
        
        // Display all leads using global LeadRenderer
        if (window.LeadRenderer) {
            window.LeadRenderer.displayLeads(allLeads);
        }
        
        // Remove filter badge
        const badgeContainer = document.getElementById('active-filter-badge');
        if (badgeContainer) {
            badgeContainer.innerHTML = '';
        }
        
        // Emit event
        this.eventBus.emit('leads:filter-cleared');
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
        
        // Get queue data from global AnalysisQueue
        if (window.AnalysisQueue && window.AnalysisQueue.getQueueData) {
            const queueData = window.AnalysisQueue.getQueueData();
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

// Make StatsCards globally accessible for onclick handlers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsCards;
} else {
    window.StatsCards = StatsCards;
}

console.log('📊 [StatsCards] Migrated version loaded successfully');
