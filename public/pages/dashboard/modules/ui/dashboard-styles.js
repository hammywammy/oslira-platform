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

    
    /* Ensure priority cards don't interfere */
    .hover-lift {
        position: relative;
        z-index: 1;
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
</style>`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardStyles;
} else {
    window.DashboardStyles = DashboardStyles;
}
