// =============================================================================
// ADMIN EVENT BUS
// Simple event system for admin panel communication
// =============================================================================

class AdminEventBus {
    constructor() {
        this.listeners = {};
        console.log('📡 [AdminEventBus] Initialized');
    }
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    
    emit(event, data) {
        console.log(`📤 [AdminEventBus] Emitting: ${event}`, data);
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => callback(data));
    }
}

// Global export
window.AdminEventBus = new AdminEventBus();

console.log('✅ [AdminEventBus] Module loaded');
