// =============================================================================
// AUTH MANAGER - CENTRALIZED AUTHENTICATION SYSTEM
// =============================================================================

class AuthManager {
constructor() {
    this.isLoaded = false;
    this.businessesLoaded = false; // NEW
    this.loadPromise = null;
    this.supabase = null;
    this.session = null;
    this.user = null;
    this.business = null;
    this.businesses = [];
        
        // Start loading immediately
        this.loadPromise = this.initialize();
    }
    
    // =============================================================================
    // INITIALIZATION
    // =============================================================================
    
    async initialize() {
        if (this.isLoaded) {
            return true;
        }
        
        console.log('🔐 [Auth] Initializing authentication system...');
        
        try {
            // Wait for configuration to be ready
            await this.waitForConfig();
            
            // Initialize Supabase
            await this.initializeSupabase();
            
            // Get current session
            await this.loadCurrentSession();
            
            // Set up auth state listener
            this.setupAuthListener();
            
            this.isLoaded = true;
            console.log('✅ [Auth] Authentication system initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ [Auth] Initialization failed:', error);
            this.isLoaded = true; // Mark as loaded even if failed, to prevent infinite retries
            return false;
        }
    }
    
    async waitForConfig() {
        // Wait for config to be available
        let retries = 0;
        const maxRetries = 50; // 5 seconds max wait
        
        while (!window.OsliraConfig && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (!window.OsliraConfig) {
            throw new Error('Configuration not available after timeout');
        }
        
        // Wait for config to be actually loaded
        if (window.OsliraConfig.getConfig) {
            await window.OsliraConfig.getConfig();
        }
    }
    
    async initializeSupabase() {
        try {
            const config = await window.OsliraConfig.getSupabaseConfig();
            
            if (!config.url || !config.key) {
                throw new Error('Supabase configuration missing');
            }
            
            if (config.url.includes('placeholder') || config.key.includes('placeholder')) {
                console.warn('⚠️  [Auth] Using placeholder Supabase configuration');
                return; // Don't initialize with placeholder config
            }
            
            // Initialize Supabase (assuming it's loaded globally)
            if (typeof window.supabase !== 'undefined') {
                this.supabase = window.supabase.createClient(config.url, config.key);
            } else {
                console.warn('⚠️  [Auth] Supabase not available, auth features disabled');
            }
            
            console.log('✅ [Auth] Supabase initialized');
            
        } catch (error) {
            console.error('❌ [Auth] Supabase initialization failed:', error);
            throw error;
        }
    }
    
    async loadCurrentSession() {
        if (!this.supabase) {
            console.log('ℹ️  [Auth] No Supabase client, skipping session load');
            return;
        }
        
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ [Auth] Session load error:', error);
                return;
            }
            
            if (session) {
                await this.handleSessionChange(session);
                console.log('✅ [Auth] Current session loaded');
            } else {
                console.log('ℹ️  [Auth] No current session');
            }
            
        } catch (error) {
            console.error('❌ [Auth] Failed to load current session:', error);
        }
    }
    
    setupAuthListener() {
        if (!this.supabase) {
            return;
        }
        
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 [Auth] Auth state change:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    await this.handleSessionChange(session);
                    this.emitAuthEvent('signed-in', { session, user: this.user });
                    break;
                    
                case 'SIGNED_OUT':
                    await this.handleSignOut();
                    this.emitAuthEvent('signed-out', null);
                    break;
                    
                case 'TOKEN_REFRESHED':
                    await this.handleSessionChange(session);
                    this.emitAuthEvent('token-refreshed', { session, user: this.user });
                    break;
            }
        });
    }
    
    // =============================================================================
    // SESSION MANAGEMENT
    // =============================================================================
    
async handleSessionChange(session) {
    this.session = session;
    this.user = session?.user || null;
    
    if (this.user) {
        console.log('👤 [Auth] User authenticated:', this.user.email);
        
        // Load businesses in background WITHOUT blocking
        this.loadUserBusinesses().catch(err => {
            console.warn('⚠️ [Auth] Background business load failed:', err);
        });
    }
}
    
    async handleSignOut() {
        this.session = null;
        this.user = null;
        this.businesses = [];
        
        console.log('🔐 [Auth] User signed out');
    }
    async ensureUserExists() {
    if (!this.user) return;
    
    try {
        // Check if user exists
const { data: existingUser, error: fetchError } = await this.supabase
    .from('users')
    .select('id')
    .eq('id', this.user.id)
    .maybeSingle();
            
        if (fetchError && fetchError.code === 'PGRST116') {
            // User doesn't exist, create them
            console.log('🔧 [Auth] Creating user record for authenticated user...');
            
const userData = {
    id: this.user.id,
    email: this.user.email,
    full_name: this.user.user_metadata?.full_name || this.user.user_metadata?.name,
    created_via: this.user.app_metadata?.provider || 'email'
};
            
            const { error: createError } = await this.supabase
                .from('users')
                .insert(userData);
                
            if (createError) {
                console.error('❌ [Auth] Failed to create user record:', createError);
                throw createError;
            }
            
            console.log('✅ [Auth] User record created successfully');
        } else if (fetchError) {
            console.error('❌ [Auth] Error checking user existence:', fetchError);
            throw fetchError;
        }
    } catch (error) {
        console.error('❌ [Auth] Failed to ensure user exists:', error);
        throw error;
    }
}
async loadUserBusinesses() {
    if (!this.supabase || !this.user) {
        this.businessesLoaded = true;
        return;
    }
    
    try {
        // Ensure user exists in database before loading businesses
        await this.ensureUserExists();

        // Fetch subscription data and enrich user object
await this.enrichUserWithSubscription();

        
        const { data: businesses, error } = await this.supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', this.user.id);
            
        if (error) {
            console.error('❌ [Auth] Failed to load businesses:', error);
            this.businessesLoaded = true; // Mark as loaded even on error
            return;
        }
        
        this.businesses = businesses || [];
        this.businessesLoaded = true; // NEW - Mark as loaded
        console.log(`📊 [Auth] Loaded ${this.businesses.length} business profiles`);
        
    } catch (error) {
        console.error('❌ [Auth] Error loading businesses:', error);
        this.businessesLoaded = true; // Mark as loaded even on error
    }
}

async enrichUserWithSubscription() {
    if (!this.supabase || !this.user) {
        return;
    }
    
    try {
        const { data: subscription, error } = await this.supabase
            .from('subscriptions')
            .select('plan_type, credits_remaining, status')
            .eq('user_id', this.user.id)
            .eq('status', 'active')
            .maybeSingle(); // Changed from .single()
        
        if (error) {
            console.warn('⚠️ [Auth] Could not load subscription:', error);
            return;
        }
        
        if (subscription) {
            this.user.credits = subscription.credits_remaining;
            this.user.plan_type = subscription.plan_type;
            this.user.subscription_status = subscription.status;
            console.log('✅ [Auth] User enriched with subscription data');
        } else {
            // No subscription yet - this is normal before onboarding completion
            this.user.credits = 0;
            this.user.plan_type = null;
            this.user.subscription_status = 'pending';
            console.log('ℹ️ [Auth] No subscription found - user has not completed onboarding yet');
        }
    } catch (error) {
        console.error('❌ [Auth] Error enriching user with subscription:', error);
    }
}
    // =============================================================================
    // AUTHENTICATION METHODS
    // =============================================================================
    
    async signInWithGoogle() {
        if (!this.supabase) {
            throw new Error('Authentication not available');
        }
        
        const config = await window.OsliraConfig.getConfig();
        const redirectTo = config.authCallbackUrl || `${window.location.origin}/auth/callback`;
        
        console.log('🔐 [Auth] Starting Google OAuth, redirect:', redirectTo);
        
        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo
            }
        });
        
        if (error) {
            console.error('❌ [Auth] Google OAuth error:', error);
            throw error;
        }
        
        return data;
    }
    
    // =============================================================================
    // OAUTH CALLBACK HANDLING
    // =============================================================================
    
    async handleCallback() {
        if (!this.supabase) {
            throw new Error('Authentication not available');
        }
        
        console.log('🔐 [Auth] Processing OAuth callback...');
        
        try {
            const { data, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ [Auth] Callback session error:', error);
                throw error;
            }
            
            if (data.session) {
                console.log('✅ [Auth] Callback successful, user authenticated');
                
                // Check if user needs onboarding
                const needsOnboarding = await this.checkOnboardingStatus();
                
// Build redirect URL using app subdomain
const rootDomain = window.location.hostname.replace(/^(auth|app|admin|legal|contact|status|www)\./, '');
const appUrl = window.OsliraEnv.getAppUrl(needsOnboarding ? '/onboarding' : '/dashboard');

return {
    session: data.session,
    redirectTo: appUrl
};
            } else {
                throw new Error('No session found in callback');
            }
            
        } catch (error) {
            console.error('❌ [Auth] Callback processing failed:', error);
            throw error;
        }
    }

    // =============================================================================
// CROSS-SUBDOMAIN SESSION RESTORATION
// =============================================================================

/**
 * Check URL hash for auth tokens and restore session if present
 * This enables session transfer across subdomains
 * Call this BEFORE initialize() on any authenticated page
 */
async restoreSessionFromUrl() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const authToken = hashParams.get('auth');

    if (!authToken) {
        return false; // No token in URL
    }

    console.log('🔐 [Auth] Found auth token in URL, restoring session...');
    
    try {
        const tokens = JSON.parse(atob(authToken));
        
        // Clear hash from URL immediately
        history.replaceState(null, '', window.location.pathname);
        
        // Restore session in Supabase
        const { error } = await this.supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
        });
        
        if (error) {
            console.error('❌ [Auth] Failed to restore session:', error);
            return false;
        }
        
        console.log('✅ [Auth] Session restored from URL');
        
        // Wait for session to propagate
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return true;
        
    } catch (error) {
        console.error('❌ [Auth] Session transfer failed:', error);
        return false;
    }
}
    
    async checkOnboardingStatus() {
        if (!this.supabase || !this.user) {
            return true; // Default to onboarding needed
        }
        
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('onboarding_completed')
                .eq('id', this.user.id)
                .single();
            
            if (error) {
                console.warn('⚠️  [Auth] Could not check onboarding status:', error);
                return true; // Default to onboarding needed
            }
            
            return !data.onboarding_completed;
            
        } catch (error) {
            console.warn('⚠️  [Auth] Error checking onboarding:', error);
            return true;
        }
    }
    
    // =============================================================================
    // PUBLIC API
    // =============================================================================
    
    isAuthenticated() {
        return !!(this.session && this.user);
    }
    
    getCurrentSession() {
        return this.session;
    }
    
    getCurrentUser() {
        return this.user;
    }
    
    getUserBusinesses() {
        return this.businesses;
    }
    
    async waitForAuth() {
        if (!this.isLoaded) {
            await this.loadPromise;
        }
        return this.isAuthenticated();
    }
    
    // =============================================================================
    // EVENT SYSTEM
    // =============================================================================
    
    emitAuthEvent(type, data) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: data
        });
        
        window.dispatchEvent(event);
        console.log(`📡 [Auth] Emitted event: auth:${type}`);
    }
    
    // =============================================================================
    // PAGE SECURITY
    // =============================================================================
    
    async requireAuth() {
        await this.waitForAuth();
        
        if (!this.isAuthenticated()) {
            console.log('🚫 [Auth] Authentication required, redirecting...');
            window.location.href = window.OsliraEnv.getAuthUrl();
            return false;
        }
        
        return true;
    }
    
    async requireOnboarding() {
        await this.requireAuth();
        
        const needsOnboarding = await this.checkOnboardingStatus();
        if (needsOnboarding) {
            console.log('📝 [Auth] Onboarding required, redirecting...');
            window.location.href = window.OsliraEnv.getAppUrl('/onboarding');
            return false;
        }
        
        return true;
    }
    
    // =============================================================================
    // DEBUG UTILITIES
    // =============================================================================
    
    getDebugInfo() {
        return {
            isLoaded: this.isLoaded,
            isAuthenticated: this.isAuthenticated(),
            userId: this.user?.id || null,
            userEmail: this.user?.email || null,
            businessCount: this.businesses.length,
            hasSupabase: !!this.supabase,
            sessionExists: !!this.session
        };
    }

    // =============================================================================
// BUSINESS DATA HELPERS
// =============================================================================

async waitForBusinesses() {
    // First ensure auth is loaded
    if (!this.isLoaded) {
        await this.loadPromise;
    }
    
    // Then wait for businesses to load
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max
    
    while (!this.businessesLoaded && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!this.businessesLoaded) {
        console.warn('⚠️ [Auth] Timeout waiting for businesses');
    }
    
    return this.businesses;
}

hasBusinesses() {
    return this.businessesLoaded && this.businesses.length > 0;
}
}

// =============================================================================
// GLOBAL EXPORT & INITIALIZATION
// =============================================================================

// Create global instance
const authManager = new AuthManager();

// Export to window for global access
window.OsliraAuth = authManager;

console.log('🔐 [Auth] AuthManager initialized and exposed as window.OsliraAuth');
