    // ===============================================================================
// ANALYSIS TYPE CONFIGURATIONS - Define what components each type uses
// ===============================================================================

class AnalysisConfigs {
    constructor() {
        this.configs = new Map();
        this.registerDefaultConfigs();
    }

registerDefaultConfigs() {
    
this.configs.set('light', {
    hasTabs: true,
    tabs: [
        {
            id: 'analysis',
            label: 'Analysis',
            components: [
                'aiSummary',
                'lightAnalysisNotice'
            ]
        },
        {
            id: 'personality',
            label: 'Personality',
            components: [
                'personalityLockedLight'  // Show the locked card instead
            ]
        }
    ]
});
    
this.configs.set('deep', {
    hasTabs: true,
    tabs: [
{
    id: 'analysis',
    label: 'Analysis',
    components: [
        'quickSummary',               // NEW: At very top
        'reasons',                     // Why this lead matters
        'payloadAudienceInsights',    // Audience intelligence
        'sellingPoints',               // Key selling points
        'deepSummary'                  // Deep analysis summary at bottom
    ]
},
        {
            id: 'outreach',
            label: 'Outreach',
            components: [
                'outreachMessage'
            ]
        },
{
    id: 'analytics',
    label: 'Analytics',
    components: [
        'preProcessedMetrics'  // Already exists, uses pre_processed_metrics
    ]
},
        {
            id: 'personality',
            label: 'Personality',
            components: [
                'personalityOverview',
                'behaviorPatterns',
                'communicationStyle',
                'motivationDrivers'
            ]
        }
    ]
});

this.configs.set('xray', {
    hasTabs: true,
    tabs: [
        {
            id: 'analysis',
            label: 'Analysis',
            components: [
                'copywriterProfile',
                'commercialIntelligence',
                'persuasionStrategy',
                'aiSummary'
            ]
        },
        {
            id: 'outreach',
            label: 'Outreach',
            components: [
                'outreachMessage'
            ]
        },
{
    id: 'analytics',
    label: 'Analytics',
    components: [
        'preProcessedMetrics'  // Already exists, uses pre_processed_metrics
    ]
},
        {
            id: 'personality',
            label: 'Personality',
            components: [
                'personalityOverview',
                'behaviorPatterns',
                'communicationStyle',
                'motivationDrivers'
            ]
        }
    ]
});
}

    getConfig(analysisType) {
        return this.configs.get(analysisType) || this.configs.get('light');
    }

    // Easy method to add new analysis types
    registerAnalysisType(type, config) {
        this.configs.set(type, config);
    }
    // Check if analysis type supports tabs
hasTabs(analysisType) {
    const config = this.getConfig(analysisType);
    return config?.hasTabs || false;
}

// Get tab configuration for analysis type
getTabs(analysisType) {
    const config = this.getConfig(analysisType);
    return config?.tabs || [];
}

// Get components for specific tab
getTabComponents(analysisType, tabId) {
    const tabs = this.getTabs(analysisType);
    const tab = tabs.find(t => t.id === tabId);
    return tab?.components || [];
}
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisConfigs;
} else {
    window.AnalysisConfigs = AnalysisConfigs;
}
