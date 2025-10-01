// ===============================================================================
// MODAL BUILDER ENGINE - Complete System for Analysis Modals
// ===============================================================================

class ModalBuilder {
    constructor() {
        this.components = new ModalComponents();
        this.configs = new AnalysisConfigs();
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
    } else {
        console.error('❌ Analysis modal function not available');
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalBuilder;
} else {
    window.ModalBuilder = ModalBuilder;
}
