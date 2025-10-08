// =============================================================================
// HOME APP - Production-Ready Homepage Application
// Path: /public/pages/www/HomeApp.js
// Dependencies: HeaderManager, FooterManager (loaded by Loader.js)
// =============================================================================

/**
 * @class HomeApp
 * @description Homepage application controller
 * 
 * Responsibilities:
 * - Render header & footer components
 * - Initialize Instagram demo functionality
 * - Setup conversion optimizations (CTAs, social proof, urgency)
 * - Manage all page interactions
 * 
 * Initialization:
 * Called by Bootstrap.js after all dependencies are loaded
 */

class HomeApp {
    constructor() {
        this.initialized = false;
        this.header = null;
        this.footer = null;
        this.demoInitialized = false;
        this.socialProofInterval = null;
        
        console.log('🏠 [HomeApp] Instance created');
    }
    
    // ═══════════════════════════════════════════════════════════
    // MAIN INITIALIZATION (Called by Bootstrap)
    // ═══════════════════════════════════════════════════════════
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [HomeApp] Already initialized');
            return;
        }
        
        console.log('🚀 [HomeApp] Starting initialization...');
        
        try {
            // Step 1: Render header
            await this.initializeHeader();
            
            // Step 2: Render footer
            await this.initializeFooter();
            
            // Step 3: Setup Instagram demo
            await this.setupInstagramDemo();
            
            // Step 4: Initialize conversion optimizations
            this.initializeConversionOptimizations();
            
            // Step 5: Setup event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('✅ [HomeApp] Initialization complete');
            
        } catch (error) {
            console.error('❌ [HomeApp] Initialization failed:', error);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // HEADER INITIALIZATION
    // ═══════════════════════════════════════════════════════════
    
    async initializeHeader() {
        const headerContainer = document.getElementById('home-header-container');
        if (!headerContainer) {
            console.warn('⚠️ [HomeApp] Header container not found');
            return;
        }
        
        // Check if already rendered (shouldn't be, but defensive)
        if (headerContainer.innerHTML.trim().length > 0) {
            console.log('✅ [HomeApp] Header already rendered, skipping');
            return;
        }
        
        console.log('🎨 [HomeApp] Rendering header...');
        this.header = new window.HeaderManager();
        this.header.render('home-header-container', { type: 'home' });
        console.log('✅ [HomeApp] Header rendered');
    }
    
    // ═══════════════════════════════════════════════════════════
    // FOOTER INITIALIZATION
    // ═══════════════════════════════════════════════════════════
    
    async initializeFooter() {
        const footerContainer = document.getElementById('footer-container');
        
        if (!footerContainer) {
            console.warn('⚠️ [HomeApp] Footer container not found in DOM');
            return;
        }
        
        console.log('🦶 [HomeApp] Rendering footer...');
        this.footer = new window.FooterManager();
        this.footer.render('footer-container');
        console.log('✅ [HomeApp] Footer rendered');
    }
    
    // ═══════════════════════════════════════════════════════════
    // INSTAGRAM DEMO SETUP
    // ═══════════════════════════════════════════════════════════
    
    async setupInstagramDemo() {
        console.log('🎯 [HomeApp] Setting up Instagram demo...');
        
        // Get demo elements
        const usernameInput = document.getElementById('demo-handle-input');
        const analyzeButton = document.getElementById('demo-analyze-btn');
        const resultsContainer = document.getElementById('demo-results');
        
        if (!usernameInput || !analyzeButton || !resultsContainer) {
            console.warn('⚠️ [HomeApp] Demo elements not found, waiting for DOM...');
            
            // Wait briefly for DOM to settle
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const retryInput = document.getElementById('demo-handle-input');
            const retryButton = document.getElementById('demo-analyze-btn');
            const retryResults = document.getElementById('demo-results');
            
            if (!retryInput || !retryButton || !retryResults) {
                console.error('❌ [HomeApp] Demo elements still missing after retry');
                return;
            }
            
            this.setupDemoListeners(retryInput, retryButton, retryResults);
            this.demoInitialized = true;
            console.log('✅ [HomeApp] Instagram demo ready (after retry)');
            return;
        }
        
        this.setupDemoListeners(usernameInput, analyzeButton, resultsContainer);
        this.demoInitialized = true;
        console.log('✅ [HomeApp] Instagram demo ready');
    }
    
    setupDemoListeners(usernameInput, analyzeButton, resultsContainer) {
        // Click handler
        analyzeButton.addEventListener('click', () => this.handleDemoAnalysis());
        
        // Enter key handler
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleDemoAnalysis();
            }
        });
    }
    
    async handleDemoAnalysis() {
        const usernameInput = document.getElementById('demo-handle-input');
        const analyzeButton = document.getElementById('demo-analyze-btn');
        const resultsContainer = document.getElementById('demo-results');
        
        if (!usernameInput || !analyzeButton || !resultsContainer) {
            console.error('❌ [HomeApp] Demo elements not found');
            return;
        }
        
        const username = usernameInput.value.trim().replace('@', '');
        
        if (!username) {
            this.showDemoError('Please enter an Instagram username');
            return;
        }
        
        // Show loading state
        analyzeButton.disabled = true;
        const btnText = analyzeButton.querySelector('.demo-btn-text');
        const btnLoading = analyzeButton.querySelector('.demo-btn-loading');
        
        if (btnText) btnText.classList.add('hidden');
        if (btnLoading) btnLoading.classList.remove('hidden');
        
        try {
            // Generate demo results (mocked for now)
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
            
            const demoData = {
                username: username,
                score: Math.floor(Math.random() * 25 + 70),
                niche: 'Content Creator',
                category: 'Business',
                followers: `${(Math.random() * 50 + 5).toFixed(1)}K`,
                outreach: `Hi ${username}! Loved your recent content. I help creators like you scale their online presence...`
            };
            
            this.showDemoSuccess(demoData);
            
        } catch (error) {
            console.error('❌ [HomeApp] Demo analysis failed:', error);
            this.showDemoError('Unable to analyze profile. Please try again.');
            
        } finally {
            // Reset button state
            analyzeButton.disabled = false;
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoading) btnLoading.classList.add('hidden');
        }
    }
    
    showDemoSuccess(data) {
        const resultsContainer = document.getElementById('demo-results');
        if (!resultsContainer) return;
        
        resultsContainer.classList.remove('hidden');
        
        resultsContainer.innerHTML = `
            <div class="demo-result-card bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
                <div class="demo-profile-info flex items-center space-x-4 mb-6">
                    <div class="demo-avatar w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        ${data.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1">
                        <h4 class="demo-name text-xl font-bold text-gray-900">@${data.username}</h4>
                        <p class="demo-analysis text-gray-600">${data.niche} • ${data.category} • ${data.followers} followers</p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-blue-600">${data.score}%</div>
                        <div class="text-sm text-gray-600">Match</div>
                    </div>
                </div>
                
                <div class="demo-outreach-preview bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-4">
                    <h5 class="font-semibold text-gray-900 mb-2">Suggested Outreach:</h5>
                    <p class="demo-message text-gray-700 italic">"${data.outreach}"</p>
                </div>
                
                <p class="demo-upgrade-hint text-center text-sm text-gray-600 mb-4">
                    ↑ See full analysis & 24 more leads like this with your free trial
                </p>
                
                <a href="${window.OsliraEnv?.getAuthUrl() || '/auth'}" class="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-all duration-200 shadow-lg hover:shadow-xl">
                    Get Full Analysis Report →
                </a>
            </div>
        `;
        
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    showDemoError(message) {
        const resultsContainer = document.getElementById('demo-results');
        if (!resultsContainer) return;
        
        resultsContainer.classList.remove('hidden');
        
        resultsContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 animate-fadeIn">
                <div class="flex items-start space-x-3">
                    <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                        <h4 class="font-semibold text-red-900 mb-1">Analysis Error</h4>
                        <p class="text-red-700 text-sm">${message}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ═══════════════════════════════════════════════════════════
    // CONVERSION OPTIMIZATIONS
    // ═══════════════════════════════════════════════════════════
    
    initializeConversionOptimizations() {
        console.log('🎯 [HomeApp] Initializing conversion optimizations...');
        
        this.setupCTAOptimizations();
        this.setupSocialProofNotifications();
        this.setupUrgencyElements();
        
        console.log('✅ [HomeApp] Conversion optimizations ready');
    }
    
    setupCTAOptimizations() {
        const ctaButtons = document.querySelectorAll('.btn-primary-hero, .primary-cta-main, .cta-button-large, .mobile-cta-btn');
        
        ctaButtons.forEach(button => {
            // Hover effects
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) scale(1)';
            });
            
            // Click tracking (if tracking available)
            button.addEventListener('click', () => {
                console.log('🎯 [HomeApp] CTA clicked:', button.textContent.trim());
            });
        });
    }
    
    setupSocialProofNotifications() {
        const notifications = [
            { name: 'Sarah M.', location: 'New York', action: 'signed up', time: '2 minutes ago' },
            { name: 'Mike T.', location: 'Los Angeles', action: 'started trial', time: '5 minutes ago' },
            { name: 'Alex P.', location: 'Chicago', action: 'analyzed a lead', time: '8 minutes ago' },
            { name: 'Jordan K.', location: 'Miami', action: 'signed up', time: '12 minutes ago' }
        ];
        
        let currentIndex = 0;
        
        const showNotification = () => {
            const container = document.getElementById('social-proof-notifications');
            if (!container) return;
            
            const notification = notifications[currentIndex];
            
            const notificationEl = document.createElement('div');
            notificationEl.className = 'social-proof-notification animate-slide-in';
            notificationEl.innerHTML = `
                <div class="notification-content">
                    <div class="notification-avatar">${notification.name.charAt(0)}</div>
                    <div class="notification-text">
                        <strong>${notification.name}</strong> from ${notification.location} ${notification.action}
                        <span class="notification-time">${notification.time}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(notificationEl);
            
            // Remove after 5 seconds
            setTimeout(() => {
                notificationEl.classList.add('animate-slide-out');
                setTimeout(() => notificationEl.remove(), 500);
            }, 5000);
            
            currentIndex = (currentIndex + 1) % notifications.length;
        };
        
        // Show first notification after 3 seconds
        setTimeout(showNotification, 3000);
        
        // Show subsequent notifications every 15 seconds
        this.socialProofInterval = setInterval(showNotification, 15000);
    }
    
    setupUrgencyElements() {
        // Urgency banner close handler is in inline script
        // This is just for additional urgency-related functionality
        console.log('⏰ [HomeApp] Urgency elements initialized');
    }
    
    // ═══════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════
    
    setupEventListeners() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        console.log('🎧 [HomeApp] Event listeners setup complete');
    }
    
    // ═══════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════
    
    destroy() {
        if (this.socialProofInterval) {
            clearInterval(this.socialProofInterval);
        }
        
        this.initialized = false;
        console.log('🧹 [HomeApp] Cleanup complete');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.HomeApp = HomeApp;
console.log('✅ [HomeApp] Class loaded and ready for Bootstrap initialization');
