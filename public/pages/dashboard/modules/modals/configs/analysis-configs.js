// ===============================================================================
// ANALYSIS TYPE CONFIGURATIONS - Define what components each type uses
// ===============================================================================

class AnalysisConfigs {
    constructor() {
        this.configs = new Map();
        this.registerDefaultConfigs();
    }

registerDefaultConfigs() {
    // Light Analysis Configuration - No tabs
    this.configs.set('light', {
        hasTabs: false,
        components: [
            'heroHeader',
            'aiSummary',
            'lightAnalysisNotice'
        ]
    });

    // Deep Analysis Configuration - WITH TABS  
    this.configs.set('deep', {
        hasTabs: true,
        tabs: [
            {
                id: 'analysis',
                label: 'Analysis',
                components: [
                    'deepSummary',          // New - shows deep_summary
                    'sellingPoints',        // Existing - shows selling_points from payload
                    'outreachMessage',      // Existing - shows outreach_message from payload
                    'engagementBreakdown',  // New - shows engagement metrics
                    'payloadAudienceInsights', // New - shows audience_insights 
                    'reasons',              // Existing - shows reasons array
                    'latestPosts',          // New - shows latest_posts (when available)
                    'aiSummary'             // Existing fallback
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

    // X-Ray Analysis Configuration - WITH TABS
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
