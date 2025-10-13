// ===============================================================================
// MODAL BUILDER ENGINE - Migrated to New System (No Container)
// Complete System for Analysis Modals
// ===============================================================================

/**
 * MODAL BUILDER - Migrated to New System (No Container)
 * Handles dynamic modal construction for different analysis types
 */
class ModalBuilder {
    constructor() {
        // Use global window objects directly (no container)
        this.eventBus = window.EventBus || window.OsliraEventBus;
        this.stateManager = window.StateManager || window.OsliraStateManager;
        this.osliraAuth = window.OsliraAuth;
        
        this.components = new ModalComponents();
        this.configs = new AnalysisConfigs();
        
        console.log('🏗️ [ModalBuilder] Instance created (Migrated System)');
    }

        async prepareLeadData(leadId) {
        try {
            console.log('📊 [ModalBuilder] Loading lead:', leadId);
            
            const leadManager = window.LeadManager;
            if (!leadManager) {
                throw new Error('LeadManager not available');
            }
            
            const leadData = await leadManager.viewLead(leadId);
            if (!leadData) {
                throw new Error('Lead not found');
            }
            
            // Transform using LeadService
            const transformedData = this.leadService.transformLeadForDisplay(leadData);
            
            return transformedData;
            
        } catch (error) {
            console.error('❌ [ModalBuilder] Failed to prepare lead data:', error);
            throw error;
        }
    }

    // ===============================================================================
    // MAIN BUILD METHOD
    // ===============================================================================
    
    buildAnalysisModal(lead, analysisData) {
        const analysisType = lead.analysis_type;
        const config = this.configs.getConfig(analysisType);
        const isPremium = this.components.isPremiumLead(
            this.components.getMainScore(lead, analysisData, analysisType === 'deep' || analysisType === 'xray')
        );
        
        console.log('🏗️ [ModalBuilder] Building modal for analysis type:', analysisType);
        console.log('🏗️ [ModalBuilder] Has tabs:', config.hasTabs);
        
        let modalContent;
        
        if (config.hasTabs) {
            modalContent = this.buildTabbedModal(lead, analysisData, config);
        } else {
            modalContent = this.buildStandardModal(lead, analysisData, config);
        }

        // Wrap in modal container with premium styling
        const finalContent = `
            <div class="overflow-y-auto max-h-[90vh]">
                <!-- Main Content - with premium glow if 90+ score -->
                <div class="relative ${isPremium ? 'premium-modal-glow' : ''}" style="animation: staggerReveal 0.6s ease-out;">
                    ${modalContent}
                </div>
                ${this.renderFooter()}
            </div>
        `;

        // Initialize animations after render
        setTimeout(() => {
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                this.components.initializeAnimations(modalContent, lead, analysisData);
            }
        }, 50);
        
        // Emit event for analytics
        if (this.eventBus) {
            this.eventBus.emit('modal:built', {
                analysisType,
                username: lead.username,
                isPremium
            });
        }

        return finalContent;
    }

    // ===============================================================================
    // TABBED MODAL BUILDER
    // ===============================================================================

    buildTabbedModal(lead, analysisData, config) {
        console.log('🏗️ [ModalBuilder] Building tabbed modal with tabs:', config.tabs.map(t => t.id));
        
        // Render hero header (always displayed outside tabs)
        const heroHeader = this.renderComponent('heroHeader', lead, analysisData);
        
        // Prepare tab components
        const tabComponents = {};
        config.tabs.forEach(tab => {
            tabComponents[tab.id] = tab.components
                .map(componentName => this.renderComponent(componentName, lead, analysisData))
                .filter(component => component !== null);
        });

        // Render tabbed container
        const tabbedContent = this.components.getComponent('tabbedContainer').render(
            lead, 
            analysisData, 
            config.tabs, 
            tabComponents
        );

        return `
            ${heroHeader}
            ${this.wrapInContentContainer(tabbedContent)}
        `;
    }

    // ===============================================================================
    // STANDARD MODAL BUILDER (No Tabs)
    // ===============================================================================

    buildStandardModal(lead, analysisData, config) {
        console.log('🏗️ [ModalBuilder] Building standard modal (no tabs)');
        
        // Build modal sections normally
        const sections = config.components
            .map(componentName => this.renderComponent(componentName, lead, analysisData))
            .filter(section => section !== null)
            .join('');

        return this.wrapInContentContainer(sections);
    }

    // ===============================================================================
    // COMPONENT RENDERING
    // ===============================================================================
    
    renderComponent(componentName, lead, analysisData) {
        const component = this.components.getComponent(componentName);
        
        if (!component) {
            console.warn('🚨 [ModalBuilder] Component not found:', componentName);
            return null;
        }

        // Check condition if exists
        if (component.condition && !component.condition(lead, analysisData)) {
            return null;
        }

        // Render component with error handling
        try {
            return component.render(lead, analysisData);
        } catch (error) {
            console.error('🚨 [ModalBuilder] Error rendering component:', componentName, error);
            return null;
        }
    }

    // ===============================================================================
    // FOOTER RENDERING
    // ===============================================================================
    
    renderFooter() {
        return `
            <div class="p-6 border-t border-gray-200 bg-gray-50">
                <div class="flex justify-end space-x-3">
                    <button onclick="closeLeadAnalysisModal()" 
                            class="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 interactive-button">
                        Close
                    </button>
                </div>
            </div>
        `;
    }

    // ===============================================================================
    // CONTENT WRAPPER METHODS
    // ===============================================================================
    
    wrapInContentContainer(content) {
        // Split content into individual components and add spacing
        const contentWithSpacing = content.replace(/(<\/div>\s*<div class="group)/g, '</div><div style="margin-top: 32px;" class="group');
        
        return `
            <div style="margin: 0 24px 0 24px; border: 1px solid rgba(229, 231, 235, 0.6); border-radius: 1rem; padding: 24px;" class="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 shadow-lg backdrop-blur-sm">
                ${contentWithSpacing}
            </div>
        `;
    }

    // ===============================================================================
    // HELPER METHODS FOR COMPONENT MAPPING
    // ===============================================================================
    
    getComponentsForAnalysisType(analysisType) {
        const config = this.configs.getConfig(analysisType);
        return config ? config.components : [];
    }

    // ===============================================================================
    // EXTENSION METHODS
    // ===============================================================================
    
    // Add new component to the system
    addComponent(name, component) {
        this.components.registerComponent(name, component);
    }

    // Add new analysis type
    addAnalysisType(type, config) {
        this.configs.registerAnalysisType(type, config);
    }

    // Get available component names
    getAvailableComponents() {
        return Array.from(this.components.components.keys());
    }

    // Get available analysis types
    getAvailableAnalysisTypes() {
        return Array.from(this.configs.configs.keys());
    }

    // ===============================================================================
    // VALIDATION METHODS
    // ===============================================================================
    
    validateConfig(analysisType) {
        const config = this.configs.getConfig(analysisType);
        if (!config) {
            console.warn(`🚨 [ModalBuilder] No config found for analysis type: ${analysisType}`);
            return false;
        }

        const invalidComponents = config.components.filter(
            componentName => !this.components.getComponent(componentName)
        );

        if (invalidComponents.length > 0) {
            console.warn(`🚨 [ModalBuilder] Invalid components for ${analysisType}:`, invalidComponents);
            return false;
        }

        return true;
    }

    // ===============================================================================
    // DEBUGGING METHODS
    // ===============================================================================
    
    debugModal(lead, analysisData) {
        const analysisType = lead.analysis_type;
        const config = this.configs.getConfig(analysisType);
        
        console.log('🔍 [ModalBuilder] Debug Info:', {
            analysisType,
            config,
            leadData: {
                username: lead.username,
                score: lead.score,
                followers: lead.follower_count || lead.followers_count
            },
            analysisData: analysisData ? Object.keys(analysisData) : null,
            availableComponents: this.getAvailableComponents(),
            componentsToRender: config?.components || []
        });
    }
}

// ===============================================================================
// GLOBAL UTILITY FUNCTIONS
// ===============================================================================

// Copy outreach message functionality
window.copyOutreachMessage = function() {
    const messageElement = document.getElementById('outreachMessage');
    if (messageElement) {
        navigator.clipboard.writeText(messageElement.textContent).then(() => {
            // Show success notification
            const button = event.target.closest('button');
            const originalText = button.innerHTML;
            button.innerHTML = `
                <span class="relative z-10 flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>Copied!</span>
                </span>
            `;
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy message:', err);
        });
    }
};

// Start deep analysis functionality
window.startDeepAnalysis = function(username) {
    console.log('🚀 Starting deep analysis for:', username);
    
    // Close current modal
    if (window.closeLeadAnalysisModal) {
        window.closeLeadAnalysisModal();
    }
    
    // Trigger deep analysis through the analysis functions
    if (window.showAnalysisModal) {
        window.showAnalysisModal(username);
    } else if (window.ModalManager && window.ModalManager.showAnalysisModal) {
        window.ModalManager.showAnalysisModal(username);
    } else {
        console.error('❌ Analysis modal function not available');
    }
};

// Export
// =============================================================================
// GLOBAL EXPORT
// =============================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalBuilder;
} else {
    window.ModalBuilder = ModalBuilder;
}

// =============================================================================
// GLOBAL HANDLERS (for onclick attributes)
// =============================================================================

/**
 * Global handler for loading lead analysis data
 * Called from onclick attributes in HTML
 */
window.loadLeadAnalysisData = async (leadId, container) => {
    try {
        console.log('📊 [Global] Loading analysis for:', leadId);
        
        // Get or create ModalBuilder instance
        if (!window.modalBuilderInstance) {
            window.modalBuilderInstance = new window.ModalBuilder();
        }
        
        const modalBuilder = window.modalBuilderInstance;
        
        // Show loading state
        container.innerHTML = `
            <div class="flex items-center justify-center p-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        `;
        container.style.opacity = '1';
        
        // Prepare lead data (uses LeadService internally)
        const preparedData = await modalBuilder.prepareLeadData(leadId);
        
        // Build modal HTML
        const modalHTML = modalBuilder.buildAnalysisModal(
            preparedData.lead,
            preparedData
        );
        
        // Render
        container.innerHTML = modalHTML;
        container.style.opacity = '1';
        
        console.log('✅ [Global] Analysis loaded successfully');
        
    } catch (error) {
        console.error('❌ [Global] Failed to load analysis:', error);
        
        // Show error state
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Analysis</h3>
                <p class="text-gray-600 mb-4">${error.message}</p>
                <button onclick="window.loadLeadAnalysisData('${leadId}', this.closest('.modal-content'))" 
                        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Try Again
                </button>
            </div>
        `;
    }
};

console.log('🏗️ [ModalBuilder] Loaded with global handlers');

// ES6 Module Export
export default ModalManager;
