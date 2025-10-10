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
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden">
    <div class="flex items-center justify-center min-h-screen p-6">
        <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden">
            
            <!-- Header -->
            <div class="p-8 pb-6">
                <div class="flex items-center justify-between mb-2">
                    <h2 class="text-2xl font-bold text-gray-900">Bulk Analysis</h2>
                    <button onclick="closeBulkModal()" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                        <span id="error-text" class="text-sm font-medium text-red-800"></span>
                    </div>
                </div>
                
                <!-- CSV Upload Section -->
                <div>
                    <label class="block text-sm font-medium text-gray-900 mb-3">Upload CSV File</label>
                    <div class="flex items-center space-x-4">
                        <!-- Example CSV -->
                        <div class="flex-1">
                            <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div id="csv-label" class="text-xs font-medium text-gray-700 mb-2">Example CSV format:</div>
                                <div id="csv-example" class="bg-white border border-gray-100 rounded-lg p-3 text-sm font-mono text-gray-600 max-h-32 overflow-y-auto">
                                    <div>nasa</div>
                                    <div>instagram</div>
                                    <div>hormozi</div>
                                </div>
                                <div class="text-xs text-gray-500 mt-2">Just usernames, no column headers, no @ symbols</div>
                            </div>
                        </div>
                        
                        <!-- Upload Area -->
                        <div class="flex-1">
                            <div id="drop-zone" class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer">
                                <input type="file" id="csvFile" accept=".csv" onchange="handleFileUpload(event)" class="hidden">
                                <div id="drop-placeholder" onclick="document.getElementById('csvFile').click()">
                                    <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                    </svg>
                                    <div class="text-sm font-medium text-gray-700">Drop CSV here</div>
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
                                        <button onclick="removeUploadedFile(event)" class="p-1 hover:bg-gray-100 rounded-full transition-colors" title="Remove file">
                                            <svg class="w-4 h-4 text-gray-500 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <div id="file-stats" class="text-xs text-gray-600 mt-1"></div>
                                </div>
                            </div>
                            
                            <!-- Validation Feedback Bars -->
                            <div id="validation-success" class="hidden mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <div>
                                        <div id="success-message" class="text-sm font-medium text-green-800"></div>
                                        <div id="success-details" class="text-xs text-green-600 mt-1"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="validation-error" class="hidden mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
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
                        </div>
                    </div>
                </div>

                <!-- Analysis Type -->
                <div>
                    <label class="block text-sm font-medium text-gray-900 mb-3">Analysis Type</label>
                    <div class="grid grid-cols-3 gap-3">
                        <label class="relative cursor-pointer">
                            <input type="radio" name="bulkAnalysisType" value="light" checked onchange="updateBulkCostCalculation()" class="sr-only">
                            <div class="analysis-option border-2 border-orange-200 bg-orange-50 rounded-xl p-4 text-center hover:border-orange-300 transition-all">
                                <div class="text-2xl mb-2">⚡</div>
                                <div class="font-semibold text-sm text-gray-900">Light</div>
                                <div class="text-xs text-gray-600">1 credit</div>
                            </div>
                        </label>
                        <label class="relative cursor-pointer">
                            <input type="radio" name="bulkAnalysisType" value="deep" onchange="updateBulkCostCalculation()" class="sr-only">
                            <div class="analysis-option border-2 border-gray-200 rounded-xl p-4 text-center hover:border-purple-300 hover:bg-purple-50 transition-all">
                                <div class="text-2xl mb-2">🔍</div>
                                <div class="font-semibold text-sm text-gray-900">Deep</div>
                                <div class="text-xs text-gray-600">2 credits</div>
                            </div>
                        </label>
                        <label class="relative cursor-pointer">
                            <input type="radio" name="bulkAnalysisType" value="xray" onchange="updateBulkCostCalculation()" class="sr-only">
                            <div class="analysis-option border-2 border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 hover:bg-blue-50 transition-all">
                                <div class="text-2xl mb-2">🎯</div>
                                <div class="font-semibold text-sm text-gray-900">X-Ray</div>
                                <div class="text-xs text-gray-600">3 credits</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Platform -->
                <div>
                    <label class="block text-sm font-medium text-gray-900 mb-3">Platform</label>
                    <div class="relative flex items-center px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" 
                             alt="Instagram" 
                             class="w-6 h-6 mr-3 rounded">
                        <span class="text-gray-900 font-medium">Instagram</span>
                        <span class="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Default</span>
                    </div>
                </div>

                <!-- Credit Calculation -->
                <div id="credit-calculation" class="hidden">
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div class="flex items-center justify-between mb-3">
                            <span class="font-semibold text-gray-700">Cost Calculation</span>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                    <span id="leads-display"></span> leads
                                </span>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Current Credits:</span>
                                <span id="current-credits" class="font-semibold text-gray-900"></span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Total Cost:</span>
                                <span id="total-cost" class="font-semibold text-red-600"></span>
                            </div>
                            <div class="border-t border-blue-200 pt-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm font-medium text-gray-700">Credits After:</span>
                                    <span id="credits-after" class="font-semibold"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="pt-4">
                    <button id="bulk-submit-btn" onclick="submitBulkAnalysis(event)" disabled
                            class="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Upload File First
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>`;
    }

    setupEventHandlers() {
        const self = this;
        
        // File upload handler
        window.handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (file && file.type === 'text/csv') {
                self.uploadedFile = file;
                self.parseCSVFile(file);
            } else {
                self.showError('Please select a valid CSV file');
            }
        };

        // Analysis type change with visual feedback
        window.updateBulkCostCalculation = () => {
            const selectedRadio = document.querySelector('input[name="bulkAnalysisType"]:checked');
            if (selectedRadio) {
                self.analysisType = selectedRadio.value;
                
                // Update visual selection
                document.querySelectorAll('.analysis-option').forEach(option => {
                    option.classList.remove('border-orange-200', 'bg-orange-50', 'border-purple-200', 'bg-purple-50', 'border-blue-200', 'bg-blue-50');
                    option.classList.add('border-gray-200');
                });
                
                const selectedOption = selectedRadio.closest('label').querySelector('.analysis-option');
                if (self.analysisType === 'light') {
                    selectedOption.classList.add('border-orange-200', 'bg-orange-50');
                } else if (self.analysisType === 'deep') {
                    selectedOption.classList.add('border-purple-200', 'bg-purple-50');
                } else if (self.analysisType === 'xray') {
                    selectedOption.classList.add('border-blue-200', 'bg-blue-50');
                }
                
                self.updateCostDisplay();
            }
        };

        // Modal controls - use global ModalManager
        window.openBulkModal = () => {
            console.log('🔘 [BulkModal] Global openBulkModal called');
            if (window.ModalManager) {
                window.ModalManager.openModal('bulkModal');
            } else {
                console.error('❌ ModalManager not available');
            }
        };

        window.closeBulkModal = () => {
            console.log('🔘 [BulkModal] Global closeBulkModal called');
            if (window.ModalManager) {
                window.ModalManager.closeModal('bulkModal');
            } else {
                // Fallback
                const modal = document.getElementById('bulkModal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
            }
        };

        window.submitBulkAnalysis = (event) => {
            event.preventDefault();
            self.processBulkAnalysis();
        };

        // File removal handler
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
