//public/pages/dashboard/modules/modals/research-modal.js

class ResearchModal {
    constructor(container) {
        this.container = container;
        this.modalManager = container.get('modalManager');
        this.analysisFunctions = container.get('analysisFunctions');
    }

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
                    <option>LinkedIn</option>
                    <option>Twitter</option>
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

    setupEventHandlers() {
        window.openResearchModal = () => {
            const modal = document.getElementById('researchModal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        };

        window.closeResearchModal = () => {
            const modal = document.getElementById('researchModal');
            if (modal) {
                modal.classList.add('hidden');
            }
        };

        window.submitResearch = () => {
            const modal = document.getElementById('researchModal');
            const form = modal?.querySelector('form') || modal;
            
            // Get form data
            const platform = form.querySelector('select').value;
            const username = form.querySelector('input[type="text"]').value;
            const analysisType = form.querySelector('input[name="analysis"]:checked').value;
            
            // Delegate to analysis functions
            if (this.analysisFunctions) {
                this.analysisFunctions.submitSingleAnalysis({
                    platform,
                    username,
                    analysisType
                });
            }
            
            this.closeResearchModal();
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResearchModal;
} else {
    window.ResearchModal = ResearchModal;
}
