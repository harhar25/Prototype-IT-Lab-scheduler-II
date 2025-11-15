class ITLabScheduler {
    constructor() {
        this.currentUser = null;
        this.labs = [];
        this.reservations = [];
        this.schedule = [];
        this.theme = localStorage.getItem('theme') || 'light';
        this.currentTab = 'pending-requests';
        this.init();
    }

    async init() {
        this.setTheme(this.theme);
        this.bindEvents();
        await this.checkAuth();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-theme-toggle]')) {
                this.toggleTheme();
            }
        });

        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        this.setTheme(this.theme === 'light' ? 'dark' : 'light');
        const themeIcon = document.querySelector('[data-theme-toggle] i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
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

    showAuthScreen() {
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
    }

    renderAuthForms() {
        const container = document.getElementById('auth-forms');
        container.innerHTML = `
            <div class="auth-tabs">
                <button class="tab-btn active" onclick="app.showAuthTab('login')">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
                <button class="tab-btn" onclick="app.showAuthTab('register')">
                    <i class="fas fa-user-plus"></i> Sign Up
                </button>
            </div>

            <div id="login-tab" class="tab-content active">
                <form id="login-form" onsubmit="app.handleLogin(event)">
                    <div class="form-group">
                        <label class="form-label" for="login-email">Email or Username</label>
                        <input type="text" id="login-email" class="form-input" placeholder="Enter your email or username" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="login-password">Password</label>
                        <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required>
                    </div>
                    <div class="form-group">
                        <a href="#" class="forgot-password">Forgot Password?</a>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </form>
            </div>

            <div id="register-tab" class="tab-content">
                <form id="register-form" onsubmit="app.handleRegister(event)">
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
    }

    showAuthTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');
    }

    async handleLogin(event) {
        event.preventDefault();
        this.showLoading(true);
        
        try {
            const response = await api.post('/auth/login', {
                login: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
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
            notification.show(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        this.showLoading(true);
        
        try {
            const response = await api.post('/auth/register', {
                username: document.getElementById('register-username').value,
                email: document.getElementById('register-email').value,
                password: document.getElementById('register-password').value,
                first_name: document.getElementById('register-firstname').value,
                last_name: document.getElementById('register-lastname').value,
                role: document.getElementById('register-role').value
            });

            if (response.success) {
                notification.show('Account created successfully! Please sign in.', 'success');
                this.showAuthTab('login');
                document.getElementById('register-form').reset();
            }
        } catch (error) {
            notification.show(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showDashboard() {
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
                <nav class="navbar">
                    <div class="nav-container">
                        <a href="#" class="nav-brand">
                            <i class="fas fa-laptop-code"></i> IT Lab Scheduler
                        </a>
                        <div class="nav-actions">
                            <button class="theme-toggle" data-theme-toggle title="Toggle theme">
                                <i class="fas ${this.theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>
                            </button>
                            <div class="user-menu">
                                <div class="avatar">
                                    ${this.getUserInitials()}
                                </div>
                                <span class="user-name">${this.currentUser.first_name || this.currentUser.username}</span>
                                <span class="user-role">${this.currentUser.role}</span>
                                <button class="btn btn-ghost" onclick="app.handleLogout()" title="Logout">
                                    <i class="fas fa-sign-out-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main class="main-content">
                    ${dashboardContent}
                </main>
            </div>

            <!-- Modals will be inserted here by JavaScript -->
        `;

        // Set today's date in date filter
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            const today = new Date().toISOString().split('T')[0];
            dateFilter.value = today;
        }
    }

    getAdminDashboard() {
        return `
            <div class="content-header">
                <div class="header-left">
                    <h1>Admin Dashboard</h1>
                    <p class="subtitle">Manage laboratories and reservations</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="app.showCreateLabModal()">
                        <i class="fas fa-plus"></i> Add Lab
                    </button>
                    <button class="btn btn-secondary" onclick="app.showScheduleView()">
                        <i class="fas fa-calendar"></i> View Schedule
                    </button>
                </div>
            </div>

            <div class="stats-grid" id="stats-grid">
                <!-- Stats will be loaded here -->
            </div>

            <div class="dashboard-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" onclick="app.showTab('pending-requests')">Pending Requests</button>
                    <button class="tab-btn" onclick="app.showTab('all-reservations')">All Reservations</button>
                    <button class="tab-btn" onclick="app.showTab('labs-management')">Labs Management</button>
                </div>
                
                <div id="pending-requests" class="tab-content active">
                    <div id="pending-requests-content"></div>
                </div>
                
                <div id="all-reservations" class="tab-content">
                    <div id="all-reservations-content"></div>
                </div>
                
                <div id="labs-management" class="tab-content">
                    <div id="labs-management-content"></div>
                </div>
            </div>
        `;
    }

    getInstructorDashboard() {
        return `
            <div class="content-header">
                <div class="header-left">
                    <h1>Instructor Dashboard</h1>
                    <p class="subtitle">Manage your lab reservations</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="app.showCreateReservationModal()">
                        <i class="fas fa-plus"></i> New Reservation
                    </button>
                    <button class="btn btn-secondary" onclick="app.showScheduleView()">
                        <i class="fas fa-calendar"></i> View Schedule
                    </button>
                </div>
            </div>

            <div class="stats-grid" id="stats-grid">
                <!-- Stats will be loaded here -->
            </div>

            <div class="dashboard-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" onclick="app.showTab('my-reservations')">My Reservations</button>
                    <button class="tab-btn" onclick="app.showTab('upcoming-sessions')">Upcoming Sessions</button>
                </div>
                
                <div id="my-reservations" class="tab-content active">
                    <div id="my-reservations-content"></div>
                </div>
                
                <div id="upcoming-sessions" class="tab-content">
                    <div id="upcoming-sessions-content"></div>
                </div>
            </div>
        `;
    }

    getStudentDashboard() {
        return `
            <div class="content-header">
                <div class="header-left">
                    <h1>Student Dashboard</h1>
                    <p class="subtitle">View lab schedules and availability</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="app.showScheduleView()">
                        <i class="fas fa-calendar"></i> View Schedule
                    </button>
                </div>
            </div>

            <div class="stats-grid" id="stats-grid">
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
        `;
    }

    async loadDashboardData() {
        try {
            // Load stats
            const statsResponse = await api.get('/api/stats');
            if (statsResponse.success) {
                this.updateStats(statsResponse.stats);
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

        } catch (error) {
            notification.show('Failed to load dashboard data', 'error');
        }
    }

    updateStats(stats) {
        const container = document.getElementById('stats-grid');
        if (!container) return;

        let statsHTML = '';
        
        if (this.currentUser.role === 'admin') {
            statsHTML = `
                <div class="stat-card">
                    <div class="stat-icon total">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="stat-value">${stats.total_labs || 0}</div>
                    <div class="stat-label">Total Labs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon completed">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-value">${stats.total_reservations || 0}</div>
                    <div class="stat-label">Total Reservations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon pending">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-value">${stats.pending_requests || 0}</div>
                    <div class="stat-label">Pending Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon approved">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-value">${stats.approved_reservations || 0}</div>
                    <div class="stat-label">Approved</div>
                </div>
            `;
        } else if (this.currentUser.role === 'instructor') {
            statsHTML = `
                <div class="stat-card">
                    <div class="stat-icon total">
                        <i class="fas fa-calendar"></i>
                    </div>
                    <div class="stat-value">${stats.my_reservations || 0}</div>
                    <div class="stat-label">My Reservations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon upcoming">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-value">${stats.upcoming_sessions || 0}</div>
                    <div class="stat-label">Upcoming Sessions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon pending">
                        <i class="fas fa-hourglass-half"></i>
                    </div>
                    <div class="stat-value">${stats.pending_requests || 0}</div>
                    <div class="stat-label">Pending Requests</div>
                </div>
            `;
        } else {
            statsHTML = `
                <div class="stat-card">
                    <div class="stat-icon total">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="stat-value">${stats.available_labs || 0}</div>
                    <div class="stat-label">Available Labs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon sessions">
                        <i class="fas fa-calendar"></i>
                    </div>
                    <div class="stat-value">${stats.scheduled_sessions || 0}</div>
                    <div class="stat-label">Scheduled Sessions</div>
                </div>
            `;
        }

        container.innerHTML = statsHTML;
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
            container.innerHTML = '<div class="empty-state">No pending requests</div>';
            return;
        }

        container.innerHTML = pendingReservations.map(reservation => `
            <div class="reservation-card pending">
                <div class="reservation-header">
                    <h4>${reservation.course_code} - ${reservation.course_name}</h4>
                    <span class="status-badge status-pending">Pending</span>
                </div>
                <div class="reservation-details">
                    <p><strong>Instructor:</strong> ${reservation.instructor_name}</p>
                    <p><strong>Section:</strong> ${reservation.section}</p>
                    <p><strong>Lab:</strong> ${reservation.lab_name}</p>
                    <p><strong>Date & Time:</strong> ${Helpers.formatDate(reservation.start_time)}</p>
                    <p><strong>Duration:</strong> ${reservation.duration_minutes} minutes</p>
                    ${reservation.purpose ? `<p><strong>Purpose:</strong> ${reservation.purpose}</p>` : ''}
                </div>
                <div class="reservation-actions">
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
            container.innerHTML = '<div class="empty-state">No reservations found</div>';
            return;
        }

        container.innerHTML = this.reservations.map(reservation => `
            <div class="reservation-card ${reservation.status}">
                <div class="reservation-header">
                    <h4>${reservation.course_code} - ${reservation.course_name}</h4>
                    <span class="status-badge status-${reservation.status}">${reservation.status}</span>
                </div>
                <div class="reservation-details">
                    <p><strong>Instructor:</strong> ${reservation.instructor_name}</p>
                    <p><strong>Section:</strong> ${reservation.section}</p>
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
            container.innerHTML = '<div class="empty-state">No labs found</div>';
            return;
        }

        container.innerHTML = this.labs.map(lab => `
            <div class="lab-card">
                <div class="lab-header">
                    <h4>${lab.name}</h4>
                    <span class="lab-status ${lab.is_active ? 'active' : 'inactive'}">
                        ${lab.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="lab-details">
                    <p><strong>Location:</strong> ${lab.location || 'Not specified'}</p>
                    <p><strong>Capacity:</strong> ${lab.capacity} students</p>
                    <p><strong>Equipment:</strong> ${lab.equipment || 'Standard equipment'}</p>
                </div>
                <div class="lab-actions">
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

    renderMyReservations() {
        const container = document.getElementById('my-reservations-content');
        if (!container) return;

        const myReservations = this.reservations.filter(r => r.instructor_id === this.currentUser.id);
        
        if (myReservations.length === 0) {
            container.innerHTML = '<div class="empty-state">You have no reservations</div>';
            return;
        }

        container.innerHTML = myReservations.map(reservation => `
            <div class="reservation-card ${reservation.status}">
                <div class="reservation-header">
                    <h4>${reservation.course_code} - ${reservation.course_name}</h4>
                    <span class="status-badge status-${reservation.status}">${reservation.status}</span>
                </div>
                <div class="reservation-details">
                    <p><strong>Section:</strong> ${reservation.section}</p>
                    <p><strong>Lab:</strong> ${reservation.lab_name}</p>
                    <p><strong>Date & Time:</strong> ${Helpers.formatDate(reservation.start_time)}</p>
                    <p><strong>Duration:</strong> ${reservation.duration_minutes} minutes</p>
                    ${reservation.purpose ? `<p><strong>Purpose:</strong> ${reservation.purpose}</p>` : ''}
                    ${reservation.rejection_reason ? `<p><strong>Rejection Reason:</strong> ${reservation.rejection_reason}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderUpcomingSessions() {
        const container = document.getElementById('upcoming-sessions-content');
        if (!container) return;

        const now = new Date();
        const upcomingSessions = this.reservations.filter(r => 
            r.instructor_id === this.currentUser.id && 
            r.status === 'approved' &&
            new Date(r.start_time) > now
        );

        if (upcomingSessions.length === 0) {
            container.innerHTML = '<div class="empty-state">No upcoming sessions</div>';
            return;
        }

        container.innerHTML = upcomingSessions.map(reservation => `
            <div class="reservation-card upcoming">
                <div class="reservation-header">
                    <h4>${reservation.course_code} - ${reservation.course_name}</h4>
                    <span class="status-badge status-approved">Approved</span>
                </div>
                <div class="reservation-details">
                    <p><strong>Section:</strong> ${reservation.section}</p>
                    <p><strong>Lab:</strong> ${reservation.lab_name}</p>
                    <p><strong>Date & Time:</strong> ${Helpers.formatDate(reservation.start_time)}</p>
                    <p><strong>Duration:</strong> ${reservation.duration_minutes} minutes</p>
                </div>
            </div>
        `).join('');
    }

    async loadSchedule() {
        const container = document.getElementById('schedule-view');
        if (!container) return;

        try {
            const labId = document.getElementById('lab-filter')?.value || '';
            const date = document.getElementById('date-filter')?.value || '';
            
            const response = await api.get(`/api/schedule?lab_id=${labId}&date=${date}`);
            if (response.success) {
                this.schedule = response.schedule;
                this.renderSchedule();
            }
        } catch (error) {
            notification.show('Failed to load schedule', 'error');
        }
    }

    renderSchedule() {
        const container = document.getElementById('schedule-view');
        if (!container) return;

        if (this.schedule.length === 0) {
            container.innerHTML = '<div class="empty-state">No scheduled sessions for selected criteria</div>';
            return;
        }

        container.innerHTML = this.schedule.map(session => `
            <div class="schedule-slot ${session.status}">
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

    showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');
        
        this.currentTab = tabName;
    }

    showCreateLabModal() {
        const modal = modalManager.createModal('create-lab-modal', `
            <form id="create-lab-form" onsubmit="app.handleCreateLab(event)">
                <div class="form-group">
                    <label class="form-label">Lab Name *</label>
                    <input type="text" class="form-input" id="lab-name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-input" id="lab-location">
                </div>
                <div class="form-group">
                    <label class="form-label">Capacity</label>
                    <input type="number" class="form-input" id="lab-capacity" value="30" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Equipment</label>
                    <textarea class="form-input" id="lab-equipment" rows="3" placeholder="Describe available equipment"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input" id="lab-description" rows="3" placeholder="Lab description"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modalManager.close('create-lab-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Lab</button>
                </div>
            </form>
        `, { title: 'Create New Lab' });

        modalManager.open('create-lab-modal');
    }

    async handleCreateLab(event) {
        event.preventDefault();
        this.showLoading(true);

        try {
            const response = await api.post('/api/labs', {
                name: document.getElementById('lab-name').value,
                location: document.getElementById('lab-location').value,
                capacity: parseInt(document.getElementById('lab-capacity').value),
                equipment: document.getElementById('lab-equipment').value,
                description: document.getElementById('lab-description').value
            });

            if (response.success) {
                modalManager.close('create-lab-modal');
                notification.show('Lab created successfully!', 'success');
                await this.loadDashboardData(); // Refresh data
            }
        } catch (error) {
            notification.show(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showCreateReservationModal() {
        if (this.labs.length === 0) {
            notification.show('No labs available for reservation', 'error');
            return;
        }

        const labsOptions = this.labs.map(lab => 
            `<option value="${lab.id}">${lab.name}</option>`
        ).join('');

        const modal = modalManager.createModal('create-reservation-modal', `
            <form id="create-reservation-form" onsubmit="app.handleCreateReservation(event)">
                <div class="form-group">
                    <label class="form-label">Lab *</label>
                    <select class="form-input" id="reservation-lab" required>
                        <option value="">Select a lab</option>
                        ${labsOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Course Code *</label>
                    <input type="text" class="form-input" id="reservation-course-code" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Course Name *</label>
                    <input type="text" class="form-input" id="reservation-course-name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Section *</label>
                    <input type="text" class="form-input" id="reservation-section" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Student Count</label>
                    <input type="number" class="form-input" id="reservation-student-count" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Start Time *</label>
                    <input type="datetime-local" class="form-input" id="reservation-start-time" required>
                </div>
                <div class="form-group">
                    <label class="form-label">End Time *</label>
                    <input type="datetime-local" class="form-input" id="reservation-end-time" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Purpose</label>
                    <textarea class="form-input" id="reservation-purpose" rows="3" placeholder="Purpose of the reservation"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modalManager.close('create-reservation-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Request</button>
                </div>
            </form>
        `, { title: 'New Reservation Request' });

        modalManager.open('create-reservation-modal');
    }

    async handleCreateReservation(event) {
        event.preventDefault();
        this.showLoading(true);

        try {
            const response = await api.post('/api/reservations', {
                lab_id: document.getElementById('reservation-lab').value,
                course_code: document.getElementById('reservation-course-code').value,
                course_name: document.getElementById('reservation-course-name').value,
                section: document.getElementById('reservation-section').value,
                student_count: parseInt(document.getElementById('reservation-student-count').value) || 0,
                start_time: document.getElementById('reservation-start-time').value,
                end_time: document.getElementById('reservation-end-time').value,
                purpose: document.getElementById('reservation-purpose').value
            });

            if (response.success) {
                modalManager.close('create-reservation-modal');
                notification.show('Reservation request submitted successfully!', 'success');
                await this.loadDashboardData(); // Refresh data
            }
        } catch (error) {
            notification.show(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async approveReservation(reservationId) {
        try {
            const response = await api.post(`/api/reservations/${reservationId}/approve`, {});
            if (response.success) {
                notification.show('Reservation approved!', 'success');
                await this.loadDashboardData(); // Refresh data
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
                await this.loadDashboardData(); // Refresh data
            }
        } catch (error) {
            notification.show(error.message, 'error');
        }
    }

    showScheduleView() {
        // For now, just load the schedule
        this.loadSchedule();
        
        // Scroll to schedule view if student
        if (this.currentUser.role === 'student') {
            document.getElementById('schedule-view').scrollIntoView({ behavior: 'smooth' });
        } else {
            notification.show('Schedule view loaded', 'info');
        }
    }

    getUserInitials() {
        const user = this.currentUser;
        if (user.first_name && user.last_name) {
            return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        }
        return user.username.substring(0, 2).toUpperCase();
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
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

    handleGlobalError(event) {
        console.error('Global error:', event.error);
        notification.show('An unexpected error occurred', 'error');
    }

    handlePromiseRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        notification.show('An unexpected error occurred', 'error');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the application
const app = new ITLabScheduler();