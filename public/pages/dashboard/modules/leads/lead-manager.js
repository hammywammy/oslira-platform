//public/pages/dashboard/modules/leads/lead-manager.js

/**
 * OSLIRA LEAD MANAGER MODULE
 * Handles all lead CRUD operations, data loading, and selection management
 * Fixed version with proper data flow and state management
 */
class LeadManager {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
        this.stateManager = container.get('stateManager');
        this.osliraAuth = container.get('osliraAuth');
        
        // Cache for lead data
        this.dataCache = new Map();
        this.lastRefresh = null;
        
        console.log('🚀 [LeadManager] Initialized');
    }
    
    async init() {
        // Listen to auth changes
        this.eventBus.on('auth:changed', this.handleAuthChange.bind(this));
        this.eventBus.on('business:changed', this.handleBusinessChange.bind(this));
        
        console.log('✅ [LeadManager] Event listeners initialized');
    }
    
    // ===============================================================================
    // MAIN DATA LOADING - FIXED VERSION
    // ===============================================================================
    
async loadDashboardData() {
    // Prevent duplicate loading
    if (this.isLoading) {
        console.log('⚠️ [LeadManager] Already loading, skipping duplicate call');
        return;
    }
    
    this.isLoading = true;
    
    try {
        console.log('🔄 [LeadManager] Loading dashboard data...');
        this.stateManager.setState('isLoading', true);
        this.stateManager.setState('loadingMessage', 'Loading leads...');
        this.eventBus.emit('dashboard:loading:start', 'leads');
        
        // Wait for authentication with proper timeout
        const user = await this.waitForValidUser(5000);
        if (!user) {
            throw new Error('Authentication timeout - user not available');
        }
        
        // Wait for business selection with timeout
        const selectedBusinessId = await this.waitForValidBusiness(3000);
        if (!selectedBusinessId) {
            throw new Error('Business selection timeout');
        }
        
        // Wait for Supabase client with timeout
        const supabaseClient = await this.waitForSupabaseClient(3000);
        if (!supabaseClient) {
            throw new Error('Supabase client timeout');
        }
        
        console.log('📊 [LeadManager] Loading leads for:', {
            userId: user.id,
            businessId: selectedBusinessId
        });
            
            // Execute database query
            const { data: leads, error: leadsError } = await this.supabase
                .from('leads')
                .select(`
                  lead_id, username, display_name, profile_picture_url, bio_text,
                  platform_type, follower_count, following_count, post_count,
                  is_verified_account, profile_url, user_id, business_id,
                  first_discovered_at, last_updated_at,
                  runs(
                    run_id, analysis_type, overall_score, niche_fit_score, 
                    engagement_score, summary_text, confidence_level, created_at
                  )
                `)
                .eq('user_id', user.id)
                .eq('business_id', selectedBusinessId)
                .order('created_at', { foreignTable: 'runs', ascending: false });

            if (leadsError) {
                console.error('❌ [LeadManager] Leads query error:', leadsError);
                throw leadsError;
            }
            
            console.log(`📊 [LeadManager] Loaded ${leads?.length || 0} leads from database`);
            
            // Process leads data
            let enrichedLeads = [];
            
            if (leads && leads.length > 0) {
                enrichedLeads = leads.map(lead => {
                    // Get the most recent run
                    const latestRun = lead.runs && lead.runs.length > 0
                        ? lead.runs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                        : null;
                    
                    return {
                        // Map database fields to UI expected fields
                        id: lead.lead_id,  // Critical: UI expects 'id' not 'lead_id'
                        username: lead.username,
                        display_name: lead.display_name,
                        profile_picture_url: lead.profile_picture_url,
                        bio_text: lead.bio_text,
                        follower_count: lead.follower_count,
                        following_count: lead.following_count,
                        post_count: lead.post_count,
                        is_verified_account: lead.is_verified_account,
                        platform_type: lead.platform_type,
                        profile_url: lead.profile_url,
                        user_id: lead.user_id,
                        business_id: lead.business_id,
                        first_discovered_at: lead.first_discovered_at,
                        
// Backward compatibility fields
profile_pic_url: lead.profile_picture_url,
followers_count: lead.follower_count,
platform: lead.platform_type || 'instagram',
created_at: latestRun?.created_at || lead.first_discovered_at, // Use run date, fallback to lead date
                        
                        // Analysis data from runs table (via JOIN)
                        score: latestRun?.overall_score || 0,
                        analysis_type: latestRun?.analysis_type || 'light',
                        quick_summary: latestRun?.summary_text || '',
                        niche_fit_score: latestRun?.niche_fit_score || 0,
                        engagement_score: latestRun?.engagement_score || 0,
                        latest_run_id: latestRun?.run_id,
                        confidence_level: latestRun?.confidence_level || 0,
                        
                        // Keep original runs data for reference
                        runs: lead.runs || []
                    };
                });
            }

            // Debug before state update
            console.log('🔍 [DEBUG] About to update state with:', {
                enrichedLeadsLength: enrichedLeads?.length,
                sampleLead: enrichedLeads?.[0],
                aboutToCallBatchUpdate: true
            });

            // Update application state
            this.stateManager.batchUpdate({
                'leads': enrichedLeads,
                'allLeads': enrichedLeads, 
                'filteredLeads': enrichedLeads
            });

            console.log('🔍 [DEBUG] State update completed');

            // Clear selection
            this.stateManager.setState('selectedLeads', new Set());

            // Cache the data
            this.dataCache.set('leads', enrichedLeads);
            this.lastRefresh = new Date().toISOString();

            // Update global cache
            if (this.osliraAuth.cache) {
                this.osliraAuth.cache.leads = enrichedLeads;
                this.osliraAuth.cache.lastRefresh = this.lastRefresh;
            }

            console.log(`✅ [LeadManager] Final result: ${enrichedLeads.length} unique leads`);

            // Emit events
            this.eventBus.emit('leads:loaded', enrichedLeads);
            this.eventBus.emit('dashboard:data:loaded', { leads: enrichedLeads });

            return enrichedLeads;

} catch (error) {
    console.error('❌ [LeadManager] Error loading leads:', error);
    this.eventBus.emit('dashboard:data:error', error);
    
    // Ensure empty state shows on error
    this.stateManager.batchUpdate({
        'leads': [],
        'allLeads': [],
        'filteredLeads': []
    });
    this.stateManager.setState('selectedLeads', new Set());
    
    throw error;
} finally {
            this.stateManager.setState('isLoading', false);
            this.eventBus.emit('dashboard:loading:end', 'leads');
        this.isLoading = false;
        }
    }
    async waitForValidUser(timeout = 5000) {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = timeout / 100;
        
        const checkUser = () => {
            const user = this.osliraAuth?.user;
            if (user && user.id) {
                resolve(user);
                return;
            }
            
            attempts++;
            if (attempts >= maxAttempts) {
                console.warn('⚠️ [LeadManager] User wait timeout');
                resolve(null);
                return;
            }
            
            setTimeout(checkUser, 100);
        };
        
        checkUser();
    });
}

async waitForValidBusiness(timeout = 3000) {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = timeout / 100;
        
        const checkBusiness = () => {
            const selectedBusiness = this.stateManager.getState('selectedBusiness');
            const selectedBusinessId = selectedBusiness?.id || localStorage.getItem('selectedBusinessId');
            
            if (selectedBusinessId) {
                resolve(selectedBusinessId);
                return;
            }
            
            attempts++;
            if (attempts >= maxAttempts) {
                console.warn('⚠️ [LeadManager] Business wait timeout');
                resolve(null);
                return;
            }
            
            setTimeout(checkBusiness, 100);
        };
        
        checkBusiness();
    });
}

async waitForSupabaseClient(timeout = 3000) {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = timeout / 100;
        
        const checkSupabase = () => {
            const client = this.supabase;
            if (client && typeof client.from === 'function') {
                resolve(client);
                return;
            }
            
            attempts++;
            if (attempts >= maxAttempts) {
                console.warn('⚠️ [LeadManager] Supabase client wait timeout');
                resolve(null);
                return;
            }
            
            setTimeout(checkSupabase, 100);
        };
        
        checkSupabase();
    });
}
    // ===============================================================================
    // LEAD DETAILS
    // ===============================================================================
    
    async viewLead(leadId) {
        console.log('🔍 [LeadManager] Loading lead details:', leadId);
        
        let lead = null;
        let analysisData = null;
        
        try {
            const user = this.osliraAuth?.user;
            if (!user) throw new Error('No authenticated user');
            
            // Fetch from new 3-table structure
            const { data: leadData, error: leadError } = await this.supabase
                .from('leads')
                .select(`
                    lead_id,
                    username,
                    display_name,
                    profile_picture_url,
                    bio_text,
                    external_website_url,
                    follower_count,
                    following_count,
                    post_count,
                    is_verified_account,
                    is_private_account,
                    is_business_account,
                    platform_type,
                    profile_url,
                    first_discovered_at,
                    runs(
                        run_id,
                        analysis_type,
                        overall_score,
                        niche_fit_score,
                        engagement_score,
                        summary_text,
                        confidence_level,
                        created_at,
                        payloads(analysis_data)
                    )
                `)
                .eq('lead_id', leadId)
                .eq('user_id', user.id)
                .order('created_at', { foreignTable: 'runs', ascending: false })
                .single();
                
            if (leadError || !leadData) {
                throw new Error('Lead not found or access denied');
            }
            
            // Transform data to match old interface for compatibility
            lead = {
                id: leadData.lead_id,
                lead_id: leadData.lead_id,
                username: leadData.username,
                full_name: leadData.display_name,
                profile_pic_url: leadData.profile_picture_url,
                bio: leadData.bio_text,
                external_url: leadData.external_website_url,
                followers_count: leadData.follower_count,
                following_count: leadData.following_count,
                posts_count: leadData.post_count,
                is_verified: leadData.is_verified_account,
                is_private: leadData.is_private_account,
                is_business_account: leadData.is_business_account,
                platform: leadData.platform_type,
                profile_url: leadData.profile_url,
                created_at: leadData.first_discovered_at,
                
                // Map from latest run for compatibility
                score: leadData.runs?.[0]?.overall_score || 0,
                analysis_type: leadData.runs?.[0]?.analysis_type || 'light',
                quick_summary: leadData.runs?.[0]?.summary_text,
                runs: leadData.runs
            };
            
            // Get analysis data from most recent run
            if (leadData.runs && leadData.runs.length > 0) {
                const latestRun = leadData.runs[0];
                analysisData = {
                    run_id: latestRun.run_id,
                    engagement_score: latestRun.engagement_score,
                    score_niche_fit: latestRun.niche_fit_score,
                    score_total: latestRun.overall_score,
                    summary_text: latestRun.summary_text,
                    confidence_level: latestRun.confidence_level,
                    created_at: latestRun.created_at
                };
                
// If there's payload data, extract it using new schema structure
if (latestRun.payloads && latestRun.payloads.length > 0) {
    const payload = latestRun.payloads[0].analysis_data;
    if (payload) {
        // Deep analysis fields
        analysisData.reasons = payload.reasons || [];
        analysisData.deep_summary = payload.deep_summary;
        analysisData.latest_posts = payload.latest_posts;
        analysisData.selling_points = payload.selling_points || [];
        analysisData.outreach_message = payload.outreach_message;
        analysisData.audience_insights = payload.audience_insights;
        analysisData.engagement_breakdown = payload.engagement_breakdown || {
            avg_likes: 0,
            avg_comments: 0,
            engagement_rate: 0
        };
        
        // X-Ray analysis fields - ADD THIS SECTION
        if (payload.copywriter_profile) {
            analysisData.copywriter_profile = payload.copywriter_profile;
        }
        if (payload.commercial_intelligence) {
            analysisData.commercial_intelligence = payload.commercial_intelligence;
        }
        if (payload.persuasion_strategy) {
            analysisData.persuasion_strategy = payload.persuasion_strategy;
        }
        
        // Legacy compatibility for older fields
        analysisData.audience_quality = 'Medium'; // Default since not in new format
        analysisData.engagement_insights = payload.audience_insights || 'No engagement insights available';
    }
}
            }
            
            console.log('✅ [LeadManager] Lead loaded successfully');
            return { lead, analysisData };
            
        } catch (error) {
            console.error('❌ [LeadManager] Failed to load lead:', error);
            throw error;
        }
    }
    
    // ===============================================================================
    // LEAD OPERATIONS
    // ===============================================================================
    
    viewLatestLead(username) {
        console.log('🔍 [LeadManager] Looking for latest lead:', username);
        
        const leads = this.stateManager.getState('leads');
        const lead = leads.find(l => l.username.toLowerCase() === username.toLowerCase());
        
        if (lead) {
            console.log('✅ [LeadManager] Found lead, opening details:', lead.id);
            this.viewLead(lead.id);
            return lead;
        } else {
            console.warn('⚠️ [LeadManager] Lead not found, refreshing data:', username);
            this.loadDashboardData();
            return null;
        }
    }
    
    async deleteLead(leadId) {
        try {
            console.log('🗑️ [LeadManager] Deleting lead:', leadId);
            
            const user = this.osliraAuth?.user;
            if (!this.supabase || !user) {
                throw new Error('Database connection failed');
            }
            
            // Delete from runs first (foreign key constraint)
            const { error: runsError } = await this.supabase
                .from('runs')
                .delete()
                .eq('lead_id', leadId);
                
            if (runsError) {
                console.warn('⚠️ [LeadManager] Some run records could not be deleted:', runsError.message);
            }
            
            // Delete from leads table
            const { error: leadsError } = await this.supabase
                .from('leads')
                .delete()
                .eq('lead_id', leadId)
                .eq('user_id', user.id);
                
            if (leadsError) {
                throw leadsError;
            }
            
            // Remove from local state
            const currentLeads = this.stateManager.getState('leads');
            const updatedLeads = currentLeads.filter(lead => lead.id !== leadId);
            
            this.stateManager.batchUpdate({
                'leads': updatedLeads,
                'allLeads': updatedLeads,
                'filteredLeads': updatedLeads
            });
            
            // Remove from selection if selected
            const selectedLeads = this.stateManager.getState('selectedLeads');
            if (selectedLeads.has(leadId)) {
                const newSelection = new Set(selectedLeads);
                newSelection.delete(leadId);
                this.stateManager.setState('selectedLeads', newSelection);
            }
            
            this.eventBus.emit('lead:deleted', { leadId });
            console.log('✅ [LeadManager] Lead deleted successfully');
            
        } catch (error) {
            console.error('❌ [LeadManager] Error deleting lead:', error);
            this.eventBus.emit('dashboard:error', error);
            throw error;
        }
    }
    
    async bulkDeleteLeads(leadIds = null) {
        const selectedLeads = leadIds || this.stateManager.getState('selectedLeads');
        const idsToDelete = leadIds || Array.from(selectedLeads);
        
        if (idsToDelete.length === 0) {
            throw new Error('No leads selected for deletion');
        }
        
        try {
            console.log(`🗑️ [LeadManager] Bulk deleting ${idsToDelete.length} leads`);
            
            const user = this.osliraAuth?.user;
            if (!this.supabase || !user) {
                throw new Error('Database connection failed');
            }
            
            // Delete from runs first (foreign key constraint)
            const { error: runsError } = await this.supabase
                .from('runs')
                .delete()
                .in('lead_id', idsToDelete);
                
            if (runsError) {
                console.warn('⚠️ [LeadManager] Some run records could not be deleted:', runsError.message);
            }
            
            // Delete from leads table
            const { error: leadsError } = await this.supabase
                .from('leads')
                .delete()
                .in('lead_id', idsToDelete)
                .eq('user_id', user.id);
                
            if (leadsError) {
                throw leadsError;
            }
            
            // Update state
            const currentLeads = this.stateManager.getState('leads');
            const updatedLeads = currentLeads.filter(lead => !idsToDelete.includes(lead.id));
            
            this.stateManager.batchUpdate({
                'leads': updatedLeads,
                'allLeads': updatedLeads,
                'filteredLeads': updatedLeads,
                'selectedLeads': new Set()
            });
            
            this.eventBus.emit('leads:bulk_deleted', { 
                leadIds: idsToDelete,
                count: idsToDelete.length 
            });
            
            console.log('✅ [LeadManager] Bulk delete completed');
            return { count: idsToDelete.length };
            
        } catch (error) {
            console.error('❌ [LeadManager] Bulk delete failed:', error);
            this.eventBus.emit('dashboard:error', error);
            throw error;
        }
    }
    
    // ===============================================================================
    // SELECTION MANAGEMENT
    // ===============================================================================
    
    toggleLeadSelection(leadId) {
        const selectedLeads = this.stateManager.getState('selectedLeads');
        const newSelection = new Set(selectedLeads);
        
        if (newSelection.has(leadId)) {
            newSelection.delete(leadId);
            this.eventBus.emit('lead:deselected', leadId);
        } else {
            newSelection.add(leadId);
            this.eventBus.emit('lead:selected', leadId);
        }
        
        this.stateManager.setState('selectedLeads', newSelection);
        this.eventBus.emit('selection:changed', {
            selectedLeads: newSelection,
            count: newSelection.size
        });
        
        console.log(`🎯 [LeadManager] Selection toggled: ${leadId} (${newSelection.size} selected)`);
    }
    
    selectAllLeads() {
        const leads = this.stateManager.getState('filteredLeads') || this.stateManager.getState('leads');
        const allIds = new Set(leads.map(lead => lead.id));
        
        this.stateManager.setState('selectedLeads', allIds);
        this.eventBus.emit('selection:bulk', {
            selectedLeads: allIds,
            count: allIds.size
        });
        
        console.log(`🎯 [LeadManager] All leads selected: ${allIds.size}`);
    }
    
    clearSelection() {
        this.stateManager.setState('selectedLeads', new Set());
        this.eventBus.emit('selection:cleared');
        console.log('🎯 [LeadManager] Selection cleared');
    }
    
    // ===============================================================================
    // FILTERING & SEARCH
    // ===============================================================================
    
    filterLeads(filter = 'all') {
        const allLeads = this.stateManager.getState('allLeads');
        let filteredLeads = allLeads;
        
        switch (filter) {
            case 'high-score':
                filteredLeads = allLeads.filter(lead => (lead.score || 0) >= 80);
                break;
            case 'deep-analysis':
                filteredLeads = allLeads.filter(lead => lead.analysis_type === 'deep');
                break;
            case 'light-analysis':
                filteredLeads = allLeads.filter(lead => lead.analysis_type === 'light');
                break;
            case 'recent':
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                filteredLeads = allLeads.filter(lead => new Date(lead.created_at) > weekAgo);
                break;
            case 'all':
            default:
                filteredLeads = allLeads;
                break;
        }
        
        this.stateManager.batchUpdate({
            'currentFilter': filter,
            'filteredLeads': filteredLeads
        });
        
        this.eventBus.emit('filter:changed', {
            filter,
            count: filteredLeads.length
        });
        
        console.log(`🔍 [LeadManager] Filter applied: ${filter} (${filteredLeads.length} results)`);
        return filteredLeads;
    }
    
    searchLeads(searchTerm) {
        const allLeads = this.stateManager.getState('allLeads');
        
        if (!searchTerm.trim()) {
            const currentFilter = this.stateManager.getState('currentFilter');
            return this.filterLeads(currentFilter);
        }
        
        const filteredLeads = allLeads.filter(lead =>
            lead.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.stateManager.batchUpdate({
            'searchTerm': searchTerm,
            'filteredLeads': filteredLeads
        });
        
        this.eventBus.emit('search:changed', {
            searchTerm,
            count: filteredLeads.length
        });
        
        console.log(`🔍 [LeadManager] Search applied: "${searchTerm}" (${filteredLeads.length} results)`);
        return filteredLeads;
    }
    
    // ===============================================================================
    // EVENT HANDLERS
    // ===============================================================================
    
    handleAuthChange(userData) {
        if (userData.user) {
            console.log('🔐 [LeadManager] User authenticated, loading data');
            this.loadDashboardData();
        } else {
            console.log('🔐 [LeadManager] User logged out, clearing data');
            this.clearData();
        }
    }
    
    handleBusinessChange(businessData) {
        console.log('🏢 [LeadManager] Business changed, reloading leads');
        this.loadDashboardData();
    }

    // ===============================================================================
    // SUPABASE CLIENT GETTER
    // ===============================================================================

    get supabase() {
        try {
            const client = this.container.get('supabase');
            if (!client || typeof client.from !== 'function') {
                console.warn('⚠️ [LeadManager] Supabase client not ready yet');
                return null;
            }
            return client;
        } catch (error) {
            console.warn('⚠️ [LeadManager] Supabase client not available:', error.message);
            return null;
        }
    }
    
    // ===============================================================================
    // UTILITY METHODS
    // ===============================================================================
    
    clearData() {
        this.stateManager.batchUpdate({
            'leads': [],
            'allLeads': [],
            'filteredLeads': [],
            'selectedLeads': new Set()
        });
        
        this.dataCache.clear();
        this.lastRefresh = null;
    }
    
    getLeadById(leadId) {
        const leads = this.stateManager.getState('leads');
        return leads.find(lead => lead.id === leadId);
    }
    
    getSelectedLeads() {
        const selectedIds = this.stateManager.getState('selectedLeads');
        const leads = this.stateManager.getState('leads');
        return leads.filter(lead => selectedIds.has(lead.id));
    }
    
    getLeadStats() {
        const leads = this.stateManager.getState('leads');
        
        return {
            total: leads.length,
            selected: this.stateManager.getState('selectedLeads').size,
            deepAnalysis: leads.filter(l => l.analysis_type === 'deep').length,
            lightAnalysis: leads.filter(l => l.analysis_type === 'light').length,
            highScore: leads.filter(l => (l.score || 0) >= 80).length,
            averageScore: leads.length > 0 
                ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length)
                : 0
        };
    }
    
    async cleanup() {
        console.log('🧹 [LeadManager] Cleaning up...');
        this.clearData();
        this.dataCache.clear();
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LeadManager };
} else {
    window.LeadManager = LeadManager;
}

// Ensure immediate global availability
window.LeadManager = LeadManager;
