// =============================================================================
// BULK UPLOAD MODULE - Dashboard Component
// =============================================================================

/**
 * Bulk Upload Handler
 * Manages bulk Instagram username analysis functionality
 */
class BulkUpload {
    constructor() {
        this.uploadedUsernames = [];
        this.maxUsernames = 100;
        this.isProcessing = false;
        console.log('📁 [BulkUpload] Initialized');
    }

    init() {
        this.setupEventListeners();
        console.log('✅ [BulkUpload] Event listeners setup');
    }

    setupEventListeners() {
        // File upload handler
        const fileInput = document.getElementById('csv-file');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files[0]);
            });
        }

        // Manual text input handler
        const textInput = document.getElementById('manual-usernames');
        if (textInput) {
            textInput.addEventListener('input', (e) => {
                this.handleManualInput(e.target.value);
            });
        }

        // Form submission
        const bulkForm = document.getElementById('bulkForm');
        if (bulkForm) {
            bulkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBulkSubmission();
            });
        }
    }

    async handleFileUpload(file) {
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            this.showError('Please select a valid CSV file');
            return;
        }

        try {
            const text = await this.readFileAsText(file);
            const usernames = this.parseCsvUsernames(text);
            this.displayUploadedUsernames(usernames);
        } catch (error) {
            console.error('❌ [BulkUpload] File upload failed:', error);
            this.showError('Failed to read file. Please try again.');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    parseCsvUsernames(csvText) {
        const lines = csvText.split('\n');
        const usernames = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                // Extract username (handle @ symbols)
                const username = trimmed.replace(/[@,]/g, '').trim();
                if (username && !usernames.includes(username)) {
                    usernames.push(username);
                }
            }
        });

        return usernames.slice(0, this.maxUsernames);
    }

    handleManualInput(text) {
        const usernames = text.split(/[\n,]/)
            .map(u => u.trim().replace('@', ''))
            .filter(u => u.length > 0);
        
        this.displayUploadedUsernames(usernames.slice(0, this.maxUsernames));
    }

    displayUploadedUsernames(usernames) {
        this.uploadedUsernames = usernames;
        const display = document.getElementById('file-display');
        const submitBtn = document.getElementById('bulk-submit-btn');

        if (!display) return;

        if (usernames.length === 0) {
            display.innerHTML = '<p class="text-gray-500">No valid usernames found</p>';
            if (submitBtn) submitBtn.disabled = true;
            return;
        }

        const countText = usernames.length === 1 ? '1 username' : `${usernames.length} usernames`;
        
        display.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-green-800">Ready for Analysis</h3>
                        <p class="text-sm text-green-700 mt-1">${countText} loaded successfully</p>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="text-sm text-green-700">
                        <strong>Preview:</strong> ${usernames.slice(0, 5).join(', ')}
                        ${usernames.length > 5 ? ` and ${usernames.length - 5} more...` : ''}
                    </div>
                </div>
            </div>
        `;

        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    async handleBulkSubmission() {
        if (this.isProcessing || this.uploadedUsernames.length === 0) return;

        const businessId = document.getElementById('bulk-business-select')?.value;
        if (!businessId) {
            this.showError('Please select a business profile');
            return;
        }

        try {
            this.isProcessing = true;
            this.setSubmitButtonLoading(true);

            await this.processBulkAnalysis(this.uploadedUsernames, businessId);

            // Close modal on success
            if (window.dashboard?.closeModal) {
                window.dashboard.closeModal('bulkModal');
            }

            this.showSuccess(`Started analysis for ${this.uploadedUsernames.length} profiles`);

        } catch (error) {
            console.error('❌ [BulkUpload] Bulk analysis failed:', error);
            this.showError(error.message || 'Bulk analysis failed. Please try again.');
        } finally {
            this.isProcessing = false;
            this.setSubmitButtonLoading(false);
        }
    }

    async processBulkAnalysis(usernames, businessId) {
        console.log('📁 [BulkUpload] Processing bulk analysis:', { count: usernames.length, businessId });
        
        // This would integrate with the main dashboard analysis system
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Trigger dashboard refresh
        if (window.dashboard?._app?.refreshLeads) {
            await window.dashboard._app.refreshLeads();
        }
    }

    setSubmitButtonLoading(isLoading) {
        const button = document.getElementById('bulk-submit-btn');
        if (!button) return;

        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.textContent = 'Processing...';
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || 'Start Bulk Analysis';
            button.disabled = this.uploadedUsernames.length === 0;
        }
    }

    showError(message) {
        if (window.Alert?.error) {
            window.Alert.error(message);
        } else {
            console.error('❌ [BulkUpload]', message);
        }
    }

    showSuccess(message) {
        if (window.Alert?.success) {
            window.Alert.success(message);
        } else {
            console.log('✅ [BulkUpload]', message);
        }
    }

    reset() {
        this.uploadedUsernames = [];
        this.isProcessing = false;
        
        // Reset form
        const form = document.getElementById('bulkForm');
        if (form) form.reset();
        
        // Clear displays
        const display = document.getElementById('file-display');
        if (display) display.innerHTML = '';
        
        const submitBtn = document.getElementById('bulk-submit-btn');
        if (submitBtn) submitBtn.disabled = true;
    }
}

// Initialize if in dashboard context
if (typeof window !== 'undefined') {
    window.BulkUpload = BulkUpload;
    
    // Auto-initialize when dashboard loads
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('dashboard')) {
            const bulkUpload = new BulkUpload();
            bulkUpload.init();
        }
    });
}

console.log('📄 [BulkUpload] Module loaded');
