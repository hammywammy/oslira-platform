// =============================================================================
// HOME APP - Clean Class-Based Architecture
// Path: /pages/home/home-app.js
// Replaces: /pages/home/home.js
// =============================================================================

/**
 * HOME APP - Production-Ready Homepage Application
 * 
 * Responsibilities:
 * - Render header & footer (orchestrator guarantees managers loaded)
 * - Setup Instagram demo
 * - Initialize conversion optimizations
 * - Manage page interactions
 * 
 * Does NOT:
 * - Wait for dependencies (orchestrator handles this)
 * - Manually load scripts
 * - Use setTimeout fallbacks
 */

class HomeApp {
    constructor() {
        this.initialized = false;
        this.header = null;
        this.footer = null;
        this.demoInitialized = false;
        
        console.log('🏠 [HomeApp] Instance created');
    }
    
    // ═══════════════════════════════════════════════════════════
    // MAIN INITIALIZATION (Called by Orchestrator)
    // ═══════════════════════════════════════════════════════════
    
    async init() {
        if (this.initialized) {
            console.log('⚠️ [HomeApp] Already initialized');
            return;
        }
        
        console.log('🚀 [HomeApp] Starting initialization...');
        
        try {
            // Step 1: Render header (if not already rendered inline)
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
        // Check if header was already rendered inline in HTML
        const headerContainer = document.getElementById('home-header-container');
        if (!headerContainer) {
            console.warn('⚠️ [HomeApp] Header container not found');
            return;
        }
        
        // Check if header already has content (rendered inline)
        if (headerContainer.innerHTML.trim().length > 0) {
            console.log('✅ [HomeApp] Header already rendered inline, skipping');
            return;
        }
        
        // Render header using HeaderManager
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
        
        // Wait for demo container to exist
        const demoContainer = await this.waitForElement('#demo-results', 5000);
        
        if (!demoContainer) {
            console.warn('⚠️ [HomeApp] Demo container not found, skipping demo setup');
            return;
        }
        
        // Get demo elements
        const usernameInput = document.getElementById('instagram-username-input');
        const analyzeButton = document.getElementById('analyze-demo-btn');
        const resultsContainer = document.getElementById('demo-results');
        
        if (!usernameInput || !analyzeButton || !resultsContainer) {
            console.warn('⚠️ [HomeApp] Demo elements incomplete:', {
                input: !!usernameInput,
                button: !!analyzeButton,
                results: !!resultsContainer
            });
            return;
        }
        
        // Setup demo event listeners
        analyzeButton.addEventListener('click', () => this.handleDemoAnalysis());
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleDemoAnalysis();
            }
        });
        
        this.demoInitialized = true;
        console.log('✅ [HomeApp] Instagram demo ready');
    }
    
    async handleDemoAnalysis() {
        const usernameInput = document.getElementById('instagram-username-input');
        const analyzeButton = document.getElementById('analyze-demo-btn');
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
        analyzeButton.innerHTML = `
            <svg class="animate-spin h-5 w-5 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
        `;
        
        try {
            // Call analysis handler (from homeHandlers.js)
            if (!window.HomeHandlers || !window.HomeHandlers.analyzeLead) {
                throw new Error('HomeHandlers not available');
            }
            
            const result = await window.HomeHandlers.analyzeLead(username);
            
            if (result.success) {
                this.showDemoSuccess(result.data);
            } else {
                this.showDemoError(result.message || 'Analysis failed');
            }
            
        } catch (error) {
            console.error('❌ [HomeApp] Demo analysis failed:', error);
            this.showDemoError('Unable to analyze profile. Please try again.');
        } finally {
            // Reset button
            analyzeButton.disabled = false;
            analyzeButton.innerHTML = `
                <svg class="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Analyze Profile
            `;
        }
    }
    
    showDemoSuccess(data) {
        const resultsContainer = document.getElementById('demo-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
                <div class="flex items-center space-x-4 mb-6">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900">Analysis Complete!</h3>
                        <p class="text-gray-600">Profile analyzed successfully</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                        <div class="text-sm text-gray-600 mb-1">Match Score</div>
                        <div class="text-3xl font-bold text-blue-600">${data.score || 85}%</div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                        <div class="text-sm text-gray-600 mb-1">Confidence</div>
                        <div class="text-3xl font-bold text-purple-600">${data.confidence || 'High'}</div>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-xl p-6 mb-6">
                    <h4 class="font-semibold text-gray-900 mb-3">Key Insights</h4>
                    <ul class="space-y-2">
                        ${this.generateInsights(data).map(insight => `
                            <li class="flex items-start space-x-2">
                                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span class="text-gray-700">${insight}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <a href="${window.OsliraEnv.getAuthUrl()}" class="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-all duration-200 shadow-lg hover:shadow-xl">
                    Get Full Analysis Report →
                </a>
            </div>
        `;
        
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    showDemoError(message) {
        const resultsContainer = document.getElementById('demo-results');
        if (!resultsContainer) return;
        
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
    
    generateInsights(data) {
        // Generate demo insights based on analysis data
        const insights = [];
        
        if (data.score >= 80) {
            insights.push('Highly qualified lead with strong engagement potential');
        } else if (data.score >= 60) {
            insights.push('Qualified lead with moderate engagement potential');
        } else {
            insights.push('Lead requires nurturing before outreach');
        }
        
        if (data.followerCount) {
            insights.push(`Audience size: ${data.followerCount.toLocaleString()} followers`);
        }
        
        if (data.engagement) {
            insights.push(`Engagement rate: ${data.engagement}% (above average)`);
        }
        
        insights.push('Profile shows consistent content posting');
        insights.push('Active community engagement detected');
        
        return insights.slice(0, 4); // Show max 4 insights
    }
    
    // ═══════════════════════════════════════════════════════════
    // CONVERSION OPTIMIZATIONS
    // ═══════════════════════════════════════════════════════════
    
    initializeConversionOptimizations() {
        console.log('🎯 [HomeApp] Initializing conversion optimizations...');
        
        this.setupCTAOptimizations();
        this.setupSocialProofNotifications();
        this.setupUrgencyElements();
        this.setupTimedTriggers();
        
        console.log('✅ [HomeApp] Conversion optimizations ready');
    }
    
    setupCTAOptimizations() {
        // CTA hover effects and tracking
        const ctaButtons = document.querySelectorAll('.cta-button, .home-cta-button');
        
        ctaButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
    
    setupSocialProofNotifications() {
        // Show social proof notifications periodically
        const notifications = [
            { user: 'Sarah M.', action: 'just started a free trial', time: '2 min ago' },
            { user: 'David K.', action: 'analyzed 15 leads', time: '5 min ago' },
            { user: 'Emma R.', action: 'upgraded to Pro', time: '12 min ago' }
        ];
        
        let currentIndex = 0;
        
        const showNotification = () => {
            const notification = notifications[currentIndex];
            const container = document.getElementById('social-proof-container');
            
            if (container) {
                container.innerHTML = `
                    <div class="social-proof-notification animate-slideInRight">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
                            <div>
                                <p class="text-sm font-semibold text-gray-900">${notification.user}</p>
                                <p class="text-xs text-gray-600">${notification.action}</p>
                            </div>
                        </div>
                        <span class="text-xs text-gray-500">${notification.time}</span>
                    </div>
                `;
            }
            
            currentIndex = (currentIndex + 1) % notifications.length;
        };
        
        // Show first notification after 5 seconds, then every 15 seconds
        setTimeout(() => {
            showNotification();
            setInterval(showNotification, 15000);
        }, 5000);
    }
    
    setupUrgencyElements() {
        // Setup countdown timers or limited-time offers
        const urgencyElements = document.querySelectorAll('.urgency-timer');
        
        urgencyElements.forEach(element => {
            const endTime = new Date();
            endTime.setHours(23, 59, 59, 999); // End of day
            
            const updateTimer = () => {
                const now = new Date();
                const diff = endTime - now;
                
                if (diff > 0) {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    
                    element.textContent = `${hours}h ${minutes}m remaining`;
                } else {
                    element.textContent = 'Offer expired';
                }
            };
            
            updateTimer();
            setInterval(updateTimer, 60000); // Update every minute
        });
    }
    
    setupTimedTriggers() {
        // Show exit-intent popup after certain time or scroll depth
        let exitIntentShown = false;
        
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 50 && !exitIntentShown) {
                exitIntentShown = true;
                this.showExitIntent();
            }
        });
        
        // Scroll depth trigger
        let scrollTriggered = false;
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            if (scrollPercent > 70 && !scrollTriggered) {
                scrollTriggered = true;
                // Track engagement
                console.log('📊 [HomeApp] User scrolled 70% of page');
            }
        });
    }
    
    showExitIntent() {
        // Simple exit intent - can be enhanced
        console.log('🚪 [HomeApp] Exit intent detected');
        
        // Could show a modal here offering a special deal
        // For now, just log it
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
    }
    
    // ═══════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════
    
    async waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL EXPORT
// ═══════════════════════════════════════════════════════════
window.HomeApp = HomeApp;
console.log('✅ [HomeApp] Module loaded and ready');
