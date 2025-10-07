// =============================================================================
// UI-MANAGER.JS - Centralized UI Component System
// Handles all modals, toasts, loading states, and UI interactions
// =============================================================================

class OsliraUIManager {
    constructor() {
        this.modals = new Map();
        this.toasts = [];
        this.loadingStates = new Map();
        this.initialized = false;
        this.init();
    }
    
    init() {
        if (this.initialized) return;
        
        // Create global UI containers
        this.createGlobalContainers();
        
        // Setup global event handlers
        this.setupGlobalHandlers();
        
        this.initialized = true;
        console.log('✅ [UI] UI Manager initialized');
    }
    
    createGlobalContainers() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('global-toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'global-toast-container';
            toastContainer.className = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }
        
        // Create loading overlay if it doesn't exist
        if (!document.getElementById('global-loading-overlay')) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'global-loading-overlay';
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                backdrop-filter: blur(4px);
            `;
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = `
                <div class="spinner" style="
                    width: 48px;
                    height: 48px;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <div class="loading-text" style="
                    color: white;
                    margin-top: 16px;
                    font-size: 16px;
                    text-align: center;
                ">Loading...</div>
            `;
            
            loadingOverlay.appendChild(spinner);
            document.body.appendChild(loadingOverlay);
            
            // Add spinner animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupGlobalHandlers() {
        // Global escape key handler for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
        
        // Global click outside handler for modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && e.target.style.display === 'flex') {
                this.closeModal(e.target.id);
            }
        });
    }
    
    // =============================================================================
    // MODAL MANAGEMENT
    // =============================================================================
    
    modal = {
        open: (modalId, data = {}) => {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.warn(`Modal ${modalId} not found`);
                return;
            }
            
            // Populate modal with data
            this.populateModal(modal, data);
            
            // Show modal
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Track modal
            this.modals.set(modalId, {
                element: modal,
                data,
                openedAt: Date.now()
            });
            
            // Focus first input if available
            const firstInput = modal.querySelector('input, select, textarea, button');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
            
            console.log(`🔍 [UI] Modal opened: ${modalId}`);
        },
        
        close: (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                this.modals.delete(modalId);
                
                // Restore body scroll if no modals are open
                if (this.modals.size === 0) {
                    document.body.style.overflow = '';
                }
                
                // Clear any form data
                const form = modal.querySelector('form');
                if (form) {
                    form.reset();
                }
                
                console.log(`🔍 [UI] Modal closed: ${modalId}`);
            }
        },
        
        closeAll: () => {
            this.modals.forEach((_, modalId) => {
                this.modal.close(modalId);
            });
        },
        
        isOpen: (modalId) => {
            return this.modals.has(modalId);
        },
        
        getData: (modalId) => {
            return this.modals.get(modalId)?.data || {};
        }
    };
    
    populateModal(modal, data) {
        Object.keys(data).forEach(key => {
            // Try different selectors for form fields
            const selectors = [
                `[data-field="${key}"]`,
                `[name="${key}"]`,
                `#${key}`,
                `.${key}-field`
            ];
            
            for (const selector of selectors) {
                const element = modal.querySelector(selector);
                if (element) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                        element.value = data[key];
                    } else {
                        element.textContent = data[key];
                    }
                    break;
                }
            }
        });
    }
    
    closeTopModal() {
        if (this.modals.size > 0) {
            const lastModal = Array.from(this.modals.keys()).pop();
            this.modal.close(lastModal);
        }
    }
    
    // =============================================================================
    // TOAST NOTIFICATIONS
    // =============================================================================
    
    toast = {
        success: (message, options = {}) => {
            this.showToast(message, 'success', options);
        },
        
        error: (message, options = {}) => {
            this.showToast(message, 'error', { duration: 5000, ...options });
        },
        
        warning: (message, options = {}) => {
            this.showToast(message, 'warning', options);
        },
        
        info: (message, options = {}) => {
            this.showToast(message, 'info', options);
        }
    };
    
    showToast(message, type = 'info', options = {}) {
        const {
            duration = 3000,
            persistent = false,
            actions = []
        } = options;
        
        const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${this.getToastColor(type)};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            word-wrap: break-word;
        `;
        
        // Toast content
        const content = document.createElement('div');
        content.className = 'toast-content';
        content.innerHTML = message;
        toast.appendChild(content);
        
        // Add actions if provided
        if (actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'toast-actions';
            actionsContainer.style.cssText = 'margin-top: 8px; display: flex; gap: 8px;';
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.label;
                button.style.cssText = `
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                `;
                button.onclick = () => {
                    if (typeof action.action === 'function') {
                        action.action();
                    }
                    this.removeToast(toastId);
                };
                actionsContainer.appendChild(button);
            });
            
            toast.appendChild(actionsContainer);
        }
        
        // Close button for persistent toasts
        if (persistent) {
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '×';
            closeButton.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeButton.onclick = () => this.removeToast(toastId);
            toast.appendChild(closeButton);
            toast.style.paddingRight = '40px';
        }
        
        // Add to container
        const container = document.getElementById('global-toast-container');
        container.appendChild(toast);
        
        // Track toast
        this.toasts.push({ id: toastId, element: toast, type, persistent });
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove if not persistent
        if (!persistent) {
            setTimeout(() => {
                this.removeToast(toastId);
            }, duration);
        }
        
        console.log(`📢 [UI] Toast shown: ${type} - ${message}`);
    }
    
    removeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                toast.remove();
                this.toasts = this.toasts.filter(t => t.id !== toastId);
            }, 300);
        }
    }
    
    getToastColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#2D6CDF'
        };
        return colors[type] || colors.info;
    }
    
    // =============================================================================
    // LOADING STATES
    // =============================================================================
    
    loading = {
        show: (message = 'Loading...') => {
            const overlay = document.getElementById('global-loading-overlay');
            const textElement = overlay.querySelector('.loading-text');
            
            if (textElement) {
                textElement.textContent = message;
            }
            
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            console.log(`⏳ [UI] Loading shown: ${message}`);
        },
        
        hide: () => {
            const overlay = document.getElementById('global-loading-overlay');
            overlay.style.display = 'none';
            
            // Only restore scroll if no modals are open
            if (this.modals.size === 0) {
                document.body.style.overflow = '';
            }
            
            console.log('⏳ [UI] Loading hidden');
        },
        
        isVisible: () => {
            const overlay = document.getElementById('global-loading-overlay');
            return overlay && overlay.style.display === 'flex';
        }
    };
    
    // =============================================================================
    // UTILITY METHODS
    // =============================================================================
    
    // Smooth scroll to element
    scrollTo(elementOrId, options = {}) {
        const element = typeof elementOrId === 'string' ? 
            document.getElementById(elementOrId) : elementOrId;
        
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                ...options
            });
        }
    }
    
    // Copy text to clipboard with feedback
    async copyToClipboard(text, feedbackMessage = 'Copied to clipboard!') {
        try {
            await navigator.clipboard.writeText(text);
            this.toast.success(feedbackMessage);
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            this.toast.error('Failed to copy to clipboard');
        }
    }
    
    // Debounced function utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Animate element with CSS classes
    animate(element, animationClass, duration = 1000) {
        return new Promise(resolve => {
            element.classList.add(animationClass);
            
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }
    
    // Get current theme/mode
    getTheme() {
        return document.body.getAttribute('data-theme') || 'light';
    }
    
    // Set theme/mode
    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('oslira-theme', theme);
    }
    
    // Cleanup method
    destroy() {
        // Close all modals
        this.modal.closeAll();
        
        // Remove all toasts
        this.toasts.forEach(toast => {
            toast.element.remove();
        });
        this.toasts = [];
        
        // Hide loading
        this.loading.hide();
        
        console.log('🗑️ [UI] UI Manager destroyed');
    }
}

// Export for global use
window.OsliraUI = OsliraUIManager;
