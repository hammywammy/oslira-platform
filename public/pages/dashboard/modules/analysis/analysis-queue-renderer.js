// public/pages/dashboard/modules/analysis/analysis-queue-renderer.js

/**
 * ANALYSIS QUEUE RENDERER MODULE
 * Handles all HTML rendering and DOM updates for the analysis queue
 */
class AnalysisQueueRenderer {
    constructor(queue) {
        this.queue = queue;
    }

    // ===============================================================================
    // MAIN RENDERING
    // ===============================================================================

    renderQueue() {
        const container = document.getElementById('analysis-queue-container');
        if (!container) return;

        const analyses = Array.from(this.queue.activeAnalyses.values()).sort(
            (a, b) => b.startTime - a.startTime
        );

        if (analyses.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No active analyses</div>';
            this.queue.updateQueueBadge();
            return;
        }

        // Show all items with scrolling (no maxVisible limit in collapsed view)
        container.innerHTML = `
            <div class="space-y-3">
                ${analyses.map(analysis => this.renderQueueItem(analysis)).join('')}
            </div>
        `;

        // Add enter animations
        setTimeout(() => {
            container.querySelectorAll('.queue-item-new').forEach(item => {
                item.classList.remove('queue-item-new');
                item.classList.add('queue-item-enter');
            });
        }, 50);

        this.queue.eventBus.emit(window.DASHBOARD_EVENTS.QUEUE_UPDATED, {
            count: analyses.length,
            visible: analyses.length
        });

        this.queue.updateQueueBadge();
    }

    renderQueueItem(analysis) {
        const elapsed = Math.round((Date.now() - analysis.startTime) / 1000);
        const timeText = this.formatElapsedTime(elapsed);
        const progressPercentage = Math.min(100, Math.max(0, Math.round(analysis.visualProgress || 0)));
        const statusConfig = this.getStatusConfig(analysis.status);
        const profileInitial = analysis.username.charAt(0).toUpperCase();
        const isActive = analysis.status === 'starting' || analysis.status === 'analyzing';
        const isCompleted = analysis.status === 'completed';
        const isFailed = analysis.status === 'failed';

        return `
<div id="queue-item-${analysis.id}" 
     class="queue-item-new glass-card hover-lift rounded-xl p-4 border shadow-lg transition-all duration-200 ${analysis.isMinimized ? 'minimized' : ''} ${isCompleted ? 'celebrating' : ''} ${isActive ? 'pulse-glow analyzing' : ''}"
     data-analysis-id="${analysis.id}">
    
    <!-- Header -->
    <div class="queue-header ${analysis.isMinimized ? 'queue-header-minimized' : ''} flex items-center justify-between mb-3">
        <div class="flex items-center space-x-3">
            <!-- Profile Avatar -->
            <div class="relative">
                <div class="w-10 h-10 ${statusConfig.bgColor} rounded-full flex items-center justify-center font-semibold text-white shadow-lg">
                    ${profileInitial}
                </div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 ${statusConfig.badgeColor} rounded-full flex items-center justify-center">
                    ${statusConfig.icon}
                </div>
                ${isActive ? '<div class="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur animate-pulse"></div>' : ''}
            </div>
            
            <!-- Analysis Info -->
            <div class="flex-1 min-w-0 queue-details">
                <div class="flex items-center space-x-2">
                    <h3 class="font-semibold text-gray-900 truncate">@${analysis.username}</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.typeBg} ${statusConfig.typeColor}">
                        ${analysis.analysisType}
                    </span>
                </div>
                <p class="text-sm ${statusConfig.textColor} truncate mt-0.5">${analysis.message}</p>
                <div class="flex items-center space-x-3 mt-1">
                    <span class="text-xs text-gray-500 flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        ${timeText}
                    </span>
                    ${analysis.estimatedTimeRemaining && isActive ? `
                        <span class="text-xs text-gray-400">• ~${this.formatElapsedTime(Math.round(analysis.estimatedTimeRemaining / 1000))} left</span>
                    ` : ''}
                </div>
            </div>
        </div>
        
<!-- Actions -->
<div class="flex items-center space-x-1">
    <button data-action="minimize" data-analysis-id="${analysis.id}"
            class="p-1 hover:bg-gray-100 rounded-md transition-colors">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${analysis.isMinimized ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}"/>
        </svg>
    </button>
    
    <button data-action="remove" data-analysis-id="${analysis.id}"
            class="p-1 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
    </button>
</div>
    </div>
    
    ${!analysis.isMinimized ? `
        <!-- Progress Section -->
        ${isActive ? `
            <div class="space-y-3">
                <div class="relative">
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full ${statusConfig.progressBg} smooth-progress progress-shimmer rounded-full" 
                             style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-medium ${statusConfig.textColor}">${analysis.currentStage + 1}/${analysis.totalStages}</span>
                            <span class="text-xs text-gray-500">Stage</span>
                        </div>
                        <span class="text-sm font-semibold text-gray-700" id="progress-${analysis.id}">${progressPercentage}%</span>
                    </div>
                </div>
            </div>
        ` : ''}
        
        <!-- Completion Actions -->
        ${isCompleted ? `
            <div class="mt-3 flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-sm font-medium text-green-800">Completed in ${analysis.duration}s</span>
                </div>
            </div>
        ` : ''}
        
        ${isFailed ? `
            <div class="mt-3 flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <span class="text-sm font-medium text-red-800">Analysis failed</span>
                <button onclick="analysisQueue.retryAnalysis('${analysis.id}')"
                        class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                    Retry
                </button>
            </div>
        ` : ''}
    ` : ''}
</div>
        `;
    }

    renderQueueFooter(totalCount, needsScroll) {
        // Footer removed - queue shows all items with scroll
        return '';
    }

    updateProgressBarDOM(analysisId, visualProgress) {
        const progressBar = document.querySelector(`#queue-item-${analysisId} .smooth-progress`);
        const progressText = document.querySelector(`#progress-${analysisId}`);

        if (progressBar) {
            const percentage = Math.min(100, Math.max(0, Math.round(visualProgress)));
            progressBar.style.width = `${percentage}%`;

            if (progressText) {
                progressText.textContent = `${percentage}%`;
            }
        }
    }

    // ===============================================================================
    // STATUS CONFIG
    // ===============================================================================

    getStatusConfig(status) {
        const configs = {
            starting: {
                icon: `<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`,
                bgColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
                badgeColor: 'bg-amber-500',
                progressBg: 'bg-gradient-to-r from-amber-400 to-orange-500',
                textColor: 'text-amber-600',
                typeColor: 'text-amber-700',
                typeBg: 'bg-amber-100'
            },
            analyzing: {
                icon: `<svg class="w-3 h-3 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>`,
                bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
                badgeColor: 'bg-blue-500',
                progressBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
                textColor: 'text-blue-600',
                typeColor: 'text-blue-700',
                typeBg: 'bg-blue-100'
            },
            completed: {
                icon: `<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>`,
                bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
                badgeColor: 'bg-green-500',
                progressBg: 'bg-gradient-to-r from-green-500 to-emerald-600',
                textColor: 'text-green-600',
                typeColor: 'text-green-700',
                typeBg: 'bg-green-100'
            },
            failed: {
                icon: `<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>`,
                bgColor: 'bg-gradient-to-br from-red-500 to-rose-600',
                badgeColor: 'bg-red-500',
                progressBg: 'bg-gradient-to-r from-red-500 to-rose-600',
                textColor: 'text-red-600',
                typeColor: 'text-red-700',
                typeBg: 'bg-red-100'
            }
        };

        return configs[status] || configs.analyzing;
    }

    formatElapsedTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisQueueRenderer;
} else {
    window.AnalysisQueueRenderer = AnalysisQueueRenderer;
}

console.log('✅ [AnalysisQueueRenderer] Module loaded');
