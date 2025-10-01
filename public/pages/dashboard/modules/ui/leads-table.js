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
        <div class="p-6 border-b border-gray-100">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">Recent Lead Research</h3>
                    <p class="text-sm text-gray-500 mt-1">Individual leads with AI-generated scores and status</p>
                </div>
                <div class="flex items-center space-x-3">
                    <!-- Filter Dropdown -->
                    <select id="platform-filter" class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option>All Platforms</option>
                        <option>LinkedIn</option>
                        <option>Instagram</option>
                        <option>Twitter</option>
                    </select>
                    <!-- Sort Dropdown -->
                    <select id="sort-filter" class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option>Sort by: Recent</option>
                        <option>Sort by: Score</option>
                        <option>Sort by: Name</option>
                        <option>Sort by: Followers</option>
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

setupEventHandlers() {
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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeadsTable;
} else {
    window.LeadsTable = LeadsTable;
}
