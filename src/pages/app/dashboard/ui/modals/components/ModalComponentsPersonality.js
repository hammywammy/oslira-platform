// ===============================================================================
// MODAL COMPONENTS - PERSONALITY ANALYSIS
// NEW FILE: public/pages/dashboard/modules/modals/components/modal-components-personality.js
// Replaces placeholder personality components
// ===============================================================================

(async function() {

    window._modalComponentExtensions = window._modalComponentExtensions || [];
    
    window._modalComponentExtensions.push(function() {

        // ============================================================================
        // PERSONALITY OVERVIEW - DISC Profile Card
        // ============================================================================
        
        this.registerComponent('personalityOverview', {
            condition: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                return (lead.analysis_type === 'deep' || lead.analysis_type === 'xray') && 
                       payload.personality_profile && 
                       payload.personality_profile.disc_profile;
            },
            render: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                const personality = payload.personality_profile;
                
                if (!personality) return '';
                
                // DISC type color mapping
                const discColors = {
                    'D': { bg: 'from-red-50 to-orange-100', border: 'border-red-200', text: 'text-red-800', icon: 'bg-red-500' },
                    'I': { bg: 'from-yellow-50 to-amber-100', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'bg-yellow-500' },
                    'S': { bg: 'from-green-50 to-emerald-100', border: 'border-green-200', text: 'text-green-800', icon: 'bg-green-500' },
                    'C': { bg: 'from-blue-50 to-indigo-100', border: 'border-blue-200', text: 'text-blue-800', icon: 'bg-blue-500' }
                };
                
                const primaryDisc = personality.disc_profile.charAt(0).toUpperCase();
                const colors = discColors[primaryDisc] || discColors['I'];
                
                // Confidence badge
                const confidenceBadge = {
                    'high': '<span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">High Confidence</span>',
                    'medium': '<span class="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Medium Confidence</span>',
                    'low': '<span class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Low Confidence</span>'
                };
                
                // Content authenticity indicator
                const authenticityLabel = {
                    'ai_generated': '🤖 AI-Generated Content',
                    'ai_assisted': '🤝 AI-Assisted Content',
                    'human_authentic': '✍️ Human Authentic',
                    'insufficient_data': '❓ Insufficient Data'
                };
                
                return `
                    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br ${colors.bg} p-8 shadow-2xl border ${colors.border} hover-3d shimmer-effect stagger-reveal" style="animation-delay: 0.1s;">
                        <div class="absolute top-4 right-4 w-10 h-10 ${colors.icon} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite;"></div>
                        
                        <div class="relative z-10">
                            <!-- Header -->
                            <div class="flex items-center justify-between mb-6">
                                <div class="flex items-center space-x-4">
                                    <div class="p-4 ${colors.icon} rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-2xl font-bold ${colors.text}">Personality Profile</h3>
                                        <p class="text-sm text-gray-600">DISC Assessment</p>
                                    </div>
                                </div>
                                ${confidenceBadge[personality.data_confidence] || ''}
                            </div>
                            
                            <!-- DISC Profile Badge -->
                            <div class="bg-white/60 backdrop-blur p-6 rounded-2xl mb-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="text-sm text-gray-600 mb-2">DISC Type</div>
                                        <div class="text-4xl font-bold ${colors.text}">${personality.disc_profile}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-gray-600 mb-2">Content Style</div>
                                        <div class="text-sm font-semibold text-gray-700">
                                            ${authenticityLabel[personality.content_authenticity] || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- DISC Type Description -->
                            <div class="bg-white/40 backdrop-blur p-4 rounded-xl text-sm text-gray-700 leading-relaxed">
                                ${this.getDISCDescription(personality.disc_profile)}
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // ============================================================================
        // BEHAVIOR PATTERNS
        // ============================================================================
        
        this.registerComponent('behaviorPatterns', {
            condition: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                return (lead.analysis_type === 'deep' || lead.analysis_type === 'xray') && 
                       payload.personality_profile && 
                       payload.personality_profile.behavior_patterns;
            },
            render: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                const personality = payload.personality_profile;
                
                if (!personality || !personality.behavior_patterns) return '';
                
                return `
                    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-100 p-8 shadow-2xl border border-indigo-200 hover-3d stagger-reveal" style="animation-delay: 0.2s;">
                        <div class="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" style="animation: float 4s ease-in-out infinite;"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center space-x-4 mb-6">
                                <div class="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                    </svg>
                                </div>
                                <h3 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Behavior Patterns</h3>
                            </div>
                            
                            <div class="space-y-3">
                                ${personality.behavior_patterns.map((pattern, index) => `
                                    <div class="bg-white/60 backdrop-blur p-4 rounded-xl border border-indigo-100 hover-3d transition-all duration-300" style="animation-delay: ${0.3 + (index * 0.1)}s;">
                                        <div class="flex items-start space-x-3">
                                            <div class="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                ${index + 1}
                                            </div>
                                            <p class="text-gray-700 font-medium flex-1">${pattern}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // ============================================================================
        // COMMUNICATION STYLE
        // ============================================================================
        
        this.registerComponent('communicationStyle', {
            condition: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                return (lead.analysis_type === 'deep' || lead.analysis_type === 'xray') && 
                       payload.personality_profile && 
                       payload.personality_profile.communication_style;
            },
            render: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                const personality = payload.personality_profile;
                
                if (!personality || !personality.communication_style) return '';
                
                return `
                    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-50 to-teal-100 p-8 shadow-2xl border border-cyan-200 hover-3d stagger-reveal" style="animation-delay: 0.3s;">
                        <div class="absolute bottom-8 right-8 w-6 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 rotate-45 opacity-20 group-hover:rotate-180 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite; animation-delay: 1s;"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center space-x-4 mb-6">
                                <div class="p-4 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                    </svg>
                                </div>
                                <h3 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Communication Style</h3>
                            </div>
                            
                            <div class="bg-white/60 backdrop-blur p-6 rounded-2xl">
                                <p class="text-lg text-gray-700 leading-relaxed font-light">
                                    ${personality.communication_style}
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // ============================================================================
        // MOTIVATION DRIVERS
        // ============================================================================
        
        this.registerComponent('motivationDrivers', {
            condition: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                return (lead.analysis_type === 'deep' || lead.analysis_type === 'xray') && 
                       payload.personality_profile && 
                       payload.personality_profile.motivation_drivers;
            },
            render: (lead, analysisData) => {
                const payload = this.getPayloadData(lead, analysisData);
                const personality = payload.personality_profile;
                
                if (!personality || !personality.motivation_drivers) return '';
                
                return `
                    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 p-8 shadow-2xl border border-amber-200 hover-3d stagger-reveal" style="animation-delay: 0.4s;">
                        <div class="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000" style="animation: float 3s ease-in-out infinite;"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center space-x-4 mb-6">
                                <div class="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                </div>
                                <h3 class="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Motivation Drivers</h3>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${personality.motivation_drivers.map((driver, index) => `
                                    <div class="bg-white/60 backdrop-blur p-5 rounded-xl border border-amber-100 hover-3d transition-all duration-300" style="animation-delay: ${0.5 + (index * 0.1)}s;">
                                        <div class="flex items-center space-x-3">
                                            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                                                <span class="text-white text-lg">⚡</span>
                                            </div>
                                            <p class="text-gray-700 font-semibold flex-1">${driver}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // ============================================================================
        // HELPER METHOD - DISC Descriptions
        // ============================================================================
        
        this.getDISCDescription = function(discProfile) {
            const descriptions = {
                'D': 'Dominance - Direct, results-oriented, and confident. Prefers challenges and making quick decisions.',
                'I': 'Influence - Enthusiastic, optimistic, and people-oriented. Values relationships and social recognition.',
                'S': 'Steadiness - Patient, supportive, and team-oriented. Values stability and harmonious relationships.',
                'C': 'Conscientiousness - Accurate, analytical, and detail-oriented. Values quality and systematic approaches.',
                'DI': 'Dominance-Influence - Assertive and outgoing. Combines directness with social confidence.',
                'ID': 'Influence-Dominance - Outgoing and assertive. Enthusiastic leader who values results and relationships.',
                'DS': 'Dominance-Steadiness - Direct yet supportive. Balances decisiveness with team consideration.',
                'SD': 'Steadiness-Dominance - Supportive yet decisive. Patient leader who takes action when needed.',
                'DC': 'Dominance-Conscientiousness - Direct and analytical. Results-focused with attention to detail.',
                'CD': 'Conscientiousness-Dominance - Analytical and decisive. Detail-oriented with strong decision-making.',
                'IS': 'Influence-Steadiness - Friendly and supportive. People-person who values team harmony.',
                'SI': 'Steadiness-Influence - Supportive and friendly. Team player with good social skills.',
                'IC': 'Influence-Conscientiousness - Enthusiastic and precise. Social yet detail-conscious.',
                'CI': 'Conscientiousness-Influence - Precise and friendly. Analytical with good people skills.',
                'SC': 'Steadiness-Conscientiousness - Patient and accurate. Reliable team member who values quality.',
                'CS': 'Conscientiousness-Steadiness - Accurate and patient. Detail-oriented with strong teamwork.'
            };
            
            return descriptions[discProfile] || 'Personality profile analysis based on observable behavior patterns.';
        };

        console.log('✅ [modal-components-personality] All personality components registered');
    });

})();
