//public/pages/dashboard/modules/ui/dashboard-styles.js

class DashboardStyles {
    static getInlineStyles() {
        return `
<style>
    /* Custom gradient background */
    .gradient-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;
    }
    
    .wave-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100px;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,60L1200,0L1200,120L0,120Z" fill="%23ffffff" fill-opacity="0.1"/></svg>') repeat-x;
        opacity: 0.3;
    }
    
    /* Glass morphism effects */
    .glass-white {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    /* Hover effects */
    .hover-lift {
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
    }
    
    .hover-lift:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    
    /* Count animations */
    .count-animation {
        animation: countUp 0.8s ease-out;
    }
    
    @keyframes countUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Score Bar */
    .score-bar {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
    }
    
    .score-fill {
        height: 100%;
        transition: width 0.5s ease;
    }
    
    .score-high .score-fill { background: #10b981; }
    .score-medium .score-fill { background: #fbbf24; }
    .score-low .score-fill { background: #ef4444; }
    
    /* Animated Wave Gradients for Score Bars */
    @keyframes scoreWave {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    .score-wave-gradient-excellent {
        background: linear-gradient(90deg, #6B21A8, #7E22CE, #9333EA, #A855F7, #7E22CE, #6B21A8);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-good-high {
        background: linear-gradient(90deg, #2563EB, #4F46E5, #7C3AED, #9333EA, #4F46E5, #2563EB);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-good-mid {
        background: linear-gradient(90deg, #2563EB, #3B82F6, #4F46E5, #6366F1, #3B82F6, #2563EB);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-good-low {
        background: linear-gradient(90deg, #1D4ED8, #2563EB, #3B82F6, #2563EB, #1D4ED8);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-moderate-high {
        background: linear-gradient(90deg, #14B8A6, #06B6D4, #0EA5E9, #3B82F6, #06B6D4, #14B8A6);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-moderate-mid {
        background: linear-gradient(90deg, #0D9488, #14B8A6, #2DD4BF, #22D3EE, #14B8A6, #0D9488);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-moderate-low {
        background: linear-gradient(90deg, #0F766E, #14B8A6, #2DD4BF, #5EEAD4, #14B8A6, #0F766E);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-fair-highest {
        background: linear-gradient(90deg, 
            #84CC16,  /* lime-500 */
            #BEF264,  /* lime-400 */
            #D9F99D,  /* lime-300 */
            #6EE7B7,  /* emerald-300 */
            #5EEAD4,  /* teal-300 */
            #2DD4BF,  /* teal-400 */
            #5EEAD4,  /* teal-300 back */
            #6EE7B7,  /* emerald-300 back */
            #BEF264,  /* lime-400 back */
            #84CC16   /* lime-500 back */
        );
        background-size: 300% 100%;
        animation: scoreWave 4s ease-in-out infinite;
    }

    .score-wave-gradient-fair-high {
        background: linear-gradient(90deg, 
            #EAB308,  /* yellow-500 */
            #FACC15,  /* yellow-400 */
            #FDE047,  /* yellow-300 */
            #BEF264,  /* lime-400 */
            #A3E635,  /* lime-500 */
            #BEF264,  /* lime-400 back */
            #FDE047,  /* yellow-300 back */
            #FACC15,  /* yellow-400 back */
            #EAB308   /* yellow-500 back */
        );
        background-size: 300% 100%;
        animation: scoreWave 4s ease-in-out infinite;
    }

    .score-wave-gradient-fair-mid {
        background: linear-gradient(90deg, 
            #F97316,  /* orange-500 */
            #FB923C,  /* orange-400 */
            #FBBF24,  /* amber-400 */
            #FCD34D,  /* yellow-300 */
            #FACC15,  /* yellow-400 */
            #FCD34D,  /* yellow-300 back */
            #FBBF24,  /* amber-400 back */
            #FB923C,  /* orange-400 back */
            #F97316   /* orange-500 back */
        );
        background-size: 300% 100%;
        animation: scoreWave 4s ease-in-out infinite;
    }

    .score-wave-gradient-fair-low {
        background: linear-gradient(90deg, 
            #EA580C,  /* orange-600 */
            #F97316,  /* orange-500 */
            #FB923C,  /* orange-400 */
            #FDBA74,  /* orange-300 */
            #FB923C,  /* orange-400 back */
            #F97316,  /* orange-500 back */
            #EA580C   /* orange-600 back */
        );
        background-size: 300% 100%;
        animation: scoreWave 4s ease-in-out infinite;
    }

    .score-wave-gradient-poor-high {
        background: linear-gradient(90deg, #B91C1C, #DC2626, #EF4444, #F97316, #DC2626, #B91C1C);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-poor-mid {
        background: linear-gradient(90deg, #991B1B, #B91C1C, #DC2626, #B91C1C, #991B1B);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }

    .score-wave-gradient-poor-low {
        background: linear-gradient(90deg, #7F1D1D, #991B1B, #B91C1C, #991B1B, #7F1D1D);
        background-size: 200% 100%;
        animation: scoreWave 3s ease-in-out infinite;
    }
</style>`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardStyles;
} else {
    window.DashboardStyles = DashboardStyles;
}
