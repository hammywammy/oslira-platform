// public/pages/dashboard/modules/analysis/analysis-queue-animator.js

/**
 * ANALYSIS QUEUE ANIMATOR MODULE
 * Handles all progress animations, celebrations, and visual effects
 */
class AnalysisQueueAnimator {
    constructor(queue) {
        this.queue = queue;
        this.progressAnimators = new Map();
        this.lastProgressEvent = new Map();
    }

    // ===============================================================================
    // PROGRESS ANIMATION
    // ===============================================================================

    startProgressAnimator(analysisId) {
        const analysis = this.queue.activeAnalyses.get(analysisId);
        if (!analysis) return;

        if (analysis.visualProgress === undefined) {
            analysis.visualProgress = 0;
        }
        if (analysis.targetProgress === undefined) {
            analysis.targetProgress = 0;
        }

        analysis.stageStartTime = Date.now();
        analysis.stageStartProgress = 0;
        analysis.lastBackendUpdate = Date.now();
        analysis.maxReachedProgress = 0;

        let lastFrameTime = Date.now();

        const animate = () => {
            const currentAnalysis = this.queue.activeAnalyses.get(analysisId);
            if (!currentAnalysis || currentAnalysis.status === 'completed' || currentAnalysis.status === 'failed') {
                this.progressAnimators.delete(analysisId);
                return;
            }

            const now = Date.now();
            const deltaTime = (now - lastFrameTime) / 1000;
            lastFrameTime = now;

            const currentStage = currentAnalysis.currentStage || 0;
            const stages = this.queue.analysisStages[currentAnalysis.analysisType];
            const stage = stages[currentStage];

            if (!stage) {
                this.simpleProgressAnimation(currentAnalysis, analysisId);
                const rafId = requestAnimationFrame(animate);
                this.progressAnimators.set(analysisId, rafId);
                return;
            }

            const stageElapsed = now - currentAnalysis.stageStartTime;
            const stageProgress = Math.min(100, (stageElapsed / stage.duration) * 100);
            const progressPerStage = 100 / stages.length;
            const expectedProgress = currentAnalysis.stageStartProgress + (stageProgress / 100) * progressPerStage;

            const target = Math.min(currentAnalysis.targetProgress || 0, expectedProgress, 97);
            currentAnalysis.maxReachedProgress = Math.max(currentAnalysis.maxReachedProgress || 0, currentAnalysis.visualProgress || 0);

            const current = currentAnalysis.visualProgress || 0;
            const diff = target - current;

            if (diff > 0.1) {
                const step = diff * 0.05;
                currentAnalysis.visualProgress = Math.min(current + step, 97, currentAnalysis.maxReachedProgress + 0.1);
            } else if (diff > 0) {
                currentAnalysis.visualProgress = current + 0.01;
            }

            this.queue.renderer.updateProgressBarDOM(analysisId, currentAnalysis.visualProgress);

            const rafId = requestAnimationFrame(animate);
            this.progressAnimators.set(analysisId, rafId);
        };

        const rafId = requestAnimationFrame(animate);
        this.progressAnimators.set(analysisId, rafId);
    }

    simpleProgressAnimation(analysis, analysisId) {
        const target = Math.min(analysis.targetProgress || 0, 97);
        const current = analysis.visualProgress || 0;
        const diff = target - current;

        if (diff > 0.1) {
            const step = diff * 0.05;
            analysis.visualProgress = Math.min(current + step, 97);
        } else if (diff > 0) {
            analysis.visualProgress = current + 0.01;
        }

        this.queue.renderer.updateProgressBarDOM(analysisId, analysis.visualProgress);
    }

    stopProgressAnimator(analysisId) {
        const rafId = this.progressAnimators.get(analysisId);
        if (rafId) {
            cancelAnimationFrame(rafId);
            this.progressAnimators.delete(analysisId);
        }
        this.lastProgressEvent.delete(analysisId);
    }

    emitProgressEventThrottled(analysisId, updates, analysis) {
        const now = Date.now();
        const lastEmit = this.lastProgressEvent.get(analysisId) || 0;

        if (now - lastEmit > 1000) {
            this.queue.eventBus.emit(window.DASHBOARD_EVENTS.ANALYSIS_PROGRESS, {
                analysisId,
                updates: { progress: Math.round(analysis.visualProgress || 0) },
                analysis
            });
            this.lastProgressEvent.set(analysisId, now);
        }
    }

    // ===============================================================================
    // STAGE-BASED PROGRESS
    // ===============================================================================

    startStageBasedProgress(analysisId) {
        const analysis = this.queue.activeAnalyses.get(analysisId);
        if (!analysis) return;

        const stages = this.queue.analysisStages[analysis.analysisType];
        let currentStage = 0;

        const progressStage = () => {
            if (currentStage >= stages.length || analysis.status !== 'analyzing') return;

            const stage = stages[currentStage];
            const progressPerStage = 100 / stages.length;
            const targetProgress = Math.round((currentStage + 1) * progressPerStage);

            analysis.stageStartTime = Date.now();
            analysis.stageStartProgress = currentStage * progressPerStage;

            this.queue.updateAnalysis(analysisId, {
                currentStage,
                message: stage.text.replace('@profile', `@${analysis.username}`),
                estimatedTimeRemaining: this.queue.calculateStageTimeRemaining(analysis, currentStage)
            });

            this.queue.updateAnalysis(analysisId, {
                progress: targetProgress
            });

            currentStage++;
            if (currentStage < stages.length) {
                setTimeout(progressStage, stage.duration);
            }
        };

        setTimeout(() => {
            this.queue.updateAnalysis(analysisId, { status: 'analyzing' });
            progressStage();
        }, 500);
    }

    // ===============================================================================
    // CELEBRATION EFFECTS
    // ===============================================================================

    triggerCelebration(analysisId, result = null) {
        const element = document.getElementById(`queue-item-${analysisId}`);
        if (!element) return;

        element.classList.add('celebrating');

        if (result && result.overall_score >= 80) {
            this.createConfettiEffect(element);
        }

        if (this.queue.soundEnabled) {
            this.playSuccessSound();
        }

        setTimeout(() => {
            element.classList.remove('celebrating');
        }, 600);

        console.log('🎉 [AnalysisQueueAnimator] Celebration triggered for analysis:', analysisId);
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

                setTimeout(() => confetti.remove(), 1500);
            }, i * 50);
        }

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
            console.warn('[AnalysisQueueAnimator] Sound playback failed:', error);
        }
    }

    // ===============================================================================
    // CLEANUP
    // ===============================================================================

    cleanup() {
        this.progressAnimators.forEach((rafId) => {
            cancelAnimationFrame(rafId);
        });
        this.progressAnimators.clear();
        this.lastProgressEvent.clear();

        const confettiStyles = document.getElementById('confetti-animation');
        if (confettiStyles) {
            confettiStyles.remove();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisQueueAnimator;
} else {
    window.AnalysisQueueAnimator = AnalysisQueueAnimator;
}

console.log('✅ [AnalysisQueueAnimator] Module loaded');
