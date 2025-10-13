// =============================================================================
// HTTP CLIENT - Robust HTTP Request Handler
// Path: /public/core/infrastructure/HttpClient.js
// Dependencies: Logger, ConfigProvider
// =============================================================================

/**
 * @class HttpClient
 * @description Production-ready HTTP client with retry, timeout, and error handling
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout with abort controller
 * - Network error detection and recovery
 * - Request/response interceptors
 * - Concurrent request limiting
 * - Request deduplication
 */
class HttpClient {
    constructor() {
        this.isInitialized = false;
        this.logger = null;
        this.configProvider = null;
        
        // Default configuration
        this.config = {
            timeout: 30000, // 30 seconds
            maxRetries: 3,
            retryDelay: 1000, // Base delay for exponential backoff
            maxRetryDelay: 10000,
            maxConcurrentRequests: 6
        };
        
        // Request tracking
        this.activeRequests = new Map();
        this.requestQueue = [];
        this.requestCount = 0;
        
        // Statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            retriedRequests: 0,
            timeoutRequests: 0
        };
        
        // Interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        console.log('🌐 [HttpClient] Instance created');
    }
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    /**
     * Initialize HTTP client
     */
    async initialize(dependencies = {}) {
        if (this.isInitialized) {
            console.log('⚠️ [HttpClient] Already initialized');
            return;
        }
        
        try {
            console.log('🌐 [HttpClient] Initializing...');
            
this.logger = dependencies.logger || window.OsliraLogger;
this.configProvider = dependencies.configProvider || window.OsliraConfig;

this.isInitialized = true;
console.log('✅ [HttpClient] Initialized');

// Register with Coordinator after successful initialization
if (window.Oslira?.init) {
    window.Oslira.init.register('HttpClient', this);
    console.log('📋 [HttpClient] Registered with Coordinator');
}

} catch (error) {
    console.error('❌ [HttpClient] Initialization failed:', error);
    throw error;
}
    }
    
    // =========================================================================
    // CORE REQUEST METHOD
    // =========================================================================
    
    /**
     * Make HTTP request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise<any>} Response data
     */
    async request(url, options = {}) {
        const {
            method = 'GET',
            headers = {},
            body = null,
            timeout = this.config.timeout,
            retry = true,
            maxRetries = this.config.maxRetries
        } = options;
        
        this.stats.totalRequests++;
        
        // Check concurrent request limit
        await this._waitForSlot();
        
        // Create request ID for tracking
        const requestId = this._generateRequestId();
        
        try {
            // Run request interceptors
            const interceptedOptions = await this._runRequestInterceptors({
                url,
                method,
                headers,
                body
            });
            
            // Make request with retry logic
            const response = await this._requestWithRetry(
                interceptedOptions.url,
                {
                    method: interceptedOptions.method,
                    headers: interceptedOptions.headers,
                    body: interceptedOptions.body,
                    timeout,
                    maxRetries: retry ? maxRetries : 0
                },
                requestId
            );
            
            // Run response interceptors
            const interceptedResponse = await this._runResponseInterceptors(response);
            
            this.stats.successfulRequests++;
            
            if (this.logger) {
                this.logger.debug('[HttpClient] Request successful', {
                    url,
                    method,
                    status: response.status
                });
            }
            
            return interceptedResponse;
            
        } catch (error) {
            this.stats.failedRequests++;
            
            if (this.logger) {
                this.logger.error('[HttpClient] Request failed', {
                    url,
                    method,
                    error: error.message
                });
            }
            
            throw error;
            
        } finally {
            this._releaseSlot(requestId);
        }
    }
    
    /**
     * Request with retry logic
     */
    async _requestWithRetry(url, options, requestId, attempt = 0) {
        try {
            return await this._executeRequest(url, options, requestId);
            
        } catch (error) {
            const shouldRetry = this._shouldRetry(error, attempt, options.maxRetries);
            
            if (shouldRetry) {
                this.stats.retriedRequests++;
                
                // Calculate retry delay (exponential backoff)
                const delay = Math.min(
                    this.config.retryDelay * Math.pow(2, attempt),
                    this.config.maxRetryDelay
                );
                
                if (this.logger) {
                    this.logger.warn(`[HttpClient] Retrying request (${attempt + 1}/${options.maxRetries})`, {
                        url,
                        delay
                    });
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Retry
                return await this._requestWithRetry(url, options, requestId, attempt + 1);
            }
            
            throw error;
        }
    }
    
    /**
     * Execute single request attempt
     */
    async _executeRequest(url, options, requestId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        try {
            // Track active request
            this.activeRequests.set(requestId, { url, controller });
            
            const response = await fetch(url, {
                method: options.method,
                headers: options.headers,
                body: options.body,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Check if response is ok
            if (!response.ok) {
                throw new HttpError(response.status, response.statusText, url);
            }
            
            // Parse response
            const data = await this._parseResponse(response);
            
            return {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data
            };
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle abort (timeout)
            if (error.name === 'AbortError') {
                this.stats.timeoutRequests++;
                throw new HttpTimeoutError(url, options.timeout);
            }
            
            // Handle network errors
            if (error.message.includes('Failed to fetch')) {
                throw new HttpNetworkError(url);
            }
            
            throw error;
            
        } finally {
            this.activeRequests.delete(requestId);
        }
    }
    
    /**
     * Parse response based on content type
     */
    async _parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            return await response.json();
        }
        
        if (contentType.includes('text/')) {
            return await response.text();
        }
        
        // Binary data
        return await response.blob();
    }
    
    // =========================================================================
    // RETRY LOGIC
    // =========================================================================
    
    /**
     * Determine if request should be retried
     */
    _shouldRetry(error, attempt, maxRetries) {
        // No more retries left
        if (attempt >= maxRetries) {
            return false;
        }
        
        // Retry network errors
        if (error instanceof HttpNetworkError) {
            return true;
        }
        
        // Retry timeouts
        if (error instanceof HttpTimeoutError) {
            return true;
        }
        
        // Retry 5xx server errors
        if (error instanceof HttpError && error.status >= 500) {
            return true;
        }
        
        // Retry 429 rate limit
        if (error instanceof HttpError && error.status === 429) {
            return true;
        }
        
        // Don't retry client errors (4xx)
        return false;
    }
    
    // =========================================================================
    // CONCURRENT REQUEST MANAGEMENT
    // =========================================================================
    
    /**
     * Wait for available request slot
     */
    async _waitForSlot() {
        while (this.activeRequests.size >= this.config.maxConcurrentRequests) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    /**
     * Release request slot
     */
    _releaseSlot(requestId) {
        this.activeRequests.delete(requestId);
    }
    
    /**
     * Generate unique request ID
     */
    _generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // =========================================================================
    // INTERCEPTORS
    // =========================================================================
    
    /**
     * Add request interceptor
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }
    
    /**
     * Add response interceptor
     */
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }
    
    /**
     * Run request interceptors
     */
    async _runRequestInterceptors(request) {
        let modifiedRequest = { ...request };
        
        for (const interceptor of this.requestInterceptors) {
            modifiedRequest = await interceptor(modifiedRequest);
        }
        
        return modifiedRequest;
    }
    
    /**
     * Run response interceptors
     */
    async _runResponseInterceptors(response) {
        let modifiedResponse = response;
        
        for (const interceptor of this.responseInterceptors) {
            modifiedResponse = await interceptor(modifiedResponse);
        }
        
        return modifiedResponse;
    }
    
    // =========================================================================
    // CONVENIENCE METHODS
    // =========================================================================
    
    /**
     * GET request
     */
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    
    /**
     * POST request
     */
    async post(url, body, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    /**
     * PUT request
     */
    async put(url, body, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    /**
     * DELETE request
     */
    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
    
    /**
     * PATCH request
     */
    async patch(url, body, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    /**
     * Set timeout
     */
    setTimeout(timeout) {
        this.config.timeout = timeout;
    }
    
    /**
     * Set max retries
     */
    setMaxRetries(maxRetries) {
        this.config.maxRetries = maxRetries;
    }
    
    /**
     * Set max concurrent requests
     */
    setMaxConcurrentRequests(max) {
        this.config.maxConcurrentRequests = max;
    }
    
    // =========================================================================
    // REQUEST CANCELLATION
    // =========================================================================
    
    /**
     * Cancel all active requests
     */
    cancelAll() {
        const count = this.activeRequests.size;
        
        for (const [_, request] of this.activeRequests) {
            request.controller.abort();
        }
        
        this.activeRequests.clear();
        
        if (this.logger) {
            this.logger.info(`[HttpClient] Cancelled ${count} active requests`);
        }
    }
    
    /**
     * Cancel specific request
     */
    cancelRequest(requestId) {
        const request = this.activeRequests.get(requestId);
        
        if (request) {
            request.controller.abort();
            this.activeRequests.delete(requestId);
            return true;
        }
        
        return false;
    }
    
    // =========================================================================
    // STATISTICS
    // =========================================================================
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            activeRequests: this.activeRequests.size,
            successRate: this.stats.totalRequests > 0 ?
                (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%' :
                'N/A'
        };
    }
    
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            retriedRequests: 0,
            timeoutRequests: 0
        };
        
        if (this.logger) {
            this.logger.info('[HttpClient] Statistics reset');
        }
    }
    
    // =========================================================================
    // DEBUG
    // =========================================================================
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: this.config,
            stats: this.getStats(),
            activeRequests: Array.from(this.activeRequests.keys())
        };
    }
    
    /**
     * Print debug info
     */
    debug() {
        console.group('🌐 [HttpClient] Debug Info');
        console.log('Config:', this.config);
        console.log('Stats:', this.getStats());
        console.log('Active Requests:', this.activeRequests.size);
        console.groupEnd();
    }
    
    // =========================================================================
    // CLEANUP
    // =========================================================================
    
    /**
     * Destroy HTTP client
     */
    destroy() {
        this.cancelAll();
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.resetStats();
        this.isInitialized = false;
        
        console.log('🗑️ [HttpClient] Destroyed');
    }
}

// =============================================================================
// HTTP ERROR CLASSES
// =============================================================================

class HttpError extends Error {
    constructor(status, statusText, url) {
        super(`HTTP ${status}: ${statusText} (${url})`);
        this.name = 'HttpError';
        this.status = status;
        this.statusText = statusText;
        this.url = url;
    }
}

class HttpTimeoutError extends Error {
    constructor(url, timeout) {
        super(`Request timeout after ${timeout}ms (${url})`);
        this.name = 'HttpTimeoutError';
        this.url = url;
        this.timeout = timeout;
    }
}

class HttpNetworkError extends Error {
    constructor(url) {
        super(`Network error (${url})`);
        this.name = 'HttpNetworkError';
        this.url = url;
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================


// Export for ES6 modules
export default HttpClient;

// Also keep window global for backwards compatibility
if (typeof window !== 'undefined') {
    window.OsliraHttpClient = HttpClient;
window.HttpError = HttpError;
window.HttpTimeoutError = HttpTimeoutError;
window.HttpNetworkError = HttpNetworkError;
}
