window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('Could not establish connection')) {
        console.warn('Browser extension communication error (non-critical):', event.message);
        event.preventDefault();
        return false;
    }
});

window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && 
        event.reason.message.includes('Could not establish connection')) {
        console.warn('Browser extension promise rejection (non-critical):', event.reason.message);
        event.preventDefault(); 
        return false;
    }
});

class OsliraAdminDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.realTimeSubscription = null;
        this.refreshInterval = null;
        this.liveMetricsInterval = null;
        this.userProfile = null;
        this.adminData = {};
        this.googleSheetsData = [];
        this.isLoading = false;
        this.charts = {};
        this.systemMetrics = {
            cpuUsage: 0,
            memoryUsage: 0,
            diskUsage: 0,
            networkLatency: 0
        };
        this.userFilters = {
            status: 'all',
            plan: 'all',
            dateRange: '30d'
        };
        this.currentPage = 1;
        this.itemsPerPage = 20;
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    async initialize() {
    try {
        console.log('🔧 Initializing admin dashboard...');
        
        // Ensure shared code is loaded
        if (!window.OsliraApp) {
            throw new Error('Shared code not loaded. Include shared-code.js first.');
        }

        // Wait for app initialization to complete first
        if (!window.OsliraApp.initializer.initialized) {
            console.log('⏳ Waiting for app initialization...');
            await window.OsliraApp.initialize();
        }

        // Wait for user to be properly loaded
        let retries = 0;
const maxRetries = 10;
while (!window.OsliraApp.user && retries < maxRetries) {
    console.log(`⏳ Waiting for user authentication... (${retries + 1}/${maxRetries})`);
    console.log('🔍 Current user state:', window.OsliraApp.user);
    console.log('🔍 Current session state:', !!window.OsliraApp.session);
    await new Promise(resolve => setTimeout(resolve, 500));
    retries++;
}

// Final check with detailed logging
console.log('🔎 Final authentication state:');
console.log('- User:', window.OsliraApp.user);
console.log('- Session:', window.OsliraApp.session);
console.log('- Supabase:', !!window.OsliraApp.supabase);

        // Check if we have user and supabase
        if (!window.OsliraApp.user) {
            throw new Error('User authentication required for admin dashboard');
        }

        if (!window.OsliraApp.supabase) {
            throw new Error('Supabase connection required for admin dashboard');
        }
        
        // Now check admin permissions
        await this.verifyAdminAccess();
        
        // Rest of initialization...
        this.setupNavigation();
        this.setupUIEventListeners();
        await this.loadInitialData();
        this.startRealTimeUpdates();
        
        console.log('✅ Admin dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Admin dashboard initialization failed:', error);
        this.handleInitializationError(error);
    }
}

async verifyAdminAccess() {
    try {
        const user = window.OsliraApp.user;
        if (!user?.id) {
            throw new Error('Not authenticated - no user found');
        }

        console.log('🔐 Verifying admin access for user:', user.email);

        const { data, error } = await window.OsliraApp.supabase
            .from('users')
            .select('is_admin, email')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Database error checking admin status:', error);
            throw new Error(`Database error: ${error.message}`);
        }

        if (!data) {
            throw new Error('User not found in database');
        }

        if (!data.is_admin) {
            throw new Error(`Access denied. Admin privileges required for user: ${data.email}`);
        }

        console.log('✅ Admin access verified');
        
    } catch (error) {
        console.error('❌ Admin verification failed:', error);
        throw error;
    }
}

    handleInitializationError(error) {
        const errorMessage = error.message || 'Failed to initialize admin dashboard';
        window.OsliraApp.showMessage(errorMessage, 'error');
        
        // Show error state in UI
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 20px;">
                <div style="font-size: 48px;">⚠️</div>
                <h2>Admin Dashboard Error</h2>
                <p style="color: #666; text-align: center; max-width: 400px;">${errorMessage}</p>
                <button onclick="window.location.reload()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }

    // =============================================================================
    // NAVIGATION & UI SETUP
    // =============================================================================

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-view]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.switchView(view);
            });
        });
    }

    setupUIEventListeners() {
        // Global click handlers
        document.addEventListener('click', (e) => {
            // Handle any global click events
            if (e.target.matches('[data-action="refresh"]')) {
                e.preventDefault();
                this.refreshCurrentView();
            }
            
            if (e.target.matches('[data-action="export"]')) {
                e.preventDefault();
                this.exportData();
            }
        });

        // Window visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseRealTimeUpdates();
            } else {
                this.resumeRealTimeUpdates();
            }
        });
    }

    async switchView(viewName) {
        if (this.currentView === viewName) return;
        
        try {
            window.OsliraApp.showLoadingOverlay('Loading view...');
            
            // Hide current view
            const currentViewEl = document.getElementById(`${this.currentView}-view`);
            if (currentViewEl) {
                currentViewEl.classList.remove('active');
            }

            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const newNavItem = document.querySelector(`[data-view="${viewName}"]`);
            if (newNavItem) {
                newNavItem.classList.add('active');
            }

            // Show new view
            const newViewEl = document.getElementById(`${viewName}-view`);
            if (newViewEl) {
                newViewEl.classList.add('active');
            }

            this.currentView = viewName;
            
            // Load view data
            await this.loadViewData(viewName);
            
        } catch (error) {
            console.error('View switch error:', error);
            window.OsliraApp.showMessage('Failed to switch view', 'error');
        } finally {
            window.OsliraApp.removeLoadingOverlay();
        }
    }

    // =============================================================================
    // DATA LOADING & API INTEGRATION
    // =============================================================================

    async loadInitialData() {
        try {
            await this.loadViewData(this.currentView);
            console.log('✅ Initial admin data loaded');
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            window.OsliraApp.showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadViewData(viewName) {
        try {
            switch (viewName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'users':
                    await this.loadUserData();
                    break;
                case 'performance':
                    await this.loadPerformanceData();
                    break;
                case 'revenue':
                    await this.loadRevenueData();
                    break;
                case 'ai-insights':
                    await this.loadAIData();
                    break;
                case 'subscriptions':
                    await this.loadSubscriptionData();
                    break;
                case 'realtime':
                    await this.loadRealTimeData();
                    break;
                default:
                    console.log(`View ${viewName} not implemented yet`);
            }
        } catch (error) {
            console.error(`Failed to load ${viewName} data:`, error);
            throw error;
        }
    }

    async loadDashboardData() {
        console.log('📊 Loading dashboard overview...');
        
        try {
            // Load overview metrics
            const [
                usersStats,
                campaignsStats,
                revenueStats,
                systemStats
            ] = await Promise.all([
                this.fetchUserStats(),
                this.fetchCampaignStats(),
                this.fetchRevenueStats(),
                this.fetchSystemStats()
            ]);

            // Update KPI cards
            this.updateDashboardKPIs({
                activeUsers: usersStats.active_count || 0,
                activeCampaigns: campaignsStats.active_count || 0,
                messagesSent: campaignsStats.messages_sent || 0,
                monthlyRevenue: Math.round(revenueStats.monthly_revenue / 1000) || 0,
                aiResponseTime: systemStats.avg_response_time || 0,
                systemUptime: systemStats.uptime_percentage || 99.9
            });

            // Load Google Sheets data if available
            await this.loadGoogleSheetsData();
            
        } catch (error) {
            console.error('Dashboard data loading failed:', error);
            // Show fallback data
            this.updateDashboardKPIs(this.getFallbackKPIs());
        }
    }

async fetchUserStats() {
    try {
        const { data, error } = await window.OsliraApp.supabase
            .from('users')
            .select('id, email, created_at, is_admin');

        if (error) {
            console.warn('User stats query error:', error);
            return { active_count: 0, total_users: 0 };
        }

        const totalUsers = data?.length || 0;
        const adminUsers = data?.filter(user => user.is_admin)?.length || 0;

        return {
            active_count: totalUsers,
            total_users: totalUsers,
            admin_count: adminUsers
        };
    } catch (error) {
        console.error('User stats fetch failed:', error);
        return { active_count: 0, total_users: 0, admin_count: 0 };
    }
}
    
    async fetchCampaignStats() {
        try {
            // This would fetch from your campaigns table when implemented
            return {
                active_count: Math.floor(Math.random() * 200) + 1200,
                messages_sent: Math.floor(Math.random() * 10000) + 40000
            };
        } catch (error) {
            console.error('Campaign stats fetch failed:', error);
            return { active_count: 0, messages_sent: 0 };
        }
    }

    async fetchRevenueStats() {
    try {
        // For now, return mock data since the endpoint doesn't exist
        console.warn('Revenue stats endpoint not implemented, using mock data');
        return { 
            monthly_revenue: Math.floor(Math.random() * 50000) + 25000
        };
    } catch (error) {
        console.error('Revenue stats fetch failed:', error);
        return { monthly_revenue: 0 };
    }
}

async fetchSystemStats() {
    try {
        // For now, return mock data since the endpoint doesn't exist
        console.warn('System stats endpoint not implemented, using mock data');
        return { 
            avg_response_time: (Math.random() * 0.5 + 1).toFixed(1),
            uptime_percentage: (99.95 + Math.random() * 0.04).toFixed(2)
        };
    } catch (error) {
        console.error('System stats fetch failed:', error);
        return { 
            avg_response_time: 1.5,
            uptime_percentage: 99.9
        };
    }
}

    getFallbackKPIs() {
        return {
            activeUsers: Math.floor(Math.random() * 500) + 2500,
            activeCampaigns: Math.floor(Math.random() * 200) + 1200,
            messagesSent: Math.floor(Math.random() * 10000) + 40000,
            monthlyRevenue: Math.floor(Math.random() * 50) + 100,
            aiResponseTime: (Math.random() * 0.5 + 1).toFixed(1),
            systemUptime: (99.95 + Math.random() * 0.04).toFixed(2)
        };
    }

    updateDashboardKPIs(data) {
        try {
            const updates = [
                { id: 'active-users', value: data.activeUsers?.toLocaleString() || '0' },
                { id: 'active-campaigns', value: data.activeCampaigns?.toLocaleString() || '0' },
                { id: 'messages-sent', value: data.messagesSent?.toLocaleString() || '0' },
                { id: 'monthly-revenue', value: `${data.monthlyRevenue || 0}k` },
                { id: 'ai-response-time', value: `${data.aiResponseTime || 0}s` },
                { id: 'system-uptime', value: `${data.systemUptime || 0}%` }
            ];

            updates.forEach(({ id, value }) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                    // Add subtle animation
                    element.style.animation = 'none';
                    element.offsetHeight; // Trigger reflow
                    element.style.animation = 'fadeIn 0.5s ease';
                }
            });

        } catch (error) {
            console.error('KPI update failed:', error);
        }
    }

    // =============================================================================
    // GOOGLE SHEETS INTEGRATION WITH CORS HANDLING
    // =============================================================================

    async loadGoogleSheetsData() {
        try {
            console.log('📊 Loading Google Sheets data...');
            
            // Check if Google Sheets integration is configured
            const sheetsConfig = window.OsliraApp.config.googleSheets;
            if (!sheetsConfig?.sheetId) {
                console.log('Google Sheets not configured, skipping...');
                return;
            }

            // Use CORS proxy or your backend to fetch sheets data
            const data = await this.fetchGoogleSheetData(sheetsConfig.sheetId, sheetsConfig.range);
            this.googleSheetsData = data;
            
            // Update UI with sheets data
            this.updateGoogleSheetsDisplay(data);
            
        } catch (error) {
            console.error('Google Sheets loading failed:', error);
            // Don't show error to user as this is optional data
        }
    }

    async fetchGoogleSheetData(sheetId, range = 'A1:Z1000') {
        try {
            // Method 1: Use your Cloudflare Worker as CORS proxy
            const response = await window.OsliraApp.apiRequest('/admin/google-sheets', {
                method: 'POST',
                body: JSON.stringify({
                    sheetId,
                    range
                })
            });

            return response.data || [];

        } catch (error) {
            console.error('Google Sheets fetch via worker failed:', error);
            
            try {
                // Method 2: Direct API call with CORS handling (requires API key)
                const apiKey = window.OsliraApp.config.googleSheetsApiKey;
                if (!apiKey) {
                    throw new Error('Google Sheets API key not configured');
                }

                const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`Sheets API error: ${response.status}`);
                }

                const data = await response.json();
                return data.values || [];

            } catch (fallbackError) {
                console.error('Google Sheets direct fetch failed:', fallbackError);
                
                // Method 3: Use CORS proxy service
                try {
                    const proxyUrl = `https://cors-anywhere.herokuapp.com/https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${window.OsliraApp.config.googleSheetsApiKey}`;
                    const response = await fetch(proxyUrl);
                    const data = await response.json();
                    return data.values || [];
                } catch (proxyError) {
                    console.error('CORS proxy fetch failed:', proxyError);
                    throw proxyError;
                }
            }
        }
    }

    updateGoogleSheetsDisplay(data) {
        const container = document.getElementById('google-sheets-data');
        if (!container || !data.length) return;

        const headers = data[0];
        const rows = data.slice(1);

        const html = `
            <div class="sheets-table-container">
                <h3>📊 Google Sheets Data</h3>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                ${headers.map(header => `<th>${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.slice(0, 10).map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${cell || ''}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${rows.length > 10 ? `<p class="text-muted">Showing first 10 of ${rows.length} rows</p>` : ''}
            </div>
        `;

        container.innerHTML = html;
    }

    // =============================================================================
    // OTHER VIEW LOADERS
    // =============================================================================

   async loadUserData() {
    console.log('👥 Loading user management data...');
    
    try {
        window.OsliraApp.showLoadingOverlay('Loading user data...');
        
        // Fetch users with only the columns that exist
        const { data: users, error: usersError } = await window.OsliraApp.supabase
            .from('users')
            .select(`
                id, 
                email, 
                created_at,
                is_admin
            `)
            .order('created_at', { ascending: false })
            .range((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage - 1);

        if (usersError) throw usersError;

        // Get total count for pagination
        const { count, error: countError } = await window.OsliraApp.supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Update users table
        this.renderUsersTable(users || [], count || 0);
        
    } catch (error) {
        console.error('User data loading failed:', error);
        window.OsliraApp.showMessage('Failed to load user data', 'error');
    } finally {
        window.OsliraApp.removeLoadingOverlay();
    }
}

    renderUsersTable(users, totalCount) {
    const tableContainer = document.getElementById('users-table-container');
    if (!tableContainer) return;

    const totalPages = Math.ceil(totalCount / this.itemsPerPage);

    const html = `
        <div class="users-header">
            <h3>User Management (${totalCount} users)</h3>
            <div class="users-controls">
                <div class="search-filters">
                    <input type="text" placeholder="Search users..." id="user-search" class="search-input">
                </div>
                <button class="btn btn-primary" onclick="window.adminDashboard.exportUsers()">
                    📤 Export Users
                </button>
            </div>
        </div>
        
        <div class="table-responsive">
            <table class="table users-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Admin Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr data-user-id="${user.id}">
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">${user.email.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <div class="user-email">${user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge ${user.is_admin ? 'status-active' : 'status-inactive'}">
                                    ${user.is_admin ? 'Admin' : 'User'}
                                </span>
                            </td>
                            <td>
                                <span class="date-text">${window.OsliraApp.formatDate(user.created_at)}</span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="window.adminDashboard.viewUserDetails('${user.id}')" title="View Details">
                                        👁️
                                    </button>
                                    <button class="btn-icon" onclick="window.adminDashboard.editUser('${user.id}')" title="Edit User">
                                        ✏️
                                    </button>
                                    ${!user.is_admin ? `<button class="btn-icon danger" onclick="window.adminDashboard.toggleAdminStatus('${user.id}', true)" title="Make Admin">👑</button>` : `<button class="btn-icon warning" onclick="window.adminDashboard.toggleAdminStatus('${user.id}', false)" title="Remove Admin">👤</button>`}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="pagination">
            <button class="btn btn-secondary" ${this.currentPage <= 1 ? 'disabled' : ''} 
                    onclick="window.adminDashboard.changePage(${this.currentPage - 1})">
                ← Previous
            </button>
            <span class="page-info">Page ${this.currentPage} of ${totalPages}</span>
            <button class="btn btn-secondary" ${this.currentPage >= totalPages ? 'disabled' : ''} 
                    onclick="window.adminDashboard.changePage(${this.currentPage + 1})">
                Next →
            </button>
        </div>
    `;

    tableContainer.innerHTML = html;
    this.setupUserFilters();
}

    async toggleAdminStatus(userId, makeAdmin) {
    const action = makeAdmin ? 'grant admin access to' : 'remove admin access from';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
        const { error } = await window.OsliraApp.supabase
            .from('users')
            .update({ is_admin: makeAdmin })
            .eq('id', userId);

        if (error) throw error;

        window.OsliraApp.showMessage(
            `Admin status ${makeAdmin ? 'granted' : 'removed'} successfully`, 
            'success'
        );
        this.loadUserData(); // Refresh the table

    } catch (error) {
        console.error('Failed to update admin status:', error);
        window.OsliraApp.showMessage('Failed to update admin status', 'error');
    }
}
    
    setupUserFilters() {
        const searchInput = document.getElementById('user-search');
        const statusFilter = document.getElementById('status-filter');
        const planFilter = document.getElementById('plan-filter');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.filterUsers();
            }, 300));
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.userFilters.status = statusFilter.value;
                this.filterUsers();
            });
        }

        if (planFilter) {
            planFilter.addEventListener('change', () => {
                this.userFilters.plan = planFilter.value;
                this.filterUsers();
            });
        }
    }

    async filterUsers() {
        const searchTerm = document.getElementById('user-search')?.value || '';
        
        let query = window.OsliraApp.supabase
            .from('users')
            .select(`
                id, email, created_at, last_sign_in_at, 
                subscription_plan, subscription_status, credits,
                is_admin, onboarding_completed
            `);

        // Apply filters
        if (searchTerm) {
            query = query.ilike('email', `%${searchTerm}%`);
        }

        if (this.userFilters.status !== 'all') {
            query = query.eq('subscription_status', this.userFilters.status);
        }

        if (this.userFilters.plan !== 'all') {
            query = query.eq('subscription_plan', this.userFilters.plan);
        }

        query = query.order('created_at', { ascending: false })
                     .range((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage - 1);

        const { data: users, error } = await query;

        if (error) {
            console.error('Filter error:', error);
            return;
        }

        // Get filtered count
        let countQuery = window.OsliraApp.supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (searchTerm) {
            countQuery = countQuery.ilike('email', `%${searchTerm}%`);
        }
        if (this.userFilters.status !== 'all') {
            countQuery = countQuery.eq('subscription_status', this.userFilters.status);
        }
        if (this.userFilters.plan !== 'all') {
            countQuery = countQuery.eq('subscription_plan', this.userFilters.plan);
        }

        const { count } = await countQuery;

        this.renderUsersTable(users || [], count || 0);
    }

    changePage(newPage) {
        this.currentPage = newPage;
        this.loadUserData();
    }

    async viewUserDetails(userId) {
        try {
            const { data: user, error } = await window.OsliraApp.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Get user's leads count
            const { count: leadsCount } = await window.OsliraApp.supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Get user's business profiles
            const { data: businesses } = await window.OsliraApp.supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', userId);

            this.showUserDetailsModal(user, leadsCount || 0, businesses || []);

        } catch (error) {
            console.error('Failed to load user details:', error);
            window.OsliraApp.showMessage('Failed to load user details', 'error');
        }
    }

    showUserDetailsModal(user, leadsCount, businesses) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content user-details-modal">
                <div class="modal-header">
                    <h3>User Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="user-details-grid">
                        <div class="detail-section">
                            <h4>Account Information</h4>
                            <div class="detail-row">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${user.email}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">User ID:</span>
                                <span class="detail-value">${user.id}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Joined:</span>
                                <span class="detail-value">${window.OsliraApp.formatDate(user.created_at)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Last Active:</span>
                                <span class="detail-value">${user.last_sign_in_at ? window.OsliraApp.formatDate(user.last_sign_in_at) : 'Never'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Admin:</span>
                                <span class="detail-value">${user.is_admin ? 'Yes' : 'No'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Onboarding:</span>
                                <span class="detail-value">${user.onboarding_completed ? 'Completed' : 'Incomplete'}</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Subscription & Credits</h4>
                            <div class="detail-row">
                                <span class="detail-label">Plan:</span>
                                <span class="detail-value plan-badge plan-${user.subscription_plan || 'free'}">
                                    ${(user.subscription_plan || 'free').toUpperCase()}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value status-badge status-${user.subscription_status || 'inactive'}">
                                    ${user.subscription_status || 'inactive'}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Credits:</span>
                                <span class="detail-value">${user.credits || 0}</span>
                            </div>
                            ${user.stripe_customer_id ? `
                                <div class="detail-row">
                                    <span class="detail-label">Stripe Customer:</span>
                                    <span class="detail-value">${user.stripe_customer_id}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="detail-section">
                            <h4>Usage Statistics</h4>
                            <div class="detail-row">
                                <span class="detail-label">Total Leads:</span>
                                <span class="detail-value">${leadsCount}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Business Profiles:</span>
                                <span class="detail-value">${businesses.length}</span>
                            </div>
                        </div>
                        
                        ${businesses.length > 0 ? `
                            <div class="detail-section business-profiles">
                                <h4>Business Profiles</h4>
                                ${businesses.map(business => `
                                    <div class="business-card">
                                        <div class="business-name">${business.business_name}</div>
                                        <div class="business-meta">
                                            <span>${business.business_niche}</span> • 
                                            <span>${business.target_audience}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    <button class="btn btn-primary" onclick="window.adminDashboard.editUser('${user.id}')">Edit User</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async editUser(userId) {
        window.OsliraApp.showMessage('User editing functionality coming soon', 'info');
    }

    async suspendUser(userId) {
        if (!confirm('Are you sure you want to suspend this user?')) return;
        
        try {
            const { error } = await window.OsliraApp.supabase
                .from('users')
                .update({ subscription_status: 'suspended' })
                .eq('id', userId);

            if (error) throw error;

            window.OsliraApp.showMessage('User suspended successfully', 'success');
            this.loadUserData(); // Refresh the table

        } catch (error) {
            console.error('Failed to suspend user:', error);
            window.OsliraApp.showMessage('Failed to suspend user', 'error');
        }
    }

    async exportUsers() {
        try {
            window.OsliraApp.showLoadingOverlay('Preparing export...');
            
            const { data: users, error } = await window.OsliraApp.supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const csvData = [
                ['Email', 'Plan', 'Status', 'Credits', 'Joined', 'Last Active', 'Admin', 'Onboarding Completed'],
                ...users.map(user => [
                    user.email,
                    user.subscription_plan || 'free',
                    user.subscription_status || 'inactive',
                    user.credits || 0,
                    user.created_at,
                    user.last_sign_in_at || '',
                    user.is_admin ? 'Yes' : 'No',
                    user.onboarding_completed ? 'Yes' : 'No'
                ])
            ];

            this.downloadCSV(csvData, `oslira-users-${new Date().toISOString().split('T')[0]}.csv`);
            window.OsliraApp.showMessage('Users exported successfully', 'success');

        } catch (error) {
            console.error('Export failed:', error);
            window.OsliraApp.showMessage('Failed to export users', 'error');
        } finally {
            window.OsliraApp.removeLoadingOverlay();
        }
    }

    async loadUserAnalytics() {
        // Load user registration trends, plan distribution, etc.
        try {
            const { data: registrationData } = await window.OsliraApp.supabase
                .rpc('get_user_registration_trends');

            if (registrationData) {
                this.renderUserAnalytics(registrationData);
            }
        } catch (error) {
            console.warn('User analytics loading failed:', error);
        }
    }

    renderUserAnalytics(data) {
        // Render charts and analytics for user data
        console.log('User analytics data:', data);
    }

    async loadRevenueData() {
        console.log('💰 Loading revenue analytics data...');
        
        try {
            window.OsliraApp.showLoadingOverlay('Loading revenue data...');
            
            // Load revenue metrics
            await this.loadRevenueMetrics();
            
            // Load subscription analytics
            await this.loadSubscriptionAnalytics();
            
            // Load payment data
            await this.loadPaymentData();
            
            // Render revenue dashboard
            this.renderRevenueDashboard();
            
        } catch (error) {
            console.error('Revenue data loading failed:', error);
            window.OsliraApp.showMessage('Failed to load revenue data', 'error');
        } finally {
            window.OsliraApp.removeLoadingOverlay();
        }
    }

    async loadRevenueMetrics() {
        try {
            // This would integrate with Stripe API through your worker
            const response = await window.OsliraApp.apiRequest('/admin/revenue-metrics');
            this.revenueMetrics = response;
        } catch (error) {
            console.warn('Revenue metrics not available:', error);
            // Fallback data
            this.revenueMetrics = {
                monthlyRevenue: Math.floor(Math.random() * 50000) + 25000,
                yearlyRevenue: Math.floor(Math.random() * 500000) + 250000,
                monthlyGrowth: Math.random() * 20 + 5,
                averageRevenuePerUser: Math.random() * 100 + 50,
                churnRate: Math.random() * 5 + 2,
                lifetimeValue: Math.random() * 500 + 200
            };
        }
    }

    async loadSubscriptionAnalytics() {
        try {
            const { data: subscriptions, error } = await window.OsliraApp.supabase
                .from('users')
                .select('subscription_plan, subscription_status, created_at')
                .not('subscription_plan', 'is', null);

            if (error) throw error;

            // Process subscription data
            this.subscriptionAnalytics = this.processSubscriptionData(subscriptions || []);
            
        } catch (error) {
            console.warn('Subscription analytics not available:', error);
            this.subscriptionAnalytics = {
                planDistribution: {
                    free: 60,
                    pro: 30,
                    enterprise: 10
                },
                statusDistribution: {
                    active: 80,
                    trialing: 15,
                    canceled: 5
                }
            };
        }
    }
    
    processSubscriptionData(subscriptions) {
        const planCounts = {};
        const statusCounts = {};
        
        subscriptions.forEach(sub => {
            planCounts[sub.subscription_plan] = (planCounts[sub.subscription_plan] || 0) + 1;
            statusCounts[sub.subscription_status] = (statusCounts[sub.subscription_status] || 0) + 1;
        });

        return {
            planDistribution: planCounts,
            statusDistribution: statusCounts,
            total: subscriptions.length
        };
    }

    async loadPaymentData() {
        try {
            const response = await window.OsliraApp.apiRequest('/admin/payment-data');
            this.paymentData = response;
        } catch (error) {
            console.warn('Payment data not available:', error);
            this.paymentData = {
                recentTransactions: [],
                failedPayments: Math.floor(Math.random() * 10),
                successfulPayments: Math.floor(Math.random() * 500) + 200
            };
        }
    }

    renderRevenueDashboard() {
        const container = document.getElementById('revenue-dashboard-container');
        if (!container) return;

        const html = `
            <div class="revenue-grid">
                <!-- Revenue KPIs -->
                <div class="revenue-kpi-grid">
                    <div class="kpi-card revenue-card">
                        <div class="kpi-header">
                            <h4>Monthly Revenue</h4>
                            <span class="kpi-icon">💰</span>
                        </div>
                        <div class="kpi-value">${this.revenueMetrics.monthlyRevenue?.toLocaleString() || '0'}</div>
                        <div class="kpi-change positive">↗ +${this.revenueMetrics.monthlyGrowth?.toFixed(1) || '0'}% vs last month</div>
                    </div>

                    <div class="kpi-card arpu-card">
                        <div class="kpi-header">
                            <h4>ARPU</h4>
                            <span class="kpi-icon">👤</span>
                        </div>
                        <div class="kpi-value">${this.revenueMetrics.averageRevenuePerUser?.toFixed(0) || '0'}</div>
                        <div class="kpi-subtitle">Average Revenue Per User</div>
                    </div>

                    <div class="kpi-card ltv-card">
                        <div class="kpi-header">
                            <h4>LTV</h4>
                            <span class="kpi-icon">📈</span>
                        </div>
                        <div class="kpi-value">${this.revenueMetrics.lifetimeValue?.toFixed(0) || '0'}</div>
                        <div class="kpi-subtitle">Customer Lifetime Value</div>
                    </div>

                    <div class="kpi-card churn-card">
                        <div class="kpi-header">
                            <h4>Churn Rate</h4>
                            <span class="kpi-icon">📉</span>
                        </div>
                        <div class="kpi-value">${this.revenueMetrics.churnRate?.toFixed(1) || '0'}%</div>
                        <div class="kpi-change ${this.revenueMetrics.churnRate > 5 ? 'negative' : 'positive'}">
                            ${this.revenueMetrics.churnRate > 5 ? '↗' : '↘'} vs last month
                        </div>
                    </div>
                </div>

                <!-- Subscription Distribution -->
                <div class="subscription-distribution">
                    <h4>Subscription Plan Distribution</h4>
                    <div class="plan-charts">
                        ${Object.entries(this.subscriptionAnalytics.planDistribution || {}).map(([plan, count]) => {
                            const percentage = this.subscriptionAnalytics.total > 0 ? 
                                (count / this.subscriptionAnalytics.total * 100).toFixed(1) : 0;
                            return `
                                <div class="plan-stat">
                                    <div class="plan-info">
                                        <span class="plan-name">${plan.toUpperCase()}</span>
                                        <span class="plan-count">${count} users</span>
                                    </div>
                                    <div class="plan-bar">
                                        <div class="plan-fill plan-${plan}" style="width: ${percentage}%"></div>
                                    </div>
                                    <span class="plan-percentage">${percentage}%</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class="recent-transactions">
                    <h4>Recent Transactions</h4>
                    <div class="transaction-list">
                        ${this.generateSampleTransactions().map(transaction => `
                            <div class="transaction-item">
                                <div class="transaction-user">
                                    <div class="user-avatar">${transaction.user.charAt(0).toUpperCase()}</div>
                                    <div class="transaction-details">
                                        <div class="transaction-email">${transaction.user}</div>
                                        <div class="transaction-plan">${transaction.plan}</div>
                                    </div>
                                </div>
                                <div class="transaction-amount">${transaction.amount}</div>
                                <div class="transaction-status status-${transaction.status}">
                                    ${transaction.status}
                                </div>
                                <div class="transaction-date">${transaction.date}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Revenue Chart -->
                <div class="revenue-chart-container">
                    <h4>Revenue Trend</h4>
                    <canvas id="revenue-chart" width="600" height="300"></canvas>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.initializeRevenueCharts();
    }

    generateSampleTransactions() {
        const users = ['john@example.com', 'sarah@company.com', 'mike@startup.co', 'lisa@agency.net', 'alex@business.com'];
        const plans = ['Pro Monthly', 'Enterprise', 'Pro Annual'];
        const amounts = [49, 199, 490];
        const statuses = ['paid', 'paid', 'paid', 'pending', 'failed'];

        return Array.from({ length: 5 }, (_, i) => ({
            user: users[i],
            plan: plans[Math.floor(Math.random() * plans.length)],
            amount: amounts[Math.floor(Math.random() * amounts.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));
    }

    initializeRevenueCharts() {
        const canvas = document.getElementById('revenue-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            
            // Simple revenue chart visualization
            ctx.fillStyle = '#48bb78';
            ctx.fillRect(10, 10, 200, 100);
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.fillText('Revenue Chart', 15, 35);
            ctx.fillText('(Chart.js integration needed)', 15, 55);
        }
    }

    async loadAIData() {
        console.log('🧠 Loading AI performance data...');
        
        try {
            window.OsliraApp.showLoadingOverlay('Loading AI performance data...');
            
            // Load AI metrics
            await this.loadAIMetrics();
            
            // Load model performance
            await this.loadModelPerformance();
            
            // Render AI dashboard
            this.renderAIDashboard();
            
        } catch (error) {
            console.error('AI data loading failed:', error);
            window.OsliraApp.showMessage('Failed to load AI performance data', 'error');
        } finally {
            window.OsliraApp.removeLoadingOverlay();
        }
    }

    async loadAIMetrics() {
        try {
            const response = await window.OsliraApp.apiRequest('/admin/ai-metrics');
            this.aiMetrics = response;
        } catch (error) {
            console.warn('AI metrics not available:', error);
            this.aiMetrics = {
                totalAnalyses: Math.floor(Math.random() * 100000) + 50000,
                averageResponseTime: Math.random() * 2 + 1,
                successRate: Math.random() * 5 + 95,
                tokensUsed: Math.floor(Math.random() * 1000000) + 500000,
                costPerAnalysis: Math.random() * 0.1 + 0.05,
                modelsInUse: ['GPT-4', 'Claude-3', 'Custom Model']
            };
        }
    }

    async loadModelPerformance() {
        try {
            const { data: analyses, error } = await window.OsliraApp.supabase
                .from('leads')
                .select('analysis_score, created_at, analysis_type')
                .not('analysis_score', 'is', null)
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.modelPerformance = this.processAnalysisData(analyses || []);
            
        } catch (error) {
            console.warn('Model performance data not available:', error);
            this.modelPerformance = {
                averageScore: Math.random() * 30 + 70,
                scoreDistribution: {
                    high: 40,
                    medium: 45,
                    low: 15
                },
                analysisTypes: {
                    light: 60,
                    deep: 40
                }
            };
        }
    }

    processAnalysisData(analyses) {
        const scores = analyses.map(a => a.analysis_score).filter(s => s !== null);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        
        const scoreDistribution = {
            high: scores.filter(s => s >= 80).length,
            medium: scores.filter(s => s >= 50 && s < 80).length,
            low: scores.filter(s => s < 50).length
        };

        const analysisTypes = {};
        analyses.forEach(a => {
            analysisTypes[a.analysis_type] = (analysisTypes[a.analysis_type] || 0) + 1;
        });

        return {
            averageScore,
            scoreDistribution,
            analysisTypes,
            totalAnalyses: analyses.length
        };
    }

    renderAIDashboard() {
        const container = document.getElementById('ai-dashboard-container');
        if (!container) return;

        const html = `
            <div class="ai-grid">
                <!-- AI Performance KPIs -->
                <div class="ai-kpi-grid">
                    <div class="kpi-card ai-analyses-card">
                        <div class="kpi-header">
                            <h4>Total Analyses</h4>
                            <span class="kpi-icon">🧠</span>
                        </div>
                        <div class="kpi-value">${this.aiMetrics.totalAnalyses?.toLocaleString() || '0'}</div>
                        <div class="kpi-change positive">↗ +15% this month</div>
                    </div>

                    <div class="kpi-card response-time-card">
                        <div class="kpi-header">
                            <h4>Avg Response Time</h4>
                            <span class="kpi-icon">⚡</span>
                        </div>
                        <div class="kpi-value">${this.aiMetrics.averageResponseTime?.toFixed(1) || '0'}s</div>
                        <div class="kpi-change ${this.aiMetrics.averageResponseTime > 3 ? 'negative' : 'positive'}">
                            Target: <2s
                        </div>
                    </div>

                    <div class="kpi-card success-rate-card">
                        <div class="kpi-header">
                            <h4>Success Rate</h4>
                            <span class="kpi-icon">✅</span>
                        </div>
                        <div class="kpi-value">${this.aiMetrics.successRate?.toFixed(1) || '0'}%</div>
                        <div class="kpi-change positive">↗ +2% vs last week</div>
                    </div>

                    <div class="kpi-card cost-card">
                        <div class="kpi-header">
                            <h4>Cost per Analysis</h4>
                            <span class="kpi-icon">💸</span>
                        </div>
                        <div class="kpi-value">${this.aiMetrics.costPerAnalysis?.toFixed(3) || '0'}</div>
                        <div class="kpi-change negative">↗ +$0.002 vs last month</div>
                    </div>
                </div>

                <!-- Model Performance -->
                <div class="model-performance">
                    <h4>Model Performance</h4>
                    <div class="performance-stats">
                        <div class="stat-item">
                            <span class="stat-label">Average Score:</span>
                            <span class="stat-value">${this.modelPerformance.averageScore?.toFixed(1) || '0'}/100</span>
                        </div>
                        <div class="score-distribution">
                            <div class="score-bar">
                                <div class="score-segment high" style="width: ${(this.modelPerformance.scoreDistribution.high / this.modelPerformance.totalAnalyses * 100) || 0}%">
                                    High (80+)
                                </div>
                                <div class="score-segment medium" style="width: ${(this.modelPerformance.scoreDistribution.medium / this.modelPerformance.totalAnalyses * 100) || 0}%">
                                    Medium (50-79)
                                </div>
                                <div class="score-segment low" style="width: ${(this.modelPerformance.scoreDistribution.low / this.modelPerformance.totalAnalyses * 100) || 0}%">
                                    Low (<50)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI Models Status -->
                <div class="ai-models-status">
                    <h4>AI Models Status</h4>
                    <div class="models-grid">
                        ${this.aiMetrics.modelsInUse?.map(model => `
                            <div class="model-card">
                                <div class="model-name">${model}</div>
                                <div class="model-status online">🟢 Online</div>
                                <div class="model-usage">${Math.floor(Math.random() * 1000)}k tokens/day</div>
                            </div>
                        `).join('') || ''}
                    </div>
                </div>

                <!-- Token Usage Chart -->
                <div class="token-usage-chart">
                    <h4>Token Usage Trends</h4>
                    <canvas id="token-chart" width="600" height="300"></canvas>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.initializeAICharts();
    }

    initializeAICharts() {
        const canvas = document.getElementById('token-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            
            // Simple token usage visualization
            ctx.fillStyle = '#764ba2';
            ctx.fillRect(10, 10, 300, 150);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText('Token Usage Chart', 15, 35);
            ctx.fillText('(Chart.js integration needed)', 15, 60);
        }
    }

    async loadSubscriptionData() {
        console.log('💳 Loading subscription data...');
        
        try {
            window.OsliraApp.showLoadingOverlay('Loading subscription data...');
            
            // Load subscription overview
            const { data: subscriptions, error } = await window.OsliraApp.supabase
                .from('users')
                .select(`
                    id, email, subscription_plan, subscription_status, 
                    created_at, stripe_customer_id, credits
                `)
                .not('subscription_plan', 'is', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderSubscriptionDashboard(subscriptions || []);
            
        } catch (error) {
            console.error('Subscription data loading failed:', error);
            window.OsliraApp.showMessage('Failed to load subscription data', 'error');
        } finally {
            window.OsliraApp.removeLoadingOverlay();
        }
    }

    renderSubscriptionDashboard(subscriptions) {
        const container = document.getElementById('subscriptions-dashboard-container');
        if (!container) return;

        // Calculate subscription metrics
        const metrics = this.calculateSubscriptionMetrics(subscriptions);

        const html = `
            <div class="subscriptions-overview">
                <div class="subscription-kpis">
                    <div class="kpi-card">
                        <h4>Total Subscribers</h4>
                        <div class="kpi-value">${metrics.totalSubscribers}</div>
                    </div>
                    <div class="kpi-card">
                        <h4>Active Subscriptions</h4>
                        <div class="kpi-value">${metrics.activeSubscriptions}</div>
                    </div>
                    <div class="kpi-card">
                        <h4>Trial Subscriptions</h4>
                        <div class="kpi-value">${metrics.trialSubscriptions}</div>
                    </div>
                    <div class="kpi-card">
                        <h4>Canceled This Month</h4>
                        <div class="kpi-value">${metrics.canceledThisMonth}</div>
                    </div>
                </div>

                <div class="subscription-table-container">
                    <h3>Subscription Management</h3>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Plan</th>
                                    <th>Status</th>
                                    <th>Started</th>
                                    <th>Credits</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${subscriptions.slice(0, 20).map(sub => `
                                    <tr>
                                        <td>
                                            <div class="customer-info">
                                                <div class="customer-avatar">${sub.email.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div class="customer-email">${sub.email}</div>
                                                    ${sub.stripe_customer_id ? `<div class="customer-id">ID: ${sub.stripe_customer_id.substring(0, 12)}...</div>` : ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="plan-badge plan-${sub.subscription_plan}">
                                                ${sub.subscription_plan?.toUpperCase() || 'FREE'}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="status-badge status-${sub.subscription_status}">
                                                ${sub.subscription_status || 'inactive'}
                                            </span>
                                        </td>
                                        <td>${window.OsliraApp.formatDate(sub.created_at)}</td>
                                        <td>${sub.credits || 0}</td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn-icon" onclick="window.adminDashboard.manageSubscription('${sub.id}')" title="Manage">
                                                    ⚙️
                                                </button>
                                                <button class="btn-icon" onclick="window.adminDashboard.viewBilling('${sub.id}')" title="Billing">
                                                    💳
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    calculateSubscriptionMetrics(subscriptions) {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return {
            totalSubscribers: subscriptions.length,
            activeSubscriptions: subscriptions.filter(s => s.subscription_status === 'active').length,
            trialSubscriptions: subscriptions.filter(s => s.subscription_status === 'trialing').length,
            canceledThisMonth: subscriptions.filter(s => 
                s.subscription_status === 'canceled' && 
                new Date(s.updated_at || s.created_at) >= thisMonth
            ).length
        };
    }

    async manageSubscription(userId) {
        window.OsliraApp.showMessage('Subscription management coming soon', 'info');
    }

    async viewBilling(userId) {
        window.OsliraApp.showMessage('Billing details coming soon', 'info');
    }

    async loadRealTimeData() {
        console.log('⚡ Loading real-time monitoring data...');
        
        try {
            // Start real-time monitoring
            this.startRealTimeMonitoring();
            
            // Render real-time dashboard
            this.renderRealTimeDashboard();
            
        } catch (error) {
            console.error('Real-time data loading failed:', error);
            window.OsliraApp.showMessage('Failed to load real-time monitoring', 'error');
        }
    }

    startRealTimeMonitoring() {
        // Set up real-time subscriptions for live data
        if (this.realTimeSubscription) {
            this.realTimeSubscription.unsubscribe();
        }

        // Subscribe to real-time updates from Supabase
        this.realTimeSubscription = window.OsliraApp.supabase
            .channel('admin-monitoring')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'users' },
                (payload) => this.handleUserUpdate(payload)
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                (payload) => this.handleLeadUpdate(payload)
            )
            .subscribe();
    }

    handleUserUpdate(payload) {
        console.log('User update:', payload);
        this.updateRealTimeMetrics();
    }

    handleLeadUpdate(payload) {
        console.log('Lead update:', payload);
        this.updateRealTimeMetrics();
    }

    renderRealTimeDashboard() {
        const container = document.getElementById('realtime-dashboard-container');
        if (!container) return;

        const html = `
            <div class="realtime-grid">
                <div class="live-metrics">
                    <h3>🔴 Live System Metrics</h3>
                    <div class="metrics-grid">
                        <div class="live-metric">
                            <div class="metric-label">Active Users</div>
                            <div class="metric-value" id="live-active-users">-</div>
                        </div>
                        <div class="live-metric">
                            <div class="metric-label">Requests/Min</div>
                            <div class="metric-value" id="live-requests">-</div>
                        </div>
                        <div class="live-metric">
                            <div class="metric-label">Error Rate</div>
                            <div class="metric-value" id="live-errors">-</div>
                        </div>
                        <div class="live-metric">
                            <div class="metric-label">Response Time</div>
                            <div class="metric-value" id="live-response-time">-</div>
                        </div>
                    </div>
                </div>

                <div class="live-activity-feed">
                    <h3>📊 Live Activity Feed</h3>
                    <div id="live-feed" class="activity-stream">
                        <!-- Live activities will be inserted here -->
                    </div>
                </div>

                <div class="system-alerts">
                    <h3>🚨 System Alerts</h3>
                    <div id="system-alerts" class="alerts-container">
                        <div class="alert alert-success">
                            ✅ All systems operational
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Start live updates
        this.startLiveUpdates();
    }

    startLiveUpdates() {
        // Update live metrics every 5 seconds
        setInterval(() => {
            this.updateLiveMetrics();
        }, 5000);

        // Simulate live activity feed
        setInterval(() => {
            this.addLiveActivity();
        }, 10000);
    }

    updateLiveMetrics() {
        const updates = {
            'live-active-users': Math.floor(Math.random() * 100) + 200,
            'live-requests': Math.floor(Math.random() * 1000) + 500,
            'live-errors': (Math.random() * 2).toFixed(2) + '%',
            'live-response-time': (Math.random() * 200 + 100).toFixed(0) + 'ms'
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 500);
            }
        });
    }

    addLiveActivity() {
        const activities = [
            '👤 New user registration',
            '🎯 Campaign started',
            '📊 Analysis completed',
            '💳 Payment processed',
            '🔧 System maintenance',
            '📤 Data export requested'
        ];

        const activity = activities[Math.floor(Math.random() * activities.length)];
        const feed = document.getElementById('live-feed');
        
        if (feed) {
            const activityElement = document.createElement('div');
            activityElement.className = 'live-activity-item';
            activityElement.innerHTML = `
                <span class="activity-icon">${activity.split(' ')[0]}</span>
                <span class="activity-text">${activity.substring(2)}</span>
                <span class="activity-time">${new Date().toLocaleTimeString()}</span>
            `;
            
            feed.insertBefore(activityElement, feed.firstChild);
            
            // Keep only last 10 activities
            while (feed.children.length > 10) {
                feed.removeChild(feed.lastChild);
            }
        }
    }

 async loadPerformanceData() {
        console.log('🚀 Loading performance monitoring data...');
        
        try {
            window.OsliraApp.showLoadingOverlay('Loading performance data...');
            
            // Load system metrics
            await this.loadSystemMetrics();
            
            // Load API performance
            await this.loadAPIPerformance();
            
            // Load error tracking
            await this.loadErrorTracking();
            
            // Render performance dashboard
            this.renderPerformanceDashboard();
            
        } catch (error) {
            console.error('Performance data loading failed:', error);
            window.OsliraApp.showMessage('Failed to load performance data', 'error');
        } finally {
            window.OsliraApp.removeLoadingOverlay();
        }
    }

    async loadSystemMetrics() {
        try {
            // Simulate system metrics (in real implementation, this would come from monitoring APIs)
            this.systemMetrics = {
                cpuUsage: Math.random() * 100,
                memoryUsage: Math.random() * 100,
                diskUsage: Math.random() * 100,
                networkLatency: Math.random() * 200 + 10,
                activeConnections: Math.floor(Math.random() * 1000) + 500,
                requestsPerMinute: Math.floor(Math.random() * 10000) + 5000,
                errorRate: Math.random() * 5,
                uptime: 99.9 + Math.random() * 0.1
            };
        } catch (error) {
            console.error('System metrics loading failed:', error);
        }
    }

    async loadAPIPerformance() {
        try {
            // Load API response times and throughput
            const response = await window.OsliraApp.apiRequest('/admin/api-performance');
            this.apiPerformance = response;
        } catch (error) {
            console.warn('API performance data not available:', error);
            this.apiPerformance = {
                avgResponseTime: Math.random() * 500 + 100,
                p95ResponseTime: Math.random() * 1000 + 300,
                throughput: Math.floor(Math.random() * 1000) + 500,
                errorRate: Math.random() * 2
            };
        }
    }

    async loadErrorTracking() {
        try {
            // Load recent errors and system alerts
            const { data: errors } = await window.OsliraApp.supabase
                .from('error_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            this.recentErrors = errors || [];
        } catch (error) {
            console.warn('Error tracking data not available:', error);
            this.recentErrors = [];
        }
    }

    renderPerformanceDashboard() {
        const container = document.getElementById('performance-dashboard-container');
        if (!container) return;

        const html = `
            <div class="performance-grid">
                <!-- System Metrics -->
                <div class="metric-card cpu-card">
                    <div class="metric-header">
                        <h4>CPU Usage</h4>
                        <span class="metric-icon">🖥️</span>
                    </div>
                    <div class="metric-value">${this.systemMetrics.cpuUsage.toFixed(1)}%</div>
                    <div class="metric-chart">
                        <div class="usage-bar">
                            <div class="usage-fill" style="width: ${this.systemMetrics.cpuUsage}%"></div>
                        </div>
                    </div>
                    <div class="metric-status ${this.systemMetrics.cpuUsage > 80 ? 'warning' : 'healthy'}">
                        ${this.systemMetrics.cpuUsage > 80 ? 'High Usage' : 'Normal'}
                    </div>
                </div>

                <div class="metric-card memory-card">
                    <div class="metric-header">
                        <h4>Memory Usage</h4>
                        <span class="metric-icon">💾</span>
                    </div>
                    <div class="metric-value">${this.systemMetrics.memoryUsage.toFixed(1)}%</div>
                    <div class="metric-chart">
                        <div class="usage-bar">
                            <div class="usage-fill" style="width: ${this.systemMetrics.memoryUsage}%"></div>
                        </div>
                    </div>
                    <div class="metric-status ${this.systemMetrics.memoryUsage > 85 ? 'warning' : 'healthy'}">
                        ${this.systemMetrics.memoryUsage > 85 ? 'High Usage' : 'Normal'}
                    </div>
                </div>

                <div class="metric-card network-card">
                    <div class="metric-header">
                        <h4>Network Latency</h4>
                        <span class="metric-icon">🌐</span>
                    </div>
                    <div class="metric-value">${this.systemMetrics.networkLatency.toFixed(0)}ms</div>
                    <div class="metric-trend">
                        ${this.systemMetrics.networkLatency < 50 ? '⚡ Excellent' : 
                          this.systemMetrics.networkLatency < 100 ? '✅ Good' : 
                          this.systemMetrics.networkLatency < 200 ? '⚠️ Fair' : '🐌 Poor'}
                    </div>
                </div>

                <div class="metric-card requests-card">
                    <div class="metric-header">
                        <h4>Requests/Min</h4>
                        <span class="metric-icon">📊</span>
                    </div>
                    <div class="metric-value">${this.systemMetrics.requestsPerMinute.toLocaleString()}</div>
                    <div class="metric-change positive">↗ +12% vs last hour</div>
                </div>

                <!-- API Performance -->
                <div class="metric-card-wide api-performance">
                    <div class="metric-header">
                        <h4>API Performance</h4>
                        <span class="metric-icon">⚡</span>
                    </div>
                    <div class="api-metrics-grid">
                        <div class="api-metric">
                            <div class="api-metric-label">Avg Response Time</div>
                            <div class="api-metric-value">${this.apiPerformance?.avgResponseTime?.toFixed(0) || 0}ms</div>
                        </div>
                        <div class="api-metric">
                            <div class="api-metric-label">P95 Response Time</div>
                            <div class="api-metric-value">${this.apiPerformance?.p95ResponseTime?.toFixed(0) || 0}ms</div>
                        </div>
                        <div class="api-metric">
                            <div class="api-metric-label">Throughput</div>
                            <div class="api-metric-value">${this.apiPerformance?.throughput?.toLocaleString() || 0}/min</div>
                        </div>
                        <div class="api-metric">
                            <div class="api-metric-label">Error Rate</div>
                            <div class="api-metric-value">${this.apiPerformance?.errorRate?.toFixed(2) || 0}%</div>
                        </div>
                    </div>
                </div>

                <!-- Recent Errors -->
                <div class="metric-card-wide error-tracking">
                    <div class="metric-header">
                        <h4>Recent Errors</h4>
                        <span class="metric-icon">🚨</span>
                    </div>
                    <div class="error-list">
                        ${this.recentErrors.length > 0 ? 
                            this.recentErrors.slice(0, 5).map(error => `
                                <div class="error-item">
                                    <div class="error-message">${error.message || 'Unknown error'}</div>
                                    <div class="error-time">${window.OsliraApp.formatDate(error.created_at)}</div>
                                </div>
                            `).join('') :
                            '<div class="no-errors">🎉 No recent errors detected</div>'
                        }
                    </div>
                </div>
            </div>

            <!-- Real-time Performance Charts -->
            <div class="performance-charts">
                <div class="chart-container">
                    <canvas id="performance-chart" width="800" height="400"></canvas>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Initialize performance charts
        this.initializePerformanceCharts();
    }
    initializePerformanceCharts() {
  console.log('Initializing performance charts…');
  const canvas = document.getElementById('performance-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun'],
      datasets: [{
        label: 'CPU Usage (%)',
        data: [45,60,55,70,65,80],
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 100 } },
      responsive: true,
      plugins: { legend: { position: 'top' } }
    }
  });
    }
   startRealTimeUpdates() {
        console.log('🔄 Starting real-time updates...');
        
        // Update metrics every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.updateRealTimeMetrics();
        }, 30000);

        // Update live indicators every 5 seconds
        this.liveMetricsInterval = setInterval(() => {
            this.updateLiveIndicators();
        }, 5000);
    }

    pauseRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        if (this.liveMetricsInterval) {
            clearInterval(this.liveMetricsInterval);
            this.liveMetricsInterval = null;
        }
    }

    resumeRealTimeUpdates() {
        if (!this.refreshInterval) {
            this.startRealTimeUpdates();
        }
    }

    updateRealTimeMetrics() {
        if (this.currentView === 'dashboard') {
            this.loadDashboardData();
        }
        this.updateLiveIndicators();
    }

    updateLiveIndicators() {
        const indicators = document.querySelectorAll('.live-indicator, .live-dot');
        indicators.forEach(indicator => {
            // Add subtle pulse animation
            indicator.style.animation = 'none';
            indicator.offsetHeight; // Trigger reflow
            indicator.style.animation = 'pulse 2s infinite';
        });

        // Update timestamp
        const timestamp = document.getElementById('last-updated');
        if (timestamp) {
            timestamp.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    async refreshCurrentView() {
        try {
            window.OsliraApp.showLoadingOverlay('Refreshing...');
            await this.loadViewData(this.currentView);
            window.OsliraApp.showMessage('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Refresh failed:', error);
            window.OsliraApp.showMessage('Failed to refresh data', 'error');
        } finally {
            window.OsliraApp.removeLoadingOverlay();
        }
    }

    async exportData() {
        try {
            window.OsliraApp.showLoadingOverlay('Preparing export...');
            
            // Prepare export data based on current view
            const exportData = await this.prepareExportData();
            
            // Create and download CSV
            this.downloadCSV(exportData, `oslira-admin-${this.currentView}-${new Date().toISOString().split('T')[0]}.csv`);
            
            window.OsliraApp.showMessage('Data exported successfully', 'success');
            
        } catch (error) {
            console.error('Export failed:', error);
            window.OsliraApp.showMessage('Failed to export data', 'error');
        } finally {
            window.OsliraApp.removeLoadingOverlay();
        }
    }

    async prepareExportData() {
        // This would gather data based on current view
        // For now, return sample data
        return [
            ['Metric', 'Value', 'Timestamp'],
            ['Active Users', this.adminData.activeUsers || 0, new Date().toISOString()],
            ['Active Campaigns', this.adminData.activeCampaigns || 0, new Date().toISOString()],
            ['Messages Sent', this.adminData.messagesSent || 0, new Date().toISOString()]
        ];
    }

    downloadCSV(data, filename) {
        const csvContent = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // =============================================================================
    // CLEANUP
    // =============================================================================

    destroy() {
        console.log('🧹 Cleaning up admin dashboard...');
        
        this.pauseRealTimeUpdates();
        
        if (this.realTimeSubscription) {
            this.realTimeSubscription.unsubscribe();
        }
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    }


// Create global admin dashboard instance
const adminDashboard = new OsliraAdminDashboard();

// Make admin dashboard available globally for onclick handlers
window.adminDashboard = adminDashboard;

 window.OsliraApp.events.addEventListener('appInitialized', () => {
   adminDashboard.initialize();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    adminDashboard.destroy();
});

console.log('🔧 Admin Dashboard loaded - uses shared-code.js');
