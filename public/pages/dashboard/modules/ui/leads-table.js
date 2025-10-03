//public/pages/dashboard/modules/ui/leads-table.js

class LeadsTable {
    constructor(container) {
        this.container = container;
        this.eventBus = container.get('eventBus');
        this.leadRenderer = container.get('leadRenderer');
    }

renderTableContainer() {
    return `
<!-- Recent Lead Research - Full Width -->
<div class="mb-8">
    <div class="glass-white rounded-2xl overflow-hidden">
        <!-- Table Header -->
        <div class="p-6 pb-4 border-b border-gray-100">
<div class="flex items-center justify-between mb-4">
    <div>
        <h3 class="text-lg font-bold text-gray-800">Recent Lead Research</h3>
        <p class="text-sm text-gray-500 mt-1">Individual leads with AI-generated scores and status</p>
    </div>
    
    <!-- Manual Refresh Button -->
    <button 
        id="manual-refresh-btn" 
        onclick="window.refreshLeadsTable && window.refreshLeadsTable()"
        class="group relative p-2 bg-transparent hover:bg-gray-50 rounded-lg transition-all duration-300 hover:shadow-sm border border-transparent hover:border-gray-200"
        title="Refresh table"
    >
        <svg id="refresh-icon" class="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
    </button>
</div>

<!-- Filter Bar Below Header -->
<div class="flex items-center space-x-3 pt-2">
    <!-- Bulk Actions (Hidden by default, takes left space when shown) -->
    <div id="bulk-actions-bar" class="hidden flex items-center space-x-2 flex-shrink-0" style="transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);">
    <button id="delete-selected-btn" onclick="window.deleteSelectedLeads()" 
            class="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
        Delete
    </button>
                    
    <!-- Copy Dropdown -->
    <div class="relative">
        <button id="copy-dropdown-btn" onclick="window.toggleCopyDropdown()" 
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1">
            <span>Copy</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
        </button>
        <div id="copy-dropdown" class="hidden absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button onclick="window.copySelectedAsFormat('csv')" class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
                Copy as CSV
            </button>
            <button onclick="window.copySelectedAsFormat('json')" class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg">
                Copy as JSON
            </button>
        </div>
    </div>
    
    <!-- Export Dropdown -->
    <div class="relative">
        <button id="export-dropdown-btn" onclick="window.toggleExportDropdown()" 
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1">
            <span>Export</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
        </button>
        <div id="export-dropdown" class="hidden absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button onclick="window.exportSelectedAsFormat('csv')" class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
                Export as CSV
            </button>
            <button onclick="window.exportSelectedAsFormat('json')" class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg">
                Export as JSON
            </button>
        </div>
    </div>
</div>
                
<!-- Right-side Filters - Always stay right -->
    <div class="flex items-center space-x-3" style="margin-left: auto;">
                    <!-- Platform Filter -->
                    <select id="platform-filter" class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="all">All Platforms</option>
                        <option value="instagram">Instagram</option>
                    </select>
                    <!-- Sort Dropdown -->
                    <select id="sort-filter" class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="date-desc">Recent (newest first)</option>
                        <option value="date-asc">Recent (oldest first)</option>
                        <option value="score-desc">Score (high to low)</option>
                        <option value="score-asc">Score (low → high)</option>
                        <option value="followers-desc">Followers (high → low)</option>
                        <option value="followers-asc">Followers (low → high)</option>
                        <option value="name-asc">Name (A → Z)</option>
                        <option value="name-desc">Name (Z → A)</option>
                    </select>
                </div>
            </div>
        </div>
        
        <!-- Table Content -->
        <div class="leads-table-container overflow-x-auto">
             <!-- Table will be dynamically created by lead-renderer.js -->
        </div>
        
        <!-- Table Footer with Pagination -->
        <div class="p-4 border-t border-gray-100 bg-gray-50/50">
            <div class="flex items-center justify-between">
                <p class="text-sm text-gray-600">
                    Showing <span class="font-medium" id="pagination-start">1-10</span> of <span class="font-medium" id="pagination-total">85</span> leads
                </p>
                <div class="flex items-center space-x-2" id="pagination-controls">
                    <!-- Pagination buttons will be rendered here -->
                </div>
            </div>
        </div>
    </div>
</div>`;
}


updatePagination(start, end, total) {
    const startEl = document.getElementById('pagination-start');
    const totalEl = document.getElementById('pagination-total');
    
    if (startEl) startEl.textContent = `${start}-${end}`;
    if (totalEl) totalEl.textContent = total;
}

setupFilterHandlers() {
    const stateManager = this.container.get('stateManager');
    const leadRenderer = this.container.get('leadRenderer');
    
    // Platform filter handler
    const platformFilter = document.getElementById('platform-filter');
    if (platformFilter) {
        platformFilter.addEventListener('change', (e) => {
            const platformValue = e.target.value.toLowerCase();
            const platform = platformValue === 'all platforms' ? 'all' : platformValue;
            
            console.log('🔍 [LeadsTable] Platform filter changed:', platform);
            
            // Get current leads
            const allLeads = stateManager.getState('leads') || [];
            
            // Apply platform filter
            const filteredLeads = platform === 'all' 
                ? allLeads 
                : allLeads.filter(lead => (lead.platform || '').toLowerCase() === platform);
            
            // Store filtered leads
            stateManager.setState('filteredLeads', filteredLeads);
            
            // Apply current sort if exists
            const sortValue = document.getElementById('sort-filter')?.value;
            if (sortValue) {
                this.applySorting(filteredLeads, sortValue);
            } else {
                // Display filtered leads
                leadRenderer.displayLeads(filteredLeads);
            }
            
            console.log(`✅ [LeadsTable] Platform filter applied: ${filteredLeads.length} leads`);
        });
    }
    
    // Sort filter handler
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            const sortValue = e.target.value;
            console.log('🔽 [LeadsTable] Sort changed:', sortValue);
            
            // Get currently filtered leads or all leads
            const leads = stateManager.getState('filteredLeads') || stateManager.getState('leads') || [];
            
            this.applySorting(leads, sortValue);
        });
    }
    
    console.log('✅ [LeadsTable] Filter handlers attached');
}

applySorting(leads, sortValue) {
    const leadRenderer = this.container.get('leadRenderer');
    const stateManager = this.container.get('stateManager');
    
    const [sortBy, sortOrder] = sortValue.split('-');
    let sortedLeads = [...leads];
    
    switch (sortBy) {
        case 'date':
            sortedLeads = leadRenderer.sortLeads(sortedLeads, 'date', sortOrder);
            break;
        case 'score':
            sortedLeads = leadRenderer.sortLeads(sortedLeads, 'score', sortOrder);
            break;
        case 'followers':
            sortedLeads = leadRenderer.sortLeads(sortedLeads, 'followers', sortOrder);
            break;
        case 'name':
            sortedLeads = leadRenderer.sortLeads(sortedLeads, 'username', sortOrder);
            break;
        default:
            console.warn('Unknown sort type:', sortBy);
            sortedLeads = leads;
    }
    
    // Update state with sorted leads
    stateManager.setState('filteredLeads', sortedLeads);
    
    // Display sorted leads
    leadRenderer.displayLeads(sortedLeads);
    
    console.log(`✅ [LeadsTable] Sort applied: ${sortBy} (${sortOrder})`);
}

setupEventHandlers() {

    window.toggleToolbarCopyDropdown = () => {
    const dropdown = document.getElementById('toolbar-copy-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
    const exportDropdown = document.getElementById('toolbar-export-dropdown');
    if (exportDropdown) exportDropdown.classList.add('hidden');
};

window.toggleToolbarExportDropdown = () => {
    const dropdown = document.getElementById('toolbar-export-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
    const copyDropdown = document.getElementById('toolbar-copy-dropdown');
    if (copyDropdown) copyDropdown.classList.add('hidden');
};

window.clearToolbarSelections = () => {
    const stateManager = this.container.get('stateManager');
    stateManager.setState('selectedLeads', new Set());
    
    document.querySelectorAll('.lead-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    this.updateBulkActionsBar(0);
    this.updateBulkActionsToolbar(0);
    this.updateSelectAllCheckbox();
};
        // Export dropdown handlers
        window.toggleExportDropdown = () => {
            const dropdown = document.getElementById('exportDropdown');
            if (dropdown) {
                this.isExportDropdownOpen = !this.isExportDropdownOpen;
                if (this.isExportDropdownOpen) {
                    dropdown.classList.remove('hidden');
                } else {
                    dropdown.classList.add('hidden');
                }
            }
        };

        window.closeExportDropdown = () => {
            const dropdown = document.getElementById('exportDropdown');
            if (dropdown) {
                dropdown.classList.add('hidden');
                this.isExportDropdownOpen = false;
            }
        };

        // Export data handlers
        window.exportData = (type) => {
            console.log(`📊 Exporting data: ${type}`);
            
            let dataToExport = [];
            const allLeads = this.stateManager.getState('leads') || [];
            const filteredLeads = this.stateManager.getState('filteredLeads') || [];
            const selectedLeads = this.stateManager.getState('selectedLeads') || new Set();

            switch (type) {
                case 'visible':
                    dataToExport = filteredLeads.length > 0 ? filteredLeads : allLeads;
                    break;
                case 'selected':
                    dataToExport = allLeads.filter(lead => selectedLeads.has(lead.id));
                    break;
                case 'all':
                    dataToExport = allLeads;
                    break;
                default:
                    console.warn('Unknown export type:', type);
                    return;
            }

            this.downloadCSV(dataToExport, type);
        };

        window.scheduleReport = () => {
            console.log('📅 Opening scheduled report settings...');
            // TODO: Implement scheduled report modal
            alert('Scheduled reports feature coming soon!');
        };

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('exportDropdown');
            const button = e.target.closest('[onclick*="toggleExportDropdown"]');
            
            if (dropdown && !button && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
                this.isExportDropdownOpen = false;
            }
        });

    // Close toolbar dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#toolbar-copy-btn') && !e.target.closest('#toolbar-copy-dropdown')) {
        const toolbarCopyDropdown = document.getElementById('toolbar-copy-dropdown');
        if (toolbarCopyDropdown) toolbarCopyDropdown.classList.add('hidden');
    }
    if (!e.target.closest('#toolbar-export-btn') && !e.target.closest('#toolbar-export-dropdown')) {
        const toolbarExportDropdown = document.getElementById('toolbar-export-dropdown');
        if (toolbarExportDropdown) toolbarExportDropdown.classList.add('hidden');
    }
});
    }

    downloadCSV(leads, type) {
        if (!leads || leads.length === 0) {
            alert('No data to export');
            return;
        }

        // Define CSV headers
        const headers = [
            'Username',
            'Full Name',
            'Platform',
            'Followers Count',
            'Following Count',
            'Posts Count',
            'Overall Score',
            'Niche Fit Score',
            'Engagement Score',
            'Analysis Type',
            'Bio',
            'External URL',
            'Is Verified',
            'Is Business Account',
            'Profile URL',
            'Date Added',
            'Summary'
        ];

        // Convert leads to CSV rows
        const csvRows = leads.map(lead => [
            this.escapeCSV(lead.username || ''),
            this.escapeCSV(lead.full_name || lead.display_name || ''),
            this.escapeCSV(lead.platform || ''),
            lead.followers_count || lead.follower_count || 0,
            lead.following_count || 0,
            lead.posts_count || lead.post_count || 0,
            lead.score || lead.overall_score || 0,
            lead.niche_fit_score || 0,
            lead.engagement_score || 0,
            this.escapeCSV(lead.analysis_type || ''),
            this.escapeCSV(lead.bio || lead.bio_text || ''),
            this.escapeCSV(lead.external_url || lead.external_website_url || ''),
            lead.is_verified || lead.is_verified_account || false,
            lead.is_business_account || false,
            this.escapeCSV(lead.profile_url || ''),
            this.formatDate(lead.created_at || lead.first_discovered_at),
            this.escapeCSV(lead.quick_summary || lead.summary_text || '')
        ]);

        // Combine headers and rows
        const csvContent = [headers, ...csvRows]
            .map(row => row.join(','))
            .join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `leads-export-${type}-${timestamp}.csv`;
            link.setAttribute('download', filename);
            
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`✅ [LeadsTable] Exported ${leads.length} leads as ${filename}`);
            
            // Show success notification
            this.showExportNotification(leads.length, type);
        } else {
            console.error('❌ [LeadsTable] CSV download not supported');
            alert('CSV download not supported in this browser');
        }
    }

    escapeCSV(value) {
        if (typeof value !== 'string') return value;
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes('"') || value.includes(',') || value.includes('\n')) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 10); // YYYY-MM-DD format
        } catch (error) {
            return dateString;
        }
    }

    showExportNotification(count, type) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-feather="check-circle" class="w-5 h-5"></i>
                <span>Exported ${count} leads (${type})</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Initialize feather icons for the notification
        if (window.feather) {
            window.feather.replace();
        }

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    setupSelectionHandlers() {
    const stateManager = this.container.get('stateManager');
    const leadRenderer = this.container.get('leadRenderer');
    const leadManager = this.container.get('leadManager');
    
window.toggleLeadSelection = (leadId, isChecked) => {
    const selectedLeads = new Set(stateManager.getState('selectedLeads') || new Set());
    
    if (isChecked) {
        selectedLeads.add(leadId);
    } else {
        selectedLeads.delete(leadId);
    }
    
    stateManager.setState('selectedLeads', selectedLeads);
    this.updateBulkActionsBar(selectedLeads.size);
    this.updateSelectAllCheckbox();
    
    console.log(`✅ [LeadsTable] Lead ${leadId} ${isChecked ? 'selected' : 'deselected'}. Total: ${selectedLeads.size}`);
};
    
    // Toggle all leads selection
    window.toggleAllLeadSelections = (isChecked) => {
        const leads = stateManager.getState('filteredLeads') || stateManager.getState('leads') || [];
        const selectedLeads = new Set();
        
        if (isChecked) {
            leads.forEach(lead => selectedLeads.add(lead.id));
        }
        
        // Update all checkboxes
        document.querySelectorAll('.lead-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        
        stateManager.setState('selectedLeads', selectedLeads);
        this.updateBulkActionsBar(selectedLeads.size);
        
        console.log(`✅ [LeadsTable] ${isChecked ? 'Selected' : 'Deselected'} all leads. Total: ${selectedLeads.size}`);
    };
    
    // Delete selected leads
    window.deleteSelectedLeads = async () => {
        const selectedLeads = stateManager.getState('selectedLeads') || new Set();
        
        if (selectedLeads.size === 0) {
            alert('No leads selected');
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to delete ${selectedLeads.size} lead(s)? This action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            const deleteBtn = document.getElementById('delete-selected-btn');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.textContent = 'Deleting...';
            }
            
            await leadManager.bulkDeleteLeads(Array.from(selectedLeads));
            
            // Clear selection and hide bulk actions
            stateManager.setState('selectedLeads', new Set());
            this.updateBulkActionsBar(0);
            this.updateSelectAllCheckbox();
            
            // Refresh leads display
            leadRenderer.displayLeads();
            
            alert(`Successfully deleted ${selectedLeads.size} lead(s)`);
            
        } catch (error) {
            console.error('❌ [LeadsTable] Delete failed:', error);
            alert(`Failed to delete leads: ${error.message}`);
        } finally {
            const deleteBtn = document.getElementById('delete-selected-btn');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.textContent = 'Delete';
            }
        }
    };
    
    // Copy/Export handlers
    window.toggleCopyDropdown = () => {
        const dropdown = document.getElementById('copy-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
        // Close export dropdown if open
        const exportDropdown = document.getElementById('export-dropdown');
        if (exportDropdown) exportDropdown.classList.add('hidden');
    };
    
    window.toggleExportDropdown = () => {
        const dropdown = document.getElementById('export-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
        // Close copy dropdown if open
        const copyDropdown = document.getElementById('copy-dropdown');
        if (copyDropdown) copyDropdown.classList.add('hidden');
    };
    
    window.copySelectedAsFormat = (format) => {
        const selectedLeads = this.getSelectedLeadsData();
        if (selectedLeads.length === 0) {
            alert('No leads selected');
            return;
        }
        
        let content = '';
        if (format === 'csv') {
            content = this.convertToCSV(selectedLeads);
        } else if (format === 'json') {
            content = JSON.stringify(selectedLeads, null, 2);
        }
        
        navigator.clipboard.writeText(content).then(() => {
            alert(`Copied ${selectedLeads.length} lead(s) as ${format.toUpperCase()}`);
            document.getElementById('copy-dropdown').classList.add('hidden');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    };
    
    window.exportSelectedAsFormat = (format) => {
        const selectedLeads = this.getSelectedLeadsData();
        if (selectedLeads.length === 0) {
            alert('No leads selected');
            return;
        }
        
        if (format === 'csv') {
            this.downloadCSV(selectedLeads, 'selected');
        } else if (format === 'json') {
            this.downloadJSON(selectedLeads);
        }
        
        document.getElementById('export-dropdown').classList.add('hidden');
    };
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#copy-dropdown-btn') && !e.target.closest('#copy-dropdown')) {
            const copyDropdown = document.getElementById('copy-dropdown');
            if (copyDropdown) copyDropdown.classList.add('hidden');
        }
        if (!e.target.closest('#export-dropdown-btn') && !e.target.closest('#export-dropdown')) {
            const exportDropdown = document.getElementById('export-dropdown');
            if (exportDropdown) exportDropdown.classList.add('hidden');
        }
    });
    
    console.log('✅ [LeadsTable] Selection handlers attached');
}

updateBulkActionsBar(count) {
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    
    if (!bulkActionsBar) return;
    
    // Clear any pending hide timeout
    if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
    }
    
if (count > 0) {
        bulkActionsBar.classList.remove('hidden');
        this.updateBulkActionsToolbar(count); // Add this line
        bulkActionsBar.style.opacity = '0';
        bulkActionsBar.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            bulkActionsBar.style.opacity = '1';
            bulkActionsBar.style.transform = 'translateY(0)';
        });
    } else {
        bulkActionsBar.style.opacity = '0';
        bulkActionsBar.style.transform = 'translateY(10px)';
        
this.hideTimeout = setTimeout(() => {
            bulkActionsBar.classList.add('hidden');
            this.updateBulkActionsToolbar(0); // Add this line
            this.hideTimeout = null;
        }, 500);
    }
}

updateBulkActionsToolbar(count) {
    const toolbar = document.getElementById('bulk-actions-toolbar');
    const selectionCount = document.getElementById('selection-count');
    
    if (!toolbar) return;
    
    if (count > 0) {
        toolbar.classList.remove('hidden');
        if (selectionCount) {
            selectionCount.textContent = `${count} selected`;
        }
    } else {
        toolbar.classList.add('hidden');
    }
}

updateSelectAllCheckbox() {
    const stateManager = this.container.get('stateManager');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (!selectAllCheckbox) return;
    
    const leads = stateManager.getState('filteredLeads') || stateManager.getState('leads') || [];
    const selectedLeads = stateManager.getState('selectedLeads') || new Set();
    
    if (leads.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedLeads.size === leads.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedLeads.size > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

getSelectedLeadsData() {
    const stateManager = this.container.get('stateManager');
    const selectedLeads = stateManager.getState('selectedLeads') || new Set();
    const allLeads = stateManager.getState('leads') || [];
    
    return allLeads.filter(lead => selectedLeads.has(lead.id));
}

convertToCSV(leads) {
    const headers = ['Username', 'Full Name', 'Platform', 'Score', 'Followers', 'Analysis Type', 'Date Added'];
    const rows = leads.map(lead => [
        lead.username || '',
        lead.full_name || lead.display_name || '',
        lead.platform || 'instagram',
        lead.score || 0,
        lead.followers_count || lead.follower_count || 0,
        lead.analysis_type || '',
        this.formatDate(lead.created_at || lead.first_discovered_at)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

downloadJSON(leads) {
    const jsonContent = JSON.stringify(leads, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads-export-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
}
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeadsTable;
} else {
    window.LeadsTable = LeadsTable;
}
