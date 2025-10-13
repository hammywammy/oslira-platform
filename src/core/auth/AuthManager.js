// =============================================================================
// AUTH MANAGER - Bulletproof Authentication System
// Path: /public/core/auth/AuthManager.js
// Dependencies: EnvDetector, Supabase CDN, SessionValidator, TokenRefresher
// =============================================================================

/**
 * @class AuthManager
 * @description Rock-solid authentication with zero race conditions
 * 
 * Features:
 * - Guaranteed initialization order
 * - Cross-subdomain session transfer
 * - Automatic token refresh
 * - Session validation
 * - Business profile loading
 * - User enrichment with subscription data
 * - Zero hanging states
 */
class AuthManager {
    constructor() {
        // Core state
        this.supabase = null;
        this.session = null;
        this.user = null;
        this.businesses = [];
        
        // Loading states (prevents race conditions)
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
        
        // Feature flags
        this.businessesLoaded = false;
        
        // Error tracking
        this.lastError = null;
        this.initAttempts = 0;
        this.maxInitAttempts = 3;
        
        console.log('🔐 [AuthManager] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION (BULLETPROOF)
    // =========================================================================
    
    /**
     * Initialize auth system with proper ordering
     * MUST be called after EnvDetector and Supabase CDN load
     */
async initialize() {
        // Prevent duplicate initialization
        if (this.isLoading) {
            console.log('⏳ [AuthManager] Already initializing, waiting...');
            return this.loadPromise;
        }
        
        if (this.isLoaded) {
            console.log('✅ [AuthManager] Already initialized');
            return true;
        }
        
        this.isLoading = true;
        this.initAttempts++;
        
        console.log(`🔐 [AuthManager] Starting initialization (attempt ${this.initAttempts}/${this.maxInitAttempts})...`);
        
        // Create promise for other systems to await
        this.loadPromise = this._initializeInternal();
        
        try {
            await this.loadPromise;
            this.isLoaded = true;
            this.isLoading = false;
            this.isInitialized = true;
            
            console.log('✅ [AuthManager] Initialization complete');
            
            // Register with Coordinator AFTER successful initialization (Pattern B)
            if (window.Oslira?.init) {
                window.Oslira.init.register('AuthManager', this);
                console.log('📋 [AuthManager] Registered with Coordinator');
            }
            
            return true;
            
        } catch (error) {
            this.isLoading = false;
            this.lastError = error;
            
            console.error(`❌ [AuthManager] Initialization failed (attempt ${this.initAttempts}):`, error);
            
            // Track in Sentry
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: {
                        component: 'AuthManager',
                        phase: 'initialization',
                        attempt: this.initAttempts
                    }
                });
            }
            
            // Retry logic
            if (this.initAttempts < this.maxInitAttempts) {
                console.log(`🔄 [AuthManager] Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.initialize();
            }
            
            throw error;
        }
    }
    
/**
 * Load current session (MUST be called after initialize)
 * ✅ CRITICAL FIX: Session/user available immediately, enrichment in background
 */
async loadSession() {
    try {
        console.log('🔐 [AuthManager] Loading current session...');
        
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        const { data: { session }, error } = await this.supabase.auth.getSession();
        
        if (error) {
            console.error('❌ [AuthManager] Session load error:', error);
            localStorage.removeItem('oslira-auth');
            return null;
        }
        
        if (session) {
            // ============================================================================
            // CRITICAL FIX: _handleSessionChange now makes user available IMMEDIATELY
            // and runs enrichment in background without blocking
            // ============================================================================
            await this._handleSessionChange(session);
            
            console.log('✅ [AuthManager] Session loaded (enrichment running in background)');
            
            this._emitEvent('session-loaded', { 
                user: this.user,
                session: this.session
            });
            
            return session;
        }
        
        console.log('ℹ️ [AuthManager] No active session found');
        return null;
        
    } catch (error) {
        console.error('❌ [AuthManager] Session load error:', error);
        return null;
    }
}

// =========================================================================
// MODIFY EXISTING _initializeInternal() METHOD
// =========================================================================

async _initializeInternal() {
    console.log('🔧 [AuthManager] Internal initialization starting...');
    
    try {
        // Step 1: Wait for dependencies
        await this._waitForEnvDetector();
        await this._waitForConfigProvider();
        await this._waitForSupabaseCDN();
        
        // Step 2: Initialize Supabase client
        await this._initializeSupabase();
        
        // Step 3: ✅ NEW - Explicitly load session
        await this.loadSession();
        
        // Step 4: Setup auth state listener
        this._setupAuthListener();
        
        console.log('✅ [AuthManager] Internal initialization complete');
        return true;
        
    } catch (error) {
        console.error('❌ [AuthManager] Internal initialization failed:', error);
        this.lastError = error;
        
        if (this.initAttempts < this.maxInitAttempts) {
            console.log(`🔄 [AuthManager] Retrying initialization (${this.initAttempts}/${this.maxInitAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this._initializeInternal();
        }
        
        throw error;
    }
}

// =========================================================================
// ADD AUTH STATE LISTENER METHOD
// =========================================================================

/**
 * Setup Supabase auth state listener
 */
_setupAuthListener() {
    if (!this.supabase) return;
    
    console.log('📡 [AuthManager] Setting up auth state listener...');
    
    this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 [AuthManager] Auth state changed:', event);
        
        if (session) {
            this.session = session;
            this.user = session.user;
            
            this._emitEvent('state-changed', {
                event,
                user: this.user,
                session: this.session
            });
        } else {
            this.session = null;
            this.user = null;
            
            this._emitEvent('state-changed', {
                event,
                user: null,
                session: null
            });
        }
    });
    
    console.log('✅ [AuthManager] Auth state listener active');
}
    
    /**
     * Wait for EnvDetector to be ready
     */
    async _waitForEnvDetector() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!window.OsliraEnv && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.OsliraEnv) {
            throw new Error('EnvDetector not available after timeout');
        }
        
        console.log('✅ [AuthManager] EnvDetector ready');
    }
    
    /**
     * Wait for Supabase CDN to load
     */
    async _waitForSupabaseCDN() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!window.supabase?.createClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabase?.createClient) {
            throw new Error('Supabase CDN not loaded after timeout');
        }
        
        console.log('✅ [AuthManager] Supabase CDN ready');
    }
    
 /**
 * Initialize Supabase client with proper config
 */
async _initializeSupabase() {
    try {
        // Get config from ConfigProvider
        const supabaseUrl = await this._getSupabaseUrl();
        const supabaseKey = await this._getSupabaseKey();
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing');
        }
        
        // CRITICAL FIX: Check for stale tokens BEFORE creating client
        const storedSession = localStorage.getItem('oslira-auth');
        if (storedSession) {
            try {
                const session = JSON.parse(storedSession);
                
                // Check if token is expired (more than 1 hour old)
                if (session.expires_at) {
                    const expiresAt = session.expires_at * 1000; // Convert to ms
                    const now = Date.now();
                    
                    if (now > expiresAt) {
                        console.log('🧹 [AuthManager] Clearing expired session from storage');
                        localStorage.removeItem('oslira-auth');
                    }
                }
            } catch (error) {
                // Invalid session data - clear it
                console.log('🧹 [AuthManager] Clearing invalid session data');
                localStorage.removeItem('oslira-auth');
            }
        }
        
        // Detect root domain for cookie sharing
        const rootDomain = window.OsliraEnv.rootDomain;
        
        console.log('🍪 [AuthManager] Cookie domain:', rootDomain);
        
        // Create Supabase client with error suppression for initial refresh
        this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                storageKey: 'oslira-auth',
                storage: window.localStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                // CRITICAL: Suppress errors during initial session recovery
                debug: false,
                cookieOptions: {
                    domain: rootDomain,
                    path: '/',
                    sameSite: 'lax'
                }
            },
            global: {
                headers: {
                    'x-client-info': 'oslira-web-app'
                }
            }
        });
        
        // CRITICAL: Clear any failed session recovery attempts
        // This prevents the "Already Used" error from propagating
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.log('🧹 [AuthManager] Session recovery failed, clearing storage');
                localStorage.removeItem('oslira-auth');
                
                // Don't throw - just continue without session
                console.log('ℹ️ [AuthManager] Continuing without stored session');
            } else if (session) {
                console.log('✅ [AuthManager] Valid session recovered');
            }
        } catch (sessionError) {
            console.log('🧹 [AuthManager] Session check failed, clearing storage');
            localStorage.removeItem('oslira-auth');
        }
        
        console.log('✅ [AuthManager] Supabase client initialized');
        
    } catch (error) {
        console.error('❌ [AuthManager] Supabase initialization failed:', error);
        throw error;
    }
}

/**
 * Wait for ConfigProvider to be ready and initialize it
 */
async _waitForConfigProvider() {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds
    
    // Wait for ConfigProvider to exist
    console.log('🔍 [AuthManager] Waiting for ConfigProvider...');
    while (!window.OsliraConfig && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.OsliraConfig) {
        throw new Error('ConfigProvider not available after timeout');
    }
    
    console.log('✅ [AuthManager] ConfigProvider found');
    
    // CRITICAL FIX: ConfigProvider uses 'isLoaded', not 'isInitialized'
    if (!window.OsliraConfig.isLoaded) {
        if (typeof window.OsliraConfig.initialize !== 'function') {
            throw new Error('ConfigProvider.initialize() method not available');
        }
        
        console.log('🔧 [AuthManager] Initializing ConfigProvider...');
        
        try {
            await window.OsliraConfig.initialize();
            console.log('✅ [AuthManager] ConfigProvider initialized');
        } catch (error) {
            console.error('❌ [AuthManager] ConfigProvider initialization failed:', error);
            throw error;
        }
    } else {
        console.log('✅ [AuthManager] ConfigProvider already initialized');
    }
    
    // Verify ConfigProvider has the methods we need
    if (typeof window.OsliraConfig.getSupabaseUrl !== 'function') {
        throw new Error('ConfigProvider.getSupabaseUrl() method not available');
    }
    
    if (typeof window.OsliraConfig.getSupabaseAnonKey !== 'function') {
        throw new Error('ConfigProvider.getSupabaseAnonKey() method not available');
    }
    
    console.log('✅ [AuthManager] ConfigProvider ready with required methods');
}

/**
 * Get Supabase URL from ConfigProvider
 */
async _getSupabaseUrl() {
    // FIXED: Use 'isLoaded' instead of 'isInitialized'
    if (!window.OsliraConfig || !window.OsliraConfig.isLoaded) {
        throw new Error('ConfigProvider not initialized');
    }
    
    if (typeof window.OsliraConfig.getSupabaseUrl !== 'function') {
        throw new Error('ConfigProvider.getSupabaseUrl() not available');
    }
    
    const url = window.OsliraConfig.getSupabaseUrl();
    
    if (!url) {
        throw new Error('Supabase URL not configured in AWS Secrets Manager');
    }
    
    console.log('✅ [AuthManager] Supabase URL retrieved from config');
    return url;
}

/**
 * Get Supabase anon key from ConfigProvider
 */
async _getSupabaseKey() {
    // FIXED: Use 'isLoaded' instead of 'isInitialized'
    if (!window.OsliraConfig || !window.OsliraConfig.isLoaded) {
        throw new Error('ConfigProvider not initialized');
    }
    
    if (typeof window.OsliraConfig.getSupabaseAnonKey !== 'function') {
        throw new Error('ConfigProvider.getSupabaseAnonKey() not available');
    }
    
    const key = window.OsliraConfig.getSupabaseAnonKey();
    
    if (!key) {
        throw new Error('Supabase anon key not configured in AWS Secrets Manager');
    }
    
    console.log('✅ [AuthManager] Supabase anon key retrieved from config');
    return key;
}
    
    // =========================================================================
    // SESSION RESTORATION (Cross-Subdomain)
    // =========================================================================
    
    /**
     * Restore session from URL hash (cross-subdomain transfer)
     * Called BEFORE loading stored session
     */
    async _restoreSessionFromUrl() {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const authToken = hashParams.get('auth');
        
        if (!authToken) {
            return false; // No token in URL
        }
        
        console.log('🔐 [AuthManager] Found auth token in URL, restoring session...');
        
        try {
            // Decode URL-safe base64
            const base64 = authToken.replace(/-/g, '+').replace(/_/g, '/');
            const tokens = JSON.parse(atob(base64));
            
            // Clear hash immediately (before any await)
            history.replaceState(null, '', window.location.pathname);
            
            // Restore session in Supabase
            const { data, error } = await this.supabase.auth.setSession({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token
            });
            
            if (error) {
                console.error('❌ [AuthManager] Session restore failed:', error);
                return false;
            }
            
            if (data.session) {
                // Immediately populate session and user
                await this._handleSessionChange(data.session);
                console.log('✅ [AuthManager] Session restored from URL');
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ [AuthManager] URL session transfer failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'AuthManager', action: 'url-session-restore' }
                });
            }
            
            return false;
        }
    }
    
    /**
     * Load current session from storage
     */
    async _loadCurrentSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ [AuthManager] Session load error:', error);
                return;
            }
            
            if (session) {
                await this._handleSessionChange(session);
                console.log('✅ [AuthManager] Session loaded from storage');
            } else {
                console.log('ℹ️ [AuthManager] No stored session found');
            }
            
        } catch (error) {
            console.error('❌ [AuthManager] Session load failed:', error);
        }
    }

    // =========================================================================
    // SESSION MANAGEMENT
    // =========================================================================
    
    /**
     * Handle session change (sign in, token refresh, user update)
     */
   /**
 * Handle session change (sign in, token refresh, user update)
 * ✅ CRITICAL FIX: Make user available IMMEDIATELY, enrich in background
 */
async _handleSessionChange(session) {
    // ============================================================================
    // STEP 1: IMMEDIATE USER AVAILABILITY (Synchronous)
    // ============================================================================
    this.session = session;
    this.user = session?.user || null;
    
    if (this.user) {
        console.log('👤 [AuthManager] User authenticated:', this.user.email);
        console.log('✅ [AuthManager] User object available immediately');
        
        // ============================================================================
        // STEP 2: EMIT USER-READY EVENT IMMEDIATELY
        // This allows LeadManager to proceed WITHOUT waiting for enrichment
        // ============================================================================
        this._emitEvent('user-ready', {
            user: this.user,
            session: this.session,
            timestamp: Date.now()
        });
        
        // ============================================================================
        // STEP 3: BACKGROUND ENRICHMENT (Non-blocking)
        // Run enrichment WITHOUT awaiting - happens in background
        // ============================================================================
        this._enrichUserInBackground();
    }
}

/**
 * Enrich user in background (non-blocking)
 * Runs profile + subscription enrichment asynchronously
 */
_enrichUserInBackground() {
    // Run enrichment without awaiting - fire and forget
    (async () => {
        try {
            console.log('🔄 [AuthManager] Starting background enrichment...');
            
            // Enrich user profile (signature_name, full_name)
            await this._enrichUserProfile();
            
            // Load businesses in background
            this._loadBusinessesInBackground();
            
            console.log('✅ [AuthManager] Background enrichment complete');
            
            // Emit enrichment-complete event for components that need enriched data
            this._emitEvent('user-enriched', {
                user: this.user,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.warn('⚠️ [AuthManager] Background enrichment failed:', error);
            // Don't throw - enrichment failure shouldn't break app
        }
    })();
}
    
    /**
     * Enrich user with profile data from database
     */
    async _enrichUserProfile() {
        try {
            // Get user profile from users table
            const { data, error } = await this.supabase
                .from('users')
                .select('signature_name, full_name')
                .eq('id', this.user.id)
                .maybeSingle();
            
            if (!error && data) {
                this.user.signature_name = data.signature_name;
                this.user.full_name = data.full_name;
            }
            
            // Get subscription data
            await this._enrichUserSubscription();
            
        } catch (error) {
            console.warn('⚠️ [AuthManager] User enrichment failed:', error);
        }
    }
    
    /**
     * Enrich user with subscription data
     */
    async _enrichUserSubscription() {
        try {
            const { data: subscription, error } = await this.supabase
                .from('subscriptions')
                .select('plan_type, credits_remaining, status')
                .eq('user_id', this.user.id)
                .eq('status', 'active')
                .maybeSingle();
            
            if (error) {
                console.warn('⚠️ [AuthManager] Subscription load failed:', error);
                return;
            }
            
            if (subscription) {
                this.user.credits = subscription.credits_remaining;
                this.user.plan_type = subscription.plan_type;
                this.user.subscription_status = subscription.status;
                console.log('✅ [AuthManager] User enriched with subscription data');
            } else {
                // No subscription yet (pre-onboarding)
                this.user.credits = 0;
                this.user.plan_type = null;
                this.user.subscription_status = 'pending';
                console.log('ℹ️ [AuthManager] No subscription found (pre-onboarding)');
            }
            
        } catch (error) {
            console.error('❌ [AuthManager] Subscription enrichment failed:', error);
        }
    }
    
    /**
     * Handle sign out
     */
    async _handleSignOut() {
        this.session = null;
        this.user = null;
        this.businesses = [];
        this.businessesLoaded = false;
        
        console.log('🔐 [AuthManager] User signed out');
    }
    
    // =========================================================================
    // BUSINESS LOADING (Background)
    // =========================================================================
    
    /**
     * Load businesses in background (non-blocking)
     */
    _loadBusinessesInBackground() {
        // Don't await - run in background
        this._loadUserBusinesses().catch(error => {
            console.warn('⚠️ [AuthManager] Background business load failed:', error);
        });
    }
    
    /**
     * Load user's business profiles
     */
    async _loadUserBusinesses() {
        if (!this.user) {
            this.businessesLoaded = true;
            return;
        }
        
        try {
            const { data: businesses, error } = await this.supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ [AuthManager] Businesses load failed:', error);
                this.businessesLoaded = true;
                return;
            }
            
            this.businesses = businesses || [];
            this.businessesLoaded = true;
            
            console.log(`📊 [AuthManager] Loaded ${this.businesses.length} businesses`);
            
        } catch (error) {
            console.error('❌ [AuthManager] Businesses load error:', error);
            this.businessesLoaded = true;
        }
    }
    
    /**
     * Wait for businesses to load (for components that need them)
     */
    async waitForBusinesses() {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds
        
        while (!this.businessesLoaded && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!this.businessesLoaded) {
            console.warn('⚠️ [AuthManager] Timeout waiting for businesses');
        }
        
        return this.businesses;
    }
    
    // =========================================================================
    // AUTHENTICATION METHODS
    // =========================================================================
    
/**
 * Sign in with Google OAuth
 * CRITICAL: Always uses auth.oslira.com callback URL
 */
async signInWithGoogle() {
    if (!this.supabase) {
        throw new Error('Auth system not initialized');
    }
    
    try {
        console.log('🔐 [AuthManager] Starting Google OAuth...');
        
        // Reset internal state
        this.session = null;
        this.user = null;
        this.businesses = [];
        
        console.log('✅ [AuthManager] Internal state reset');
        
        // Small delay to ensure everything is cleared
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // ====================================================================
        // CRITICAL FIX #1: Build EXPLICIT callback URL
        // This MUST match your Supabase "Redirect URLs" allowlist
        // NOT the "Site URL" - those are different!
        // ====================================================================
        
        const redirectTo = window.OsliraEnv.getAuthUrl('/auth/callback');
        
        console.log('🔐 [AuthManager] OAuth Configuration:');
        console.log('📍 [AuthManager] Callback URL:', redirectTo);
        console.log('📍 [AuthManager] Current URL:', window.location.href);
        console.log('📍 [AuthManager] Environment:', window.OsliraEnv.environment);
        
        // ====================================================================
        // CRITICAL FIX #2: Use skipBrowserRedirect: false
        // Let Supabase handle the redirect to Google
        // ====================================================================
        
        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,  // CRITICAL: Must be in Supabase allowlist
                skipBrowserRedirect: false,  // Let Supabase redirect
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'  // Always get refresh token
                }
            }
        });
        
        if (error) {
            console.error('❌ [AuthManager] Google OAuth error:', error);
            throw error;
        }
        
        console.log('✅ [AuthManager] OAuth redirect initiated');
        console.log('🔄 [AuthManager] Redirecting to Google...');
        
        // At this point, the browser redirects to Google
        // Google will then redirect back to: https://auth.oslira.com/auth/callback?code=XXX
        
        return data;
        
    } catch (error) {
        console.error('❌ [AuthManager] Sign in failed:', error);
        
        if (window.Sentry) {
            Sentry.captureException(error, {
                tags: { 
                    component: 'AuthManager', 
                    action: 'google-signin',
                    redirectTo: window.OsliraEnv?.getAuthUrl('/auth/callback')
                }
            });
        }
        
        throw error;
    }
}

    
    /**
     * Sign out user
     */
    async signOut() {
        if (!this.supabase) {
            throw new Error('Auth system not initialized');
        }
        
        try {
            console.log('🔐 [AuthManager] Signing out...');
            
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                console.error('❌ [AuthManager] Sign out error:', error);
                throw error;
            }
            
            console.log('✅ [AuthManager] Sign out successful');
            
        } catch (error) {
            console.error('❌ [AuthManager] Sign out failed:', error);
            throw error;
        }
    }
    
    // =========================================================================
    // TOKEN REFRESHER (Background Task)
    // =========================================================================
    
    /**
     * Start automatic token refresh
     */
    _startTokenRefresher() {
        // Check if TokenRefresher is available
        if (window.OsliraTokenRefresher) {
            const refresher = new window.OsliraTokenRefresher(this);
            refresher.start();
            console.log('✅ [AuthManager] Token refresher started');
        } else {
            console.log('ℹ️ [AuthManager] TokenRefresher not available, using Supabase auto-refresh');
        }
    }
    
    // =========================================================================
    // SESSION VALIDATION
    // =========================================================================
    
    /**
     * Validate current session with server
     */
    async validateSession() {
        if (!this.session) {
            return false;
        }
        
        // Use SessionValidator if available
        if (window.OsliraSessionValidator) {
            const validator = new window.OsliraSessionValidator(this);
            return await validator.validate();
        }
        
        // Fallback: check with Supabase
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            return !error && !!user;
        } catch (error) {
            console.error('❌ [AuthManager] Session validation failed:', error);
            return false;
        }
    }
    
    // =========================================================================
    // OAUTH CALLBACK HANDLING
    // =========================================================================
    
/**
 * Handle OAuth callback (creates user record, checks onboarding)
 * CRITICAL FIX: No longer builds redirect URL - returns session data only
 */
async handleCallback() {
    try {
        console.log('🔐 [AuthManager] Processing OAuth callback...');
        console.log('📍 [AuthManager] Current URL:', window.location.href);
        
        // ====================================================================
        // STEP 1: Exchange OAuth code for session
        // ====================================================================
        
        const { data, error } = await this.supabase.auth.getSession();
        
        // If no session yet, try to exchange code from URL
        if (!data.session) {
            console.log('🔄 [AuthManager] No stored session, checking URL for OAuth code...');
            
            // Check for OAuth code in URL (PKCE flow)
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            if (code) {
                console.log('🔐 [AuthManager] Found OAuth code, exchanging for session...');
                
                // Exchange code for session (Supabase PKCE)
                const { data: sessionData, error: exchangeError } = 
                    await this.supabase.auth.exchangeCodeForSession(code);
                
                if (exchangeError) {
                    console.error('❌ [AuthManager] Code exchange failed:', exchangeError);
                    throw exchangeError;
                }
                
                if (!sessionData?.session) {
                    throw new Error('No session returned from code exchange');
                }
                
                console.log('✅ [AuthManager] OAuth code exchanged successfully');
                
                // Use the exchanged session
                data.session = sessionData.session;
                
            } else {
                // No code in URL, check for hash (implicit flow - legacy)
                const hash = window.location.hash;
                
                if (hash && hash.includes('access_token')) {
                    console.log('🔐 [AuthManager] Found OAuth hash, processing...');
                    
                    // Let Supabase process the hash automatically
                    const { data: hashData, error: hashError } = 
                        await this.supabase.auth.getSession();
                    
                    if (hashError || !hashData?.session) {
                        throw new Error('Failed to process OAuth hash');
                    }
                    
                    console.log('✅ [AuthManager] OAuth hash processed successfully');
                    data.session = hashData.session;
                    
                } else {
                    throw new Error('No session found after OAuth');
                }
            }
        }
        
        if (error) {
            console.error('❌ [AuthManager] Callback session error:', error);
            throw error;
        }
        
        if (!data.session) {
            throw new Error('No session found after OAuth');
        }
        
        console.log('✅ [AuthManager] OAuth session retrieved');
        
        // ====================================================================
        // STEP 2: Store session locally
        // ====================================================================
        
        this.session = data.session;
        this.user = data.session.user;
        
        console.log('✅ [AuthManager] Session stored locally');
        console.log('👤 [AuthManager] User:', this.user.email);
        
        // ====================================================================
        // STEP 3: Ensure user record exists in database
        // ====================================================================
        
        await this._ensureUserExists(data.session.user);
        
        // ====================================================================
        // STEP 4: Check onboarding status
        // ====================================================================
        
        const needsOnboarding = await this._checkOnboardingStatus(data.session.user.id);
        
        console.log('✅ [AuthManager] Callback processing complete');
        console.log('📊 [AuthManager] Onboarding needed:', needsOnboarding);
        
        // ====================================================================
        // CRITICAL FIX #3: Return session data WITHOUT redirect URL
        // Let the callback page (AuthCallbackApp.js) decide where to redirect
        // This separates OAuth processing from navigation logic
        // ====================================================================
        
        return {
            session: data.session,
            user: data.session.user,
            needsOnboarding: needsOnboarding
            // ❌ REMOVED: redirectTo - don't auto-redirect from here!
        };
        
    } catch (error) {
        console.error('❌ [AuthManager] OAuth callback failed:', error);
        
        if (window.Sentry) {
            Sentry.captureException(error, {
                tags: { 
                    component: 'AuthManager',
                    action: 'callback',
                    hasSession: !!this.session
                }
            });
        }
        
        throw error;
    }
}

    
    /**
     * Ensure user record exists in database
     */
    async _ensureUserExists(user) {
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
            try {
                // Check if user exists
                const { data: existingUser, error: fetchError } = await this.supabase
                    .from('users')
                    .select('id')
                    .eq('id', user.id)
                    .maybeSingle();
                
                // User exists
                if (existingUser) {
                    console.log('✅ [AuthManager] User record exists');
                    return;
                }
                
                // User doesn't exist - create
                console.log('🔧 [AuthManager] Creating user record...');
                
                const userData = {
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                    created_via: user.app_metadata?.provider || 'email'
                };
                
                const { error: createError } = await this.supabase
                    .from('users')
                    .insert(userData);
                
                if (createError) {
                    throw createError;
                }
                
                // Verify creation
                const { data: verification, error: verifyError } = await this.supabase
                    .from('users')
                    .select('id')
                    .eq('id', user.id)
                    .single();
                
                if (!verifyError && verification) {
                    console.log('✅ [AuthManager] User record created and verified');
                    return;
                }
                
                throw new Error('User creation verification failed');
                
            } catch (error) {
                retries++;
                console.error(`❌ [AuthManager] User creation attempt ${retries}/${maxRetries} failed:`, error);
                
                if (retries >= maxRetries) {
                    throw error;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 500 * retries));
            }
        }
    }
    
    /**
     * Check if user needs onboarding
     */
async _checkOnboardingStatus(userId) {
    try {
        const { data, error } = await this.supabase
            .from('users')
            .select('onboarding_completed')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.warn('⚠️ [AuthManager] Onboarding check failed:', error);
            return true; // Default to needs onboarding
        }
        
        return !data.onboarding_completed;
        
    } catch (error) {
        console.warn('⚠️ [AuthManager] Onboarding check error:', error);
        return true;
    }
}
    
// =============================================================================
// SECTION: Cross-Subdomain Session Transfer (SEPARATE CONCERN)
// =============================================================================

/**
 * Build URL with session tokens for cross-subdomain transfer
 * USE CASE: When manually navigating from auth.oslira.com to app.oslira.com
 * NOT USED: During OAuth callback processing
 * 
 * @param {Object} session - Supabase session object
 * @param {string} destinationPath - Path on app subdomain (e.g. '/dashboard' or '/onboarding')
 * @returns {string} URL with session tokens in hash
 */
buildCrossSubdomainUrl(session, destinationPath = '/dashboard') {
    console.log('🔐 [AuthManager] Building cross-subdomain URL...');
    console.log('📍 [AuthManager] Destination:', destinationPath);
    
    if (!session) {
        throw new Error('Session required for cross-subdomain transfer');
    }
    
    const appUrl = window.OsliraEnv.getAppUrl(destinationPath);
    
    // Encode tokens in URL-safe base64
    const tokens = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
    };
    
    const base64 = btoa(JSON.stringify(tokens));
    const urlSafeBase64 = base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    const finalUrl = `${appUrl}#auth=${urlSafeBase64}`;
    
    console.log('✅ [AuthManager] Cross-subdomain URL built');
    
    return finalUrl;
}

/**
 * Navigate to app subdomain with session transfer
 * USE CASE: Called by callback page to transfer to app after OAuth
 * 
 * @param {string} path - Destination path on app subdomain
 */
async navigateToApp(path = '/dashboard') {
    console.log('🔐 [AuthManager] Navigating to app subdomain...');
    console.log('📍 [AuthManager] Path:', path);
    
    if (!this.session) {
        throw new Error('No active session for cross-subdomain transfer');
    }
    
    const url = this.buildCrossSubdomainUrl(this.session, path);
    
    console.log('🔄 [AuthManager] Redirecting to:', url);
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    window.location.href = url;
}
    
    // =========================================================================
    // CREDIT MANAGEMENT
    // =========================================================================
    
    /**
     * Refresh user's credit balance
     */
    async refreshCredits() {
        if (!this.user) {
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
                console.warn('⚠️ [AuthManager] Credits refresh failed:', error);
                return;
            }
            
            if (subscription) {
                const oldCredits = this.user.credits;
                this.user.credits = subscription.credits_remaining;
                
                console.log('💳 [AuthManager] Credits refreshed:', {
                    old: oldCredits,
                    new: this.user.credits
                });
                
                this._emitEvent('credits-updated', {
                    credits: this.user.credits,
                    previousCredits: oldCredits
                });
            }
            
        } catch (error) {
            console.error('❌ [AuthManager] Credits refresh error:', error);
        }
    }
    
    // =========================================================================
    // PUBLIC API
    // =========================================================================
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!(this.session && this.user);
    }
    
    /**
     * Get current session
     */
    getCurrentSession() {
        return this.session;
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }
    
    /**
     * Get user businesses
     */
    getUserBusinesses() {
        return this.businesses;
    }
    
    /**
     * Check if businesses are loaded
     */
    hasBusinesses() {
        return this.businessesLoaded && this.businesses.length > 0;
    }
    
    /**
     * Wait for auth to be ready
     */
    async waitForAuth() {
        if (!this.isLoaded) {
            await this.initialize();
        }
        return this.isAuthenticated();
    }
    
    // =========================================================================
    // EVENT SYSTEM
    // =========================================================================
    
    /**
     * Emit auth event
     */
    _emitEvent(type, data) {
        const event = new CustomEvent(`auth:${type}`, { detail: data });
        window.dispatchEvent(event);
        console.log(`📡 [AuthManager] Event emitted: auth:${type}`);
    }
    
    // =========================================================================
    // DEBUG & UTILITIES
    // =========================================================================
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            isAuthenticated: this.isAuthenticated(),
            hasSupabase: !!this.supabase,
            userId: this.user?.id || null,
            userEmail: this.user?.email || null,
            businessCount: this.businesses.length,
            businessesLoaded: this.businessesLoaded,
            lastError: this.lastError?.message || null,
            initAttempts: this.initAttempts
        };
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================

// Create singleton instance (DO NOT initialize yet)
window.OsliraAuth = new AuthManager();

console.log('✅ [AuthManager] Class loaded, awaiting initialization');

// NOTE: AuthManager follows Pattern B (Manual-Init)
// Registration happens inside the initialize() method
