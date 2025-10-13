// =============================================================================
// LEAD SERVICE - Pure Business Logic
// Path: /public/pages/app/dashboard/domain/leads/LeadService.js
// Dependencies: NONE (pure functions)
// =============================================================================

/**
 * @class LeadService
 * @description Pure business logic for lead data transformation and scoring
 * 
 * Rules:
 * - NO DOM access
 * - NO state access
 * - NO API calls
 * - Pure functions only - data in, data out
 */
class LeadService {
    constructor() {
        console.log('📊 [LeadService] Initialized');
    }
    
    // =========================================================================
    // SCORE CLASSIFICATION
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
     
    // =========================================================================
    // PLATFORM CONFIGURATION
    // =========================================================================
    
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
    
    // =========================================================================
    // ANALYSIS CONFIGURATION
    // =========================================================================
    
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
    
    // =========================================================================
    // FORMATTING UTILITIES
    // =========================================================================
    
    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
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
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.LeadService = LeadService;
console.log('✅ [LeadService] Loaded');
