//public/pages/dashboard/modules/business/business-manager.js

/**
 * OSLIRA BUSINESS MANAGER MODULE
 * Handles business profile loading, switching, and modal management
 * Extracted from dashboard.js - maintains exact functionality
 */
class BusinessManager {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
        this.stateManager = container.get('stateManager');
        this.osliraAuth = container.get('osliraAuth');
        
        // Business data cache
        this.businessCache = new Map();
        this.lastBusinessRefresh = null;
        
        console.log('🚀 [BusinessManager] Initialized');
    }

    get supabase() {
    return this.container.get('supabase');
}
    
    async init() {
        // Listen for auth changes
        this.eventBus.on('auth:changed', this.handleAuthChange.bind(this));
        
// Business loading will be controlled by TimingManager
if (this.osliraAuth?.user) {
    console.log('👤 [BusinessManager] User available at init:', this.osliraAuth.user.email);
    console.log('📋 [BusinessManager] Business loading deferred to TimingManager');
} else {
    console.warn('⚠️ [BusinessManager] No user data available at init');
}
        
        console.log('✅ [BusinessManager] Event listeners initialized');
    }
    
    // ===============================================================================
    // BUSINESS LOADING - EXTRACTED FROM ORIGINAL FUNCTIONALITY
    // ===============================================================================
    
    async loadBusinesses() {
        try {
            console.log('🏢 [BusinessManager] Loading business profiles...');
            
            const user = this.osliraAuth?.user;
            if (!this.supabase || !user) {
                console.warn('⚠️ [BusinessManager] No user or database connection');
                return [];
            }
            
            // Check cache first
            const cached = this.businessCache.get(user.id);
            if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
                console.log('📋 [BusinessManager] Using cached business data');
                this.stateManager.setState('businesses', cached.businesses);
                return cached.businesses;
            }
            
            // Load from database
            const { data: businesses, error } = await this.supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
                
            if (error) {
                console.error('❌ [BusinessManager] Failed to load businesses:', error);
                throw error;
            }
            
            console.log(`📊 [BusinessManager] Loaded ${businesses?.length || 0} business profiles`);
            
            // Cache the result
            this.businessCache.set(user.id, {
                businesses: businesses || [],
                timestamp: Date.now()
            });
            
            // Update state
            this.stateManager.setState('businesses', businesses || []);
            
            // Set active business if not already set
            await this.setActiveBusinessFromStorage(businesses || []);
            
// Update sidebar selector after loading
this.updateSidebarBusinessSelector();

// Emit loaded event
this.eventBus.emit(DASHBOARD_EVENTS.BUSINESS_LOADED, {
    businesses,
    count: businesses.length
});

console.log(`✅ [BusinessManager] Loaded ${businesses.length} business profiles`);
return businesses;
            
        } catch (error) {
            console.error('❌ [BusinessManager] Error loading businesses:', error);
            this.stateManager.setState('businesses', []);
            this.eventBus.emit(DASHBOARD_EVENTS.ERROR, {
                source: 'business',
                error: error.message
            });
            return [];
        }
    }
    
    async setActiveBusinessFromStorage(businesses) {
        // Try to restore from localStorage
        const savedBusinessId = localStorage.getItem('selectedBusinessId');
        let selectedBusiness = null;
        
        if (savedBusinessId && businesses.length > 0) {
            selectedBusiness = businesses.find(b => b.id === savedBusinessId);
        }
        
        // Fallback to first business
        if (!selectedBusiness && businesses.length > 0) {
            selectedBusiness = businesses[0];
            localStorage.setItem('selectedBusinessId', selectedBusiness.id);
        }
        
if (selectedBusiness) {
    this.stateManager.setState('selectedBusiness', selectedBusiness);
    
    // Update auth manager with current business
    if (window.OsliraAuth) {
        window.OsliraAuth.business = selectedBusiness;
    }
    
    console.log('✅ [BusinessManager] Active business set:', selectedBusiness.business_name);
    
    // Update sidebar business selector UI
    this.updateSidebarBusinessSelector();
    
    this.eventBus.emit(DASHBOARD_EVENTS.BUSINESS_CHANGED, {
        business: selectedBusiness,
        businessId: selectedBusiness.id
    });
}
    }
    
    // ===============================================================================
    // BUSINESS SWITCHING
    // ===============================================================================
    
    async switchBusiness(businessId) {
        try {
            console.log('🔄 [BusinessManager] Switching to business:', businessId);
            
            const businesses = this.stateManager.getState('businesses');
            const business = businesses.find(b => b.id === businessId);
            
            if (!business) {
                throw new Error('Business not found');
            }
            
// Update state
this.stateManager.setState('selectedBusiness', business);

// Persist selection
localStorage.setItem('selectedBusinessId', businessId);

// Update auth manager with selected business
if (window.OsliraAuth) {
    window.OsliraAuth.business = business;
}

// Emit business change event
this.eventBus.emit(DASHBOARD_EVENTS.BUSINESS_CHANGED, {
                business,
                businessId,
                previousBusinessId: this.stateManager.getState('selectedBusiness')?.id
            });
            
            console.log('✅ [BusinessManager] Business switched to:', business.business_name);
            
            return business;
            
        } catch (error) {
            console.error('❌ [BusinessManager] Failed to switch business:', error);
            this.eventBus.emit(DASHBOARD_EVENTS.ERROR, {
                source: 'business',
                error: error.message
            });
            throw error;
        }
    }
    
    // ===============================================================================
    // MODAL MANAGEMENT - EXTRACTED FROM ORIGINAL
    // ===============================================================================
    
    async loadBusinessProfilesForModal() {
        try {
            console.log('📋 [BusinessManager] Loading business profiles for modal...');
            
            // Get business select element
            const businessSelect = document.getElementById('business-id');
            if (!businessSelect) {
                console.warn('⚠️ [BusinessManager] Business select element not found');
                return;
            }
            
            // Show loading state
            businessSelect.innerHTML = '<option value="">Loading businesses...</option>';
            businessSelect.disabled = true;
            
            // Load businesses if not already loaded
            let businesses = this.stateManager.getState('businesses');
            if (!businesses || businesses.length === 0) {
                businesses = await this.loadBusinesses();
            }
            
            // Populate dropdown
            if (businesses.length === 0) {
                businessSelect.innerHTML = '<option value="">No business profiles found</option>';
                businessSelect.disabled = true;
                console.warn('⚠️ [BusinessManager] No business profiles available');
                return;
            }
            
            // Build options HTML
            const optionsHTML = businesses.map(business => 
                `<option value="${business.id}">${business.business_name || business.name || 'Unnamed Business'}</option>`
            ).join('');
            
businessSelect.innerHTML = optionsHTML;
            
            // Auto-select current business
            const currentBusiness = this.stateManager.getState('selectedBusiness');
            if (currentBusiness) {
                businessSelect.value = currentBusiness.id;
            }
            
            // Enable dropdown
            businessSelect.disabled = false;
            
            console.log('✅ [BusinessManager] Business profiles loaded for modal');
            
        } catch (error) {
            console.error('❌ [BusinessManager] Failed to load business profiles for modal:', error);
            
            const businessSelect = document.getElementById('business-id');
            if (businessSelect) {
                businessSelect.innerHTML = '<option value="">Error loading profiles</option>';
                businessSelect.disabled = true;
            }
        }
    }
    
    async loadBusinessProfilesForBulkModal() {
        try {
            const bulkBusinessSelect = document.getElementById('bulk-business-id');
            if (!bulkBusinessSelect) return;
            
            console.log('📋 [BusinessManager] Loading business profiles for bulk modal...');
            
            // Show loading
            bulkBusinessSelect.innerHTML = '<option value="">Loading...</option>';
            bulkBusinessSelect.disabled = true;
            
            // Load businesses
            let businesses = this.stateManager.getState('businesses');
            if (!businesses || businesses.length === 0) {
                businesses = await this.loadBusinesses();
            }
            
            if (businesses.length === 0) {
                bulkBusinessSelect.innerHTML = '<option value="">No business profiles found</option>';
                return;
            }
            
            // Populate options
            const optionsHTML = businesses.map(business => 
                `<option value="${business.id}">${business.business_name || business.name || 'Unnamed Business'}</option>`
            ).join('');
            
businessSelect.innerHTML = optionsHTML;
            
            // Auto-select current business
            const currentBusiness = this.stateManager.getState('selectedBusiness');
            if (currentBusiness) {
                bulkBusinessSelect.value = currentBusiness.id;
            }
            
            bulkBusinessSelect.disabled = false;
            
            console.log('✅ [BusinessManager] Business profiles loaded for bulk modal');
            
        } catch (error) {
            console.error('❌ [BusinessManager] Failed to load business profiles for bulk modal:', error);
            
            const bulkBusinessSelect = document.getElementById('bulk-business-id');
            if (bulkBusinessSelect) {
                bulkBusinessSelect.innerHTML = '<option value="">Error loading profiles</option>';
                bulkBusinessSelect.disabled = true;
            }
        }
    }
    
    // ===============================================================================
    // BUSINESS PROFILE UTILITIES
    // ===============================================================================
    
    getCurrentBusiness() {
        return this.stateManager.getState('selectedBusiness');
    }
    
    getBusinessById(businessId) {
        const businesses = this.stateManager.getState('businesses');
        return businesses.find(b => b.id === businessId);
    }
    
    getAllBusinesses() {
        return this.stateManager.getState('businesses') || [];
    }
    
    setDefaultBusinessProfile() {
        const businessSelect = document.getElementById('business-id');
        if (businessSelect && businessSelect.value) {
            localStorage.setItem('selectedBusinessId', businessSelect.value);
            this.osliraAuth?.showMessage('Default business profile saved!', 'success');
            
            console.log('✅ [BusinessManager] Default business profile saved:', businessSelect.value);
        }
    }
    
    // ===============================================================================
    // BUSINESS VALIDATION & DEBUGGING
    // ===============================================================================
    
    async debugBusinessProfiles() {
        console.log('🔍 [BusinessManager] Debug business profiles...');
        
        const user = this.osliraAuth?.user;
        console.log('Debug state:', {
            hasSupabase: !!this.supabase,
            hasUser: !!user,
            userId: user?.id
        });
        
        if (!this.supabase || !user) {
            console.log('❌ [BusinessManager] No auth available');
            return;
        }
        
        try {
            // Test query
            const { data, error, count } = await this.supabase
                .from('business_profiles')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id);
                
            console.log('📊 [BusinessManager] Business profiles debug result:', {
                data,
                error,
                count,
                query: `business_profiles where user_id = ${user.id}`
            });
            
            if (error) {
                console.error('❌ [BusinessManager] Query error:', error);
            }
        } catch (error) {
            console.error('❌ [BusinessManager] Debug failed:', error);
        }
    }
    
    validateBusinessSetup() {
        const businesses = this.stateManager.getState('businesses');
        const selectedBusiness = this.stateManager.getState('selectedBusiness');
        
        const validation = {
            hasBusinesses: businesses && businesses.length > 0,
            hasSelectedBusiness: !!selectedBusiness,
            businessCount: businesses?.length || 0,
            selectedBusinessName: selectedBusiness?.business_name || 'None',
            isValid: false
        };
        
        validation.isValid = validation.hasBusinesses && validation.hasSelectedBusiness;
        
        console.log('🔍 [BusinessManager] Business setup validation:', validation);
        return validation;
    }
    
    // ===============================================================================
    // BUSINESS CREATION SUPPORT
    // ===============================================================================
    
    async createBusinessProfile(businessData) {
        try {
            console.log('🏢 [BusinessManager] Creating new business profile...');
            
            const user = this.osliraAuth?.user;
            if (!this.supabase || !user) {
                throw new Error('Authentication required');
            }
            
            // Add user_id to business data
            const profileData = {
                ...businessData,
                user_id: user.id,
                created_at: new Date().toISOString()
            };
            
            const { data: business, error } = await this.supabase
                .from('business_profiles')
                .insert([profileData])
                .select()
                .single();
                
            if (error) {
                throw error;
            }
            
            console.log('✅ [BusinessManager] Business profile created:', business);
            
            // Refresh businesses list
            await this.loadBusinesses();
            
            // Set as active business
            await this.switchBusiness(business.id);
            
            return business;
            
        } catch (error) {
            console.error('❌ [BusinessManager] Failed to create business profile:', error);
            throw error;
        }
    }
    
    // ===============================================================================
    // UI HELPERS
    // ===============================================================================
    
    renderBusinessSelector(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const businesses = this.stateManager.getState('businesses') || [];
        const currentBusiness = this.stateManager.getState('selectedBusiness');
        
        const selectHTML = `
            <select id="${options.selectId || 'business-selector'}" 
                    class="${options.className || 'business-select'}"
                    onchange="businessManager.switchBusiness(this.value)">
                ${businesses.length === 0 
                    ? '<option value="">No business profiles available</option>'
                    : businesses.map(business => `
                        <option value="${business.id}" 
                                ${business.id === currentBusiness?.id ? 'selected' : ''}>
                            ${business.business_name || business.name || 'Unnamed Business'}
                        </option>
                    `).join('')
                }
            </select>
        `;
        
        container.innerHTML = selectHTML;
    }
    
updateBusinessIndicators() {
    // Update any business name displays
    const indicators = document.querySelectorAll('.current-business-name');
    const currentBusiness = this.stateManager.getState('selectedBusiness');
    
    indicators.forEach(indicator => {
        indicator.textContent = currentBusiness?.business_name || 'No Business Selected';
    });
    
    // Update business profile badges
    const badges = document.querySelectorAll('.business-badge');
    badges.forEach(badge => {
        badge.style.display = currentBusiness ? 'inline-block' : 'none';
        badge.textContent = currentBusiness?.business_name || '';
    });
    
    // Update sidebar selector
    this.updateSidebarBusinessSelector();
}

updateSidebarBusinessSelector() {
    const businessSelect = document.getElementById('sidebar-business-select');
    if (!businessSelect) {
        // Retry after sidebar is rendered
        setTimeout(() => {
            const retrySelect = document.getElementById('sidebar-business-select');
            if (retrySelect) {
                this.populateBusinessSelector(retrySelect);
            } else {
                console.warn('⚠️ [BusinessManager] Sidebar business select element not found after retry');
            }
        }, 500);
        return;
    }
    this.populateBusinessSelector(businessSelect);
}

populateBusinessSelector(businessSelect) {
    const businesses = this.stateManager.getState('businesses') || [];
    const currentBusiness = this.stateManager.getState('selectedBusiness');

    if (businesses.length === 0) {
        businessSelect.innerHTML = '<option value="">No business profiles available</option>';
        businessSelect.disabled = true;
        return;
    }

    // Build options HTML
    const optionsHTML = businesses.map(business => 
        `<option value="${business.id}" ${business.id === currentBusiness?.id ? 'selected' : ''}>
            ${business.business_name || business.name || 'Unnamed Business'}
        </option>`
    ).join('');

businessSelect.innerHTML = optionsHTML;

    // Set current business as selected
    if (currentBusiness) {
        businessSelect.value = currentBusiness.id;
    }

    businessSelect.disabled = false;

    // Add change handler if not already added
    if (!businessSelect.hasAttribute('data-handler-added')) {
        businessSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.switchBusiness(e.target.value);
            }
        });
        businessSelect.setAttribute('data-handler-added', 'true');
    }

    console.log('✅ [BusinessManager] Sidebar business selector updated');
}
    
    // ===============================================================================
    // EVENT HANDLERS
    // ===============================================================================
    
    handleAuthChange(authData) {
        if (authData.user) {
            console.log('🔐 [BusinessManager] User authenticated, loading businesses');
            this.loadBusinesses();
        } else {
            console.log('🔐 [BusinessManager] User logged out, clearing business data');
            this.clearBusinessData();
        }
    }
    
    // ===============================================================================
    // CACHE & CLEANUP
    // ===============================================================================
    
    clearBusinessData() {
        this.stateManager.batchUpdate({
            'businesses': [],
            'selectedBusiness': null
        });
        
        this.businessCache.clear();
        this.lastBusinessRefresh = null;
        
// Clear localStorage
localStorage.removeItem('selectedBusinessId');

// Clear business from auth manager
if (window.OsliraAuth) {
    window.OsliraAuth.business = null;
    window.OsliraAuth.businesses = [];
}
    }
    
    refreshBusinessCache() {
        this.businessCache.clear();
        return this.loadBusinesses();
    }
    
    getBusinessStats() {
        const businesses = this.stateManager.getState('businesses') || [];
        const currentBusiness = this.stateManager.getState('selectedBusiness');
        
        return {
            total: businesses.length,
            hasSelected: !!currentBusiness,
            selectedId: currentBusiness?.id || null,
            selectedName: currentBusiness?.business_name || null,
            lastRefresh: this.lastBusinessRefresh
        };
    }
    
    async cleanup() {
        console.log('🧹 [BusinessManager] Cleaning up...');
        this.businessCache.clear();
        this.lastBusinessRefresh = null;
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BusinessManager };
} else {
    window.BusinessManager = BusinessManager;
}
