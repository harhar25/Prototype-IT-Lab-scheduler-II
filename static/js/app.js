class EnterpriseTaskManager {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    async init() {
        this.setTheme(this.theme);
        this.bindEvents();
        await this.checkAuth();
    }

    bindEvents() {
        // Theme toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-theme-toggle]')) {
                this.toggleTheme();
            }
        });

        // Global error handler
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
    }

    async checkAuth() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showAuthScreen();
                return;
            }

            // Verify token by fetching profile
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
                            <i class="fas fa-tasks"></i> TaskFlow Pro
                        </div>
                        <p class="auth-subtitle">Enterprise Task Management Solution</p>
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
                
                notification.show('Welcome back!', 'success');
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
                last_name: document.getElementById('register-lastname').value
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
        document.getElementById('app').innerHTML = `
            <div class="dashboard">
                <nav class="navbar">
                    <div class="nav-container">
                        <a href="#" class="nav-brand">
                            <i class="fas fa-tasks"></i> TaskFlow Pro
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
                                <button class="btn btn-ghost" onclick="app.handleLogout()" title="Logout">
                                    <i class="fas fa-sign-out-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main class="main-content">
                    <div class="content-header">
                        <div class="header-left">
                            <h1>Task Dashboard</h1>
                            <p class="subtitle">Manage your tasks efficiently</p>
                        </div>
                        <button class="btn btn-primary" onclick="app.showCreateTaskModal()">
                            <i class="fas fa-plus"></i> New Task
                        </button>
                    </div>

                    <div class="stats-grid" id="stats-grid">
                        <!-- Stats will be loaded here -->
                    </div>

                    <div class="filters-section">
                        <div class="filter-group">
                            <label>Filter by Status:</label>
                            <select id="status-filter" onchange="app.filterTasks()">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Filter by Priority:</label>
                            <select id="priority-filter" onchange="app.filterTasks()">
                                <option value="all">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <button class="btn btn-secondary" onclick="app.clearFilters()">
                                <i class="fas fa-times"></i> Clear Filters
                            </button>
                        </div>
                    </div>

                    <div class="tasks-container" id="tasks-container">
                        <!-- Tasks will be loaded here -->
                    </div>
                </main>
            </div>

            <!-- Create Task Modal -->
            <div id="create-task-modal" class="modal-overlay hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Task</h3>
                        <button class="modal-close" onclick="app.hideCreateTaskModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="create-task-form" onsubmit="app.handleCreateTask(event)">
                            <div class="form-group">
                                <label class="form-label">Title *</label>
                                <input type="text" class="form-input" id="task-title" placeholder="Enter task title" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <textarea class="form-input" id="task-description" rows="4" placeholder="Enter task description"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Priority</label>
                                <select class="form-input" id="task-priority">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Due Date</label>
                                <input type="datetime-local" class="form-input" id="task-due-date">
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="app.hideCreateTaskModal()">
                                    Cancel
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-plus"></i> Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Update theme toggle icon
        const themeToggle = document.querySelector('[data-theme-toggle] i');
        if (themeToggle) {
            themeToggle.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    getUserInitials() {
        const user = this.currentUser;
        if (user.first_name && user.last_name) {
            return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        }
        return user.username.substring(0, 2).toUpperCase();
    }

    async loadDashboardData() {
        try {
            await this.loadTasks();
            this.updateStats();
        } catch (error) {
            notification.show('Failed to load dashboard data', 'error');
        }
    }

    async loadTasks() {
        try {
            const response = await api.get('/api/tasks');
            this.tasks = response.tasks || [];
            this.renderTasks();
        } catch (error) {
            throw error;
        }
    }

    renderTasks() {
        const container = document.getElementById('tasks-container');
        
        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks yet</h3>
                    <p>Create your first task to get started with task management</p>
                    <button class="btn btn-primary" onclick="app.showCreateTaskModal()">
                        <i class="fas fa-plus"></i> Create Your First Task
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map(task => `
            <div class="task-card ${task.status === 'completed' ? 'completed' : ''} ${task.priority}-priority">
                <div class="task-header">
                    <div class="task-title-section">
                        <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                        <div class="task-meta-badges">
                            <span class="status-badge status-${task.status}">
                                <i class="fas ${this.getStatusIcon(task.status)}"></i>
                                ${task.status.replace('_', ' ')}
                            </span>
                            <span class="priority-badge priority-${task.priority}">
                                <i class="fas fa-flag"></i>
                                ${task.priority}
                            </span>
                        </div>
                    </div>
                    <div class="task-actions">
                        ${task.status !== 'completed' ? `
                            <button class="btn btn-success btn-sm" onclick="app.updateTaskStatus('${task.id}', 'completed')" title="Mark Complete">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : `
                            <button class="btn btn-secondary btn-sm" onclick="app.updateTaskStatus('${task.id}', 'pending')" title="Mark Incomplete">
                                <i class="fas fa-undo"></i>
                            </button>
                        `}
                        <button class="btn btn-primary btn-sm" onclick="app.editTask('${task.id}')" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-error btn-sm" onclick="app.deleteTask('${task.id}')" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${task.description ? `
                    <p class="task-description">${this.escapeHtml(task.description)}</p>
                ` : ''}
                
                <div class="task-footer">
                    <div class="task-meta">
                        <div class="task-meta-item">
                            <i class="fas fa-calendar"></i>
                            Created: ${Helpers.formatDate(task.created_at)}
                        </div>
                        ${task.due_date ? `
                            <div class="task-meta-item ${this.isOverdue(task) ? 'overdue' : ''}">
                                <i class="fas fa-clock"></i>
                                Due: ${Helpers.formatDate(task.due_date)}
                                ${this.isOverdue(task) ? '<span class="overdue-badge">Overdue</span>' : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStatusIcon(status) {
        const icons = {
            pending: 'fa-clock',
            in_progress: 'fa-spinner',
            completed: 'fa-check-circle',
            cancelled: 'fa-times-circle'
        };
        return icons[status] || 'fa-tasks';
    }

    isOverdue(task) {
        if (!task.due_date || task.status === 'completed') return false;
        return new Date(task.due_date) < new Date();
    }

    updateStats() {
        const container = document.getElementById('stats-grid');
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const inProgress = this.tasks.filter(t => t.status === 'in_progress').length;
        const overdue = this.tasks.filter(t => this.isOverdue(t)).length;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon total">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="stat-value">${total}</div>
                <div class="stat-label">Total Tasks</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon completed">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-value">${completed}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon pending">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-value">${pending}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon overdue">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-value">${overdue}</div>
                <div class="stat-label">Overdue</div>
            </div>
        `;
    }

    showCreateTaskModal() {
        document.getElementById('create-task-modal').classList.remove('hidden');
    }

    hideCreateTaskModal() {
        document.getElementById('create-task-modal').classList.add('hidden');
        document.getElementById('create-task-form').reset();
    }

    async handleCreateTask(event) {
        event.preventDefault();
        this.showLoading(true);
        
        try {
            const formData = {
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-description').value,
                priority: document.getElementById('task-priority').value,
                due_date: document.getElementById('task-due-date').value || null
            };

            const response = await api.post('/api/tasks', formData);
            
            if (response.success) {
                this.tasks.push(response.task);
                this.renderTasks();
                this.updateStats();
                this.hideCreateTaskModal();
                notification.show('Task created successfully!', 'success');
            }
        } catch (error) {
            notification.show(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async updateTaskStatus(taskId, status) {
        try {
            const response = await api.put(`/api/tasks/${taskId}`, { status });
            
            if (response.success) {
                const taskIndex = this.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex] = response.task;
                    this.renderTasks();
                    this.updateStats();
                    notification.show('Task updated successfully!', 'success');
                }
            }
        } catch (error) {
            notification.show(error.message, 'error');
        }
    }

    async editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const newTitle = prompt('Edit task title:', task.title);
            if (newTitle !== null && newTitle.trim() !== '') {
                try {
                    const response = await api.put(`/api/tasks/${taskId}`, { 
                        title: newTitle.trim() 
                    });
                    
                    if (response.success) {
                        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
                        this.tasks[taskIndex] = response.task;
                        this.renderTasks();
                        notification.show('Task updated successfully!', 'success');
                    }
                } catch (error) {
                    notification.show(error.message, 'error');
                }
            }
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

        try {
            const response = await api.delete(`/api/tasks/${taskId}`);
            
            if (response.success) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.renderTasks();
                this.updateStats();
                notification.show('Task deleted successfully!', 'success');
            }
        } catch (error) {
            notification.show(error.message, 'error');
        }
    }

    filterTasks() {
        // This is a basic filter implementation
        // In a real app, you'd want to refetch from the server with filter parameters
        notification.show('Filter functionality would be implemented here', 'info');
    }

    clearFilters() {
        document.getElementById('status-filter').value = 'all';
        document.getElementById('priority-filter').value = 'all';
        notification.show('Filters cleared', 'info');
    }

    async handleLogout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.clear();
            this.currentUser = null;
            this.tasks = [];
            this.showAuthScreen();
            notification.show('Logged out successfully', 'info');
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
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
const app = new EnterpriseTaskManager();