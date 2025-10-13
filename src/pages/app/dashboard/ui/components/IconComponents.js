// public/pages/dashboard/modules/ui/icon-components.js
// ===============================================================================
// CUSTOM GRADIENT ICON COMPONENTS
// High-quality SVG icons with gradients for dashboard stats
// ===============================================================================

class IconComponents {
    static getAnalysisQueueIcon() {
        return `
<svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <style>
        .spinner_qM83{animation:spinner_8HQG 1.05s infinite}
        .spinner_oXPr{animation-delay:.1s}
        .spinner_ZTLf{animation-delay:.2s}
        @keyframes spinner_8HQG{0%,57.14%{animation-timing-function:cubic-bezier(0.33,.66,.66,1);transform:translate(0)}28.57%{animation-timing-function:cubic-bezier(0.33,0,.66,.33);transform:translateY(-6px)}100%{transform:translate(0)}}
    </style>
    <circle class="spinner_qM83" cx="4" cy="12" r="3" fill="#A855F7"/>
    <circle class="spinner_qM83 spinner_oXPr" cx="12" cy="12" r="3" fill="#9333EA"/>
    <circle class="spinner_qM83 spinner_ZTLf" cx="20" cy="12" r="3" fill="#7E22CE"/>
</svg>
        `;
    }

    static getDiscoveriesIcon() {
        return `
<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="discGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#059669;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="discShine">
            <stop offset="0%" style="stop-color:#ECFDF5;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#10B981;stop-opacity:0" />
        </radialGradient>
    </defs>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
          fill="url(#discGrad)" stroke="#047857" stroke-width="0.5"/>
    <path d="M12 4.5L14.5 9.5L20 10.3L16 14.2L17 19.8L12 17.1L7 19.8L8 14.2L4 10.3L9.5 9.5L12 4.5Z" 
          fill="url(#discShine)" opacity="0.5"/>
    <circle cx="12" cy="7" r="1.2" fill="white" opacity="0.95"/>
    <circle cx="16" cy="11" r="0.8" fill="white" opacity="0.85"/>
    <circle cx="8" cy="15" r="0.7" fill="white" opacity="0.8"/>
</svg>
        `;
    }

    static getSavedListsIcon() {
        return `
<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="listGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#2563EB;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="listShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#EFF6FF;stop-opacity:0.7" />
            <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:0" />
        </linearGradient>
    </defs>
    <path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V7Z" 
          fill="url(#listGrad)" stroke="#1E40AF" stroke-width="0.5"/>
    <rect x="4" y="8" width="16" height="8" rx="1" fill="url(#listShine)" opacity="0.4"/>
    <line x1="7" y1="11" x2="17" y2="11" stroke="#DBEAFE" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="7" y1="14" x2="14" y2="14" stroke="#DBEAFE" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="18" cy="8" r="1" fill="#FDE047" opacity="0.9"/>
</svg>
        `;
    }

    static getCreditsIcon() {
        return `
<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#818CF8;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#6366F1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4F46E5;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cardShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#EEF2FF;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#818CF8;stop-opacity:0" />
        </linearGradient>
    </defs>
    <rect x="2" y="6" width="20" height="12" rx="2" fill="url(#cardGrad)" stroke="#4F46E5" stroke-width="0.5"/>
    <rect x="3" y="7" width="18" height="4" rx="1" fill="url(#cardShine)" opacity="0.4"/>
    <line x1="2" y1="11" x2="22" y2="11" stroke="#312E81" stroke-width="1.5"/>
    <rect x="5" y="14" width="3" height="2" rx="0.5" fill="#C7D2FE"/>
    <rect x="9" y="14" width="3" height="2" rx="0.5" fill="#C7D2FE"/>
    <circle cx="19" cy="15" r="1.5" fill="#FDE047" opacity="0.9"/>
</svg>
        `;
    }

    static getSearchIcon() {
        return `
<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#C084FC;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#A855F7;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#9333EA;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="glassShine">
            <stop offset="0%" style="stop-color:#FAF5FF;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#C084FC;stop-opacity:0" />
        </radialGradient>
    </defs>
    <circle cx="10" cy="10" r="6" fill="none" stroke="url(#searchGrad)" stroke-width="2"/>
    <circle cx="10" cy="10" r="5" fill="url(#glassShine)" opacity="0.3"/>
    <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="url(#searchGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="8" cy="8" r="1.5" fill="white" opacity="0.9"/>
    <path d="M14.5 14.5 L20 20" stroke="#F5D0FE" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
</svg>
        `;
    }

    static getBarChartIcon() {
        return `
<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="barGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style="stop-color:#FB923C;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#F97316;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style="stop-color:#FDBA74;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FB923C;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="barGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style="stop-color:#FED7AA;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FDBA74;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect x="3" y="12" width="4" height="9" rx="1" fill="url(#barGrad3)" stroke="#EA580C" stroke-width="0.5"/>
    <rect x="10" y="6" width="4" height="15" rx="1" fill="url(#barGrad1)" stroke="#C2410C" stroke-width="0.5"/>
    <rect x="17" y="9" width="4" height="12" rx="1" fill="url(#barGrad2)" stroke="#EA580C" stroke-width="0.5"/>
    <circle cx="5" cy="10" r="1" fill="#FEF3C7" opacity="0.9"/>
    <circle cx="12" cy="4" r="1" fill="#FEF3C7" opacity="0.9"/>
    <circle cx="19" cy="7" r="1" fill="#FEF3C7" opacity="0.9"/>
</svg>
        `;
    }

    static getPremiumStarIcon() {
        return `
<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FCD34D;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#F59E0B;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#D97706;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="starShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#FFFBEB;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#FCD34D;stop-opacity:0" />
        </linearGradient>
    </defs>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
          fill="url(#starGrad)" stroke="#D97706" stroke-width="0.5"/>
    <path d="M12 4.5L14.5 9.5L20 10.3L16 14.2L17 19.8L12 17.1L7 19.8L8 14.2L4 10.3L9.5 9.5L12 4.5Z" 
          fill="url(#starShine)" opacity="0.6"/>
    <circle cx="12" cy="7" r="1" fill="white" opacity="0.9"/>
    <circle cx="16" cy="11" r="0.7" fill="white" opacity="0.8"/>
</svg>
        `;
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconComponents;
} else {
    window.IconComponents = IconComponents;
}
