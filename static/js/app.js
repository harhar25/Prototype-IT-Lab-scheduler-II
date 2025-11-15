/**
 * Enterprise IT Lab Scheduler - Complete Enhanced Version
 * Advanced Laboratory Management System
 */

// API Service
const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('access_token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock responses for demonstration
            return this.mockResponse(endpoint, config);
        } catch (error) {
            throw new Error(error.message || 'Network error occurred');
        }
    },

    mockResponse(endpoint, config) {
        // Mock authentication endpoints
        if (endpoint === '/auth/login') {
            if (config.body?.login && config.body?.password) {
                return {
                    success: true,
                    data: {
                        access_token: 'mock_jwt_token',
                        refresh_token: 'mock_refresh_token',
                        user: {
                            id: 1,
                            username: config.body.login,
                            email: config.body.login.includes('@') ? config.body.login : `${config.body.login}@university.edu`,
                            first_name: 'John',
                            last_name: 'Doe',
                            role: config.body.login.includes('admin') ? 'admin' : 
                                  config.body.login.includes('instructor') ? 'instructor' : 'student'
                        }
                    }
                };
            }
            throw new Error('Invalid credentials');
        }

        if (endpoint === '/auth/register') {
            return {
                success: true,
                message: 'Registration successful'
            };
        }

        if (endpoint === '/profile') {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                return {
                    success: true,
                    user: JSON.parse(userData)
                };
            }
            throw new Error('Not authenticated');
        }

        // Mock data endpoints
        if (endpoint === '/api/stats') {
            return {
                success: true,
                stats: {
                    total_labs: 12,
                    total_reservations: 45,
                    pending_requests: 3,
                    utilization_rate: '78%',
                    available_labs: 4,
                    my_reservations: 8,
                    upcoming_sessions: 5,
                    scheduled_sessions: 15
                }
            };
        }

        if (endpoint === '/api/labs') {
            return {
                success: true,
                labs: [
                    { id: 1, name: 'Computer Lab A', capacity: 30, location: 'Building A, Room 101', is_active: true, equipment: '25 PCs, 5 Macs, Projector' },
                    { id: 2, name: 'Programming Lab B', capacity: 25, location: 'Building B, Room 205', is_active: true, equipment: 'High-performance PCs, Dual Monitors' },
                    { id: 3, name: 'Networking Lab', capacity: 20, location: 'Building C, Room 310', is_active: false, equipment: 'Cisco Routers, Switches' }
                ]
            };
        }

        if (endpoint === '/api/reservations') {
            return {
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
                    },
                    { 
                        id: 2, 
                        course_code: 'CS201', 
                        course_name: 'Data Structures',
                        instructor_name: 'Prof. Johnson',
                        section: 'B',
                        lab_name: 'Programming Lab B',
                        start_time: new Date(Date.now() + 172800000).toISOString(),
                        duration_minutes: 90,
                        status: 'approved',
                        purpose: 'Algorithm implementation'
                    }
                ]
            };
        }

        if (endpoint === '/api/schedule') {
            return {
                success: true,
                schedule: [
                    {
                        course_code: 'CS101',
                        course_name: 'Introduction to Programming',
                        section: 'A',
                        instructor_name: 'Dr. Smith',
                        lab_name: 'Computer Lab A',
                        start_time: new Date(Date.now() + 3600000).toISOString(),
                        duration_minutes: 120,
                        status: 'scheduled'
                    }
                ]
            };
        }

        if (endpoint === '/api/labs/status') {
            return {
                success: true,
                labs: [
                    {
                        id: 1,
                        name: 'Computer Lab A',
                        capacity: 30,
                        location: 'Building A, Room 101',
                        status: 'occupied',
                        current_booking: {
                            course_code: 'CS101',
                            instructor: 'Dr. Smith',
                            time_remaining: '45 min'
                        },
                        next_booking: {
                            time: '14:00',
                            course_code: 'CS201'
                        }
                    },
                    {
                        id: 2,
                        name: 'Programming Lab B',
                        capacity: 25,
                        location: 'Building B, Room 205',
                        status: 'available'
                    },
                    {
                        id: 3,
                        name: 'Networking Lab',
                        capacity: 20,
                        location: 'Building C, Room 310',
                        status: 'maintenance'
                    }
                ]
            };
        }

        return { success: true, data: {} };
    },

    async get(endpoint) {
        return this.request(endpoint);
    },

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    },

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// Notification System
const notification = {
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border-left: 4px solid #007bff;
                    z-index: 10000;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease;
                }
                .notification-success { border-left-color: #28a745; }
                .notification-error { border-left-color: #dc3545; }
                .notification-warning { border-left-color: #ffc107; }
                .notification-info { border-left-color: #17a2b8; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    cursor: pointer;
                    opacity: 0.6;
                }
                .notification-close:hover { opacity: 1; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }

        return notification;
    },

    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// Helper Functions
const Helpers = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

class ITLabScheduler {
    constructor() {
        this.currentUser = null;
        this.labs = [];
        this.reservations = [];
        this.schedule = [];
        this.stats = {};
        this.theme = localStorage.getItem('theme') || 'light';
        this.currentTab = 'dashboard';
        this.settings = this.loadSettings();
        this.isInitialized = false;
        
        // Initialize with error handling
        this.init().catch(error => {
            console.error('Initialization failed:', error);
            this.showErrorScreen(error);
        });
    }

    async init() {
        try {
            this.setTheme(this.theme);
            this.bindEvents();
            await this.checkAuth();
            this.isInitialized = true;
        } catch (error) {
            console.error('Init error:', error);
            this.showErrorScreen(error);
        }
    }

    loadSettings() {
        const defaults = {
            notifications: true,
            autoRefresh: true,
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            itemsPerPage: 25,
            enableAI: false,
            enableOffline: false
        };
        return { ...defaults, ...JSON.parse(localStorage.getItem('app_settings') || '{}') };
    }

    bindEvents() {
        // Safe event binding
        document.addEventListener('click', (e) => {
            try {
                this.handleGlobalClick(e);
            } catch (error) {
                console.error('Click handler error:', error);
            }
        });

        document.addEventListener('keydown', (e) => {
            try {
                this.handleKeyboardShortcuts(e);
            } catch (error) {
                console.error('Keyboard handler error:', error);
            }
        });

        // Basic error handlers
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            notification.error('An unexpected error occurred');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            notification.error('An operation failed');
        });
    }

    handleGlobalClick(e) {
        const target = e.target;
        
        // Theme toggle
        if (target.closest('[data-theme-toggle]')) {
            this.toggleTheme();
            return;
        }
        
        // Data actions
        if (target.closest('[data-action]')) {
            const actionElement = target.closest('[data-action]');
            const action = actionElement.dataset.action;
            this.handleAction(action, actionElement);
            return;
        }
        
        // Auth tabs
        if (target.closest('.auth-tabs .tab-btn')) {
            const tabButton = target.closest('.auth-tabs .tab-btn');
            const tabName = tabButton.dataset.tab;
            if (tabName) {
                this.showAuthTab(tabName);
            }
            return;
        }

        // Quick action cards
        if (target.closest('.quick-action-card')) {
            const card = target.closest('.quick-action-card');
            const action = card.dataset.action;
            if (action) {
                this.handleAction(action, card);
            }
            return;
        }

        // Filter buttons
        if (target.closest('.filter-btn')) {
            const button = target.closest('.filter-btn');
            const filter = button.dataset.filter;
            this.filterLabStatus(filter);
            return;
        }

        // View options
        if (target.closest('.view-option')) {
            const option = target.closest('.view-option');
            const view = option.dataset.view;
            this.changeScheduleView(view);
            return;
        }
    }

    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.showCommandPalette();
        }
        
        // Escape key to close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    handleAction(action, element) {
        const actionMap = {
            'create-lab': () => this.showCreateLabModal(),
            'create-reservation': () => this.showCreateReservationModal(),
            'view-schedule': () => this.showScheduleView(),
            'refresh': () => this.refreshData(),
            'logout': () => this.handleLogout(),
            'show-login': () => this.showAuthTab('login'),
            'show-register': () => this.showAuthTab('register'),
            'forgot-password': () => this.showForgotPasswordScreen(),
            'show-tab': () => {
                const tab = element.dataset.tab;
                this.showEnhancedTab(tab);
            },
            'quick-schedule': () => this.quickSchedule(),
            'bulk-schedule': () => this.bulkSchedule(),
            'resource-allocator': () => this.resourceAllocator(),
            'analytics-dashboard': () => this.analyticsDashboard(),
            'view-full-schedule': () => this.showFullSchedule()
        };

        if (actionMap[action]) {
            actionMap[action]();
        }
    }

    async checkAuth() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showAuthScreen();
                return;
            }

            const response = await api.get('/profile');
            if (response.success) {
                this.currentUser = response.user;
                this.showDashboard();
                await this.loadDashboardData();
            } else {
                this.showAuthScreen();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthScreen();
        }
    }

    setTheme(theme) {
        try {
            this.theme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Update theme icon if exists
            const themeIcon = document.querySelector('[data-theme-toggle] i');
            if (themeIcon) {
                themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        } catch (error) {
            console.error('Theme setting failed:', error);
        }
    }

    toggleTheme() {
        this.setTheme(this.theme === 'light' ? 'dark' : 'light');
    }

    showAuthScreen() {
        try {
            document.getElementById('app').innerHTML = `
                <div class="auth-container">
                    <div class="auth-card">
                        <div class="auth-header">
                            <div class="auth-logo">
                                <i class="fas fa-laptop-code"></i> IT Lab Scheduler
                            </div>
                            <p class="auth-subtitle">Laboratory Utilization Management System</p>
                        </div>
                        <div id="auth-forms"></div>
                    </div>
                </div>
            `;
            this.renderAuthForms();
        } catch (error) {
            this.showErrorScreen(error);
        }
    }

    renderAuthForms() {
        const container = document.getElementById('auth-forms');
        if (!container) return;

        container.innerHTML = `
            <div class="auth-tabs">
                <button class="tab-btn active" data-tab="login" data-action="show-login">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
                <button class="tab-btn" data-tab="register" data-action="show-register">
                    <i class="fas fa-user-plus"></i> Sign Up
                </button>
            </div>

            <div id="login-tab" class="tab-content active">
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label" for="login-email">Email or Username</label>
                        <input type="text" id="login-email" class="form-input" placeholder="Enter your email or username" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="login-password">Password</label>
                        <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required>
                    </div>
                    <div class="form-group">
                        <a href="#" class="forgot-password" data-action="forgot-password">
                            <i class="fas fa-key"></i> Forgot Password?
                        </a>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </form>
            </div>

            <div id="register-tab" class="tab-content">
                <form id="register-form">
                    <div class="form-group">
                        <label class="form-label" for="register-username">Username</label>
                        <input type="text" id="register-username" class="form-input" placeholder="Choose a username" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-email">Email</label>
                        <input type="email" id="register-email" class="form-input" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-password">Password</label>
                        <input type="password" id="register-password" class="form-input" placeholder="Create a strong password" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-firstname">First Name</label>
                        <input type="text" id="register-firstname" class="form-input" placeholder="Enter your first name">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-lastname">Last Name</label>
                        <input type="text" id="register-lastname" class="form-input" placeholder="Enter your last name">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-role">User Type</label>
                        <select id="register-role" class="form-input" required>
                            <option value="">Select your role</option>
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                </form>
            </div>
        `;

        // Bind form events after rendering
        this.bindAuthEvents();
    }

    bindAuthEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
        }

        // Forgot password
        const forgotPassword = document.querySelector('.forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordScreen();
            });
        }
    }

    showAuthTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(`${tabName}-tab`);
        const targetButton = document.querySelector(`.auth-tabs [data-tab="${tabName}"]`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetButton) targetButton.classList.add('active');
    }

    // Enhanced Forgot Password System
    showForgotPasswordScreen() {
        document.getElementById('app').innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <button class="btn btn-ghost btn-back" onclick="app.showAuthScreen()">
                            <i class="fas fa-arrow-left"></i> Back to Login
                        </button>
                        <div class="auth-logo">
                            <i class="fas fa-laptop-code"></i> IT Lab Scheduler
                        </div>
                        <p class="auth-subtitle">Reset Your Password</p>
                    </div>
                    
                    <div class="password-reset-flow">
                        <!-- Step 1: Email Verification -->
                        <div class="reset-step active" id="step-email">
                            <div class="step-header">
                                <div class="step-number">1</div>
                                <h3>Verify Your Email</h3>
                            </div>
                            <p class="step-description">Enter your email address and we'll send you a verification code.</p>
                            
                            <form id="email-verification-form">
                                <div class="form-group">
                                    <label class="form-label" for="reset-email">Email Address</label>
                                    <input type="email" id="reset-email" class="form-input" placeholder="Enter your registered email" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="fas fa-paper-plane"></i> Send Verification Code
                                </button>
                            </form>
                        </div>

                        <!-- Step 2: Code Verification -->
                        <div class="reset-step" id="step-code">
                            <div class="step-header">
                                <div class="step-number">2</div>
                                <h3>Enter Verification Code</h3>
                            </div>
                            <p class="step-description">Check your email and enter the 6-digit code we sent you.</p>
                            
                            <form id="code-verification-form">
                                <div class="form-group">
                                    <label class="form-label">Verification Code</label>
                                    <div class="code-inputs">
                                        <input type="text" maxlength="1" class="code-input" data-index="0">
                                        <input type="text" maxlength="1" class="code-input" data-index="1">
                                        <input type="text" maxlength="1" class="code-input" data-index="2">
                                        <input type="text" maxlength="1" class="code-input" data-index="3">
                                        <input type="text" maxlength="1" class="code-input" data-index="4">
                                        <input type="text" maxlength="1" class="code-input" data-index="5">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <p class="resend-code">
                                        Didn't receive the code? 
                                        <a href="#" onclick="app.resendVerificationCode()">Resend Code</a>
                                        <span id="countdown">(60s)</span>
                                    </p>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="fas fa-check-circle"></i> Verify Code
                                </button>
                            </form>
                        </div>

                        <!-- Step 3: New Password -->
                        <div class="reset-step" id="step-password">
                            <div class="step-header">
                                <div class="step-number">3</div>
                                <h3>Create New Password</h3>
                            </div>
                            <p class="step-description">Create a new strong password for your account.</p>
                            
                            <form id="new-password-form">
                                <div class="form-group">
                                    <label class="form-label" for="new-password">New Password</label>
                                    <input type="password" id="new-password" class="form-input" placeholder="Enter new password" required>
                                    <div class="password-strength">
                                        <div class="strength-bar"></div>
                                        <span class="strength-text">Password strength</span>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="confirm-password">Confirm Password</label>
                                    <input type="password" id="confirm-password" class="form-input" placeholder="Confirm new password" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="fas fa-lock"></i> Reset Password
                                </button>
                            </form>
                        </div>

                        <!-- Step 4: Success -->
                        <div class="reset-step" id="step-success">
                            <div class="success-animation">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3>Password Reset Successful!</h3>
                            <p class="success-message">Your password has been successfully reset. You can now sign in with your new password.</p>
                            <button class="btn btn-primary w-100" onclick="app.showAuthScreen()">
                                <i class="fas fa-sign-in-alt"></i> Back to Sign In
                            </button>
                        </div>
                    </div>

                    <!-- Security Tips -->
                    <div class="security-tips">
                        <h4><i class="fas fa-shield-alt"></i> Security Tips</h4>
                        <ul>
                            <li>Use a strong, unique password</li>
                            <li>Enable two-factor authentication if available</li>
                            <li>Never share your password with anyone</li>
                            <li>Log out from shared computers</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        this.bindForgotPasswordEvents();
    }

    bindForgotPasswordEvents() {
        // Email verification form
        const emailForm = document.getElementById('email-verification-form');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailVerification(e);
            });
        }

        // Code verification form
        const codeForm = document.getElementById('code-verification-form');
        if (codeForm) {
            codeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCodeVerification(e);
            });
        }

        // New password form
        const passwordForm = document.getElementById('new-password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset(e);
            });
        }

        // Code input auto-tab
        const codeInputs = document.querySelectorAll('.code-input');
        codeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < 5) {
                    codeInputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                    codeInputs[index - 1].focus();
                }
            });
        });

        // Password strength indicator
        const newPasswordInput = document.getElementById('new-password');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }
    }

    async handleEmailVerification(event) {
        event.preventDefault();
        this.showLoading(true);

        try {
            const email = document.getElementById('reset-email').value;

            if (!email) {
                notification.error('Please enter your email address');
                return;
            }

            // Simulate API call - replace with actual API endpoint
            const response = await api.post('/auth/forgot-password', { email });

            if (response.success) {
                // Store email for subsequent steps
                this.resetEmail = email;
                
                // Move to next step
                this.showResetStep('step-code');
                
                // Start countdown for resend
                this.startResendCountdown();
                
                notification.success('Verification code sent to your email');
            }
        } catch (error) {
            notification.error(error.message || 'Failed to send verification code');
        } finally {
            this.showLoading(false);
        }
    }

    async handleCodeVerification(event) {
        event.preventDefault();
        this.showLoading(true);

        try {
            const codeInputs = document.querySelectorAll('.code-input');
            const code = Array.from(codeInputs).map(input => input.value).join('');

            if (code.length !== 6) {
                notification.error('Please enter the complete 6-digit code');
                return;
            }

            // Simulate API call - replace with actual API endpoint
            const response = await api.post('/auth/verify-reset-code', {
                email: this.resetEmail,
                code: code
            });

            if (response.success) {
                // Store verification token
                this.verificationToken = response.token;
                
                // Move to next step
                this.showResetStep('step-password');
                
                notification.success('Code verified successfully');
            }
        } catch (error) {
            notification.error(error.message || 'Invalid verification code');
        } finally {
            this.showLoading(false);
        }
    }

    async handlePasswordReset(event) {
        event.preventDefault();
        this.showLoading(true);

        try {
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                notification.error('Passwords do not match');
                return;
            }

            if (newPassword.length < 8) {
                notification.error('Password must be at least 8 characters long');
                return;
            }

            // Simulate API call - replace with actual API endpoint
            const response = await api.post('/auth/reset-password', {
                email: this.resetEmail,
                token: this.verificationToken,
                new_password: newPassword
            });

            if (response.success) {
                // Move to success step
                this.showResetStep('step-success');
                
                // Clear stored data
                this.resetEmail = null;
                this.verificationToken = null;
                
                notification.success('Password reset successfully');
            }
        } catch (error) {
            notification.error(error.message || 'Failed to reset password');
        } finally {
            this.showLoading(false);
        }
    }

    showResetStep(stepId) {
        // Hide all steps
        document.querySelectorAll('.reset-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show target step
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.classList.add('active');
        }
    }

    startResendCountdown() {
        let timeLeft = 60;
        const countdownElement = document.getElementById('countdown');
        const resendLink = document.querySelector('.resend-code a');

        if (!countdownElement || !resendLink) return;

        resendLink.style.pointerEvents = 'none';
        resendLink.style.opacity = '0.5';

        const countdown = setInterval(() => {
            countdownElement.textContent = `(${timeLeft}s)`;
            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(countdown);
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.opacity = '1';
                countdownElement.textContent = '';
            }
        }, 1000);
    }

    async resendVerificationCode() {
        try {
            const response = await api.post('/auth/resend-verification', {
                email: this.resetEmail
            });

            if (response.success) {
                this.startResendCountdown();
                notification.success('Verification code resent successfully');
            }
        } catch (error) {
            notification.error(error.message || 'Failed to resend verification code');
        }
    }

    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');

        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let color = '#ef4444'; // red
        let text = 'Weak';

        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        if (strength >= 75) {
            color = '#10b981'; // green
            text = 'Strong';
        } else if (strength >= 50) {
            color = '#f59e0b'; // yellow
            text = 'Medium';
        }

        strengthBar.style.width = `${strength}%`;
        strengthBar.style.background = color;
        strengthText.textContent = text;
        strengthText.style.color = color;
    }

    async handleLogin(event) {
        event.preventDefault();
        this.showLoading(true);
        
        try {
            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password')?.value;

            if (!email || !password) {
                notification.error('Please fill in all required fields');
                return;
            }

            const response = await api.post('/auth/login', {
                login: email,
                password: password
            });

            if (response.success) {
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token);
                localStorage.setItem('user_data', JSON.stringify(response.data.user));
                
                this.currentUser = response.data.user;
                this.showDashboard();
                await this.loadDashboardData();
                
                notification.show(`Welcome back, ${this.currentUser.first_name || this.currentUser.username}!`, 'success');
            }
        } catch (error) {
            console.error('Login error:', error);
            notification.show(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        this.showLoading(true);
        
        try {
            const username = document.getElementById('register-username')?.value;
            const email = document.getElementById('register-email')?.value;
            const password = document.getElementById('register-password')?.value;
            const firstName = document.getElementById('register-firstname')?.value;
            const lastName = document.getElementById('register-lastname')?.value;
            const role = document.getElementById('register-role')?.value;

            // Basic validation
            if (!username || !email || !password || !role) {
                notification.error('Please fill in all required fields');
                return;
            }

            if (password.length < 6) {
                notification.error('Password must be at least 6 characters long');
                return;
            }

            const response = await api.post('/auth/register', {
                username: username,
                email: email,
                password: password,
                first_name: firstName,
                last_name: lastName,
                role: role
            });

            if (response.success) {
                notification.show('Account created successfully! Please sign in.', 'success');
                this.showAuthTab('login');
                // Clear the form
                document.getElementById('register-form')?.reset();
            }
        } catch (error) {
            console.error('Registration error:', error);
            notification.show(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showDashboard() {
        try {
            let dashboardContent = '';
            
            if (this.currentUser.role === 'admin') {
                dashboardContent = this.getAdminDashboard();
            } else if (this.currentUser.role === 'instructor') {
                dashboardContent = this.getInstructorDashboard();
            } else {
                dashboardContent = this.getStudentDashboard();
            }

            document.getElementById('app').innerHTML = `
                <div class="dashboard">
                    ${this.getNavbar()}
                    <main class="main-content">
                        ${dashboardContent}
                    </main>
                </div>
            `;

            // Initialize dashboard components
            this.initDashboardComponents();
            
        } catch (error) {
            console.error('Dashboard rendering failed:', error);
            this.showErrorScreen(error);
        }
    }

    getNavbar() {
        return `
            <nav class="navbar">
                <div class="nav-container">
                    <div class="nav-left">
                        <a href="#" class="nav-brand">
                            <i class="fas fa-laptop-code"></i> IT Lab Scheduler
                        </a>
                    </div>
                    
                    <div class="nav-center">
                        <div class="nav-tabs">
                            ${this.getNavTabs()}
                        </div>
                    </div>
                    
                    <div class="nav-right">
                        <button class="nav-btn" data-theme-toggle title="Toggle Theme">
                            <i class="fas ${this.theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>
                        </button>
                        
                        <div class="user-menu">
                            <div class="avatar">
                                ${this.getUserInitials()}
                            </div>
                            <div class="user-info">
                                <span class="user-name">${this.currentUser.first_name || this.currentUser.username}</span>
                                <span class="user-role">${this.currentUser.role}</span>
                            </div>
                            <button class="btn btn-ghost" data-action="logout" title="Logout">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    getNavTabs() {
        const baseTabs = [
            { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
            { id: 'schedule', label: 'Schedule', icon: 'calendar-alt' },
            { id: 'labs', label: 'Labs', icon: 'laptop-house' }
        ];

        if (this.currentUser.role === 'admin') {
            baseTabs.push(
                { id: 'reservations', label: 'Reservations', icon: 'calendar-check' },
                { id: 'analytics', label: 'Analytics', icon: 'chart-line' }
            );
        }

        return baseTabs.map(tab => `
            <button class="nav-tab ${this.currentTab === tab.id ? 'active' : ''}" 
                    data-action="show-tab" data-tab="${tab.id}">
                <i class="fas fa-${tab.icon}"></i>
                ${tab.label}
            </button>
        `).join('');
    }

    showEnhancedTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tabs-navigation .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentTab = tabName;
    }

    getAdminDashboard() {
        return `
            <div class="dashboard-container">
                <!-- Enhanced Header -->
                <div class="dashboard-header">
                    <div class="header-content">
                        <div class="header-text">
                            <h1 class="dashboard-title">Laboratory Command Center</h1>
                            <p class="dashboard-subtitle">Enterprise Laboratory Management System</p>
                            <div class="header-stats">
                                <div class="quick-stat">
                                    <span class="stat-number" id="total-labs">0</span>
                                    <span class="stat-label">Active Labs</span>
                                </div>
                                <div class="quick-stat">
                                    <span class="stat-number" id="pending-requests">0</span>
                                    <span class="stat-label">Pending Requests</span>
                                </div>
                                <div class="quick-stat">
                                    <span class="stat-number" id="utilization-rate">0%</span>
                                    <span class="stat-label">Utilization Rate</span>
                                </div>
                                <div class="quick-stat">
                                    <span class="stat-number" id="available-labs">0</span>
                                    <span class="stat-label">Available Now</span>
                                </div>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-primary btn-icon" data-action="create-lab">
                                <i class="fas fa-plus"></i>
                                <span>Add Lab</span>
                            </button>
                            <button class="btn btn-secondary btn-icon" data-action="create-reservation">
                                <i class="fas fa-calendar-plus"></i>
                                <span>New Reservation</span>
                            </button>
                            <button class="btn btn-outline btn-icon" data-action="quick-schedule">
                                <i class="fas fa-bolt"></i>
                                <span>Quick Schedule</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Real-time Lab Status -->
                <div class="lab-status-section">
                    <div class="section-header">
                        <h2>Real-time Laboratory Status</h2>
                        <div class="status-filters">
                            <button class="filter-btn active" data-filter="all">All Labs</button>
                            <button class="filter-btn" data-filter="available">Available</button>
                            <button class="filter-btn" data-filter="occupied">Occupied</button>
                            <button class="filter-btn" data-filter="maintenance">Maintenance</button>
                        </div>
                    </div>
                    <div class="lab-status-grid" id="lab-status-grid">
                        <!-- Lab status cards will be loaded here -->
                        <div class="status-loading">
                            <i class="fas fa-sync fa-spin"></i>
                            <span>Loading laboratory status...</span>
                        </div>
                    </div>
                </div>

                <!-- Enhanced Stats Grid -->
                <div class="stats-section">
                    <div class="section-header">
                        <h2>Performance Analytics</h2>
                        <div class="time-filter">
                            <select id="time-range" onchange="app.loadDashboardData()">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month" selected>This Month</option>
                                <option value="quarter">This Quarter</option>
                            </select>
                        </div>
                    </div>
                    <div class="stats-grid-enhanced" id="stats-grid">
                        <!-- Dynamic stats will be loaded here -->
                    </div>
                </div>

                <!-- Quick Schedule Overview -->
                <div class="schedule-overview-section">
                    <div class="section-header">
                        <h2>Schedule Overview</h2>
                        <div class="view-options">
                            <button class="view-option active" data-view="day">Day View</button>
                            <button class="view-option" data-view="week">Week View</button>
                            <button class="view-option" data-view="month">Month View</button>
                        </div>
                    </div>
                    <div class="schedule-timeline" id="schedule-timeline">
                        <!-- Timeline will be loaded here -->
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions-section">
                    <h2>Enterprise Tools</h2>
                    <div class="quick-actions-grid">
                        <div class="quick-action-card" data-action="create-reservation">
                            <div class="action-icon">
                                <i class="fas fa-calendar-plus"></i>
                            </div>
                            <div class="action-content">
                                <h3>New Reservation</h3>
                                <p>Schedule laboratory usage</p>
                                <span class="action-badge">Quick Book</span>
                            </div>
                            <div class="action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                        <div class="quick-action-card" data-action="bulk-schedule">
                            <div class="action-icon">
                                <i class="fas fa-calendar-week"></i>
                            </div>
                            <div class="action-content">
                                <h3>Bulk Schedule</h3>
                                <p>Schedule multiple sessions</p>
                                <span class="action-badge">Efficient</span>
                            </div>
                            <div class="action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                        <div class="quick-action-card" data-action="resource-allocator">
                            <div class="action-icon">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="action-content">
                                <h3>Resource Allocator</h3>
                                <p>Optimize resource usage</p>
                                <span class="action-badge">AI Powered</span>
                            </div>
                            <div class="action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                        <div class="quick-action-card" data-action="analytics-dashboard">
                            <div class="action-icon">
                                <i class="fas fa-chart-network"></i>
                            </div>
                            <div class="action-content">
                                <h3>Advanced Analytics</h3>
                                <p>Usage patterns & insights</p>
                                <span class="action-badge">Insights</span>
                            </div>
                            <div class="action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Tabs -->
                <div class="content-tabs-section">
                    <div class="tabs-header">
                        <div class="tabs-navigation">
                            <button class="tab-btn active" data-tab="pending-requests">
                                <i class="fas fa-clock"></i>
                                Pending Requests
                                <span class="tab-badge" id="pending-badge">0</span>
                            </button>
                            <button class="tab-btn" data-tab="schedule-manager">
                                <i class="fas fa-calendar-alt"></i>
                                Schedule Manager
                            </button>
                            <button class="tab-btn" data-tab="labs-management">
                                <i class="fas fa-laptop-house"></i>
                                Labs Management
                            </button>
                            <button class="tab-btn" data-tab="reports">
                                <i class="fas fa-chart-bar"></i>
                                Reports
                            </button>
                        </div>
                        <div class="tabs-actions">
                            <button class="btn btn-sm btn-outline" onclick="app.exportSchedule()">
                                <i class="fas fa-file-export"></i>
                                Export
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="app.printSchedule()">
                                <i class="fas fa-print"></i>
                                Print
                            </button>
                        </div>
                    </div>

                    <div class="tab-content active" id="pending-requests-tab">
                        <div class="tab-content-header">
                            <h3>Pending Reservation Requests</h3>
                            <div class="tab-actions">
                                <button class="btn btn-sm btn-success" onclick="app.approveAllPending()">
                                    <i class="fas fa-check-double"></i>
                                    Approve All
                                </button>
                                <button class="btn btn-sm btn-error" onclick="app.rejectAllPending()">
                                    <i class="fas fa-times-circle"></i>
                                    Reject All
                                </button>
                            </div>
                        </div>
                        <div id="pending-requests-content"></div>
                    </div>
                    
                    <div class="tab-content" id="schedule-manager-tab">
                        <div class="schedule-manager">
                            <div class="schedule-controls">
                                <div class="control-group">
                                    <label>Date Range:</label>
                                    <input type="date" id="schedule-start-date" class="form-input">
                                    <span>to</span>
                                    <input type="date" id="schedule-end-date" class="form-input">
                                </div>
                                <div class="control-group">
                                    <label>Laboratory:</label>
                                    <select id="schedule-lab-filter" class="form-input">
                                        <option value="">All Laboratories</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary" onclick="app.loadScheduleView()">
                                    <i class="fas fa-sync"></i> Refresh
                                </button>
                            </div>
                            <div class="schedule-grid" id="schedule-grid">
                                <!-- Schedule grid will be loaded here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="labs-management-tab">
                        <div id="labs-management-content"></div>
                    </div>
                    
                    <div class="tab-content" id="reports-tab">
                        <div class="reports-dashboard">
                            <div class="report-cards">
                                <div class="report-card">
                                    <div class="report-icon">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                    <div class="report-content">
                                        <h4>Utilization Report</h4>
                                        <p>Laboratory usage analytics</p>
                                        <button class="btn btn-sm btn-outline" onclick="app.generateUtilizationReport()">
                                            Generate
                                        </button>
                                    </div>
                                </div>
                                <div class="report-card">
                                    <div class="report-icon">
                                        <i class="fas fa-calendar-check"></i>
                                    </div>
                                    <div class="report-content">
                                        <h4>Booking Report</h4>
                                        <p>Reservation statistics</p>
                                        <button class="btn btn-sm btn-outline" onclick="app.generateBookingReport()">
                                            Generate
                                        </button>
                                    </div>
                                </div>
                                <div class="report-card">
                                    <div class="report-icon">
                                        <i class="fas fa-exclamation-triangle"></i>
                                    </div>
                                    <div class="report-content">
                                        <h4>Conflict Report</h4>
                                        <p>Schedule conflicts analysis</p>
                                        <button class="btn btn-sm btn-outline" onclick="app.generateConflictReport()">
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Upcoming Schedule -->
                <div class="schedule-preview">
                    <div class="section-header">
                        <h2>Today's Schedule</h2>
                        <div class="schedule-actions">
                            <a href="#" data-action="view-full-schedule" class="view-all-link">
                                Full Schedule
                                <i class="fas fa-arrow-right"></i>
                            </a>
                            <button class="btn btn-sm btn-outline" onclick="app.sendDailyDigest()">
                                <i class="fas fa-envelope"></i>
                                Send Digest
                            </button>
                        </div>
                    </div>
                    <div class="schedule-cards" id="upcoming-schedule">
                        <!-- Today's sessions will be loaded here -->
                    </div>
                </div>

                <!-- System Status -->
                <div class="system-status-section">
                    <h2>System Status</h2>
                    <div class="status-indicators">
                        <div class="status-item online">
                            <div class="status-dot"></div>
                            <span>API Server</span>
                            <span class="status-text">Operational</span>
                        </div>
                        <div class="status-item online">
                            <div class="status-dot"></div>
                            <span>Database</span>
                            <span class="status-text">Connected</span>
                        </div>
                        <div class="status-item warning">
                            <div class="status-dot"></div>
                            <span>Email Service</span>
                            <span class="status-text">Degraded</span>
                        </div>
                        <div class="status-item online">
                            <div class="status-dot"></div>
                            <span>Storage</span>
                            <span class="status-text">85% Capacity</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getInstructorDashboard() {
        return `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div class="header-content">
                        <div class="header-text">
                            <h1 class="dashboard-title">Instructor Dashboard</h1>
                            <p class="dashboard-subtitle">Manage your lab reservations</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-primary btn-icon" data-action="create-reservation">
                                <i class="fas fa-plus"></i>
                                <span>New Reservation</span>
                            </button>
                            <button class="btn btn-secondary btn-icon" data-action="view-schedule">
                                <i class="fas fa-calendar"></i>
                                <span>View Schedule</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="stats-grid-enhanced" id="stats-grid">
                    <!-- Stats will be loaded here -->
                </div>

                <div class="content-tabs-section">
                    <div class="tabs-header">
                        <div class="tabs-navigation">
                            <button class="tab-btn active" data-tab="my-reservations">My Reservations</button>
                            <button class="tab-btn" data-tab="upcoming-sessions">Upcoming Sessions</button>
                        </div>
                    </div>
                    
                    <div class="tab-content active" id="my-reservations-tab">
                        <div id="my-reservations-content"></div>
                    </div>
                    
                    <div class="tab-content" id="upcoming-sessions-tab">
                        <div id="upcoming-sessions-content"></div>
                    </div>
                </div>
            </div>
        `;
    }

    getStudentDashboard() {
        return `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div class="header-content">
                        <div class="header-text">
                            <h1 class="dashboard-title">Student Dashboard</h1>
                            <p class="dashboard-subtitle">View lab schedules and availability</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-primary" data-action="view-schedule">
                                <i class="fas fa-calendar"></i> View Schedule
                            </button>
                        </div>
                    </div>
                </div>

                <div class="stats-grid-enhanced" id="stats-grid">
                    <!-- Stats will be loaded here -->
                </div>

                <div class="schedule-filters">
                    <div class="filter-group">
                        <label>Select Lab:</label>
                        <select id="lab-filter" onchange="app.loadSchedule()">
                            <option value="">All Labs</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Select Date:</label>
                        <input type="date" id="date-filter" onchange="app.loadSchedule()">
                    </div>
                </div>

                <div id="schedule-view">
                    <!-- Schedule will be loaded here -->
                </div>
            </div>
        `;
    }

    initDashboardComponents() {
        // Set today's date in date filter
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            const today = new Date().toISOString().split('T')[0];
            dateFilter.value = today;
        }

        // Set default date range for schedule manager
        const startDate = document.getElementById('schedule-start-date');
        const endDate = document.getElementById('schedule-end-date');
        if (startDate && endDate) {
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            startDate.value = today;
            endDate.value = nextWeek;
        }
    }

    // Enhanced dashboard methods
    async loadLabStatus() {
        try {
            const response = await api.get('/api/labs/status');
            if (response.success) {
                this.renderLabStatus(response.labs);
            }
        } catch (error) {
            console.error('Failed to load lab status:', error);
            this.renderLabStatus([]);
        }
    }

    renderLabStatus(labs) {
        const container = document.getElementById('lab-status-grid');
        if (!container) return;

        if (labs.length === 0) {
            container.innerHTML = this.getEmptyState('No laboratories found', 'Add laboratories to see their status.');
            return;
        }

        container.innerHTML = labs.map(lab => `
            <div class="lab-status-card ${lab.status}">
                <div class="lab-status-header">
                    <div>
                        <div class="lab-name">${lab.name}</div>
                        <div class="lab-capacity">${lab.capacity} seats • ${lab.location}</div>
                    </div>
                    <span class="lab-status-badge status-${lab.status}">
                        ${lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}
                    </span>
                </div>
                
                ${lab.current_booking ? `
                    <div class="lab-schedule">
                        <div class="schedule-item">
                            <div>
                                <div class="schedule-time">Now • ${lab.current_booking.time_remaining}</div>
                                <div class="schedule-course">${lab.current_booking.course_code}</div>
                                <div class="schedule-instructor">${lab.current_booking.instructor}</div>
                            </div>
                        </div>
                    </div>
                ` : lab.status === 'available' ? `
                    <div class="lab-availability-message">
                        <i class="fas fa-check-circle"></i>
                        Available for booking
                    </div>
                ` : ''}
                
                ${lab.next_booking ? `
                    <div class="lab-next-booking">
                        <small>Next: ${lab.next_booking.time} - ${lab.next_booking.course_code}</small>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    async loadScheduleTimeline() {
        try {
            // Mock timeline data
            const timeline = [
                {
                    time: '08:00 - 10:00',
                    labs: [
                        { name: 'Lab A', status: 'occupied', booking: { course_code: 'CS101' } },
                        { name: 'Lab B', status: 'available' },
                        { name: 'Lab C', status: 'maintenance' }
                    ]
                },
                {
                    time: '10:00 - 12:00',
                    labs: [
                        { name: 'Lab A', status: 'available' },
                        { name: 'Lab B', status: 'occupied', booking: { course_code: 'CS201' } },
                        { name: 'Lab C', status: 'maintenance' }
                    ]
                },
                {
                    time: '14:00 - 16:00',
                    labs: [
                        { name: 'Lab A', status: 'reserved' },
                        { name: 'Lab B', status: 'available' },
                        { name: 'Lab C', status: 'available' }
                    ]
                }
            ];
            this.renderScheduleTimeline(timeline);
        } catch (error) {
            console.error('Failed to load schedule timeline:', error);
        }
    }

    renderScheduleTimeline(timeline) {
        const container = document.getElementById('schedule-timeline');
        if (!container) return;

        if (!timeline || timeline.length === 0) {
            container.innerHTML = '<div class="empty-state">No schedule data available</div>';
            return;
        }

        container.innerHTML = `
            <div class="timeline">
                ${timeline.map(slot => `
                    <div class="timeline-slot">
                        <div class="timeline-time">${slot.time}</div>
                        <div class="timeline-labs">
                            ${slot.labs.map(lab => `
                                <div class="timeline-lab">
                                    <div class="lab-availability ${lab.status}"></div>
                                    <span>${lab.name}</span>
                                    ${lab.booking ? `<small>${lab.booking.course_code}</small>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Load all data in parallel for better performance
            await Promise.all([
                this.loadStats(),
                this.loadLabs(),
                this.loadReservations(),
                this.loadLabStatus(),
                this.loadScheduleTimeline(),
                this.loadSchedule()
            ]);

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            notification.error('Failed to load dashboard data');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStats() {
        const response = await api.get('/api/stats');
        if (response.success) {
            this.stats = response.stats;
            this.updateEnhancedStats(this.stats);
            this.updateHeaderStats(this.stats);
        }
    }

    async loadLabs() {
        const response = await api.get('/api/labs');
        if (response.success) {
            this.labs = response.labs;
            this.updateLabFilters();
        }
    }

    async loadReservations() {
        const response = await api.get('/api/reservations');
        if (response.success) {
            this.reservations = response.reservations;
            this.renderRoleSpecificContent();
        }
    }

    updateEnhancedStats(stats) {
        const container = document.getElementById('stats-grid');
        if (!container) return;

        let statsHTML = '';
        
        if (this.currentUser.role === 'admin') {
            statsHTML = `
                <div class="stat-card-enhanced success">
                    <div class="stat-card-header">
                        <div class="stat-card-title">Total Labs</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-laptop-house"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.total_labs || 0}</div>
                    <div class="stat-card-change change-positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>Active</span>
                    </div>
                </div>
                <div class="stat-card-enhanced info">
                    <div class="stat-card-header">
                        <div class="stat-card-title">Active Reservations</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.total_reservations || 0}</div>
                    <div class="stat-card-change change-positive">
                        <i class="fas fa-check"></i>
                        <span>Current</span>
                    </div>
                </div>
                <div class="stat-card-enhanced warning">
                    <div class="stat-card-header">
                        <div class="stat-card-title">Pending Requests</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.pending_requests || 0}</div>
                    <div class="stat-card-change change-warning">
                        <i class="fas fa-exclamation"></i>
                        <span>Needs Review</span>
                    </div>
                </div>
                <div class="stat-card-enhanced">
                    <div class="stat-card-header">
                        <div class="stat-card-title">Utilization Rate</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.utilization_rate || '68%'}</div>
                    <div class="stat-card-change change-positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+5% this month</span>
                    </div>
                </div>
            `;
        } else if (this.currentUser.role === 'instructor') {
            statsHTML = `
                <div class="stat-card-enhanced">
                    <div class="stat-card-header">
                        <div class="stat-card-title">My Reservations</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.my_reservations || 0}</div>
                </div>
                <div class="stat-card-enhanced success">
                    <div class="stat-card-header">
                        <div class="stat-card-title">Upcoming Sessions</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.upcoming_sessions || 0}</div>
                </div>
                <div class="stat-card-enhanced warning">
                    <div class="stat-card-header">
                        <div class="stat-card-title">Pending Requests</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-hourglass-half"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.pending_requests || 0}</div>
                </div>
            `;
        } else {
            statsHTML = `
                <div class="stat-card-enhanced">
                    <div class="stat-card-header">
                        <div class="stat-card-title">Available Labs</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-building"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.available_labs || 0}</div>
                </div>
                <div class="stat-card-enhanced info">
                    <div class="stat-card-header">
                        <div class="stat-card-title">Scheduled Sessions</div>
                        <div class="stat-card-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                    </div>
                    <div class="stat-card-value">${stats.scheduled_sessions || 0}</div>
                </div>
            `;
        }

        container.innerHTML = statsHTML;
    }

    updateHeaderStats(stats) {
        const totalLabs = document.getElementById('total-labs');
        const pendingRequests = document.getElementById('pending-requests');
        const utilizationRate = document.getElementById('utilization-rate');
        const availableLabs = document.getElementById('available-labs');
        const pendingBadge = document.getElementById('pending-badge');

        if (totalLabs) totalLabs.textContent = stats.total_labs || 0;
        if (pendingRequests) pendingRequests.textContent = stats.pending_requests || 0;
        if (utilizationRate) utilizationRate.textContent = stats.utilization_rate || '0%';
        if (availableLabs) availableLabs.textContent = stats.available_labs || 0;
        if (pendingBadge) pendingBadge.textContent = stats.pending_requests || 0;
    }

    updateLabFilters() {
        const labFilter = document.getElementById('lab-filter');
        const scheduleLabFilter = document.getElementById('schedule-lab-filter');
        
        if (labFilter) {
            labFilter.innerHTML = '<option value="">All Labs</option>';
            this.labs.forEach(lab => {
                labFilter.innerHTML += `<option value="${lab.id}">${lab.name}</option>`;
            });
        }

        if (scheduleLabFilter) {
            scheduleLabFilter.innerHTML = '<option value="">All Laboratories</option>';
            this.labs.forEach(lab => {
                scheduleLabFilter.innerHTML += `<option value="${lab.id}">${lab.name}</option>`;
            });
        }
    }

    renderRoleSpecificContent() {
        if (this.currentUser.role === 'admin') {
            this.renderAdminContent();
        } else if (this.currentUser.role === 'instructor') {
            this.renderInstructorContent();
        } else {
            this.loadSchedule();
        }
    }

    renderAdminContent() {
        this.renderPendingRequests();
        this.renderAllReservations();
        this.renderLabsManagement();
    }

    renderInstructorContent() {
        this.renderMyReservations();
        this.renderUpcomingSessions();
    }

    renderPendingRequests() {
        const container = document.getElementById('pending-requests-content');
        if (!container) return;

        const pendingReservations = this.reservations.filter(r => r.status === 'pending');
        
        if (pendingReservations.length === 0) {
            container.innerHTML = this.getEmptyState('No pending requests', 'All reservation requests have been processed.');
            return;
        }

        container.innerHTML = pendingReservations.map(reservation => `
            <div class="reservation-card-enhanced pending">
                <div class="reservation-header-enhanced">
                    <div class="reservation-title">
                        <h4>${reservation.course_code} - ${reservation.course_name}</h4>
                        <div class="reservation-meta">
                            <div class="reservation-meta-item">
                                <i class="fas fa-user"></i>
                                ${reservation.instructor_name}
                            </div>
                            <div class="reservation-meta-item">
                                <i class="fas fa-users"></i>
                                Section ${reservation.section}
                            </div>
                            <div class="reservation-meta-item">
                                <i class="fas fa-laptop-house"></i>
                                ${reservation.lab_name}
                            </div>
                        </div>
                    </div>
                    <span class="status-badge status-pending">Pending</span>
                </div>
                <div class="reservation-details">
                    <p><strong>Date & Time:</strong> ${Helpers.formatDate(reservation.start_time)}</p>
                    <p><strong>Duration:</strong> ${reservation.duration_minutes} minutes</p>
                    ${reservation.purpose ? `<p><strong>Purpose:</strong> ${reservation.purpose}</p>` : ''}
                </div>
                <div class="reservation-actions-enhanced">
                    <button class="btn btn-success" onclick="app.approveReservation('${reservation.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-error" onclick="app.rejectReservation('${reservation.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderAllReservations() {
        const container = document.getElementById('all-reservations-content');
        if (!container) return;

        if (this.reservations.length === 0) {
            container.innerHTML = this.getEmptyState('No reservations found', 'There are no reservations in the system.');
            return;
        }

        container.innerHTML = this.reservations.map(reservation => `
            <div class="reservation-card-enhanced ${reservation.status}">
                <div class="reservation-header-enhanced">
                    <div class="reservation-title">
                        <h4>${reservation.course_code} - ${reservation.course_name}</h4>
                        <div class="reservation-meta">
                            <div class="reservation-meta-item">
                                <i class="fas fa-user"></i>
                                ${reservation.instructor_name}
                            </div>
                            <div class="reservation-meta-item">
                                <i class="fas fa-users"></i>
                                Section ${reservation.section}
                            </div>
                        </div>
                    </div>
                    <span class="status-badge status-${reservation.status}">${reservation.status}</span>
                </div>
                <div class="reservation-details">
                    <p><strong>Lab:</strong> ${reservation.lab_name}</p>
                    <p><strong>Date & Time:</strong> ${Helpers.formatDate(reservation.start_time)}</p>
                    <p><strong>Duration:</strong> ${reservation.duration_minutes} minutes</p>
                </div>
            </div>
        `).join('');
    }

    renderLabsManagement() {
        const container = document.getElementById('labs-management-content');
        if (!container) return;

        if (this.labs.length === 0) {
            container.innerHTML = this.getEmptyState('No labs found', 'Get started by creating your first lab.');
            return;
        }

        container.innerHTML = this.labs.map(lab => `
            <div class="lab-card-enhanced">
                <div class="lab-header-enhanced">
                    <div class="lab-title">
                        <h4>${lab.name}</h4>
                        <div class="lab-meta">
                            <div class="lab-meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                ${lab.location || 'Not specified'}
                            </div>
                            <div class="lab-meta-item">
                                <i class="fas fa-users"></i>
                                ${lab.capacity} students
                            </div>
                        </div>
                    </div>
                    <span class="lab-status ${lab.is_active ? 'active' : 'inactive'}">
                        ${lab.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="lab-details">
                    <p><strong>Equipment:</strong> ${lab.equipment || 'Standard equipment'}</p>
                    ${lab.description ? `<p><strong>Description:</strong> ${lab.description}</p>` : ''}
                </div>
                <div class="lab-actions-enhanced">
                    <button class="btn btn-primary" onclick="app.editLab('${lab.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-error" onclick="app.deleteLab('${lab.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    getEmptyState(title, message, action = null) {
        return `
            <div class="empty-state-enhanced">
                <i class="fas fa-inbox"></i>
                <h3>${title}</h3>
                <p>${message}</p>
                ${action ? `<button class="btn btn-primary">${action}</button>` : ''}
            </div>
        `;
    }

    async loadSchedule() {
        const container = document.getElementById('schedule-view');
        const upcomingContainer = document.getElementById('upcoming-schedule');
        
        try {
            const labId = document.getElementById('lab-filter')?.value || '';
            const date = document.getElementById('date-filter')?.value || '';
            
            const response = await api.get(`/api/schedule?lab_id=${labId}&date=${date}&upcoming=true`);
            if (response.success) {
                this.schedule = response.schedule;
                
                if (container) {
                    this.renderSchedule(container);
                }
                if (upcomingContainer) {
                    this.renderUpcomingSchedule(upcomingContainer);
                }
            }
        } catch (error) {
            console.error('Failed to load schedule:', error);
        }
    }

    renderSchedule(container) {
        if (!container) return;

        if (this.schedule.length === 0) {
            container.innerHTML = this.getEmptyState('No scheduled sessions', 'No sessions found for the selected criteria.');
            return;
        }

        container.innerHTML = this.schedule.map(session => `
            <div class="schedule-slot-enhanced ${session.status}">
                <div class="slot-time">${Helpers.formatDate(session.start_time)}</div>
                <div class="slot-details">
                    <h4>${session.course_code} - ${session.course_name}</h4>
                    <p><strong>Section:</strong> ${session.section}</p>
                    <p><strong>Instructor:</strong> ${session.instructor_name}</p>
                    <p><strong>Lab:</strong> ${session.lab_name}</p>
                    <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
                </div>
            </div>
        `).join('');
    }

    renderUpcomingSchedule(container) {
        if (!container) return;

        const upcoming = this.schedule.filter(session => new Date(session.start_time) > new Date())
                                     .slice(0, 3); // Show only 3 upcoming

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="no-upcoming">No upcoming sessions</p>';
            return;
        }

        container.innerHTML = upcoming.map(session => `
            <div class="schedule-card">
                <div class="schedule-time">${Helpers.formatDate(session.start_time)}</div>
                <div class="schedule-details">
                    <h4>${session.course_code}</h4>
                    <p>${session.course_name}</p>
                    <p><strong>Lab:</strong> ${session.lab_name}</p>
                    <p><strong>Instructor:</strong> ${session.instructor_name}</p>
                </div>
            </div>
        `).join('');
    }

    // Filter and View Methods
    filterLabStatus(filter) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const cards = document.querySelectorAll('.lab-status-card');
        cards.forEach(card => {
            if (filter === 'all' || card.classList.contains(filter)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    changeScheduleView(view) {
        const options = document.querySelectorAll('.view-option');
        options.forEach(opt => opt.classList.remove('active'));
        event.target.classList.add('active');

        // In a real app, this would load different view data
        notification.info(`Switched to ${view} view`);
    }

    // New action methods
    async quickSchedule() {
        notification.info('Quick schedule modal would open here');
    }

    async bulkSchedule() {
        notification.info('Bulk scheduling interface would open here');
    }

    async resourceAllocator() {
        notification.info('Resource allocation tool would open here');
    }

    async analyticsDashboard() {
        notification.info('Advanced analytics dashboard would open here');
    }

    async showFullSchedule() {
        this.showEnhancedTab('schedule-manager');
    }

    async generateUtilizationReport() {
        notification.info('Generating utilization report...');
    }

    async generateBookingReport() {
        notification.info('Generating booking report...');
    }

    async generateConflictReport() {
        notification.info('Generating conflict report...');
    }

    async sendDailyDigest() {
        notification.info('Sending daily schedule digest...');
    }

    async exportSchedule() {
        notification.info('Exporting schedule data...');
    }

    async printSchedule() {
        notification.info('Opening print preview...');
    }

    async loadScheduleView() {
        notification.info('Loading schedule view...');
    }

    async approveAllPending() {
        if (confirm('Are you sure you want to approve all pending requests?')) {
            notification.info('Approving all pending requests...');
        }
    }

    async rejectAllPending() {
        if (confirm('Are you sure you want to reject all pending requests?')) {
            notification.info('Rejecting all pending requests...');
        }
    }

    // Modal methods
    showCreateLabModal() {
        notification.info('Create lab modal would open here');
    }

    showCreateReservationModal() {
        notification.info('Create reservation modal would open here');
    }

    showScheduleView() {
        this.loadSchedule();
        notification.info('Schedule view loaded');
    }

    closeAllModals() {
        // Implementation for closing any open modals
    }

    // Utility methods
    getUserInitials() {
        const user = this.currentUser;
        if (user.first_name && user.last_name) {
            return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        }
        return user.username.substring(0, 2).toUpperCase();
    }

    showLoading(show) {
        let spinner = document.getElementById('loading-spinner');
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.id = 'loading-spinner';
            spinner.className = 'loading-spinner';
            spinner.innerHTML = `
                <div class="spinner"></div>
                <p>Loading...</p>
            `;
            document.body.appendChild(spinner);
        }
        spinner.style.display = show ? 'flex' : 'none';
    }

    showCommandPalette() {
        notification.info('Command palette would open here');
    }

    refreshData() {
        this.loadDashboardData();
        notification.success('Data refreshed');
    }

    manageUsers() {
        notification.info('User management would open here');
    }

    viewAnalytics() {
        notification.info('Analytics dashboard would open here');
    }

    showErrorScreen(error) {
        document.getElementById('app').innerHTML = `
            <div class="error-screen">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h1>Application Error</h1>
                    <p>Something went wrong while loading the application.</p>
                    <div class="error-details">
                        <details>
                            <summary>Technical Details</summary>
                            <pre>${error?.message || 'Unknown error'}</pre>
                        </details>
                    </div>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <i class="fas fa-redo"></i> Reload Application
                        </button>
                        <button class="btn btn-secondary" onclick="app.showAuthScreen()">
                            <i class="fas fa-home"></i> Return to Login
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async handleLogout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.clear();
            this.currentUser = null;
            this.labs = [];
            this.reservations = [];
            this.showAuthScreen();
            notification.show('Logged out successfully', 'info');
        }
    }

    // Additional methods for reservation actions
    async approveReservation(reservationId) {
        try {
            const response = await api.post(`/api/reservations/${reservationId}/approve`, {});
            if (response.success) {
                notification.show('Reservation approved!', 'success');
                await this.loadDashboardData();
            }
        } catch (error) {
            notification.show(error.message, 'error');
        }
    }

    async rejectReservation(reservationId) {
        const reason = prompt('Please enter rejection reason:');
        if (reason === null) return;

        try {
            const response = await api.post(`/api/reservations/${reservationId}/reject`, {
                rejection_reason: reason
            });
            if (response.success) {
                notification.show('Reservation rejected!', 'success');
                await this.loadDashboardData();
            }
        } catch (error) {
            notification.show(error.message, 'error');
        }
    }

    async editLab(labId) {
        notification.info(`Edit lab ${labId} functionality would open here`);
    }

    async deleteLab(labId) {
        if (confirm('Are you sure you want to delete this lab?')) {
            try {
                const response = await api.delete(`/api/labs/${labId}`);
                if (response.success) {
                    notification.show('Lab deleted successfully!', 'success');
                    await this.loadDashboardData();
                }
            } catch (error) {
                notification.show(error.message, 'error');
            }
        }
    }
}

// Initialize the application
try {
    const app = new ITLabScheduler();
    window.app = app;
} catch (error) {
    console.error('Failed to initialize application:', error);
    document.body.innerHTML = `
        <div class="error-screen">
            <div class="error-content">
                <h1>😵 Application Failed to Load</h1>
                <p>Please refresh the page or check your console for errors.</p>
                <button onclick="window.location.reload()">Reload Page</button>
            </div>
        </div>
    `;
}