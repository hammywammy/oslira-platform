// =============================================================================
// EVENT TYPES - Centralized Event Constants
// Path: /public/core/events/EventTypes.js
// Dependencies: None
// =============================================================================

/**
 * @class EventTypes
 * @description Central registry of all event type constants
 * 
 * Benefits:
 * - Prevents typos in event names
 * - Auto-complete support
 * - Easy to see all events in one place
 * - Facilitates refactoring
 */
class EventTypes {
    constructor() {
        // =================================================================
        // AUTHENTICATION EVENTS
        // =================================================================
        this.AUTH = {
            SIGNED_IN: 'auth:signed-in',
            SIGNED_OUT: 'auth:signed-out',
            TOKEN_REFRESHED: 'auth:token-refreshed',
            USER_UPDATED: 'auth:user-updated',
            CREDITS_UPDATED: 'auth:credits-updated',
            SESSION_INVALID: 'auth:session-invalid',
            SESSION_VALIDATED: 'auth:session-validated'
        };
        
        // =================================================================
        // BUSINESS EVENTS
        // =================================================================
        this.BUSINESS = {
            CREATED: 'business:created',
            UPDATED: 'business:updated',
            DELETED: 'business:deleted',
            SELECTED: 'business:selected',
            CHANGED: 'business:changed',
            SETTINGS_UPDATED: 'business:settings-updated',
            TEAM_MEMBER_ADDED: 'business:team-member-added',
            TEAM_MEMBER_REMOVED: 'business:team-member-removed'
        };
        
        // =================================================================
        // LEAD EVENTS
        // =================================================================
        this.LEAD = {
            CREATED: 'lead:created',
            UPDATED: 'lead:updated',
            DELETED: 'lead:deleted',
            ANALYZED: 'lead:analyzed',
            ANALYSIS_STARTED: 'lead:analysis-started',
            ANALYSIS_COMPLETED: 'lead:analysis-completed',
            ANALYSIS_FAILED: 'lead:analysis-failed',
            BULK_CREATED: 'lead:bulk-created',
            BULK_UPDATED: 'lead:bulk-updated',
            BULK_DELETED: 'lead:bulk-deleted',
            FILTERED: 'lead:filtered',
            SORTED: 'lead:sorted',
            SELECTED: 'lead:selected',
            DESELECTED: 'lead:deselected',
            TAG_ADDED: 'lead:tag-added',
            TAG_REMOVED: 'lead:tag-removed',
            NOTE_ADDED: 'lead:note-added',
            STATUS_CHANGED: 'lead:status-changed'
        };
        
        // =================================================================
        // ANALYTICS EVENTS
        // =================================================================
        this.ANALYTICS = {
            UPDATED: 'analytics:updated',
            REFRESH_STARTED: 'analytics:refresh-started',
            REFRESH_COMPLETED: 'analytics:refresh-completed',
            REFRESH_FAILED: 'analytics:refresh-failed',
            REPORT_GENERATED: 'analytics:report-generated',
            EXPORT_STARTED: 'analytics:export-started',
            EXPORT_COMPLETED: 'analytics:export-completed'
        };
        
        // =================================================================
        // UI EVENTS
        // =================================================================
        this.UI = {
            MODAL_OPENED: 'ui:modal-opened',
            MODAL_CLOSED: 'ui:modal-closed',
            TOAST_SHOWN: 'ui:toast-shown',
            TOAST_DISMISSED: 'ui:toast-dismissed',
            LOADING_STARTED: 'ui:loading-started',
            LOADING_COMPLETED: 'ui:loading-completed',
            SIDEBAR_TOGGLED: 'ui:sidebar-toggled',
            SIDEBAR_COLLAPSED: 'ui:sidebar-collapsed',
            SIDEBAR_EXPANDED: 'ui:sidebar-expanded',
            THEME_CHANGED: 'ui:theme-changed',
            TAB_CHANGED: 'ui:tab-changed',
            FILTER_APPLIED: 'ui:filter-applied',
            FILTER_CLEARED: 'ui:filter-cleared'
        };
        
        // =================================================================
        // STATE EVENTS
        // =================================================================
        this.STATE = {
            UPDATED: 'state:updated',
            RESET: 'state:reset',
            HYDRATED: 'state:hydrated',
            PERSISTED: 'state:persisted',
            ERROR: 'state:error'
        };
        
        // =================================================================
        // FORM EVENTS
        // =================================================================
        this.FORM = {
            SUBMITTED: 'form:submitted',
            VALIDATED: 'form:validated',
            VALIDATION_FAILED: 'form:validation-failed',
            FIELD_CHANGED: 'form:field-changed',
            FIELD_BLURRED: 'form:field-blurred',
            RESET: 'form:reset',
            ERROR: 'form:error'
        };
        
        // =================================================================
        // REALTIME EVENTS
        // =================================================================
        this.REALTIME = {
            CONNECTED: 'realtime:connected',
            DISCONNECTED: 'realtime:disconnected',
            RECONNECTING: 'realtime:reconnecting',
            ERROR: 'realtime:error',
            MESSAGE: 'realtime:message',
            LEAD_CREATED: 'realtime:lead-created',
            LEAD_UPDATED: 'realtime:lead-updated',
            LEAD_DELETED: 'realtime:lead-deleted'
        };
        
        // =================================================================
        // NOTIFICATION EVENTS
        // =================================================================
        this.NOTIFICATION = {
            RECEIVED: 'notification:received',
            READ: 'notification:read',
            DISMISSED: 'notification:dismissed',
            CLEARED_ALL: 'notification:cleared-all'
        };
        
        // =================================================================
        // CAMPAIGN EVENTS
        // =================================================================
        this.CAMPAIGN = {
            CREATED: 'campaign:created',
            UPDATED: 'campaign:updated',
            DELETED: 'campaign:deleted',
            STARTED: 'campaign:started',
            PAUSED: 'campaign:paused',
            COMPLETED: 'campaign:completed',
            LEAD_ADDED: 'campaign:lead-added',
            LEAD_REMOVED: 'campaign:lead-removed'
        };
        
        // =================================================================
        // AUTOMATION EVENTS
        // =================================================================
        this.AUTOMATION = {
            CREATED: 'automation:created',
            UPDATED: 'automation:updated',
            DELETED: 'automation:deleted',
            ENABLED: 'automation:enabled',
            DISABLED: 'automation:disabled',
            TRIGGERED: 'automation:triggered',
            COMPLETED: 'automation:completed',
            FAILED: 'automation:failed'
        };
        
        // =================================================================
        // SUBSCRIPTION EVENTS
        // =================================================================
        this.SUBSCRIPTION = {
            CREATED: 'subscription:created',
            UPDATED: 'subscription:updated',
            CANCELLED: 'subscription:cancelled',
            RENEWED: 'subscription:renewed',
            PAYMENT_SUCCEEDED: 'subscription:payment-succeeded',
            PAYMENT_FAILED: 'subscription:payment-failed',
            TRIAL_STARTED: 'subscription:trial-started',
            TRIAL_ENDING: 'subscription:trial-ending',
            TRIAL_ENDED: 'subscription:trial-ended'
        };
        
        // =================================================================
        // SYSTEM EVENTS
        // =================================================================
        this.SYSTEM = {
            INITIALIZED: 'system:initialized',
            READY: 'system:ready',
            ERROR: 'system:error',
            ONLINE: 'system:online',
            OFFLINE: 'system:offline',
            MAINTENANCE_MODE: 'system:maintenance-mode',
            UPDATE_AVAILABLE: 'system:update-available'
        };
        
        // =================================================================
        // ADMIN EVENTS
        // =================================================================
        this.ADMIN = {
            SECTION_CHANGED: 'admin:section-changed',
            USER_IMPERSONATED: 'admin:user-impersonated',
            FEATURE_TOGGLED: 'admin:feature-toggled',
            CONFIG_UPDATED: 'admin:config-updated'
        };
        
        // =================================================================
        // ONBOARDING EVENTS
        // =================================================================
        this.ONBOARDING = {
            STARTED: 'onboarding:started',
            STEP_COMPLETED: 'onboarding:step-completed',
            COMPLETED: 'onboarding:completed',
            SKIPPED: 'onboarding:skipped'
        };
        
        console.log('📡 [EventTypes] Initialized');
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Get all event types as flat array
     */
    getAllEvents() {
        const events = [];
        
        for (const category of Object.values(this)) {
            if (typeof category === 'object') {
                events.push(...Object.values(category));
            }
        }
        
        return events;
    }
    
    /**
     * Get events by category
     */
    getEventsByCategory(categoryName) {
        return this[categoryName] || {};
    }
    
    /**
     * Check if event type exists
     */
    hasEvent(eventType) {
        return this.getAllEvents().includes(eventType);
    }
    
    /**
     * Get category for event type
     */
    getCategoryForEvent(eventType) {
        for (const [category, events] of Object.entries(this)) {
            if (typeof events === 'object' && Object.values(events).includes(eventType)) {
                return category;
            }
        }
        return null;
    }
    
    /**
     * Get all categories
     */
    getCategories() {
        return Object.keys(this).filter(key => typeof this[key] === 'object');
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const categories = this.getCategories();
        const stats = {
            totalCategories: categories.length,
            totalEvents: this.getAllEvents().length,
            byCategory: {}
        };
        
        for (const category of categories) {
            stats.byCategory[category] = Object.keys(this[category]).length;
        }
        
        return stats;
    }
    
    /**
     * Debug info
     */
    debug() {
        console.group('📡 [EventTypes] Debug Info');
        console.log('Stats:', this.getStats());
        console.log('Categories:', this.getCategories());
        console.groupEnd();
    }
    
    /**
     * Print all events
     */
    printAllEvents() {
        console.group('📡 [EventTypes] All Event Types');
        
        for (const category of this.getCategories()) {
            console.group(category);
            const events = this[category];
            for (const [key, value] of Object.entries(events)) {
                console.log(`${key}: ${value}`);
            }
            console.groupEnd();
        }
        
        console.groupEnd();
    }
}


