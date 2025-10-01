// =============================================================================
// HEADER MANAGER - MODULAR NAVIGATION HEADER SYSTEM
// =============================================================================

class HeaderManager {
    constructor() {
        this.currentConfig = {
            companyName: 'Oslira',
            logoUrl: '/assets/images/oslira-logo.png',
            homeUrl: '/',
            loginUrl: '/auth',
            type: 'home' // 'home' or 'footer-pages'
        };
        this.initialized = false;
    }
    
    // =============================================================================
    // MAIN RENDER METHOD
    // =============================================================================
    
    render(containerId, options = {}) {
        try {
            console.log('🧭 [HeaderManager] Starting header render...');
            
            // Update configuration
            this.currentConfig = { ...this.currentConfig, ...options };
            
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container element #${containerId} not found`);
            }
            
            // Generate header HTML based on type
            const headerHTML = this.getHeaderHTML();
            container.innerHTML = headerHTML;
            
            // Initialize functionality
            this.initializeHeaderFunctionality();
            
            console.log('✅ [HeaderManager] Header rendered successfully');
            
        } catch (error) {
            console.error('❌ [HeaderManager] Failed to render header:', error);
        }
    }
    
    // =============================================================================
    // HEADER HTML TEMPLATES
    // =============================================================================
    
    getHeaderHTML() {
        if (this.currentConfig.type === 'footer-pages') {
            return this.getFooterPagesHeaderHTML();
        } else {
            return this.getHomeHeaderHTML();
        }
    }
    
    getHomeHeaderHTML() {
        return `
            <!-- Sticky Header with CTA -->
            <nav class="home-nav sticky-nav">
                <div class="home-nav-container">
                    <a href="${this.currentConfig.homeUrl}" class="home-logo">
                        <img src="${this.currentConfig.logoUrl}" alt="Oslira Logo" class="home-logo-image">
                        <span>${this.currentConfig.companyName}</span>
                    </a>
                    
                    <div class="home-nav-menu">
                        <a href="#benefits" class="home-nav-link">Benefits</a>
                        <a href="#how-it-works" class="home-nav-link">How it Works</a>
                        <a href="#social-proof" class="home-nav-link">Success Stories</a>
                        <a href="${this.currentConfig.loginUrl}" class="home-nav-link login-btn">Login</a>
                    </div>
                    
                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-button" class="md:hidden p-2 rounded-lg hover:bg-gray-100">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Mobile Menu -->
                <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
                    <div class="px-6 py-4 space-y-3">
                        <a href="#benefits" class="block text-gray-600 hover:text-blue-600 py-2">Benefits</a>
                        <a href="#how-it-works" class="block text-gray-600 hover:text-blue-600 py-2">How it Works</a>
                        <a href="#social-proof" class="block text-gray-600 hover:text-blue-600 py-2">Success Stories</a>
                        <a href="${this.currentConfig.loginUrl}" class="block text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold py-3 px-4 rounded-lg text-center">Login</a>
                    </div>
                </div>
            </nav>
        `;
    }
    
    getFooterPagesHeaderHTML() {
        return `
            <!-- Footer Pages Header -->
            <nav class="home-nav sticky-nav">
                <div class="home-nav-container">
                    <a href="${this.currentConfig.homeUrl}" class="home-logo">
                        <img src="${this.currentConfig.logoUrl}" alt="Oslira Logo" class="home-logo-image">
                        <span>${this.currentConfig.companyName}</span>
                    </a>
                    
                    <div class="home-nav-menu">
                        <a href="/footer/about" class="home-nav-link">About</a>
                        <a href="/footer/pricing" class="home-nav-link">Pricing</a>
                        <a href="/footer/security" class="home-nav-link">Security</a>
                        <a href="/footer/help" class="home-nav-link">Help</a>
                        <a href="${this.currentConfig.loginUrl}" class="home-nav-link login-btn">Login</a>
                    </div>
                    
                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-button" class="md:hidden p-2 rounded-lg hover:bg-gray-100">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Mobile Menu -->
                <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
                    <div class="px-6 py-4 space-y-3">
                        <a href="/footer/about" class="block text-gray-600 hover:text-blue-600 py-2">About</a>
                        <a href="/footer/pricing" class="block text-gray-600 hover:text-blue-600 py-2">Pricing</a>
                        <a href="/footer/security" class="block text-gray-600 hover:text-blue-600 py-2">Security</a>
                        <a href="/footer/help" class="block text-gray-600 hover:text-blue-600 py-2">Help</a>
                        <a href="${this.currentConfig.loginUrl}" class="block text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold py-3 px-4 rounded-lg text-center">Login</a>
                    </div>
                </div>
            </nav>
        `;
    }
    
    // =============================================================================
    // HEADER FUNCTIONALITY
    // =============================================================================
    
    initializeHeaderFunctionality() {
        try {
            // Mobile menu functionality
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                    console.log('📱 [HeaderManager] Mobile menu toggled');
                });
            }
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
            
            // Smooth scrolling for anchor links (home page only)
            if (this.currentConfig.type === 'home') {
                document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                    anchor.addEventListener('click', function (e) {
                        e.preventDefault();
                        const target = document.querySelector(this.getAttribute('href'));
                        if (target) {
                            target.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    });
                });
            }
            
            this.initialized = true;
            console.log('✅ [HeaderManager] Header functionality initialized');
            
        } catch (error) {
            console.error('❌ [HeaderManager] Failed to initialize header functionality:', error);
        }
    }
    
    // =============================================================================
    // UTILITY METHODS
    // =============================================================================
    
    updateConfig(newConfig) {
        this.currentConfig = { ...this.currentConfig, ...newConfig };
    }
    
    refresh() {
        if (this.initialized) {
            const container = document.querySelector('.home-nav')?.parentElement;
            if (container) {
                this.render(container.id, this.currentConfig);
            }
        }
    }
    
    destroy() {
        this.initialized = false;
        this.currentConfig = null;
    }
    
    getVersion() {
        return '1.0.0';
    }
    
    getStatus() {
        return {
            initialized: this.initialized,
            config: this.currentConfig,
            version: this.getVersion()
        };
    }
}

// Export
window.HeaderManager = HeaderManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderManager;
}

console.log('✅ [HeaderManager] Header manager loaded v1.0.0');
