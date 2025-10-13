// =============================================================================
// LEADS TABLE RENDERER - Pure HTML Generation
// Path: /public/pages/app/dashboard/ui/components/LeadsTableRenderer.js
// Dependencies: LeadService (for formatting)
// =============================================================================

/**
 * @class LeadsTableRenderer
 * @description Pure rendering - receives data, returns HTML
 * 
 * Rules:
 * - NO business logic
 * - NO state access (receives data as parameters)
 * - NO API calls
 * - Returns HTML strings only
 */
class LeadsTableRenderer {
    constructor(leadService) {
        this.leadService = leadService;
        console.log('🎨 [LeadsTableRenderer] Initialized');
    }
    
    // =========================================================================
    // MAIN RENDERING
    // =========================================================================
    
    render(leads, selectedLeads, renderCache, dateFormatCache) {
        return leads.map(lead => {
            // Check cache first
            const cacheKey = `${lead.id}-${lead.updated_at || lead.created_at}`;
            if (renderCache.has(cacheKey)) {
                return renderCache.get(cacheKey);
            }
            
            // Generate card HTML
            const html = this.createLeadCard(lead, selectedLeads, dateFormatCache);
            
            // Store in cache
            renderCache.set(cacheKey, html);
            
            return html;
        }).join('');
    }
    
    // =========================================================================
    // LEAD CARD
    // =========================================================================
    
    createLeadCard(lead, selectedLeads, dateFormatCache) {
        // Ensure selectedLeads is a Set
        let selectedSet = selectedLeads;
        if (Array.isArray(selectedLeads)) {
            selectedSet = new Set(selectedLeads);
        } else if (!(selectedLeads instanceof Set)) {
            selectedSet = new Set();
        }
        
        const isSelected = selectedSet.has(lead.id);
        const score = lead.score || 0;
        
        // Get configurations from LeadService
        const scoreConfig = this.leadService.getScoreConfig(score);
        const platformConfig = this.leadService.getPlatformConfig(lead.platform);
        const analysisConfig = this.leadService.getAnalysisConfig(lead.analysis_type);
        const formattedDate = this.leadService.getFormattedDate(lead.updated_at || lead.created_at, dateFormatCache);
        const profileHtml = this.getProfileHtml(lead);
        
        return `
            <tr class="table-row hover:bg-gray-50 transition-all duration-200 ${isSelected ? 'bg-blue-50' : ''}" 
                data-lead-id="${lead.id}">
                
                <!-- Checkbox -->
                <td class="pl-6 pr-2 py-4 border-r border-slate-100/60 text-center" style="width: 50px;">
                    <input type="checkbox" 
                           class="lead-checkbox w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                           data-lead-id="${lead.id}"
                           ${isSelected ? 'checked' : ''}
                           onchange="window.toggleLeadSelection && window.toggleLeadSelection('${lead.id}', this.checked)">
                </td>
                
                <!-- Lead Profile -->
                <td class="pl-6 pr-6 py-4 border-r border-slate-100/60" style="width: 280px;">
                    ${profileHtml}
                </td>
                
                <!-- Platform -->
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
                    ${this.renderScoreDisplay(score, scoreConfig)}
                </td>
                
                <!-- Analysis Type -->
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
                
                <!-- Date -->
                <td class="px-6 py-4 border-r border-slate-100/60" style="width: 140px;">
                    <div class="text-center">
                        <div class="text-sm text-slate-900">${formattedDate.date}</div>
                        <div class="text-xs text-slate-500">${formattedDate.time}</div>
                    </div>
                </td>
                
                <!-- Actions -->
                <td class="px-6 py-4" style="width: 140px;">
                    <div class="flex items-center justify-center">
                        <button onclick="openLeadAnalysisModal('${lead.id}')"
                                class="action-button relative inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                title="View detailed analysis">
                            <svg class="relative w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                            <span class="relative">Analysis</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // =========================================================================
    // PROFILE HTML
    // =========================================================================
    
    getProfileHtml(lead) {
        const username = lead.username || 'unknown';
        const fullName = lead.display_name || '';
        const profilePicUrl = lead.profile_picture_url;
        
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
                    ${lead.followers_count ? `<div class="text-xs text-slate-500">${this.leadService.formatNumber(lead.followers_count)} followers</div>` : ''}
                </div>
            </div>
        `;
    }
    
    // =========================================================================
    // SCORE DISPLAY
    // =========================================================================
    
    renderScoreDisplay(score, config) {
        return `
            <div class="relative">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-baseline space-x-1">
                        <span class="text-2xl font-bold text-slate-900">${score}</span>
                        <span class="text-sm text-slate-500 font-medium">/100</span>
                    </div>
                    <div class="flex items-center space-x-1">
                        ${config.icon ? `<span class="text-sm">${config.icon}</span>` : ''}
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${config.gradient} text-white shadow-sm">
                            ${config.label}
                        </span>
                    </div>
                </div>
                <div class="relative">
                    <div class="w-full bg-slate-100 rounded-full h-3 shadow-inner">
                        <div class="bg-gradient-to-r ${config.barGradient} ${config.barClass} h-3 rounded-full transition-all duration-500 ease-out shadow-sm relative overflow-hidden" 
                             style="width: ${score}%">
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"></div>
                        </div>
                    </div>
                    <div class="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 ${config.borderColor} transition-all duration-300"
                         style="left: calc(${score}% - 8px)"></div>
                </div>
            </div>
        `;
    }
    
    // =========================================================================
    // STATE TEMPLATES (Return HTML only)
    // =========================================================================
    
    renderLoadingState() {
        const loadingRows = Array.from({ length: 5 }, () => `
            <tr class="animate-pulse">
                <td class="pl-12 pr-6 py-4"><div class="flex items-center space-x-4"><div class="w-12 h-12 bg-slate-200 rounded-full"></div><div class="flex-1"><div class="w-24 h-4 bg-slate-200 rounded mb-2"></div><div class="w-16 h-3 bg-slate-200 rounded"></div></div></div></td>
                <td class="px-6 py-4"><div class="w-20 h-6 bg-slate-200 rounded mx-auto"></div></td>
                <td class="px-6 py-4"><div class="w-full h-8 bg-slate-200 rounded"></div></td>
                <td class="px-6 py-4"><div class="w-16 h-6 bg-slate-200 rounded mx-auto"></div></td>
                <td class="px-6 py-4"><div class="w-16 h-4 bg-slate-200 rounded mx-auto"></div></td>
                <td class="px-6 py-4"><div class="w-20 h-8 bg-slate-200 rounded mx-auto"></div></td>
            </tr>
        `).join('');
        
        return loadingRows;
    }
    
    renderEmptyState() {
        return `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center">
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
    }
    
    renderErrorState() {
        return `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center">
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
                        <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Refresh Page
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // =========================================================================
    // TABLE STRUCTURE
    // =========================================================================
    
    createTableStructure() {
        return `
            <table class="leads-table w-full border-separate border-spacing-0">
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100/80 backdrop-blur-sm sticky top-0 z-10">
                    <tr class="border-b border-slate-200/60">
                        <th class="pl-6 pr-2 py-4 text-center border-r border-slate-200/40" style="width: 50px;">
                            <input type="checkbox" 
                                   id="select-all-checkbox" 
                                   class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                   onchange="window.toggleAllLeadSelections && window.toggleAllLeadSelections(this.checked)">
                        </th>
                        <th class="pl-6 pr-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 280px;">Lead Profile</th>
                        <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 160px;">Platform</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 240px;">Intelligence Score</th>
                        <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 180px;">Analysis Type</th>
                        <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200/40" style="width: 140px;">Date Updated</th>
                        <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider" style="width: 140px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="leads-table-body" class="divide-y divide-slate-200/60 bg-white"></tbody>
            </table>
        `;
    }
    
    // =========================================================================
    // PAGINATION HTML
    // =========================================================================
    
    renderPaginationControls(currentPage, totalPages) {
        if (totalPages <= 1) {
            return '';
        }
        
        let paginationHTML = `
            <button onclick="window.leadRenderer.goToPage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="px-3 py-1 text-sm border border-gray-300 rounded-lg ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                Previous
            </button>
        `;
        
        const pagesToShow = [];
        if (currentPage > 2) {
            pagesToShow.push(1);
            if (currentPage > 3) pagesToShow.push('...');
        }
        
        for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
            pagesToShow.push(i);
        }
        
        if (currentPage < totalPages - 1) {
            if (currentPage < totalPages - 2) pagesToShow.push('...');
            pagesToShow.push(totalPages);
        }
        
        pagesToShow.forEach(page => {
            if (page === '...') {
                paginationHTML += `<span class="px-3 py-1 text-sm text-gray-400">...</span>`;
            } else {
                paginationHTML += `
                    <button onclick="window.leadRenderer.goToPage(${page})"
                            class="px-3 py-1 text-sm border rounded-lg ${page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}">
                        ${page}
                    </button>
                `;
            }
        });
        
        paginationHTML += `
            <button onclick="window.leadRenderer.goToPage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    class="px-3 py-1 text-sm border border-gray-300 rounded-lg ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                Next
            </button>
        `;
        
        return paginationHTML;
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.LeadsTableRenderer = LeadsTableRenderer;
console.log('✅ [LeadsTableRenderer] Loaded');
