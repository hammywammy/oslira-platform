// =============================================================================
// FOOTER-MANAGER.JS - COMPLETELY REDESIGNED VERSION
// =============================================================================

class FooterManager {
    constructor() {
        this.initialized = false;
        this.currentConfig = null;
    }
    
    render(container, config = {}) {
        try {
            console.log('🦶 [FooterManager] Rendering NEW REDESIGNED footer...');
            
            this.currentConfig = {
                showSocialLinks: true,
                showNewsletter: true,
                year: new Date().getFullYear(),
                companyName: 'Oslira',
                ...config
            };
            
            const targetElement = typeof container === 'string' 
                ? document.getElementById(container) || document.querySelector(container)
                : container;
                
            if (!targetElement) {
                throw new Error(`Container element not found: ${container}`);
            }
            
            // Inject completely new footer HTML
            targetElement.innerHTML = this.getNewFooterHTML();
            targetElement.className = 'w-full';
            
            this.initializeFooter();
            
            console.log('✅ [FooterManager] NEW REDESIGNED footer rendered successfully');
            return this;
            
        } catch (error) {
            console.error('❌ [FooterManager] Render failed:', error);
            throw error;
        }
    }
    
    getNewFooterHTML() {
        return `
            <footer class="new-footer-main">
                <div class="new-footer-container">
                    
                    <!-- Single Row Layout -->
                    <div class="new-footer-content">
                        
                        <!-- Left: Company Info -->
                        <div class="new-footer-brand">
                            <div class="new-footer-logo">
                                <img src="/assets/images/oslira-logo.png" alt="Oslira" class="new-footer-logo-img">
                                <span class="new-footer-company">${this.currentConfig.companyName}</span>
                            </div>
<p class="new-footer-tagline">
    Transform online leads into converted clients.
</p>
                        </div>
                        
                        <!-- Center: Navigation -->
<div class="new-footer-nav">
                            <div class="new-footer-nav-group">
                                <h4 class="new-footer-nav-title">Product</h4>
                                <a href="/footer/about" class="new-footer-nav-link">About</a>
                                <a href="/footer/pricing" class="new-footer-nav-link">Pricing</a>
                                <a href="/footer/case-studies" class="new-footer-nav-link">Case Studies</a>
                                <a href="/footer/status" class="new-footer-nav-link">Status</a>
                            </div>
<div class="new-footer-nav-group">
    <h4 class="new-footer-nav-title">Resources</h4>
    <a href="/footer/docs" class="new-footer-nav-link">Docs</a>
    <a href="/footer/security" class="new-footer-nav-link">Security</a>
    <a href="/footer/contact" class="new-footer-nav-link">Contact</a>
</div>
                            <div class="new-footer-nav-group">
                                <h4 class="new-footer-nav-title">Legal</h4>
                                <a href="/footer/privacy" class="new-footer-nav-link">Privacy Policy</a>
                                <a href="/footer/terms" class="new-footer-nav-link">Terms of Service</a>
                                <a href="/footer/refund" class="new-footer-nav-link">Refund Policy</a>
                                <a href="/footer/disclaimer" class="new-footer-nav-link">Disclaimer</a>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bottom Row -->
                    <div class="new-footer-bottom">
                        <div class="new-footer-bottom-content">
                            <p class="new-footer-copyright">
                                © ${this.currentConfig.year} ${this.currentConfig.companyName}. All rights reserved.
                            </p>
                        </div>
                    </div>
                    
                </div>
            </footer>
        `;
    }
    
    initializeFooter() {
        console.log('🔧 [FooterManager] Initializing NEW footer functionality...');
        
        // Newsletter form handler
        const subscribeBtn = document.querySelector('.new-footer-subscribe-btn');
        const emailInput = document.querySelector('.new-footer-email-input');
        
        if (subscribeBtn && emailInput) {
            subscribeBtn.addEventListener('click', () => {
                const email = emailInput.value.trim();
                if (email && email.includes('@')) {
                    subscribeBtn.textContent = 'Subscribed!';
                    subscribeBtn.style.backgroundColor = '#10b981';
                    emailInput.value = '';
                    setTimeout(() => {
                        subscribeBtn.textContent = 'Subscribe';
                        subscribeBtn.style.backgroundColor = '';
                    }, 2000);
                }
            });
        }
        
        this.initialized = true;
        console.log('✅ [FooterManager] NEW footer functionality initialized');
    }
    
    // Keep existing utility methods
    updateConfig(newConfig) {
        this.currentConfig = { ...this.currentConfig, ...newConfig };
    }
    
    refresh() {
        if (this.initialized) {
            const container = document.querySelector('.new-footer-main')?.parentElement;
            if (container) {
                this.render(container, this.currentConfig);
            }
        }
    }
    
    destroy() {
        this.initialized = false;
        this.currentConfig = null;
    }
    
    getVersion() {
        return '4.0.0-redesigned';
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
window.FooterManager = FooterManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FooterManager;
}

console.log('✅ [FooterManager] COMPLETELY NEW REDESIGNED footer manager loaded v4.0.0');
