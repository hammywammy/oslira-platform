// =============================================================================
// RESEARCH MODAL - UI Event Handler
// Path: /public/pages/app/dashboard/ui/modals/configs/ResearchModal.js
// Dependencies: AnalyzeLeadUseCase
// =============================================================================

/**
 * @class ResearchModal
 * @description Handles research modal UI interactions ONLY
 * 
 * Responsibilities:
 * - Open/close modal
 * - Capture form input
 * - Show loading states
 * - Display validation errors
 * - Call AnalyzeLeadUseCase for business logic
 */
class ResearchModal {
    constructor() {
        this.analyzeLeadUseCase = new window.AnalyzeLeadUseCase();
        this.setupGlobalHandlers();
        console.log('🎨 [ResearchModal] Initialized');
    }
    
    // =========================================================================
    // GLOBAL HANDLERS (for onclick attributes)
    // =========================================================================
    
    setupGlobalHandlers() {
        window.submitResearch = () => this.submit();
        window.openResearchModal = () => this.open();
        window.closeResearchModal = () => this.close();
    }
    
    // =========================================================================
    // MODAL CONTROL
    // =========================================================================
    
    open() {
        const modal = document.getElementById('researchModal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Focus username input
            const usernameInput = modal.querySelector('input[type="text"]');
            if (usernameInput) {
                setTimeout(() => usernameInput.focus(), 100);
            }
        }
    }
    
    close() {
        const modal = document.getElementById('researchModal');
        if (modal) {
            modal.classList.add('hidden');
            this.resetForm();
        }
    }
    
    resetForm() {
        const modal = document.getElementById('researchModal');
        if (!modal) return;
        
        // Clear username
        const usernameInput = modal.querySelector('input[type="text"]');
        if (usernameInput) {
            usernameInput.value = '';
            this.clearUsernameError(usernameInput);
        }
        
        // Reset to light analysis
        const lightRadio = modal.querySelector('input[name="analysis"][value="light"]');
        if (lightRadio) {
            lightRadio.checked = true;
        }
    }
    
    // =========================================================================
    // FORM SUBMISSION
    // =========================================================================
    
    async submit() {
        try {
            // 1. CAPTURE FORM DATA
            const modal = document.getElementById('researchModal');
            const usernameInput = modal?.querySelector('input[type="text"]');
            const analysisRadio = modal?.querySelector('input[name="analysis"]:checked');
            
            const username = usernameInput?.value?.trim();
            const analysisType = analysisRadio?.value || 'light';
            
            // 2. BASIC CHECK
            if (!username) {
                this.showUsernameError(usernameInput, 'Please enter a username');
                return;
            }
            
            this.clearUsernameError(usernameInput);
            
            // 3. SHOW LOADING
            this.setLoading(true);
            
            // 4. EXECUTE USE CASE
            const result = await this.analyzeLeadUseCase.execute(username, analysisType);
            
            // 5. HANDLE RESULT
            if (result.success) {
                this.close();
                this.showSuccess(`Analysis started for @${username}`);
            } else {
                // Show appropriate error
                if (result.type === 'validation') {
                    this.showUsernameError(usernameInput, result.error);
                } else {
                    this.showError(result.error);
                }
            }
            
        } catch (error) {
            console.error('❌ [ResearchModal] Unexpected error:', error);
            this.showError('Analysis failed. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }
    
    // =========================================================================
    // UI STATE MANAGEMENT
    // =========================================================================
    
    setLoading(isLoading) {
        const modal = document.getElementById('researchModal');
        const submitButton = modal?.querySelector('button[onclick*="submitResearch"]');
        
        if (!submitButton) return;
        
        if (isLoading) {
            submitButton.dataset.originalText = submitButton.textContent;
            submitButton.textContent = 'Processing...';
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            submitButton.textContent = submitButton.dataset.originalText || 'Start Research';
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
    
    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================
    
    showUsernameError(usernameInput, message) {
        if (!usernameInput) return;
        
        const container = usernameInput.parentElement;
        let errorDiv = container.querySelector('.username-validation-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'username-validation-error text-red-600 text-sm mt-1 flex items-center';
            errorDiv.innerHTML = `
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span></span>
            `;
            container.appendChild(errorDiv);
        }
        
        errorDiv.querySelector('span').textContent = message;
        
        // Add error styling to input
        usernameInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        usernameInput.classList.remove('border-gray-300');
    }
    
    clearUsernameError(usernameInput) {
        if (!usernameInput) return;
        
        const container = usernameInput.parentElement;
        const errorDiv = container.querySelector('.username-validation-error');
        
        if (errorDiv) {
            errorDiv.remove();
        }
        
        // Remove error styling
        usernameInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        usernameInput.classList.add('border-gray-300');
    }
    
    showError(message) {
        console.error('❌ [ResearchModal]', message);
        
        if (window.OsliraApp?.showMessage) {
            window.OsliraApp.showMessage(message, 'error');
        } else if (window.Notifications?.error) {
            window.Notifications.error(message);
        } else {
            alert(message);
        }
    }
    
    showSuccess(message) {
        if (window.OsliraApp?.showMessage) {
            window.OsliraApp.showMessage(message, 'success');
        } else if (window.Notifications?.success) {
            window.Notifications.success(message);
        }
    }
    
    // =========================================================================
    // MODAL HTML (Keep existing design)
    // =========================================================================
    
    renderModal() {
        return `
<!-- Research New Lead Modal -->
<div id="researchModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">Research New Lead</h3>
        
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option>Instagram</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Username or Profile URL</label>
                <input type="text" placeholder="@username or full URL" 
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Analysis Type</label>
                <div class="space-y-2">
                    <label class="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="analysis" value="light" class="text-purple-600" checked>
                        <div class="ml-3">
                            <span class="text-sm font-medium">Light Analysis</span>
                            <p class="text-xs text-gray-500">Basic profile metrics (1 credit)</p>
                        </div>
                    </label>
                    
                    <label class="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="analysis" value="deep" class="text-purple-600">
                        <div class="ml-3">
                            <span class="text-sm font-medium">Deep Analysis</span>
                            <p class="text-xs text-gray-500">Detailed insights + outreach template (2 credits)</p>
                        </div>
                    </label>
                    
                    <label class="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="analysis" value="xray" class="text-purple-600">
                        <div class="ml-3">
                            <span class="text-sm font-medium">X-Ray</span>
                            <p class="text-xs text-gray-500">Complete psychological profile (3 credits)</p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
        
        <div class="flex space-x-3 mt-8">
            <button onclick="closeResearchModal()" 
                    class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
            </button>
            <button onclick="submitResearch()" 
                    class="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                Start Research
            </button>
        </div>
    </div>
</div>`;
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.ResearchModal = ResearchModal;
console.log('✅ [ResearchModal] Loaded');
