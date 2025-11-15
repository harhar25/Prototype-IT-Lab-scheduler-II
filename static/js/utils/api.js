/**
 * API Service for IT Lab Scheduler
 * Enhanced API client with error handling and authentication
 */

class ApiService {
    constructor() {
        this.baseURL = window.location.origin;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.requests = new Map(); // For request tracking
    }

    /**
     * Get authentication token
     */
    getToken() {
        return localStorage.getItem('access_token');
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    /**
     * Get request headers
     */
    getHeaders(customHeaders = {}) {
        const headers = { ...this.defaultHeaders, ...customHeaders };
        const token = this.getToken();
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    /**
     * Generate request ID for tracking
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Base request method
     */
    async request(endpoint, options = {}) {
        const requestId = this.generateRequestId();
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: this.getHeaders(options.headers),
            ...options,
            signal: options.signal || this.createAbortSignal(requestId)
        };

        // Handle request body
        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            config.body = JSON.stringify(options.body);
        }

        try {
            this.requests.set(requestId, { url, config });
            
            const response = await fetch(url, config);
            const data = await this.parseResponse(response);
            
            this.requests.delete(requestId);
            
            if (!response.ok) {
                throw this.createError(response, data);
            }
            
            return {
                success: true,
                data: data,
                status: response.status,
                headers: response.headers
            };
            
        } catch (error) {
            this.requests.delete(requestId);
            
            if (error.name === 'AbortError') {
                console.warn('Request aborted:', url);
                throw error;
            }
            
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * Create abort signal for request cancellation
     */
    createAbortSignal(requestId) {
        const controller = new AbortController();
        this.requests.set(requestId, { 
            ...this.requests.get(requestId),
            controller 
        });
        return controller.signal;
    }

    /**
     * Parse response based on content type
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        if (contentType && contentType.includes('text/')) {
            return await response.text();
        }
        
        return await response.blob();
    }

    /**
     * Create standardized error object
     */
    createError(response, data) {
        const error = new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        error.response = response;
        
        // Handle specific status codes
        switch (response.status) {
            case 401:
                error.code = 'UNAUTHORIZED';
                error.message = 'Authentication required';
                this.handleUnauthorized();
                break;
            case 403:
                error.code = 'FORBIDDEN';
                error.message = 'Access denied';
                break;
            case 404:
                error.code = 'NOT_FOUND';
                error.message = 'Resource not found';
                break;
            case 422:
                error.code = 'VALIDATION_ERROR';
                error.message = 'Validation failed';
                break;
            case 429:
                error.code = 'RATE_LIMITED';
                error.message = 'Too many requests';
                break;
            case 500:
                error.code = 'SERVER_ERROR';
                error.message = 'Internal server error';
                break;
            default:
                error.code = 'UNKNOWN_ERROR';
        }
        
        return error;
    }

    /**
     * Handle unauthorized access
     */
    handleUnauthorized() {
        this.setToken(null);
        localStorage.removeItem('user_data');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/auth')) {
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 2000);
        }
    }

    /**
     * Cancel ongoing request
     */
    cancelRequest(requestId) {
        const request = this.requests.get(requestId);
        if (request && request.controller) {
            request.controller.abort();
            this.requests.delete(requestId);
        }
    }

    /**
     * Cancel all ongoing requests
     */
    cancelAllRequests() {
        this.requests.forEach((request, requestId) => {
            if (request.controller) {
                request.controller.abort();
            }
            this.requests.delete(requestId);
        });
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, { 
            ...options, 
            method: 'POST',
            body: data
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, { 
            ...options, 
            method: 'PUT',
            body: data
        });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data = null, options = {}) {
        return this.request(endpoint, { 
            ...options, 
            method: 'PATCH',
            body: data
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * Upload file with progress tracking
     */
    async upload(endpoint, file, onProgress = null, options = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        const config = {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            },
            ...options
        };
        
        // Add progress tracking if supported
        if (onProgress && typeof XMLHttpRequest !== 'undefined') {
            return this.uploadWithProgress(endpoint, formData, onProgress, config);
        }
        
        return this.request(endpoint, config);
    }

    /**
     * Upload with progress tracking using XMLHttpRequest
     */
    uploadWithProgress(endpoint, formData, onProgress, options = {}) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
            
            xhr.open('POST', url);
            
            // Set headers
            if (options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percent = (event.loaded / event.total) * 100;
                    onProgress(percent, event.loaded, event.total);
                }
            });
            
            // Handle response
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve({
                            success: true,
                            data: data,
                            status: xhr.status
                        });
                    } catch (error) {
                        resolve({
                            success: true,
                            data: xhr.responseText,
                            status: xhr.status
                        });
                    }
                } else {
                    reject(this.createError({
                        status: xhr.status,
                        statusText: xhr.statusText
                    }, xhr.responseText));
                }
            });
            
            // Handle errors
            xhr.addEventListener('error', () => {
                reject(new Error('Network error occurred'));
            });
            
            xhr.addEventListener('abort', () => {
                reject(new Error('Request aborted'));
            });
            
            xhr.send(formData);
        });
    }

    /**
     * Download file
     */
    async download(endpoint, filename = null, options = {}) {
        const response = await this.request(endpoint, {
            ...options,
            parseResponse: false
        });
        
        if (response.success) {
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || this.getFilenameFromHeaders(response.headers) || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
        
        return response;
    }

    /**
     * Extract filename from response headers
     */
    getFilenameFromHeaders(headers) {
        const contentDisposition = headers.get('content-disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                return filenameMatch[1];
            }
        }
        return null;
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.get('/health', { timeout: 5000 });
            return {
                healthy: true,
                timestamp: new Date().toISOString(),
                response: response.data
            };
        } catch (error) {
            return {
                healthy: false,
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Batch requests
     */
    async batch(requests) {
        const results = await Promise.allSettled(
            requests.map(req => this.request(req.endpoint, req.options))
        );
        
        return results.map((result, index) => ({
            request: requests[index],
            success: result.status === 'fulfilled',
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
        }));
    }

    /**
     * Set request timeout
     */
    withTimeout(promise, timeout = 10000) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    /**
     * Retry request with exponential backoff
     */
    async retryRequest(endpoint, options = {}, retries = 3, delay = 1000) {
        try {
            return await this.request(endpoint, options);
        } catch (error) {
            if (retries === 0) throw error;
            
            await Helpers.sleep(delay);
            return this.retryRequest(endpoint, options, retries - 1, delay * 2);
        }
    }
}

// Create global API instance
const api = new ApiService();

// Mock API responses for development
if (process.env.NODE_ENV === 'development' || !window.API_BASE_URL) {
    // Mock responses will be used when no real backend is available
    api.mockResponses = {
        '/auth/login': {
            success: true,
            data: {
                access_token: 'mock_jwt_token_12345',
                refresh_token: 'mock_refresh_token_12345',
                user: {
                    id: 1,
                    username: 'demo_user',
                    email: 'demo@university.edu',
                    first_name: 'John',
                    last_name: 'Doe',
                    role: 'admin'
                }
            }
        },
        '/api/stats': {
            success: true,
            stats: {
                total_labs: 12,
                total_reservations: 45,
                pending_requests: 3,
                utilization_rate: '78%',
                available_labs: 4
            }
        }
    };
    
    // Override request method for development
    const originalRequest = api.request.bind(api);
    api.request = async function(endpoint, options) {
        // Check if we have a mock response
        if (this.mockResponses && this.mockResponses[endpoint]) {
            await Helpers.sleep(500); // Simulate network delay
            return this.mockResponses[endpoint];
        }
        
        // Fall back to original request (which will fail in development without backend)
        try {
            return await originalRequest(endpoint, options);
        } catch (error) {
            console.warn(`API endpoint ${endpoint} not available, using fallback data`);
            
            // Provide fallback data for common endpoints
            const fallbackData = this.getFallbackData(endpoint);
            if (fallbackData) {
                await Helpers.sleep(300);
                return fallbackData;
            }
            
            throw error;
        }
    };
    
    api.getFallbackData = function(endpoint) {
        const fallbacks = {
            '/api/labs': {
                success: true,
                labs: [
                    {
                        id: 1,
                        name: 'Computer Lab A',
                        capacity: 30,
                        location: 'Building A, Room 101',
                        is_active: true,
                        equipment: '25 PCs, 5 Macs, Projector',
                        description: 'Main computer lab with standard equipment'
                    },
                    {
                        id: 2,
                        name: 'Programming Lab B',
                        capacity: 25,
                        location: 'Building B, Room 205',
                        is_active: true,
                        equipment: 'High-performance PCs, Dual Monitors',
                        description: 'Advanced programming lab with development tools'
                    }
                ]
            },
            '/api/reservations': {
                success: true,
                reservations: [
                    {
                        id: 1,
                        course_code: 'CS101',
                        course_name: 'Introduction to Programming',
                        instructor_name: 'Dr. Smith',
                        section: 'A',
                        lab_name: 'Computer Lab A',
                        start_time: new Date(Date.now() + 86400000).toISOString(),
                        duration_minutes: 120,
                        status: 'pending',
                        purpose: 'Weekly lab session'
                    }
                ]
            }
        };
        
        return fallbacks[endpoint];
    };
}

// Make API available globally
window.api = api;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}