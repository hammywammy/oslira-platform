// =============================================================================
// TOOLTIP MANAGER - Enterprise Component
// Path: /public/core/ui/components/TooltipManager.js
// Dependencies: None
// =============================================================================

class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.showTimeout = null;
        this.hideTimeout = null;
        this.currentTarget = null;
        
        // Configuration
        this.config = {
            showDelay: 300,      // 300ms before showing
            hideDelay: 200,      // 200ms forgiveness before hiding
            offset: 8,           // 8px gap from target
            fadeSpeed: 150       // 150ms fade animation
        };

        this.loadCSS();
        this.init();
        console.log('✅ [TooltipManager] Initialized');
    }

    loadCSS() {
        if (document.getElementById('tooltip-styles')) {
            return; // Already loaded
        }
        
        const link = document.createElement('link');
        link.id = 'tooltip-styles';
        link.rel = 'stylesheet';
        link.href = '/core/ui/components/tooltip/Tooltip.css';
        document.head.appendChild(link);
        
        console.log('✅ [TooltipManager] CSS loaded');
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    init() {
        // Create single tooltip element
        this.createTooltipElement();
        
        // Auto-bind to elements with data-tooltip attribute
        this.bindTooltips();
        
        // Watch for dynamically added elements
        this.observeDOMChanges();
    }

    createTooltipElement() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'oslira-tooltip';
        this.tooltip.setAttribute('role', 'tooltip');
        this.tooltip.style.cssText = `
            position: fixed;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity ${this.config.fadeSpeed}ms ease;
        `;
        document.body.appendChild(this.tooltip);
    }

    // =========================================================================
    // AUTO-BINDING
    // =========================================================================

    bindTooltips() {
        // Find all elements with data-tooltip
        const elements = document.querySelectorAll('[data-tooltip]');
        
        elements.forEach(el => {
            if (!el.dataset.tooltipBound) {
                this.attachTooltip(el);
                el.dataset.tooltipBound = 'true';
            }
        });
    }

    attachTooltip(element) {
        // Mouse events
        element.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
        element.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        
        // Keyboard events (for accessibility)
        element.addEventListener('focus', (e) => this.handleFocus(e));
        element.addEventListener('blur', (e) => this.handleBlur(e));
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    handleMouseEnter(event) {
        const target = event.currentTarget;
        this.currentTarget = target;
        
        // Clear any pending hide
        clearTimeout(this.hideTimeout);
        
        // Show after delay
        this.showTimeout = setTimeout(() => {
            this.show(target);
        }, this.config.showDelay);
    }

    handleMouseLeave(event) {
        // Clear pending show
        clearTimeout(this.showTimeout);
        
        // Hide after forgiveness delay
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, this.config.hideDelay);
    }

    handleFocus(event) {
        const target = event.currentTarget;
        this.currentTarget = target;
        
        // Show immediately on keyboard focus (accessibility)
        this.show(target);
    }

    handleBlur(event) {
        // Hide immediately on blur
        this.hide();
    }

    // =========================================================================
    // SHOW/HIDE
    // =========================================================================

show(target) {
    const text = target.dataset.tooltip;
    if (!text) return;
    
    // CHECK: Only show tooltip if sidebar is collapsed
    const sidebar = document.querySelector('#sidebar-container');
    const isInSidebar = sidebar?.contains(target);
    
    if (isInSidebar) {
        const isCollapsed = sidebar?.classList.contains('collapsed');
        if (!isCollapsed) {
            // Sidebar is expanded - don't show tooltip
            return;
        }
    }
    // If not in sidebar, always show tooltip (for other UI elements)
    
    // Set content
    this.tooltip.textContent = text;
    
    // Position tooltip
    this.position(target);
    
    // Fade in
    requestAnimationFrame(() => {
        this.tooltip.style.opacity = '1';
    });
}

    hide() {
        this.tooltip.style.opacity = '0';
        this.currentTarget = null;
    }

    // =========================================================================
    // POSITIONING
    // =========================================================================

    position(target) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        // Determine if target is in collapsed sidebar
        const sidebar = document.querySelector('#sidebar-container');
        const isCollapsed = sidebar?.classList.contains('collapsed');
        const isInSidebar = sidebar?.contains(target);
        
        let top, left;
        
        if (isInSidebar && isCollapsed) {
            // RIGHT-ALIGNED: Position to the right of sidebar
            left = targetRect.right + this.config.offset;
            top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        } else {
            // DEFAULT: Position below target (for non-sidebar elements)
            left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            top = targetRect.bottom + this.config.offset;
        }
        
        // Viewport boundary checks
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Prevent overflow right
        if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        
        // Prevent overflow left
        if (left < 10) {
            left = 10;
        }
        
        // Prevent overflow bottom
        if (top + tooltipRect.height > viewportHeight - 10) {
            top = targetRect.top - tooltipRect.height - this.config.offset;
        }
        
        // Prevent overflow top
        if (top < 10) {
            top = 10;
        }
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    // =========================================================================
    // DOM OBSERVER (Auto-bind new elements)
    // =========================================================================

    observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if added node has tooltip
                        if (node.dataset?.tooltip) {
                            this.attachTooltip(node);
                            node.dataset.tooltipBound = 'true';
                        }
                        
                        // Check children
                        const children = node.querySelectorAll?.('[data-tooltip]');
                        children?.forEach(child => {
                            if (!child.dataset.tooltipBound) {
                                this.attachTooltip(child);
                                child.dataset.tooltipBound = 'true';
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    destroy() {
        clearTimeout(this.showTimeout);
        clearTimeout(this.hideTimeout);
        if (this.tooltip) {
            this.tooltip.remove();
        }
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
// ES6 Module Export
export default TooltipManager;
window.OsliraTooltip = new TooltipManager();
