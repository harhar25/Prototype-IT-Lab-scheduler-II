class API {
    constructor() {
        this.baseURL = '';
        this.interceptors = [];
    }

    async request(endpoint, options = {}) {
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

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            // Handle token expiration
            if (error.message.includes('401')) {
                await this.handleTokenRefresh();
                return this.request(endpoint, options);
            }
            throw error;
        }
    }

    async handleTokenRefresh() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            this.redirectToLogin();
            return;
        }

        try {
            const response = await this.post('/auth/refresh', {
                refresh_token: refreshToken
            });

            localStorage.setItem('access_token', response.access_token);
        } catch (error) {
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        localStorage.clear();
        window.location.reload();
    }

    get(endpoint) {
        return this.request(endpoint);
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

const api = new API();