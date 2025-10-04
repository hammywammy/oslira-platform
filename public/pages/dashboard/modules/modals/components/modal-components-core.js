// ===============================================================================
// MODAL COMPONENTS CORE SYSTEM
// Base class, utilities, and shared components
// ===============================================================================

class ModalComponents {
  constructor() {
    this.components = new Map();
    this.registerDefaultComponents();
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
        `https : // images.weserv.nl/?url=${encodeURIComponent(url)}&w=160&h=160&fit=cover&mask=circle`
                  // :
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
    return isDeepAnalysis ? (analysisData ?.score_total || analysisData
                                    ?.overall_score || lead.score)
                                          : lead.score;
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

    const animate = () = > {
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
    staggerElements.forEach((el, index) = > {
      const currentDelay = el.style.animationDelay || `${index * 0.1} s`;
      el.style.animationDelay = currentDelay;
    });
  }

  initializeCountUpAnimations(container) {
    const countElements = container.querySelectorAll('.count-up');
    countElements.forEach((el, index) = > {
      setTimeout(() = > {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  initializeParticleSystem(container) {
    const particles = container.querySelectorAll('.particle');
    particles.forEach(particle = > {
      setInterval(() = > {
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
          Array.from(modalContent.querySelectorAll('[data-tab]')).map(btn = > ({
            id : btn.getAttribute('data-tab'),
            label : btn.textContent.trim()
          }));

      if (tabs.length > 0) {
        const tabSystem =
            window.TabSystem.create('modalContent', tabs, tabs[0].id);
        console.log('✅ [ModalComponents] Tab system initialized');
      }
    }

    // Keep existing animation code...
    const isDeepAnalysis = lead.analysis_type == =
        'deep' || lead.analysis_type == = 'xray';
    const mainScore = this.getMainScore(lead, analysisData, isDeepAnalysis);

    // Initialize score animation
    setTimeout(() = > {
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
// DEEP ANALYSIS METRICS GRID COMPONENT
// ===============================================================================
        this.registerComponent('metricsGrid', {
condition:
  (lead, analysisData) = > lead.analysis_type == =
      'deep' || lead.analysis_type == = 'xray',
         render : (lead, analysisData) =
                      > ` <!--Animated Metrics Grid--> < div class
  = "grid grid-cols-1 gap-6 md:grid-cols-3 stagger-reveal" style =
      "animation-delay: 0.3s;" > <!--Engagement Card--> < div class
  = "group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 "
    + "to-rose-100 p-6 shadow-2xl border border-pink-200/50 hover-3d "
    + "shimmer-effect transition-all duration-700 hover:shadow-3xl"
      > < div class
  = ("absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-pink-400 "
     + "to-rose-500 rounded-full opacity-20 group-hover:scale-150 "
     + "transition-transform duration-1000") style =
        "animation: float 3s ease-in-out infinite;" > </ div>

      < div class
  = "relative z-10" > < div class
  = "flex items-center justify-between mb-4" > < div class
  = "p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg "
    + "group-hover:rotate-12 transition-transform duration-500"
      > < svg class
  = "w-6 h-6 text-white subtle-icon-pulse" fill = "none" stroke =
      "currentColor" viewBox = "0 0 24 24"
      > <path stroke - linecap = "round" stroke - linejoin = "round" stroke
              - width = "2" d =
              ("M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 "
               + "0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z")
              /></ svg></ div>
      < div class
  = "text-right" > < div class
  = "text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 "
    + "bg-clip-text text-transparent count-up"
      > ${analysisData ?.engagement_score || 0 } < / div > < div class
  = "text-sm text-pink-600/80" > Engagement</ div></ div></ div>

      < h3 class
  = "text-lg font-bold text-gray-900 mb-3" > Engagement Metrics</ h3>
      < div class
  = "space-y-2" > < div class
  = "flex justify-between items-center" > < span class
  = "text-sm text-gray-600" > Avg.Likes</ span> < span class="font-bold text-pink-700 count-up">${(analysisData?.avg_likes || 0).toLocaleString()}</span>
                                </div>
                                <div class
  = "flex justify-between items-center" > < span class
  = "text-sm text-gray-600" > Avg.Comments</ span> < span class="font-bold text-pink-700 count-up">${(analysisData?.avg_comments || 0).toLocaleString()}</span>
                                </div>
                                <div class
  = "flex justify-between items-center" > < span class
  = "text-sm text-gray-600" > Rate</ span> < span class
  = "font-bold text-pink-700 count-up" > ${analysisData ?.engagement_rate
            ? `${analysisData.engagement_rate.toFixed(2)} %`
            : 'N/A' }
            < / span > </ div></ div></ div></ div>

            <!--Niche Fit Card-->
            < div class
  = "group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 "
    + "to-indigo-100 p-6 shadow-2xl border border-blue-200/50 hover-3d "
    + "shimmer-effect transition-all duration-700 hover:shadow-3xl"
      > < div class
  = ("absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-blue-400 "
     + "to-indigo-500 rounded-full opacity-20 group-hover:scale-150 "
     + "transition-transform duration-1000") style =
        "animation: float 3s ease-in-out infinite; animation-delay: 1s;"
      > </ div>

      < div class
  = "relative z-10" > < div class
  = "flex items-center justify-between mb-4" > < div class
  = "p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg "
    + "group-hover:rotate-12 transition-transform duration-500"
      > < svg class
  = "w-6 h-6 text-white subtle-icon-pulse" fill = "none" stroke =
      "currentColor" viewBox = "0 0 24 24"
      > <path stroke - linecap = "round" stroke - linejoin =
              "round" stroke - width = "2" d =
                  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></ svg>
      </ div> < div class
  = "text-right" > < div class
  = "text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 "
    + "bg-clip-text text-transparent count-up"
      > ${analysisData ?.score_niche_fit || analysisData
          ?.niche_fit_score || 0 } < / div > < div class
  = "text-sm text-blue-600/80" > Niche Fit</ div></ div></ div>

      < h3 class
  = "text-lg font-bold text-gray-900 mb-3" > Target Alignment</ h3> < div class
  = "space-y-3" > < div class
  = "w-full bg-gray-200 rounded-full h-3 overflow-hidden" > < div class
  = ("h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full "
     + "transition-all duration-2000 ease-out progress-bar") style =
        "width: ${analysisData?.score_niche_fit || "
        + "analysisData?.niche_fit_score || 0}%; animation-delay: 1s;"
      > </ div></ div> < div class
  = "flex justify-between text-sm" > < span class
  = "text-gray-600" > Audience Quality</ span> < span class
  = "px-2 py-1 rounded-full text-xs font-bold ${
      analysisData
      ?.audience_quality == = 'High' ? 'bg-green-500 text-white'
                                     : analysisData
      ?.audience_quality == =
           'Medium' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                    }">${analysisData?.audience_quality || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Followers Card -->
                    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 shadow-2xl border border-green-200/50 hover-3d shimmer-effect transition-all duration-700 hover:shadow-3xl">
                        <div class="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 2s;"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-500">
                                    <svg class="w-6 h-6 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </div>
                                <div class="text-right">
                                    <div class="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent count-up">${(lead.follower_count || lead.followers_count || 0) > 1000 ? ((lead.follower_count || lead.followers_count || 0) / 1000).toFixed(1) + 'K' : (lead.follower_count || lead.followers_count || 0)}</div>
                                    <div class="text-sm text-green-600/80">Followers</div>
                                </div>
                            </div>
                            
                            <h3 class="text-lg font-bold text-gray-900 mb-3">Reach Potential</h3>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-gray-600">Category</span>
                                    <span class="px-2 py-1 rounded-full text-xs font-bold ${
                                        (lead.follower_count || lead.followers_count || 0) >= 10000 ? 'bg-purple-500 text-white' :
                                        (lead.follower_count || lead.followers_count || 0) >= 1000 ? 'bg-blue-500 text-white' :
                                        'bg-gray-500 text-white'
        }
        ">${(lead.follower_count || lead.followers_count || 0) >= 10000 ? 'Macro' : (lead.follower_count || lead.followers_count || 0) >= 1000 ? 'Micro' : 'Nano'}</span>
            < / div > < div class
        = "flex justify-between items-center" > < span class
        = "text-sm text-gray-600" > Engagement Rate</ span> < span class
        = "font-bold text-green-700" > ${analysisData ?.engagement_rate
                  ? `${analysisData.engagement_rate.toFixed(2)} %`
                  : 'N/A' }
                  < / span > </ div></ div></ div></ div></ div>
            `
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
background:
  transparent;
color:
# 6b7280;
border:
  none;
cursor:
  pointer;
                        }
                        
                        .tab-button:hover {
background:
  rgba(59, 130, 246, 0.1);
color:
# 3b82f6;
                        }
                        
                        .tab-button.active {
background:
  linear - gradient(135deg, #3b82f6, #8b5cf6);
color:
  white;
  box - shadow : 0 4px 12px rgba(59, 130, 246, 0.3);
                        }
                        
                        .tab-button:focus {
outline:
  2px solid #3b82f6;
  outline - offset : 2px;
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

        const tabContents =
            tabs.map((tab, index) = > {
                  const tabComponents = components[tab.id] || [];
                  const isActive = index == = 0;

                  return ` < div id = "tab-content-${tab.id}" class
                  = "tab-content" role = "tabpanel" aria - labelledby =
                      "tab-${tab.id}" style =
                          "display: ${isActive ? 'block' : 'none'}; opacity: "
                          + "${isActive ? '1' : '0'}; transform: "
                          + "translateY(0); transition: all 0.3s ease;"
                      > ${tabComponents.join('')} < / div >
                    `;
                }).join('');

        return ` < div class
        = "tabbed-container" > ${this.getComponent('tabNavigation')
                                     .render(lead, analysisData, tabs)}
            < div class
        = "tab-content-wrapper" style =
            "margin-top: 32px;" > ${tabContents} < / div > </ div>
`;
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
        }
        }

        // Export
        if (typeof module != = 'undefined' && module.exports) {
          module.exports = ModalComponents;
        } else {
          window.ModalComponents = ModalComponents;
        }
