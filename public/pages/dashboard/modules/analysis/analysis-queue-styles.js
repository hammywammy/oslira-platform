// public/pages/dashboard/modules/analysis/analysis-queue-styles.js

/**
 * ANALYSIS QUEUE STYLES MODULE
 * Injects all CSS styles for the collapsible analysis queue
 */
class AnalysisQueueStyles {
    static inject() {
        if (document.getElementById('enhanced-queue-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'enhanced-queue-styles';
        styles.textContent = `
            /* ===================================================================
               QUEUE WRAPPER - COLLAPSIBLE CONTAINER
               =================================================================== */
            .queue-wrapper {
                position: fixed;
                top: 50%;
                right: 0;
                transform: translateY(-50%);
                z-index: 40;
                display: flex;
                align-items: center;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Toggle Button (Always Visible) */
            .queue-toggle-btn {
                width: 32px;
                height: 64px;
                background: linear-gradient(135deg, #9333ea 0%, #7e22ce 50%, #6b21a8 100%);
                border-radius: 8px 0 0 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: -2px 0 8px rgba(147, 51, 234, 0.3);
                transition: all 0.3s ease;
                position: relative;
                z-index: 41;
            }

            .queue-toggle-btn:hover {
                background: linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%);
                box-shadow: -4px 0 12px rgba(147, 51, 234, 0.5);
            }

            .queue-toggle-btn:active {
                transform: scale(0.95);
            }

            /* Queue Container */
            .queue-container {
                width: 360px;
                max-height: 580px;
                background: white;
                border-radius: 12px 0 0 12px;
                box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: translateX(0);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Collapsed State - Move completely off screen */
            .queue-wrapper.collapsed .queue-container {
                transform: translateX(calc(360px + 32px));
            }

            /* Purple Wave Gradient Header */
            .queue-header-gradient {
                background: linear-gradient(135deg, #9333ea 0%, #7e22ce 50%, #6b21a8 100%);
                position: relative;
                overflow: hidden;
            }

            .wave-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: 
                    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
                animation: waveFloat 8s ease-in-out infinite;
            }

            @keyframes waveFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }

            /* Queue Items Scroll Area */
            .queue-items-scroll {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
            }

            .queue-items-scroll::-webkit-scrollbar {
                width: 6px;
            }

            .queue-items-scroll::-webkit-scrollbar-track {
                background: #f1f5f9;
            }

            .queue-items-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }

            .queue-items-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }

            /* ===================================================================
               QUEUE ITEM ANIMATIONS
               =================================================================== */
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

            /* Ensure queue is below modals */
            .queue-wrapper {
                z-index: 40 !important;
            }

            /* Glow effect on toggle button when active */
            .queue-wrapper:not(.collapsed) .queue-toggle-btn {
                box-shadow: -2px 0 12px rgba(147, 51, 234, 0.5), 
                            0 0 20px rgba(147, 51, 234, 0.3);
                animation: toggleGlow 2s ease-in-out infinite;
            }

            @keyframes toggleGlow {
                0%, 100% {
                    box-shadow: -2px 0 12px rgba(147, 51, 234, 0.5), 
                                0 0 20px rgba(147, 51, 234, 0.3);
                }
                50% {
                    box-shadow: -2px 0 16px rgba(147, 51, 234, 0.6), 
                                0 0 24px rgba(147, 51, 234, 0.4);
                }
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
