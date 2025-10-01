// =============================================================================
// ANALYSIS FUNCTIONS MODULE - Complete Analysis System
// =============================================================================

/**
 * Unified Analysis System
 * Handles all analysis modal, form processing, and build analysis functionality
 */
class AnalysisFunctions {
constructor(container) {
    this.container = container;
    this.eventBus = container.get('eventBus');
    this.stateManager = container.get('stateManager');
    this.osliraAuth = container.get('osliraAuth');
    this.isProcessing = false;
    this.bulkUsernames = [];
    
    console.log('🔍 [AnalysisFunctions] Initialized');
}

    init() {
    console.log('🔧 [AnalysisFunctions] Initializing...');
    
    // Setup global methods for onclick handlers
    this.setupGlobalMethods();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('✅ [AnalysisFunctions] Initialization complete');
    return this;
}
    
async openLeadAnalysisModal(leadId) {
    console.log('🔍 Opening lead analysis modal for:', leadId);
    
    try {
        // Use 'this' context instead of window.modalManager to avoid re-initialization
        const leadManager = this.container.get('leadManager');
        if (!leadManager) {
            throw new Error('Lead manager not found');
        }
        
        // Add loading modal with timeout protection
        this.showLoadingModal();
        const loadingTimeout = setTimeout(() => {
            this.removeExistingModals();
            this.showErrorModal('Analysis modal timed out. Please try again.');
        }, 10000);
        
        try {
            const { lead, analysisData } = await leadManager.viewLead(leadId);
            clearTimeout(loadingTimeout);
            
            if (!lead) {
                throw new Error('Lead not found');
            }

            removeExistingModals();
            createLeadAnalysisModalStructure();
            buildAnalysisModalHTML(lead, analysisData, leadId);
        } catch (error) {
            clearTimeout(loadingTimeout);
            throw error;
        }
        
        // Animate modal entry
        setTimeout(() => {
            const modal = document.getElementById('leadAnalysisModal');
            if (modal) {
                modal.style.opacity = '1';
                const container = modal.querySelector('div');
                if (container) {
                    container.style.transform = 'scale(1)';
                }
            }
        }, 10);
        
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ Failed to load lead analysis:', error);
        removeExistingModals();
        showErrorModal(error.message);
    }
}
    

// ===============================================================================
// SIMPLIFIED MODAL BUILDING WITH MODULAR SYSTEM
// ===============================================================================

buildAnalysisModalHTML(lead, analysisData, leadId) {
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) {
        console.error('❌ Modal content container not found');
        return;
    }

    console.log('🎨 [AnalysisFunctions] Building modular modal:', {
        username: lead.username,
        analysisType: lead.analysis_type,
        hasAnalysisData: !!analysisData
    });

    // Initialize modal builder if not exists
    if (!window.modalBuilder) {
        window.modalBuilder = new ModalBuilder();
    }

    // Build and inject modal content
    modalContent.innerHTML = window.modalBuilder.buildAnalysisModal(lead, analysisData);
}

// Helper function for copying outreach message
 copyOutreachMessage() {
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
}
                                    

animateScoreAndCircle(scoreElement, circleElement, targetScore) {
    let currentScore = 0;
    const duration = 2000;
    const frameDuration = 16;
    const totalFrames = duration / frameDuration;
    const increment = targetScore / totalFrames;
    
    const circumference = 251.2;
    
    const animate = () => {
        currentScore += increment;
        
        if (currentScore >= targetScore) {
            currentScore = targetScore;
        }
        
        scoreElement.textContent = Math.round(currentScore);
        
        const progress = currentScore / 100;
        const offset = circumference * (1 - progress);
        circleElement.style.strokeDashoffset = offset;
        
        if (currentScore < targetScore) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

    init() {
        this.setupEventListeners();
        this.setupGlobalMethods();
        console.log('✅ [AnalysisFunctions] Event listeners and global methods setup');
    }

fallbackCopyTextToClipboard(text, buttonElement = null) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            this.showCopySuccess(buttonElement);
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textArea);
}

showCopySuccess(buttonElement = null) {
    // Simple success feedback with proper event handling
    let button = buttonElement;
    
    // Try to find button from event if not provided
    if (!button && typeof event !== 'undefined' && event?.target) {
        button = event.target.closest('button');
    }
    
    // Fallback to any copy button if still not found
    if (!button) {
        button = document.querySelector('button[onclick*="copyOutreachMessage"]');
    }
    
    if (button) {
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
    }
}

    setupEventListeners() {
        // Analysis type change handler
        const analysisType = document.getElementById('analysis-type');
        if (analysisType) {
            analysisType.addEventListener('change', (e) => {
                this.handleAnalysisTypeChange(e.target.value);
            });
        }

        // Bulk analysis type change
        const bulkAnalysisType = document.getElementById('bulk-analysis-type');
        if (bulkAnalysisType) {
            bulkAnalysisType.addEventListener('change', () => {
                this.validateBulkForm();
            });
        }

        // Bulk business selection change
        const bulkBusinessId = document.getElementById('bulk-business-id');
        if (bulkBusinessId) {
            bulkBusinessId.addEventListener('change', () => {
                this.validateBulkForm();
            });
        }

        // Form submission handlers
        const analysisForm = document.getElementById('analysisForm');
        if (analysisForm) {
            analysisForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processAnalysisForm(e);
            });
        }

        const bulkForm = document.getElementById('bulkForm');
        if (bulkForm) {
            bulkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processBulkUpload(e);
            });
        }

        // File upload handler
        const fileUpload = document.getElementById('file-upload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        }
    }

setupGlobalMethods() {
    // Only setup globals if they don't already exist to prevent re-initialization
    if (!window._osliraGlobalsInitialized) {
        window.openLeadAnalysisModal = (leadId) => this.buildAnalysisModal(leadId);
        window.closeLeadAnalysisModal = () => this.removeExistingModals();
        window.showLoadingModal = () => this.showLoadingModal();
        window.removeExistingModals = () => this.removeExistingModals();
        window.createLeadAnalysisModalStructure = () => this.createLeadAnalysisModalStructure();
        window.buildAnalysisModalHTML = (lead, analysisData, leadId) => this.buildAnalysisModalHTML(lead, analysisData, leadId);
        window.copyOutreachMessage = (message) => this.copyOutreachMessage(message);
        window.startDeepAnalysis = (leadId) => this.startDeepAnalysis(leadId);
        window.contactLead = (leadId) => this.contactLead(leadId);
        window.showContactSuccess = () => this.showContactSuccess();
        window.showCopySuccess = () => this.showCopySuccess();
        window.showErrorModal = (message) => this.showErrorModal(message);
        window.closeErrorModal = () => this.removeExistingModals();
        window.showAnalysisModal = (username = '') => this.showAnalysisModal(username);
        window.showBulkModal = () => this.showBulkModal();
        window.handleAnalysisTypeChange = (type) => this.handleAnalysisTypeChange(type);
        window.validateBulkForm = () => this.validateBulkForm();
        window.processAnalysisForm = (event) => this.processAnalysisForm(event);
        window.processBulkUpload = () => this.processBulkUpload();
        window.handleFileUpload = (event) => this.handleFileUpload(event);
        
        window._osliraGlobalsInitialized = true;
        console.log('✅ [AnalysisFunctions] Global methods initialized');
    } else {
        console.log('⚠️ [AnalysisFunctions] Global methods already initialized, skipping');
    }
}

    // ===============================================================================
    // ANALYSIS MODAL MANAGEMENT
    // ===============================================================================

    showAnalysisModal(prefillUsername = '') {
        console.log('🔍 [AnalysisFunctions] Opening analysis modal with username:', prefillUsername);
        
        try {
            const modalManager = this.container.get('modalManager');
            const modal = modalManager.openModal('analysisModal');
            if (!modal) {
                console.error('❌ [AnalysisFunctions] Failed to open analysisModal');
                return;
            }
            
            // Reset form
            const form = document.getElementById('analysisForm');
            if (form) {
                form.reset();
            }
            
            // Reset form fields
            const analysisType = document.getElementById('analysis-type');
            const profileInput = document.getElementById('username');
            const inputContainer = document.getElementById('input-field-container');
            
            if (analysisType) {
                analysisType.value = '';
            }
            if (profileInput) {
                profileInput.value = prefillUsername;
            }
            if (inputContainer) {
                inputContainer.style.display = 'none';
            }
            
            // Load business profiles
            setTimeout(async () => {
                try {
                    const businessManager = this.container.get('businessManager');
                    if (businessManager) {
                        await businessManager.loadBusinessProfilesForModal();
                    }
                } catch (error) {
                    console.error('❌ [AnalysisFunctions] Failed to load business profiles:', error);
                }
            }, 100);
            
            // Focus on analysis type dropdown
            setTimeout(() => {
                if (analysisType) {
                    analysisType.focus();
                }
            }, 200);
            
            console.log('✅ [AnalysisFunctions] Analysis modal opened');
            
        } catch (error) {
            console.error('❌ [AnalysisFunctions] Failed to open analysis modal:', error);
            this.osliraAuth?.showMessage('Failed to open analysis modal. Please try again.', 'error');
        }
    }

showBulkModal() {
    console.log('📁 [AnalysisFunctions] Opening bulk analysis modal...');
    
    try {
        const modalManager = this.container.get('modalManager');
        modalManager.showBulkModal(); // Let modal manager handle all state logic
        
        console.log('✅ [AnalysisFunctions] Bulk modal opened');
    } catch (error) {
        console.error('❌ [AnalysisFunctions] Failed to open bulk modal:', error);
    }
}

    // ===============================================================================
    // FORM HANDLERS
    // ===============================================================================

    handleAnalysisTypeChange(type) {
        const analysisType = type || document.getElementById('analysis-type')?.value;
        const inputContainer = document.getElementById('input-field-container');
        const profileInput = document.getElementById('username');
        
        if (analysisType && inputContainer) {
            inputContainer.style.display = 'block';
            
            // Focus on input field
            setTimeout(() => {
                if (profileInput) {
                    profileInput.focus();
                }
            }, 100);
        }
        
        // Update credit cost display
        this.updateCreditCostDisplay(analysisType);
        
        // Update submit button
        this.updateAnalysisSubmitButton(analysisType);
    }

    updateCreditCostDisplay(analysisType) {
    const costDisplay = document.getElementById('analysis-cost');
    if (costDisplay) {
        if (analysisType) {
            const cost = analysisType === 'xray' ? 3 : (analysisType === 'deep' ? 2 : 1);
            costDisplay.textContent = `${cost} credit${cost > 1 ? 's' : ''}`;
        }
    }
}
    
updateAnalysisSubmitButton(analysisType) {
    const submitBtn = document.getElementById('analysis-submit-btn');
    if (submitBtn) {
        if (analysisType) {
            const cost = analysisType === 'xray' ? 3 : (analysisType === 'deep' ? 2 : 1);
            submitBtn.textContent = `Start Analysis (${cost} credit${cost > 1 ? 's' : ''})`;
            submitBtn.disabled = false;
        } else {
            submitBtn.textContent = 'Select Analysis Type';
            submitBtn.disabled = true;
        }
    }
}

    async processAnalysisForm(event) {
        event.preventDefault();
        
        if (this.isProcessing) return;
        
        try {
            console.log('🔍 [AnalysisFunctions] Processing analysis form...');
            
            // Get form data
            const formData = new FormData(event.target);
            const username = formData.get('username')?.trim();
            const analysisType = formData.get('analysisType');
            const businessId = formData.get('businessId');
            
            // Validate inputs
            if (!username || !analysisType || !businessId) {
                throw new Error('Please fill in all required fields');
            }
            
            // Clean username
            const cleanUsername = this.cleanUsername(username);
            if (!this.isValidUsername(cleanUsername)) {
                throw new Error('Please enter a valid Instagram username');
            }
            
            this.isProcessing = true;
            const submitBtn = document.getElementById('analysis-submit-btn');
            this.setSubmitButtonLoading(submitBtn, true);
            
            // Close modal
            const modalManager = this.container.get('modalManager');
            modalManager.closeModal('analysisModal');
            
            // Start analysis
            const analysisQueue = this.container.get('analysisQueue');
            const result = await analysisQueue.startSingleAnalysis({
                username: cleanUsername,
                analysisType,
                businessId
            });
            
            this.osliraAuth?.showMessage(
                `Analysis started for @${cleanUsername}`,
                'success'
            );
            
            console.log('✅ [AnalysisFunctions] Analysis form processed:', result);
            
        } catch (error) {
            console.error('❌ [AnalysisFunctions] Analysis form processing failed:', error);
            this.osliraAuth?.showMessage(
                `Analysis failed: ${error.message}`,
                'error'
            );
        } finally {
            this.isProcessing = false;
            const submitBtn = document.getElementById('analysis-submit-btn');
            this.setSubmitButtonLoading(submitBtn, false);
        }
    }

    // ===============================================================================
    // BULK ANALYSIS FUNCTIONS
    // ===============================================================================

    resetBulkModal() {
        // Reset form
        const form = document.getElementById('bulkForm');
        if (form) {
            form.reset();
        }
        
        // Clear file input display
        const fileDisplay = document.getElementById('file-display');
        if (fileDisplay) {
            fileDisplay.innerHTML = '';
        }
        
        // Reset validation state
        const submitBtn = document.getElementById('bulk-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Select Analysis Type';
        }
        
        // Clear usernames
        this.bulkUsernames = [];
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('📄 [AnalysisFunctions] Processing file upload:', file.name);
        
        try {
            // Validate file
            if (!this.validateFile(file)) {
                return;
            }
            
            // Read file content
            const content = await this.readFileAsText(file);
            
            // Parse usernames
            const usernames = this.parseUsernamesFromContent(content, file.type);
            
            if (usernames.length === 0) {
                throw new Error('No valid usernames found in file');
            }
            
            // Store usernames
            this.bulkUsernames = usernames;
            
            // Update UI
            this.displayParsedUsernames(usernames, file.name);
            this.validateBulkForm();
            
            console.log(`✅ [AnalysisFunctions] File processed: ${usernames.length} usernames found`);
            
        } catch (error) {
            console.error('❌ [AnalysisFunctions] File processing failed:', error);
            this.osliraAuth?.showMessage(`File processing failed: ${error.message}`, 'error');
            
            // Reset file input
            event.target.value = '';
            this.bulkUsernames = [];
        }
    }

    validateBulkForm() {
        const analysisType = document.getElementById('bulk-analysis-type')?.value;
        const businessId = document.getElementById('bulk-business-id')?.value;
        const usernameCount = this.bulkUsernames?.length || 0;
        const submitBtn = document.getElementById('bulk-submit-btn');
        
        if (!submitBtn) return;
        
        // Check if all fields are filled
        const isFormValid = analysisType && businessId && usernameCount > 0;
        
        // Check credits
        const hasEnoughCredits = this.checkBulkCredits();
        
        // Update button state
        const isValid = isFormValid && hasEnoughCredits;
        
        if (isValid) {
            const creditCost = this.calculateBulkCreditCost();
            submitBtn.textContent = `Start Bulk Analysis (${creditCost} credits)`;
            submitBtn.disabled = false;
        } else if (!isFormValid) {
            submitBtn.textContent = 'Complete all fields';
            submitBtn.disabled = true;
        } else if (!hasEnoughCredits) {
            const creditCost = this.calculateBulkCreditCost();
            submitBtn.textContent = `Insufficient credits (${creditCost} needed)`;
            submitBtn.disabled = true;
        }
        
        // Update submit button styling
        submitBtn.style.opacity = isValid ? '1' : '0.6';
        submitBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
    }

    async processBulkUpload() {
        if (this.isProcessing) return;
        
        try {
            console.log('📁 [AnalysisFunctions] Processing bulk upload...');
            
            const analysisType = document.getElementById('bulk-analysis-type')?.value;
            const businessId = document.getElementById('bulk-business-id')?.value;
            
            if (!this.bulkUsernames?.length || !analysisType || !businessId) {
                throw new Error('Please complete all fields');
            }
            
            this.isProcessing = true;
            const submitBtn = document.getElementById('bulk-submit-btn');
            this.setSubmitButtonLoading(submitBtn, true, 'Processing...');
            
            // Close modal
            const modalManager = this.container.get('modalManager');
            modalManager.closeModal('bulkModal');
            
            // Start bulk analysis
            const analysisQueue = this.container.get('analysisQueue');
            const result = await analysisQueue.startBulkAnalysis({
                usernames: this.bulkUsernames,
                analysisType,
                businessId
            });
            
            this.osliraAuth?.showMessage(
                `Bulk analysis started for ${this.bulkUsernames.length} profiles`,
                'success'
            );
            
            console.log('✅ [AnalysisFunctions] Bulk upload processed:', result);
            
        } catch (error) {
            console.error('❌ [AnalysisFunctions] Bulk upload failed:', error);
            this.osliraAuth?.showMessage(
                `Bulk upload failed: ${error.message}`,
                'error'
            );
        } finally {
            this.isProcessing = false;
            const submitBtn = document.getElementById('bulk-submit-btn');
            this.setSubmitButtonLoading(submitBtn, false);
        }
    }

    // ===============================================================================
    // BUILD ANALYSIS FUNCTIONS
    // ===============================================================================

async buildAnalysisModal(leadId) {
    console.log('🔍 [AnalysisFunctions] Building analysis modal for lead:', leadId);
    
    try {
        this.showLoadingModal();
        
        const leadManager = this.container.get('leadManager');
        
        // Use viewLead method to get both lead and analysis data
        const { lead, analysisData } = await leadManager.viewLead(leadId);
        
        if (!lead) {
            throw new Error('Lead not found');
        }
        
        console.log('📊 [AnalysisFunctions] Lead data:', {
            username: lead.username,
            analysisType: lead.analysis_type,
            hasAnalysisData: !!analysisData
        });
            
            this.removeExistingModals();
            this.createLeadAnalysisModalStructure();
            this.buildAnalysisModalHTML(lead, analysisData, leadId);
            
            // Animate modal entry
            setTimeout(() => {
                const modal = document.getElementById('leadAnalysisModal');
                if (modal) {
                    modal.style.opacity = '1';
                    const container = modal.querySelector('div');
                    if (container) {
                        container.style.transform = 'scale(1)';
                    }
                }
            }, 10);
            
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('❌ [AnalysisFunctions] Failed to load lead analysis:', error);
            this.removeExistingModals();
            this.showErrorModal(error.message);
        }
    }

    createLeadAnalysisModalStructure() {
        this.removeExistingModals();
        
        const modalHTML = `
            <div id="leadAnalysisModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" style="opacity: 0;">
<div class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" style="transform: scale(0.95); transition: transform 0.2s ease;">
    <!-- Close button -->
    <div class="absolute top-4 right-4 z-10">
        <button onclick="closeLeadAnalysisModal()" class="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    </div>
    
    <div id="modalContent" class="overflow-y-auto flex-1" style="min-height: 0;">
        <!-- Content will be populated by buildAnalysisModalHTML -->
    </div>
</div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // ===============================================================================
    // UTILITY FUNCTIONS
    // ===============================================================================

    cleanUsername(username) {
        return username.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').split('/')[0].trim();
    }

    isValidUsername(username) {
        return /^[a-zA-Z0-9._]{1,30}$/.test(username);
    }

    setSubmitButtonLoading(button, isLoading, loadingText = 'Processing...') {
        if (!button) return;

        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || 'Start Analysis';
            button.disabled = false;
        }
    }

    validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
        
        if (file.size > maxSize) {
            this.osliraAuth?.showMessage('File too large. Maximum size is 5MB.', 'error');
            return false;
        }
        
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
            this.osliraAuth?.showMessage('Please upload a CSV or TXT file.', 'error');
            return false;
        }
        
        return true;
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseUsernamesFromContent(content, fileType) {
        const usernames = [];
        const lines = content.split(/\r?\n/);
        
        lines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine && !cleanLine.startsWith('#')) {
                // Handle CSV format
                if (fileType === 'text/csv' || cleanLine.includes(',')) {
                    const columns = cleanLine.split(',');
                    columns.forEach(col => {
                        const username = this.cleanUsername(col.trim());
                        if (username && this.isValidUsername(username)) {
                            usernames.push(username);
                        }
                    });
                } else {
                    // Handle plain text
                    const username = this.cleanUsername(cleanLine);
                    if (username && this.isValidUsername(username)) {
                        usernames.push(username);
                    }
                }
            }
        });
        
        // Remove duplicates
        return [...new Set(usernames)];
    }

    displayParsedUsernames(usernames, fileName) {
        const fileDisplay = document.getElementById('file-display');
        if (!fileDisplay) return;
        
        const previewCount = Math.min(usernames.length, 10);
        const remainingCount = Math.max(0, usernames.length - previewCount);
        
        fileDisplay.innerHTML = `
            <div class="file-summary">
                <div class="file-info">
                    <span class="file-name">${fileName}</span>
                    <span class="username-count">${usernames.length} username${usernames.length !== 1 ? 's' : ''} found</span>
                </div>
                
                <div class="username-preview">
                    <div class="preview-list">
                        ${usernames.slice(0, previewCount).map(username => 
                            `<span class="username-tag">@${username}</span>`
                        ).join('')}
                        ${remainingCount > 0 ? `<span class="more-count">+${remainingCount} more</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    checkBulkCredits() {
        const creditCost = this.calculateBulkCreditCost();
        const availableCredits = this.osliraAuth?.credits || 0;
        return availableCredits >= creditCost;
    }
    
    calculateBulkCreditCost() {
        const analysisType = document.getElementById('bulk-analysis-type')?.value;
        const usernameCount = this.bulkUsernames?.length || 0;
        const costPerAnalysis = analysisType === 'deep' ? 2 : 1;
        return usernameCount * costPerAnalysis;
    }

    showLoadingModal() {
        const loadingHTML = `
            <div id="loadingModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Loading Analysis</h3>
                    <p class="text-gray-500">Fetching lead details and analysis data...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    removeExistingModals() {
        ['leadAnalysisModal', 'loadingModal', 'errorModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.remove();
            }
        });
        document.body.style.overflow = '';
    }

showErrorModal(message) {
    console.log('🚨 [AnalysisFunctions] Showing error modal:', message);
    
    // Remove any existing modals first
    this.removeExistingModals();
    
    const errorModal = `
        <div id="errorModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="opacity: 0; transition: opacity 0.3s ease;">
            <div class="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform scale-95 transition-transform duration-300">
                <div class="flex items-center space-x-4 mb-6">
                    <div class="p-3 bg-red-100 rounded-full">
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 6.5c-.77.833-.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900">Error</h3>
                </div>
                <p class="text-gray-700 mb-6">${message}</p>
                <button onclick="closeErrorModal()" class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorModal);
    
    // Animate in
    setTimeout(() => {
        const modal = document.getElementById('errorModal');
        if (modal) {
            modal.style.opacity = '1';
            const content = modal.querySelector('div > div');
            if (content) {
                content.style.transform = 'scale(1)';
            }
        }
    }, 10);
}

removeExistingModals() {
    const existingModals = [
        'errorModal',
        'loadingModal', 
        'leadAnalysisModal',
        'analysisModal'
    ];
    
    existingModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    });
}}

// Export for module system - CORRECT FORMAT
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisFunctions;
} else {
    window.AnalysisFunctions = AnalysisFunctions;
}
console.log('📄 [AnalysisFunctions] Module loaded');
