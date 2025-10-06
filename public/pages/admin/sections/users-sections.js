// =============================================================================
// USERS SECTION - User Management
// =============================================================================

class UsersSection {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.users = [];
        this.pagination = {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0
        };
        this.searchQuery = '';
        this.searchTimeout = null;
        
        console.log('👥 [UsersSection] Initialized');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async initialize(container) {
        this.container = container;
        
        try {
            await this.loadUsers();
            this.render();
            this.attachEventListeners();
            
            console.log('✅ [UsersSection] Section ready');
            
        } catch (error) {
            console.error('❌ [UsersSection] Initialization failed:', error);
            this.renderError(error.message);
        }
    }
    
    async refresh() {
        console.log('🔄 [UsersSection] Refreshing data...');
        await this.loadUsers();
        this.render();
        this.attachEventListeners();
    }
    
    // =========================================================================
    // DATA LOADING
    // =========================================================================
    
    async loadUsers() {
        try {
            const { page, limit } = this.pagination;
            const response = await window.OsliraAPI.get(`/admin/users?page=${page}&limit=${limit}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load users');
            }
            
            this.users = response.data.users;
            this.pagination = response.data.pagination;
            
            console.log('✅ [UsersSection] Users loaded:', this.users.length);
            
        } catch (error) {
            console.error('❌ [UsersSection] Users loading failed:', error);
            throw error;
        }
    }
    
    async searchUsers(query) {
        if (!query || query.length < 2) {
            await this.loadUsers();
            return;
        }
        
        try {
            const response = await window.OsliraAPI.get(`/admin/users/search?q=${encodeURIComponent(query)}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Search failed');
            }
            
            this.users = response.data.users;
            this.pagination.total = this.users.length;
            
            console.log('✅ [UsersSection] Search results:', this.users.length);
            
        } catch (error) {
            console.error('❌ [UsersSection] Search failed:', error);
            this.eventBus.emit('admin:show-toast', {
                message: 'Search failed: ' + error.message,
                type: 'error'
            });
        }
    }
    
    // =========================================================================
    // RENDERING
    // =========================================================================
    
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <!-- Section Header -->
            <div class="admin-section-header">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">User Management</h1>
                    <p class="text-slate-600 mt-1">Manage users, credits, and permissions</p>
                </div>
                <button onclick="window.AdminCore.refreshCurrentSection()" class="btn-secondary">
                    <span class="mr-2">🔄</span>
                    Refresh
                </button>
            </div>
            
            <!-- Search Bar -->
            <div class="admin-search-bar">
                <input 
                    type="text" 
                    id="user-search-input"
                    class="admin-search-input" 
                    placeholder="Search by email, name, or user ID..."
                    value="${this.searchQuery}"
                >
                <button class="admin-search-button">
                    <span>🔍</span>
                </button>
            </div>
            
            <!-- Users Table -->
            <div class="admin-card">
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Created</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Credits</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.users.length > 0 ? this.renderUserRows() : this.renderEmptyState()}
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                ${this.renderPagination()}
            </div>
        `;
    }
    
    renderUserRows() {
        return this.users.map(user => {
            const subscription = user.subscriptions?.[0];
            const credits = subscription?.credits_remaining || 0;
            const createdDate = new Date(user.created_at).toLocaleDateString();
            
            return `
                <tr class="admin-table-row" data-user-id="${user.id}">
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar">${user.full_name?.charAt(0).toUpperCase() || 'U'}</div>
                            <div>
                                <div class="font-semibold text-slate-900">${user.full_name || 'Unknown'}</div>
                                <div class="text-sm text-slate-600">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="text-sm text-slate-600">${createdDate}</span>
                    </td>
                    <td>
                        ${user.is_admin 
                            ? '<span class="badge badge-purple">Admin</span>' 
                            : '<span class="badge badge-gray">User</span>'}
                    </td>
                    <td>
                        ${user.is_suspended 
                            ? '<span class="badge badge-red">Suspended</span>' 
                            : '<span class="badge badge-green">Active</span>'}
                    </td>
                    <td>
                        <span class="font-semibold ${credits < 10 ? 'text-red-600' : 'text-slate-900'}">
                            ${credits}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button 
                                class="action-btn action-btn-view" 
                                onclick="window.UsersSection.viewUser('${user.id}')"
                                title="View Details">
                                👁️
                            </button>
                            <button 
                                class="action-btn action-btn-edit" 
                                onclick="window.UsersSection.editCredits('${user.id}', ${credits})"
                                title="Modify Credits">
                                💳
                            </button>
                            <button 
                                class="action-btn action-btn-admin" 
                                onclick="window.UsersSection.toggleAdmin('${user.id}', ${user.is_admin})"
                                title="Toggle Admin">
                                🛡️
                            </button>
                            <button 
                                class="action-btn action-btn-suspend" 
                                onclick="window.UsersSection.toggleSuspension('${user.id}', ${user.is_suspended})"
                                title="${user.is_suspended ? 'Unsuspend' : 'Suspend'}">
                                ${user.is_suspended ? '✅' : '🚫'}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    renderEmptyState() {
        return `
            <tr>
                <td colspan="6" class="text-center py-12">
                    <div class="text-slate-400 text-lg">
                        ${this.searchQuery 
                            ? '🔍 No users found matching your search' 
                            : '👥 No users yet'}
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderPagination() {
        if (this.searchQuery || this.pagination.totalPages <= 1) {
            return '';
        }
        
        const { page, totalPages } = this.pagination;
        
        return `
            <div class="admin-pagination">
                <button 
                    class="pagination-btn ${page === 1 ? 'disabled' : ''}"
                    ${page === 1 ? 'disabled' : ''}
                    onclick="window.UsersSection.goToPage(${page - 1})">
                    ← Previous
                </button>
                
                <span class="pagination-info">
                    Page ${page} of ${totalPages}
                </span>
                
                <button 
                    class="pagination-btn ${page === totalPages ? 'disabled' : ''}"
                    ${page === totalPages ? 'disabled' : ''}
                    onclick="window.UsersSection.goToPage(${page + 1})">
                    Next →
                </button>
            </div>
        `;
    }
    
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="admin-error-state">
                <div class="error-icon">⚠️</div>
                <h3 class="text-xl font-semibold text-slate-900 mb-2">Failed to Load Users</h3>
                <p class="text-slate-600 mb-4">${message}</p>
                <button onclick="window.AdminCore.refreshCurrentSection()" class="btn-primary">
                    Try Again
                </button>
            </div>
        `;
    }
    
    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    
    attachEventListeners() {
        const searchInput = document.getElementById('user-search-input');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                this.searchQuery = query;
                
                // Debounce search
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.searchUsers(query).then(() => {
                        this.render();
                        this.attachEventListeners();
                    });
                }, 300);
            });
        }
    }
    
    // =========================================================================
    // USER ACTIONS
    // =========================================================================
    
    async viewUser(userId) {
        console.log('👁️ [UsersSection] View user:', userId);
        
        try {
            const response = await window.OsliraAPI.get(`/admin/users/${userId}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load user details');
            }
            
            // Show user details in modal (to be implemented)
            this.showUserModal(response.data);
            
        } catch (error) {
            console.error('❌ [UsersSection] View user failed:', error);
            this.eventBus.emit('admin:show-toast', {
                message: 'Failed to load user details',
                type: 'error'
            });
        }
    }
    
    async editCredits(userId, currentCredits) {
        const newAmount = prompt(`Enter new credit amount for user:\n\nCurrent: ${currentCredits} credits`, currentCredits);
        
        if (newAmount === null) return;
        
        const amount = parseInt(newAmount);
        
        if (isNaN(amount) || amount < 0) {
            alert('Please enter a valid number');
            return;
        }
        
        const reason = prompt('Reason for credit adjustment:', 'Manual admin adjustment');
        
        if (!reason) return;
        
        try {
            const response = await window.OsliraAPI.post(`/admin/users/${userId}/update-credits`, {
                amount,
                reason
            });
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to update credits');
            }
            
            this.eventBus.emit('admin:show-toast', {
                message: `Credits updated successfully to ${amount}`,
                type: 'success'
            });
            
            await this.refresh();
            
        } catch (error) {
            console.error('❌ [UsersSection] Update credits failed:', error);
            this.eventBus.emit('admin:show-toast', {
                message: 'Failed to update credits: ' + error.message,
                type: 'error'
            });
        }
    }
    
    async toggleAdmin(userId, currentStatus) {
        const action = currentStatus ? 'revoke admin access from' : 'grant admin access to';
        
        if (!confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }
        
        try {
            const response = await window.OsliraAPI.post(`/admin/users/${userId}/toggle-admin`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to toggle admin status');
            }
            
            this.eventBus.emit('admin:show-toast', {
                message: response.data.message,
                type: 'success'
            });
            
            await this.refresh();
            
        } catch (error) {
            console.error('❌ [UsersSection] Toggle admin failed:', error);
            this.eventBus.emit('admin:show-toast', {
                message: 'Failed to toggle admin status: ' + error.message,
                type: 'error'
            });
        }
    }
    
    async toggleSuspension(userId, currentStatus) {
        const action = currentStatus ? 'unsuspend' : 'suspend';
        
        if (!confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }
        
        try {
            const response = await window.OsliraAPI.post(`/admin/users/${userId}/suspend`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to toggle suspension');
            }
            
            this.eventBus.emit('admin:show-toast', {
                message: response.data.message,
                type: 'success'
            });
            
            await this.refresh();
            
        } catch (error) {
            console.error('❌ [UsersSection] Toggle suspension failed:', error);
            this.eventBus.emit('admin:show-toast', {
                message: 'Failed to toggle suspension: ' + error.message,
                type: 'error'
            });
        }
    }
    
    showUserModal(userData) {
        // TODO: Implement modal with full user details
        console.log('User details:', userData);
        alert('User details modal coming soon!\n\nUser: ' + userData.user.email);
    }
    
    async goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages) return;
        
        this.pagination.page = page;
        await this.loadUsers();
        this.render();
        this.attachEventListeners();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================

window.UsersSection = UsersSection;

console.log('📦 [UsersSection] Module loaded');
