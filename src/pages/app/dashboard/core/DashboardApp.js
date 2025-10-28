class DashboardApp {
    constructor() {
        this.user = { email: 'demo@oslira.com', id: 'demo-123', full_name: 'Demo User' };
        this.currentBusiness = null;
        this.businesses = [];
        console.log('✅ [DashboardApp] DEMO MODE - No auth required');
    }

    async initialize() {
        console.log('🚀 [DashboardApp] Starting initialization...');
        
        try {
            await this.setupUI();
            await this.loadDemoData();
            this.hideLoader();
            console.log('✅ [DashboardApp] Initialization complete');
        } catch (error) {
            console.error('❌ [DashboardApp] Initialization failed:', error);
            this.showError('Failed to load dashboard');
        }
    }

    async setupUI() {
        console.log('🎨 [DashboardApp] Setting up UI...');
        
        // Show user info
        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl) userEmailEl.textContent = this.user.email;
        
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = this.user.full_name;
    }

    async loadDemoData() {
        console.log('📊 [DashboardApp] Loading demo data...');
        
        // Demo business
        this.businesses = [{
            id: 'demo-business-123',
            business_name: 'Demo Business',
            created_at: new Date().toISOString()
        }];
        
        this.currentBusiness = this.businesses[0];
        
        // Update business selector if exists
        const businessSelector = document.getElementById('business-selector');
        if (businessSelector) {
            businessSelector.innerHTML = `<option value="${this.currentBusiness.id}">${this.currentBusiness.business_name}</option>`;
        }
    }

    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) loader.style.display = 'none';
        
        document.body.style.visibility = 'visible';
    }

    showError(message) {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.innerHTML = `
                <div style="text-align: center; color: #ef4444;">
                    <h2 style="margin-bottom: 10px;">Error</h2>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.OsliraApp = new DashboardApp();
        window.OsliraApp.initialize();
    });
} else {
    window.OsliraApp = new DashboardApp();
    window.OsliraApp.initialize();
}
