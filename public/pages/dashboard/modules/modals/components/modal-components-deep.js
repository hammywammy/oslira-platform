// ===============================================================================
// MODAL COMPONENTS - DEEP ANALYSIS
// Components specific to deep analysis type
// ===============================================================================

// Extends ModalComponents from core
// Registers all deep-analysis-specific components

(function() {
    if (typeof window.ModalComponents === 'undefined') {
        console.error('❌ ModalComponents core not loaded');
        return;
    }

    const components = window.ModalComponents.prototype;

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
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Deep Analysis Summary</h3>
                    </div>
                    <p class="text-gray-700 leading-relaxed text-lg font-light">${payload.deep_summary}</p>
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
// PRE-PROCESSED METRICS - ANALYTICS TAB
// ===============================================================================
this.registerComponent('preProcessedMetrics', {
    condition: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        return (lead.analysis_type === 'xray' || lead.analysis_type === 'deep') && 
               payload?.pre_processed_metrics;
    },
    render: (lead, analysisData) => {
        const payload = this.getPayloadData(lead, analysisData);
        const metrics = payload.pre_processed_metrics;
        
        if (!metrics) return '<div class="p-8 text-center text-gray-500">No analytics data available</div>';
        
        const engagement = metrics.engagement || {};
        const content = metrics.content || {};
        const posting = metrics.posting || {};
        
        return `
            <div class="space-y-6">
                ${engagement.engagementRate ? `
                <div class="rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-100 p-8 shadow-xl border border-cyan-200/50">
                    <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span class="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                        Engagement Performance
                    </h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Rate</div>
                            <div class="text-2xl font-bold text-cyan-600">${engagement.engagementRate}%</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Avg Likes</div>
                            <div class="text-2xl font-bold text-cyan-600">${engagement.avgLikes?.toLocaleString() || 0}</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Avg Comments</div>
                            <div class="text-2xl font-bold text-cyan-600">${engagement.avgComments?.toLocaleString() || 0}</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Quality</div>
                            <div class="text-2xl font-bold text-cyan-600">${engagement.qualityScore || 0}</div>
                        </div>
                    </div>
                    ${engagement.videoPerformance ? `
                    <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Avg Views</div>
                            <div class="text-xl font-bold text-purple-600">${engagement.videoPerformance.avgViews?.toLocaleString() || 0}</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Videos</div>
                            <div class="text-xl font-bold text-purple-600">${engagement.videoPerformance.videoCount || 0}</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">View-Engage</div>
                            <div class="text-xl font-bold text-purple-600">${engagement.videoPerformance.viewToEngagementRatio}%</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Format Mix</div>
                            <div class="text-xl font-bold text-purple-600">${engagement.formatDistribution?.formatDiversity || 0}/3</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                ${content.contentThemes ? `
                <div class="rounded-3xl bg-gradient-to-br from-purple-50 to-pink-100 p-8 shadow-xl border border-purple-200/50">
                    <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        Content Intelligence
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Top Themes</div>
                            <div class="text-lg font-bold text-purple-600">${content.contentThemes}</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Caption Style</div>
                            <div class="text-lg font-bold text-purple-600 capitalize">${content.captionStyle}</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Avg Length</div>
                            <div class="text-lg font-bold text-purple-600">${content.avgCaptionLength} chars</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Collaborations</div>
                            <div class="text-lg font-bold text-purple-600">${Math.round((content.collaborationSignals?.collaborationFrequency || 0) * 100)}%</div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${posting.postsPerWeek !== undefined ? `
                <div class="rounded-3xl bg-gradient-to-br from-teal-50 to-green-100 p-8 shadow-xl border border-teal-200/50">
                    <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span class="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                        Posting Behavior
                    </h4>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Posts/Week</div>
                            <div class="text-2xl font-bold text-teal-600">${posting.postsPerWeek.toFixed(1)}x</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Consistency</div>
                            <div class="text-2xl font-bold text-teal-600 capitalize">${posting.consistencyLevel}</div>
                        </div>
                        <div class="p-4 bg-white/70 rounded-2xl">
                            <div class="text-sm text-gray-600 mb-1">Velocity</div>
                            <div class="text-2xl font-bold text-teal-600 capitalize">${posting.postingVelocity}</div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
});

   this.registerComponent('contentEngagementIntel', {
            condition: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                return (lead.analysis_type === 'xray' || lead.analysis_type === 'deep') && 
                       payload.pre_processed_metrics;
            },
            render: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                const metrics = payload.pre_processed_metrics;
                
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

        // ===============================================================================
// QUICK SUMMARY COMPONENT (Top of Analysis Tab)
// ===============================================================================

this.registerComponent('quickSummary', {
    condition: (lead, analysisData) => {
        return analysisData && (analysisData.quick_summary || lead.quick_summary);
    },
    render: (lead, analysisData) => {
        const quickSummary = analysisData?.quick_summary || lead.quick_summary || 'No summary available';
        
        return `
            <div class="group rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 p-8 shadow-2xl border border-blue-200/50 hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.1s;">
                <div class="flex items-center space-x-4 mb-4">
                    <div class="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                        <svg class="w-8 h-8 text-white subtle-icon-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Quick Summary</h3>
                </div>
                <p class="text-lg text-gray-700 leading-relaxed">${quickSummary}</p>
            </div>
        `;
    }
});

})();
