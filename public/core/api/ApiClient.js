// =============================================================================
// API CLIENT - Centralized HTTP Request Handler with Caching & Deduplication
// Path: /public/core/api/ApiClient.js
// Dependencies: HttpClient, Logger, AuthManager
// =============================================================================

/**
 * @class ApiClient
 * @description High-level API client with auth, caching, deduplication, and error handling
 * 
 * Features:
 * - Automatic auth token injection
 * - Request deduplication (prevents duplicate in-flight requests)
 * - Response caching with TTL
 * - Retry logic via HttpClient
 * - Sentry error tracking
 * - Rate limiting awareness
 */
class ApiClient {
    constructor() {
        this.httpClient = null;
        this.logger = null;
        this.authManager = null;
        
        // Request deduplication
        this.inFlightRequests = new Map();
        
        // Response caching
        this.cache = new Map();
        this.defaultCacheTTL = 5 * 60 * 1000; // 5 minutes
        
        // Rate limiting tracking
        this.rateLimitRemaining = null;
        this.rateLimitReset = null;
        
        this.isInitialized = false;
        
        console.log('🔌 [ApiClient] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize ApiClient with required dependencies
     * @param {Object} dependencies - { httpClient, logger, authManager }
     */
async initialize(dependencies = {}) {
    if (this.isInitialized) {
        console.log('⚠️ [ApiClient] Already initialized');
        return;
    }
    
    try {
        console.log('🔌 [ApiClient] Initializing...');
        
        // Wait for dependencies
        this.httpClient = dependencies.httpClient || window.OsliraHttpClient;
        this.logger = dependencies.logger || window.OsliraLogger;
        this.authManager = dependencies.authManager || window.OsliraAuth;
        this.baseURL = dependencies.baseURL || window.OsliraEnv?.workerUrl || 'https://api.oslira.com';
        
        if (!this.httpClient) {
            throw new Error('HttpClient dependency missing');
        }
        
        if (!this.logger) {
            throw new Error('Logger dependency missing');
        }
        
        if (!this.authManager) {
            throw new Error('AuthManager dependency missing');
        }
        
        this.isInitialized = true;
        console.log('✅ [ApiClient] Initialized successfully');
            
        } catch (error) {
            console.error('❌ [ApiClient] Initialization failed:', error);
            
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: { component: 'ApiClient', phase: 'initialization' }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // CORE REQUEST METHOD
    // =========================================================================
    
    /**
     * Make an API request with auth, caching, and deduplication
     * @param {string} endpoint - API endpoint path
     * @param {Object} options - Request options
     * @param {Object} cacheConfig - { enabled: boolean, ttl: number, key: string }
     * @returns {Promise<Object>} API response
     */
    async request(endpoint, options = {}, cacheConfig = {}) {
        if (!this.isInitialized) {
            throw new Error('ApiClient not initialized. Call initialize() first.');
        }
        
        const {
            method = 'GET',
            body = null,
            headers = {},
            skipAuth = false,
            skipCache = false,
            skipDeduplication = false
        } = options;
        
        const {
            enabled: cacheEnabled = false,
            ttl = this.defaultCacheTTL,
            key: customCacheKey = null
        } = cacheConfig;
        
        // Generate cache key
        const cacheKey = customCacheKey || this.generateCacheKey(endpoint, method, body);
        
        try {
            // 1. Check cache (GET requests only)
            if (method === 'GET' && cacheEnabled && !skipCache) {
                const cachedResponse = this.getFromCache(cacheKey);
                if (cachedResponse) {
                    this.logger.debug('[ApiClient] Cache hit', { endpoint, cacheKey });
                    return cachedResponse;
                }
            }
            
            // 2. Check for in-flight duplicate request
            if (!skipDeduplication && this.inFlightRequests.has(cacheKey)) {
                this.logger.debug('[ApiClient] Deduplicating request', { endpoint });
                return await this.inFlightRequests.get(cacheKey);
            }
            
            // 3. Get auth token
            let authToken = null;
            if (!skipAuth) {
                authToken = await this.getAuthToken();
                if (!authToken) {
                    throw new Error('Authentication token not available');
                }
            }
            
            // 4. Build request headers
            const requestHeaders = {
                'Content-Type': 'application/json',
                ...headers
            };
            
            if (authToken) {
                requestHeaders['Authorization'] = `Bearer ${authToken}`;
            }
            
// 5. Build full URL and make the request
const fullURL = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

const requestPromise = this.httpClient.request(fullURL, {
    method,
    body: body ? JSON.stringify(body) : null,
    headers: requestHeaders
});
            
            // Store in-flight promise for deduplication
            if (!skipDeduplication) {
                this.inFlightRequests.set(cacheKey, requestPromise);
            }
            
            // Execute request
            const response = await requestPromise;
            
            // Clean up in-flight tracking
            this.inFlightRequests.delete(cacheKey);
            
            // 6. Handle rate limiting headers
            this.updateRateLimitInfo(response);
            
            // 7. Cache successful GET responses
            if (method === 'GET' && cacheEnabled && response.success) {
                this.setCache(cacheKey, response, ttl);
            }
            
            // 8. Log success
            this.logger.info('[ApiClient] Request successful', {
                endpoint,
                method,
                status: response.status || 200
            });
            
            return response;
            
        } catch (error) {
            // Clean up in-flight tracking on error
            this.inFlightRequests.delete(cacheKey);
            
            // Log error
            this.logger.error('[ApiClient] Request failed', {
                endpoint,
                method,
                error: error.message
            });
            
            // Track in Sentry
            if (window.Sentry) {
                Sentry.captureException(error, {
                    tags: {
                        component: 'ApiClient',
                        endpoint,
                        method
                    },
                    extra: { body, headers }
                });
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // CONVENIENCE METHODS
    // =========================================================================
    
    /**
     * GET request with caching
     */
    async get(endpoint, options = {}, cacheConfig = { enabled: true }) {
        return this.request(endpoint, { ...options, method: 'GET' }, cacheConfig);
    }
    
    /**
     * POST request (never cached)
     */
    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }
    
    /**
     * PUT request (never cached)
     */
    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }
    
    /**
     * DELETE request (never cached)
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
    
    /**
     * PATCH request (never cached)
     */
    async patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }
    
    // =========================================================================
    // AUTH TOKEN MANAGEMENT
    // =========================================================================
    
    /**
     * Get fresh auth token from AuthManager
     * @returns {Promise<string|null>}
     */
    async getAuthToken() {
        try {
            // Try multiple sources for token
            
            // 1. Direct session access
            const session = this.authManager.getCurrentSession();
            if (session?.access_token) {
                return session.access_token;
            }
            
            // 2. Via Supabase client
            if (this.authManager.supabase) {
                const { data } = await this.authManager.supabase.auth.getSession();
                if (data?.session?.access_token) {
                    return data.session.access_token;
                }
            }
            
            // 3. No token available
            this.logger.warn('[ApiClient] No auth token available');
            return null;
            
        } catch (error) {
            this.logger.error('[ApiClient] Failed to get auth token', error);
            return null;
        }
    }
    
    // =========================================================================
    // CACHING
    // =========================================================================
    
    /**
     * Generate cache key from request params
     */
    generateCacheKey(endpoint, method, body) {
        const bodyHash = body ? JSON.stringify(body) : '';
        return `${method}:${endpoint}:${bodyHash}`;
    }
    
    /**
     * Get item from cache if not expired
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        // Check expiration
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * Store item in cache with TTL
     */
    setCache(key, data, ttl) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttl,
            createdAt: Date.now()
        });
        
        // Prevent cache from growing too large
        if (this.cache.size > 100) {
            this.pruneCache();
        }
    }
    
    /**
     * Remove expired entries from cache
     */
    pruneCache() {
        const now = Date.now();
        let pruned = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                pruned++;
            }
        }
        
        this.logger.debug('[ApiClient] Cache pruned', { pruned, remaining: this.cache.size });
    }
    
    /**
     * Clear all cached responses
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        this.logger.info('[ApiClient] Cache cleared', { entriesCleared: size });
    }
    
    /**
     * Clear cache for specific endpoint pattern
     */
    clearCachePattern(pattern) {
        let cleared = 0;
        
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                cleared++;
            }
        }
        
        this.logger.info('[ApiClient] Cache pattern cleared', { pattern, cleared });
    }
    
    // =========================================================================
    // RATE LIMITING
    // =========================================================================
    
    /**
     * Update rate limit info from response headers
     */
    updateRateLimitInfo(response) {
        // Check for rate limit headers (if your API provides them)
        const headers = response.headers || {};
        
        if (headers['x-ratelimit-remaining']) {
            this.rateLimitRemaining = parseInt(headers['x-ratelimit-remaining']);
        }
        
        if (headers['x-ratelimit-reset']) {
            this.rateLimitReset = parseInt(headers['x-ratelimit-reset']);
        }
    }
    
    /**
     * Get current rate limit status
     */
    getRateLimitStatus() {
        return {
            remaining: this.rateLimitRemaining,
            reset: this.rateLimitReset,
            resetDate: this.rateLimitReset ? new Date(this.rateLimitReset * 1000) : null
        };
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        let expired = 0;
        const now = Date.now();
        
        for (const entry of this.cache.values()) {
            if (now > entry.expiresAt) {
                expired++;
            }
        }
        
        return {
            total: this.cache.size,
            expired,
            active: this.cache.size - expired
        };
    }
    
    /**
     * Get in-flight request count
     */
    getInFlightCount() {
        return this.inFlightRequests.size;
    }
    
    /**
     * Debug info
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            cacheSize: this.cache.size,
            inFlightRequests: this.inFlightRequests.size,
            rateLimit: this.getRateLimitStatus()
        };
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Clean up resources
     */
    destroy() {
        this.cache.clear();
        this.inFlightRequests.clear();
        this.isInitialized = false;
        
        console.log('🗑️ [ApiClient] Destroyed');
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.ApiClientClass = ApiClient;  // Export class for reference
window.OsliraApiClient = new ApiClient();  // Export singleton instance

console.log('✅ [ApiClient] Instance created and ready for initialization');
