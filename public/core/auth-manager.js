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
        await this.waitForConfig();
        await this.initializeSupabase();
        
        // CRITICAL FIX: Check URL hash BEFORE loading stored session
        const restoredFromUrl = await this.restoreSessionFromUrl();
        
        if (!restoredFromUrl) {
            // Only load stored session if URL didn't provide one
            await this.loadCurrentSession();
        }
        
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
            return;
        }
        
        if (typeof window.supabase !== 'undefined') {
            // Detect root domain dynamically for cookie sharing
            const hostname = window.location.hostname;
            const hostParts = hostname.split('.');
            const rootDomain = hostParts.length >= 2 
                ? '.' + hostParts.slice(-2).join('.')
                : hostname;
            
            console.log('🍪 [Auth] Setting cookie domain:', rootDomain);
            
            this.supabase = window.supabase.createClient(config.url, config.key, {
                auth: {
                    storageKey: 'oslira-auth',
                    storage: window.localStorage,
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    flowType: 'pkce',
                    cookieOptions: {
                        domain: rootDomain,
                        path: '/',
                        sameSite: 'lax'
                    }
                }
            });
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
        
        // Load signature_name from users table
        await this.loadUserProfile();
        
        // Load businesses in background WITHOUT blocking
        this.loadUserBusinesses().catch(err => {
            console.warn('⚠️ [Auth] Background business load failed:', err);
        });
    }
}

/**
 * Load user profile data including signature_name
 */
async loadUserProfile() {
    try {
        const { data, error } = await this.supabase
            .from('users')
            .select('signature_name, full_name')
            .eq('id', this.user.id)
            .single();
        
        if (!error && data) {
            // Merge profile data into user object
            this.user.signature_name = data.signature_name;
            this.user.full_name = data.full_name;
        }
    } catch (err) {
        console.warn('⚠️ [Auth] Failed to load user profile:', err);
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
        // User already created during callback - just enrich
        await this.enrichUserWithSubscription();
        
        const { data: businesses, error } = await this.supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', this.user.id);
            
        if (error) {
            console.error('❌ [Auth] Failed to load businesses:', error);
            this.businessesLoaded = true;
            return;
        }
        
        this.businesses = businesses || [];
        this.businessesLoaded = true;
        console.log(`📊 [Auth] Loaded ${this.businesses.length} business profiles`);
        
    } catch (error) {
        console.error('❌ [Auth] Error loading businesses:', error);
        this.businessesLoaded = true;
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
    
    // Clear any existing session before starting new OAuth
    console.log('🔐 [Auth] Clearing existing session before OAuth...');
    await this.supabase.auth.signOut({ scope: 'local' });
    
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
    
    // CRITICAL: Create user record immediately after OAuth - with retry logic
    let userCreated = false;
    let retries = 0;
    while (!userCreated && retries < 3) {
        try {
            await this.ensureUserExists();
            
            // VERIFY user actually exists before proceeding
            const { data: verification, error: verifyError } = await this.supabase
                .from('users')
                .select('id')
                .eq('id', data.session.user.id)
                .single();
            
            if (!verifyError && verification) {
                userCreated = true;
                console.log('✅ [Auth] User record verified in database');
            } else {
                retries++;
                console.warn(`⚠️ [Auth] User verification attempt ${retries}/3 failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
            }
        } catch (error) {
            retries++;
            console.error(`❌ [Auth] User creation attempt ${retries}/3 failed:`, error);
            if (retries >= 3) throw error;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    if (!userCreated) {
        throw new Error('Failed to create user record after 3 attempts');
    }
    
const needsOnboarding = await this.checkOnboardingStatus();
        
        const rootDomain = window.location.hostname.replace(/^(auth|app|admin|legal|contact|status|www)\./, '');
        const appUrl = window.OsliraEnv.getAppUrl(needsOnboarding ? '/onboarding' : '/dashboard');
        
        // Build redirect URL with URL-safe base64 encoding
        const tokens = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        };
        const base64 = btoa(JSON.stringify(tokens));
        const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        const redirectUrl = `${appUrl}#auth=${urlSafeBase64}`;
        
        console.log('🔐 [Auth] Redirecting to:', redirectUrl);
        
        return {
            session: data.session,
            user: data.session.user,
            needsOnboarding,
            redirectTo: redirectUrl
        };
    
        } else {
            console.log('❌ [Auth] No valid session found');
            throw new Error('No valid session found after authentication');
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
        // Decode URL-safe base64 (handles URL encoding issues)
        const base64 = authToken.replace(/-/g, '+').replace(/_/g, '/');
        const tokens = JSON.parse(atob(base64));
        
        // Clear hash from URL immediately
        history.replaceState(null, '', window.location.pathname);
        
        // CRITICAL: Initialize Supabase if not already done
        if (!this.supabase) {
            await this.initializeSupabase();
        }
        
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

    /**
 * Refresh user credits from subscription table
 * Call this after any credit-consuming operation
 */
async refreshCredits() {
    if (!this.supabase || !this.user) {
        return;
    }
    
    try {
        const { data: subscription, error } = await this.supabase
            .from('subscriptions')
            .select('credits_remaining')
            .eq('user_id', this.user.id)
            .eq('status', 'active')
            .maybeSingle();
        
        if (error) {
            console.warn('⚠️ [Auth] Could not refresh credits:', error);
            return;
        }
        
        if (subscription) {
            const oldCredits = this.user.credits;
            this.user.credits = subscription.credits_remaining;
            
            console.log('💳 [Auth] Credits refreshed:', {
                old: oldCredits,
                new: this.user.credits,
                change: this.user.credits - oldCredits
            });
            
            // Emit credit update event
            this.emitAuthEvent('credits:updated', {
                credits: this.user.credits,
                previousCredits: oldCredits
            });
        }
    } catch (error) {
        console.error('❌ [Auth] Error refreshing credits:', error);
    }
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
