// =============================================================================
// ANALYSIS MODAL MODULE - Dashboard Component
// =============================================================================

/**
 * Analysis Modal Handler
 * Manages Instagram profile analysis modal functionality
 */
class AnalysisModal {
    constructor() {
        this.isProcessing = false;
        console.log('🔍 [AnalysisModal] Initialized');
    }

    init() {
        this.setupEventListeners();
        console.log('✅ [AnalysisModal] Event listeners setup');
    }

    setupEventListeners() {
        // Analysis type change handler
        const analysisType = document.getElementById('analysis-type');
        if (analysisType) {
            analysisType.addEventListener('change', (e) => {
                this.handleAnalysisTypeChange(e.target.value);
            });
        }

        // Form submission handler
        const analysisForm = document.getElementById('analysisForm');
        if (analysisForm) {
            analysisForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAnalysisSubmission();
            });
        }
    }

    handleAnalysisTypeChange(type) {
        const inputContainer = document.getElementById('input-field-container');
        const profileInput = document.getElementById('username');

        if (!inputContainer || !profileInput) return;

        if (type === 'profile') {
            inputContainer.style.display = 'block';
            profileInput.placeholder = 'Enter Instagram username';
            profileInput.focus();
        } else {
            inputContainer.style.display = 'none';
            profileInput.value = '';
        }
    }

    async handleAnalysisSubmission() {
        if (this.isProcessing) return;

        const analysisType = document.getElementById('analysis-type')?.value;
        const username = document.getElementById('username')?.value;
        const submitBtn = document.getElementById('analysis-submit-btn');

        if (!analysisType) {
            this.showError('Please select an analysis type');
            return;
        }

        if (analysisType === 'profile' && !username) {
            this.showError('Please enter a username');
            return;
        }

        try {
            this.isProcessing = true;
            this.setSubmitButtonLoading(submitBtn, true);

            // Process analysis
            await this.processAnalysis(analysisType, username);

            // Close modal on success
            if (window.dashboard?.closeModal) {
                window.dashboard.closeModal('analysisModal');
            }

        } catch (error) {
            console.error('❌ [AnalysisModal] Analysis failed:', error);
            this.showError(error.message || 'Analysis failed. Please try again.');
        } finally {
            this.isProcessing = false;
            this.setSubmitButtonLoading(submitBtn, false);
        }
    }

    async processAnalysis(type, username) {
        // This would integrate with the main dashboard analysis system
        console.log('🔍 [AnalysisModal] Processing analysis:', { type, username });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Trigger dashboard refresh
        if (window.dashboard?._app?.refreshLeads) {
            await window.dashboard._app.refreshLeads();
        }
    }

    setSubmitButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.textContent = 'Processing...';
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || 'Start Analysis';
            button.disabled = false;
        }
    }

    showError(message) {
        if (window.Alert?.error) {
            window.Alert.error(message);
        } else {
            console.error('❌ [AnalysisModal]', message);
        }
    }
}

// Initialize if in dashboard context
if (typeof window !== 'undefined') {
    window.AnalysisModal = AnalysisModal;
    
    // Auto-initialize when dashboard loads
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('dashboard')) {
            const analysisModal = new AnalysisModal();
            analysisModal.init();
        }
    });
}

console.log('📄 [AnalysisModal] Module loaded');
