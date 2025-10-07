// ===============================================================================
// FILTER MODAL - Advanced Lead Selection System
// Comprehensive filtering for bulk operations
// ===============================================================================

class FilterModal {
    constructor(container) {
        this.container = container;
        this.stateManager = container.get('stateManager');
        this.eventBus = container.get('eventBus');
        this.isOpen = false;
        this.filters = this.getDefaultFilters();
    }

    getDefaultFilters() {
        return {
            score: { enabled: false, operator: 'above', value: 50 },
            date: { enabled: false, operator: 'before', value: this.getTodayDate() },
            platform: { enabled: false, value: 'all' },
            analysisType: { enabled: false, value: 'all' },
            followerCount: { enabled: false, operator: 'above', value: 1000 }
        };
    }

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    openModal() {
        this.isOpen = true;
        const modal = document.getElementById('filter-modal');
        const backdrop = document.getElementById('filter-modal-backdrop');
        
        if (modal && backdrop) {
            backdrop.classList.remove('hidden');
            modal.classList.remove('hidden');
            
            // Trigger animation
            requestAnimationFrame(() => {
                backdrop.classList.add('active');
                modal.classList.add('active');
            });
            
            console.log('🔍 [FilterModal] Modal opened');
        }
    }

    closeModal() {
        this.isOpen = false;
        const modal = document.getElementById('filter-modal');
        const backdrop = document.getElementById('filter-modal-backdrop');
        
        if (modal && backdrop) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
            
            setTimeout(() => {
                backdrop.classList.add('hidden');
                modal.classList.add('hidden');
            }, 300);
            
            console.log('🔍 [FilterModal] Modal closed');
        }
    }

    applyFilters() {
        const allLeads = this.stateManager.getState('leads') || [];
        let filteredLeads = [...allLeads];
        let activeFilters = [];

        // Score filter
        if (this.filters.score.enabled) {
            const { operator, value } = this.filters.score;
            filteredLeads = filteredLeads.filter(lead => {
                const score = lead.score || 0;
                if (operator === 'above') return score > value;
                if (operator === 'below') return score < value;
                if (operator === 'equals') return score === value;
                return true;
            });
            activeFilters.push(`Score ${operator} ${value}`);
        }

        // Date filter
        if (this.filters.date.enabled) {
            const { operator, value } = this.filters.date;
            const filterDate = new Date(value);
            filteredLeads = filteredLeads.filter(lead => {
                const leadDate = new Date(lead.created_at || lead.scraped_at || Date.now());
                if (operator === 'before') return leadDate < filterDate;
                if (operator === 'after') return leadDate > filterDate;
                if (operator === 'on') return leadDate.toDateString() === filterDate.toDateString();
                return true;
            });
            activeFilters.push(`Date ${operator} ${value}`);
        }

        // Platform filter
        if (this.filters.platform.enabled && this.filters.platform.value !== 'all') {
            filteredLeads = filteredLeads.filter(lead => 
                (lead.platform || '').toLowerCase() === this.filters.platform.value.toLowerCase()
            );
            activeFilters.push(`Platform: ${this.filters.platform.value}`);
        }

        // Analysis type filter
        if (this.filters.analysisType.enabled && this.filters.analysisType.value !== 'all') {
            filteredLeads = filteredLeads.filter(lead => 
                (lead.analysis_type || 'quick') === this.filters.analysisType.value
            );
            activeFilters.push(`Analysis: ${this.filters.analysisType.value}`);
        }

        // Follower count filter
        if (this.filters.followerCount.enabled) {
            const { operator, value } = this.filters.followerCount;
            filteredLeads = filteredLeads.filter(lead => {
                const followers = lead.followers_count || 0;
                if (operator === 'above') return followers > value;
                if (operator === 'below') return followers < value;
                if (operator === 'equals') return followers === value;
                return true;
            });
            activeFilters.push(`Followers ${operator} ${value}`);
        }

        // Auto-select filtered leads
        const selectedLeads = new Set(filteredLeads.map(lead => lead.id));
        this.stateManager.setState('selectedLeads', selectedLeads);
        this.stateManager.setState('filteredLeads', filteredLeads);

        // Update UI
        const leadsTable = this.container.get('leadsTable');
        const leadRenderer = this.container.get('leadRenderer');
        
        if (leadsTable) {
            leadsTable.updateBulkActionsBar(selectedLeads.size);
            leadsTable.updateBulkActionsToolbar(selectedLeads.size);
            leadsTable.updateSelectAllCheckbox();
        }
        
        if (leadRenderer) {
            leadRenderer.displayLeads(filteredLeads);
        }

        this.closeModal();

        // Show confirmation message
        const message = activeFilters.length > 0 
            ? `Selected ${selectedLeads.size} leads matching: ${activeFilters.join(', ')}`
            : `Selected all ${selectedLeads.size} leads`;
        
        this.showNotification(message, 'success');

        console.log(`✅ [FilterModal] Applied filters: ${selectedLeads.size} leads selected`);
    }

    resetFilters() {
        this.filters = this.getDefaultFilters();
        this.updateModalUI();
        console.log('🔄 [FilterModal] Filters reset');
    }

    updateModalUI() {
        // Update all form controls to match current filter state
        const elements = {
            'filter-score-enabled': this.filters.score.enabled,
            'filter-score-operator': this.filters.score.operator,
            'filter-score-value': this.filters.score.value,
            'filter-date-enabled': this.filters.date.enabled,
            'filter-date-operator': this.filters.date.operator,
            'filter-date-value': this.filters.date.value,
            'filter-platform-enabled': this.filters.platform.enabled,
            'filter-platform-value': this.filters.platform.value,
            'filter-analysis-enabled': this.filters.analysisType.enabled,
            'filter-analysis-value': this.filters.analysisType.value,
            'filter-followers-enabled': this.filters.followerCount.enabled,
            'filter-followers-operator': this.filters.followerCount.operator,
            'filter-followers-value': this.filters.followerCount.value
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (!element) return;
            
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = `fixed top-6 right-6 px-6 py-4 rounded-xl shadow-2xl border-2 z-[60] transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-blue-50 border-blue-500 text-blue-800'
        }`;
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    renderModal() {
        return `
<!-- Filter Modal Backdrop -->
<div id="filter-modal-backdrop" class="hidden fixed inset-0 bg-black/60 transition-opacity duration-300" style="z-index: 50; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">
</div>

<!-- Filter Modal Container -->
<div id="filter-modal" class="hidden fixed inset-0 flex items-center justify-center p-6 transition-all duration-300" style="z-index: 50; pointer-events: none;">
    <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden transform scale-95 transition-transform duration-300" style="pointer-events: auto;">
        
        <!-- Modal Header -->
        <div class="relative px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 class="text-2xl font-bold text-gray-900">Select by Filter</h2>
            <p class="text-sm text-gray-600 mt-1">Configure advanced filters to select multiple leads at once</p>
            <button onclick="window.closeFilterModal()" class="absolute top-6 right-6 p-2 rounded-lg hover:bg-white/80 transition-colors">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <!-- Modal Body - Scrollable -->
        <div class="px-8 py-6 overflow-y-auto" style="max-height: calc(85vh - 180px);">
            
            <!-- Score Filter -->
            <div class="mb-6 p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900">Score Filter</h3>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="filter-score-enabled" class="sr-only peer" onchange="window.updateFilterState('score', 'enabled', this.checked)">
                        <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                    </label>
                </div>
                <div class="flex items-center space-x-3">
                    <select id="filter-score-operator" class="px-4 py-2 bg-white border border-yellow-300 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent" onchange="window.updateFilterState('score', 'operator', this.value)">
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                        <option value="equals">Equals</option>
                    </select>
                    <div class="relative flex-1">
                        <input type="range" id="filter-score-value" min="0" max="100" value="50" class="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500" oninput="window.updateFilterState('score', 'value', parseInt(this.value)); document.getElementById('score-display').textContent = this.value">
                        <div class="flex justify-between mt-2 text-xs text-gray-600">
                            <span>0</span>
                            <span id="score-display" class="text-lg font-bold text-yellow-600">50</span>
                            <span>100</span>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-3 italic">Select leads whose score is above, below, or equal to your specified value</p>
            </div>

            <!-- Date Filter -->
            <div class="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900">Date Filter</h3>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="filter-date-enabled" class="sr-only peer" onchange="window.updateFilterState('date', 'enabled', this.checked)">
                        <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                </div>
                <div class="flex items-center space-x-3">
                    <select id="filter-date-operator" class="px-4 py-2 bg-white border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" onchange="window.updateFilterState('date', 'operator', this.value)">
                        <option value="before">Before</option>
                        <option value="after">After</option>
                        <option value="on">On</option>
                    </select>
                    <input type="date" id="filter-date-value" class="flex-1 px-4 py-2 bg-white border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" onchange="window.updateFilterState('date', 'value', this.value)">
                </div>
                <p class="text-sm text-gray-600 mt-3 italic">Filter leads by when they were added to your database</p>
            </div>

            <!-- Platform Filter -->
            <div class="mb-6 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900">Platform Filter</h3>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="filter-platform-enabled" class="sr-only peer" onchange="window.updateFilterState('platform', 'enabled', this.checked)">
                        <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                </div>
                <select id="filter-platform-value" class="w-full px-4 py-2 bg-white border border-purple-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" onchange="window.updateFilterState('platform', 'value', this.value)">
                    <option value="all">All Platforms</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                </select>
                <p class="text-sm text-gray-600 mt-3 italic">Filter by social media platform</p>
            </div>

            <!-- Analysis Type Filter -->
            <div class="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900">Analysis Type</h3>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="filter-analysis-enabled" class="sr-only peer" onchange="window.updateFilterState('analysisType', 'enabled', this.checked)">
                        <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
                <select id="filter-analysis-value" class="w-full px-4 py-2 bg-white border border-green-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" onchange="window.updateFilterState('analysisType', 'value', this.value)">
                    <option value="all">All Types</option>
                    <option value="quick">Quick</option>
                    <option value="light">Light</option>
                    <option value="deep">Deep</option>
                    <option value="xray">X-Ray</option>
                </select>
                <p class="text-sm text-gray-600 mt-3 italic">Filter by the depth of analysis performed</p>
            </div>

            <!-- Follower Count Filter -->
            <div class="mb-6 p-5 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900">Follower Count</h3>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="filter-followers-enabled" class="sr-only peer" onchange="window.updateFilterState('followerCount', 'enabled', this.checked)">
                        <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                </div>
                <div class="flex items-center space-x-3">
                    <select id="filter-followers-operator" class="px-4 py-2 bg-white border border-red-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent" onchange="window.updateFilterState('followerCount', 'operator', this.value)">
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                        <option value="equals">Equals</option>
                    </select>
                    <input type="number" id="filter-followers-value" value="1000" min="0" step="100" class="flex-1 px-4 py-2 bg-white border border-red-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent" onchange="window.updateFilterState('followerCount', 'value', parseInt(this.value))">
                </div>
                <p class="text-sm text-gray-600 mt-3 italic">Filter leads by their follower count</p>
            </div>

        </div>

        <!-- Modal Footer -->
        <div class="px-8 py-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button onclick="window.resetFilterModal()" class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Reset
            </button>
            <div class="flex items-center space-x-3">
                <button onclick="window.closeFilterModal()" class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                    Cancel
                </button>
                <button onclick="window.applyFiltersModal()" class="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    Apply & Select
                </button>
            </div>
        </div>

    </div>
</div>

<style>
#filter-modal-backdrop.active {
    opacity: 1;
}

#filter-modal.active > div {
    transform: scale(1);
    opacity: 1;
}

#filter-modal > div {
    opacity: 0;
    transform: scale(0.95);
}
</style>
        `;
    }

    setupEventHandlers() {
        const self = this;

        window.openFilterModal = () => self.openModal();
        window.closeFilterModal = () => self.closeModal();
        window.applyFiltersModal = () => self.applyFilters();
        window.resetFilterModal = () => self.resetFilters();

        window.updateFilterState = (category, field, value) => {
            if (field === 'enabled') {
                self.filters[category].enabled = value;
            } else {
                self.filters[category][field] = value;
            }
            console.log(`🔄 [FilterModal] Updated ${category}.${field} = ${value}`);
        };

        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'filter-modal-backdrop') {
                self.closeModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && self.isOpen) {
                self.closeModal();
            }
        });

        console.log('✅ [FilterModal] Event handlers attached');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterModal;
} else {
    window.FilterModal = FilterModal;
}
