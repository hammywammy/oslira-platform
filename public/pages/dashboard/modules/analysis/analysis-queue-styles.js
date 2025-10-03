// public/pages/dashboard/modules/analysis/analysis-queue-styles.js

/**
 * ANALYSIS QUEUE STYLES MODULE
 * Injects all CSS styles for the analysis queue
 */
class AnalysisQueueStyles {
    static inject() {
        if (document.getElementById('enhanced-queue-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'enhanced-queue-styles';
        styles.textContent = `
            /* Enhanced Analysis Queue Styles */
            .enhanced-analysis-queue {
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .enhanced-analysis-queue.show {
                transform: translateX(0) !important;
            }
            
            /* Queue Item Animations */
            .queue-item-new {
                opacity: 0;
                transform: translateX(20px);
            }
            
            .queue-item-enter {
                animation: slideInFromRight 0.3s ease-out forwards;
            }
            
            .queue-item-exit {
                animation: slideOutToRight 0.3s ease-in forwards;
            }
            
            @keyframes slideInFromRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutToRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(20px);
                }
            }
            
            @keyframes pulseGlow {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
                }
                50% {
                    box-shadow: 0 0 20px 5px rgba(59, 130, 246, 0.2);
                }
            }
            
            @keyframes celebrationBounce {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
            }
            
            @keyframes progressShimmer {
                0% {
                    background-position: -200px 0;
                }
                100% {
                    background-position: 200px 0;
                }
            }
            
            /* Progress shimmer effect */
            .progress-shimmer {
                background-image: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0) 0%,
                    rgba(255, 255, 255, 0.3) 50%,
                    rgba(255, 255, 255, 0) 100%
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
                transition: width 0.15s linear;
                will-change: width;
            }
            
            .hover-lift {
                transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
            }

            .hover-lift:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
            }

            .hover-lift.analyzing {
                pointer-events: none;
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
        console.log('✅ [AnalysisQueueStyles] Styles injected');
    }

    static cleanup() {
        const styles = document.getElementById('enhanced-queue-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisQueueStyles;
} else {
    window.AnalysisQueueStyles = AnalysisQueueStyles;
}

console.log('✅ [AnalysisQueueStyles] Module loaded');
