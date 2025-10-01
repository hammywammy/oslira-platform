//public/pages/dashboard/modules/ui/dashboard-header.js

/**
 * DASHBOARD HEADER - Complete Rewrite with Proper Initialization
 * Handles header rendering, dropdown functionality, and event management
 */
class DashboardHeader {
    constructor(container) {
        this.container = container;
        this.eventBus = container?.get('eventBus');
        this.isDropdownOpen = false;
        this.currentMode = 'single'; // 'single' or 'bulk'
        this.initialized = false;
        this.dropdownElement = null;
        
        // Bind methods to preserve context
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.createDropdown = this.createDropdown.bind(this);
        this.closeDropdown = this.closeDropdown.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleMainButtonClick = this.handleMainButtonClick.bind(this);
        this.switchMode = this.switchMode.bind(this);
        
        console.log('🔧 [DashboardHeader] Instance created');
    }

    /**
     * Render the complete header HTML
     */
    renderHeader() {
        return `
<div class="pt-6 px-6 pb-6">
    <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6" style="position: relative; overflow: visible; z-index: 10;">
        <div class="flex items-center justify-between">
            <!-- Dashboard Title -->
            <div>
                <h1 class="text-2xl font-bold text-gray-800 mb-1">AI-Powered Lead Research Dashboard</h1>
                <p class="text-gray-600">Comprehensive view of all lead management activities with AI-driven insights</p>
            </div>
            
            <!-- Right Actions -->
            <div class="flex items-center space-x-4">
                <!-- Dynamic Research Button with Dropdown -->
                <div class="relative" style="z-index: 100; isolation: isolate; position: relative;">
                    <!-- Unified Button Container -->
                    <div id="main-button-container" class="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div class="flex">
                            <!-- Main Research Button -->
                            <button id="main-research-btn" data-header-action="main-click"
                                    class="px-6 py-3 text-white font-medium hover:bg-white/10 transition-all duration-200 flex items-center space-x-2 flex-1 rounded-l-xl">
                                <i data-feather="plus" class="w-4 h-4"></i>
                                <span id="main-research-text">Research New Lead</span>
                            </button>
                            
                            <!-- Dropdown Divider -->
                            <div class="w-px bg-white/20 my-2"></div>
                            
                            <!-- Dropdown Arrow Button -->
                            <button id="dropdown-arrow-btn" data-header-action="dropdown-toggle"
                                    class="px-3 py-3 text-white hover:bg-white/10 transition-all duration-200 rounded-r-xl">
                                <i data-feather="chevron-down" class="w-4 h-4 transition-transform duration-200"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;
    }

async initialize() {
    if (this.initialized) {
        console.log('⚠️ [DashboardHeader] Already initialized, skipping');
        return;
    }
    
    if (this._initializing) {
        console.log('⚠️ [DashboardHeader] Already initializing, waiting...');
        return this._initPromise;
    }
    
    this._initializing = true;
    this._initPromise = this._performInitialization();
    return this._initPromise;
}

async _performInitialization() {
    console.log('🔧 [DashboardHeader] Starting initialization...');

    try {
        // Wait for DOM elements to be available
        await this.waitForDOMElements();
        
        // Setup all event handlers
        this.setupEventHandlers();
        
        // Initialize Feather icons for the header
        this.initializeIcons();
        
        // Setup global functions for backwards compatibility
        this.setupGlobalFunctions();
        
        // Setup cleanup handlers
        this.setupCleanupHandlers();
        
        this.initialized = true;
        this._initializing = false;
        console.log('✅ [DashboardHeader] Initialization completed');
        
    } catch (error) {
        this._initializing = false;
        console.error('❌ [DashboardHeader] Initialization failed:', error);
        throw error;
    }
}

    /**
     * Wait for required DOM elements to be available
     */
    async waitForDOMElements() {
        const requiredElements = [
            '#main-button-container',
            '#main-research-btn',
            '#dropdown-arrow-btn'
        ];

        for (const selector of requiredElements) {
            await this.waitForElement(selector, 10000);
        }
        
        console.log('✅ [DashboardHeader] All required DOM elements found');
    }

    /**
     * Wait for a specific element to appear in the DOM
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Setup all event handlers for the header
     */
    setupEventHandlers() {
        console.log('🔧 [DashboardHeader] Setting up event handlers...');

        // Remove any existing listeners to prevent duplicates
        this.removeEventHandlers();

        // Main button click handler
        const mainButton = document.getElementById('main-research-btn');
        if (mainButton) {
            mainButton.addEventListener('click', this.handleMainButtonClick);
            console.log('✅ [DashboardHeader] Main button handler attached');
        }

        // Dropdown toggle handler
        const dropdownButton = document.getElementById('dropdown-arrow-btn');
        if (dropdownButton) {
            dropdownButton.addEventListener('click', this.toggleDropdown);
            console.log('✅ [DashboardHeader] Dropdown toggle handler attached');
        }

        // Modal observer for auto-close dropdown
        this.setupModalObserver();

        console.log('✅ [DashboardHeader] All event handlers setup complete');
    }

removeEventHandlers() {
    const mainButton = document.getElementById('main-research-btn');
    if (mainButton) {
        mainButton.removeEventListener('click', this.handleMainButtonClick);
    }

    const dropdownButton = document.getElementById('dropdown-arrow-btn');
    if (dropdownButton) {
        dropdownButton.removeEventListener('click', this.toggleDropdown);
    }

    // Only remove if it was added
    document.removeEventListener('click', this.handleOutsideClick);
}

    /**
     * Handle main button clicks
     */
handleMainButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('🔘 [DashboardHeader] Main button clicked, mode:', this.currentMode);

    // Check if modal is already open to prevent toggle
    const activeModal = window.dashboard?.container?.get('stateManager')?.getState('activeModal');
    if (activeModal === 'bulkModal' && this.currentMode === 'bulk') {
        console.log('⚠️ [DashboardHeader] Bulk modal already open, ignoring click');
        return;
    }

    if (this.currentMode === 'single') {
        this.openResearchModal();
    } else if (this.currentMode === 'bulk') {
        this.openBulkModal();
    }
}

toggleDropdown(event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('🔄 [DashboardHeader] Dropdown toggle clicked, open:', this.isDropdownOpen);

    if (this.isDropdownOpen) {
        this.closeDropdown();
    } else {
        // Remove any existing outside click handler before opening
        document.removeEventListener('click', this.handleOutsideClick);
        
        this.openDropdown();
        
        // Add the outside click handler on next tick to prevent immediate closure
        requestAnimationFrame(() => {
            if (this.isDropdownOpen) {
                document.addEventListener('click', this.handleOutsideClick);
            }
        });
    }
}

openDropdown() {
    if (this.isDropdownOpen) return;

    console.log('📖 [DashboardHeader] Opening dropdown...');

    this.createDropdown();
    this.isDropdownOpen = true;

    // Update arrow icon
    const arrow = document.querySelector('#dropdown-arrow-btn i[data-feather="chevron-down"]');
    if (arrow) {
        arrow.style.transform = 'rotate(180deg)';
    }

    // Don't add the outside click handler immediately - it will be added by toggleDropdown
    console.log('✅ [DashboardHeader] Dropdown opened successfully');
}

closeDropdown() {
    if (!this.isDropdownOpen) return;

    console.log('📕 [DashboardHeader] Closing dropdown...');

    if (this.dropdownElement) {
        this.dropdownElement.remove();
        this.dropdownElement = null;
    }

    this.isDropdownOpen = false;

    // Remove the outside click handler when dropdown closes
    document.removeEventListener('click', this.handleOutsideClick);

    // Reset arrow icon
    const arrow = document.querySelector('#dropdown-arrow-btn i[data-feather="chevron-down"]');
    if (arrow) {
        arrow.style.transform = 'rotate(0deg)';
    }

    console.log('✅ [DashboardHeader] Dropdown closed successfully');
}

    /**
     * Create and display the dropdown
     */
    createDropdown() {
        // Remove any existing dropdown
        const existingDropdown = document.getElementById('research-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Get button container for positioning
        const buttonContainer = document.getElementById('main-button-container');
        if (!buttonContainer) {
            console.error('❌ [DashboardHeader] Button container not found for dropdown positioning');
            return;
        }

        // Create dropdown element
        this.dropdownElement = document.createElement('div');
        this.dropdownElement.id = 'research-dropdown';
        this.dropdownElement.className = 'dashboard-header-dropdown';

        // Set dropdown content
        this.dropdownElement.innerHTML = `
            <div class="dropdown-content">
                <div class="dropdown-option" data-mode="single">
                    <div class="option-icon single-icon">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                    </div>
                    <div class="option-text">
                        <div class="option-title">Research Single</div>
                        <div class="option-subtitle">One profile analysis</div>
                    </div>
                </div>
                <div class="dropdown-option" data-mode="bulk">
                    <div class="option-icon bulk-icon">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                    </div>
                    <div class="option-text">
                        <div class="option-title">Bulk Analyze</div>
                        <div class="option-subtitle">Multiple leads at once</div>
                    </div>
                </div>
            </div>
        `;

        // Apply styles
        this.styleDropdown(this.dropdownElement, buttonContainer);

        // Add click handlers for options
        this.setupDropdownHandlers(this.dropdownElement);

// Add to button container to maintain relative positioning
buttonContainer.appendChild(this.dropdownElement);

        // Force reflow for positioning
        this.dropdownElement.offsetHeight;

        console.log('✅ [DashboardHeader] Dropdown created and positioned');
    }

    /**
     * Apply styles to dropdown element
     */
    styleDropdown(dropdown, buttonContainer) {
        const rect = buttonContainer.getBoundingClientRect();
        
        // Calculate position
        const top = rect.bottom + 8;
        const left = rect.left + (rect.width / 2);

dropdown.style.cssText = `
    position: absolute !important;
    top: calc(100% + 8px) !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 220px !important;
    background: white !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
    border: 1px solid rgba(0,0,0,0.1) !important;
    z-index: 99999 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    opacity: 0 !important;
    transform: translateX(-50%) translateY(-10px) !important;
    transition: all 0.2s ease !important;
`;

        // Animate in
        requestAnimationFrame(() => {
            dropdown.style.opacity = '1';
            dropdown.style.transform = 'translateX(-50%) translateY(0)';
        });
    }

    /**
     * Setup dropdown option handlers
     */
    setupDropdownHandlers(dropdown) {
        const options = dropdown.querySelectorAll('.dropdown-option');
        
        options.forEach(option => {
            // Hover effects
            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = '#f9fafb';
            });
            
            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = 'transparent';
            });

            // Click handler
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = option.dataset.mode;
                this.switchMode(mode);
            });
        });
    }

    /**
     * Switch between single and bulk modes
     */
    switchMode(mode) {
        if (mode === this.currentMode) {
            this.closeDropdown();
            return;
        }

        console.log('🔄 [DashboardHeader] Switching mode from', this.currentMode, 'to', mode);

        this.currentMode = mode;
        this.updateButtonText();
        this.closeDropdown();

        // Emit mode change event
        if (this.eventBus) {
            this.eventBus.emit('header:mode-changed', { mode });
        }

        console.log('✅ [DashboardHeader] Mode switched to:', mode);
    }

updateButtonText() {
    const textElement = document.getElementById('main-research-text');
    const buttonContainer = document.getElementById('main-button-container');
    if (!textElement || !buttonContainer) return;

    if (this.currentMode === 'single') {
        textElement.textContent = 'Research New Lead';
        buttonContainer.className = 'bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300';
    } else if (this.currentMode === 'bulk') {
        textElement.textContent = 'Bulk Analyze';
        buttonContainer.className = 'bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300';
    }
}

    /**
     * Handle clicks outside the dropdown to close it
     */
    handleOutsideClick(event) {
        if (!this.isDropdownOpen) return;

        const dropdown = document.getElementById('research-dropdown');
        const dropdownButton = document.getElementById('dropdown-arrow-btn');
        
        if (dropdown && !dropdown.contains(event.target) && 
            dropdownButton && !dropdownButton.contains(event.target)) {
            this.closeDropdown();
        }
    }

setupModalObserver() {
    // No observer needed - dropdown handles outside clicks properly
    console.log('✅ [DashboardHeader] Modal observer disabled');
}

    /**
     * Setup cleanup handlers for page unload
     */
    setupCleanupHandlers() {
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        window.addEventListener('pagehide', () => {
            this.cleanup();
        });
    }

    /**
     * Open research modal based on current mode
     */
    openResearchModal() {
        console.log('🔍 [DashboardHeader] Opening research modal...');
        
        if (window.dashboard?.container?.get('researchHandlers')) {
            window.dashboard.container.get('researchHandlers').openResearchModal();
        } else if (window.ResearchHandlers) {
            new window.ResearchHandlers().openResearchModal();
        } else if (window.openResearchModal) {
            window.openResearchModal();
        } else {
            console.error('❌ [DashboardHeader] No research modal function available');
        }
    }

openBulkModal() {
    console.log('📊 [DashboardHeader] Opening bulk modal...');
    
    // Simplified: just delegate to analysis functions
    if (window.dashboard?.container?.get('analysisFunctions')) {
        window.dashboard.container.get('analysisFunctions').showBulkModal();
    } else if (window.showBulkModal) {
        window.showBulkModal();
    } else {
        console.error('❌ [DashboardHeader] No bulk modal function available');
    }
}

    /**
     * Initialize Feather icons in the header
     */
    initializeIcons() {
        if (typeof feather !== 'undefined') {
            feather.replace();
            console.log('✅ [DashboardHeader] Feather icons initialized');
        }
    }

setupGlobalFunctions() {
    // No global functions - use proper dependency injection only
    console.log('✅ [DashboardHeader] Skipping global function pollution');
}
    /**
     * Get current header state
     */
    getState() {
        return {
            mode: this.currentMode,
            dropdownOpen: this.isDropdownOpen,
            initialized: this.initialized
        };
    }

cleanup() {
    console.log('🧹 [DashboardHeader] Cleaning up...');
    
    this.removeEventHandlers();
    
    if (this.modalObserver) {
        this.modalObserver.disconnect();
    }
    
    if (this.dropdownElement) {
        this.dropdownElement.remove();
    }
    
    this.initialized = false;
    this._initializing = false;
    
    console.log('✅ [DashboardHeader] Cleanup completed');
}

    /**
     * Debug method to check header state
     */
    debug() {
        return {
            initialized: this.initialized,
            mode: this.currentMode,
            dropdownOpen: this.isDropdownOpen,
            container: !!this.container,
            eventBus: !!this.eventBus,
            domElements: {
                buttonContainer: !!document.getElementById('main-button-container'),
                mainButton: !!document.getElementById('main-research-btn'),
                dropdownButton: !!document.getElementById('dropdown-arrow-btn'),
                dropdown: !!document.getElementById('research-dropdown')
            }
        };
    }
}

// CSS Styles for the dropdown (inject into page if needed)
const DROPDOWN_CSS = `
<style id="dashboard-header-dropdown-styles">
.dashboard-header-dropdown {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.dropdown-content {
    padding: 8px 0;
}

.dropdown-option {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.dropdown-option:hover {
    background-color: #f9fafb;
}

.option-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    color: white;
}

.single-icon {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.bulk-icon {
    background: linear-gradient(135deg, #f97316, #ea580c);
}

.option-text {
    flex: 1;
}

.option-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
    margin-bottom: 2px;
}

.option-subtitle {
    color: #6b7280;
    font-size: 12px;
}
</style>
`;

// Inject CSS if not already present
if (typeof document !== 'undefined' && !document.getElementById('dashboard-header-dropdown-styles')) {
    document.head.insertAdjacentHTML('beforeend', DROPDOWN_CSS);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardHeader;
} else {
    window.DashboardHeader = DashboardHeader;
}

console.log('📄 [DashboardHeader] Complete rewrite loaded successfully');
