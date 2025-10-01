//public/pages/dashboard/modules/handlers/research-handlers.js

class ResearchHandlers {
    constructor() {
        this.setupGlobalHandlers();
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
        // Emit event for filtering
        if (window.DashboardEventBus?.instance) {
            window.DashboardEventBus.instance.emit('filter:priority', { priority });
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
            
            // 3. GET SUPABASE SESSION
            console.log('🔐 [ResearchHandlers] Getting Supabase session...');
            
            let supabaseClient;
            if (window.OsliraAuth?.supabase) {
                supabaseClient = window.OsliraAuth.supabase;
            } else {
                console.error('❌ [ResearchHandlers] OsliraAuth not available');
                return;
            }

            const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
            
            if (sessionError) {
                console.error('❌ [ResearchHandlers] Session error:', sessionError);
                return;
            }
            
            if (!session) {
                console.error('❌ [ResearchHandlers] No active session - user not logged in');
                return;
            }
            
            console.log('✅ [ResearchHandlers] Supabase session found:', {
                userId: session.user.id,
                email: session.user.email,
                tokenLength: session.access_token?.length || 0
            });

            // 4. GET BUSINESS PROFILE
            console.log('🏢 [ResearchHandlers] Getting business profile...');
            const { data: business, error: businessError } = await supabaseClient
                .from('business_profiles')
                .select('id, business_name, target_audience')
                .eq('user_id', session.user.id)
                .single();

            if (businessError) {
                console.error('❌ [ResearchHandlers] Business profile error:', businessError);
                return;
            }

            if (!business) {
                console.error('❌ [ResearchHandlers] No business profile found');
                return;
            }

            console.log('✅ [ResearchHandlers] Business profile found:', {
                businessId: business.id,
                businessName: business.business_name,
                targetAudience: business.target_audience
            });

            // 5. GET WORKER URL
            console.log('🔧 [ResearchHandlers] Getting worker URL...');
            let workerUrl;
            try {
                if (window.OsliraConfig?.getWorkerUrl) {
                    workerUrl = await window.OsliraConfig.getWorkerUrl();
                } else if (window.OsliraEnv?.WORKER_URL) {
                    workerUrl = window.OsliraEnv.WORKER_URL;
                } else {
                    throw new Error('Worker URL not configured');
                }
                
                console.log('✅ [ResearchHandlers] Worker URL found:', workerUrl);
            } catch (configError) {
                console.error('❌ [ResearchHandlers] Worker URL error:', configError);
                return;
            }

            // 6. PREPARE API PAYLOAD
            const apiPayload = {
                profile_url: `https://instagram.com/${cleanUsername}`,
                analysis_type: analysisType,
                business_id: business.id,
                user_id: session.user.id
            };

            console.log('🚀 [ResearchHandlers] API payload prepared:', apiPayload);

            // 7. TRY ENHANCED QUEUE SYSTEM FIRST
            console.log('🎯 [ResearchHandlers] Attempting to use enhanced analysis queue...');
            
            // Get the analysis queue from multiple possible sources
            const analysisQueue = window.analysisQueue || 
                                window.dashboard?._app?.container?.get('analysisQueue') ||
                                window.debugUtils?.analysisQueue;

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
                        // Queue handles completion and refresh automatically
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

            // 8. FALLBACK: DIRECT API CALL WITH PROGRESS INDICATION
            console.log('🌐 [ResearchHandlers] Using direct API call fallback...');
            
            // Show some visual feedback since we don't have queue
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
    const healthData = await window.OsliraAPI.request('/health', {
        method: 'GET'
    });
    
    console.log('✅ [ResearchHandlers] Worker is reachable:', healthData);
} catch (healthError) {
    console.error('💥 [ResearchHandlers] Worker not reachable:', healthError);
    
    // Reset button
    if (submitButton) {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
    return;
}
// Make the API call using API client
console.log('📡 [ResearchHandlers] Making API call...');

const result = await window.OsliraAPI.request('/v1/analyze', {
    method: 'POST',
    body: JSON.stringify(apiPayload)
});

// Reset button state
if (submitButton) {
    submitButton.textContent = originalButtonText;
    submitButton.disabled = false;
}

console.log('✅ [ResearchHandlers] API success:', result);

            // Close modal and refresh
            this.closeResearchModal();
            await this.refreshDashboardData();
            
        } catch (error) {
            console.error('💥 [ResearchHandlers] Unexpected error:', error);
            this.closeResearchModal();
            
            // Reset button if it exists
            const modal = document.getElementById('researchModal');
            const submitButton = modal?.querySelector('button[onclick*="submitResearch"]');
            if (submitButton) {
                submitButton.textContent = 'Start Research';
                submitButton.disabled = false;
            }
        }
    }

    async refreshDashboardData() {
        console.log('🔄 [ResearchHandlers] Refreshing leads table...');
        try {
            // Add small delay for processing
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Try multiple refresh methods in order of preference
            if (window.DashboardApp?.instance?.refreshLeads) {
                await window.DashboardApp.instance.refreshLeads();
                console.log('✅ [ResearchHandlers] Leads refreshed via DashboardApp instance');
            } else if (window.dashboard?._app?.refreshLeads) {
                await window.dashboard._app.refreshLeads();
                console.log('✅ [ResearchHandlers] Leads refreshed via dashboard app');
            } else if (window.debugUtils?.leadManager?.loadDashboardData) {
                await window.debugUtils.leadManager.loadDashboardData();
                console.log('✅ [ResearchHandlers] Leads refreshed via debugUtils');
            } else if (window.DashboardEventBus?.instance) {
                window.DashboardEventBus.instance.emit('data:refresh', { source: 'api-success' });
                console.log('✅ [ResearchHandlers] Refresh event emitted');
            } else {
                console.log('🔄 [ResearchHandlers] Using page reload fallback');
                window.location.reload();
            }
        } catch (refreshError) {
            console.error('❌ [ResearchHandlers] Refresh failed:', refreshError);
            setTimeout(() => window.location.reload(), 2000);
        }
    }

    showUsernameError(usernameInput, message) {
        const usernameContainer = usernameInput.parentElement;
        let errorDiv = usernameContainer.querySelector('.username-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'username-error text-red-500 text-sm mt-1';
            usernameContainer.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        
        // Shake animation
        usernameInput.style.animation = 'shake 0.5s ease-in-out';
        usernameInput.style.borderColor = '#ef4444';
        
        setTimeout(() => {
            usernameInput.style.animation = '';
            usernameInput.style.borderColor = '';
        }, 500);
    }

    clearUsernameError(usernameInput) {
        const usernameContainer = usernameInput.parentElement;
        const errorDiv = usernameContainer.querySelector('.username-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResearchHandlers;
} else {
    window.ResearchHandlers = ResearchHandlers;
}
