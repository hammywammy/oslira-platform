class TipOfDay {
    constructor(container) {
        this.container = container;
        this.currentIndex = 0;
        this.dailyTips = this.getThreeDailyTips();
    }

    /**
     * Render carousel with navigation
     */
renderTip() {
    const tips = this.dailyTips;
    
    return `
<!-- Tip of the Day Carousel - Redesigned -->
<div class="px-6 pb-6">
    <div class="relative bg-gradient-to-br from-indigo-50/50 via-blue-50/30 to-purple-50/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-100/50">
        <!-- Tip Content -->
        <div class="flex items-start space-x-4 mb-4">
            <div class="flex-shrink-0 mt-1">
                <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
            </div>
            
            <!-- Text Content with Better Typography -->
            <div class="flex-1 min-h-[4rem]">
                <div id="tip-carousel-content" class="transition-opacity duration-300">
                    <p class="text-base leading-relaxed text-gray-700">
                        <span class="font-semibold text-indigo-600">Tip of the day:</span> 
                        <span id="tip-text" class="font-normal">${tips[0]}</span>
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Navigation Controls - Bottom Center -->
        <div class="flex items-center justify-center space-x-3 pt-2 border-t border-indigo-100/50">
            <!-- Previous Button -->
            <button 
                onclick="window.tipOfDay.prevTip()" 
                class="p-2 rounded-lg hover:bg-indigo-100/50 transition-colors group"
                aria-label="Previous tip"
            >
                <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>
            
            <!-- Dot Indicators -->
            <div class="flex items-center space-x-2 px-4">
                ${tips.map((_, i) => `
                    <button 
                        onclick="window.tipOfDay.goToTip(${i})"
                        class="tip-dot ${i === 0 ? 'tip-dot-active' : ''} transition-all duration-300"
                        data-tip-index="${i}"
                        aria-label="Go to tip ${i + 1}"
                    ></button>
                `).join('')}
            </div>
            
            <!-- Next Button -->
            <button 
                onclick="window.tipOfDay.nextTip()" 
                class="p-2 rounded-lg hover:bg-indigo-100/50 transition-colors group"
                aria-label="Next tip"
            >
                <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
        </div>
    </div>
</div>

<style>
/* Carousel Dot Indicators */
.tip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #cbd5e1;
    border: none;
    cursor: pointer;
    padding: 0;
}

.tip-dot-active {
    width: 24px;
    border-radius: 4px;
    background-color: #6366f1;
}

.tip-dot:hover:not(.tip-dot-active) {
    background-color: #94a3b8;
}

/* Fade transition for tip content */
.tip-fade-out {
    opacity: 0;
}

.tip-fade-in {
    opacity: 1;
}

/* Ensure text wraps properly on long tips */
#tip-text {
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
}
</style>`;
}

    /**
     * Get 3 random tips seeded by day (same 3 tips all day)
     */
    getThreeDailyTips() {
        if (!window.DAILY_TIPS || window.DAILY_TIPS.length < 3) {
            return [
                "Stay focused on your goals and keep pushing forward. 💪",
                "Consistency is the key to long-term success. 🔑",
                "Take action today, your future self will thank you. 🚀"
            ];
        }

        const tips = window.DAILY_TIPS;
        
        // Use day of year as seed for deterministic randomness
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        // Seeded random function (same results for same day)
        const seededRandom = (seed) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };
        
        // Pick 3 unique random tips using day-based seed
        const selectedTips = [];
        const usedIndices = new Set();
        
        for (let i = 0; i < 3; i++) {
            let index;
            let attempts = 0;
            do {
                index = Math.floor(seededRandom(dayOfYear * 100 + i + attempts) * tips.length);
                attempts++;
            } while (usedIndices.has(index) && attempts < 50);
            
            usedIndices.add(index);
            selectedTips.push(tips[index]);
        }
        
        return selectedTips;
    }

    /**
     * Navigate to next tip
     */
    nextTip() {
        this.currentIndex = (this.currentIndex + 1) % this.dailyTips.length;
        this.updateTipDisplay();
    }

    /**
     * Navigate to previous tip
     */
    prevTip() {
        this.currentIndex = (this.currentIndex - 1 + this.dailyTips.length) % this.dailyTips.length;
        this.updateTipDisplay();
    }

    /**
     * Go to specific tip
     */
    goToTip(index) {
        if (index >= 0 && index < this.dailyTips.length) {
            this.currentIndex = index;
            this.updateTipDisplay();
        }
    }

    /**
     * Update displayed tip with fade transition
     */
    updateTipDisplay() {
        const tipText = document.getElementById('tip-text');
        const content = document.getElementById('tip-carousel-content');
        const dots = document.querySelectorAll('.tip-dot');
        
        if (!tipText || !content) return;
        
        // Fade out
        content.classList.add('tip-fade-out');
        
        setTimeout(() => {
            // Update content
            tipText.textContent = this.dailyTips[this.currentIndex];
            
            // Update dot indicators
            dots.forEach((dot, i) => {
                if (i === this.currentIndex) {
                    dot.classList.add('tip-dot-active');
                } else {
                    dot.classList.remove('tip-dot-active');
                }
            });
            
            // Fade in
            content.classList.remove('tip-fade-out');
            content.classList.add('tip-fade-in');
            
            setTimeout(() => {
                content.classList.remove('tip-fade-in');
            }, 300);
        }, 150);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TipOfDay;
} else {
    window.TipOfDay = TipOfDay;
}
