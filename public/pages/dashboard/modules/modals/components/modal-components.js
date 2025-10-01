// ===============================================================================
// MODAL COMPONENTS SYSTEM - Complete Modular Analysis Modal Builder
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

    // ===============================================================================
    // UTILITY METHODS
    // ===============================================================================
    
getProfileImageUrl(lead) {
    const url = lead.profile_picture_url || lead.profile_pic_url;
    return url ? 
        `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=160&h=160&fit=cover&mask=circle` : 
        '/assets/images/default-avatar.jpg';
}

    getScoreGradient(score) {
        if (score >= 85) return 'from-emerald-400 via-green-500 to-teal-600';
        if (score >= 70) return 'from-blue-400 via-indigo-500 to-purple-600';
        if (score >= 55) return 'from-yellow-400 via-orange-500 to-red-500';
        if (score >= 40) return 'from-orange-400 via-red-500 to-pink-600';
        return 'from-gray-400 via-slate-500 to-gray-600';
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
            const currentDelay = el.style.animationDelay || `${index * 0.1}s`;
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
                particle.style.animationDuration = `${2 + Math.random() * 2}s`;
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

    // ===============================================================================
    // DEFAULT COMPONENTS LIBRARY
    // ===============================================================================
    
    registerDefaultComponents() {
        
        // ===============================================================================
        // ANIMATED HERO HEADER COMPONENT
        // ===============================================================================
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
            condition: (lead, analysisData) => lead.analysis_type === 'deep' || lead.analysis_type === 'xray',
            render: (lead, analysisData) => `
                <!-- Animated Metrics Grid -->
                <div class="grid grid-cols-1 gap-6 md:grid-cols-3 stagger-reveal" style="animation-delay: 0.3s;">
                    <!-- Engagement Card -->
                    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 to-rose-100 p-6 shadow-2xl border border-pink-200/50 hover-3d shimmer-effect transition-all duration-700 hover:shadow-3xl">
                        <div class="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite;"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-500">
                                    <svg class="w-6 h-6 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                    </svg>
                                </div>
                                <div class="text-right">
                                    <div class="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent count-up">${analysisData?.engagement_score || 0}</div>
                                    <div class="text-sm text-pink-600/80">Engagement</div>
                                </div>
                            </div>
                            
                            <h3 class="text-lg font-bold text-gray-900 mb-3">Engagement Metrics</h3>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-gray-600">Avg. Likes</span>
                                    <span class="font-bold text-pink-700 count-up">${(analysisData?.avg_likes || 0).toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-gray-600">Avg. Comments</span>
                                    <span class="font-bold text-pink-700 count-up">${(analysisData?.avg_comments || 0).toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-gray-600">Rate</span>
                                    <span class="font-bold text-pink-700 count-up">${analysisData?.engagement_rate ? `${analysisData.engagement_rate.toFixed(2)}%` : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Niche Fit Card -->
                    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6 shadow-2xl border border-blue-200/50 hover-3d shimmer-effect transition-all duration-700 hover:shadow-3xl">
                        <div class="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 1s;"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-500">
                                    <svg class="w-6 h-6 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div class="text-right">
                                    <div class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent count-up">${analysisData?.score_niche_fit || analysisData?.niche_fit_score || 0}</div>
                                    <div class="text-sm text-blue-600/80">Niche Fit</div>
                                </div>
                            </div>
                            
                            <h3 class="text-lg font-bold text-gray-900 mb-3">Target Alignment</h3>
                            <div class="space-y-3">
                                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-2000 ease-out progress-bar" 
                                         style="width: ${analysisData?.score_niche_fit || analysisData?.niche_fit_score || 0}%; animation-delay: 1s;"></div>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Audience Quality</span>
                                    <span class="px-2 py-1 rounded-full text-xs font-bold ${
                                        analysisData?.audience_quality === 'High' ? 'bg-green-500 text-white' :
                                        analysisData?.audience_quality === 'Medium' ? 'bg-yellow-500 text-white' :
                                        'bg-red-500 text-white'
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
                                    }">${(lead.follower_count || lead.followers_count || 0) >= 10000 ? 'Macro' : (lead.follower_count || lead.followers_count || 0) >= 1000 ? 'Micro' : 'Nano'}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-gray-600">Engagement Rate</span>
                                    <span class="font-bold text-green-700">${analysisData?.engagement_rate ? `${analysisData.engagement_rate.toFixed(2)}%` : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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

// Update existing sellingPoints condition to check payload
this.registerComponent('sellingPoints', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return (analysisData?.selling_points && analysisData.selling_points.length > 0) ||
               (payload?.selling_points && payload.selling_points.length > 0);
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        const sellingPoints = payload?.selling_points || analysisData?.selling_points || [];
        
        return `
            <!-- Your existing selling points HTML with payload data -->
            <div class="group rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-100 p-8 shadow-2xl border border-yellow-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.5s;">
                <div class="flex items-center space-x-4 mb-6">
                    <div class="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                        <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Key Selling Points</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${sellingPoints.map((point, index) => `
                        <div class="group/item flex items-start space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-yellow-200/50 hover-3d shimmer-effect transition-all duration-500 hover:bg-white hover:shadow-xl count-up" style="animation-delay: ${0.6 + (index * 0.1)}s;">
                            <div class="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover/item:scale-110 transition-transform duration-300 shadow-lg">
                                ${index + 1}
                            </div>
                            <span class="text-gray-700 font-medium leading-relaxed">${point}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
});

// Update existing outreachMessage condition to check payload
this.registerComponent('outreachMessage', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return analysisData?.outreach_message || payload?.outreach_message;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        const outreachMessage = payload?.outreach_message || analysisData?.outreach_message;
        
        return `
            <!-- Your existing outreach message HTML with payload data -->
            <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-pink-100 p-8 shadow-2xl border-2 border-purple-200/50 hover-3d stagger-reveal" style="animation-delay: 0.6s;">
                <!-- Keep your existing animated border and styling -->
                <div class="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-1000"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.405L3 21l2.595-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"/>
                                </svg>
                            </div>
                            <h3 class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Ready-to-Send Message</h3>
                        </div>
                        <!-- Keep your existing copy button styling -->
                        <button onclick="copyOutreachMessage()" class="group/btn relative overflow-hidden px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 shimmer-effect">
                            <span class="relative z-10 flex items-center space-x-2">
                                <svg class="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                </svg>
                                <span>Copy Message</span>
                            </span>
                        </button>
                    </div>
                    <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-inner">
                        <p class="text-gray-700 leading-relaxed text-lg font-light" id="outreachMessage">${outreachMessage}</p>
                    </div>
                </div>
            </div>
        `;
    }
});

        // ===============================================================================
        // ENGAGEMENT INSIGHTS COMPONENT
        // ===============================================================================
        this.registerComponent('engagementInsights', {
            condition: (lead, analysisData) => analysisData?.engagement_insights,
            render: (lead, analysisData) => `
                <!-- Insights with Floating Elements -->
                <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-100 p-8 shadow-2xl border border-teal-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.7s;">
                    <!-- Floating geometric shapes -->
                    <div class="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" style="animation: float 4s ease-in-out infinite;"></div>
                    <div class="absolute bottom-8 left-8 w-6 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 rotate-45 opacity-20 group-hover:rotate-180 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 1s;"></div>
                    
                    <div class="relative z-10">
                        <div class="flex items-center space-x-4 mb-6">
                            <div class="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                            </div>
                            <h3 class="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Pro Insights</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed text-lg font-light">${analysisData.engagement_insights}</p>
                    </div>
                </div>
            `
        });

        // ===============================================================================
        // LIGHT ANALYSIS UPGRADE NOTICE COMPONENT
        // ===============================================================================
        this.registerComponent('lightAnalysisNotice', {
            condition: (lead, analysisData) => lead.analysis_type === 'light',
            render: (lead, analysisData) => {
                const summaryText = lead.quick_summary || analysisData?.summary_text || 'Basic profile analysis shows potential for outreach.';
                
                return `
                    <!-- Light Analysis with Animated Elements -->
                    <div class="group relative overflow-hidden rounded-3xl bg-white p-12 shadow-2xl border-2 border-blue-200/50 text-center hover-3d stagger-reveal" style="animation-delay: 0.3s;">
                        <!-- Pulsing background orbs -->
                        <div class="absolute top-8 left-8 w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite;"></div>
                        <div class="absolute bottom-8 right-8 w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-1000" style="animation: float 4s ease-in-out infinite; animation-delay: 1s;"></div>
                        
                        <div class="relative z-10 space-y-6">
                            <div class="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                                <svg class="w-10 h-10 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <h3 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent count-up">Light Analysis Complete</h3>
                            <p class="text-gray-600 text-lg font-light max-w-2xl mx-auto count-up" style="animation-delay: 0.3s;">
                                ${summaryText}
                            </p>
                            <p class="text-gray-500 max-w-xl mx-auto count-up" style="animation-delay: 0.6s;">
                                For detailed engagement metrics, audience insights, and personalized outreach messages, run a deep analysis.
                            </p>
                            <button onclick="startDeepAnalysis('${lead.username}')" class="group/btn relative overflow-hidden px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 shimmer-effect count-up" style="animation-delay: 0.9s;">
                                <span class="relative z-10 flex items-center space-x-3">
                                    <svg class="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                    <span>Run Deep Analysis</span>
                                </span>
                            </button>
                        </div>
                    </div>
                `;
            }
        });

        // ===============================================================================
        // REASONS COMPONENT (If needed for specific analysis types)
        // ===============================================================================
        this.registerComponent('reasons', {
            condition: (lead, analysisData) => analysisData?.reasons && analysisData.reasons.length > 0,
            render: (lead, analysisData) => `
                <!-- Reasons Section -->
                <div class="group rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-100 p-8 shadow-2xl border border-indigo-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.5s;">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Why This Lead Matters</h3>
                    </div>
                    <div class="space-y-4">
                        ${analysisData.reasons.map((reason, index) => `
                            <div class="flex items-start space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200/50 hover-3d transition-all duration-300 count-up" style="animation-delay: ${0.6 + (index * 0.1)}s;">
                                <div class="w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    ${index + 1}
                                </div>
                                <span class="text-gray-700 font-medium">${reason}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
        });

        // ===============================================================================
        // AUDIENCE INSIGHTS COMPONENT
        // ===============================================================================
        this.registerComponent('audienceInsights', {
            condition: (lead, analysisData) => analysisData?.audience_insights,
            render: (lead, analysisData) => `
                <!-- Audience Insights -->
                <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-green-100 p-8 shadow-2xl border border-emerald-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.7s;">
                    <div class="absolute top-4 left-4 w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite;"></div>
                    
                    <div class="relative z-10">
                        <div class="flex items-center space-x-4 mb-6">
                            <div class="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                            </div>
                            <h3 class="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Audience Intelligence</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed text-lg font-light">${analysisData.audience_insights}</p>
                    </div>
                </div>
            `
        });

        // ===============================================================================
        // ENGAGEMENT METRICS COMPONENT (Alternative to metricsGrid if needed separately)
        // ===============================================================================
        this.registerComponent('engagementMetrics', {
            condition: (lead, analysisData) => (lead.analysis_type === 'deep' || lead.analysis_type === 'xray') && analysisData?.engagement_score,
            render: (lead, analysisData) => `
                <!-- Detailed Engagement Metrics -->
                <div class="group rounded-3xl bg-gradient-to-br from-pink-50 to-rose-100 p-8 shadow-2xl border border-pink-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.4s;">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Engagement Analysis</h3>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50">
                            <div class="text-2xl font-bold text-pink-700 count-up">${analysisData?.engagement_score || 0}</div>
                            <div class="text-sm text-gray-600">Score</div>
                        </div>
                        <div class="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50">
                            <div class="text-2xl font-bold text-pink-700 count-up">${(analysisData?.avg_likes || 0).toLocaleString()}</div>
                            <div class="text-sm text-gray-600">Avg Likes</div>
                        </div>
                        <div class="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50">
                            <div class="text-2xl font-bold text-pink-700 count-up">${(analysisData?.avg_comments || 0).toLocaleString()}</div>
                            <div class="text-sm text-gray-600">Avg Comments</div>
                        </div>
                        <div class="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50">
                            <div class="text-2xl font-bold text-pink-700 count-up">${analysisData?.engagement_rate ? `${analysisData.engagement_rate.toFixed(2)}%` : 'N/A'}</div>
                            <div class="text-sm text-gray-600">Rate</div>
                        </div>
                    </div>
                </div>
            `
        });

// 1. DEEP SUMMARY COMPONENT (NEW - matches your styling)
this.registerComponent('deepSummary', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return lead.analysis_type === 'deep' && payload.deep_summary;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return `
            <!-- Deep Summary with your existing styling pattern -->
            <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 p-8 shadow-2xl border border-blue-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.4s;">
                <!-- Floating geometric shapes matching your pattern -->
                <div class="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" style="animation: float 4s ease-in-out infinite;"></div>
                <div class="absolute bottom-8 left-8 w-6 h-6 bg-gradient-to-br from-indigo-400 to-blue-500 rotate-45 opacity-20 group-hover:rotate-180 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 1s;"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Deep Analysis Insights</h3>
                    </div>
                    <p class="text-gray-700 leading-relaxed text-lg font-light">${payload.deep_summary}</p>
                </div>
            </div>
        `;
    }
});

// 2. ENHANCED ENGAGEMENT BREAKDOWN (NEW - using your metrics style)
this.registerComponent('engagementBreakdown', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return lead.analysis_type === 'deep' && payload.engagement_breakdown;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        const metrics = payload.engagement_breakdown || {};
        
        return `
            <!-- Enhanced Engagement Breakdown matching your metrics grid style -->
            <div class="group rounded-3xl bg-gradient-to-br from-pink-50 to-rose-100 p-8 shadow-2xl border border-pink-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.6s;">
                <div class="flex items-center space-x-4 mb-6">
                    <div class="p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                        <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Detailed Engagement Metrics</h3>
                </div>
                
                <div class="grid grid-cols-3 gap-6">
                    <div class="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200/50 hover-3d transition-all duration-300">
                        <div class="text-3xl font-bold text-pink-700 count-up" data-target="${metrics.avg_likes || 0}">0</div>
                        <div class="text-sm text-pink-600/80 mt-2">Average Likes</div>
                    </div>
                    <div class="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200/50 hover-3d transition-all duration-300">
                        <div class="text-3xl font-bold text-pink-700 count-up" data-target="${metrics.avg_comments || 0}">0</div>
                        <div class="text-sm text-pink-600/80 mt-2">Average Comments</div>
                    </div>
                    <div class="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200/50 hover-3d transition-all duration-300">
                        <div class="text-3xl font-bold text-pink-700 count-up" data-target="${Math.round(metrics.engagement_rate || 0)}">0</div>
                        <div class="text-sm text-pink-600/80 mt-2">Engagement Rate %</div>
                    </div>
                </div>
            </div>
        `;
    }
});

// 3. AUDIENCE INSIGHTS ENHANCED (NEW - your existing one is good, this adds payload support)
this.registerComponent('payloadAudienceInsights', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return lead.analysis_type === 'deep' && payload.audience_insights;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return `
            <!-- Payload-aware Audience Insights -->
            <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-green-100 p-8 shadow-2xl border border-emerald-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.7s;">
                <div class="absolute top-4 left-4 w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite;"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Audience Intelligence</h3>
                    </div>
                    <p class="text-gray-700 leading-relaxed text-lg font-light">${payload.audience_insights}</p>
                </div>
            </div>
        `;
    }
});

// LATEST POSTS COMPONENT (for when data exists)
this.registerComponent('latestPosts', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return lead.analysis_type === 'deep' && payload.latest_posts && payload.latest_posts.length > 0;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return `
            <!-- Latest Posts Analysis -->
            <div class="group rounded-3xl bg-gradient-to-br from-violet-50 to-purple-100 p-8 shadow-2xl border border-violet-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.8s;">
                <div class="flex items-center space-x-4 mb-6">
                    <div class="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                        <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Recent Content Analysis</h3>
                </div>
                <div class="space-y-4">
                    ${payload.latest_posts.map((post, index) => `
                        <div class="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-200/50 hover-3d transition-all duration-300 count-up" style="animation-delay: ${0.9 + (index * 0.1)}s;">
                            <p class="text-gray-700 font-medium">${post}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
});

        // ===============================================================================
// X-RAY COMPONENTS - Copywriter Profile
// ===============================================================================

this.registerComponent('copywriterProfile', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return lead.analysis_type === 'xray' && payload.copywriter_profile;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        const profile = payload.copywriter_profile;
        
        return `
            <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-pink-100 p-8 shadow-2xl border border-purple-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.2s;">
                <div class="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" style="animation: float 4s ease-in-out infinite;"></div>
                <div class="absolute bottom-8 left-8 w-6 h-6 bg-gradient-to-br from-pink-400 to-purple-500 rotate-45 opacity-20 group-hover:rotate-180 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 1s;"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Copywriter Profile</h3>
                    </div>
                    
                    <!-- Demographics -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                            Demographics
                        </h4>
                        <p class="text-gray-700 leading-relaxed">${profile.demographics}</p>
                    </div>
                    
                    <!-- Psychographics -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <span class="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                            Psychographics
                        </h4>
                        <p class="text-gray-700 leading-relaxed">${profile.psychographics}</p>
                    </div>
                    
                    <!-- Pain Points -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <span class="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                            Pain Points
                        </h4>
                        <div class="space-y-2">
                            ${profile.pain_points.map((point, index) => `
                                <div class="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span class="text-white text-xs font-bold">${index + 1}</span>
                                    </div>
                                    <p class="text-gray-700 text-sm">${point}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Dreams & Desires -->
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            Dreams & Desires
                        </h4>
                        <div class="space-y-2">
                            ${profile.dreams_desires.map((desire, index) => `
                                <div class="flex items-start space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                                    <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span class="text-white text-xs font-bold">${index + 1}</span>
                                    </div>
                                    <p class="text-gray-700 text-sm">${desire}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
});

// ===============================================================================
// X-RAY COMPONENTS - Commercial Intelligence
// ===============================================================================

this.registerComponent('commercialIntelligence', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return lead.analysis_type === 'xray' && payload.commercial_intelligence;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        const intel = payload.commercial_intelligence;
        
        // Budget tier styling
        const budgetColors = {
            'low-budget': 'text-blue-600 bg-blue-50 border-blue-200',
            'mid-market': 'text-purple-600 bg-purple-50 border-purple-200',
            'premium': 'text-orange-600 bg-orange-50 border-orange-200',
            'luxury': 'text-pink-600 bg-pink-50 border-pink-200'
        };
        
        const stageColors = {
            'unaware': 'text-gray-600 bg-gray-50 border-gray-200',
            'problem-aware': 'text-yellow-600 bg-yellow-50 border-yellow-200',
            'solution-aware': 'text-blue-600 bg-blue-50 border-blue-200',
            'product-aware': 'text-purple-600 bg-purple-50 border-purple-200',
            'ready-to-buy': 'text-green-600 bg-green-50 border-green-200'
        };
        
        return `
            <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-100 p-8 shadow-2xl border border-indigo-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.4s;">
                <div class="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" style="animation: float 4s ease-in-out infinite;"></div>
                <div class="absolute bottom-8 left-8 w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rotate-45 opacity-20 group-hover:rotate-180 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 1s;"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Commercial Intelligence</h3>
                    </div>
                    
                    <!-- Key Metrics Grid -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                            <div class="text-sm text-gray-600 mb-1">Budget Tier</div>
                            <div class="px-3 py-1 rounded-full text-sm font-semibold border ${budgetColors[intel.budget_tier] || budgetColors['low-budget']}">
                                ${intel.budget_tier.replace('-', ' ').toUpperCase()}
                            </div>
                        </div>
                        
                        <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                            <div class="text-sm text-gray-600 mb-1">Decision Role</div>
                            <div class="text-lg font-bold text-gray-800 capitalize">${intel.decision_role}</div>
                        </div>
                        
                        <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 col-span-2">
                            <div class="text-sm text-gray-600 mb-1">Buying Stage</div>
                            <div class="px-3 py-1 rounded-full text-sm font-semibold border ${stageColors[intel.buying_stage] || stageColors['unaware']}">
                                ${intel.buying_stage.replace('-', ' ').toUpperCase()}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Objections -->
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <span class="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                            Likely Objections
                        </h4>
                        <div class="space-y-2">
                            ${intel.objections.map((objection, index) => `
                                <div class="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span class="text-white text-xs font-bold">${index + 1}</span>
                                    </div>
                                    <p class="text-gray-700 text-sm">${objection}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
});

// ===============================================================================
// X-RAY COMPONENTS - Persuasion Strategy
// ===============================================================================

this.registerComponent('persuasionStrategy', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return lead.analysis_type === 'xray' && payload.persuasion_strategy;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        const strategy = payload.persuasion_strategy;
        
        return `
            <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100 p-8 shadow-2xl border border-emerald-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.6s;">
                <div class="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" style="animation: float 4s ease-in-out infinite;"></div>
                <div class="absolute bottom-8 left-8 w-6 h-6 bg-gradient-to-br from-teal-400 to-emerald-500 rotate-45 opacity-20 group-hover:rotate-180 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 1s;"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Persuasion Strategy</h3>
                    </div>
                    
                    <!-- Strategy Overview -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                            <div class="text-sm text-gray-600 mb-1">Primary Angle</div>
                            <div class="text-lg font-bold text-gray-800 capitalize">${strategy.primary_angle.replace('-', ' ')}</div>
                        </div>
                        
                        <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                            <div class="text-sm text-gray-600 mb-1">Hook Style</div>
                            <div class="text-lg font-bold text-gray-800 capitalize">${strategy.hook_style.replace('-', ' ')}</div>
                        </div>
                        
                        <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 col-span-full">
                            <div class="text-sm text-gray-600 mb-1">Communication Style</div>
                            <div class="text-lg font-bold text-gray-800 capitalize">${strategy.communication_style.replace('-', ' ')}</div>
                        </div>
                    </div>
                    
                    <!-- Proof Elements -->
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                            Recommended Proof Elements
                        </h4>
                        <div class="space-y-2">
                            ${strategy.proof_elements.map((element, index) => `
                                <div class="flex items-start space-x-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div class="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span class="text-white text-xs font-bold">${index + 1}</span>
                                    </div>
                                    <p class="text-gray-700 text-sm">${element}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
});

        // ===============================================================================
        // TAB SYSTEM COMPONENTS
        // ===============================================================================
        
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
                    
                    return `
                        <div 
                            id="tab-content-${tab.id}" 
                            class="tab-content" 
                            role="tabpanel"
                            aria-labelledby="tab-${tab.id}"
                            style="display: ${isActive ? 'block' : 'none'}; opacity: ${isActive ? '1' : '0'}; transform: translateY(0); transition: all 0.3s ease;">
                            ${tabComponents.join('')}
                        </div>
                    `;
                }).join('');

return `
    <div class="tabbed-container">
        ${this.getComponent('tabNavigation').render(lead, analysisData, tabs)}
        <div class="tab-content-wrapper" style="margin-top: 32px;">
            ${tabContents}
        </div>
    </div>
`;
            }
        });

        // ===============================================================================
        // PLACEHOLDER PERSONALITY COMPONENTS
        // ===============================================================================
        
        this.registerComponent('personalityOverview', {
            render: (lead, analysisData) => `
                <div class="personality-overview bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                    <h3 class="text-xl font-bold text-purple-800 mb-4 flex items-center">
                        <span class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm mr-3">🧠</span>
                        Personality Overview
                    </h3>
                    <div class="text-gray-600">
                        <p class="mb-3">Advanced personality analysis coming soon in this tab.</p>
                        <div class="bg-white p-4 rounded-lg border border-purple-100">
                            <p class="text-sm text-purple-600 font-medium">Future Features:</p>
                            <ul class="text-sm text-gray-600 mt-2 space-y-1">
                                <li>• DISC Personality Assessment</li>
                                <li>• Communication Preferences</li>
                                <li>• Behavioral Patterns</li>
                                <li>• Motivation Drivers</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `
        });

        this.registerComponent('behaviorPatterns', {
            render: (lead, analysisData) => `
                <div class="behavior-patterns bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mt-6">
                    <h3 class="text-xl font-bold text-blue-800 mb-4 flex items-center">
                        <span class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">📊</span>
                        Behavior Patterns
                    </h3>
                    <div class="text-gray-600">
                        <p>Detailed behavioral analysis will be displayed here.</p>
                    </div>
                </div>
            `
        });

        this.registerComponent('communicationStyle', {
            render: (lead, analysisData) => `
                <div class="communication-style bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mt-6">
                    <h3 class="text-xl font-bold text-green-800 mb-4 flex items-center">
                        <span class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mr-3">💬</span>
                        Communication Style
                    </h3>
                    <div class="text-gray-600">
                        <p>Communication preferences and style analysis coming soon.</p>
                    </div>
                </div>
            `
        });

        this.registerComponent('motivationDrivers', {
            render: (lead, analysisData) => `
                <div class="motivation-drivers bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 mt-6">
                    <h3 class="text-xl font-bold text-yellow-800 mb-4 flex items-center">
                        <span class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm mr-3">🎯</span>
                        Motivation Drivers
                    </h3>
                    <div class="text-gray-600">
                        <p>Motivation and drive analysis will be available here.</p>
                    </div>
                </div>
            `
        });
    }

    // ===============================================================================
    // POST-RENDER INITIALIZATION
    // ===============================================================================
    
initializeAnimations(modalContent, lead, analysisData) {
    // Initialize tab system if tabs exist
    const tabNavigation = modalContent.querySelector('.tab-navigation');
    if (tabNavigation && window.TabSystem) {
        const tabs = Array.from(modalContent.querySelectorAll('[data-tab]')).map(btn => ({
            id: btn.getAttribute('data-tab'),
            label: btn.textContent.trim()
        }));
        
        if (tabs.length > 0) {
            const tabSystem = window.TabSystem.create('modalContent', tabs, tabs[0].id);
            console.log('✅ [ModalComponents] Tab system initialized');
        }
    }

    // Keep existing animation code...
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
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalComponents;
} else {
    window.ModalComponents = ModalComponents;
}
