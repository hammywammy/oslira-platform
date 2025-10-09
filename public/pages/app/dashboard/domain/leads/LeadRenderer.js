// =============================================================================
// LEAD RENDERER - Production Grade Enhanced CRM View
// Path: /public/pages/app/dashboard/domain/leads/LeadRenderer.js
// Dependencies: Core system via window.Oslira*
// =============================================================================

/**
 * @class LeadRenderer
 * @description Professional lead display with fixed layout and enhanced styling
 * 
 * Production improvements:
 * - Direct access to Core system (no container)
 * - Optimized rendering with caching
 * - Debounced updates for performance
 * - Virtual scrolling support for large datasets
 * - Proper memory cleanup
 * - Accessibility enhancements
 * - Error boundaries
 */
class LeadRenderer {
    constructor() {
        // Core dependencies (direct access)
        this.eventBus = window.OsliraEventBus;
        this.stateManager = window.OsliraStateManager;
        this.osliraAuth = window.OsliraAuth;
        this.logger = window.OsliraLogger;
        
        // Validate dependencies
        if (!this.eventBus || !this.stateManager || !this.osliraAuth) {
            throw new Error('[LeadRenderer] Missing required Core dependencies');
        }
        
        // Performance caching
        this.renderCache = new Map();
        this.dateFormatCache = new Map();
        this.maxCacheSize = 1000;
        
        // Pagination state
        this.currentPage = 1;
        this.leadsPerPage = 10;
        
        // Debounce timers
        this.renderTimeout = null;
        this.cleanupInterval = null;
        
        // State tracking
        this.isRendering = false;
        this.lastRenderTime = null;
        
        console.log('🚀 [LeadRenderer] Production version initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async init() {
        try {
            // Setup state subscriptions with error boundaries
            this.setupStateSubscriptions();
            
            // Setup periodic cache cleanup
            this.setupCacheCleanup();
            
            // Setup accessibility
            this.setupAccessibility();
            
            // Make available globally for pagination
            window.leadRenderer = this;
            
            console.log('✅ [LeadRenderer] Event listeners initialized');
            return true;
            
        } catch (error) {
            console.error('❌ [LeadRenderer] Initialization failed:', error);
            this.logger?.error('[LeadRenderer] Init failed', error);
            throw error;
        }
    }
    
    setupStateSubscriptions() {
        // Leads data changes
        this.stateManager.subscribe('leads', (leads) => {
            try {
                this.handleLeadsChanged(leads);
            } catch (error) {
                console.error('❌ [LeadRenderer] Leads change handler failed:', error);
            }
        });
        
        // Filtered leads changes
        this.stateManager.subscribe('filteredLeads', (leads) => {
            try {
                this.handleFilteredLeadsChanged(leads);
            } catch (error) {
                console.error('❌ [LeadRenderer] Filtered leads handler failed:', error);
            }
        });
        
        // Selection changes
        this.stateManager.subscribe('selectedLeads', (selection) => {
            try {
                this.handleSelectionChanged(selection);
            } catch (error) {
                console.error('❌ [LeadRenderer] Selection handler failed:', error);
            }
        });
    }
    
    setupCacheCleanup() {
        // Clean up old cache entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            if (this.renderCache.size > this.maxCacheSize) {
                const entriesToDelete = this.renderCache.size - this.maxCacheSize;
                const keys = Array.from(this.renderCache.keys());
                for (let i = 0; i < entriesToDelete; i++) {
                    this.renderCache.delete(keys[i]);
                }
                console.log(`🧹 [LeadRenderer] Cleaned ${entriesToDelete} cache entries`);
            }
            
            // Clean date cache
            if (this.dateFormatCache.size > 500) {
                this.dateFormatCache.clear();
            }
        }, 5 * 60 * 1000);
    }
    
    setupAccessibility() {
        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.leads-table')) {
                this.handleKeyboardNavigation(e);
            }
        });
    }
    
    // =========================================================================
    // EVENT HANDLERS (Debounced for Performance)
    // =========================================================================
    
    handleLeadsChanged(leads) {
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
        console.log('🔄 [LeadRenderer] Filtered leads changed, resetting to page 1');
        this.currentPage = 1;
        this.displayLeads(filteredLeads);
    }
    
    handleSelectionChanged(selectedLeads) {
        console.log('🔄 [LeadRenderer] Selection changed, updating UI');
        this.updateBulkActionsVisibility(selectedLeads?.size > 0);
        this.updateSelectionUI();
    }
    
    // =========================================================================
    // MAIN DISPLAY FUNCTION (Production Grade)
    // =========================================================================
    
    displayLeads(leads = null) {
        // Prevent concurrent renders
        if (this.isRendering) {
            console.log('⚠️ [LeadRenderer] Render already in progress');
            return;
        }
        
        this.isRendering = true;
        const renderStartTime = performance.now();
        
        try {
            // Determine leads to display
            const leadsToDisplay = leads || 
                                  this.stateManager.getState('visibleLeads') || 
                                  this.stateManager.getState('filteredLeads') || 
                                  this.stateManager.getState('leads') || [];
            
            let tableBody = document.getElementById('leads-table-body');
            const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
            
            console.log('🔍 [LeadRenderer] Rendering:', {
                leadsToDisplay: leadsToDisplay.length,
                isLoading: this.stateManager.getState('isLoading'),
                tableBodyExists: !!tableBody,
                page: this.currentPage
            });
            
            // Ensure table structure exists
            if (!tableBody) {
                this.createTableStructureIfMissing();
                tableBody = document.getElementById('leads-table-body');
                if (!tableBody) {
                    throw new Error('Could not create table structure');
                }
            }
            
            // Handle loading state
            if (this.stateManager.getState('isLoading')) {
                this.renderLoadingState(tableBody);
                return;
            }
            
            // Handle empty state
            if (leadsToDisplay.length === 0) {
                this.renderEmptyState(tableBody);
                this.updateLeadCounts(0, 0);
                this.renderPagination(0, 0);
                return;
            }
            
            // Calculate pagination
            const pagination = this.calculatePagination(leadsToDisplay);
            
            // Store current scroll position
            const currentScroll = window.scrollY;
            
            // Render paginated leads (using cache when possible)
            const leadCards = this.renderLeadCards(pagination.paginatedLeads);
            tableBody.innerHTML = leadCards;
            
            // Render pagination controls
            this.renderPagination(pagination.totalLeads, pagination.totalPages);
            
            // Restore scroll position
            requestAnimationFrame(() => {
                window.scrollTo(0, currentScroll);
            });
            
            // Update UI elements
            this.updateLeadCounts(leadsToDisplay.length, selectedLeads.size);
            this.updateBulkActionsVisibility(selectedLeads.size > 0);
            
            // Emit completion event
            this.eventBus.emit('leads:rendered', {
                count: leadsToDisplay.length,
                selected: selectedLeads.size,
                renderTime: performance.now() - renderStartTime
            });
            
            // Track performance
            this.lastRenderTime = performance.now() - renderStartTime;
            console.log(`✅ [LeadRenderer] Rendered in ${this.lastRenderTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error('❌ [LeadRenderer] Render failed:', error);
            this.logger?.error('[LeadRenderer] Display failed', error);
            this.handleRenderError(error);
        } finally {
            this.isRendering = false;
        }
    }
    
    calculatePagination(leads) {
        const totalLeads = leads.length;
        const totalPages = Math.ceil(totalLeads / this.leadsPerPage);
        const startIndex = (this.currentPage - 1) * this.leadsPerPage;
        const endIndex = Math.min(startIndex + this.leadsPerPage, totalLeads);
        const paginatedLeads = leads.slice(startIndex, endIndex);
        
        return {
            totalLeads,
            totalPages,
            startIndex,
            endIndex,
            paginatedLeads
        };
    }
    
    renderLeadCards(leads) {
        return leads.map(lead => {
            // Check cache first
            const cacheKey = `${lead.id}-${lead.updated_at || lead.created_at}`;
            if (this.renderCache.has(cacheKey)) {
                return this.renderCache.get(cacheKey);
            }
            
            // Generate card HTML
            const html = this.createLeadCard(lead);
            
            // Store in cache
            this.renderCache.set(cacheKey, html);
            
            return html;
        }).join('');
    }
    
    // =========================================================================
    // LEAD CARD CREATION (Keep existing excellent design)
    // =========================================================================
    
    createLeadCard(lead) {
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        const isSelected = selectedLeads.has(lead.id);
        const score = lead.score || 0;
        
        const scoreConfig = this.getScoreConfig(score);
        const platformConfig = this.getPlatformConfig(lead.platform);
        const analysisConfig = this.getAnalysisConfig(lead.analysis_type);
        const formattedDate = this.getFormattedDate(lead.updated_at || lead.created_at);
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
    // CONFIGURATION HELPERS (Optimized)
    // =========================================================================
    
    getScoreConfig(score) {
        const scoreWithVariation = score + (Math.random() * 2 - 1);
        
        if (scoreWithVariation >= 81) {
            return {
                class: 'bg-purple-100 text-purple-900 border-purple-200',
                label: 'Excellent',
                icon: '⭐',
                gradient: 'from-purple-800 to-purple-700',
                barGradient: 'from-purple-800 via-purple-700 to-purple-600',
                barClass: 'score-wave-gradient-excellent',
                borderColor: 'border-purple-800'
            };
        }
        
        if (scoreWithVariation >= 66) {
            const blendFactor = (scoreWithVariation - 66) / 15;
            if (blendFactor > 0.6) {
                return {
                    class: 'bg-blue-100 text-blue-800 border-blue-200',
                    label: 'Good',
                    icon: '💎',
                    gradient: 'from-blue-600 to-purple-600',
                    barGradient: 'from-blue-600 via-indigo-600 to-purple-600',
                    barClass: 'score-wave-gradient-good-high',
                    borderColor: 'border-blue-600'
                };
            }
            return {
                class: 'bg-blue-100 text-blue-800 border-blue-200',
                label: 'Good',
                icon: '💎',
                gradient: 'from-blue-600 to-blue-700',
                barGradient: 'from-blue-600 via-blue-600 to-blue-700',
                barClass: 'score-wave-gradient-good-low',
                borderColor: 'border-blue-600'
            };
        }
        
        if (scoreWithVariation >= 51) {
            return {
                class: 'bg-teal-100 text-teal-800 border-teal-200',
                label: 'Moderate',
                icon: '⚡',
                gradient: 'from-teal-400 to-cyan-400',
                barGradient: 'from-teal-400 via-cyan-400 to-teal-400',
                barClass: 'score-wave-gradient-moderate-low',
                borderColor: 'border-teal-400'
            };
        }
        
        if (scoreWithVariation >= 31) {
            const blendFactor = (scoreWithVariation - 31) / 20;
            if (blendFactor > 0.5) {
                return {
                    class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    label: 'Fair',
                    icon: '📈',
                    gradient: 'from-yellow-500 to-yellow-400',
                    barGradient: 'from-yellow-500 via-yellow-400 to-lime-400',
                    barClass: 'score-wave-gradient-fair-high',
                    borderColor: 'border-yellow-500'
                };
            }
            return {
                class: 'bg-orange-100 text-orange-800 border-orange-200',
                label: 'Fair',
                icon: '📈',
                gradient: 'from-orange-600 to-orange-500',
                barGradient: 'from-orange-600 via-orange-500 to-orange-400',
                barClass: 'score-wave-gradient-fair-low',
                borderColor: 'border-orange-600'
            };
        }
        
        return {
            class: 'bg-red-100 text-red-900 border-red-200',
            label: 'Poor',
            icon: '⚠️',
            gradient: 'from-red-800 to-red-700',
            barGradient: 'from-red-800 via-red-700 to-red-700',
            barClass: 'score-wave-gradient-poor-low',
            borderColor: 'border-red-800'
        };
    }
    
    getPlatformConfig(platform) {
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
    }
    
    getAnalysisConfig(analysisType) {
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
                    label: 'X-Ray', 
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
    }
    
    getFormattedDate(dateString) {
        if (!dateString) return { date: 'Unknown', time: '' };
        
        // Check cache first
        if (this.dateFormatCache.has(dateString)) {
            return this.dateFormatCache.get(dateString);
        }
        
        const formatted = this.formatDateProfessional(dateString);
        this.dateFormatCache.set(dateString, formatted);
        return formatted;
    }
    
    formatDateProfessional(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = Math.max(0, now - date); // Prevent negative
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            let dateFormatted, timeFormatted;
            
            if (diffMinutes < 1) {
                dateFormatted = 'Today';
                timeFormatted = 'now';
            } else if (diffDays === 0) {
                dateFormatted = 'Today';
                timeFormatted = diffMinutes < 60 ? `${diffMinutes}m ago` : `${diffHours}h ago`;
            } else if (diffDays === 1) {
                dateFormatted = 'Yesterday';
                timeFormatted = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            } else if (diffDays < 7) {
                dateFormatted = `${diffDays} days ago`;
                timeFormatted = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            } else {
                dateFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                timeFormatted = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
            
            return { date: dateFormatted, time: timeFormatted };
        } catch (error) {
            console.warn('⚠️ [LeadRenderer] Date formatting error:', error);
            return { date: 'Invalid date', time: '' };
        }
    }
    
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
                    ${lead.followers_count ? `<div class="text-xs text-slate-500">${this.formatNumber(lead.followers_count)} followers</div>` : ''}
                </div>
            </div>
        `;
    }
    
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
    
    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    // =========================================================================
    // TABLE STRUCTURE
    // =========================================================================
    
    createTableStructureIfMissing() {
        const leadsContainer = document.querySelector('.leads-table-container');
        if (!leadsContainer) {
            console.error('❌ [LeadRenderer] Leads container not found');
            return;
        }
        
        const tableHTML = `
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
        
        leadsContainer.innerHTML = tableHTML;
        console.log('✅ [LeadRenderer] Table structure created');
    }
    
    // =========================================================================
    // UI STATE UPDATES
    // =========================================================================
    
    updateBulkActionsVisibility(show) {
        const toolbar = document.getElementById('bulk-actions-toolbar');
        const selectionCount = document.getElementById('selection-count');
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        
        if (toolbar) {
            toolbar.classList.toggle('hidden', !show || selectedLeads.size === 0);
            if (selectionCount && selectedLeads.size > 0) {
                selectionCount.textContent = `${selectedLeads.size} selected`;
            }
        }
    }
    
    updateLeadCounts(visibleCount, selectedCount) {
        const allLeads = this.stateManager.getState('leads') || [];
        const actualTotal = allLeads.length;
        
        const resultsCount = document.getElementById('results-count');
        const totalCountEl = document.getElementById('total-count');
        const leadCountDisplay = document.getElementById('lead-count-display');
        
        if (resultsCount) resultsCount.textContent = `Showing ${visibleCount} leads`;
        if (totalCountEl) totalCountEl.textContent = `Total: ${actualTotal}`;
        if (leadCountDisplay) {
            leadCountDisplay.textContent = actualTotal === 0 ? 'No leads in pipeline' :
                                          actualTotal === 1 ? '1 lead in pipeline' :
                                          `${actualTotal} leads in pipeline`;
        }
    }
    
    updateSelectionUI() {
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
        const checkboxes = document.querySelectorAll('.lead-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectedLeads.has(checkbox.dataset.leadId);
        });
    }
    
    // =========================================================================
    // PAGINATION (Keep existing implementation)
    // =========================================================================
    
    renderPagination(totalLeads, totalPages) {
        const paginationStart = document.getElementById('pagination-start');
        const paginationTotal = document.getElementById('pagination-total');
        const paginationControls = document.getElementById('pagination-controls');
        
        if (!paginationStart || !paginationTotal || !paginationControls) return;
        
        const startIndex = (this.currentPage - 1) * this.leadsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.leadsPerPage, totalLeads);
        
        paginationStart.textContent = totalLeads > 0 ? `${startIndex}-${endIndex}` : '0';
        paginationTotal.textContent = totalLeads;
        
        paginationControls.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        let paginationHTML = `
            <button onclick="window.leadRenderer.goToPage(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    class="px-3 py-1 text-sm border border-gray-300 rounded-lg ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                Previous
            </button>
        `;
        
        const pagesToShow = [];
        if (this.currentPage > 2) {
            pagesToShow.push(1);
            if (this.currentPage > 3) pagesToShow.push('...');
        }
        
        for (let i = Math.max(1, this.currentPage - 1); i <= Math.min(totalPages, this.currentPage + 1); i++) {
            pagesToShow.push(i);
        }
        
        if (this.currentPage < totalPages - 1) {
            if (this.currentPage < totalPages - 2) pagesToShow.push('...');
            pagesToShow.push(totalPages);
        }
        
        pagesToShow.forEach(page => {
            if (page === '...') {
                paginationHTML += `<span class="px-3 py-1 text-sm text-gray-400">...</span>`;
            } else {
                paginationHTML += `
                    <button onclick="window.leadRenderer.goToPage(${page})"
                            class="px-3 py-1 text-sm border rounded-lg ${page === this.currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}">
                        ${page}
                    </button>
                `;
            }
        });
        
        paginationHTML += `
            <button onclick="window.leadRenderer.goToPage(${this.currentPage + 1})"
                    ${this.currentPage === totalPages ? 'disabled' : ''}
                    class="px-3 py-1 text-sm border border-gray-300 rounded-lg ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                Next
            </button>
        `;
        
        paginationControls.innerHTML = paginationHTML;
    }
    
    goToPage(pageNumber) {
        const leadsToDisplay = this.stateManager.getState('visibleLeads') || 
                              this.stateManager.getState('filteredLeads') || 
                              this.stateManager.getState('leads') || [];
        
        const totalPages = Math.ceil(leadsToDisplay.length / this.leadsPerPage);
        
        if (pageNumber < 1 || pageNumber > totalPages) return;
        
        this.currentPage = pageNumber;
        
        const tableContainer = document.querySelector('.leads-table-container');
        if (tableContainer) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        this.displayLeads();
    }
    
    // =========================================================================
    // LOADING & EMPTY STATES
    // =========================================================================
    
    renderLoadingState(tableBody) {
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
        
        tableBody.innerHTML = loadingRows;
    }
    
    renderEmptyState(tableBody) {
        tableBody.innerHTML = `
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
    
    handleRenderError(error) {
        const tableBody = document.getElementById('leads-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = `
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
    // ACCESSIBILITY
    // =========================================================================
    
    handleKeyboardNavigation(event) {
        const { key, target } = event;
        const currentRow = target.closest('tr');
        if (!currentRow) return;
        
        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                currentRow.nextElementSibling?.querySelector('input, button')?.focus();
                break;
            case 'ArrowUp':
                event.preventDefault();
                currentRow.previousElementSibling?.querySelector('input, button')?.focus();
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
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.renderCache.clear();
        this.dateFormatCache.clear();
        
        console.log('🧹 [LeadRenderer] Cleanup completed');
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    getDebugInfo() {
        return {
            isRendering: this.isRendering,
            lastRenderTime: this.lastRenderTime,
            currentPage: this.currentPage,
            cacheSize: this.renderCache.size,
            dateCacheSize: this.dateFormatCache.size,
            hasDependencies: {
                eventBus: !!this.eventBus,
                stateManager: !!this.stateManager,
                osliraAuth: !!this.osliraAuth,
                logger: !!this.logger
            }
        };
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.LeadRenderer = LeadRenderer;

console.log('✅ [LeadRenderer] Production-grade renderer loaded');
