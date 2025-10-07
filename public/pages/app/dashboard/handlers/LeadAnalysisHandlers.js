//public/pages/dashboard/modules/handlers/lead-analysis-handlers.js

class LeadAnalysisHandlers {
    constructor() {
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Global handler for rendering lead analysis content
        window.renderLeadAnalysisContent = (leadData, container) => {
            this.renderLeadAnalysisContent(leadData, container);
        };

        // Global handler for loading lead analysis data
        window.loadLeadAnalysisData = async (leadId, container) => {
            try {
                console.log('📊 [LeadAnalysis] Loading data for:', leadId);
                
                const modalManager = window.modalManager;
                if (!modalManager || !modalManager.container) {
                    throw new Error('Modal manager not available');
                }
                
                const leadManager = modalManager.container.get('leadManager');
                if (!leadManager) {
                    throw new Error('Lead manager not found');
                }
                
                const leadData = await leadManager.viewLead(leadId);
                if (!leadData) {
                    throw new Error('Lead not found');
                }
                
                this.renderLeadAnalysisContent(leadData, container);
                
            } catch (error) {
                console.error('❌ Failed to load lead analysis:', error);
                this.showErrorModal(error.message, leadId);
            }
        };

        // Analysis functions
        window.updateProfileHeader = (lead) => this.updateProfileHeader(lead);
        window.updateScoreDisplays = (scores, runData) => this.updateScoreDisplays(scores, runData);
        window.updateAnalysisSummary = (lead, analysisData, runData) => this.updateAnalysisSummary(lead, analysisData, runData);
        window.triggerScoreAnimations = (scores) => this.triggerScoreAnimations(scores);
        window.animateCountUp = (elementId, targetValue) => this.animateCountUp(elementId, targetValue);
    }

    renderLeadAnalysisContent(leadData, container) {
        const { lead, analysisData } = leadData;
        
        console.log('🎨 [LeadAnalysis] Rendering content for:', lead.username);
        
        this.updateProfileHeader(lead);
        
        const scores = analysisData?.scores || {
            overall: 70,
            engagement: 58,
            nicheFit: 0,
            total: 0
        };
        
        this.updateScoreDisplays(scores);
        this.updateAnalysisSummary(lead, analysisData);
        
        setTimeout(() => {
            this.triggerScoreAnimations(scores);
        }, 300);
        
        container.style.opacity = '0';
        container.style.display = 'block';
        
        setTimeout(() => {
            container.style.transition = 'opacity 0.3s ease-out';
            container.style.opacity = '1';
        }, 100);
    }

    updateProfileHeader(lead) {
        const profileImage = document.getElementById('leadProfileImage');
        const username = document.getElementById('leadUsername');
        const badge = document.getElementById('leadBadge');
        const followers = document.getElementById('leadFollowers');
        const posts = document.getElementById('leadPosts');
        
        if (profileImage) {
            if (lead.profile_pic_url) {
                profileImage.src = `https://images.weserv.nl/?url=${encodeURIComponent(lead.profile_pic_url)}&w=80&h=80&fit=cover&mask=circle&errorredirect=https://via.placeholder.com/80x80/3B82F6/FFFFFF?text=${lead.username.charAt(0).toUpperCase()}`;
            } else {
                profileImage.src = `https://via.placeholder.com/80x80/3B82F6/FFFFFF?text=${lead.username.charAt(0).toUpperCase()}`;
            }
            profileImage.alt = `@${lead.username}`;
        }
        
        if (username) username.textContent = `@${lead.username}`;
        
        if (badge) {
            let badgeText = 'Influencer';
            if (lead.is_business_account) badgeText = 'Business';
            if (lead.followers_count > 10000) badgeText = 'Macro Influencer';
            if (lead.followers_count < 10000) badgeText = 'Micro Influencer';
            badge.textContent = badgeText;
        }
        
        if (followers) {
            const followerCount = lead.followers_count || 0;
            followers.textContent = `${followerCount.toLocaleString()} followers`;
        }
        
        if (posts) {
            const postCount = lead.posts_count || 0;
            posts.textContent = `${postCount} posts`;
        }
    }

    updateScoreDisplays(scores, runData) {
        const mappedScores = {
            overall: runData?.overall_score || scores?.overall || scores?.score || 0,
            engagement: runData?.engagement_score || scores?.engagement || 0,
            nicheFit: runData?.niche_fit_score || scores?.nicheFit || scores?.score_niche_fit || 0,
            total: runData?.overall_score || scores?.total || scores?.score_total || 0
        };
        
        const elements = [
            { id: 'overallScoreText', value: mappedScores.overall },
            { id: 'overallScoreDisplay', value: mappedScores.overall },
            { id: 'engagementScore', value: mappedScores.engagement },
            { id: 'nicheFitScore', value: mappedScores.nicheFit },
            { id: 'totalScore', value: mappedScores.total }
        ];
        
        elements.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 0;
            }
        });
    }

    updateAnalysisSummary(lead, analysisData, runData) {
        const summaryElement = document.getElementById('analysisSummary');
        if (!summaryElement) return;
        
        const summaryText = runData?.summary_text || 
                           analysisData?.deep_summary || 
                           analysisData?.summary_text ||
                           lead.quick_summary;
        
        const followerCount = lead.follower_count || lead.followers_count || 0;
        const postCount = lead.post_count || lead.posts_count || 0;
        const followingCount = lead.following_count || 0;
        const isBusinessAccount = lead.is_business_account || false;
        const isVerified = lead.is_verified_account || lead.is_verified || false;
        const isPrivate = lead.is_private_account || lead.is_private || false;
        
        const analysisType = runData?.analysis_type || lead.analysis_type || 'light';
        const isAdvancedAnalysis = analysisType === 'deep' || analysisType === 'xray';
        
const overallScore = runData?.overall_score || analysisData?.score_total || lead.score || 0;
        const engagementScore = runData?.engagement_score || analysisData?.engagement_score || 0;
        const nicheFitScore = runData?.niche_fit_score || analysisData?.score_niche_fit || 0;
        const confidenceLevel = runData?.confidence_level || analysisData?.confidence_level;
        
        const profileStatus = summaryText || 
            `${isVerified ? 'Verified' : 'Unverified'} ${isBusinessAccount ? 'business' : 'personal'} account with ${followerCount.toLocaleString()} followers${followingCount ? ` and ${followingCount.toLocaleString()} following` : ''}. ${isPrivate ? 'Private profile' : 'Public profile'} with ${postCount} posts and established online presence.`;
        
        const contentStrategy = analysisData?.engagement_insights || 
            `Profile shows ${postCount} posts with ${isAdvancedAnalysis ? 'detailed analytics available' : 'basic metrics'}. ${overallScore > 75 ? 'High-performing content strategy' : overallScore > 50 ? 'Moderate content performance' : 'Content strategy needs optimization'}.`;
        
        const businessOpportunity = (() => {
            if (overallScore >= 85) return 'Premium collaboration opportunity with high engagement potential and strong audience alignment.';
            if (overallScore >= 70) return 'Strong collaboration potential with good engagement metrics and audience fit.';
            if (overallScore >= 55) return 'Moderate opportunity with room for growth. Consider targeted outreach strategy.';
            if (overallScore >= 40) return 'Emerging opportunity requiring strategic approach and relationship building.';
            return 'Limited immediate opportunity. Focus on long-term relationship development.';
        })();
        
        const nextSteps = (() => {
            if (analysisType === 'xray') return 'X-Ray analysis complete. Implement advanced outreach strategy with personalized messaging and detailed audience insights.';
            if (analysisType === 'deep') return 'Deep analysis complete. Use provided outreach templates and engagement insights for strategic collaboration approach.';
            return `Light analysis complete (Score: ${overallScore}/100). ${overallScore > 60 ? 'Consider upgrading to deep analysis for detailed insights and outreach templates.' : 'Evaluate profile fit and consider deep analysis for comprehensive assessment.'}`;
        })();
        
        const summary = `
            <div class="analysis-summary-grid">
                <div class="summary-section">
                    <h4 class="summary-section-title">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        Profile Status
                    </h4>
                    <p class="summary-content">${profileStatus}</p>
                    ${confidenceLevel ? `<div class="confidence-indicator">Confidence: ${Math.round(confidenceLevel * 100)}%</div>` : ''}
                </div>
                
                <div class="summary-section">
                    <h4 class="summary-section-title">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        Performance Metrics
                    </h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">Overall Score:</span>
                            <span class="metric-value score-${overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low'}">${overallScore}/100</span>
                        </div>
                        ${isAdvancedAnalysis ? `
                            <div class="metric-item">
                                <span class="metric-label">Engagement:</span>
                                <span class="metric-value">${engagementScore}/100</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Niche Fit:</span>
                                <span class="metric-value">${nicheFitScore}/100</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="summary-section">
                    <h4 class="summary-section-title">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                        Content Strategy
                    </h4>
                    <p class="summary-content">${contentStrategy}</p>
                    ${analysisData?.audience_quality ? `<div class="audience-quality">Audience Quality: <span class="quality-${analysisData.audience_quality.toLowerCase()}">${analysisData.audience_quality}</span></div>` : ''}
                </div>
                
                <div class="summary-section">
                    <h4 class="summary-section-title">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                        </svg>
                        Business Opportunity
                    </h4>
                    <p class="summary-content">${businessOpportunity}</p>
                </div>
                
                <div class="summary-section">
                    <h4 class="summary-section-title">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                        </svg>
                        Next Steps
                    </h4>
                    <p class="summary-content">${nextSteps}</p>
                    ${isAdvancedAnalysis && analysisData?.outreach_message ? `
                        <div class="outreach-preview">
                            <strong>Outreach Ready:</strong> Personalized message template available
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <style>
                .analysis-summary-grid {
                    display: grid;
                    gap: 1.5rem;
                    margin-top: 1rem;
                }
                
                .summary-section {
                    padding: 1rem;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                }
                
                .summary-section-title {
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                
                .summary-content {
                    color: #4b5563;
                    line-height: 1.5;
                    margin: 0;
                }
                
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 0.75rem;
                    margin-top: 0.75rem;
                }
                
                .metric-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem;
                    background: white;
                    border-radius: 0.5rem;
                    border: 1px solid #e5e7eb;
                }
                
                .metric-label {
                    font-size: 0.75rem;
                    color: #6b7280;
                    font-weight: 500;
                }
                
                .metric-value {
                    font-weight: 700;
                    font-size: 0.875rem;
                }
                
                .score-high { color: #059669; }
                .score-medium { color: #d97706; }
                .score-low { color: #dc2626; }
                
                .confidence-indicator {
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: #6b7280;
                    font-weight: 500;
                }
                
                .audience-quality {
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: #6b7280;
                    font-weight: 500;
                }
                
                .quality-high { color: #059669; font-weight: 600; }
                .quality-medium { color: #d97706; font-weight: 600; }
                .quality-low { color: #dc2626; font-weight: 600; }
                
                .outreach-preview {
                    margin-top: 0.75rem;
                    padding: 0.5rem;
                    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                    border-radius: 0.5rem;
                    font-size: 0.75rem;
                    color: #1e40af;
                    border: 1px solid #93c5fd;
                }
                
                @media (min-width: 768px) {
                    .analysis-summary-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `;
        
        summaryElement.innerHTML = summary;
    }

    triggerScoreAnimations(scores) {
        setTimeout(() => {
            const scoreCircle = document.getElementById('overallScoreCircle');
            if (scoreCircle && scores.overall) {
                scoreCircle.style.strokeDasharray = `${scores.overall}, 100`;
            }
        }, 200);
        
        setTimeout(() => {
            const bars = [
                { id: 'engagementBar', value: scores.engagement },
                { id: 'nicheFitBar', value: scores.nicheFit },
                { id: 'totalScoreBar', value: scores.total }
            ];
            
            bars.forEach(({ id, value }) => {
                const bar = document.getElementById(id);
                if (bar) {
                    bar.style.width = `${value || 0}%`;
                }
            });
        }, 400);
        
        setTimeout(() => {
            this.animateCountUp('overallScoreText', scores.overall);
            this.animateCountUp('overallScoreDisplay', scores.overall);
            this.animateCountUp('engagementScore', scores.engagement);
            this.animateCountUp('nicheFitScore', scores.nicheFit);
            this.animateCountUp('totalScore', scores.total);
        }, 100);
    }

    animateCountUp(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element || !targetValue) return;
        
        const startValue = 0;
        const duration = 1500;
        const startTime = performance.now();
        
        const updateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        };
        
        requestAnimationFrame(updateCount);
    }

    showErrorModal(message, leadId) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        errorDiv.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md mx-4">
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Analysis</h3>
                    <p class="text-gray-500 mb-4">${message}</p>
                    <div class="flex space-x-3">
                        <button onclick="this.closest('.fixed').remove(); loadLeadAnalysisData('${leadId}', document.querySelector('.lead-modal-content'))" 
                                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            Try Again
                        </button>
                        <button onclick="this.closest('.fixed').remove(); closeLeadAnalysisModal()" 
                                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeadAnalysisHandlers;
} else {
    window.LeadAnalysisHandlers = LeadAnalysisHandlers;
}
