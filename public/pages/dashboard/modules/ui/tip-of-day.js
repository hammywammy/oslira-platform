/**
 * TIP OF THE DAY - Subtle daily wisdom component
 */

class TipOfDay {
    constructor(container) {
        this.container = container;
    }

    /**
     * Render tip of the day HTML
     */
    renderTip() {
        const tip = this.getDailyTip();
        
        return `
<!-- Tip of the Day - Subtle & Helpful -->
<div class="px-6 pb-6">
    <div class="glass-white rounded-2xl p-5 border-l-4 border-indigo-400">
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-indigo-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-700 font-light leading-relaxed">
                    <span class="font-medium text-gray-800">Tip of the day:</span> ${tip}
                </p>
            </div>
        </div>
    </div>
</div>`;
    }

    /**
     * Get today's tip using day-of-year rotation
     */
    getDailyTip() {
        if (!window.DAILY_TIPS || !window.DAILY_TIPS.length) {
            return "Stay focused on your goals and keep pushing forward. 💪";
        }

        // Calculate day of year
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        // Rotate through tips array
        const tips = window.DAILY_TIPS;
        const index = dayOfYear % tips.length;

        return tips[index];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TipOfDay;
} else {
    window.TipOfDay = TipOfDay;
}
