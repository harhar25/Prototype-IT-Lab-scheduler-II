/**
 * Enterprise IT Lab Scheduler - Complete Enhanced Version
 * Advanced Laboratory Management System
 */

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
    }

    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.showCommandPalette();
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
            'show-tab': () => {
                const tab = element.dataset.tab;
                this.showEnhancedTab(tab);
            }
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
                        <a href="#" class="forgot-password" data-action="forgot-password">Forgot Password?</a>
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
                this.handleForgotPassword();
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

    handleForgotPassword() {
        notification.info('Password reset feature would open here');
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
                            <h1 class="dashboard-title">Admin Dashboard</h1>
                            <p class="dashboard-subtitle">Laboratory Utilization Management System</p>
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
                            <button class="btn btn-outline btn-icon" data-action="refresh">
                                <i class="fas fa-sync-alt"></i>
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Enhanced Stats Grid -->
                <div class="stats-section">
                    <div class="section-header">
                        <h2>Performance Overview</h2>
                        <div class="time-filter">
                            <select id="time-range" onchange="app.loadDashboardData()">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month" selected>This Month</option>
                            </select>
                        </div>
                    </div>
                    <div class="stats-grid-enhanced" id="stats-grid">
                        <!-- Dynamic stats will be loaded here -->
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions-section">
                    <h2>Quick Actions</h2>
                    <div class="quick-actions-grid">
                        <div class="quick-action-card" data-action="create-reservation">
                            <div class="action-icon">
                                <i class="fas fa-calendar-plus"></i>
                            </div>
                            <div class="action-content">
                                <h3>New Reservation</h3>
                                <p>Create a new lab reservation request</p>
                            </div>
                            <div class="action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                        <div class="quick-action-card" data-action="view-schedule">
                            <div class="action-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="action-content">
                                <h3>View Schedule</h3>
                                <p>Check lab availability and schedules</p>
                            </div>
                            <div class="action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                        <div class="quick-action-card" onclick="app.manageUsers()">
                            <div class="action-icon">
                                <i class="fas fa-users-cog"></i>
                            </div>
                            <div class="action-content">
                                <h3>Manage Users</h3>
                                <p>View and manage system users</p>
                            </div>
                            <div class="action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                        <div class="quick-action-card" onclick="app.viewAnalytics()">
                            <div class="action-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="action-content">
                                <h3>Analytics</h3>
                                <p>View usage statistics and reports</p>
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
                            <button class="tab-btn" data-tab="all-reservations">
                                <i class="fas fa-calendar-check"></i>
                                All Reservations
                            </button>
                            <button class="tab-btn" data-tab="labs-management">
                                <i class="fas fa-laptop-house"></i>
                                Labs Management
                            </button>
                        </div>
                    </div>

                    <div class="tab-content active" id="pending-requests-tab">
                        <div id="pending-requests-content"></div>
                    </div>
                    
                    <div class="tab-content" id="all-reservations-tab">
                        <div id="all-reservations-content"></div>
                    </div>
                    
                    <div class="tab-content" id="labs-management-tab">
                        <div id="labs-management-content"></div>
                    </div>
                </div>

                <!-- Upcoming Schedule -->
                <div class="schedule-preview">
                    <div class="section-header">
                        <h2>Upcoming Schedule</h2>
                        <a href="#" data-action="view-schedule" class="view-all-link">
                            View All
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                    <div class="schedule-cards" id="upcoming-schedule">
                        <!-- Upcoming sessions will be loaded here -->
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
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Load stats
            const statsResponse = await api.get('/api/stats');
            if (statsResponse.success) {
                this.stats = statsResponse.stats;
                this.updateEnhancedStats(this.stats);
                this.updateHeaderStats(this.stats);
            }

            // Load labs
            const labsResponse = await api.get('/api/labs');
            if (labsResponse.success) {
                this.labs = labsResponse.labs;
                this.updateLabFilters();
            }

            // Load reservations based on role
            const reservationsResponse = await api.get('/api/reservations');
            if (reservationsResponse.success) {
                this.reservations = reservationsResponse.reservations;
                this.renderRoleSpecificContent();
            }

            // Load upcoming schedule
            await this.loadSchedule();

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            notification.error('Failed to load dashboard data');
        } finally {
            this.showLoading(false);
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
        const pendingBadge = document.getElementById('pending-badge');

        if (totalLabs) totalLabs.textContent = stats.total_labs || 0;
        if (pendingRequests) pendingRequests.textContent = stats.pending_requests || 0;
        if (utilizationRate) utilizationRate.textContent = stats.utilization_rate || '0%';
        if (pendingBadge) pendingBadge.textContent = stats.pending_requests || 0;
    }

    updateLabFilters() {
        const labFilter = document.getElementById('lab-filter');
        if (!labFilter) return;

        labFilter.innerHTML = '<option value="">All Labs</option>';
        this.labs.forEach(lab => {
            labFilter.innerHTML += `<option value="${lab.id}">${lab.name}</option>`;
        });
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