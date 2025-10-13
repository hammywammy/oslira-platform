//public/pages/dashboard/modules/modals/bulk-modal.js

/**
 * BULK MODAL - Migrated to New System (No Container)
 * Handles bulk CSV upload and analysis
 */
class BulkModal {
    constructor() {
        // Use global window objects directly (no container)
        this.eventBus = window.EventBus || window.OsliraEventBus;
        this.stateManager = window.StateManager || window.OsliraStateManager;
        this.osliraAuth = window.OsliraAuth;
        
        this.uploadedFile = null; 
        this.parsedData = [];
        this.duplicateCount = 0;
        this.analysisType = 'light';
        
        // Get real credits from user state
        this.currentCredits = this.getUserCredits();
        
        console.log('📁 [BulkModal] Instance created (Migrated System)');
    }

    getUserCredits() {
        // Get from actual user state
        if (this.osliraAuth?.user?.credits) {
            return this.osliraAuth.user.credits;
        }
        if (this.stateManager?.getState('user')?.credits) {
            return this.stateManager.getState('user').credits;
        }
        // Fallback
        return 1500;
    }

renderBulkModal() {
    return `
<div id="bulkModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center">
    <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full mx-6 overflow-hidden">
        
        <!-- Header -->
        <div class="p-8 pb-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl font-bold text-gray-900">Bulk Analysis</h2>
                <button onclick="window.closeBulkModal()" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <p class="text-gray-600">Upload a CSV with Instagram usernames to analyze multiple leads</p>
        </div>

        <!-- Content -->
        <div class="px-8 pb-8 space-y-6">
            
            <!-- Error Messages -->
            <div id="error-message" class="hidden p-4 bg-red-50 border border-red-200 rounded-xl">
                <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                        <div id="error-message-text" class="text-sm font-medium text-red-800"></div>
                        <div id="error-details" class="text-xs text-red-600 mt-1"></div>
                    </div>
                </div>
            </div>
            
            <!-- CSV Upload Section -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Upload CSV File</label>
                <input type="file" id="csvFile" accept=".csv" class="hidden">
                
                <div id="csv-drop-zone" class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                    <!-- Drop Placeholder - Initially Visible -->
                    <div id="drop-placeholder">
                        <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <div class="text-sm text-gray-600">Drop your CSV here</div>
                        <div class="text-xs text-gray-500 mt-1">or click to browse</div>
                    </div>
                    
                    <!-- File Display - Initially Hidden -->
                    <div id="file-display" class="hidden">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                </svg>
                                <span id="file-name-display" class="text-sm font-medium text-gray-800"></span>
                            </div>
                            <button onclick="window.removeUploadedFile(event)" class="p-1 hover:bg-gray-100 rounded-full transition-colors" title="Remove file">
                                <svg class="w-4 h-4 text-gray-500 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div id="file-stats" class="text-xs text-gray-600 mt-1"></div>
                    </div>
                </div>
                
                <!-- Validation Feedback -->
                <div id="validation-success" class="hidden mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div class="flex items-center space-x-2">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div id="success-message" class="text-sm font-medium text-green-800"></div>
                    </div>
                </div>
                
                <div id="validation-error" class="hidden mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div class="flex items-center space-x-2">
                        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div id="error-summary" class="text-sm font-medium text-red-800"></div>
                    </div>
                </div>
            </div>
            
            <!-- Analysis Type Selection -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Analysis Type</label>
                <div class="space-y-2">
                    <label class="block cursor-pointer">
                        <input type="radio" name="bulkAnalysisType" value="light" class="sr-only peer" checked>
                        <div class="analysis-option flex items-center p-4 border-2 border-orange-200 bg-orange-50 rounded-xl transition-all peer-checked:border-orange-400">
                            <div class="flex-1">
                                <div class="font-medium text-gray-800">Light Analysis</div>
                                <div class="text-xs text-gray-600">Basic profile insights (1 credit)</div>
                            </div>
                        </div>
                    </label>
                    
                    <label class="block cursor-pointer">
                        <input type="radio" name="bulkAnalysisType" value="deep" class="sr-only peer">
                        <div class="analysis-option flex items-center p-4 border-2 border-gray-200 rounded-xl transition-all peer-checked:border-purple-400 peer-checked:bg-purple-50">
                            <div class="flex-1">
                                <div class="font-medium text-gray-800">Deep Analysis</div>
                                <div class="text-xs text-gray-600">Detailed behavioral profile (2 credits)</div>
                            </div>
                        </div>
                    </label>
                    
                    <label class="block cursor-pointer">
                        <input type="radio" name="bulkAnalysisType" value="xray" class="sr-only peer">
                        <div class="analysis-option flex items-center p-4 border-2 border-gray-200 rounded-xl transition-all peer-checked:border-blue-400 peer-checked:bg-blue-50">
                            <div class="flex-1">
                                <div class="font-medium text-gray-800">X-Ray Analysis</div>
                                <div class="text-xs text-gray-600">Complete psychological profile (3 credits)</div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>
            
            <!-- Credit Calculation -->
            <div id="credit-calculation" class="hidden p-4 bg-gray-50 rounded-xl space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Leads to analyze:</span>
                    <span id="leads-display" class="font-medium text-gray-900">0</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Current credits:</span>
                    <span id="current-credits" class="font-medium text-gray-900">0</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total cost:</span>
                    <span id="total-cost" class="font-medium text-orange-600">0</span>
                </div>
                <div class="pt-2 border-t border-gray-200">
                    <div class="flex justify-between text-sm">
                        <span class="font-medium text-gray-700">Credits after:</span>
                        <span id="credits-after" class="font-semibold text-green-600">0</span>
                    </div>
                </div>
            </div>
            
        </div>
        
        <!-- Footer -->
        <div class="px-8 pb-8 flex space-x-3">
            <button onclick="window.closeBulkModal()" class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
            </button>
            <button id="bulk-submit-btn" onclick="window.submitBulkAnalysis(event)" disabled class="flex-1 px-4 py-3 bg-gray-400 text-white font-medium rounded-xl cursor-not-allowed">
                Upload File First
            </button>
        </div>
        
    </div>
</div>`;
}

    setupEventHandlers() {
    const self = this;
    
    // File upload handlers
    const csvFileInput = document.getElementById('csvFile');
    const dropZone = document.getElementById('csv-drop-zone');
    
    if (csvFileInput) {
        csvFileInput.addEventListener('change', (e) => self.handleFileSelect(e));
    }
    
    if (dropZone) {
        dropZone.addEventListener('click', () => csvFileInput?.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-orange-400', 'bg-orange-50');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-orange-400', 'bg-orange-50');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-orange-400', 'bg-orange-50');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                csvFileInput.files = files;
                self.handleFileSelect({ target: csvFileInput });
            }
        });
    }
    
    // Analysis type selection
    document.querySelectorAll('input[name="bulkAnalysisType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            self.analysisType = e.target.value;
            
            document.querySelectorAll('.analysis-option').forEach(option => {
                option.classList.remove('border-orange-200', 'bg-orange-50', 'border-purple-200', 'bg-purple-50', 'border-blue-200', 'bg-blue-50');
                option.classList.add('border-gray-200');
            });
            
            const selectedOption = radio.closest('label').querySelector('.analysis-option');
            if (self.analysisType === 'light') {
                selectedOption.classList.add('border-orange-200', 'bg-orange-50');
            } else if (self.analysisType === 'deep') {
                selectedOption.classList.add('border-purple-200', 'bg-purple-50');
            } else if (self.analysisType === 'xray') {
                selectedOption.classList.add('border-blue-200', 'bg-blue-50');
            }
            
            self.updateCostDisplay();
        });
    });
    
    // Modal controls - SIMPLE WINDOW FUNCTIONS
    window.closeBulkModal = () => {
        const modal = document.getElementById('bulkModal');
        if (modal) {
            modal.classList.add('hidden');
            console.log('✅ Bulk modal closed');
        }
    };
    
    window.submitBulkAnalysis = (event) => {
        event.preventDefault();
        self.processBulkAnalysis();
    };
    
    window.removeUploadedFile = (event) => {
        event.preventDefault();
        event.stopPropagation();
        self.resetFileInput();
        self.hideValidationBars();
    };
    
    console.log('✅ [BulkModal] Event handlers attached');
}

    isValidUsername(username) {
        const cleanUsername = username.replace(/^@/, '');
        
        if (cleanUsername.length === 0 || cleanUsername.length > 30) {
            return false;
        }
        
        const validCharsRegex = /^[a-zA-Z0-9._]+$/;
        if (!validCharsRegex.test(cleanUsername)) {
            return false;
        }
        
        if (cleanUsername.startsWith('.') || cleanUsername.endsWith('.') || cleanUsername.includes('..')) {
            return false;
        }
        
        return true;
    }

    parseCSVFile(file) {
        this.hideValidationBars();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                const invalidLines = lines.filter(line => {
                    return line.includes(',') || line.includes('\t') || line.includes(';');
                });
                
                if (invalidLines.length > 0) {
                    this.showValidationError(
                        'Invalid CSV format',
                        'File should contain only usernames, one per line, no columns or separators.'
                    );
                    this.resetFileInput();
                    return;
                }
                
                const usernames = lines.map(line => line.replace(/^@/, '').trim());
                
                const invalidUsernames = usernames.filter(username => !this.isValidUsername(username));
                if (invalidUsernames.length > 0) {
                    this.showValidationError(
                        'Invalid usernames detected',
                        `${invalidUsernames.slice(0, 3).join(', ')}${invalidUsernames.length > 3 ? '...' : ''}. Only alphanumeric characters, periods, and underscores allowed.`
                    );
                    this.resetFileInput();
                    return;
                }
                
                if (usernames.length > 50) {
                    this.showValidationError(
                        'Too many leads!',
                        `Maximum 50 allowed, you uploaded ${usernames.length}. Please reduce your list.`
                    );
                    this.resetFileInput();
                    return;
                }
                
                const uniqueUsernames = [...new Set(usernames)];
                this.duplicateCount = usernames.length - uniqueUsernames.length;
                
                this.parsedData = uniqueUsernames;
                this.uploadedFile = file;
                
                this.displayUploadedFile(file.name, uniqueUsernames.length);
                this.showValidationSuccess(uniqueUsernames.length);
                this.updateCostDisplay();
                
            } catch (error) {
                console.error('❌ [BulkModal] CSV parsing failed:', error);
                this.showValidationError('File processing failed', error.message);
                this.resetFileInput();
            }
        };
        reader.readAsText(file);
    }

    displayUploadedFile(filename, count) {
        const dropPlaceholder = document.getElementById('drop-placeholder');
        const fileDisplay = document.getElementById('file-display');
        
        if (dropPlaceholder) {
            dropPlaceholder.style.display = 'none';
            dropPlaceholder.classList.add('hidden');
        }
        
        if (fileDisplay) {
            let statsText = `${count} unique username${count !== 1 ? 's' : ''} found`;
            if (this.duplicateCount > 0) {
                statsText += ` (${this.duplicateCount} duplicate${this.duplicateCount !== 1 ? 's' : ''} removed)`;
            }
            
            fileDisplay.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                        <span id="file-name-display" class="text-sm font-medium text-gray-800">${filename}</span>
                    </div>
                    <button onclick="removeUploadedFile(event)" class="p-1 hover:bg-gray-100 rounded-full transition-colors" title="Remove file">
                        <svg class="w-4 h-4 text-gray-500 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div id="file-stats" class="text-xs text-gray-600 mt-1">${statsText}</div>
            `;
            
            fileDisplay.style.display = 'block';
            fileDisplay.classList.remove('hidden');
        }
        
        const csvExample = document.getElementById('csv-example');
        const csvLabel = document.getElementById('csv-label');
        
        if (csvExample && this.parsedData.length > 0) {
            const displayUsernames = this.parsedData.slice(0, 20);
            csvExample.innerHTML = displayUsernames.map(username => `<div>${username}</div>`).join('');
            
            if (this.parsedData.length > 20) {
                csvExample.innerHTML += `<div class="text-gray-400 text-xs mt-2">... and ${this.parsedData.length - 20} more</div>`;
            }
            
            if (csvLabel) {
                csvLabel.textContent = 'Your uploaded usernames:';
            }
        }
    }

    showValidationSuccess(count) {
        const successBar = document.getElementById('validation-success');
        const successMessage = document.getElementById('success-message');
        
        if (successBar) successBar.classList.remove('hidden');
        if (successMessage) successMessage.textContent = `${count} valid username${count !== 1 ? 's' : ''} found`;
    }

    showValidationError(title, details) {
        const errorBar = document.getElementById('validation-error');
        const errorMessage = document.getElementById('error-message-text');
        const errorDetails = document.getElementById('error-details');
        
        if (errorBar) errorBar.classList.remove('hidden');
        if (errorMessage) errorMessage.textContent = title;
        if (errorDetails) errorDetails.textContent = details;
    }

    hideValidationBars() {
        const successBar = document.getElementById('validation-success');
        const errorBar = document.getElementById('validation-error');
        
        if (successBar) successBar.classList.add('hidden');
        if (errorBar) errorBar.classList.add('hidden');
    }

    resetFileInput() {
        const csvFileEl = document.getElementById('csvFile');
        if (csvFileEl) csvFileEl.value = '';
        
        this.uploadedFile = null;
        this.parsedData = [];
        this.duplicateCount = 0;
        
        const dropPlaceholder = document.getElementById('drop-placeholder');
        const fileDisplay = document.getElementById('file-display');
        
        if (dropPlaceholder) {
            dropPlaceholder.style.display = 'block';
            dropPlaceholder.classList.remove('hidden');
        }
        
        if (fileDisplay) {
            fileDisplay.style.display = 'none';
            fileDisplay.classList.add('hidden');
        }
        
        this.updateCostDisplay();
    }

    showError(message) {
        const errorEl = document.getElementById('error-message');
        const errorTextEl = document.getElementById('error-text');
        
        if (errorEl && errorTextEl) {
            errorTextEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    hideError() {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.classList.add('hidden');
        }
    }

    updateCostDisplay() {
        if (this.parsedData.length === 0) return;

        const costPerLead = this.analysisType === 'xray' ? 3 : (this.analysisType === 'deep' ? 2 : 1);
        const totalCost = this.parsedData.length * costPerLead;
        const creditsAfter = this.currentCredits - totalCost;

        const leadsDisplayEl = document.getElementById('leads-display');
        const currentCreditsEl = document.getElementById('current-credits');
        const totalCostEl = document.getElementById('total-cost');
        const creditsAfterEl = document.getElementById('credits-after');
        const calculationEl = document.getElementById('credit-calculation');

        if (leadsDisplayEl) leadsDisplayEl.textContent = this.parsedData.length;
        if (currentCreditsEl) currentCreditsEl.textContent = this.currentCredits.toLocaleString();
        if (totalCostEl) totalCostEl.textContent = `-${totalCost}`;
        if (creditsAfterEl) {
            creditsAfterEl.textContent = creditsAfter.toLocaleString();
            creditsAfterEl.className = creditsAfter >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600';
        }
        if (calculationEl) calculationEl.classList.remove('hidden');

        const submitBtn = document.getElementById('bulk-submit-btn');
        if (submitBtn && creditsAfter < 0) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Insufficient Credits';
            submitBtn.classList.add('bg-gray-400');
            submitBtn.classList.remove('bg-gradient-to-r', 'from-orange-500', 'to-red-600');
        } else if (submitBtn && this.parsedData.length > 0) {
            submitBtn.disabled = false;
            submitBtn.textContent = `Analyze ${this.parsedData.length} Profiles`;
            submitBtn.classList.remove('bg-gray-400');
            submitBtn.classList.add('bg-gradient-to-r', 'from-orange-500', 'to-red-600');
        }
    }

    async processBulkAnalysis() {
        try {
            const analysisType = document.querySelector('input[name="bulkAnalysisType"]:checked')?.value || this.analysisType || 'light';
            const businessId = this.stateManager?.getState('selectedBusiness')?.id;
            
            if (!businessId) {
                this.showValidationError('No business profile selected', 'Please select a business profile');
                return;
            }
            
            if (!this.parsedData || this.parsedData.length === 0) {
                this.showValidationError('No usernames', 'Please upload a CSV file with usernames');
                return;
            }
            
            console.log('📁 [BulkModal] Processing bulk analysis:', {
                analysisType,
                count: this.parsedData.length,
                usernames: this.parsedData,
                businessId
            });

            // Close modal properly using global ModalManager
            if (window.ModalManager) {
                window.ModalManager.closeModal('bulkModal');
            }

            // Get global analysis queue
            if (!window.AnalysisQueue) {
                throw new Error('Analysis queue not available');
            }
            
            // Convert usernames to lead objects format
            const leads = this.parsedData.map(username => ({
                username: username,
                platform: 'instagram'
            }));
            
            // Start bulk analysis
            await window.AnalysisQueue.startBulkAnalysis(
                leads,
                analysisType,
                businessId
            );
            
            // Emit event
            if (this.eventBus) {
                this.eventBus.emit('bulk:analysis-started', {
                    count: leads.length,
                    analysisType
                });
            }
            
            // Reset modal state for next use
            this.resetModal();
            
            console.log('✅ [BulkModal] Bulk analysis started successfully');
            
        } catch (error) {
            console.error('❌ [BulkModal] Bulk analysis processing error:', error);
            this.showValidationError('Processing failed', error.message);
        }
    }

    resetModal() {
        this.uploadedFile = null;
        this.parsedData = [];
        this.duplicateCount = 0;
        
        const csvFileEl = document.getElementById('csvFile');
        if (csvFileEl) csvFileEl.value = '';
        
        const dropPlaceholder = document.getElementById('drop-placeholder');
        const fileDisplay = document.getElementById('file-display');
        if (dropPlaceholder) dropPlaceholder.classList.remove('hidden');
        if (fileDisplay) fileDisplay.classList.add('hidden');
        
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) errorMessage.classList.add('hidden');
        
        this.hideValidationBars();
        
        const calculationEl = document.getElementById('credit-calculation');
        if (calculationEl) calculationEl.classList.add('hidden');
        
        const submitBtnEl = document.getElementById('bulk-submit-btn');
        if (submitBtnEl) {
            submitBtnEl.disabled = true;
            submitBtnEl.textContent = 'Upload File First';
            submitBtnEl.classList.remove('bg-gray-400');
            submitBtnEl.classList.add('bg-gradient-to-r', 'from-orange-500', 'to-red-600');
        }
        
        const lightRadio = document.querySelector('input[name="bulkAnalysisType"][value="light"]');
        if (lightRadio) {
            lightRadio.checked = true;
            this.analysisType = 'light';
        }
        
        document.querySelectorAll('.analysis-option').forEach(option => {
            option.classList.remove('border-orange-200', 'bg-orange-50', 'border-purple-200', 'bg-purple-50', 'border-blue-200', 'bg-blue-50');
            option.classList.add('border-gray-200');
        });
        
        const lightOption = document.querySelector('input[name="bulkAnalysisType"][value="light"]')?.closest('label').querySelector('.analysis-option');
        if (lightOption) {
            lightOption.classList.add('border-orange-200', 'bg-orange-50');
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BulkModal;
} else {
    window.BulkModal = BulkModal;
}

console.log('📁 [BulkModal] Migrated version loaded successfully');
