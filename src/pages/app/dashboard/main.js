// DEMO MODE - Minimal dashboard loader
console.log('Dashboard loading...');

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

function initDashboard() {
    console.log('Dashboard initialized');
    
    // Hide loader
    const loader = document.getElementById('app-loader');
    if (loader) loader.style.display = 'none';
    
    // Show body
    document.body.style.visibility = 'visible';
    
    // Set demo user
    const userEmail = document.getElementById('user-email');
    if (userEmail) userEmail.textContent = 'demo@oslira.com';
    
    const userName = document.getElementById('user-name');
    if (userName) userName.textContent = 'Demo User';
    
    console.log('✅ Dashboard ready');
}
