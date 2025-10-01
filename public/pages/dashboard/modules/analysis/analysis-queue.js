//public/pages/dashboard/modules/analysis/enhanced-analysis-queue.js

/**
 * ENHANCED OSLIRA ANALYSIS QUEUE MODULE  
 * Complete revamp with Tailwind, Lucide icons, glassmorphism, and dopamine-driven UX
 */
class AnalysisQueue {
constructor(container) {
    this.container = container;
    this.eventBus = container.get('eventBus');
    this.stateManager = container.get('stateManager');
    this.supabase = container.get('supabase');
    this.osliraAuth = container.get('osliraAuth');
    
    // Validate Supabase client during construction
    if (!this.supabase) {
        console.warn('⚠️ [EnhancedAnalysisQueue] No Supabase client from container, will use OsliraAuth fallback');
    }
        
        // Queue configuration
        this.activeAnalyses = new Map();
        this.maxVisible = 5;
        this.autoHideDelay = 12000; // Increased for better UX
        
        // Enhanced configuration
        this.smoothProgressEnabled = true;
        this.soundEnabled = false; // Can be toggled in settings
        this.animationSpeed = 300;
        
this.analysisStages = {
    light: [
        { text: "🔍 Scanning profile...", duration: 2250, color: "text-blue-500" },
        { text: "📊 Analyzing engagement...", duration: 2750, color: "text-amber-500" },
        { text: "🎯 Calculating scores...", duration: 2500, color: "text-green-500" },
        { text: "✨ Finalizing results...", duration: 1500, color: "text-purple-500" }
    ],
    deep: [
        { text: "🔍 Scanning @profile...", duration: 4000, color: "text-blue-500" },
        { text: "📊 Deep engagement analysis...", duration: 4000, color: "text-amber-500" },
        { text: "🎯 Advanced scoring...", duration: 4000, color: "text-green-500" },
        { text: "🤖 Generating insights...", duration: 4000, color: "text-purple-500" },
        { text: "✉️ Crafting outreach...", duration: 4000, color: "text-cyan-500" },
        { text: "✨ Finalizing results...", duration: 4000, color: "text-indigo-500" }
    ],
    xray: [
        { text: "🔍 Deep profile scan...", duration: 4200, color: "text-blue-500" },
        { text: "📊 X-Ray engagement analysis...", duration: 4200, color: "text-amber-500" },
        { text: "🎯 Advanced scoring...", duration: 4200, color: "text-green-500" },
        { text: "🤖 Generating insights...", duration: 4200, color: "text-purple-500" },
        { text: "✉️ Crafting outreach...", duration: 4200, color: "text-cyan-500" },
        { text: "✨ Finalizing results...", duration: 4000, color: "text-indigo-500" }
    ]
        };
        
        this.setupEnhancedContainer();
        this.injectStyles();
        
        console.log('🚀 [EnhancedAnalysisQueue] Initialized with dopamine features');
    }
    
    async init() {
        this.eventBus.on('dashboard:cleanup', this.cleanup.bind(this));
        console.log('✅ [EnhancedAnalysisQueue] Event listeners initialized');
    }
    
    // ===============================================================================
    // ENHANCED CONTAINER SETUP
    // ===============================================================================
    
    setupEnhancedContainer() {
        const existing = document.getElementById('analysis-queue-container');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'analysis-queue-container';
        container.className = 'enhanced-analysis-queue';
        container.style.cssText = `
            position: fixed;
            top: 120px;
            right: 24px;
            z-index: 9999;
            width: 380px;
            max-height: 600px;
            display: none;
            transform: translateX(400px);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        document.body.appendChild(container);
        console.log('🏗️ [EnhancedAnalysisQueue] Enhanced container created');
    }
    
    injectStyles() {
        if (document.getElementById('enhanced-queue-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'enhanced-queue-styles';
        styles.textContent = `
            /* Enhanced Queue Animations */
            .enhanced-analysis-queue.show {
                display: block !important;
                transform: translateX(0) !important;
            }
            
            .queue-item-enter {
                animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            
            .queue-item-exit {
                animation: slideOutRight 0.3s ease-in-out forwards;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100px); opacity: 0; scale: 0.9; }
                to { transform: translateX(0); opacity: 1; scale: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; scale: 1; }
                to { transform: translateX(100px); opacity: 0; scale: 0.9; }
            }
            
            @keyframes pulseGlow {
                0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
            }
            
            @keyframes progressShimmer {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
            }
            
            @keyframes celebrationBounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
                40% { transform: translateY(-8px) scale(1.05); }
                60% { transform: translateY(-4px) scale(1.02); }
            }
            
@keyframes countUpStatic {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
            
.progress-shimmer {
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
    );
    background-size: 200px 100%;
    animation: progressShimmer 1.5s infinite;
}
            
            .celebrating {
                animation: celebrationBounce 0.6s ease-out;
            }
            
            .pulse-glow {
                animation: pulseGlow 2s infinite;
            }
            
            .smooth-progress {
                transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
.hover-lift {
    transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
}

.hover-lift.analyzing {
    pointer-events: none; /* Disable hover during analysis */
}
            
            .minimized {
                max-height: 60px;
                overflow: hidden;
            }
            
            .queue-header-minimized .queue-details {
                display: none;
            }
            
            /* Glassmorphism styles */
            .glass-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .glass-card-dark {
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(71, 85, 105, 0.3);
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // ===============================================================================
    // ENHANCED QUEUE MANAGEMENT
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
        
        // Emit events
        this.eventBus.emit(window.DASHBOARD_EVENTS.QUEUE_ITEM_ADDED, { analysisId, analysis });
        this.eventBus.emit(window.DASHBOARD_EVENTS.ANALYSIS_STARTED, { analysisId, username, analysisType });
        
        console.log(`➕ [EnhancedAnalysisQueue] Added analysis: @${username} (${analysisType})`);
        return analysisId;
    }
    
updateAnalysis(analysisId, updates) {
    const analysis = this.activeAnalyses.get(analysisId);
    if (!analysis) return;
    
    // Handle smooth progress updates
    if (updates.progress !== undefined && this.smoothProgressEnabled) {
        // Create a copy of updates without progress for immediate assignment
        const updatesWithoutProgress = { ...updates };
        delete updatesWithoutProgress.progress;
        
        // Apply non-progress updates immediately
        Object.assign(analysis, updatesWithoutProgress);
        
        // Start smooth progress animation (don't update progress immediately)
        this.smoothProgressUpdate(analysisId, updates.progress);
        
        // Early return to avoid double update
        this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));
        this.eventBus.emit(window.DASHBOARD_EVENTS.ANALYSIS_PROGRESS, {
            analysisId, updates: updatesWithoutProgress, analysis
        });
        return;
    }
    
    // Regular update for non-progress changes
    Object.assign(analysis, updates);
    
    // Calculate estimated time remaining
    if (analysis.status === 'analyzing' && updates.progress) {
        analysis.estimatedTimeRemaining = this.calculateTimeRemaining(analysis);
    }
    
    this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));
    this.renderQueue();
    
    this.eventBus.emit(window.DASHBOARD_EVENTS.ANALYSIS_PROGRESS, {
        analysisId, updates, analysis
    });
    
    console.log(`🔄 [EnhancedAnalysisQueue] Updated: ${analysisId}`, updates);
}
    
    completeAnalysis(analysisId, success = true, message = null, result = null) {
        const analysis = this.activeAnalyses.get(analysisId);
        if (!analysis) return;
        
        analysis.status = success ? 'completed' : 'failed';
        analysis.progress = 100;
        analysis.message = message || (success ? 'Analysis completed!' : 'Analysis failed');
        analysis.endTime = Date.now();
        analysis.duration = Math.round((analysis.endTime - analysis.startTime) / 1000);
        analysis.estimatedTimeRemaining = 0;
        
        // Trigger celebration animation for successful completions
        if (success && !analysis.celebrationShown) {
            this.triggerCelebration(analysisId, result);
            analysis.celebrationShown = true;
        }
        
        this.stateManager.setState('analysisQueue', new Map(this.activeAnalyses));
        this.renderQueue();
        
        // Emit completion event
        this.eventBus.emit(window.DASHBOARD_EVENTS.ANALYSIS_COMPLETED, {
            analysisId, username: analysis.username, result
        });
        
        // Auto-remove after delay
        setTimeout(() => {
            this.removeAnalysis(analysisId);
        }, this.autoHideDelay);
        
        console.log(`${success ? '✅' : '❌'} [EnhancedAnalysisQueue] ${success ? 'Completed' : 'Failed'}: @${analysis.username}`);
    }
    
    removeAnalysis(analysisId) {
        const analysis = this.activeAnalyses.get(analysisId);
        if (!analysis) return;
        
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
        console.log(`🗑️ [EnhancedAnalysisQueue] Removed: @${analysis.username}`);
    }
    
    // ===============================================================================
    // ENHANCED UI RENDERING
    // ===============================================================================
    renderQueue() {
    // Debounce renders to prevent spam
    if (this.renderDebounce) {
        clearTimeout(this.renderDebounce);
    }
    
    this.renderDebounce = setTimeout(() => {
        this.actualRenderQueue();
        this.renderDebounce = null;
    }, 16); // 60fps max
}
    
    actualRenderQueue() {
        const container = document.getElementById('analysis-queue-container');
        if (!container) return;
        
        const analyses = Array.from(this.activeAnalyses.values()).sort(
            (a, b) => b.startTime - a.startTime
        );
        
        if (analyses.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const needsScroll = analyses.length > this.maxVisible;
        const visibleAnalyses = needsScroll ? analyses.slice(0, this.maxVisible) : analyses;
        
        container.innerHTML = `
            <div class="space-y-3">
                ${visibleAnalyses.map(analysis => this.renderEnhancedQueueItem(analysis)).join('')}
                ${this.renderQueueFooter(analyses.length, needsScroll)}
            </div>
        `;
        
        // Add enter animations to new items
        setTimeout(() => {
            container.querySelectorAll('.queue-item-new').forEach(item => {
                item.classList.remove('queue-item-new');
                item.classList.add('queue-item-enter');
            });
        }, 50);
        
        this.eventBus.emit(window.DASHBOARD_EVENTS.QUEUE_UPDATED, {
            count: analyses.length,
            visible: visibleAnalyses.length
        });
    }
    
    renderEnhancedQueueItem(analysis) {
        const elapsed = Math.round((Date.now() - analysis.startTime) / 1000);
        const timeText = this.formatElapsedTime(elapsed);
        const progressPercentage = Math.min(100, Math.max(0, analysis.progress));
        const statusConfig = this.getEnhancedStatusConfig(analysis.status);
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
    ${isActive ? `
        <div class="absolute inset-0 rounded-full border-2 border-blue-500 opacity-75">
            <div class="absolute inset-0 rounded-full border-t-2 border-blue-600 animate-spin"></div>
        </div>
    ` : ''}
</div>
                        
                        <!-- Username and Type -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2">
                                <h4 class="font-semibold text-gray-900 truncate">@${analysis.username}</h4>
                                <span class="px-2 py-1 text-xs font-medium ${statusConfig.typeColor} ${statusConfig.typeBg} rounded-md uppercase tracking-wide">
                                    ${analysis.analysisType}
                                </span>
                            </div>
                            <div class="queue-details">
                                <p class="text-sm text-gray-600 mt-1">${analysis.message}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex items-center space-x-2">
                        ${analysis.estimatedTimeRemaining > 0 ? `
                            <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                ~${Math.ceil(analysis.estimatedTimeRemaining / 1000)}s
                            </div>
                        ` : ''}
                        <div class="text-xs text-gray-400">${timeText}</div>
                        <button onclick="analysisQueue.toggleMinimize('${analysis.id}')"
                                class="p-1 hover:bg-gray-100 rounded-md transition-colors">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${analysis.isMinimized ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}"/>
                            </svg>
                        </button>
                        ${isActive ? `
                            <button onclick="analysisQueue.removeAnalysis('${analysis.id}')"
                                    class="p-1 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                ${!analysis.isMinimized ? `
                    <!-- Progress Section -->
                    ${isActive ? `
                        <div class="space-y-3">
                            <!-- Progress Bar -->
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
                        <div class="mt-4 flex space-x-2">
                            <button onclick="dashboard.viewLatestLead('${analysis.username}')" 
                                    class="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                                <span>View Results</span>
                            </button>
                            <button onclick="analysisQueue.removeAnalysis('${analysis.id}')"
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                    
                    ${isFailed ? `
                        <div class="mt-4 flex space-x-2">
                            <button onclick="analysisQueue.retryAnalysis('${analysis.id}')"
                                    class="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center space-x-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                                <span>Retry</span>
                            </button>
                            <button onclick="analysisQueue.removeAnalysis('${analysis.id}')"
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                ` : ''}
            </div>
        `;
    }
    
    renderQueueFooter(totalCount, needsScroll) {
        const completedCount = Array.from(this.activeAnalyses.values())
            .filter(a => a.status === 'completed' || a.status === 'failed').length;
        
        return `
            ${needsScroll ? `
                <div class="glass-card rounded-lg p-3 text-center">
                    <p class="text-sm text-gray-600">+${totalCount - this.maxVisible} more analyses</p>
                </div>
            ` : ''}
            ${completedCount > 0 ? `
                <div class="flex justify-center">
                    <button onclick="analysisQueue.clearCompleted()" 
                            class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        <span>Clear Completed</span>
                    </button>
                </div>
            ` : ''}
        `;
    }
    
    // ===============================================================================
    // ENHANCED INTERACTIONS
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
        
        // Reset analysis state
        analysis.status = 'starting';
        analysis.progress = 0;
        analysis.currentStage = 0;
        analysis.message = 'Retrying analysis...';
        analysis.startTime = Date.now();
        analysis.celebrationShown = false;
        
        this.renderQueue();
        this.startStageBasedProgress(analysisId);
        
        console.log(`🔄 [EnhancedAnalysisQueue] Retrying: @${analysis.username}`);
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
    // ENHANCED PROGRESS & ANIMATIONS
    // ===============================================================================
    
startStageBasedProgress(analysisId) {
    const analysis = this.activeAnalyses.get(analysisId);
    if (!analysis) return;
    
    const stages = this.analysisStages[analysis.analysisType];
    let currentStage = 0;
    
    // Create continuous progress within each stage
    const progressStage = () => {
        if (currentStage >= stages.length || analysis.status !== 'analyzing') return;
        
        const stage = stages[currentStage];
        const progressPerStage = 100 / stages.length;
        const stageStartProgress = currentStage * progressPerStage;
        const stageEndProgress = (currentStage + 1) * progressPerStage;
        
        // Update stage info immediately
        this.updateAnalysis(analysisId, {
            currentStage,
            message: stage.text.replace('@profile', `@${analysis.username}`),
            estimatedTimeRemaining: this.calculateStageTimeRemaining(analysis, currentStage)
        });
        
        // Smooth progress within this stage
        const smoothProgressInStage = () => {
            const steps = 30; // Number of progress updates within stage
            const stepSize = progressPerStage / steps;
            const stepDelay = stage.duration / steps;
            
            let step = 0;
            const stepUpdate = () => {
                if (step >= steps || analysis.status !== 'analyzing') {
                    currentStage++;
                    setTimeout(progressStage, 100); // Brief pause between stages
                    return;
                }
                
                const currentProgress = stageStartProgress + (step * stepSize);
                analysis.progress = Math.round(currentProgress);
                this.renderQueue();
                
                step++;
                setTimeout(stepUpdate, stepDelay);
            };
            
            stepUpdate();
        };
        
        smoothProgressInStage();
    };
        
        // Start with analyzing status
        setTimeout(() => {
            this.updateAnalysis(analysisId, { status: 'analyzing' });
            progressStage();
        }, 500);
    }
    
smoothProgressUpdate(analysisId, targetProgress) {
    const analysis = this.activeAnalyses.get(analysisId);
    if (!analysis) return;
    
    // Skip if already animating to prevent conflicts
    if (analysis.isAnimating) return;
    analysis.isAnimating = true;
    
    const currentProgress = analysis.progress || 0;
    const progressDiff = targetProgress - currentProgress;
    const steps = 20;
    const stepSize = progressDiff / steps;
    const stepDelay = 50;
    
    let currentStep = 0;
    const smoothStep = () => {
        if (currentStep >= steps || analysis.status === 'completed' || analysis.status === 'failed') {
            analysis.progress = targetProgress;
            analysis.isAnimating = false;
            this.renderQueue();
            return;
        }
        
        analysis.progress = Math.round(currentProgress + (stepSize * currentStep));
        this.renderQueue();
        
        currentStep++;
        setTimeout(smoothStep, stepDelay);
    };
    
    smoothStep();
}
    
    triggerCelebration(analysisId, result = null) {
        const element = document.getElementById(`queue-item-${analysisId}`);
        if (!element) return;
        
        // Add celebration animation
        element.classList.add('celebrating');
        
        // Create confetti effect for high scores
        if (result && result.overall_score >= 80) {
            this.createConfettiEffect(element);
        }
        
        // Play success sound if enabled
        if (this.soundEnabled) {
            this.playSuccessSound();
        }
        
        // Remove celebration class after animation
        setTimeout(() => {
            element.classList.remove('celebrating');
        }, 600);
        
        console.log('🎉 [EnhancedAnalysisQueue] Celebration triggered for analysis:', analysisId);
    }
    
    createConfettiEffect(element) {
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
        const confettiCount = 15;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                    animation: confettiFall 1.5s ease-out forwards;
                `;
                
                const rect = element.getBoundingClientRect();
                confetti.style.left = `${rect.left + Math.random() * rect.width}px`;
                confetti.style.top = `${rect.top}px`;
                
                document.body.appendChild(confetti);
                
                // Remove confetti after animation
                setTimeout(() => confetti.remove(), 1500);
            }, i * 50);
        }
        
        // Add confetti animation if not exists
        if (!document.getElementById('confetti-animation')) {
            const style = document.createElement('style');
            style.id = 'confetti-animation';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(200px) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    playSuccessSound() {
        try {
            // Create a simple success sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('[EnhancedAnalysisQueue] Sound playback failed:', error);
        }
    }
    
    // ===============================================================================
    // UTILITY FUNCTIONS
    // ===============================================================================
    
    getEnhancedStatusConfig(status) {
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
                bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
                badgeColor: 'bg-blue-500',
                progressBg: 'bg-gradient-to-r from-blue-400 to-purple-500',
                textColor: 'text-blue-600',
                typeColor: 'text-blue-700',
                typeBg: 'bg-blue-100'
            },
            completed: {
                icon: `<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>`,
                bgColor: 'bg-gradient-to-br from-green-400 to-emerald-600',
                badgeColor: 'bg-green-500',
                progressBg: 'bg-gradient-to-r from-green-400 to-emerald-500',
                textColor: 'text-green-600',
                typeColor: 'text-green-700',
                typeBg: 'bg-green-100'
            },
            failed: {
                icon: `<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>`,
                bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
                badgeColor: 'bg-red-500',
                progressBg: 'bg-gradient-to-r from-red-400 to-red-500',
                textColor: 'text-red-600',
                typeColor: 'text-red-700',
                typeBg: 'bg-red-100'
            }
        };
        
        return configs[status] || configs.starting;
    }
    
getEstimatedDuration(analysisType) {
    const durations = {
        light: 9000,  // 9 seconds
        deep: 24000,  // 24 seconds
        xray: 25000   // 25 seconds
    };
    return durations[analysisType] || durations.light;
}
    
    calculateTimeRemaining(analysis) {
        const elapsed = Date.now() - analysis.startTime;
        const totalEstimated = this.getEstimatedDuration(analysis.analysisType);
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
    
    formatElapsedTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
    }
    
    // ===============================================================================
    // QUEUE VISIBILITY MANAGEMENT
    // ===============================================================================
    
    showQueue() {
        const container = document.getElementById('analysis-queue-container');
        if (container) {
            container.style.display = 'block';
            // Trigger animation after display is set
            setTimeout(() => {
                container.classList.add('show');
            }, 10);
            this.stateManager.setState('queueVisible', true);
        }
    }
    
    maybeHideQueue() {
        if (this.activeAnalyses.size === 0) {
            const container = document.getElementById('analysis-queue-container');
            if (container) {
                container.classList.remove('show');
                setTimeout(() => {
                    container.style.display = 'none';
                }, 400); // Match transition duration
                this.stateManager.setState('queueVisible', false);
            }
        }
    }
    
    // ===============================================================================
    // ANALYSIS EXECUTION (Enhanced)
    // ===============================================================================
    
async startSingleAnalysis(username, analysisType, businessId, requestData) {
    console.log('🚀 [EnhancedAnalysisQueue] Starting single analysis:', { username, analysisType, businessId });
    
    // 1. VALIDATE SUPABASE CLIENT
    if (!this.supabase) {
        console.error('❌ [EnhancedAnalysisQueue] No Supabase client available');
        throw new Error('Database connection not configured');
    }

    // 2. GET FRESH SUPABASE CLIENT FROM OsliraAuth IF NEEDED  
    let supabaseClient = this.supabase;
    
    // If our injected client is missing URL, get it from OsliraAuth
    if (!supabaseClient.supabaseUrl && window.OsliraAuth?.supabase) {
        console.log('🔄 [EnhancedAnalysisQueue] Getting fresh Supabase client from OsliraAuth');
        supabaseClient = window.OsliraAuth.supabase;
        
        if (!supabaseClient) {
            throw new Error('Unable to get Supabase client from OsliraAuth');
        }
    }
    
    // 3. VERIFY SESSION
    const session = await supabaseClient.auth.getSession();
    if (!session?.data?.session) {
        throw new Error('No valid session - please log in again');
    }
    
    console.log('✅ [EnhancedAnalysisQueue] Session validated:', {
        userId: session.data.session.user.id,
        hasToken: !!session.data.session.access_token
    });
    
    // 4. CREATE ANALYSIS QUEUE ITEM
    const analysisId = this.addAnalysis(username, analysisType, businessId);
    
    try {
        // 5. START PROGRESS SIMULATION
        this.startStageBasedProgress(analysisId);
        
        // 6. CALL API WITH VALIDATED DATA
        console.log('🔥 [EnhancedAnalysisQueue] Calling analysis API with payload:', requestData);
        const result = await this.callAnalysisAPI(requestData);
        
        // 7. HANDLE SUCCESS
        if (result.success) {
            this.completeAnalysis(analysisId, true, 'Analysis completed successfully!', result.data);
            
            // Emit success event for dashboard refresh
            this.eventBus.emit(window.DASHBOARD_EVENTS.ANALYSIS_COMPLETED, {
                analysisId,
                username: username.replace('@', ''),
                result: result.data
            });
            
            console.log('✅ [EnhancedAnalysisQueue] Analysis completed successfully:', analysisId);
            return { success: true, analysisId, result: result.data };
            
        } else {
            // 8. HANDLE FAILURE
            console.error('❌ [EnhancedAnalysisQueue] Analysis failed:', result.error);
            this.completeAnalysis(analysisId, false, result.error || 'Analysis failed');
            return { success: false, analysisId, error: result.error };
        }
        
    } catch (error) {
        // 9. HANDLE EXCEPTIONS
        console.error('❌ [EnhancedAnalysisQueue] Analysis exception:', error);
        
        // Determine error type for better user messaging
        let errorMessage = 'Network error occurred';
        if (error.message.includes('session')) {
            errorMessage = 'Please refresh and log in again';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Analysis timed out - please try again';
        } else if (error.message.includes('credits')) {
            errorMessage = 'Insufficient credits for analysis';
        }
        
        this.completeAnalysis(analysisId, false, errorMessage);
        return { success: false, analysisId, error: error.message };
    }
}
    
    async startBulkAnalysis(leads, analysisType, businessId) {
        console.log(`🚀 [EnhancedAnalysisQueue] Starting bulk analysis: ${leads.length} leads (${analysisType})`);
        
        const results = [];
        const maxConcurrent = 3; // Limit concurrent analyses
        
        // Process leads in chunks
        for (let i = 0; i < leads.length; i += maxConcurrent) {
            const chunk = leads.slice(i, i + maxConcurrent);
            const chunkPromises = chunk.map(async (lead) => {
                const username = lead.username || lead;
                const requestData = {
                    username: username.replace('@', ''),
                    analysisType,
                    business_id: businessId
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
            
            // Brief delay between chunks to prevent API overload
            if (i + maxConcurrent < leads.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log('✅ [EnhancedAnalysisQueue] Bulk analysis completed:', {
            total: leads.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });
        
        return results;
    }
    
    // ===============================================================================
    // API INTEGRATION (Enhanced)
    // ===============================================================================
    
async callAnalysisAPI(requestData) {
    console.log('🔥 [EnhancedAnalysisQueue] Starting API call with:', requestData);
    
    try {
        // 1. GET SUPABASE URL FROM CONFIG
        console.log('🔍 [EnhancedAnalysisQueue] Debug - Config availability:', {
            hasOsliraConfig: !!window.OsliraConfig,
            hasGetSupabaseUrl: !!window.OsliraConfig?.getSupabaseUrl,
            hasOsliraEnv: !!window.OsliraEnv,
            hasSupabaseUrl: !!window.OsliraEnv?.SUPABASE_URL,
            configInitialized: window.OsliraConfig?.initialized,
            envConfigLoaded: window.OsliraEnv?.configLoaded
        });
        
        let supabaseUrl;
        if (window.OsliraConfig?.getSupabaseUrl) {
            supabaseUrl = window.OsliraConfig.getSupabaseUrl();
            console.log('🔧 [EnhancedAnalysisQueue] Got URL from OsliraConfig:', supabaseUrl);
        } else if (window.OsliraEnv?.SUPABASE_URL) {
            supabaseUrl = window.OsliraEnv.SUPABASE_URL;
            console.log('🔧 [EnhancedAnalysisQueue] Got URL from OsliraEnv:', supabaseUrl);
        } else {
            console.error('❌ [EnhancedAnalysisQueue] No Supabase URL available');
            throw new Error('Supabase URL not configured');
        }
        
        console.log('✅ [EnhancedAnalysisQueue] Final Supabase URL:', supabaseUrl);
        
        // 2. GET FRESH SUPABASE CLIENT FOR SESSION ONLY
        let supabaseClient;
        if (window.OsliraAuth?.supabase) {
            supabaseClient = window.OsliraAuth.supabase;
            console.log('✅ [EnhancedAnalysisQueue] Using OsliraAuth client');
        } else {
            throw new Error('OsliraAuth not available - cannot get session');
        }
        
        // 3. GET SESSION
        const session = await supabaseClient.auth.getSession();
        if (!session?.data?.session?.access_token) {
            throw new Error('No valid session token');
        }
        
        console.log('✅ [EnhancedAnalysisQueue] Session validated:', {
            hasToken: !!session.data.session.access_token,
            userId: session.data.session.user.id
        });
        
        // 3. GET WORKER URL
        let workerUrl;
        if (window.OsliraConfig?.getWorkerUrl) {
            workerUrl = await window.OsliraConfig.getWorkerUrl();
        } else if (window.OsliraEnv?.WORKER_URL) {
            workerUrl = window.OsliraEnv.WORKER_URL;
        } else {
            workerUrl = 'https://api-staging.oslira.com';
        }
        const apiUrl = `${workerUrl}/v1/analyze`;
        
        console.log('🔥 [EnhancedAnalysisQueue] Calling API:', {
            url: apiUrl,
            payload: requestData
        });
        
// 4. MAKE API CALL USING API CLIENT
const result = await window.OsliraAPI.request('/v1/analyze', {
    method: 'POST',
    body: JSON.stringify(requestData)
});

console.log('✅ [EnhancedAnalysisQueue] API call successful');
return { success: true, data: result };
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('⏰ [EnhancedAnalysisQueue] Request timed out');
            throw new Error('Analysis timeout - please try again');
        }
        
        console.error('❌ [EnhancedAnalysisQueue] API call failed:', error);
        return { success: false, error: error.message };
    }
}
    
    // ===============================================================================
    // SETTINGS & CONFIGURATION
    // ===============================================================================
    
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
        
        console.log('⚙️ [EnhancedAnalysisQueue] Settings updated:', settings);
    }
    
    // ===============================================================================
    // CLEANUP
    // ===============================================================================
    
    cleanup() {
        // Clear all active analyses
        this.activeAnalyses.clear();
        
        // Hide and remove container
        const container = document.getElementById('analysis-queue-container');
        if (container) {
            container.remove();
        }
        
        // Remove injected styles
        const styles = document.getElementById('enhanced-queue-styles');
        if (styles) {
            styles.remove();
        }
        
        // Remove confetti styles
        const confettiStyles = document.getElementById('confetti-animation');
        if (confettiStyles) {
            confettiStyles.remove();
        }
        
        console.log('🧹 [EnhancedAnalysisQueue] Cleanup completed');
    }
    
    // ===============================================================================
    // PUBLIC METHODS FOR GLOBAL ACCESS
    // ===============================================================================
    
    // Expose methods for onclick handlers
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
}

// ===============================================================================
// GLOBAL SETUP AND EXPORT
// ===============================================================================

// Make available globally for onclick handlers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedAnalysisQueue;
} else {
    window.AnalysisQueue = AnalysisQueue;
    
    // Global function bindings for onclick handlers
    window.analysisQueue = null; // Will be set by dashboard initialization
}
