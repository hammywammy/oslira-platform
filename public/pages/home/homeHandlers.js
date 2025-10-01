// =============================================================================
// HOME HANDLERS - ANALYSIS BACKEND LOGIC
// =============================================================================

console.log('🔧 [HomeHandlers] Loading analysis backend handlers...');

class HomeHandlers {
  constructor() {
    this.isInitialized = false;
    this.workerUrl = null;
    this.init();
  }

  init() {
    // Get worker URL from environment manager
    this.workerUrl = window.OsliraEnv?.WORKER_URL || 'https://api-staging.oslira.com';
    console.log('🔧 [HomeHandlers] Using worker URL:', this.workerUrl);
    this.isInitialized = true;
  }

  // =============================================================================
  // MAIN ANALYSIS HANDLER
  // =============================================================================

  async runInstagramAnalysis(handle) {
    console.log('🔍 [HomeHandlers] Running analysis for:', handle);
    
    const demoBtn = document.getElementById('demo-analyze-btn');
    const demoResults = document.getElementById('demo-results');
    const btnText = demoBtn?.querySelector('.demo-btn-text');
    const btnLoading = demoBtn?.querySelector('.demo-btn-loading');
    
    // Track demo usage
    if (window.HomeState) {
      window.HomeState.conversionState.demoUsed = true;
      window.HomeState.trackConversionEvent('demo_started', { handle });
    }
    
    try {
      // Check if user is logged in - if so, redirect to dashboard
      const isLoggedIn = localStorage.getItem('oslira_token');
      if (isLoggedIn) {
        console.log('🔀 [HomeHandlers] User logged in, redirecting to dashboard');
        window.location.href = '/dashboard';
        return;
      }
      
      // Show loading state
      this.setLoadingState(true, btnText, btnLoading, demoBtn);
      
      console.log('📡 [HomeHandlers] Making API call to:', `${this.workerUrl}/v1/analyze-anonymous`);
      
// Call anonymous analysis endpoint using API client
const result = await window.OsliraAPI.request('/v1/analyze-anonymous', {
  method: 'POST',
  body: JSON.stringify({
    username: handle.replace('@', '')
  }),
  skipAuth: true  // Anonymous endpoint, no login required
});

console.log('📡 [HomeHandlers] API response data:', result);

// Check for rate limit in response
if (result.error && result.error.includes('rate limit')) {
  console.log('⏰ [HomeHandlers] Rate limit hit, showing modal');
  this.showRateLimitModal(result.metadata?.remaining || 0, result.metadata?.resetIn || 24);
  return;
}

if (!result.success && result.error) {
  throw new Error(result.error);
}
      
      // Show real analysis results in modal
      console.log('✅ [HomeHandlers] Analysis successful, showing results');
      this.showAnonymousResultsModal(result.data, handle);
      
      // Track successful analysis
      if (window.HomeState) {
        window.HomeState.trackConversionEvent('anonymous_analysis_completed', { 
          handle, 
          score: result.data?.insights?.overall_score,
          remaining: result.metadata?.remaining || 0
        });
      }
      
    } catch (error) {
      console.error('❌ [HomeHandlers] Analysis error:', error);
      console.error('❌ [HomeHandlers] Error details:', {
        message: error.message,
        stack: error.stack,
        handle: handle,
        workerUrl: this.workerUrl
      });
      
      if (window.HomeState) {
        window.HomeState.trackConversionEvent('anonymous_analysis_error', { 
          handle, 
          error: error.message 
        });
      }
      
      // Show error and fallback to demo
      console.log('🔄 [HomeHandlers] Falling back to demo mode...');
      await this.handleAnalysisError(handle);
      
    } finally {
      // Reset button state
      this.setLoadingState(false, btnText, btnLoading, demoBtn);
    }
  }

  // =============================================================================
  // UI STATE MANAGEMENT
  // =============================================================================

  setLoadingState(isLoading, btnText, btnLoading, demoBtn) {
    if (!btnText || !btnLoading || !demoBtn) {
      console.warn('⚠️ [HomeHandlers] Button elements not found for loading state');
      return;
    }

    if (isLoading) {
      btnText.classList.add('hidden');
      btnLoading.classList.remove('hidden');
      demoBtn.disabled = true;
    } else {
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      demoBtn.disabled = false;
    }
  }

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  async handleAnalysisError(handle) {
    // Wait a moment for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate demo results
    const demoData = this.generateDemoResults(handle);
    this.displayDemoResults(demoData);
    
    // Show results with animation
    const demoResults = document.getElementById('demo-results');
    if (demoResults) {
      demoResults.classList.remove('hidden');
      demoResults.classList.add('animate-slide-in-up');
    }
    
    // Show upgrade modal after delay
    setTimeout(() => {
      this.showDemoUpgradeModal();
    }, 3000);
  }

  // =============================================================================
  // DEMO RESULTS GENERATION
  // =============================================================================

  generateDemoResults(handle) {
    console.log('🎭 [HomeHandlers] Generating demo results for:', handle);
    
    // Generate realistic demo data
    const cleanHandle = handle.replace('@', '');
    const names = ['Sarah', 'Mike', 'Alex', 'Jordan', 'Taylor', 'Casey'];
    const industries = [
      { 
        name: 'Health & Wellness', 
        tags: ['Needs copy help', 'High engagement', 'Business owner'] 
      },
      { 
        name: 'Tech Startup', 
        tags: ['Growing fast', 'Content creator', 'B2B focus'] 
      },
      { 
        name: 'E-commerce', 
        tags: ['Product launches', 'Email marketing', 'Conversion focused'] 
      },
      { 
        name: 'Coaching', 
        tags: ['Personal brand', 'Course creator', 'Audience building'] 
      }
    ];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
    const followers = (Math.random() * 50 + 5).toFixed(1) + 'K';
    const matchScore = (Math.random() * 25 + 75).toFixed(0);
    
    return {
      handle: `@${cleanHandle}`,
      name: randomName,
      industry: randomIndustry.name,
      followers: followers,
      matchScore: matchScore + '%',
      tags: randomIndustry.tags,
      outreachPreview: `Hi ${randomName}! I noticed your ${randomIndustry.name.toLowerCase()} content and think you'd be perfect for...`
    };
  }

  displayDemoResults(demoData) {
    console.log('🎨 [HomeHandlers] Displaying demo results:', demoData);
    
    const demoResults = document.getElementById('demo-results');
    if (!demoResults) {
      console.error('❌ [HomeHandlers] Demo results container not found');
      return;
    }
    
    demoResults.innerHTML = `
      <div class="demo-result-card">
        <div class="demo-profile-info">
          <div class="demo-avatar">${demoData.name.charAt(0)}</div>
          <div>
            <h4 class="demo-name">${demoData.handle}</h4>
            <p class="demo-analysis">Perfect fit • ${demoData.industry} • ${demoData.followers} followers</p>
          </div>
          <span class="demo-match-score">${demoData.matchScore} match</span>
        </div>
        <div class="demo-insights">
          ${demoData.tags.map(tag => `<span class="demo-tag">${tag}</span>`).join('')}
        </div>
        <div class="demo-outreach-preview">
          <p class="demo-message">${demoData.outreachPreview}</p>
        </div>
        <p class="demo-upgrade-hint">
          ↑ See 24 more leads like this with your free trial
        </p>
      </div>
    `;
  }

  // =============================================================================
  // MODAL HANDLERS
  // =============================================================================

  showAnonymousResultsModal(analysisData, handle) {
    console.log('📋 [HomeHandlers] Showing analysis results modal');
    
    // Remove existing modal if any
    const existingModal = document.getElementById('anonymous-results-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const { profile, insights } = analysisData;
    const score = insights?.overall_score || Math.floor(Math.random() * 25 + 75);
    const summary = insights?.account_summary || 'High-quality account with strong engagement potential for business partnerships.';
    const engagementInsights = insights?.engagement_insights || [
      'Posts consistently get 5%+ engagement rate',
      'Audience is highly engaged with business content',
      'Strong potential for collaboration opportunities',
      'Posts during peak hours for maximum reach',
      'Uses relevant hashtags effectively'
    ];
    
    // Create modal HTML
    const modalHTML = `
      <div id="anonymous-results-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  ${handle.charAt(1).toUpperCase()}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">${handle}</h2>
                  <p class="text-sm text-gray-600">${profile?.followersCount?.toLocaleString() || 'N/A'} followers</p>
                </div>
              </div>
              <button onclick="window.HomeHandlers.closeAnonymousResultsModal()" class="p-2 hover:bg-gray-100 rounded-full">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="p-6 space-y-6">
            <!-- Score -->
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white font-bold text-2xl">
                ${score}
              </div>
              <p class="mt-2 text-lg font-semibold text-gray-900">Overall Score</p>
              <p class="text-sm text-gray-600">Partnership Potential</p>
            </div>
            
            <!-- Summary -->
            <div class="bg-gray-50 rounded-xl p-4">
              <h3 class="font-semibold text-gray-900 mb-2">Account Summary</h3>
              <p class="text-gray-700">${summary}</p>
            </div>
            
            <!-- Insights Section -->
            <div>
              <h3 class="font-semibold text-gray-900 mb-4">Engagement Insights</h3>
              <div class="space-y-3">
                <!-- Show first 2 insights -->
                ${engagementInsights.slice(0, 2).map((insight, index) => `
                  <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ${index + 1}
                    </div>
                    <p class="text-gray-700 text-sm">${insight}</p>
                  </div>
                `).join('')}
                
                <!-- Blurred insights 3-5 -->
                <div class="relative">
                  <div class="space-y-3 filter blur-sm">
                    ${engagementInsights.slice(2).map((insight, index) => `
                      <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          ${index + 3}
                        </div>
                        <p class="text-gray-700 text-sm">${insight}</p>
                      </div>
                    `).join('')}
                  </div>
                  
                  <!-- Overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex items-center justify-center">
                    <div class="text-center p-4">
                      <div class="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        <span>3 More Insights</span>
                      </div>
                      <p class="text-sm text-gray-600 mt-2">Login to see full analysis + outreach strategies</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- CTA Section -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center">
              <h3 class="font-bold text-lg mb-2">Get Complete Analysis</h3>
              <p class="text-blue-100 mb-4">See all insights + personalized outreach strategies for your business</p>
              <button onclick="window.HomeHandlers.redirectToAuth()" class="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Start Free Trial
              </button>
              <p class="text-xs text-blue-200 mt-2">25 complete analyses included</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Track modal shown
    if (window.HomeState) {
      window.HomeState.trackConversionEvent('anonymous_results_modal_shown', { handle, score });
    }
  }

  showRateLimitModal(remaining, resetIn) {
    console.log('⏰ [HomeHandlers] Showing rate limit modal');
    
    const modalHTML = `
      <div id="rate-limit-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Daily Limit Reached</h3>
         <p class="text-gray-600 mb-6">You've used your free analysis today. Reset in ${resetIn} hours.</p>
<button onclick="window.HomeHandlers.redirectToAuth()" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Login for More Analysis
          </button>
          <button onclick="window.HomeHandlers.closeRateLimitModal()" class="w-full mt-3 text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    if (window.HomeState) {
      window.HomeState.trackConversionEvent('rate_limit_modal_shown', { remaining, resetIn });
    }
  }

  showDemoUpgradeModal() {
    console.log('📈 [HomeHandlers] Showing demo upgrade modal');
    
    const modal = document.getElementById('demo-modal');
    if (modal) {
      modal.classList.remove('hidden');
      
      if (window.HomeState) {
        window.HomeState.trackConversionEvent('demo_modal_shown');
      }
      
      // Close modal handlers
      const closeBtn = modal.querySelector('.demo-modal-close');
      const overlay = modal.querySelector('.demo-modal-overlay');
      const upgradeBtn = modal.querySelector('.btn-primary-modal');
      
      const closeModal = () => {
        modal.classList.add('hidden');
        if (window.HomeState) {
          window.HomeState.trackConversionEvent('demo_modal_closed');
        }
      };
      
      closeBtn?.addEventListener('click', closeModal);
      overlay?.addEventListener('click', closeModal);
      
      upgradeBtn?.addEventListener('click', () => {
        if (window.HomeState) {
          window.HomeState.trackConversionEvent('demo_modal_cta_clicked');
        }
        this.redirectToAuth();
      });
    }
  }

  // =============================================================================
  // MODAL UTILITIES
  // =============================================================================

  closeAnonymousResultsModal() {
    const modal = document.getElementById('anonymous-results-modal');
    if (modal) {
      modal.remove();
      if (window.HomeState) {
        window.HomeState.trackConversionEvent('anonymous_results_modal_closed');
      }
    }
  }

  closeRateLimitModal() {
    const modal = document.getElementById('rate-limit-modal');
    if (modal) {
      modal.remove();
      if (window.HomeState) {
        window.HomeState.trackConversionEvent('rate_limit_modal_closed');
      }
    }
  }

  redirectToAuth() {
    if (window.HomeState) {
      window.HomeState.trackConversionEvent('anonymous_conversion_attempt');
    }
    window.location.href = '/auth';
  }
}

// =============================================================================
// INITIALIZATION & GLOBAL EXPORT
// =============================================================================

// Create global instance
const homeHandlers = new HomeHandlers();

// Export to window for global access
window.HomeHandlers = homeHandlers;

// Also add individual functions to window for onclick handlers
window.closeAnonymousResultsModal = () => homeHandlers.closeAnonymousResultsModal();
window.closeRateLimitModal = () => homeHandlers.closeRateLimitModal();
window.redirectToAuth = () => homeHandlers.redirectToAuth();

console.log('✅ [HomeHandlers] Analysis backend handlers loaded and exposed globally');
