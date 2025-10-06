// =============================================================================
// ADMIN SIDEBAR MANAGER
// Stripped-down navigation-only sidebar for admin panel
// =============================================================================

class AdminSidebarManager {
    constructor() {
        this.sections = [
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'businesses', label: 'Businesses', icon: '🏢' },
            { id: 'revenue', label: 'Revenue', icon: '💰' },
            { id: 'usage', label: 'Usage Analytics', icon: '📈' },
            { id: 'system', label: 'System Monitor', icon: '🖥️' },
            { id: 'leads', label: 'Leads & Analysis', icon: '🎯' }
        ];
        
        this.activeSection = 'overview';
        this.eventBus = window.AdminEventBus || null;
        this.isCollapsed = false;
        
        console.log('🎨 [AdminSidebar] Manager initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize() {
        console.log('🚀 [AdminSidebar] Starting initialization...');
        
        try {
            this.injectSidebar();
            this.attachEventListeners();
            this.setActiveSection(this.getInitialSection());
            
            console.log('✅ [AdminSidebar] Initialization complete');
            return true;
        } catch (error) {
            console.error('❌ [AdminSidebar] Initialization failed:', error);
            return false;
        }
    }
    
    // =========================================================================
    // SIDEBAR RENDERING
    // =========================================================================
    
    injectSidebar() {
        const existingSidebar = document.getElementById('admin-sidebar');
        if (existingSidebar) {
            console.log('🔄 [AdminSidebar] Sidebar already exists, skipping injection');
            return;
        }
        
        const sidebarHTML = `
            <aside id="admin-sidebar" class="admin-sidebar-nav ${this.isCollapsed ? 'collapsed' : ''}">
                <!-- Logo/Header -->
                <div class="admin-sidebar-header">
                    <div class="admin-logo-container">
                        <span class="admin-logo-icon">⚡</span>
                        <span class="admin-logo-text">OSLIRA Admin</span>
                    </div>
                    <button id="admin-sidebar-toggle" class="admin-sidebar-toggle" title="Toggle sidebar">
                        <span class="toggle-icon">◀</span>
                    </button>
                </div>
                
                <!-- Navigation Sections -->
                <nav class="admin-nav-container">
                    <div class="admin-nav-sections">
                        ${this.sections.map(section => `
                            <a href="#${section.id}" 
                               data-section="${section.id}" 
                               class="admin-nav-item ${section.id === this.activeSection ? 'active' : ''}"
                               title="${section.label}">
                                <span class="nav-icon">${section.icon}</span>
                                <span class="nav-text">${section.label}</span>
                            </a>
                        `).join('')}
                    </div>
                </nav>
                
                <!-- Footer Actions -->
                <div class="admin-sidebar-footer">
                    <a href="${window.OsliraEnv?.getAppUrl('/dashboard') || '/dashboard'}" 
                       class="admin-nav-item admin-exit-link"
                       title="Exit Admin">
                        <span class="nav-icon">🚪</span>
                        <span class="nav-text">Exit Admin</span>
                    </a>
                </div>
            </aside>
        `;
        
        // Insert sidebar at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
        
        console.log('✅ [AdminSidebar] Sidebar injected into DOM');
    }
    
    // =========================================================================
    // EVENT HANDLING
    // =========================================================================
    
    attachEventListeners() {
        // Section navigation
        const navItems = document.querySelectorAll('.admin-nav-item[data-section]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.getAttribute('data-section');
                this.setActiveSection(sectionId);
            });
        });
        
        // Sidebar toggle
        const toggleBtn = document.getElementById('admin-sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Exit admin link
        const exitLink = document.querySelector('.admin-exit-link');
        if (exitLink) {
            exitLink.addEventListener('click', (e) => {
                const confirmed = confirm('Exit admin panel and return to dashboard?');
                if (!confirmed) {
                    e.preventDefault();
                }
            });
        }
        
        console.log('✅ [AdminSidebar] Event listeners attached');
    }
    
    // =========================================================================
    // NAVIGATION
    // =========================================================================
    
    setActiveSection(sectionId) {
        if (!this.sections.find(s => s.id === sectionId)) {
            console.warn(`⚠️ [AdminSidebar] Unknown section: ${sectionId}`);
            return;
        }
        
        this.activeSection = sectionId;
        
        // Update UI
        document.querySelectorAll('.admin-nav-item[data-section]').forEach(item => {
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update URL hash
        window.location.hash = sectionId;
        
        // Emit event for section components to listen
        if (this.eventBus) {
            this.eventBus.emit('admin:section-changed', { section: sectionId });
        }
        
        // Also dispatch native event for non-event-bus components
        window.dispatchEvent(new CustomEvent('admin:section-changed', {
            detail: { section: sectionId }
        }));
        
        console.log(`📍 [AdminSidebar] Active section: ${sectionId}`);
    }
    
    getActiveSection() {
        return this.activeSection;
    }
    
    getInitialSection() {
        // Try to get from URL hash
        const hash = window.location.hash.replace('#', '');
        if (hash && this.sections.find(s => s.id === hash)) {
            return hash;
        }
        
        // Default to overview
        return 'overview';
    }
    
    // =========================================================================
    // SIDEBAR COLLAPSE
    // =========================================================================
    
    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
        
        const sidebar = document.getElementById('admin-sidebar');
        const mainContent = document.querySelector('.admin-main-content');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (this.isCollapsed) {
            sidebar?.classList.add('collapsed');
            mainContent?.classList.add('sidebar-collapsed');
            if (toggleIcon) toggleIcon.textContent = '▶';
        } else {
            sidebar?.classList.remove('collapsed');
            mainContent?.classList.remove('sidebar-collapsed');
            if (toggleIcon) toggleIcon.textContent = '◀';
        }
        
        // Save preference
        localStorage.setItem('adminSidebarCollapsed', this.isCollapsed.toString());
        
        console.log(`🔄 [AdminSidebar] Sidebar ${this.isCollapsed ? 'collapsed' : 'expanded'}`);
    }
    
    loadCollapsedState() {
        const savedState = localStorage.getItem('adminSidebarCollapsed');
        if (savedState === 'true') {
            this.toggleSidebar();
        }
    }
    
    // =========================================================================
    // UTILITY METHODS
    // =========================================================================
    
    highlightSection(sectionId) {
        const navItem = document.querySelector(`.admin-nav-item[data-section="${sectionId}"]`);
        if (navItem) {
            navItem.classList.add('pulse-highlight');
            setTimeout(() => {
                navItem.classList.remove('pulse-highlight');
            }, 1000);
        }
    }
    
    destroy() {
        const sidebar = document.getElementById('admin-sidebar');
        if (sidebar) {
            sidebar.remove();
        }
        
        console.log('🗑️ [AdminSidebar] Manager destroyed');
    }
}

// =============================================================================
// GLOBAL INITIALIZATION (same pattern as dashboard sidebar)
// =============================================================================

// Export for global use
window.AdminSidebarManager = AdminSidebarManager;

// Create global instance
window.adminSidebarManager = new AdminSidebarManager();

console.log('✅ [AdminSidebarManager] Module loaded and ready');
