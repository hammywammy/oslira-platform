// public/pages/dashboard/modules/analysis/analysis-queue-animator.js

/**
 * ANALYSIS QUEUE ANIMATOR MODULE (ULTRA-SMOOTH VERSION)
 * Handles all progress animations with continuous, predictive motion
 */
class AnalysisQueueAnimator {
    constructor(queue) {
        this.queue = queue;
        this.progressAnimators = new Map();
        this.lastProgressEvent = new Map();
    }

    // ===============================================================================
    // SMOOTH PROGRESS ANIMATION
    // ===============================================================================

    startProgressAnimator(analysisId) {
        const analysis = this.queue.activeAnalyses.get(analysisId);
        if (!analysis) return;

        // Initialize progress state
        if (analysis.visualProgress === undefined) analysis.visualProgress = 0;
        if (analysis.targetProgress === undefined) analysis.targetProgress = 0;

        // Timing trackers
        analysis.stageStartTime = Date.now();
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
            const deltaTime = (now - lastFrameTime) / 1000; // seconds
            lastFrameTime = now;

            // Get stage info
            const currentStage = currentAnalysis.currentStage || 0;
            const stages = this.queue.analysisStages[currentAnalysis.analysisType];
            const stage = stages?.[currentStage];

            if (!stage) {
                // Fallback to simple interpolation
                this.simpleProgressAnimation(currentAnalysis, analysisId, deltaTime);
                const rafId = requestAnimationFrame(animate);
                this.progressAnimators.set(analysisId, rafId);
                return;
            }

            // ===================================================================
            // SMOOTH PREDICTIVE PROGRESS CALCULATION
            // ===================================================================

            const stageElapsed = now - (currentAnalysis.stageStartTime || now);
            const stageDuration = stage.duration;
            const progressPerStage = 100 / stages.length;
            const stageBaseProgress = currentStage * progressPerStage;

            // Time-based expected progress (linear within stage)
            const timeRatio = Math.min(stageElapsed / stageDuration, 1);
            const timeBasedProgress = stageBaseProgress + (timeRatio * progressPerStage);

            // Backend target (what server says we should be at)
            const backendTarget = currentAnalysis.targetProgress || 0;
            const timeSinceBackendUpdate = now - (currentAnalysis.lastBackendUpdate || now);

            // Current visual position
            const currentVisual = currentAnalysis.visualProgress || 0;

            // ===================================================================
            // INTELLIGENT TARGET SELECTION
            // ===================================================================

            let targetProgress;

            if (timeSinceBackendUpdate < 2000) {
                // Recent backend update - blend time-based with backend
                const blendFactor = Math.min(timeSinceBackendUpdate / 2000, 1);
                targetProgress = backendTarget * (1 - blendFactor) + timeBasedProgress * blendFactor;
            } else {
                // No recent backend - use time prediction but cap growth
                const maxLeadAllowed = 5; // Don't get more than 5% ahead of backend
                const currentLead = currentVisual - backendTarget;

                if (currentLead > maxLeadAllowed) {
                    // Too far ahead - slow crawl only
                    targetProgress = currentVisual + 0.1;
                } else {
                    // Normal prediction with damping
                    const dampingFactor = Math.max(0, 1 - (currentLead / maxLeadAllowed));
                    targetProgress = backendTarget + (timeBasedProgress - backendTarget) * dampingFactor;
                }
            }

            // Never go backward
            targetProgress = Math.max(targetProgress, currentVisual);

            // Hard caps
            if (backendTarget < 95) {
                targetProgress = Math.min(targetProgress, 97);
            } else if (backendTarget < 98) {
                targetProgress = Math.min(targetProgress, 98);
            } else if (backendTarget < 100) {
                targetProgress = Math.min(targetProgress, 99);
            }

            // ===================================================================
            // SMOOTH INTERPOLATION WITH VELOCITY-BASED EASING
            // ===================================================================

            const diff = targetProgress - currentVisual;

            // Dynamic speed based on distance and time
            let speed;
            if (diff > 10) {
                speed = 0.15; // Fast when very far
            } else if (diff > 5) {
                speed = 0.08; // Medium-fast
            } else if (diff > 1) {
                speed = 0.04; // Medium
            } else if (diff > 0.3) {
                speed = 0.02; // Slow approach
            } else {
                speed = 0.01; // Gentle creep
            }

            // Calculate movement (frame-rate independent)
            let movement = diff * speed;

            // Add minimum forward motion to prevent stalling
            const minSpeed = 0.015 * deltaTime * 60; // ~0.9% per second minimum
            if (diff > 0 && movement < minSpeed && targetProgress < 97) {
                movement = Math.max(movement, minSpeed);
            }

            // Apply movement
            let newVisualProgress = currentVisual + movement;

            // Ensure monotonic increase
            newVisualProgress = Math.max(newVisualProgress, currentVisual);
            currentAnalysis.maxReachedProgress = Math.max(
                currentAnalysis.maxReachedProgress || 0,
                newVisualProgress
            );

            currentAnalysis.visualProgress = newVisualProgress;

            // Update DOM (direct manipulation, no re-render)
            this.updateProgressBarDOM(analysisId, currentAnalysis.visualProgress);

            // Continue animation loop
            const rafId = requestAnimationFrame(animate);
            this.progressAnimators.set(analysisId, rafId);
        };

        // Start animation
        const rafId = requestAnimationFrame(animate);
        this.progressAnimators.set(analysisId, rafId);

        console.log(`🎬 [ProgressAnimator] Started smooth progress for ${analysisId}`);
    }

    simpleProgressAnimation(analysis, analysisId, deltaTime) {
        const target = Math.min(analysis.targetProgress || 0, 97);
        const current = analysis.visualProgress || 0;
        const diff = target - current;

        if (diff > 0.1) {
            const speed = diff > 5 ? 0.08 : 0.04;
            analysis.visualProgress = Math.min(current + (diff * speed), 97);
        } else if (diff > 0) {
            analysis.visualProgress = current + (0.015 * deltaTime * 60);
        }

        this.updateProgressBarDOM(analysisId, analysis.visualProgress);
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
    // STAGE-BASED PROGRESS (IMPROVED)
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
            
            // Set target for THIS stage (animator will smoothly approach it)
            const targetProgress = Math.round((currentStage + 1) * progressPerStage);

            // Update timing for predictive animation
            analysis.stageStartTime = Date.now();
            analysis.stageStartProgress = currentStage * progressPerStage;

            // Update stage info (message, etc) WITHOUT changing progress
            this.queue.updateAnalysis(analysisId, {
                currentStage,
                message: stage.text.replace('@profile', `@${analysis.username}`),
                estimatedTimeRemaining: this.queue.calculateStageTimeRemaining(analysis, currentStage)
            });

            // Set target progress (animator interpolates smoothly)
            this.queue.updateAnalysis(analysisId, {
                progress: targetProgress
            });

            // Move to next stage
            currentStage++;
            if (currentStage < stages.length) {
                setTimeout(progressStage, stage.duration);
            }
        };

        // Start first stage
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
