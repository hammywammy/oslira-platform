// ===============================================================================
// MODAL COMPONENTS - DEEP ANALYSIS
// Components specific to deep analysis type
// ===============================================================================

// Extends ModalComponents from core
// Registers all deep-analysis-specific components

(async function() {

    window._modalComponentExtensions = window._modalComponentExtensions || [];
    
window._modalComponentExtensions.push(function() {

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

}); // Close extension function
})();
