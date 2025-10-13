//public/pages/dashboard/modules/ui/modal-manager.js

/**
 * OSLIRA MODAL MANAGER MODULE - Migrated to New System (No Container)
 * Handles all modal operations, analysis forms, and bulk upload functionality
 */
class ModalManager {
    constructor() {
        // Use global window objects directly (no container)
        this.eventBus = window.EventBus || window.OsliraEventBus;
        this.stateManager = window.StateManager || window.OsliraStateManager;
        this.osliraAuth = window.OsliraAuth;
        
        // Modal state
        this.activeModals = new Set();
        this.bulkUsernames = [];
        
        console.log('🚀 [ModalManager] Initialized (Migrated System)');
    }
    
    async init() {
        // Setup modal event listeners
        this.setupModalEventListeners();
        
        console.log('✅ [ModalManager] Event listeners initialized');
    }
    
    // ===============================================================================
    // MODAL CONTROL METHODS - EXTRACTED FROM ORIGINAL
    // ===============================================================================
    
    openModal(modalId, data = {}) {
        console.log(`📖 [ModalManager] Opening modal: ${modalId}`);
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`❌ [ModalManager] Modal not found: ${modalId}`);
            return null;
        }
        
        // Close all other modals first
        this.closeAllModals();
        
        // Open this modal
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        // Show modal wrapper
        const wrapper = modal.querySelector('.fixed.inset-0');
        if (wrapper) {
            wrapper.classList.remove('hidden');
        }
        
        // Track as active
        this.activeModals.add(modalId);
        this.stateManager?.setState('activeModal', modalId);
        
        this.eventBus?.emit('MODAL_OPENED', { modalId, data });
        console.log(`✅ [ModalManager] Modal opened: ${modalId}`);
        
        return modal;
    }

    closeModal(modalId) {
        console.log(`📕 [ModalManager] Closing modal: ${modalId}`);
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`⚠️ [ModalManager] Modal not found: ${modalId}`);
            return;
        }
        
        // Hide modal
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        // Hide wrapper
        const wrapper = modal.querySelector('.fixed.inset-0');
        if (wrapper) {
            wrapper.classList.add('hidden');
        }
        
        // Remove from active tracking
        this.activeModals.delete(modalId);
        
        // Clear state if this was the active modal
        const currentActive = this.stateManager?.getState('activeModal');
        if (currentActive === modalId) {
            this.stateManager?.setState('activeModal', null);
        }
        
        // Clear form data
        this.clearModalForm(modalId);
        
        this.eventBus?.emit('MODAL_CLOSED', { modalId });
        console.log(`✅ [ModalManager] Modal closed: ${modalId}`);
    }

    closeAllModals() {
        const modalIds = Array.from(this.activeModals);
        modalIds.forEach(modalId => this.closeModal(modalId));
    }
    
    
    
    // ===============================================================================
    // ANALYSIS MODAL - EXTRACTED FROM dashboard.js
    // ===============================================================================
    
    showAnalysisModal(prefillUsername = '') {
        console.log('🔍 [ModalManager] Opening analysis modal with username:', prefillUsername);
        
        try {
            const modal = this.openModal('analysisModal');
            if (!modal) {
                console.error('❌ [ModalManager] Failed to open analysisModal');
                return;
            }
            
            console.log('✅ [ModalManager] Analysis modal opened successfully');
            
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
                profileInput.value = prefillUsername; // Allow prefilling username
            }
            if (inputContainer) {
                inputContainer.style.display = 'none';
            }
            
            // Load business profiles (async with proper error handling)
            setTimeout(async () => {
                try {
                    // Use global BusinessManager
                    if (window.BusinessManager && window.BusinessManager.loadBusinessProfilesForModal) {
                        await window.BusinessManager.loadBusinessProfilesForModal();
                    }
                } catch (error) {
                    console.error('❌ [ModalManager] Failed to load business profiles:', error);
                }
            }, 100);
            
            // Focus on analysis type dropdown
            setTimeout(() => {
                if (analysisType) {
                    analysisType.focus();
                }
            }, 200);
            
            console.log('✅ [ModalManager] Analysis modal opened');
            
        } catch (error) {
            console.error('❌ [ModalManager] Failed to open analysis modal:', error);
            if (window.OsliraApp) {
                window.OsliraApp.showMessage('Failed to open analysis modal. Please try again.', 'error');
            }
        }
    }
    
    handleAnalysisTypeChange() {
        const analysisType = document.getElementById('analysis-type')?.value;
        const inputContainer = document.getElementById('input-field-container');
        const profileInput = document.getElementById('username');
        
        if (analysisType && inputContainer) {
            inputContainer.style.display = 'block';
            
            // Setup real-time validation listener
            if (profileInput && !profileInput.dataset.validationSetup) {
                profileInput.dataset.validationSetup = 'true';
                
                profileInput.addEventListener('input', () => {
                    this.validateUsernameField(profileInput);
                });
                
                profileInput.addEventListener('blur', () => {
                    this.validateUsernameField(profileInput);
                });
            }
            
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

    validateUsernameField(input) {
        if (!input || !input.value) {
            input.classList.remove('field-invalid', 'border-red-500');
            input.classList.remove('field-valid', 'border-green-500');
            this.hideUsernameError();
            return;
        }
        
        const username = input.value.trim();
        const cleanUsername = username.replace(/^@/, '');
        const validation = this.validateInstagramUsername(cleanUsername);
        
        if (validation.isValid) {
            input.classList.remove('field-invalid', 'border-red-500');
            input.classList.add('field-valid', 'border-green-500');
            this.showUsernameSuccess();
        } else {
            input.classList.add('field-invalid', 'border-red-500');
            input.classList.remove('field-valid', 'border-green-500');
            this.showUsernameError(validation.error);
        }
    }

    validateInstagramUsername(username) {
        // Empty check
        if (!username || username.length === 0) {
            return { isValid: false, error: 'Username is required' };
        }
        
        // Length check (1-30 characters)
        if (username.length > 30) {
            return { isValid: false, error: 'Username must be 30 characters or less' };
        }
        
        // Character validation (letters, numbers, periods, underscores only)
        const validCharsRegex = /^[a-zA-Z0-9._]+$/;
        if (!validCharsRegex.test(username)) {
            return { isValid: false, error: 'Username can only contain letters, numbers, periods (.), and underscores (_)' };
        }
        
        // No leading dot
        if (username.startsWith('.')) {
            return { isValid: false, error: 'Username cannot start with a period' };
        }
        
        // No trailing dot
        if (username.endsWith('.')) {
            return { isValid: false, error: 'Username cannot end with a period' };
        }
        
        // No consecutive dots
        if (username.includes('..')) {
            return { isValid: false, error: 'Username cannot contain consecutive periods (..)' };
        }
        
        return { isValid: true, error: null };
    }

    showUsernameError(message) {
        const profileInput = document.getElementById('username');
        if (!profileInput) return;
        
        // Remove existing error
        const existingError = document.getElementById('username-validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create new error message with icon
        const errorDiv = document.createElement('div');
        errorDiv.id = 'username-validation-error';
        errorDiv.className = 'username-validation-error';
        errorDiv.innerHTML = `
            <svg class="validation-message-icon validation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>${message}</span>
        `;
        
        // Insert after input
        profileInput.parentNode.insertBefore(errorDiv, profileInput.nextSibling);
    }

    showUsernameSuccess() {
        const profileInput = document.getElementById('username');
        if (!profileInput) return;
        
        // Remove existing messages
        const existingError = document.getElementById('username-validation-error');
        const existingSuccess = document.getElementById('username-validation-success');
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
        
        // Create success message with icon
        const successDiv = document.createElement('div');
        successDiv.id = 'username-validation-success';
        successDiv.className = 'username-validation-success';
        successDiv.innerHTML = `
            <svg class="validation-message-icon validation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Valid Instagram username</span>
        `;
        
        // Insert after input
        profileInput.parentNode.insertBefore(successDiv, profileInput.nextSibling);
        
        // Auto-remove success message after 2 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.style.opacity = '0';
                successDiv.style.transform = 'translateY(-5px)';
                setTimeout(() => successDiv.remove(), 300);
            }
        }, 2000);
    }

    hideUsernameError() {
        const existingError = document.getElementById('username-validation-error');
        const existingSuccess = document.getElementById('username-validation-success');
        
        if (existingError) {
            existingError.style.opacity = '0';
            existingError.style.transform = 'translateY(-5px)';
            setTimeout(() => existingError.remove(), 300);
        }
        
        if (existingSuccess) {
            existingSuccess.style.opacity = '0';
            existingSuccess.style.transform = 'translateY(-5px)';
            setTimeout(() => existingSuccess.remove(), 300);
        }
    }
    
    updateCreditCostDisplay(analysisType) {
        const costDisplay = document.getElementById('analysis-cost-display');
        if (costDisplay) {
            const cost = analysisType === 'deep' ? 2 : 1;
            costDisplay.textContent = `${cost} credit${cost > 1 ? 's' : ''}`;
        }
    }
    
    updateAnalysisSubmitButton(analysisType) {
        const submitBtn = document.getElementById('analysis-submit-btn');
        if (submitBtn) {
            if (analysisType) {
                const cost = analysisType === 'deep' ? 2 : 1;
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
        
        try {
            console.log('🔍 [ModalManager] Processing analysis form...');
            
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
            const validation = this.validateInstagramUsername(cleanUsername);
            
            if (!validation.isValid) {
                // Show validation error on the field
                const profileInput = document.getElementById('username');
                if (profileInput) {
                    profileInput.classList.add('field-invalid', 'border-red-500');
                    this.showUsernameError(validation.error);
                }
                throw new Error(validation.error);
            }
                
            // Close modal
            this.closeModal('analysisModal');
            
            // Start analysis using global AnalysisQueue
            if (window.AnalysisQueue) {
                const result = await window.AnalysisQueue.startSingleAnalysis({
                    username: cleanUsername,
                    analysisType,
                    businessId
                });
                
                if (window.OsliraApp) {
                    window.OsliraApp.showMessage(
                        `Analysis started for @${cleanUsername}`,
                        'success'
                    );
                }
                
                console.log('✅ [ModalManager] Analysis form processed:', result);
            }
            
        } catch (error) {
            console.error('❌ [ModalManager] Analysis form processing failed:', error);
            if (window.OsliraApp) {
                window.OsliraApp.showMessage(
                    `Analysis failed: ${error.message}`,
                    'error'
                );
            }
        }
    }
    
    // ===============================================================================
    // BULK MODAL - EXTRACTED FROM dashboard.js
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
        
        // Hide validation bars on initial load
        const successBar = document.getElementById('validation-success');
        const errorBar = document.getElementById('validation-error');
        if (successBar) successBar.classList.add('hidden');
        if (errorBar) errorBar.classList.add('hidden');
        
        // Reset validation state
        const submitBtn = document.getElementById('bulk-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
            
        // Clear usernames
        this.bulkUsernames = [];
    }
    
    // Handle file upload - EXTRACTED FROM ORIGINAL
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('📄 [ModalManager] Processing file upload:', file.name);
        
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
            
            console.log(`✅ [ModalManager] File processed: ${usernames.length} usernames found`);
            
        } catch (error) {
            console.error('❌ [ModalManager] File processing failed:', error);
            if (window.OsliraApp) {
                window.OsliraApp.showMessage(`File processing failed: ${error.message}`, 'error');
            }
            
            // Reset file input
            event.target.value = '';
            this.bulkUsernames = [];
        }
    }
    
    validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
        
        if (file.size > maxSize) {
            if (window.OsliraApp) {
                window.OsliraApp.showMessage('File too large. Maximum size is 5MB.', 'error');
            }
            return false;
        }
        
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
            if (window.OsliraApp) {
                window.OsliraApp.showMessage('Please upload a CSV or TXT file.', 'error');
            }
            return false;
        }
        
        return true;
    }
    
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    parseUsernamesFromContent(content, fileType) {
        let lines = [];
        
        if (fileType === 'text/csv' || content.includes(',')) {
            // Parse as CSV
            lines = content.split('\n').map(line => {
                // Take first column if CSV, otherwise whole line
                return line.split(',')[0];
            });
        } else {
            // Parse as plain text
            lines = content.split('\n');
        }
        
        // Clean and validate usernames
        const usernames = lines
            .map(line => this.cleanUsername(line))
            .filter(username => username && this.isValidUsername(username))
            .filter((username, index, arr) => arr.indexOf(username) === index); // Remove duplicates
        
        return usernames;
    }
    
    cleanUsername(input) {
        if (!input || typeof input !== 'string') return '';
        
        // Remove whitespace, @, and common prefixes
        let username = input.trim()
            .replace(/^@/, '')
            .replace(/^https?:\/\//, '')
            .replace(/^(www\.)?instagram\.com\//, '')
            .replace(/\/$/, '');
        
        // Extract username from Instagram URL if present
        if (username.includes('/')) {
            username = username.split('/')[0];
        }
        
        return username;
    }
    
    isValidUsername(username) {
        // Instagram username validation
        return /^[a-zA-Z0-9._]{1,30}$/.test(username);
    }
    
    displayParsedUsernames(usernames, filename) {
        const fileDisplay = document.getElementById('file-display');
        if (!fileDisplay) return;
        
        const previewCount = Math.min(usernames.length, 5);
        const remainingCount = Math.max(0, usernames.length - previewCount);
        
        fileDisplay.innerHTML = `
            <div class="file-summary">
                <div class="file-info">
                    <span class="filename">📄 ${filename}</span>
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
    
    // Handle bulk form validation - EXTRACTED FROM ORIGINAL
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
    
    checkBulkCredits() {
        const creditCost = this.calculateBulkCreditCost();
        const availableCredits = this.osliraAuth?.user?.credits || 0;
        
        return availableCredits >= creditCost;
    }
    
    calculateBulkCreditCost() {
        const analysisType = document.getElementById('bulk-analysis-type')?.value;
        const usernameCount = this.bulkUsernames?.length || 0;
        const costPerAnalysis = analysisType === 'deep' ? 2 : 1;
        
        return usernameCount * costPerAnalysis;
    }
    
    // Process bulk upload
    async processBulkUpload() {
        try {
            console.log('📁 [ModalManager] Processing bulk upload');
            
            const analysisType = document.getElementById('bulk-analysis-type')?.value;
            const businessId = document.getElementById('bulk-business-id')?.value;
            const usernames = this.bulkUsernames || [];
            
            if (!analysisType || !businessId || usernames.length === 0) {
                throw new Error('Please complete all required fields');
            }
            
            // Close modal
            this.closeModal('bulkModal');
            
            // Convert usernames to lead objects
            const leads = usernames.map(username => ({ username }));
            
            // Use the global AnalysisQueue for bulk processing
            if (window.AnalysisQueue) {
                const result = await window.AnalysisQueue.startBulkAnalysis(leads, analysisType, businessId);
                
                if (window.OsliraApp) {
                    window.OsliraApp.showMessage(
                        `Bulk analysis started: ${leads.length} profiles queued`,
                        'success'
                    );
                }
                
                console.log('✅ [ModalManager] Bulk upload initiated:', result);
            }
            
        } catch (error) {
            console.error('❌ [ModalManager] Bulk upload failed:', error);
            if (window.OsliraApp) {
                window.OsliraApp.showMessage(
                    `Bulk upload failed: ${error.message}`,
                    'error'
                );
            }
        }
    }
    
    // ===============================================================================
    // LEAD DETAILS MODAL
    // ===============================================================================
    
    async showLeadDetailsModal(leadId) {
        console.log('📊 [ModalManager] Opening lead details modal for:', leadId);
        
        const modal = this.openModal('leadDetailsModal');
        if (!modal) return;
        
        const contentContainer = document.getElementById('lead-details-content');
        if (!contentContainer) return;
        
        // Show loading state
        contentContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading lead details...</p>
            </div>
        `;
        
        try {
            // Get lead details using global LeadManager
            if (!window.LeadManager) {
                throw new Error('LeadManager not available');
            }
            
            const leadData = await window.LeadManager.getLeadDetails(leadId);
            
            if (!leadData) {
                throw new Error('Lead not found');
            }
            
            // Render lead details
            this.renderLeadDetails(leadData, contentContainer);
            
            console.log('✅ [ModalManager] Lead details loaded');
            
        } catch (error) {
            console.error('❌ [ModalManager] Failed to load lead details:', error);
            
            contentContainer.innerHTML = `
                <div class="error-state">
                    <h3 style="margin: 0; color: var(--error);">Error Loading Lead</h3>
                    <p style="color: var(--text-secondary);">${error.message}</p>
                    <button onclick="window.ModalManager.showLeadDetailsModal('${leadId}')" 
                            class="btn btn-primary" style="margin-top: 16px;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
    
    renderLeadDetails(leadData, container) {
        const { lead, analysis } = leadData;
        
        container.innerHTML = `
            <div class="lead-details">
                <div class="lead-header">
                    <div class="lead-avatar">
                        <img src="${lead.profile_pic_url || '/assets/default-avatar.png'}" 
                             alt="@${lead.username}" />
                    </div>
                    <div class="lead-info">
                        <h2>@${lead.username}</h2>
                        <p class="platform">${lead.platform || 'Instagram'}</p>
                        <p class="score">Score: ${lead.score || 0}/100</p>
                    </div>
                </div>
                
                ${analysis ? this.renderAnalysisDetails(analysis) : ''}
                
                <div class="lead-actions">
                    <button class="btn btn-primary" onclick="window.ModalManager.copyText('outreach-message')">
                        Copy Message
                    </button>
                    <button class="btn btn-secondary" onclick="window.ModalManager.closeModal('leadDetailsModal')">
                        Close
                    </button>
                </div>
            </div>
        `;
    }
    
    renderAnalysisDetails(analysis) {
        return `
            <div class="analysis-details">
                <div class="analysis-scores">
                    <div class="score-item">
                        <span class="score-label">Engagement</span>
                        <span class="score-value">${analysis.engagement_score || 0}/100</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Niche Fit</span>
                        <span class="score-value">${analysis.score_niche_fit || 0}/100</span>
                    </div>
                </div>
                
                ${analysis.outreach_message ? `
                    <div class="outreach-message">
                        <h4>Personalized Message</h4>
                        <div id="outreach-message" class="message-content">
                            ${analysis.outreach_message}
                        </div>
                    </div>
                ` : ''}
                
                ${analysis.selling_points && analysis.selling_points.length > 0 ? `
                    <div class="selling-points">
                        <h4>Key Selling Points</h4>
                        <ul>
                            ${analysis.selling_points.map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // ===============================================================================
    // MESSAGE EDITING
    // ===============================================================================
    
    editMessage(leadId) {
        console.log('✏️ [ModalManager] Editing message for lead:', leadId);
        
        const messageElement = document.querySelector(`[data-lead-id="${leadId}"] .outreach-message`);
        if (!messageElement) return;
        
        const currentMessage = messageElement.textContent.trim();
        
        // Create textarea for editing
        const textarea = document.createElement('textarea');
        textarea.value = currentMessage;
        textarea.className = 'message-editor';
        textarea.rows = 4;
        
        // Create save/cancel buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'edit-buttons';
        buttonContainer.innerHTML = `
            <button class="btn btn-primary btn-small" onclick="window.ModalManager.saveEditedMessage('${leadId}')">
                Save
            </button>
            <button class="btn btn-secondary btn-small" onclick="window.ModalManager.cancelEditMessage('${leadId}')">
                Cancel
            </button>
        `;
        
        // Replace message content with editor
        messageElement.innerHTML = '';
        messageElement.appendChild(textarea);
        messageElement.appendChild(buttonContainer);
        
        // Focus on textarea
        textarea.focus();
        textarea.select();
    }
    
    async saveEditedMessage(leadId) {
        console.log('💾 [ModalManager] Saving edited message for lead:', leadId);
        
        const messageElement = document.querySelector(`[data-lead-id="${leadId}"] .outreach-message`);
        const textarea = messageElement?.querySelector('textarea');
        
        if (!textarea) return;
        
        const newMessage = textarea.value.trim();
        
        try {
            // Save to database using global LeadManager
            if (window.LeadManager) {
                await window.LeadManager.updateLeadMessage(leadId, newMessage);
                
                // Update UI
                messageElement.innerHTML = `<p>${newMessage}</p>`;
                
                if (window.OsliraApp) {
                    window.OsliraApp.showMessage('Message updated successfully', 'success');
                }
            }
            
        } catch (error) {
            console.error('❌ [ModalManager] Failed to save message:', error);
            if (window.OsliraApp) {
                window.OsliraApp.showMessage('Failed to save message', 'error');
            }
        }
    }
    
    cancelEditMessage(leadId) {
        console.log('❌ [ModalManager] Cancelling message edit for lead:', leadId);
        
        // Reload the original message
        this.showLeadDetailsModal(leadId);
    }
    
    // ===============================================================================
    // MODAL UTILITIES
    // ===============================================================================
    
    clearModalForm(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Clear forms
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => {
            form.reset();
        });
        
        // Clear specific fields based on modal
        switch (modalId) {
            case 'analysisModal':
                const inputContainer = document.getElementById('input-field-container');
                if (inputContainer) {
                    inputContainer.style.display = 'none';
                }
                break;
                
            case 'bulkModal':
                this.bulkUsernames = [];
                const fileDisplay = document.getElementById('file-display');
                if (fileDisplay) {
                    fileDisplay.innerHTML = '';
                }
                break;
        }
    }
    
    setupModalEventListeners() {
        // Close modals when clicking outside
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-overlay')) {
                const modalId = event.target.id;
                if (modalId) {
                    this.closeModal(modalId);
                }
            }
        });
        
        // Close modals with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.activeModals.size > 0) {
                const activeModal = Array.from(this.activeModals)[0];
                this.closeModal(activeModal);
            }
        });
        
        console.log('✅ [ModalManager] Global modal event listeners setup');
    }
    
    // ===============================================================================
    // CLEANUP
    // ===============================================================================
    
    async cleanup() {
        console.log('🧹 [ModalManager] Cleaning up...');
        
        // Close all modals
        this.closeAllModals();
        
        // Clear state
        this.bulkUsernames = [];
        this.activeModals.clear();
        
        console.log('✅ [ModalManager] Cleanup completed');
    }
}

// Export for ES6 modules
export default ModalManager;

// Also keep window global for backwards compatibility
if (typeof window !== 'undefined') {
    window.ModalManager = ModalManager;
}
