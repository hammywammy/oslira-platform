//public/pages/dashboard/modules/business/business-manager.js

/**
 * OSLIRA BUSINESS MANAGER MODULE
 * Handles business profile loading, switching, and modal management
 * Extracted from dashboard.js - maintains exact functionality
 * 
 * ✅ FIXED: State keys standardized to canonical structure
 * - 'businesses' → 'business.all'
 * - 'selectedBusiness' → 'business.selected'
 */
class BusinessManager {
    constructor() {
        // Use global window objects directly (no container)
        this.eventBus = window.EventBus || window.OsliraEventBus;
        this.stateManager = window.StateManager || window.OsliraStateManager;
        this.osliraAuth = window.OsliraAuth;
        
        // Business data cache
        this.businessCache = new Map();
        this.lastBusinessRefresh = null;
        
        console.log('🚀 [BusinessManager] Initialized');
    }

    get supabase() {
        return this.osliraAuth?.supabase || window.OsliraAuth?.supabase;
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
                // ✅ FIX: Use canonical state key
                this.stateManager.setState('business.all', cached.businesses);
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
            
            // ✅ FIX: Use canonical state key
            this.stateManager.setState('business.all', businesses || []);
            
            // Set active business if not already set
            await this.setActiveBusinessFromStorage(businesses || []);
            
            // ✅ REMOVED: updateSidebarBusinessSelector() - handled by SidebarManager

            // Emit loaded event
            this.eventBus.emit(DASHBOARD_EVENTS.BUSINESS_LOADED, {
                businesses,
                count: businesses.length
            });

            console.log(`✅ [BusinessManager] Loaded ${businesses.length} business profiles`);
            return businesses;
            
        } catch (error) {
            console.error('❌ [BusinessManager] Error loading businesses:', error);
            // ✅ FIX: Use canonical state key
            this.stateManager.setState('business.all', []);
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
            // ✅ FIX: Use canonical state key
            this.stateManager.setState('business.selected', selectedBusiness);
            
            if (window.OsliraAuth) {
                window.OsliraAuth.business = selectedBusiness;
            }
            
            console.log('✅ [BusinessManager] Active business set:', selectedBusiness.business_name);
            
            // Emit event - listeners will handle UI updates
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
            
            // ✅ FIX: Use canonical state key
            const businesses = this.stateManager.getState('business.all');
            const business = businesses.find(b => b.id === businessId);
            
            if (!business) {
                throw new Error('Business not found');
            }
            
            // ✅ FIX: Use canonical state key
            this.stateManager.setState('business.selected', business);

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
                // ✅ FIX: Use canonical state key
                previousBusinessId: this.stateManager.getState('business.selected')?.id
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
            
            // ✅ FIX: Use canonical state key
            let businesses = this.stateManager.getState('business.all');
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
            
            // ✅ FIX: Use canonical state key
            const currentBusiness = this.stateManager.getState('business.selected');
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
            
            // ✅ FIX: Use canonical state key
            let businesses = this.stateManager.getState('business.all');
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
            
            bulkBusinessSelect.innerHTML = optionsHTML;
            
            // ✅ FIX: Use canonical state key
            const currentBusiness = this.stateManager.getState('business.selected');
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
        // ✅ FIX: Use canonical state key
        return this.stateManager.getState('business.selected');
    }
    
    getBusinessById(businessId) {
        // ✅ FIX: Use canonical state key
        const businesses = this.stateManager.getState('business.all');
        return businesses?.find(b => b.id === businessId);
    }
    
    getAllBusinesses() {
        // ✅ FIX: Use canonical state key
        return this.stateManager.getState('business.all') || [];
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
        // ✅ FIX: Use canonical state keys
        const businesses = this.stateManager.getState('business.all');
        const selectedBusiness = this.stateManager.getState('business.selected');
        
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
    // UI HELPERS - MODAL DROPDOWNS ONLY
    // ===============================================================================
    
    renderBusinessSelector(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // ✅ FIX: Use canonical state keys
        const businesses = this.stateManager.getState('business.all') || [];
        const currentBusiness = this.stateManager.getState('business.selected');
        
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
        // ✅ FIX: Use canonical state key
        const currentBusiness = this.stateManager.getState('business.selected');
        
        indicators.forEach(indicator => {
            indicator.textContent = currentBusiness?.business_name || 'No Business Selected';
        });
        
        // Update business profile badges
        const badges = document.querySelectorAll('.business-badge');
        badges.forEach(badge => {
            badge.style.display = currentBusiness ? 'inline-block' : 'none';
            badge.textContent = currentBusiness?.business_name || '';
        });
        
        // ✅ REMOVED: Sidebar update - handled by SidebarManager
        // The SidebarManager listens to BUSINESS_CHANGED events and updates its own UI
        console.log('ℹ️ [BusinessManager] Business indicators updated (sidebar handled by SidebarManager)');
    }

    // ✅ REMOVED: updateSidebarBusinessSelector() method
    // ✅ REMOVED: populateBusinessSelector() method
    // Sidebar UI is now fully managed by SidebarManager
    
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
        // ✅ FIX: Use canonical state keys
        this.stateManager.batchUpdate({
            'business.all': [],
            'business.selected': null
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
        // ✅ FIX: Use canonical state keys
        const businesses = this.stateManager.getState('business.all') || [];
        const currentBusiness = this.stateManager.getState('business.selected');
        
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
