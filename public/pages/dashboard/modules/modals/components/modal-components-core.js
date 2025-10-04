// ===============================================================================
// MODAL COMPONENTS CORE SYSTEM
// Base class, utilities, and shared components
// ===============================================================================

class ModalComponents {
constructor() {
  this.components = new Map();
  this.registerDefaultComponents();
  this.loadExtensionComponents();
}

  // ===============================================================================
  // CORE COMPONENT REGISTRATION
  // ===============================================================================

  registerComponent(name, component) {
    this.components.set(name, component);
  }

  getComponent(name) {
    return this.components.get(name);
  }

  getProfileImageUrl(lead) {
    const url = lead.profile_picture_url || lead.profile_pic_url;
return url ? 
    `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=160&h=160&fit=cover&mask=circle` :
    '/assets/images/default-avatar.jpg';
  }

  getScoreGradient(score) {
    // Calculate gradient based on smooth color interpolation
    // Bad (0-30): Deep Red #B22222
    // Medium (31-50): Amber/Orange #FF8C00
    // Upper Medium (51-65): Soft Teal #40E0D0
    // Good (66-80): Deep Blue #1E3A8A
    // Excellent (81+): Rich Purple #6B21A8

    if (score >= 81) {
      // Excellent: Rich Purple gradient
      return 'from-purple-800 via-purple-700 to-purple-600';
    } else if (score >= 66) {
      // Good: Brighter Blue with purple blend based on proximity to 81
      const blendFactor = (score - 66) / 15; // 0 to 1 as score goes 66→81
      if (blendFactor > 0.6) {
        return 'from-blue-600 via-indigo-600 to-purple-600';
      } else if (blendFactor > 0.3) {
        return 'from-blue-600 via-blue-700 to-indigo-600';
      }
      return 'from-blue-600 via-blue-600 to-blue-700';
    } else if (score >= 51) {
      // Upper Medium: Soft Teal with blue blend based on proximity to 66
      const blendFactor = (score - 51) / 15; // 0 to 1 as score goes 51→66
      if (blendFactor > 0.6) {
        return 'from-teal-500 via-cyan-500 to-blue-600';
      } else if (blendFactor > 0.3) {
        return 'from-teal-400 via-teal-500 to-cyan-400';
      }
      return 'from-teal-400 via-cyan-400 to-teal-400';
    } else if (score >= 31) {
      // Medium: Orange → Yellow → Lime → Teal smooth transition
      const blendFactor = (score - 31) / 20; // 0 to 1 as score goes 31→51
      if (blendFactor > 0.75) {
        return 'from-lime-500 via-emerald-400 to-teal-400';
      } else if (blendFactor > 0.5) {
        return 'from-yellow-500 via-yellow-400 to-lime-400';
      } else if (blendFactor > 0.25) {
        return 'from-orange-500 via-amber-400 to-yellow-500';
      }
      return 'from-orange-600 via-orange-500 to-orange-400';
    } else {
      // Bad: Deep Red with orange blend based on proximity to 31
      const blendFactor = score / 30; // 0 to 1 as score goes 0→30
      if (blendFactor > 0.6) {
        return 'from-red-700 via-red-600 to-orange-600';
      } else if (blendFactor > 0.3) {
        return 'from-red-700 via-red-700 to-red-600';
      }
      return 'from-red-800 via-red-700 to-red-700';
    }
  }

  getMainScore(lead, analysisData, isDeepAnalysis) {
return isDeepAnalysis ? 
    (analysisData?.score_total || analysisData?.overall_score || lead.score) : 
    lead.score;
  }

  isPremiumLead(score) {
    return score >= 90;
  }

  // ===============================================================================
  // ANIMATION METHODS
  // ===============================================================================

  animateScoreAndCircle(scoreElement, circleElement, targetScore) {
    let currentScore = 0;
    const duration = 2000;
    const frameDuration = 16;
    const totalFrames = duration / frameDuration;
    const increment = targetScore / totalFrames;
    const circumference = 251.2;

    const animate = () => {
      currentScore += increment;

      if (currentScore >= targetScore) {
        currentScore = targetScore;
      }

      scoreElement.textContent = Math.round(currentScore);

      const progress = currentScore / 100;
      const offset = circumference - (progress * circumference);
      circleElement.style.strokeDashoffset = offset;

      if (currentScore < targetScore) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  initializeStaggeredReveals(container) {
    const staggerElements = container.querySelectorAll('.stagger-reveal');
    staggerElements.forEach((el, index) => {
      const currentDelay = el.style.animationDelay || `${index * 0.1} s`;
      el.style.animationDelay = currentDelay;
    });
  }

  initializeCountUpAnimations(container) {
    const countElements = container.querySelectorAll('.count-up');
    countElements.forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  initializeParticleSystem(container) {
    const particles = container.querySelectorAll('.particle');
    particles.forEach(particle => {
      setInterval(() => {
        particle.style.animationDuration = `${2 + Math.random() * 2} s`;
      }, 3000);
    });
  }

  getPayloadData(lead, analysisData) {
    // Check if there are payloads with analysis_data structure
    if (analysisData?.payloads && analysisData.payloads.length > 0 && analysisData.payloads[0]?.analysis_data) {
      return analysisData.payloads[0].analysis_data;
    }

    // Check if analysisData itself has payload structure
    if (analysisData?.deep_payload) {
      return analysisData.deep_payload;
    }

    // Check if analysisData itself has xray_payload structure
    if (analysisData?.xray_payload) {
      return analysisData.xray_payload;
    }

    // Fallback to direct analysisData
    return analysisData || {};
  }

  initializeAnimations(modalContent, lead, analysisData) {
    // Initialize tab system if tabs exist
    const tabNavigation = modalContent.querySelector('.tab-navigation');
    if (tabNavigation && window.TabSystem) {
      const tabs =
          Array.from(modalContent.querySelectorAll('[data-tab]')).map(btn => ({
            id : btn.getAttribute('data-tab'),
            label : btn.textContent.trim()
          }));

if (tabs.length > 0) {
    const tabSystem = window.TabSystem.create('modalContent', tabs, tabs[0].id);
        console.log('✅ [ModalComponents] Tab system initialized');
      }
    }

const isDeepAnalysis = lead.analysis_type === 'deep' || lead.analysis_type === 'xray';
    const mainScore = this.getMainScore(lead, analysisData, isDeepAnalysis);

    // Initialize score animation
    setTimeout(() => {
      const scoreDisplay = modalContent.querySelector('#scoreDisplay');
      const scoreRing = modalContent.querySelector('#scoreRing');

      if (scoreDisplay && scoreRing) {
        this.animateScoreAndCircle(scoreDisplay, scoreRing, mainScore);
      }

      // Initialize staggered reveals
      this.initializeStaggeredReveals(modalContent);

      // Trigger count-up animations
      this.initializeCountUpAnimations(modalContent);

      // Initialize particle systems
      this.initializeParticleSystem(modalContent);
    }, 100);
  }

  registerDefaultComponents() {
     this.registerComponent('heroHeader', {
            render: (lead, analysisData) => {
                const isLightAnalysis = lead.analysis_type === 'light';
                const isDeepAnalysis = lead.analysis_type === 'deep' || lead.analysis_type === 'xray';
                const mainScore = this.getMainScore(lead, analysisData, isDeepAnalysis);
                const isPremium = this.isPremiumLead(mainScore);
                const profileImageUrl = this.getProfileImageUrl(lead);
                const scoreGradient = this.getScoreGradient(mainScore);

                return `
                    <!-- Premium celebration particles for 90+ scores only -->
                    ${isPremium ? `
                        <div class="celebration-particle" style="top: 10%; left: 10%; animation-delay: 0s;"></div>
                        <div class="celebration-particle" style="top: 15%; left: 85%; animation-delay: 0.5s;"></div>
                        <div class="celebration-particle" style="top: 80%; left: 15%; animation-delay: 1s;"></div>
                        <div class="celebration-particle" style="top: 75%; left: 80%; animation-delay: 1.5s;"></div>
                    ` : ''}

                    <!-- Animated Hero Header -->
                    <div class="relative bg-gradient-to-br ${scoreGradient} gradient-shift p-8 text-white overflow-hidden">
                        <!-- Floating Particles -->
                        <div class="absolute inset-0 overflow-hidden">
                            <div class="particle" style="left: 10%; animation-delay: 0s;"></div>
                            <div class="particle" style="left: 25%; animation-delay: 0.8s;"></div>
                            <div class="particle" style="left: 45%; animation-delay: 1.2s;"></div>
                            <div class="particle" style="left: 65%; animation-delay: 0.4s;"></div>
                            <div class="particle" style="left: 85%; animation-delay: 1.6s;"></div>
                        </div>
                        
                        <!-- Glassmorphism overlay -->
                        <div class="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 backdrop-blur-[1px]"></div>
                        
                        <div class="relative z-10">
                            <!-- Profile Section -->
<div class="flex items-start justify-between mb-8 stagger-reveal" style="animation-delay: 0.1s;">
    <div class="flex items-start space-x-6">
        <!-- Profile image container - raised up to align with title -->
        <div class="relative hover-3d flex-shrink-0" style="margin-top: -105px;">
            <!-- Pulsing rings around profile -->
            <div class="pulse-ring w-20 h-20"></div>
            <div class="pulse-ring w-20 h-20" style="animation-delay: 0.5s;"></div>
            
<img src="${profileImageUrl}" 
     alt="Profile" 
     class="relative w-20 h-20 rounded-full border-3 border-white/40 shadow-2xl shimmer-effect object-cover"
     onerror="this.src='/assets/images/default-avatar.jpg'">
            ${(lead.is_verified_account || lead.is_verified) ?
`
                <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-3 border-white shadow-xl hover-3d">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                    </svg>
                </div>
            ` : ''}
        </div>
        
        <!-- Text content container -->
        <div class="flex flex-col justify-start space-y-2">
            <h1 class="text-3xl font-bold text-white count-up">
                ${lead.display_name || lead.full_name || lead.username}
            </h1>
            <p class="text-xl text-white/90 count-up" style="animation-delay: 0.2s;">@${lead.username}</p>
            
            ${lead.profile_url ? `
                <a href="${lead.profile_url}" target="_blank" rel="noopener noreferrer" 
                   class="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300 text-sm font-semibold">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    <span>View Profile</span>
                </a>
            ` : ''}
            
            <div class="flex items-center space-x-3">
                ${(lead.is_business_account) ? '<span class="px-3 py-1 bg-white/20 backdrop-blur-sm text-sm rounded-full border border-white/30 hover-3d shimmer-effect">Business</span>' : ''}
                ${(lead.is_private_account || lead.is_private) ? '<span class="px-3 py-1 bg-white/20 backdrop-blur-sm text-sm rounded-full border border-white/30 hover-3d shimmer-effect">Private</span>' : ''}
            </div>
        </div>
    </div>
                                
                                <!-- Animated Score Ring -->
                                <div class="relative">
                                    <div class="w-32 h-32 relative">
                                        <!-- Background circle -->
                                        <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" stroke-width="8" fill="none"/>
                                            <circle id="scoreRing" cx="50" cy="50" r="40" stroke="white" stroke-width="8" fill="none"
                                                    stroke-dasharray="251.2"
                                                    stroke-dashoffset="251.2"
                                                    stroke-linecap="round"/>
                                        </svg>
                                        <div class="absolute inset-0 flex items-center justify-center">
                                            <div class="text-center">
                                                <div id="scoreDisplay" class="text-4xl font-bold text-white score-count-up" style="animation-delay: 0.5s;">0</div>
                                                <div class="text-sm text-white/80">Score</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Animated Stats Grid -->
                            <div class="grid grid-cols-3 gap-4 stagger-reveal" style="animation-delay: 0.2s;">
                                <div class="group bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover-3d shimmer-effect transition-all duration-500 hover:bg-white/25">
                                    <div class="text-2xl font-bold text-white count-up group-hover:scale-110 transition-transform duration-300" style="animation-delay: 0.6s;">${(lead.follower_count || lead.followers_count || 0).toLocaleString()}</div>
                                    <div class="text-sm text-white/80">Followers</div>
                                    <div class="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full subtle-icon-pulse"></div>
                                </div>
                                <div class="group bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover-3d shimmer-effect transition-all duration-500 hover:bg-white/25">
                                    <div class="text-2xl font-bold text-white count-up group-hover:scale-110 transition-transform duration-300" style="animation-delay: 0.8s;">${(lead.following_count || 0).toLocaleString()}</div>
                                    <div class="text-sm text-white/80">Following</div>
                                    <div class="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full subtle-icon-pulse" style="animation-delay: 0.5s;"></div>
                                </div>
                                <div class="group bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover-3d shimmer-effect transition-all duration-500 hover:bg-white/25">
                                    <div class="text-2xl font-bold text-white count-up group-hover:scale-110 transition-transform duration-300" style="animation-delay: 1s;">${(lead.post_count || lead.posts_count || 0).toLocaleString()}</div>
                                    <div class="text-sm text-white/80">Posts</div>
                                    <div class="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full subtle-icon-pulse" style="animation-delay: 1s;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
  }
});



        // ===============================================================================
        // AI SUMMARY COMPONENT
        // ===============================================================================
        this.registerComponent('aiSummary', {
            render: (lead, analysisData) => {
                const isDeepAnalysis = lead.analysis_type === 'deep' || lead.analysis_type === 'xray';
                const hasDeepData = isDeepAnalysis && analysisData && (analysisData.deep_summary || analysisData.summary_text);
                const summaryText = hasDeepData ? 
                    (analysisData.deep_summary || analysisData.summary_text) : 
                    (lead.quick_summary || analysisData?.summary_text || 'No summary available for this lead.');

                return `
                    <!-- AI Summary with Morphing Border -->
                    <div class="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-2xl border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-border hover-3d stagger-reveal" style="animation-delay: 0.4s;">
                        <div class="absolute inset-[2px] bg-white rounded-3xl"></div>
                        <div class="relative z-10">
                            <div class="flex items-center space-x-4 mb-6">
                                <div class="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                    <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                    </svg>
                                </div>
                                <h3 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Analysis Summary</h3>
                            </div>
                            <p class="text-gray-700 leading-relaxed text-lg font-light">${summaryText}</p>
                        </div>
                    </div>
                `;
        }
        });

      this.registerComponent('tabNavigation', {
            render: (lead, analysisData, tabs) => {
                if (!tabs || tabs.length <= 1) return '';
                
                const tabButtons = tabs.map(tab => `
                    <button 
                        data-tab="${tab.id}" 
                        class="tab-button px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${tab.id === tabs[0].id ? 'active' : ''}"
                        role="tab"
                        aria-selected="${tab.id === tabs[0].id ? 'true' : 'false'}"
                        tabindex="0">
                        ${tab.label}
                    </button>
                `).join('');

                return `
                    <div class="tab-navigation bg-gray-50 p-2 rounded-xl mb-6" role="tablist">
                        <div class="flex space-x-2">
                            ${tabButtons}
                        </div>
                    </div>
                    
<style>
    .tab-button {
        background: transparent;
        color: #6b7280;
        border: none;
        cursor: pointer;
    }
    
    .tab-button:hover {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }
    
    .tab-button.active {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .tab-button:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
    }
</style>
                `;
      }
      });

this.registerComponent('tabbedContainer', {
    render: (lead, analysisData, tabs, components) => {
        if (!tabs || tabs.length <= 1) {
            // No tabs - render components directly
            return components.join('');
        }

        const tabContents = tabs.map((tab, index) => {
            const tabComponents = components[tab.id] || [];
            const isActive = index === 0;

            return `<div id="tab-content-${tab.id}" class="tab-content" role="tabpanel" aria-labelledby="tab-${tab.id}" style="display: ${isActive ? 'block' : 'none'}; opacity: ${isActive ? '1' : '0'}; transform: translateY(0); transition: all 0.3s ease;">${tabComponents.join('')}</div>`;
        }).join('');

        return `<div class="tabbed-container">${this.getComponent('tabNavigation').render(lead, analysisData, tabs)}<div class="tab-content-wrapper" style="margin-top: 32px;">${tabContents}</div></div>`;
    }
});

      this.registerComponent('lightAnalysisNotice', {
    render: (lead, analysisData) => {
        return `
            <div class="text-center py-12 px-6">
                <div class="inline-block p-4 bg-blue-100 rounded-full mb-6">
                    <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Light Analysis Complete</h3>
                
                <p class="text-gray-500 text-sm mb-8">
                    For detailed engagement metrics, audience insights, and personalized outreach messages, run a deep analysis.
                </p>
                
                <button onclick="startDeepAnalysis('${lead.id}')" 
                        class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Run Deep Analysis
                </button>
            </div>
        `;
      }
      });

        this.registerComponent('personalityLockedLight', {
    render: (lead, analysisData) => {
        return `
            <div class="text-center py-16 px-6">
                <div class="max-w-2xl mx-auto">
                    <!-- Lock Icon with Gradient -->
                    <div class="relative inline-block mb-8">
                        <div class="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-30"></div>
                        <div class="relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full border-2 border-purple-200">
                            <svg class="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- Title -->
                    <h3 class="text-3xl font-bold text-gray-800 mb-4">
                        Personality Insights Locked
                    </h3>
                    
                    <!-- Description -->
                    <p class="text-gray-600 text-lg mb-8 leading-relaxed">
                        Unlock advanced personality analysis with Deep or X-Ray analysis to see:
                    </p>
                    
                    <!-- Feature List -->
                    <div class="grid grid-cols-2 gap-4 mb-10 text-left">
                        <div class="flex items-start space-x-3 bg-white p-4 rounded-xl border border-purple-100">
                            <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-800 text-sm">DISC Assessment</div>
                                <div class="text-xs text-gray-500">Personality breakdown</div>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 bg-white p-4 rounded-xl border border-purple-100">
                            <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-800 text-sm">Communication Style</div>
                                <div class="text-xs text-gray-500">Preferred approach</div>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 bg-white p-4 rounded-xl border border-purple-100">
                            <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-800 text-sm">Behavior Patterns</div>
                                <div class="text-xs text-gray-500">Activity insights</div>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-3 bg-white p-4 rounded-xl border border-purple-100">
                            <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-800 text-sm">Motivation Drivers</div>
                                <div class="text-xs text-gray-500">What drives them</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CTA Button -->
                    <button onclick="startDeepAnalysis('${lead.id}')" 
                            class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        Run Deep Analysis
                        <span class="ml-3 px-3 py-1 bg-white/20 rounded-full text-sm font-normal">2 credits</span>
                    </button>
                    
                    <p class="text-gray-400 text-sm mt-6">
                        Or upgrade to X-Ray for complete psychological profiling (3 credits)
                    </p>
                </div>
            </div>
        `;
        }
        });

this.registerComponent('contentEngagementIntel', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        console.log('🔍 [contentEngagementIntel] Checking condition:', { 
            analysisType: lead.analysis_type, 
            hasMetrics: !!payload?.pre_processed_metrics,
            payload: payload 
        });
        return (lead.analysis_type === 'xray' || lead.analysis_type === 'deep') && 
               payload?.pre_processed_metrics;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        const metrics = payload?.pre_processed_metrics;
                
                if (!metrics) return '';
                
                const engagement = metrics.engagement || {};
                const content = metrics.content || {};
                const posting = metrics.posting || {};
                
                return `
                    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-100 p-8 shadow-2xl border border-cyan-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.6s;">
                        <div class="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" style="animation: float 4s ease-in-out infinite;"></div>
                        <div class="absolute bottom-8 left-8 w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rotate-45 opacity-20 group-hover:rotate-180 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 1s;"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center space-x-4 mb-6">
                                <div class="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                    <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                    </svg>
                                </div>
                                <h3 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Content & Engagement Intelligence</h3>
                            </div>
                            
                            <!-- Engagement Metrics -->
                            ${engagement.engagementRate ? `
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                                    Engagement Performance
                                </h4>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Engagement Rate</div>
                                        <div class="text-2xl font-bold text-cyan-600">${engagement.engagementRate}%</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Avg Likes</div>
                                        <div class="text-2xl font-bold text-cyan-600">${engagement.avgLikes?.toLocaleString() || 0}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Avg Comments</div>
                                        <div class="text-2xl font-bold text-cyan-600">${engagement.avgComments?.toLocaleString() || 0}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Posts Analyzed</div>
                                        <div class="text-2xl font-bold text-cyan-600">${engagement.postsAnalyzed || 0}</div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Video Performance -->
                            ${engagement.videoPerformance ? `
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                                    Video Performance
                                </h4>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Avg Views</div>
                                        <div class="text-2xl font-bold text-purple-600">${engagement.videoPerformance.avgViews?.toLocaleString() || 0}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Video Count</div>
                                        <div class="text-2xl font-bold text-purple-600">${engagement.videoPerformance.videoCount || 0}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Avg Engagement</div>
                                        <div class="text-2xl font-bold text-purple-600">${engagement.videoPerformance.avgEngagement?.toLocaleString() || 0}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">View:Engage Ratio</div>
                                        <div class="text-2xl font-bold text-purple-600">${engagement.videoPerformance.viewToEngagementRatio}%</div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Format Distribution -->
                            ${engagement.formatDistribution ? `
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                                    Content Format Mix
                                </h4>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Images</div>
                                        <div class="text-2xl font-bold text-indigo-600">${engagement.formatDistribution.imageCount || 0}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Videos</div>
                                        <div class="text-2xl font-bold text-indigo-600">${engagement.formatDistribution.videoCount || 0}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Carousels</div>
                                        <div class="text-2xl font-bold text-indigo-600">${engagement.formatDistribution.sidecarCount || 0}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Primary Format</div>
                                        <div class="text-lg font-bold text-indigo-600 capitalize">${engagement.formatDistribution.primaryFormat || 'mixed'}</div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Content Themes & Strategy -->
                            ${content.contentThemes ? `
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                                    Content Strategy
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-2">Content Themes</div>
                                        <div class="text-gray-800 font-medium">${content.contentThemes}</div>
                                    </div>
                                    ${content.captionStyle ? `
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-2">Caption Style</div>
                                        <div class="text-gray-800 font-medium capitalize">${content.captionStyle}</div>
                                    </div>
                                    ` : ''}
                                    ${content.avgCaptionLength ? `
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Avg Caption Length</div>
                                        <div class="text-2xl font-bold text-emerald-600">${content.avgCaptionLength} chars</div>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Hashtags & Location -->
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
                                    Hashtags & Geo-Tagging
                                </h4>
                                <div class="grid grid-cols-1 gap-3">
                                    ${content.topHashtags && content.topHashtags.length > 0 ? `
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-2">Top Hashtags</div>
                                        <div class="flex flex-wrap gap-2">
                                            ${content.topHashtags.slice(0, 8).map(tag => `
                                                <span class="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">#${tag}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                    ` : ''}
                                    ${content.locationData && content.locationData.usesLocations ? `
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-2">Location Usage</div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-gray-800 font-medium">${content.locationData.locationCount} unique locations</span>
                                            ${content.locationData.topLocations && content.locationData.topLocations.length > 0 ? `
                                            <div class="flex flex-wrap gap-2">
                                                ${content.locationData.topLocations.slice(0, 3).map(loc => `
                                                    <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">📍 ${loc}</span>
                                                `).join('')}
                                            </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <!-- Collaboration Signals -->
                            ${content.collaborationSignals && content.collaborationSignals.taggedAccountsCount > 0 ? `
                            <div class="mb-6">
                                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                                    Collaboration Activity
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Tagged Accounts</div>
                                        <div class="text-2xl font-bold text-amber-600">${content.collaborationSignals.taggedAccountsCount}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Collab Frequency</div>
                                        <div class="text-2xl font-bold text-amber-600">${(content.collaborationSignals.collaborationFrequency * 100).toFixed(0)}%</div>
                                    </div>
                                    ${content.collaborationSignals.topCollaborators && content.collaborationSignals.topCollaborators.length > 0 ? `
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 col-span-full md:col-span-1">
                                        <div class="text-sm text-gray-600 mb-2">Top Collaborators</div>
                                        <div class="flex flex-wrap gap-1">
                                            ${content.collaborationSignals.topCollaborators.slice(0, 3).map(collab => `
                                                <span class="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">@${collab}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Posting Patterns -->
                            ${posting.postsPerWeek ? `
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                                    Posting Patterns
                                </h4>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Posts/Week</div>
                                        <div class="text-2xl font-bold text-teal-600">${posting.postsPerWeek.toFixed(1)}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Consistency</div>
                                        <div class="text-lg font-bold text-teal-600 capitalize">${posting.consistencyLevel}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Last Posted</div>
                                        <div class="text-2xl font-bold text-teal-600">${posting.daysSinceLastPost}d ago</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Recent Posts (30d)</div>
                                        <div class="text-2xl font-bold text-teal-600">${posting.recentPostsLast30Days}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Velocity</div>
                                        <div class="text-lg font-bold text-teal-600 capitalize">${posting.postingVelocity}</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div class="text-sm text-gray-600 mb-1">Consistency Score</div>
                                        <div class="text-2xl font-bold text-teal-600">${posting.consistencyScore}/100</div>
                                    </div>
                                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 col-span-2">
                                        <div class="text-sm text-gray-600 mb-1">Avg Days Between Posts</div>
                                        <div class="text-2xl font-bold text-teal-600">${posting.avgDaysBetweenPosts.toFixed(1)} days</div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        });
        
        
} // Close registerDefaultComponents()

  loadExtensionComponents() {
    if (window._modalComponentExtensions) {
      window._modalComponentExtensions.forEach(extension => {
        extension.call(this);
      });
    }
  }

} // Close ModalComponents class

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalComponents;
} else {
  window.ModalComponents = ModalComponents;
}
