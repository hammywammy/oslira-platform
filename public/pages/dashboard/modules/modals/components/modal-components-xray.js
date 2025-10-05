// ===============================================================================
// MODAL COMPONENTS - X-RAY ANALYSIS
// Components specific to X-Ray analysis type
// ===============================================================================

// Extends ModalComponents from core
// Registers all X-Ray-specific components

(async function() {

        if (!window.DependencyReadiness) {
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (window.DependencyReadiness) {
                    clearInterval(checkInterval);
                    console.log('✅ [modal-components-deep] DependencyReadiness loaded');
                    resolve();
                }
            }, 50);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.error('❌ [modal-components-deep] DependencyReadiness timeout');
                resolve();
            }, 10000);
        });
    }
    // Wait for ModalComponents to be ready
    try {
        await window.DependencyReadiness.waitForDependency('ModalComponents');
    } catch (error) {
        console.error('❌ [modal-components-xray] ModalComponents core not loaded:', error);
        return;
    }

    window._modalComponentExtensions = window._modalComponentExtensions || [];
    
    window._modalComponentExtensions.push(function() {

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

}); // Close extension function
})();
