//public/pages/dashboard/modules/leads/lead-renderer.js

/**
 * OSLIRA LEAD RENDERER MODULE - ENHANCED PROFESSIONAL CRM VERSION
 * Handles all lead display, card rendering, and UI presentation
 * Fixed layout with proper column alignment and no select column
 */
class LeadRenderer {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
        this.stateManager = container.get('stateManager');
        this.osliraAuth = container.get('osliraAuth');
        
        // Cache for rendered elements
        this.renderCache = new Map();
        this.dateFormatCache = new Map();
        
        console.log('🚀 [LeadRenderer] Enhanced version initialized');
    }
    
    async init() {
        // Listen to data changes for re-rendering
        this.stateManager.subscribe('leads', this.handleLeadsChanged.bind(this));
        this.stateManager.subscribe('filteredLeads', this.handleFilteredLeadsChanged.bind(this));
        this.stateManager.subscribe('selectedLeads', this.handleSelectionChanged.bind(this));
        
        console.log('✅ [LeadRenderer] Event listeners initialized');
    }
    
    // ===============================================================================
    // EVENT HANDLERS
    // ===============================================================================
    
handleLeadsChanged(leads) {
    // Debounce rapid re-renders
    if (this.renderTimeout) {
        clearTimeout(this.renderTimeout);
    }
    this.renderTimeout = setTimeout(() => {
        console.log('🔄 [LeadRenderer] Leads data changed, re-rendering');
        this.displayLeads(leads);
        this.renderTimeout = null;
    }, 50);
}
    
    handleFilteredLeadsChanged(filteredLeads) {
        console.log('🔄 [LeadRenderer] Filtered leads changed, re-rendering');
        this.displayLeads(filteredLeads);
    }
    
    handleSelectionChanged(selectedLeads) {
        console.log('🔄 [LeadRenderer] Selection changed, updating UI');
        this.updateBulkActionsVisibility(selectedLeads.size > 0);
        this.updateSelectionUI();
    }
    
    // ===============================================================================
    // MAIN DISPLAY FUNCTION
    // ===============================================================================
    
displayLeads(leads = null) {
    // Use visibleLeads for pagination support, fallback to filteredLeads, then all leads
    const leadsToDisplay = leads || 
                          this.stateManager.getState('visibleLeads') || 
                          this.stateManager.getState('filteredLeads') || 
                          this.stateManager.getState('leads');
    let tableBody = document.getElementById('leads-table-body');
    const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
    
    // ENHANCED DEBUGGING
    console.log('🔍 [LeadRenderer] DEBUG displayLeads called with:', {
        providedLeads: leads?.length || 'null',
        visibleLeads: this.stateManager.getState('visibleLeads')?.length || 'none',
        filteredLeads: this.stateManager.getState('filteredLeads')?.length || 'none', 
        allLeads: this.stateManager.getState('leads')?.length || 'none',
        finalLeadsToDisplay: leadsToDisplay?.length || 'none',
        isLoading: this.stateManager.getState('isLoading'),
        tableBodyExists: !!tableBody
    });
    
if (!tableBody) {
    console.warn('⚠️ [LeadRenderer] Table body element not found, creating structure...');
    this.createTableStructureIfMissing();
    // Try to get the table body again after creating structure
    const newTableBody = document.getElementById('leads-table-body');
    if (!newTableBody) {
        console.error('❌ [LeadRenderer] Could not create table structure');
        return;
    }
    // Continue with the newly created table body
    tableBody = newTableBody; // Now this works
}
    
    console.log(`🎨 [LeadRenderer] Displaying ${leadsToDisplay?.length || 0} leads with enhanced styling`);
        
        // Show loading state if needed
        if (this.stateManager.getState('isLoading')) {
            this.renderLoadingState(tableBody);
            return;
        }
        
        // Handle empty state
        if (leadsToDisplay.length === 0) {
            this.renderEmptyState(tableBody);
            this.updateLeadCounts(0, 0);
            return;
        }
        
        // Render leads with enhanced styling
        const leadCards = leadsToDisplay.map(lead => this.createLeadCard(lead)).join('');
        tableBody.innerHTML = leadCards;
        
        // Update counts
        this.updateLeadCounts(leadsToDisplay.length, selectedLeads.size);
        
        // Update bulk actions visibility
        this.updateBulkActionsVisibility(selectedLeads.size > 0);
        
        // Emit render complete event
        this.eventBus.emit('leads:rendered', {
            count: leadsToDisplay.length,
            selected: selectedLeads.size
        });
        
        console.log('✅ [LeadRenderer] Enhanced leads display completed');
    }

    // ===============================================================================
    // ENHANCED LEAD CARD CREATION - FIXED LAYOUT
    // ===============================================================================
    
    createLeadCard(lead) {
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        const isSelected = selectedLeads.has(lead.id);
        const score = lead.score || 0;
        
        // Enhanced score configuration
        const getScoreConfig = (score) => {
            if (score >= 90) return { 
                class: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
                label: 'Excellent', 
                color: 'emerald',
                icon: '🌟',
                gradient: 'from-emerald-500 to-emerald-600',
                barGradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
                borderColor: 'border-emerald-500'
            };
            if (score >= 75) return { 
                class: 'bg-blue-100 text-blue-800 border-blue-200', 
                label: 'Strong', 
                color: 'blue',
                icon: '💪',
                gradient: 'from-blue-500 to-blue-600',
                barGradient: 'from-blue-400 via-blue-500 to-blue-600',
                borderColor: 'border-blue-500'
            };
            if (score >= 60) return { 
                class: 'bg-amber-100 text-amber-800 border-amber-200', 
                label: 'Moderate', 
                color: 'amber',
                icon: '⚡',
                gradient: 'from-amber-500 to-orange-500',
                barGradient: 'from-amber-400 via-amber-500 to-orange-500',
                borderColor: 'border-amber-500'
            };
            return { 
                class: 'bg-slate-100 text-slate-600 border-slate-200', 
                label: 'Low', 
                color: 'slate',
                icon: '📊',
                gradient: 'from-slate-400 to-slate-500',
                barGradient: 'from-slate-300 via-slate-400 to-slate-500',
                borderColor: 'border-slate-400'
            };
        };
        
        const scoreConfig = getScoreConfig(score);
        
        // Enhanced platform configuration
        const getPlatformConfig = (platform) => {
            const configs = {
                instagram: { 
                    icon: '📷', 
                    class: 'bg-gradient-to-br from-pink-50 to-rose-50 text-pink-700 hover:from-pink-100 hover:to-rose-100', 
                    name: 'Instagram',
                    gradient: 'from-pink-400 to-rose-500',
                    iconBg: 'bg-pink-100'
                },
                tiktok: { 
                    icon: '🎵', 
                    class: 'bg-gradient-to-br from-purple-50 to-violet-50 text-purple-700 hover:from-purple-100 hover:to-violet-100', 
                    name: 'TikTok',
                    gradient: 'from-purple-400 to-violet-500',
                    iconBg: 'bg-purple-100'
                },
                youtube: { 
                    icon: '📺', 
                    class: 'bg-gradient-to-br from-red-50 to-orange-50 text-red-700 hover:from-red-100 hover:to-orange-100', 
                    name: 'YouTube',
                    gradient: 'from-red-400 to-orange-500',
                    iconBg: 'bg-red-100'
                },
                twitter: { 
                    icon: '🐦', 
                    class: 'bg-gradient-to-br from-blue-50 to-sky-50 text-blue-700 hover:from-blue-100 hover:to-sky-100', 
                    name: 'Twitter',
                    gradient: 'from-blue-400 to-sky-500',
                    iconBg: 'bg-blue-100'
                }
            };
            return configs[platform] || { 
                icon: '🌐', 
                class: 'bg-gradient-to-br from-slate-50 to-gray-50 text-slate-700 hover:from-slate-100 hover:to-gray-100', 
                name: platform || 'Unknown',
                gradient: 'from-slate-400 to-gray-500',
                iconBg: 'bg-slate-100'
            };
        };
        
        const platformConfig = getPlatformConfig(lead.platform);
        
// Enhanced analysis type badge with updated 3-type system
const getAnalysisConfig = (analysisType) => {
    switch (analysisType) {
        case 'light':
            return { 
                class: 'bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 hover:from-emerald-100 hover:to-green-100', 
                label: 'Quick', 
                icon: '⚡',
                gradient: 'from-emerald-400 to-green-500',
                iconBg: 'bg-emerald-100'
            };
        case 'deep':
            return { 
                class: 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100', 
                label: 'Profile', 
                icon: '👤',
                gradient: 'from-blue-400 to-indigo-500',
                iconBg: 'bg-blue-100'
            };
        case 'xray':
            return { 
                class: 'bg-gradient-to-br from-purple-50 to-violet-50 text-purple-700 hover:from-purple-100 hover:to-violet-100', 
                label: 'X-Ray Analysis', 
                icon: '🔬',
                gradient: 'from-purple-400 to-violet-500',
                iconBg: 'bg-purple-100'
            };
        default:
            return { 
                class: 'bg-gradient-to-br from-slate-50 to-gray-50 text-slate-600 hover:from-slate-100 hover:to-gray-100', 
                label: 'Unknown', 
                icon: '❓',
                gradient: 'from-slate-400 to-gray-500',
                iconBg: 'bg-slate-100'
            };
    }
};

const analysisConfig = getAnalysisConfig(lead.analysis_type);

        // Enhanced date formatting
        const dateKey = lead.updated_at || lead.created_at;
        let formattedDate = this.dateFormatCache.get(dateKey);
        if (!formattedDate) {
            formattedDate = this.formatDateProfessional(dateKey);
            this.dateFormatCache.set(dateKey, formattedDate);
        }
        
        // Professional profile picture with enhanced fallback
        const profilePicUrl = lead.profile_picture_url;
        const username = lead.username || 'unknown';
        const fullName = lead.display_name || '';
        
        
const profilePicHtml = profilePicUrl
    ? `<img src="https://images.weserv.nl/?url=${encodeURIComponent(profilePicUrl)}&w=64&h=64&fit=cover&mask=circle&errorredirect=https://via.placeholder.com/64x64/3B82F6/FFFFFF?text=${username.charAt(0).toUpperCase()}" 
           alt="@${username}" 
           class="w-12 h-12 rounded-full border-2 border-slate-200 object-cover shadow-sm hover:scale-105 transition-transform duration-200"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
    : '';
            
        const fallbackHtml = `
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-slate-200 shadow-sm hover:scale-105 transition-transform duration-200 ${profilePicUrl ? 'hidden' : 'flex'}">
                ${username.charAt(0).toUpperCase()}
            </div>
        `;

return `
    <tr class="table-row relative hover:bg-purple-50 hover:shadow-md transition-all duration-200 ${isSelected ? 'bg-blue-50/50' : ''} border-l-4 ${this.getRowAccentColor(score)} odd:bg-slate-25/20" 
        data-lead-id="${lead.id}">
    
   <!-- Hidden selection checkbox that appears on hover at far left -->
<div class="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 transition-all duration-200 z-20 checkbox-container">
                    <input type="checkbox" 
                           class="lead-checkbox w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 bg-white shadow-md"
                           data-lead-id="${lead.id}"
                           ${isSelected ? 'checked' : ''}
                           onchange="dashboard.toggleLeadSelection && dashboard.toggleLeadSelection('${lead.id}', this.checked)">
                </div>
                
                <!-- Lead Profile - Wider column -->
                <td class="pl-12 pr-6 py-4 border-r border-slate-100/60" style="width: 280px;">
                    <div class="flex items-center space-x-3">
                        <div class="flex-shrink-0 relative">
                            ${profilePicHtml}
                            ${fallbackHtml}
                            ${lead.is_verified ? 
                                '<div class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg></div>' : ''
                            }
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2 mb-1">
                                <p class="text-sm font-semibold text-slate-900 truncate" title="@${username}">@${username}</p>
                                ${lead.account_type === 'business' ? 
                                    '<span class="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-md border border-orange-200 flex-shrink-0">Business</span>' : ''}
                            </div>
                            ${fullName ? `<div class="text-sm text-slate-600 truncate mb-0.5" title="${fullName}">${fullName}</div>` : ''}
                            ${lead.followers_count ? `<div class="text-xs text-slate-500">${this.formatNumber(lead.followers_count)} followers</div>` : ''}
                        </div>
                    </div>
                </td>
                
                <!-- Platform - Centered -->
                <td class="px-6 py-4 border-r border-slate-100/60" style="width: 160px;">
                    <div class="flex items-center justify-center">
<div class="relative platform-hover-group">
    <div class="absolute -inset-0.5 bg-gradient-to-r ${platformConfig.gradient} rounded-lg blur opacity-0 transition duration-300"></div>
                            <div class="relative inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold ${platformConfig.class} shadow-sm hover:shadow-md transition-all duration-200 border-0">
                                <div class="flex items-center space-x-2">
                                    <div class="w-5 h-5 flex items-center justify-center ${platformConfig.iconBg} rounded-full">
                                        <span class="text-xs">${platformConfig.icon}</span>
                                    </div>
                                    <span>${platformConfig.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
                
                <!-- Intelligence Score -->
                <td class="px-6 py-4 border-r border-slate-100/60" style="width: 240px;">
                    <div class="relative">
                        <!-- Score value with modern styling -->
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-baseline space-x-1">
                                <span class="text-2xl font-bold text-slate-900">${score}</span>
                                <span class="text-sm text-slate-500 font-medium">/100</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                ${scoreConfig.icon ? `<span class="text-sm">${scoreConfig.icon}</span>` : ''}
                                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${scoreConfig.gradient} text-white shadow-sm">
                                    ${scoreConfig.label}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Enhanced progress bar with glow effect -->
                        <div class="relative">
                            <div class="w-full bg-slate-100 rounded-full h-3 shadow-inner">
                                <div class="bg-gradient-to-r ${scoreConfig.barGradient} h-3 rounded-full transition-all duration-500 ease-out shadow-sm relative overflow-hidden" 
                                     style="width: ${score}%">
                                    <!-- Animated shine effect -->
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
                                </div>
                            </div>
                            <!-- Score indicator dot -->
                            <div class="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 ${scoreConfig.borderColor} transition-all duration-300"
                                 style="left: calc(${score}% - 8px)"></div>
                        </div>
                    </div>
                </td>
                
                <!-- Analysis Type - Centered -->
                <td class="px-6 py-4 border-r border-slate-100/60" style="width: 180px;">
                    <div class="flex items-center justify-center">
<div class="relative analysis-hover-group">
    <div class="absolute -inset-0.5 bg-gradient-to-r ${analysisConfig.gradient} rounded-lg blur opacity-0 transition duration-300"></div>
                            <div class="relative inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold ${analysisConfig.class} shadow-sm hover:shadow-md transition-all duration-200 border-0">
                                <div class="flex items-center space-x-2">
                                    <div class="w-5 h-5 flex items-center justify-center ${analysisConfig.iconBg} rounded-full">
                                        <span class="text-xs">${analysisConfig.icon}</span>
                                    </div>
                                    <span>${analysisConfig.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
                
                <!-- Date - Centered -->
                <td class="px-6 py-4 border-r border-slate-100/60" style="width: 140px;">
                    <div class="text-center">
                        <div class="text-sm text-slate-900">${formattedDate.date}</div>
                        <div class="text-xs text-slate-500">${formattedDate.time}</div>
                    </div>
                </td>
                
                <!-- Actions - Centered -->
                <td class="px-6 py-4" style="width: 140px;">
                    <div class="flex items-center justify-center">
                        <button onclick="openLeadAnalysisModal('${lead.id}')"
                                class="action-button relative inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                title="View detailed analysis">
                            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            <svg class="relative w-4 h-4 mr-2 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                            <span class="relative">Analysis</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ===============================================================================
    // TABLE STRUCTURE - FIXED LAYOUT
    // ===============================================================================

    createTableStructureIfMissing() {
        const leadsContainer = document.querySelector('.leads-table-container');
        if (!leadsContainer) {
            console.error('❌ [LeadRenderer] Leads container not found - cannot create table structure');
            return;
        }
        
        console.log('🔧 [LeadRenderer] Creating enhanced table structure...');
        
        const tableHTML = `
            <table class="leads-table w-full border-separate border-spacing-0">
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100/80 backdrop-blur-sm sticky top-0 z-10">
                    <tr class="border-b border-slate-200/60">
                        <th class="pl-12 pr-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 280px;">Lead Profile</th>
                        <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 160px;">Platform</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 240px;">Intelligence Score</th>
                        <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 180px;">Analysis Type</th>
                        <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 140px;">Date Added</th>
                        <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider" style="width: 140px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="leads-table-body" class="divide-y divide-slate-200/60 bg-white">
                    <!-- Leads will be populated by JavaScript -->
                </tbody>
            </table>
        `;
        
        leadsContainer.innerHTML = tableHTML;
        console.log('✅ [LeadRenderer] Enhanced table structure created');
    }

    // ===============================================================================
    // UTILITY METHODS
    // ===============================================================================

    getRowAccentColor(score) {
        if (score >= 90) return 'border-emerald-400';
        if (score >= 75) return 'border-blue-400';
        if (score >= 60) return 'border-amber-400';
        return 'border-slate-300';
    }

    formatDateProfessional(dateString) {
        if (!dateString) return { date: 'Unknown', time: '' };
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            // Format date
            let dateFormatted;
            if (diffDays === 0) {
                dateFormatted = 'Today';
            } else if (diffDays === 1) {
                dateFormatted = 'Yesterday';
            } else if (diffDays < 7) {
                dateFormatted = `${diffDays} days ago`;
            } else {
                dateFormatted = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
            
            // Format time
            let timeFormatted;
            if (diffMinutes < 60) {
                timeFormatted = `${diffMinutes}m ago`;
            } else if (diffHours < 24) {
                timeFormatted = `${diffHours}h ago`;
            } else {
                timeFormatted = date.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                });
            }
            
            return { date: dateFormatted, time: timeFormatted };
        } catch (error) {
            console.warn('⚠️ [LeadRenderer] Date formatting error:', error);
            return { date: 'Invalid date', time: '' };
        }
    }

    formatNumber(num) {
        if (!num) return '0';
        
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // ===============================================================================
    // UI HELPERS
    // ===============================================================================

    updateBulkActionsVisibility(show) {
        const toolbar = document.getElementById('bulk-actions-toolbar');
        const selectionCount = document.getElementById('selection-count');
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        
        if (toolbar) {
            if (show && selectedLeads.size > 0) {
                toolbar.classList.remove('hidden');
                if (selectionCount) {
                    selectionCount.textContent = `${selectedLeads.size} selected`;
                }
            } else {
                toolbar.classList.add('hidden');
            }
        }
    }

    updateLeadCounts(visibleCount, totalCount) {
        const resultsCount = document.getElementById('results-count');
        const totalCountEl = document.getElementById('total-count');
        const leadCountDisplay = document.getElementById('lead-count-display');
        
        const allLeads = this.stateManager.getState('leads') || [];
        const actualTotal = allLeads.length;
        
        if (resultsCount) {
            resultsCount.textContent = `Showing ${visibleCount} leads`;
        }
        
        if (totalCountEl) {
            totalCountEl.textContent = `Total: ${actualTotal}`;
        }
        
        if (leadCountDisplay) {
            if (actualTotal === 0) {
                leadCountDisplay.textContent = 'No leads in pipeline';
            } else if (actualTotal === 1) {
                leadCountDisplay.textContent = '1 lead in pipeline';
            } else {
                leadCountDisplay.textContent = `${actualTotal} leads in pipeline`;
            }
        }
    }

    updateSelectionUI() {
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        const checkboxes = document.querySelectorAll('.lead-checkbox');
        
        checkboxes.forEach(checkbox => {
            const leadId = checkbox.dataset.leadId;
            checkbox.checked = selectedLeads.has(leadId);
        });
    }

    renderLoadingState(tableBody) {
        const loadingRows = Array.from({ length: 5 }, (_, i) => `
            <tr class="animate-pulse">
                <td class="pl-12 pr-6 py-4">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div class="flex-1">
                            <div class="w-24 h-4 bg-slate-200 rounded mb-2"></div>
                            <div class="w-16 h-3 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="w-20 h-6 bg-slate-200 rounded mx-auto"></div>
                </td>
                <td class="px-6 py-4">
                    <div class="w-full h-8 bg-slate-200 rounded"></div>
                </td>
                <td class="px-6 py-4">
                    <div class="w-16 h-6 bg-slate-200 rounded mx-auto"></div>
                </td>
                <td class="px-6 py-4">
                    <div class="w-16 h-4 bg-slate-200 rounded mx-auto"></div>
                </td>
                <td class="px-6 py-4">
                    <div class="w-20 h-8 bg-slate-200 rounded mx-auto"></div>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = loadingRows;
    }

renderEmptyState(tableBody) {
    console.log('📭 [LeadRenderer] Rendering empty state');
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center space-y-4">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">No leads found</h3>
                        <p class="text-sm text-gray-500 mt-1">Your lead pipeline is empty. Start by analyzing new leads.</p>
                    </div>
                    <button onclick="window.openResearchModal?.()" class="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                        Add First Lead
                    </button>
                </div>
            </td>
        </tr>
    `;
    
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
        emptyState.classList.remove('hidden');
    }
}

    // ===============================================================================
    // LEGACY COMPATIBILITY METHODS
    // ===============================================================================

    selectLead(checkbox) {
        const leadId = checkbox.dataset.leadId || checkbox.getAttribute('data-lead-id');
        const isChecked = checkbox.checked;
        
        if (window.dashboard && window.dashboard.toggleLeadSelection) {
            window.dashboard.toggleLeadSelection(leadId, isChecked);
        }
    }

    toggleAllLeads(masterCheckbox) {
        const checkboxes = document.querySelectorAll('.lead-checkbox');
        const isChecked = masterCheckbox.checked;
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const leadId = checkbox.dataset.leadId;
            if (leadId && window.dashboard && window.dashboard.toggleLeadSelection) {
                window.dashboard.toggleLeadSelection(leadId, isChecked);
            }
        });
    }

    searchLeads(term) {
        console.log('🔍 [LeadRenderer] Search term:', term);
        if (window.dashboard && window.dashboard.filterLeadsBySearch) {
            window.dashboard.filterLeadsBySearch(term);
        }
    }

    filterLeads(filter) {
        console.log('🔍 [LeadRenderer] Filter:', filter);
        if (window.dashboard && window.dashboard.applyLeadFilter) {
            window.dashboard.applyLeadFilter(filter);
        }
    }

    editMessage(leadId) {
        console.log('✏️ [LeadRenderer] Edit message for lead:', leadId);
    }

    saveEditedMessage(leadId) {
        console.log('💾 [LeadRenderer] Save message for lead:', leadId);
    }

    // ===============================================================================
    // SEARCH AND FILTER FUNCTIONALITY
    // ===============================================================================

    filterLeadsBySearch(leads, searchTerm) {
        if (!searchTerm || !searchTerm.trim()) return leads;
        
        const term = searchTerm.toLowerCase().trim();
        return leads.filter(lead => {
            const username = (lead.username || '').toLowerCase();
            const fullName = (lead.full_name || '').toLowerCase();
            const platform = (lead.platform || '').toLowerCase();
            
            return username.includes(term) || 
                   fullName.includes(term) || 
                   platform.includes(term);
        });
    }

    filterLeadsByPlatform(leads, platform) {
        if (!platform || platform === 'all') return leads;
        return leads.filter(lead => lead.platform === platform);
    }

    filterLeadsByScore(leads, scoreFilter) {
        if (!scoreFilter || scoreFilter === 'all') return leads;
        
        switch (scoreFilter) {
            case 'high-score':
                return leads.filter(lead => (lead.score || 0) >= 80);
            case 'medium-score':
                return leads.filter(lead => {
                    const score = lead.score || 0;
                    return score >= 60 && score < 80;
                });
            case 'low-score':
                return leads.filter(lead => (lead.score || 0) < 60);
            default:
                return leads;
        }
    }

    // ===============================================================================
    // PAGINATION SUPPORT
    // ===============================================================================

    paginateLeads(leads, page = 1, pageSize = 25) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        return {
            leads: leads.slice(startIndex, endIndex),
            totalCount: leads.length,
            currentPage: page,
            totalPages: Math.ceil(leads.length / pageSize),
            hasNext: endIndex < leads.length,
            hasPrev: page > 1
        };
    }

    // ===============================================================================
    // ANIMATION AND EFFECTS
    // ===============================================================================

    animateLeadEntry(leadElement) {
        if (!leadElement) return;
        
        leadElement.style.opacity = '0';
        leadElement.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            leadElement.style.transition = 'all 0.3s ease-out';
            leadElement.style.opacity = '1';
            leadElement.style.transform = 'translateY(0)';
        });
    }

    animateLeadRemoval(leadElement, callback) {
        if (!leadElement) {
            if (callback) callback();
            return;
        }
        
        leadElement.style.transition = 'all 0.3s ease-in';
        leadElement.style.opacity = '0';
        leadElement.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    // ===============================================================================
    // ERROR HANDLING
    // ===============================================================================

    handleRenderError(error, leads) {
        console.error('❌ [LeadRenderer] Render error:', error);
        
        const tableBody = document.getElementById('leads-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center space-y-3">
                            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-900">Unable to display leads</h3>
                                <p class="text-sm text-slate-600 mt-1">There was an error rendering the lead data. Please try refreshing.</p>
                            </div>
                            <button onclick="window.location.reload()" 
                                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Refresh Page
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // ===============================================================================
    // ADVANCED FEATURES
    // ===============================================================================

    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>');
    }

    sortLeads(leads, sortBy, sortOrder = 'desc') {
        if (!leads || leads.length === 0) return [];
        
        const sortedLeads = [...leads];
        
        sortedLeads.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'username':
                    aValue = (a.username || '').toLowerCase();
                    bValue = (b.username || '').toLowerCase();
                    break;
                case 'platform':
                    aValue = a.platform || '';
                    bValue = b.platform || '';
                    break;
                case 'score':
                    aValue = a.score || 0;
                    bValue = b.score || 0;
                    break;
                case 'date':
                    aValue = new Date(a.updated_at || a.created_at);
                    bValue = new Date(b.updated_at || b.created_at);
                    break;
                case 'followers':
                    aValue = a.followers_count || 0;
                    bValue = b.followers_count || 0;
                    break;
                default:
                    aValue = new Date(a.updated_at || a.created_at);
                    bValue = new Date(b.updated_at || b.created_at);
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sortedLeads;
    }

    // ===============================================================================
    // BULK OPERATIONS
    // ===============================================================================

    selectAllVisibleLeads() {
        const visibleRows = document.querySelectorAll('#leads-table-body tr[data-lead-id]');
        const selectedLeads = new Set();
        
        visibleRows.forEach(row => {
            const leadId = row.dataset.leadId;
            if (leadId) {
                selectedLeads.add(leadId);
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = true;
            }
        });
        
        this.stateManager.setState('selectedLeads', selectedLeads);
        this.updateSelectionUI();
        this.updateBulkActionsVisibility(true);
        
        console.log('✅ [LeadRenderer] All visible leads selected:', selectedLeads.size);
    }

    clearAllSelections() {
        const selectedLeads = new Set();
        this.stateManager.setState('selectedLeads', selectedLeads);
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateBulkActionsVisibility(false);
        console.log('🧹 [LeadRenderer] All selections cleared');
    }

    getSelectedLeadsData() {
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        const allLeads = this.stateManager.getState('leads') || [];
        
        return allLeads.filter(lead => selectedLeads.has(lead.id));
    }

    // ===============================================================================
    // PERFORMANCE OPTIMIZATIONS
    // ===============================================================================

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    createVirtualizedRenderer(leads, containerHeight = 600, rowHeight = 80) {
        const visibleRows = Math.ceil(containerHeight / rowHeight);
        const buffer = 5;
        
        return {
            totalRows: leads.length,
            visibleRows: visibleRows + buffer,
            rowHeight,
            
            getVisibleRange(scrollTop) {
                const startIndex = Math.floor(scrollTop / rowHeight);
                const endIndex = Math.min(startIndex + visibleRows + buffer, leads.length);
                
                return {
                    start: Math.max(0, startIndex - buffer),
                    end: endIndex,
                    leads: leads.slice(Math.max(0, startIndex - buffer), endIndex)
                };
            }
        };
    }

    // ===============================================================================
    // ACCESSIBILITY ENHANCEMENTS
    // ===============================================================================

    addAccessibilityAttributes() {
        const table = document.querySelector('.leads-table');
        if (table) {
            table.setAttribute('role', 'table');
            table.setAttribute('aria-label', 'Lead intelligence pipeline data');
        }

        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.leads-table')) {
                this.handleKeyboardNavigation(e);
            }
        });
    }

    handleKeyboardNavigation(event) {
        const { key, target } = event;
        const currentRow = target.closest('tr');
        
        if (!currentRow) return;
        
        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                const nextRow = currentRow.nextElementSibling;
                if (nextRow) {
                    const firstInput = nextRow.querySelector('input, button');
                    if (firstInput) firstInput.focus();
                }
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                const prevRow = currentRow.previousElementSibling;
                if (prevRow) {
                    const firstInput = prevRow.querySelector('input, button');
                    if (firstInput) firstInput.focus();
                }
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

    // ===============================================================================
    // CLEANUP
    // ===============================================================================

    cleanup() {
        this.renderCache.clear();
        this.dateFormatCache.clear();
        console.log('🧹 [LeadRenderer] Cleanup completed');
    }
}

// ===============================================================================
// GLOBAL EXPORT
// ===============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeadRenderer;
} else if (typeof window !== 'undefined') {
    window.LeadRenderer = LeadRenderer;
    console.log('✅ [LeadRenderer] Enhanced renderer class available globally');
}
