/**
 * Enhanced API Service with Better Error Handling and Token Management
 */

class API {
    constructor() {
        this.baseURL = window.location.origin; // Use current origin
        this.interceptors = [];
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add request interceptor
        for (const interceptor of this.interceptors) {
            if (interceptor.request) {
                interceptor.request(config);
            }
        }

        try {
            const response = await fetch(url, config);
            let data;

            // Handle different response types
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Add response interceptor
            for (const interceptor of this.interceptors) {
                if (interceptor.response) {
                    interceptor.response(response, data);
                }
            }

            if (!response.ok) {
                const error = new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);

            // Handle token expiration (401)
            if (error.status === 401) {
                const refreshed = await this.handleTokenRefresh();
                if (refreshed) {
                    // Retry the original request with new token
                    return this.request(endpoint, options);
                } else {
                    this.redirectToLogin();
                    throw error;
                }
            }

            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to server');
            }

            throw error;
        }
    }

    async handleTokenRefresh() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            console.warn('No refresh token available');
            return false;
        }

        try {
            const response = await this.post('/auth/refresh', {
                refresh_token: refreshToken
            });

            if (response.success && response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                console.log('Token refreshed successfully');
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        return false;
    }

    redirectToLogin() {
        console.warn('Authentication required, redirecting to login...');
        localStorage.clear();
        // Instead of reloading, show auth screen
        if (window.app && typeof window.app.showAuthScreen === 'function') {
            window.app.showAuthScreen();
        } else {
            window.location.reload();
        }
    }

    // HTTP Methods
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // File upload
    async upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
        });
    }

    // Interceptor management
    addInterceptor(interceptor) {
        this.interceptors.push(interceptor);
    }

    removeInterceptor(interceptor) {
        const index = this.interceptors.indexOf(interceptor);
        if (index > -1) {
            this.interceptors.splice(index, 1);
        }
    }

    // Utility methods
    setBaseURL(url) {
        this.baseURL = url;
    }

    getBaseURL() {
        return this.baseURL;
    }

    // Mock responses for development (remove in production)
    async mockRequest(endpoint, mockData, delay = 500) {
        if (process.env.NODE_ENV === 'development') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockData);
                }, delay);
            });
        }
        return this.request(endpoint);
    }
}

// Create global instance
const api = new API();

// Add request interceptor for logging (development only)
if (process.env.NODE_ENV === 'development') {
    api.addInterceptor({
        request: (config) => {
            console.log('API Request:', config);
        },
        response: (response, data) => {
            console.log('API Response:', { response: response.status, data });
        }
    });
}

// Add auth interceptor
api.addInterceptor({
    response: (response, data) => {
        if (response.status === 401) {
            console.warn('Unauthorized request detected');
        }
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}