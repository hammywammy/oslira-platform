// =============================================================================
// SUBSCRIPTION PAGE - WITH CONFIG WAIT
// =============================================================================

let subscriptionState = {
    currentUser: null,
    currentSession: null,
    currentPlan: 'free',
    isLoading: false,
    stripe: null,
    supabase: null,
    config: null
};

// =============================================================================
// INITIALIZATION
// =============================================================================

console.log('📦 [Subscription] Module loaded');

window.addEventListener('oslira:timing:ready', () => {
    console.log('✅ [Subscription] Dependencies ready, initializing...');
    initializeSubscriptionPage();
});

async function initializeSubscriptionPage() {
    try {
        console.log('🔧 [Subscription] Starting initialization...');
        
        // CRITICAL: Wait for config to be loaded
        console.log('⏳ [Subscription] Waiting for config to be ready...');
        await window.OsliraEnv.ready();
        console.log('✅ [Subscription] Config ready, proceeding with initialization');
        
        // Get authenticated user from auth-manager
        if (!window.OsliraAuth?.user) {
            console.error('❌ [Subscription] No authenticated user');
            window.location.href = '/auth';
            return;
        }
        
        // Set user and supabase in subscription state
        subscriptionState.currentUser = window.OsliraAuth.user;
        subscriptionState.currentSession = window.OsliraAuth.session;
        subscriptionState.supabase = window.OsliraAuth.supabase;
        subscriptionState.config = window.OsliraConfig;
        
        console.log('👤 [Subscription] User loaded:', subscriptionState.currentUser.email);
        
        const actualConfig = await window.OsliraConfig.getConfig();
        
        if (actualConfig?.stripePublishableKey && typeof Stripe !== 'undefined') {
            subscriptionState.stripe = Stripe(actualConfig.stripePublishableKey);
            console.log('✅ [Subscription] Stripe initialized');
        } else if (!actualConfig?.stripePublishableKey) {
            console.error('❌ [Subscription] Missing Stripe publishable key');
        } else if (typeof Stripe === 'undefined') {
            console.error('❌ [Subscription] Stripe.js not loaded');
        }
        
        console.log('✅ [Subscription] Initialized:', subscriptionState.currentUser.email);
        
        setupAuthStateMonitoring();
        await loadSubscriptionData();
        setupEventListeners();
        await initializeSidebar();
        
    } catch (error) {
        console.error('❌ [Subscription] Initialization failed:', error);
        showErrorState('Failed to load subscription page. Please email support@oslira.com');
    }
}

async function initializeSidebar() {
    try {
        console.log('📋 [Subscription] Initializing sidebar...');
        
        let attempts = 0;
        while (!window.sidebarManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.sidebarManager) {
            await window.sidebarManager.render('#sidebar-container');
            console.log('✅ [Subscription] Sidebar initialized');
        }
        
    } catch (error) {
        console.error('❌ [Subscription] Sidebar failed:', error);
    }
}

// =============================================================================
// DATA LOADING
// =============================================================================

async function loadSubscriptionData() {
    console.log('📊 [Subscription] Loading subscription data...');
    
    if (!subscriptionState.currentUser) {
        console.error('❌ [Subscription] No user found');
        return;
    }
    
    try {
        showLoading();
        
        const { data: profile, error: profileError } = await subscriptionState.supabase
            .from('users')
            .select('*, credits_used_current_period, subscription_id')
            .eq('id', subscriptionState.currentUser.id)
            .single();
        
        if (profileError) throw profileError;
        
        let subscription = null;
        if (profile.subscription_id) {
            const { data: subData, error: subError } = await subscriptionState.supabase
                .from('subscriptions')
                .select('*')
                .eq('id', profile.subscription_id)
                .single();
            
            if (subError) {
                console.error('❌ [Subscription] Subscription fetch error:', subError);
            } else {
                subscription = subData;
            }
        }
        
        let currentPlan = 'free';
        if (subscription && subscription.status === 'active') {
            currentPlan = subscription.plan?.toLowerCase() || 'free';
        }
        
        subscriptionState.currentPlan = currentPlan;
        
        console.log('📊 [Subscription] Loaded data:', {
            plan: currentPlan,
            subscription: subscription,
            creditsUsed: profile.credits_used
        });
        
        updateSubscriptionUI(profile, subscription);
        updatePricingCards(currentPlan);
        updateUsageOverview(profile, subscription, currentPlan);
        
        console.log('✅ [Subscription] Data loaded successfully');
        
    } catch (error) {
        console.error('❌ [Subscription] Data loading failed:', error);
        showErrorState('Failed to load subscription data');
    } finally {
        hideLoading();
    }
}

// =============================================================================
// UI UPDATES
// =============================================================================

function updateSubscriptionUI(profile, subscription) {
    console.log('🎨 [Subscription] Updating subscription UI...');
    
    const planInfo = {
        'free': { name: 'Free Plan', credits: '25', details: '25 monthly credits • Limited features' },
        'starter': { name: 'Starter Plan', credits: '100', details: '100 monthly credits • Basic features' },
        'professional': { name: 'Professional Plan', credits: '300', details: '300 monthly credits • Advanced features' },
        'agency': { name: 'Agency Plan', credits: '1000', details: '1000 monthly credits • Premium features' },
        'enterprise': { name: 'Enterprise Plan', credits: '5000+', details: '5000+ credits • All features' }
    };
    
    const currentPlanInfo = planInfo[subscriptionState.currentPlan] || planInfo['free'];
    
    const currentPlanElement = document.getElementById('current-plan');
    if (currentPlanElement) {
        currentPlanElement.textContent = subscription && subscription.status === 'active' 
            ? currentPlanInfo.name 
            : 'Plan Not Detected';
    }
    
    const nextBillingText = document.querySelector('#next-billing-date')?.parentElement?.previousElementSibling;
    if (subscription && subscription.status === 'active' && subscription.current_period_end) {
        const nextBilling = new Date(subscription.current_period_end);
        const nextBillingDate = document.getElementById('next-billing-date');
        if (nextBillingDate) {
            nextBillingDate.textContent = nextBilling.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } else {
        const nextBillingElement = document.querySelector('.flex.items-center.gap-6 p');
        if (nextBillingElement) {
            nextBillingElement.textContent = 'No active subscription';
        }
    }
    
    const sidebarPlanElement = document.getElementById('sidebar-plan');
    if (sidebarPlanElement) sidebarPlanElement.textContent = currentPlanInfo.name;
    
    const sidebarBillingElement = document.getElementById('sidebar-billing');
    if (subscription && subscription.status === 'active' && sidebarBillingElement) {
        const nextBilling = new Date(subscription.current_period_end);
        sidebarBillingElement.textContent = `Next billing: ${nextBilling.toLocaleDateString()}`;
    } else if (sidebarBillingElement) {
        sidebarBillingElement.textContent = 'Free plan - no billing';
    }
}

function updatePricingCards(currentPlan) {
    console.log('🎨 [Subscription] Updating pricing cards for plan:', currentPlan);
    
    const pricingCards = document.querySelectorAll('.pricing-card');
    if (pricingCards.length === 0) {
        console.warn('⚠️ [Subscription] No pricing cards found in DOM');
        return;
    }
    
    pricingCards.forEach(card => {
        const cardPlan = card.getAttribute('data-plan');
        const button = card.querySelector('.card-button');
        
        if (!button) {
            console.warn('⚠️ [Subscription] Card missing button:', cardPlan);
            return;
        }
        
        const existingBadge = card.querySelector('.current-badge');
        if (existingBadge) existingBadge.remove();
        
        card.classList.remove('current-plan-card');
        
        if (cardPlan === currentPlan) {
            card.classList.add('current-plan-card');
            
            const badge = document.createElement('div');
            badge.className = 'current-badge absolute -top-2 -right-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10';
            badge.textContent = 'Current Plan';
            card.appendChild(badge);
            
            button.textContent = 'Current Plan';
            button.classList.add('current');
            button.disabled = true;
            button.classList.remove('btn-primary');
            button.classList.add('bg-gray-300', 'text-gray-600', 'cursor-not-allowed');
        } else {
            button.classList.remove('current', 'bg-gray-300', 'text-gray-600', 'cursor-not-allowed');
            button.classList.add('btn-primary');
            button.disabled = false;
            
            if (cardPlan === 'enterprise') {
                button.textContent = 'Contact Sales';
            } else {
                const upgradePhrases = {
                    'starter': currentPlan === 'free' ? 'Start Free Trial' : 'Downgrade to Starter',
                    'professional': 'Upgrade to Professional',
                    'agency': 'Upgrade to Agency'
                };
                button.textContent = upgradePhrases[cardPlan] || `Choose ${cardPlan.charAt(0).toUpperCase() + cardPlan.slice(1)}`;
            }
        }
    });
}

function updateUsageOverview(profile, subscription, currentPlan) {
    console.log('📈 [Subscription] Updating usage overview...');
    
    const creditLimits = {
        'free': 25,
        'starter': 100,
        'professional': 300,
        'agency': 1000,
        'enterprise': 5000
    };
    
    const totalCredits = creditLimits[currentPlan] || 25;
    const usedCredits = profile?.credits_used_current_period || 0;
    const remainingCredits = Math.max(0, totalCredits - usedCredits);
    const creditPercentage = (usedCredits / totalCredits) * 100;
    
    const creditsUsedText = document.querySelector('.usage-credits-text');
    if (creditsUsedText) {
        creditsUsedText.textContent = `${usedCredits} / ${totalCredits}`;
    }
    
    const creditsBar = document.querySelector('.usage-credits-bar');
    if (creditsBar) {
        creditsBar.style.width = `${Math.min(creditPercentage, 100)}%`;
    }
    
    const creditsRemainingElement = document.getElementById('credits-remaining');
    if (creditsRemainingElement) {
        creditsRemainingElement.textContent = `${remainingCredits} / ${totalCredits}`;
    }
    
    const teamLimits = {
        'free': 1,
        'starter': 1,
        'professional': 3,
        'agency': 10,
        'enterprise': 999
    };
    
    const teamLimit = teamLimits[currentPlan] || 1;
    const teamMembersText = document.querySelector('.usage-team-text');
    if (teamMembersText) {
        teamMembersText.textContent = `1 / ${teamLimit}`;
    }
    
    const teamBar = document.querySelector('.usage-team-bar');
    if (teamBar) {
        teamBar.style.width = `${(1 / teamLimit) * 100}%`;
    }
    
    if (subscription && subscription.current_period_end) {
        const endDate = new Date(subscription.current_period_end);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        const renewalText = document.querySelector('.usage-renewal-text');
        if (renewalText) {
            renewalText.textContent = `${Math.max(0, daysRemaining)} days`;
        }
        
        const renewalBar = document.querySelector('.usage-renewal-bar');
        if (renewalBar) {
            const renewalPercentage = ((30 - daysRemaining) / 30) * 100;
            renewalBar.style.width = `${Math.max(0, Math.min(renewalPercentage, 100))}%`;
        }
        
        const nextBillingElement = document.getElementById('next-billing-date');
        if (nextBillingElement) {
            nextBillingElement.textContent = endDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } else {
        const renewalText = document.querySelector('.usage-renewal-text');
        if (renewalText) renewalText.textContent = 'N/A';
        
        const renewalBar = document.querySelector('.usage-renewal-bar');
        if (renewalBar) renewalBar.style.width = '0%';
    }
    
    console.log('✅ [Subscription] Usage overview updated');
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    console.log('🎧 [Subscription] Setting up event listeners...');
    
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    const manageBillingBtn = document.getElementById('manage-billing-btn');
    if (manageBillingBtn) manageBillingBtn.addEventListener('click', handleManageBilling);
    
    document.querySelectorAll('.card-button').forEach(button => {
        button.addEventListener('click', handlePlanSelection);
    });
    
    console.log('✅ [Subscription] Event listeners set up');
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

async function handleLogout(e) {
    e.preventDefault();
    console.log('🚪 [Subscription] Logging out...');
    
    try {
        showLoading();
        const { error } = await subscriptionState.supabase.auth.signOut();
        
        if (error) {
            console.error('❌ [Subscription] Logout error:', error);
            showErrorModal('Failed to log out. Please try again.');
            return;
        }
        
        console.log('✅ [Subscription] Logged out successfully');
        window.location.href = '/';
        
    } catch (error) {
        console.error('❌ [Subscription] Logout failed:', error);
        showErrorModal('Failed to log out. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handleManageBilling(e) {
    e.preventDefault();
    console.log('💳 [Subscription] Opening billing management...');
    
    try {
        showLoading();
        
        const workerUrl = window.OsliraEnv?.WORKER_URL || 'https://api-staging.oslira.com';
        const endpoint = `${workerUrl}/billing/create-portal-session`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${subscriptionState.currentSession.access_token}`
            },
            body: JSON.stringify({
                customerId: subscriptionState.currentUser.stripe_customer_id,
                returnUrl: `${window.location.origin}/subscription`
            })
        });
        
        if (!response.ok) throw new Error('Failed to create portal session');
        
        const responseData = await response.json();
        const portalUrl = responseData.data?.url || responseData.url;
        
        if (portalUrl) {
            window.location.href = portalUrl;
        } else {
            throw new Error('No portal URL returned');
        }
        
    } catch (error) {
        console.error('❌ [Subscription] Billing management failed:', error);
        showErrorModal('Unable to open billing management. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handlePlanSelection(e) {
    e.preventDefault();
    
    const button = e.target;
    const card = button.closest('.pricing-card');
    const plan = card.getAttribute('data-plan');
    
    console.log('💰 [Subscription] Plan selected:', plan);
    
    if (plan === 'enterprise') {
        window.open('mailto:sales@oslira.com?subject=Enterprise Plan Inquiry', '_blank');
        return;
    }
    
    if (plan === subscriptionState.currentPlan) {
        console.log('⚠️ [Subscription] User selected current plan');
        return;
    }
    
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Processing...';
    
    try {
        showLoading();
        await createCheckoutSession(plan);
    } catch (error) {
        console.error('❌ [Subscription] Plan selection failed:', error);
        showErrorModal('Failed to process subscription change. Please try again.');
    } finally {
        hideLoading();
        button.disabled = false;
        button.textContent = originalText;
    }
}

async function createCheckoutSession(plan) {
    console.log('🛒 [Subscription] Creating checkout session for:', plan);
    
    const workerUrl = window.OsliraEnv?.WORKER_URL || 'https://api-staging.oslira.com';
    const endpoint = `${workerUrl}/billing/create-checkout-session`;
    
    const payload = {
        priceId: getPriceId(plan),
        user_id: subscriptionState.currentUser.id,
        successUrl: `${window.location.origin}/subscription?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscription`
    };
    
    console.log('📡 [Subscription] Calling:', endpoint);
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${subscriptionState.currentSession.access_token}`
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Subscription] Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
    }
    
    const responseData = await response.json();
    console.log('✅ [Subscription] Backend response:', responseData);
    
    const sessionId = responseData.data?.sessionId || responseData.sessionId;
    
    if (!sessionId) {
        console.error('❌ [Subscription] No sessionId in response:', responseData);
        throw new Error('Backend did not return a session ID');
    }
    
    console.log('🎫 [Subscription] Redirecting to Stripe checkout');
    
    const { error } = await subscriptionState.stripe.redirectToCheckout({ sessionId });
    if (error) throw error;
}

function getPriceId(plan) {
    const isProduction = window.OsliraEnv?.IS_PRODUCTION || false;
    
    const testPriceIds = {
        'starter': 'price_1SCmaBJzvcRSqGG3RGL3WrRC',
        'professional': 'price_1SCmafJzvcRSqGG3tzSaS6o1',
        'agency': 'price_1SCmb3JzvcRSqGG3xTcq7w7E'
    };
    
    const livePriceIds = {
        'starter': 'price_1SCmN0JzvcRSqGG33DY89imT',
        'professional': 'price_1SCmNaJzvcRSqGG3VAcbi4Og',
        'agency': 'price_1SCmPWJzvcRSqGG35tZjdior'
    };
    
    const priceIds = isProduction ? livePriceIds : testPriceIds;
    
    console.log('🎫 [Subscription] Using price IDs:', {
        environment: isProduction ? 'LIVE' : 'TEST',
        plan: plan,
        priceId: priceIds[plan]
    });
    
    return priceIds[plan];
}

// =============================================================================
// UI HELPERS
// =============================================================================

function showLoading() {
    subscriptionState.isLoading = true;
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    subscriptionState.isLoading = false;
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

function showErrorModal(message = 'There was an error processing your request.') {
    const modal = document.getElementById('error-modal');
    const messageElement = document.getElementById('error-message');
    
    if (messageElement) messageElement.textContent = message;
    if (modal) modal.classList.remove('hidden');
}

function showErrorState(message) {
    console.error('💥 [Subscription] Error state:', message);
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="glass-effect rounded-2xl p-8 text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
                <p class="text-gray-600 mb-6">${message}</p>
                <button onclick="location.reload()" class="btn-primary">Reload Page</button>
            </div>
        `;
    }
}

// =============================================================================
// AUTH STATE MONITORING
// =============================================================================

function setupAuthStateMonitoring() {
    if (subscriptionState.supabase) {
        subscriptionState.supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 [Subscription] Auth state change:', event);
            
            if (event === 'SIGNED_OUT') {
                window.location.href = '/auth';
            } else if (event === 'SIGNED_IN' && session) {
                subscriptionState.currentSession = session;
                subscriptionState.currentUser = session.user;
                loadSubscriptionData();
            }
        });
        console.log('✅ [Subscription] Auth state monitoring setup');
    }
}

// =============================================================================
// GLOBAL MODAL FUNCTIONS
// =============================================================================

window.closeErrorModal = function() {
    const modal = document.getElementById('error-modal');
    if (modal) modal.classList.add('hidden');
};

window.openLiveChat = function() {
    alert('Live chat coming soon! Please email support@oslira.com');
};

window.addEventListener('oslira:scripts:loaded', async () => {
    try {
        console.log('🚀 [Subscription] Scripts loaded, initializing...');
        
        // Wait for config
        await window.OsliraEnv.ready();
        
        // Initialize sidebar first
        await initializeSidebar();
        
        // Then initialize subscription page
        await initializeSubscriptionPage();
        
    } catch (error) {
        console.error('❌ [Subscription] Initialization failed:', error);
        showError('Failed to load subscription page. Please refresh.');
    }
});

console.log('📦 [Subscription] Module ready');
