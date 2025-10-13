// =============================================================================
// ANALYZE LEAD USE CASE - Analysis Orchestration
// Path: /public/pages/app/dashboard/application/analysis/AnalyzeLeadUseCase.js
// Dependencies: LeadValidation, AnalysisQueue, ApiClient, Auth, EventBus
// =============================================================================

/**
 * @class AnalyzeLeadUseCase
 * @description Orchestrates lead analysis process
 * 
 * Responsibilities:
 * - Validate username
 * - Get business context
 * - Submit to analysis queue
 * - Emit events for UI updates
 */
class AnalyzeLeadUseCase {
    constructor() {
        // Core dependencies
        this.eventBus = window.EventBus || window.OsliraEventBus;
        this.osliraAuth = window.OsliraAuth;
        this.osliraAPI = window.OsliraApiClient;
        this.analysisQueue = window.AnalysisQueue;
        
        // Services
        this.validation = new window.LeadValidation();
        
        // Validate dependencies
        if (!this.osliraAuth || !this.osliraAPI) {
            throw new Error('[AnalyzeLeadUseCase] Missing required dependencies');
        }
        
        console.log('🎯 [AnalyzeLeadUseCase] Initialized');
    }
    
    // =========================================================================
    // MAIN ORCHESTRATION
    // =========================================================================
    
    async execute(username, analysisType = 'light') {
        console.log('🎯 [AnalyzeLeadUseCase] Starting analysis:', { username, analysisType });
        
        try {
            // 1. VALIDATE & CLEAN USERNAME
            const cleanUsername = this.validation.cleanUsername(username);
            const validation = this.validation.validateInstagramUsername(cleanUsername);
            
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error,
                    type: 'validation'
                };
            }
            
            // 2. GET SESSION
            const session = await this.getSession();
            if (!session) {
                return {
                    success: false,
                    error: 'Please log in to continue',
                    type: 'auth'
                };
            }
            
            // 3. GET BUSINESS PROFILE
            const business = await this.getBusinessProfile(session.user.id);
            if (!business) {
                return {
                    success: false,
                    error: 'Please create a business profile first',
                    type: 'business'
                };
            }
            
            // 4. PREPARE PAYLOAD
            const payload = {
                username: cleanUsername,
                profile_url: `https://instagram.com/${cleanUsername}`,
                analysis_type: analysisType,
                business_id: business.id,
                user_id: session.user.id
            };
            
            // 5. TRY QUEUE SYSTEM FIRST
            if (this.analysisQueue && typeof this.analysisQueue.startSingleAnalysis === 'function') {
                console.log('✅ [AnalyzeLeadUseCase] Using queue system');
                
                const result = await this.analysisQueue.startSingleAnalysis(
                    cleanUsername,
                    analysisType,
                    business.id,
                    payload
                );
                
                if (result.success) {
                    this.emitAnalysisStarted(cleanUsername, analysisType);
                    return {
                        success: true,
                        data: result.result,
                        method: 'queue'
                    };
                }
            }
            
            // 6. FALLBACK: DIRECT API CALL
            console.log('🌐 [AnalyzeLeadUseCase] Using direct API');
            
            // Test connectivity
            await this.testAPIConnectivity();
            
            // Make API call
            const result = await this.osliraAPI.post('/v1/analyze', payload);
            
            // Emit completion event
            this.emitAnalysisCompleted(cleanUsername, analysisType, result);
            
            return {
                success: true,
                data: result,
                method: 'api'
            };
            
        } catch (error) {
            console.error('❌ [AnalyzeLeadUseCase] Analysis failed:', error);
            
            return {
                success: false,
                error: error.message || 'Analysis failed. Please try again.',
                type: 'system'
            };
        }
    }
    
    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    
    async getSession() {
        if (!this.osliraAuth?.supabase) {
            throw new Error('Authentication system not available');
        }
        
        const { data: { session }, error } = await this.osliraAuth.supabase.auth.getSession();
        
        if (error) {
            console.error('❌ [AnalyzeLeadUseCase] Session error:', error);
            return null;
        }
        
        return session;
    }
    
    async getBusinessProfile(userId) {
        const { data: business, error } = await this.osliraAuth.supabase
            .from('business_profiles')
            .select('id, business_name, target_audience')
            .eq('user_id', userId)
            .single();
        
        if (error || !business) {
            console.error('❌ [AnalyzeLeadUseCase] Business profile error:', error);
            return null;
        }
        
        console.log('✅ [AnalyzeLeadUseCase] Business profile found:', business.business_name);
        return business;
    }
    
    async testAPIConnectivity() {
        try {
            await this.osliraAPI.get('/health');
            console.log('✅ [AnalyzeLeadUseCase] API connectivity OK');
        } catch (error) {
            console.error('❌ [AnalyzeLeadUseCase] API not reachable:', error);
            throw new Error('API server not reachable');
        }
    }
    
    // =========================================================================
    // EVENT EMISSION
    // =========================================================================
    
    emitAnalysisStarted(username, analysisType) {
        if (this.eventBus) {
            this.eventBus.emit('ANALYSIS_STARTED', {
                username,
                analysisType,
                timestamp: Date.now()
            });
        }
    }
    
    emitAnalysisCompleted(username, analysisType, result) {
        if (this.eventBus) {
            this.eventBus.emit('ANALYSIS_COMPLETED', {
                username,
                analysisType,
                result,
                timestamp: Date.now()
            });
        }
        
        // Trigger dashboard refresh
        this.triggerDashboardRefresh();
    }
    
    triggerDashboardRefresh() {
        if (this.eventBus) {
            this.eventBus.emit('DATA_REFRESH_REQUESTED', {
                source: 'analysis_completion',
                timestamp: Date.now()
            });
        }
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.AnalyzeLeadUseCase = AnalyzeLeadUseCase;
console.log('✅ [AnalyzeLeadUseCase] Loaded');
