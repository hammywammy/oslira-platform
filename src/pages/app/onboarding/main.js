// DEMO MODE - Minimal onboarding loader
console.log('Onboarding loading...');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnboarding);
} else {
    initOnboarding();
}

function initOnboarding() {
    console.log('Onboarding initialized');
    
    const loader = document.getElementById('app-loader');
    if (loader) loader.style.display = 'none';
    
    document.body.style.visibility = 'visible';
    
    console.log('✅ Onboarding ready');
}
