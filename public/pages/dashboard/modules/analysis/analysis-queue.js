// public/pages/dashboard/modules/analysis/analysis-queue.js

/**
 * ENHANCED OSLIRA ANALYSIS QUEUE MODULE (REFACTORED)
 * Core queue management logic - delegates rendering/animation to submodules
 */
class AnalysisQueue {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
        this.stateManager = container.get('stateManager');
        this.supabase = container.get('supabase');
        this.osliraAuth = container.get('osliraAuth');

        if (!this.supabase) {
            console.warn('⚠️ [AnalysisQueue] No Supabase client from container, will use OsliraAuth fallback');
        }

        // Queue configuration
        this.activeAnalyses = new Map();
        this.maxVisible = 5;
        this.autoHideDelay = 12000;

        // Enhanced configuration
        this.smoothProgressEnabled = true;
        this.soundEnabled = false;
        this.animationSpeed = 300;

        // Throttle render
        this.renderThrottle = null;

        // Initialize submodules
        this.renderer = new AnalysisQueueRenderer(this);
        this.animator = new AnalysisQueueAnimator(this);

        // Setup
        this.setupEventDelegation();

        this.analysisStages = {
            light: [
                { text: "🔍 Scanning profile...", duration: 8000, color: "text-blue-500" },
                { text: "📊 Analyzing engagement...", duration: 5000, color: "text-amber-500" },
                { text: "🎯 Calculating scores...", duration: 4500, color: "text-green-500" },
                { text: "✨ Finalizing results...", duration: 3500, color: "text-purple-500" }
            ],
            deep: [
                { text: "🔍 Scanning @profile...", duration: 8000, color: "text-blue-500" },
                { text: "📊 Deep engagement analysis...", duration: 6000, color: "text-amber-500" },
                { text: "🎯 Advanced scoring...", duration: 6000, color: "text-green-500" },
                { text: "🤖 Generating insights...", duration: 5500, color: "text-purple-500" },
                { text: "✉️ Crafting outreach...", duration: 5500, color: "text-cyan-500" },
                { text: "✨ Finalizing results...", duration: 5000, color: "text-indigo-500" }
            ],
            xray: [
                { text: "🔍 Deep profile scan...", duration: 8000, color: "text-blue-500" },
                { text: "📊 X-Ray engagement analysis...", duration: 6000, color: "text-amber-500" },
                { text: "🎯 Advanced scoring...", duration: 6000, color: "text-green-500" },
                { text: "🤖 Generating insights...", duration: 5500, color: "text-purple-500" },
                { text: "✉️ Crafting outreach...", duration: 5500, color: "text-cyan-500" },
                { text: "✨ Finalizing results...", duration: 5000, color: "text-indigo-500" }
            ]
        };

        this.setupEnhancedContainer();
        AnalysisQueueStyles.inject();

        console.log('🚀 [AnalysisQueue] Initialized');
    }

    setupEventDelegation() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const analysisId = button.dataset.analysisId;

            if (!analysisId) return;

switch (action) {
    case 'minimize':
        this.toggleMinimize(analysisId);
        break;
    case 'remove':
        const analysis = this.activeAnalyses.get(analysisId);
        if (analysis && (analysis.status === 'starting' || analysis.status === 'analyzing')) {
            // Confirm cancellation for active analyses
            if (confirm(`Cancel analysis for @${analysis.username}?`)) {
                this.cancelAnalysis(analysisId);
            }
        } else {
            // Just remove completed/failed analyses
            this.removeAnalysis(analysisId);
        }
        break;
}
        });

        console.log('✅ [AnalysisQueue] Event delegation setup complete');
    }

    async init() {
        this.eventBus.on('dashboard:cleanup', this.cleanup.bind(this));
        console.log('✅ [AnalysisQueue] Event listeners initialized');
    }

    // ===============================================================================
    // CONTAINER SETUP
    // ===============================================================================

    setupEnhancedContainer() {
        const existing = document.getElementById('analysis-queue-wrapper');
        if (existing) existing.remove();

        // Create wrapper with toggle button
        const wrapper = document.createElement('div');
        wrapper.id = 'analysis-queue-wrapper';
        wrapper.className = 'queue-wrapper collapsed';
        wrapper.innerHTML = `
            <!-- Chevron Toggle (Always Visible) -->
            <button id="queue-toggle-btn" class="queue-toggle-btn">
                <svg class="w-4 h-4 text-white transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>

            <!-- Queue Container (Slides Out) -->
            <div class="queue-container">
                <!-- Purple Wave Gradient Header -->
                <div class="queue-header-gradient">
                    <div class="wave-overlay"></div>
                    <div class="relative z-10 px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            <span class="text-white font-semibold text-sm">Analysis Queue</span>
                        </div>
                        <span id="queue-count-badge" class="px-2 py-0.5 bg-white/20 text-white text-xs font-medium rounded-full">0</span>
                    </div>
                </div>

                <!-- Queue Items Container -->
                <div id="analysis-queue-container" class="queue-items-scroll"></div>
            </div>
        `;

        document.body.appendChild(wrapper);

        // Setup toggle functionality
        const toggleBtn = document.getElementById('queue-toggle-btn');
        const queueWrapper = document.getElementById('analysis-queue-wrapper');

        toggleBtn.addEventListener('click', () => {
            const isCollapsed = queueWrapper.classList.contains('collapsed');
            
            if (isCollapsed) {
                queueWrapper.classList.remove('collapsed');
                toggleBtn.querySelector('svg').style.transform = 'rotate(180deg)';
            } else {
                queueWrapper.classList.add('collapsed');
                toggleBtn.querySelector('svg').style.transform = 'rotate(0deg)';
            }
        });

        console.log('✅ [AnalysisQueue] Collapsible container created');
    }

    // ===============================================================================
    // QUEUE MANAGEMENT
    // ===============================================================================

    addAnalysis(username, analysisType = 'light', businessId = null) {
        const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const analysis = {
            id: analysisId,
            username: username.replace('@', ''),
            analysisType,
            businessId,
            status: 'starting',
            progress: 0,
            currentStage: 0,
            totalStages: this.analysisStages[analysisType].length,
            message: 'Initializing analysis...',
            startTime: Date.now(),
            endTime: null,
            duration: null,
            estimatedTimeRemaining: this.getEstimatedDuration(analysisType),
            isMinimized: false,
            celebrationShown: false
        };

        this.activeAnalyses.set(analysisId, analysis);
        this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));

        this.showQueue();
        this.renderQueue();

        this.eventBus.emit(window.DASHBOARD_EVENTS.QUEUE_ITEM_ADDED, { analysisId, analysis });
        this.eventBus.emit(window.DASHBOARD_EVENTS.ANALYSIS_STARTED, { analysisId, username, analysisType });

        console.log(`➕ [AnalysisQueue] Added analysis: @${username} (${analysisType})`);
        return analysisId;
    }

    updateAnalysis(analysisId, updates) {
        const analysis = this.activeAnalyses.get(analysisId);
        if (!analysis) return;

        if (updates.progress !== undefined) {
            const oldTarget = analysis.targetProgress || 0;
            analysis.targetProgress = updates.progress;

            if (updates.progress !== oldTarget) {
                analysis.lastBackendUpdate = Date.now();
                console.log(`📊 [ProgressAnimator] Backend update: ${oldTarget}% → ${updates.progress}%`);
            }

            if (!this.animator.progressAnimators.has(analysisId)) {
                this.animator.startProgressAnimator(analysisId);
            }

            const nonProgressUpdates = { ...updates };
            delete nonProgressUpdates.progress;

            if (Object.keys(nonProgressUpdates).length > 0) {
                Object.assign(analysis, nonProgressUpdates);
                this.throttledRender();
            }

            this.animator.emitProgressEventThrottled(analysisId, updates, analysis);
            return;
        }

        Object.assign(analysis, updates);

        if (analysis.status === 'analyzing' && updates.progress !== undefined) {
            analysis.estimatedTimeRemaining = this.calculateTimeRemaining(analysis);
        }

        this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));
        this.throttledRender();

        console.log(`🔄 [AnalysisQueue] Updated: ${analysisId}`, updates);
    }

    completeAnalysis(analysisId, success = true, message = null, result = null) {
        const analysis = this.activeAnalyses.get(analysisId);
        if (!analysis) return;

        this.animator.stopProgressAnimator(analysisId);

        analysis.status = success ? 'completed' : 'failed';
        analysis.targetProgress = 100;
        analysis.visualProgress = 100;
        analysis.message = message || (success ? 'Analysis completed!' : 'Analysis failed');
        analysis.endTime = Date.now();
        analysis.duration = Math.round((analysis.endTime - analysis.startTime) / 1000);
        analysis.estimatedTimeRemaining = 0;

        if (success && !analysis.celebrationShown) {
            this.animator.triggerCelebration(analysisId, result);
            analysis.celebrationShown = true;
        }

        this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));
        this.renderQueue();

        this.eventBus.emit(window.DASHBOARD_EVENTS.ANALYSIS_COMPLETED, {
            analysisId, username: analysis.username, result
        });

        setTimeout(() => {
            this.removeAnalysis(analysisId);
        }, this.autoHideDelay);

        console.log(`${success ? '✅' : '❌'} [AnalysisQueue] ${success ? 'Completed' : 'Failed'}: @${analysis.username}`);
    }
cancelAnalysis(analysisId) {
    const analysis = this.activeAnalyses.get(analysisId);
    if (!analysis) return;

    console.log(`🚫 [AnalysisQueue] Cancelling analysis: ${analysisId}`);
    
    // Stop any running intervals
    if (analysis.progressInterval) {
        clearInterval(analysis.progressInterval);
    }
    if (analysis.stageInterval) {
        clearInterval(analysis.stageInterval);
    }
    
    // Update status to cancelled
    analysis.status = 'failed';
    analysis.message = 'Analysis cancelled';
    analysis.endTime = Date.now();
    
    // Trigger immediate removal
    setTimeout(() => {
        this.removeAnalysis(analysisId);
    }, 500);
    
    this.renderQueue();
}
    
    removeAnalysis(analysisId) {
        const analysis = this.activeAnalyses.get(analysisId);
        if (!analysis) return;

        this.animator.stopProgressAnimator(analysisId);

        const element = document.getElementById(`queue-item-${analysisId}`);
        if (element) {
            element.classList.add('queue-item-exit');
            setTimeout(() => {
                this.activeAnalyses.delete(analysisId);
                this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));
                this.renderQueue();
                this.maybeHideQueue();
            }, this.animationSpeed);
        } else {
            this.activeAnalyses.delete(analysisId);
            this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));
            this.renderQueue();
            this.maybeHideQueue();
        }

        this.eventBus.emit(window.DASHBOARD_EVENTS.QUEUE_ITEM_REMOVED, { analysisId, analysis });
        console.log(`🗑️ [AnalysisQueue] Removed: @${analysis.username}`);
    }

    // ===============================================================================
    // RENDERING (DELEGATES TO RENDERER)
    // ===============================================================================

    renderQueue() {
        this.throttledRender();
    }

    throttledRender() {
        if (this.renderThrottle) {
            clearTimeout(this.renderThrottle);
        }

        this.renderThrottle = setTimeout(() => {
            this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));
            this.renderer.renderQueue();
            this.renderThrottle = null;
        }, 300);
    }

    // ===============================================================================
    // ANALYSIS EXECUTION
    // ===============================================================================

  async startSingleAnalysis(username, analysisType, businessId, requestData) {
    console.log('🚀 [AnalysisQueue] Starting single analysis:', { username, analysisType, businessId });

    if (!this.supabase) {
        console.error('❌ [AnalysisQueue] No Supabase client available');
        throw new Error('Database connection not configured');
    }

    let supabaseClient = this.supabase;

    if (!supabaseClient.supabaseUrl && window.OsliraAuth?.supabase) {
        console.log('🔄 [AnalysisQueue] Getting fresh Supabase client from OsliraAuth');
        supabaseClient = window.OsliraAuth.supabase;

        if (!supabaseClient) {
            throw new Error('Unable to get Supabase client from OsliraAuth');
        }
    }

    const analysisId = this.addAnalysis(username, analysisType, businessId);
    this.animator.startStageBasedProgress(analysisId);

    try {
        // Get worker URL
        const workerUrl = window.OsliraConfig?.workerUrl || 
                          window.OsliraEnv?.WORKER_URL || 
                          'https://api.oslira.com';

        // Get auth token
        const session = await supabaseClient.auth.getSession();
        const authToken = session?.data?.session?.access_token;

        if (!authToken) {
            throw new Error('No authentication token available');
        }

        console.log('📡 [AnalysisQueue] Calling worker:', workerUrl);

        // Call Cloudflare Worker
        const response = await fetch(`${workerUrl}/v1/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                profile_url: `https://instagram.com/${requestData.username}`,
                analysis_type: requestData.analysis_type,
                business_id: requestData.business_id,
                user_id: requestData.user_id
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(errorData.error || `Analysis failed: ${response.status}`);
        }

        const data = await response.json();
        const result = data?.data || data;

        if (result && data.success) {
            this.completeAnalysis(analysisId, true, 'Analysis completed!', result);

            setTimeout(() => {
                this.eventBus.emit(window.DASHBOARD_EVENTS.DATA_REFRESH);
            }, 1000);

            return { success: true, analysisId, result };
        } else {
            console.error('❌ [AnalysisQueue] Analysis failed:', result?.error);
            this.completeAnalysis(analysisId, false, result?.error || 'Analysis failed');
            return { success: false, analysisId, error: result?.error };
        }

    } catch (error) {
        console.error('❌ [AnalysisQueue] Analysis exception:', error);

        let errorMessage = 'Network error occurred';
        if (error.message.includes('session')) {
            errorMessage = 'Please refresh and log in again';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Analysis timed out - please try again';
        } else if (error.message.includes('credits')) {
            errorMessage = 'Insufficient credits for analysis';
        } else {
            errorMessage = error.message;
        }

        this.completeAnalysis(analysisId, false, errorMessage);
        return { success: false, analysisId, error: error.message };
    }
}

    async startBulkAnalysis(leads, analysisType, businessId) {
        console.log(`🚀 [AnalysisQueue] Starting bulk analysis: ${leads.length} leads (${analysisType})`);

        const results = [];
        const maxConcurrent = 3;

        for (let i = 0; i < leads.length; i += maxConcurrent) {
            const chunk = leads.slice(i, i + maxConcurrent);
            const chunkPromises = chunk.map(async (lead) => {
                const username = lead.username || lead;
                const requestData = {
                    username: username.replace('@', ''),
                    analysis_type: analysisType,
                    business_id: businessId,
                    user_id: this.stateManager?.getState('user')?.id || window.OsliraAuth?.user?.id
                };

                try {
                    const result = await this.startSingleAnalysis(username, analysisType, businessId, requestData);
                    return {
                        username,
                        success: result.success,
                        error: result.error,
                        data: result.result
                    };
                } catch (error) {
                    return {
                        username,
                        success: false,
                        error: error.message
                    };
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.length - successCount;

        console.log(`✅ [AnalysisQueue] Bulk analysis complete: ${successCount} succeeded, ${failedCount} failed`);

        this.eventBus.emit(window.DASHBOARD_EVENTS.DATA_REFRESH);

        return {
            success: true,
            total: results.length,
            succeeded: successCount,
            failed: failedCount,
            results
        };
    }

    // ===============================================================================
    // INTERACTIONS
    // ===============================================================================

    toggleMinimize(analysisId) {
        const analysis = this.activeAnalyses.get(analysisId);
        if (!analysis) return;

        analysis.isMinimized = !analysis.isMinimized;
        this.renderQueue();
    }

    retryAnalysis(analysisId) {
        const analysis = this.activeAnalyses.get(analysisId);
        if (!analysis) return;

        analysis.status = 'starting';
        analysis.progress = 0;
        analysis.currentStage = 0;
        analysis.message = 'Retrying analysis...';
        analysis.startTime = Date.now();
        analysis.celebrationShown = false;

        this.renderQueue();
        this.animator.startStageBasedProgress(analysisId);

        console.log(`🔄 [AnalysisQueue] Retrying: @${analysis.username}`);
    }

    clearCompleted() {
        const completed = Array.from(this.activeAnalyses.entries()).filter(
            ([_, analysis]) => analysis.status === 'completed' || analysis.status === 'failed'
        );

        completed.forEach(([id]) => this.removeAnalysis(id));

        if (completed.length > 0) {
            this.osliraAuth?.showMessage(`Cleared ${completed.length} completed analyses`, 'success');
        }
    }

    // ===============================================================================
    // UTILITIES
    // ===============================================================================

    getEstimatedDuration(analysisType) {
        const stages = this.analysisStages[analysisType];
        return stages.reduce((total, stage) => total + stage.duration, 0);
    }

    calculateTimeRemaining(analysis) {
        const totalEstimated = this.getEstimatedDuration(analysis.analysisType);
        const elapsed = Date.now() - analysis.startTime;
        const progressRatio = analysis.progress / 100;
        const estimatedElapsed = totalEstimated * progressRatio;
        const remaining = Math.max(0, totalEstimated - elapsed);
        return remaining;
    }

    calculateStageTimeRemaining(analysis, currentStage) {
        const stages = this.analysisStages[analysis.analysisType];
        const remainingStages = stages.slice(currentStage);
        return remainingStages.reduce((total, stage) => total + stage.duration, 0);
    }

    showQueue() {
        const wrapper = document.getElementById('analysis-queue-wrapper');
        if (wrapper && wrapper.classList.contains('collapsed')) {
            const toggleBtn = document.getElementById('queue-toggle-btn');
            wrapper.classList.remove('collapsed');
            if (toggleBtn) {
                toggleBtn.querySelector('svg').style.transform = 'rotate(180deg)';
            }
            this.stateManager.setState('queueVisible', true);
        }
        this.updateQueueBadge();
    }

    maybeHideQueue() {
        if (this.activeAnalyses.size === 0) {
            const wrapper = document.getElementById('analysis-queue-wrapper');
            const toggleBtn = document.getElementById('queue-toggle-btn');
            
            if (wrapper && !wrapper.classList.contains('collapsed')) {
                setTimeout(() => {
                    wrapper.classList.add('collapsed');
                    if (toggleBtn) {
                        toggleBtn.querySelector('svg').style.transform = 'rotate(0deg)';
                    }
                    this.stateManager.setState('queueVisible', false);
                }, this.autoHideDelay);
            }
        }
        this.updateQueueBadge();
    }

    updateQueueBadge() {
        const badge = document.getElementById('queue-count-badge');
        if (badge) {
            const count = this.activeAnalyses.size;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    updateSettings(settings) {
        if (settings.smoothProgressEnabled !== undefined) {
            this.smoothProgressEnabled = settings.smoothProgressEnabled;
        }
        if (settings.soundEnabled !== undefined) {
            this.soundEnabled = settings.soundEnabled;
        }
        if (settings.animationSpeed !== undefined) {
            this.animationSpeed = settings.animationSpeed;
        }
        if (settings.autoHideDelay !== undefined) {
            this.autoHideDelay = settings.autoHideDelay;
        }

        console.log('⚙️ [AnalysisQueue] Settings updated:', settings);
    }

    // ===============================================================================
    // PUBLIC API
    // ===============================================================================

    getQueueStats() {
        const analyses = Array.from(this.activeAnalyses.values());
        return {
            total: analyses.length,
            analyzing: analyses.filter(a => a.status === 'analyzing').length,
            completed: analyses.filter(a => a.status === 'completed').length,
            failed: analyses.filter(a => a.status === 'failed').length
        };
    }

    getAllAnalyses() {
        return Array.from(this.activeAnalyses.values());
    }

    getAnalysis(analysisId) {
        return this.activeAnalyses.get(analysisId);
    }

    // ===============================================================================
    // CLEANUP
    // ===============================================================================

    cleanup() {
        this.activeAnalyses.clear();

        const wrapper = document.getElementById('analysis-queue-wrapper');
        if (wrapper) {
            wrapper.remove();
        }

        AnalysisQueueStyles.cleanup();
        this.animator.cleanup();

        console.log('🧹 [AnalysisQueue] Cleanup completed');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisQueue;
} else {
    window.AnalysisQueue = AnalysisQueue;
}

console.log('✅ [AnalysisQueue] Module loaded');
