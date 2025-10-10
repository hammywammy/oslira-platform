//public/pages/dashboard/modules/handlers/research-handlers.js

/**
 * RESEARCH HANDLERS - Migrated to Core System
 * 
 * Uses:
 * - window.OsliraAuth for authentication
 * - window.OsliraEnv for environment config
 * - window.OsliraAPI for API calls
 * - window.EventBus for event coordination
 */
class ResearchHandlers {
constructor() {
    // Use global window objects directly (no container)
    this.eventBus = window.EventBus || window.OsliraEventBus;
    this.osliraAuth = window.OsliraAuth;
    this.osliraAPI = window.OsliraApiClient;  // ✅ FIXED - correct name
    this.osliraEnv = window.OsliraEnv;
    
    // Add validation
    if (!this.osliraAPI) {
        console.error('❌ [ResearchHandlers] OsliraApiClient not found!');
    }
    
    this.setupGlobalHandlers();
    
    console.log('🔍 [ResearchHandlers] Initialized with Core system');
}

    setupGlobalHandlers() {
        window.submitResearch = () => this.submitResearch();
        window.openResearchModal = () => this.openResearchModal();
        window.closeResearchModal = () => this.closeResearchModal();
        window.toggleNotifications = () => this.toggleNotifications();
        window.filterByPriority = (priority) => this.filterByPriority(priority);
    }

    openResearchModal() {
        const modal = document.getElementById('researchModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeResearchModal() {
        const modal = document.getElementById('researchModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    toggleNotifications() {
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    filterByPriority(priority) {
        console.log('Filtering by priority:', priority);
        
        // Emit event for filtering using EventBus
        if (this.eventBus) {
            this.eventBus.emit('filter:priority', { priority });
        }
    }

    async submitResearch() {
        console.log('🔍 [ResearchHandlers] submitResearch() called');
        
        try {
            // 1. CAPTURE FORM DATA
            const usernameInput = document.querySelector('#researchModal input[type="text"]');
            const analysisRadio = document.querySelector('#researchModal input[name="analysis"]:checked');
            
            const username = usernameInput?.value?.trim();
            const analysisType = analysisRadio?.value || 'light';
            
            console.log('📊 [ResearchHandlers] Form data captured:', {
                username: username,
                analysisType: analysisType
            });
            
            // 2. BASIC VALIDATION
            if (!username) {
                console.error('❌ No username entered');
                this.showUsernameError(usernameInput, 'Please enter a username');
                return;
            }

            // Clear any previous error
            this.clearUsernameError(usernameInput);

            // Clean username
            const cleanUsername = username.replace(/^@/, '').replace(/.*instagram\.com\//, '').replace(/\/$/, '');
            console.log('✅ [ResearchHandlers] Clean username:', cleanUsername);

            // VALIDATE INSTAGRAM USERNAME
            const validation = this.validateInstagramUsername(cleanUsername);
            if (!validation.isValid) {
                console.error('❌ [ResearchHandlers] Invalid username:', validation.error);
                this.showUsernameError(usernameInput, validation.error);
                return;
            }
            console.log('✅ [ResearchHandlers] Username validation passed');

            // 3. GET SUPABASE SESSION USING CORE AUTH
            console.log('🔐 [ResearchHandlers] Getting Supabase session...');
            
            if (!this.osliraAuth?.supabase) {
                console.error('❌ [ResearchHandlers] OsliraAuth not available');
                this.showError('Authentication system not available');
                return;
            }

            const { data: { session }, error: sessionError } = await this.osliraAuth.supabase.auth.getSession();
            
            if (sessionError) {
                console.error('❌ [ResearchHandlers] Session error:', sessionError);
                this.showError('Failed to get authentication session');
                return;
            }
            
            if (!session) {
                console.error('❌ [ResearchHandlers] No active session - user not logged in');
                this.showError('Please log in to continue');
                return;
            }
            
            console.log('✅ [ResearchHandlers] Supabase session found:', {
                userId: session.user.id,
                email: session.user.email,
                tokenLength: session.access_token?.length || 0
            });

            // 4. GET BUSINESS PROFILE
            console.log('🏢 [ResearchHandlers] Getting business profile...');
            const { data: business, error: businessError } = await this.osliraAuth.supabase
                .from('business_profiles')
                .select('id, business_name, target_audience')
                .eq('user_id', session.user.id)
                .single();

            if (businessError) {
                console.error('❌ [ResearchHandlers] Business profile error:', businessError);
                this.showError('Failed to load business profile');
                return;
            }

            if (!business) {
                console.error('❌ [ResearchHandlers] No business profile found');
                this.showError('Please create a business profile first');
                return;
            }

            console.log('✅ [ResearchHandlers] Business profile found:', {
                businessId: business.id,
                businessName: business.business_name,
                targetAudience: business.target_audience
            });

            // 5. PREPARE API PAYLOAD
            const apiPayload = {
                username: cleanUsername,
                profile_url: `https://instagram.com/${cleanUsername}`,
                analysis_type: analysisType,
                business_id: business.id,
                user_id: session.user.id
            };

            console.log('🚀 [ResearchHandlers] API payload prepared:', apiPayload);
            console.log('🔍 [ResearchHandlers] Payload validation:', {
                cleanUsername,
                cleanUsernameType: typeof cleanUsername,
                cleanUsernameLength: cleanUsername?.length,
                profile_url: apiPayload.profile_url,
                hasHttps: apiPayload.profile_url?.includes('https://'),
                hasInstagram: apiPayload.profile_url?.includes('instagram.com/')
            });

            // 6. TRY ENHANCED QUEUE SYSTEM FIRST
            console.log('🎯 [ResearchHandlers] Attempting to use enhanced analysis queue...');
            
            const analysisQueue = window.AnalysisQueue;

            if (analysisQueue && typeof analysisQueue.startSingleAnalysis === 'function') {
                console.log('✅ [ResearchHandlers] Enhanced queue available, using queue system');
                
                try {
                    // Close modal immediately to show queue
                    this.closeResearchModal();
                    
                    // Use the enhanced queue system
                    const result = await analysisQueue.startSingleAnalysis(
                        cleanUsername,
                        analysisType,
                        business.id,
                        apiPayload
                    );
                    
                    if (result.success) {
                        console.log('✅ [ResearchHandlers] Analysis queued successfully');
                        
                        // Emit event for dashboard refresh
                        if (this.eventBus) {
                            this.eventBus.emit('ANALYSIS_STARTED', {
                                username: cleanUsername,
                                analysisType: analysisType
                            });
                        }
                        
                        return { success: true, data: result.result };
                    } else {
                        console.error('❌ [ResearchHandlers] Queue analysis failed:', result.error);
                        // Fall through to direct API call
                    }
                } catch (queueError) {
                    console.error('❌ [ResearchHandlers] Queue system error:', queueError);
                    // Fall through to direct API call
                }
            } else {
                console.warn('⚠️ [ResearchHandlers] Enhanced queue not available, falling back to direct API');
            }

            // 7. FALLBACK: DIRECT API CALL USING CORE API CLIENT
            console.log('🌐 [ResearchHandlers] Using direct API call fallback...');
            
            // Show loading state
            const modal = document.getElementById('researchModal');
            const submitButton = modal?.querySelector('button[onclick*="submitResearch"]');
            let originalButtonText = 'Start Research';
            
            if (submitButton) {
                originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Processing...';
                submitButton.disabled = true;
            }

            // Test worker connectivity first
            console.log('🧪 [ResearchHandlers] Testing worker connectivity...');
            try {
                const healthData = await this.osliraAPI.get('/health');
                console.log('✅ [ResearchHandlers] Worker is reachable:', healthData);
            } catch (healthError) {
                console.error('💥 [ResearchHandlers] Worker not reachable:', healthError);
                
                // Reset button
                if (submitButton) {
                    submitButton.textContent = originalButtonText;
                    submitButton.disabled = false;
                }
                
                this.showError('API server not reachable. Please try again.');
                return;
            }

            // Make the API call using Core API Client (handles JSON automatically)
            console.log('📡 [ResearchHandlers] Making API call...');
            
            const result = await this.osliraAPI.post('/v1/analyze', apiPayload);

            // Reset button state
            if (submitButton) {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }

            console.log('✅ [ResearchHandlers] API success:', result);

            // Close modal
            this.closeResearchModal();
            
            // Emit completion event for dashboard to refresh
            if (this.eventBus) {
                this.eventBus.emit('ANALYSIS_COMPLETED', {
                    username: cleanUsername,
                    analysisType: analysisType,
                    result: result
                });
            }
            
            // Fallback refresh if event doesn't trigger
            setTimeout(() => {
                this.refreshDashboardData();
            }, 500);
            
        } catch (error) {
            console.error('💥 [ResearchHandlers] Unexpected error:', error);
            
            // Reset button if it exists
            const modal = document.getElementById('researchModal');
            const submitButton = modal?.querySelector('button[onclick*="submitResearch"]');
            if (submitButton) {
                submitButton.textContent = 'Start Research';
                submitButton.disabled = false;
            }
            
            this.showError('Analysis failed. Please try again.');
            this.closeResearchModal();
        }
    }

    async refreshDashboardData() {
        console.log('🔄 [ResearchHandlers] Refreshing dashboard data...');
        
        try {
            // Primary: Use EventBus to trigger refresh
            if (this.eventBus) {
                this.eventBus.emit('DATA_REFRESH_REQUESTED', { 
                    source: 'research_completion',
                    timestamp: Date.now()
                });
                console.log('✅ [ResearchHandlers] Refresh event emitted');
                return;
            }
            
            // Secondary: Direct LeadManager call
            const leadManager = window.LeadManager;
            if (leadManager && typeof leadManager.loadDashboardData === 'function') {
                await leadManager.loadDashboardData();
                console.log('✅ [ResearchHandlers] Leads refreshed via LeadManager');
                return;
            }
            
            // Fallback: Page reload
            console.log('🔄 [ResearchHandlers] Using page reload fallback');
            setTimeout(() => window.location.reload(), 1000);
            
        } catch (refreshError) {
            console.error('❌ [ResearchHandlers] Refresh failed:', refreshError);
            setTimeout(() => window.location.reload(), 2000);
        }
    }

    validateInstagramUsername(username) {
        // Empty check
        if (!username || username.length === 0) {
            return { isValid: false, error: 'Username is required' };
        }
        
        // Length check (1-30 characters)
        if (username.length > 30) {
            return { isValid: false, error: 'Username must be 30 characters or less' };
        }
        
        // Character validation (letters, numbers, periods, underscores only)
        const validCharsRegex = /^[a-zA-Z0-9._]+$/;
        if (!validCharsRegex.test(username)) {
            return { isValid: false, error: 'Username can only contain letters, numbers, periods (.), and underscores (_)' };
        }
        
        // No leading dot
        if (username.startsWith('.')) {
            return { isValid: false, error: 'Username cannot start with a period' };
        }
        
        // No trailing dot
        if (username.endsWith('.')) {
            return { isValid: false, error: 'Username cannot end with a period' };
        }
        
        // No consecutive dots
        if (username.includes('..')) {
            return { isValid: false, error: 'Username cannot contain consecutive periods (..)' };
        }
        
        return { isValid: true, error: null };
    }

    showUsernameError(usernameInput, message) {
        if (!usernameInput) return;
        
        const usernameContainer = usernameInput.parentElement;
        let errorDiv = usernameContainer.querySelector('.username-error, .username-validation-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'username-validation-error';
            errorDiv.innerHTML = `
                <svg class="validation-message-icon validation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px; display: inline-block; margin-right: 8px; vertical-align: middle;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span></span>
            `;
            usernameContainer.appendChild(errorDiv);
        }
        
        errorDiv.querySelector('span').textContent = message;
        
        // Add validation classes
        usernameInput.classList.add('field-invalid', 'border-red-500');
        usernameInput.classList.remove('field-valid', 'border-green-500');
    }

    clearUsernameError(usernameInput) {
        if (!usernameInput) return;
        
        const usernameContainer = usernameInput.parentElement;
        const errorDiv = usernameContainer.querySelector('.username-error, .username-validation-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        
        // Remove validation classes
        usernameInput.classList.remove('field-invalid', 'border-red-500', 'field-valid', 'border-green-500');
    }

    showError(message) {
        console.error('❌ [ResearchHandlers] Error:', message);
        
        // Try to use notification system if available
        if (window.Notifications?.error) {
            window.Notifications.error(message);
        } else {
            // Fallback: Alert
            alert(message);
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResearchHandlers;
} else {
    window.ResearchHandlers = ResearchHandlers;
}

console.log('🔍 [ResearchHandlers] Migrated version loaded successfully');
