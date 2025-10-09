// =============================================================================
// LEAD MANAGER - Production Grade
// Path: /public/pages/app/dashboard/domain/leads/LeadManager.js
// Dependencies: Core system via window.Oslira*
// =============================================================================

/**
 * @class LeadManager
 * @description Handles all lead CRUD operations, data loading, and selection management
 * 
 * Production improvements:
 * - Direct access to Core system (no container)
 * - Better error handling with recovery strategies
 * - Race condition prevention
 * - Proper memory management
 * - Performance optimizations
 * - Graceful degradation
 */
class LeadManager {
    constructor() {
        // Core dependencies (direct access)
        this.eventBus = window.OsliraEventBus;
        this.stateManager = window.OsliraStateManager;
        this.osliraAuth = window.OsliraAuth;
        this.logger = window.OsliraLogger;
        
        // Validate dependencies
        if (!this.eventBus || !this.stateManager || !this.osliraAuth) {
            throw new Error('[LeadManager] Missing required Core dependencies');
        }
        
        // State management
        this.isLoading = false;
        this.loadingAbortController = null;
        
        // Cache management
        this.dataCache = new Map();
        this.lastRefresh = null;
        this.cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
        
        // Performance tracking
        this.performanceMetrics = {
            lastLoadTime: null,
            averageLoadTime: null,
            loadCount: 0
        };
        
        console.log('🚀 [LeadManager] Initialized (Production Mode)');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async init() {
        try {
            // Setup event listeners with error boundaries
            this.setupEventListeners();
            
            // Setup cleanup on page unload
            this.setupCleanupHandlers();
            
            console.log('✅ [LeadManager] Event listeners initialized');
            return true;
            
        } catch (error) {
            console.error('❌ [LeadManager] Initialization failed:', error);
            this.logger?.error('[LeadManager] Init failed', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Auth changes
        this.eventBus.on('auth:changed', (data) => {
            try {
                this.handleAuthChange(data);
            } catch (error) {
                console.error('❌ [LeadManager] Auth change handler failed:', error);
            }
        });
        
        // Business changes
        this.eventBus.on('business:changed', (data) => {
            try {
                this.handleBusinessChange(data);
            } catch (error) {
                console.error('❌ [LeadManager] Business change handler failed:', error);
            }
        });
    }
    
    setupCleanupHandlers() {
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Cleanup on visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.loadingAbortController) {
                this.loadingAbortController.abort();
                this.isLoading = false;
            }
        });
    }
    
    // =========================================================================
    // MAIN DATA LOADING (Production Grade)
    // =========================================================================
    
    async loadDashboardData() {
        // Race condition prevention
        if (this.isLoading) {
            console.log('⚠️ [LeadManager] Load already in progress, waiting...');
            return this.waitForCurrentLoad();
        }
        
        const loadStartTime = performance.now();
        this.isLoading = true;
        this.loadingAbortController = new AbortController();
        
        try {
            console.log('🔄 [LeadManager] Loading dashboard data...');
            
            // Update UI state
            this.stateManager.batchUpdate({
                'isLoading': true,
                'loadingMessage': 'Loading leads...'
            });
            this.eventBus.emit('dashboard:loading:start', 'leads');
            
            // Wait for prerequisites with timeouts
            const [user, businessId, supabaseClient] = await Promise.all([
                this.waitForValidUser(5000),
                this.waitForValidBusiness(3000),
                this.waitForSupabaseClient(3000)
            ]);
            
            // Validate prerequisites
            if (!user) throw new Error('Authentication timeout - user not available');
            if (!businessId) throw new Error('Business selection timeout');
            if (!supabaseClient) throw new Error('Database connection timeout');
            
            console.log('📊 [LeadManager] Prerequisites met, loading leads...');
            
            // Load leads from database
            const leads = await this.fetchLeadsFromDatabase(user.id, businessId, supabaseClient);
            
            // Process and enrich lead data
            const enrichedLeads = this.processLeadData(leads);
            
            // Preserve existing selection during refresh
            const validSelection = this.preserveSelection(enrichedLeads);
            
            // Update application state (atomic update)
            this.updateStateWithLeads(enrichedLeads, validSelection);
            
            // Update cache
            this.updateCache(enrichedLeads);
            
            // Track performance
            this.trackPerformance(loadStartTime);
            
            // Emit success events
            this.eventBus.emit('leads:loaded', enrichedLeads);
            this.eventBus.emit('dashboard:data:loaded', { leads: enrichedLeads });
            
            console.log(`✅ [LeadManager] Loaded ${enrichedLeads.length} leads successfully`);
            return enrichedLeads;
            
        } catch (error) {
            // Determine if error is recoverable
            const isRecoverable = this.handleLoadError(error);
            
            if (!isRecoverable) {
                throw error;
            }
            
            return [];
            
        } finally {
            // Always cleanup state
            this.stateManager.setState('isLoading', false);
            this.eventBus.emit('dashboard:loading:end', 'leads');
            this.isLoading = false;
            this.loadingAbortController = null;
        }
    }
    
    // =========================================================================
    // DATA FETCHING (Separated for testability)
    // =========================================================================
    
    async fetchLeadsFromDatabase(userId, businessId, supabaseClient) {
        const { data: leads, error: leadsError } = await supabaseClient
            .from('leads')
            .select(`
                lead_id, username, display_name, profile_picture_url, bio_text,
                platform_type, follower_count, following_count, post_count,
                is_verified_account, profile_url, user_id, business_id,
                first_discovered_at, last_updated_at,
                runs!runs_lead_id_fkey(
                    run_id, analysis_type, overall_score, niche_fit_score, 
                    engagement_score, summary_text, confidence_level, created_at
                )
            `)
            .eq('user_id', userId)
            .eq('business_id', businessId)
            .order('last_updated_at', { ascending: false })
            .order('created_at', { foreignTable: 'runs', ascending: false });
        
        if (leadsError) {
            console.error('❌ [LeadManager] Database query failed:', leadsError);
            throw leadsError;
        }
        
        console.log(`📊 [LeadManager] Fetched ${leads?.length || 0} leads from database`);
        return leads || [];
    }
    
    processLeadData(leads) {
        if (!leads || leads.length === 0) {
            return [];
        }
        
        return leads.map(lead => {
            // Get most recent run
            const latestRun = lead.runs && lead.runs.length > 0
                ? lead.runs[0]
                : null;
            
            return {
                // Primary fields
                id: lead.lead_id,
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
                last_updated_at: lead.last_updated_at,
                
                // Backward compatibility aliases
                profile_pic_url: lead.profile_picture_url,
                followers_count: lead.follower_count,
                platform: lead.platform_type || 'instagram',
                created_at: lead.last_updated_at || latestRun?.created_at || lead.first_discovered_at,
                updated_at: lead.last_updated_at || latestRun?.created_at || lead.first_discovered_at,
                
                // Analysis data from latest run
                score: latestRun?.overall_score || 0,
                analysis_type: latestRun?.analysis_type || 'light',
                quick_summary: latestRun?.summary_text || '',
                niche_fit_score: latestRun?.niche_fit_score || 0,
                engagement_score: latestRun?.engagement_score || 0,
                latest_run_id: latestRun?.run_id,
                confidence_level: latestRun?.confidence_level || 0,
                
                // Keep original runs for reference
                runs: lead.runs || []
            };
        });
    }
    
    preserveSelection(enrichedLeads) {
        const existingSelection = this.stateManager.getState('selectedLeads') || new Set();
        const validSelection = new Set();
        const leadIds = new Set(enrichedLeads.map(l => l.id));
        
        // Only keep selections for leads that still exist
        existingSelection.forEach(id => {
            if (leadIds.has(id)) {
                validSelection.add(id);
            }
        });
        
        if (validSelection.size !== existingSelection.size) {
            console.log(`🔄 [LeadManager] Selection updated: ${existingSelection.size} → ${validSelection.size}`);
        }
        
        return validSelection;
    }
    
    updateStateWithLeads(leads, selection) {
        this.stateManager.batchUpdate({
            'leads': leads,
            'allLeads': leads,
            'filteredLeads': leads,
            'selectedLeads': selection
        });
    }
    
    updateCache(leads) {
        this.dataCache.set('leads', leads);
        this.lastRefresh = Date.now();
        
        // Update global cache if available
        if (this.osliraAuth.cache) {
            this.osliraAuth.cache.leads = leads;
            this.osliraAuth.cache.lastRefresh = this.lastRefresh;
        }
    }
    
    trackPerformance(startTime) {
        const loadTime = performance.now() - startTime;
        this.performanceMetrics.lastLoadTime = loadTime;
        this.performanceMetrics.loadCount++;
        
        // Calculate rolling average
        if (this.performanceMetrics.averageLoadTime === null) {
            this.performanceMetrics.averageLoadTime = loadTime;
        } else {
            this.performanceMetrics.averageLoadTime = 
                (this.performanceMetrics.averageLoadTime * (this.performanceMetrics.loadCount - 1) + loadTime) 
                / this.performanceMetrics.loadCount;
        }
        
        console.log(`⏱️ [LeadManager] Load time: ${loadTime.toFixed(0)}ms (avg: ${this.performanceMetrics.averageLoadTime.toFixed(0)}ms)`);
    }
    
    // =========================================================================
    // ERROR HANDLING (Production Grade)
    // =========================================================================
    
    handleLoadError(error) {
        console.error('❌ [LeadManager] Load failed:', error);
        
        // Log to monitoring
        this.logger?.error('[LeadManager] Load failed', {
            error: error.message,
            stack: error.stack,
            user: this.osliraAuth?.user?.id
        });
        
        // Emit error event
        this.eventBus.emit('dashboard:data:error', { error, source: 'lead_loading' });
        
        // Ensure UI shows empty state (graceful degradation)
        this.stateManager.batchUpdate({
            'leads': [],
            'allLeads': [],
            'filteredLeads': [],
            'selectedLeads': new Set()
        });
        
        // Determine if recoverable
        const isRecoverable = 
            error.message.includes('timeout') ||
            error.message.includes('network') ||
            error.message.includes('abort');
        
        return isRecoverable;
    }
    
    // =========================================================================
    // WAIT HELPERS (Production Grade with AbortController)
    // =========================================================================
    
    async waitForValidUser(timeout = 5000) {
        return this.waitFor(
            () => this.osliraAuth?.user?.id,
            timeout,
            'User authentication'
        );
    }
    
    async waitForValidBusiness(timeout = 3000) {
        return this.waitFor(
            () => {
                const selectedBusiness = this.stateManager.getState('selectedBusiness');
                return selectedBusiness?.id || localStorage.getItem('selectedBusinessId');
            },
            timeout,
            'Business selection'
        );
    }
    
    async waitForSupabaseClient(timeout = 3000) {
        return this.waitFor(
            () => {
                const client = this.supabase;
                return client && typeof client.from === 'function' ? client : null;
            },
            timeout,
            'Database connection'
        );
    }
    
    async waitFor(condition, timeout, description) {
        const startTime = Date.now();
        const interval = 100;
        const maxAttempts = timeout / interval;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // Check if loading was aborted
            if (this.loadingAbortController?.signal.aborted) {
                throw new Error(`${description} wait aborted`);
            }
            
            // Check condition
            const result = condition();
            if (result) {
                const elapsed = Date.now() - startTime;
                console.log(`✅ [LeadManager] ${description} ready (${elapsed}ms)`);
                return result;
            }
            
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
        }
        
        console.warn(`⚠️ [LeadManager] ${description} timeout after ${timeout}ms`);
        return null;
    }
    
    async waitForCurrentLoad() {
        const maxWait = 30000; // 30 seconds
        const startTime = Date.now();
        
        while (this.isLoading && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return this.stateManager.getState('leads');
    }
    
    // =========================================================================
    // LEAD OPERATIONS
    // =========================================================================
    
    async viewLead(leadId) {
        console.log('🔍 [LeadManager] Loading lead details:', leadId);
        
        try {
            const user = this.osliraAuth?.user;
            if (!user) throw new Error('No authenticated user');
            
            const { data: leadData, error: leadError } = await this.supabase
                .from('leads')
                .select(`
                    lead_id, username, display_name, profile_picture_url, bio_text,
                    external_website_url, follower_count, following_count, post_count,
                    is_verified_account, is_private_account, is_business_account,
                    platform_type, profile_url, first_discovered_at,
                    runs!runs_lead_id_fkey(
                        run_id, analysis_type, overall_score, niche_fit_score,
                        engagement_score, summary_text, confidence_level, created_at,
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
            
            // Transform and enrich data
            const lead = this.transformLeadDetails(leadData);
            const analysisData = this.extractAnalysisData(leadData);
            
            console.log('✅ [LeadManager] Lead loaded successfully');
            return { lead, analysisData };
            
        } catch (error) {
            console.error('❌ [LeadManager] Failed to load lead:', error);
            this.logger?.error('[LeadManager] View lead failed', { leadId, error: error.message });
            throw error;
        }
    }
    
    transformLeadDetails(leadData) {
        return {
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
            score: leadData.runs?.[0]?.overall_score || 0,
            analysis_type: leadData.runs?.[0]?.analysis_type || 'light',
            quick_summary: leadData.runs?.[0]?.summary_text,
            runs: leadData.runs
        };
    }
    
    extractAnalysisData(leadData) {
        if (!leadData.runs || leadData.runs.length === 0) {
            return null;
        }
        
        const latestRun = leadData.runs[0];
        const analysisData = {
            run_id: latestRun.run_id,
            engagement_score: latestRun.engagement_score,
            score_niche_fit: latestRun.niche_fit_score,
            score_total: latestRun.overall_score,
            summary_text: latestRun.summary_text,
            confidence_level: latestRun.confidence_level,
            created_at: latestRun.created_at
        };
        
        // Extract payload data if available
        if (latestRun.payloads && latestRun.payloads.length > 0) {
            const payload = latestRun.payloads[0].analysis_data;
            if (payload) {
                Object.assign(analysisData, {
                    reasons: payload.reasons || [],
                    deep_summary: payload.deep_summary,
                    latest_posts: payload.latest_posts,
                    selling_points: payload.selling_points || [],
                    outreach_message: payload.outreach_message,
                    audience_insights: payload.audience_insights,
                    engagement_breakdown: payload.engagement_breakdown || {
                        avg_likes: 0,
                        avg_comments: 0,
                        engagement_rate: 0
                    },
                    copywriter_profile: payload.copywriter_profile,
                    commercial_intelligence: payload.commercial_intelligence,
                    persuasion_strategy: payload.persuasion_strategy,
                    pre_processed_metrics: payload.pre_processed_metrics,
                    personality_profile: payload.personality_profile,
                    audience_quality: 'Medium' // Default
                });
            }
        }
        
        return analysisData;
    }
    
    async deleteLead(leadId) {
        try {
            console.log('🗑️ [LeadManager] Deleting lead:', leadId);
            
            const user = this.osliraAuth?.user;
            if (!this.supabase || !user) {
                throw new Error('Database connection or authentication failed');
            }
            
            // Delete runs first (foreign key constraint)
            await this.supabase.from('runs').delete().eq('lead_id', leadId);
            
            // Delete lead
            const { error } = await this.supabase
                .from('leads')
                .delete()
                .eq('lead_id', leadId)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            // Update local state
            this.removeLeadFromState(leadId);
            
            this.eventBus.emit('lead:deleted', { leadId });
            console.log('✅ [LeadManager] Lead deleted successfully');
            
        } catch (error) {
            console.error('❌ [LeadManager] Delete failed:', error);
            this.logger?.error('[LeadManager] Delete lead failed', { leadId, error: error.message });
            throw error;
        }
    }
    
    async bulkDeleteLeads(leadIds = null) {
        const idsToDelete = leadIds || Array.from(this.stateManager.getState('selectedLeads') || []);
        
        if (idsToDelete.length === 0) {
            throw new Error('No leads selected for deletion');
        }
        
        try {
            console.log(`🗑️ [LeadManager] Bulk deleting ${idsToDelete.length} leads`);
            
            const user = this.osliraAuth?.user;
            if (!this.supabase || !user) {
                throw new Error('Database connection or authentication failed');
            }
            
            // Delete runs first
            await this.supabase.from('runs').delete().in('lead_id', idsToDelete);
            
            // Delete leads
            const { error } = await this.supabase
                .from('leads')
                .delete()
                .in('lead_id', idsToDelete)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            // Update state
            const currentLeads = this.stateManager.getState('leads');
            const updatedLeads = currentLeads.filter(lead => !idsToDelete.includes(lead.id));
            
            this.stateManager.batchUpdate({
                'leads': updatedLeads,
                'allLeads': updatedLeads,
                'filteredLeads': updatedLeads,
                'selectedLeads': new Set()
            });
            
            this.eventBus.emit('leads:bulk_deleted', { leadIds: idsToDelete, count: idsToDelete.length });
            console.log('✅ [LeadManager] Bulk delete completed');
            
            return { count: idsToDelete.length };
            
        } catch (error) {
            console.error('❌ [LeadManager] Bulk delete failed:', error);
            this.logger?.error('[LeadManager] Bulk delete failed', { count: idsToDelete.length, error: error.message });
            throw error;
        }
    }
    
    removeLeadFromState(leadId) {
        const currentLeads = this.stateManager.getState('leads');
        const updatedLeads = currentLeads.filter(lead => lead.id !== leadId);
        
        this.stateManager.batchUpdate({
            'leads': updatedLeads,
            'allLeads': updatedLeads,
            'filteredLeads': updatedLeads
        });
        
        // Remove from selection
        const selectedLeads = this.stateManager.getState('selectedLeads');
        if (selectedLeads.has(leadId)) {
            const newSelection = new Set(selectedLeads);
            newSelection.delete(leadId);
            this.stateManager.setState('selectedLeads', newSelection);
        }
    }
    
    // =========================================================================
    // SELECTION MANAGEMENT
    // =========================================================================
    
    toggleLeadSelection(leadId) {
        const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();
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
    }
    
    selectAllLeads() {
        const leads = this.stateManager.getState('filteredLeads') || this.stateManager.getState('leads');
        const allIds = new Set(leads.map(lead => lead.id));
        
        this.stateManager.setState('selectedLeads', allIds);
        this.eventBus.emit('selection:bulk', { selectedLeads: allIds, count: allIds.size });
    }
    
    clearSelection() {
        this.stateManager.setState('selectedLeads', new Set());
        this.eventBus.emit('selection:cleared');
    }
    
    // =========================================================================
    // FILTERING & SEARCH
    // =========================================================================
    
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
            default:
                filteredLeads = allLeads;
        }
        
        this.stateManager.batchUpdate({
            'currentFilter': filter,
            'filteredLeads': filteredLeads
        });
        
        this.eventBus.emit('filter:changed', { filter, count: filteredLeads.length });
        return filteredLeads;
    }
    
    searchLeads(searchTerm) {
        const allLeads = this.stateManager.getState('allLeads');
        
        if (!searchTerm.trim()) {
            const currentFilter = this.stateManager.getState('currentFilter');
            return this.filterLeads(currentFilter);
        }
        
        const term = searchTerm.toLowerCase();
        const filteredLeads = allLeads.filter(lead =>
            lead.username.toLowerCase().includes(term) ||
            lead.display_name?.toLowerCase().includes(term)
        );
        
        this.stateManager.batchUpdate({
            'searchTerm': searchTerm,
            'filteredLeads': filteredLeads
        });
        
        this.eventBus.emit('search:changed', { searchTerm, count: filteredLeads.length });
        return filteredLeads;
    }
    
    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================
    
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
    
    // =========================================================================
    // SUPABASE CLIENT GETTER
    // =========================================================================
    
    get supabase() {
        return this.osliraAuth?.supabase || null;
    }
    
    // =========================================================================
    // UTILITY METHODS
    // =========================================================================
    
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
            selected: (this.stateManager.getState('selectedLeads') || new Set()).size,
            deepAnalysis: leads.filter(l => l.analysis_type === 'deep').length,
            lightAnalysis: leads.filter(l => l.analysis_type === 'light').length,
            highScore: leads.filter(l => (l.score || 0) >= 80).length,
            averageScore: leads.length > 0 
                ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length)
                : 0
        };
    }
    
    async refreshWithAnimation() {
        console.log('🔄 [LeadManager] Manual refresh triggered');
        
        const tableContainer = document.getElementById('leads-table-container');
        if (tableContainer) {
            tableContainer.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            tableContainer.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        await this.loadDashboardData();
        
        if (tableContainer) {
            setTimeout(() => {
                tableContainer.style.opacity = '1';
            }, 50);
        }
    }
    
    cleanup() {
        console.log('🧹 [LeadManager] Cleaning up...');
        
        // Abort any pending operations
        if (this.loadingAbortController) {
            this.loadingAbortController.abort();
        }
        
        // Clear cache
        this.dataCache.clear();
        this.lastRefresh = null;
        
        // Reset state
        this.isLoading = false;
    }
    
    // =========================================================================
    // DEBUG & MONITORING
    // =========================================================================
    
    getDebugInfo() {
        return {
            isLoading: this.isLoading,
            lastRefresh: this.lastRefresh,
            cacheSize: this.dataCache.size,
            performanceMetrics: this.performanceMetrics,
            hasDependencies: {
                eventBus: !!this.eventBus,
                stateManager: !!this.stateManager,
                osliraAuth: !!this.osliraAuth,
                logger: !!this.logger,
                supabase: !!this.supabase
            }
        };
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.LeadManager = LeadManager;

console.log('✅ [LeadManager] Class loaded and ready');
