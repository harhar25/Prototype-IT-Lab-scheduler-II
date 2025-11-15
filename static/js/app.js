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

            // Verify token validity (in real app, you'd call an endpoint)
            this.currentUser = JSON.parse(localStorage.getItem('user_data'));
            if (this.currentUser) {
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
        document.body.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="auth-logo">
                            <i class="fas fa-tasks"></i> TaskFlow
                        </div>
                        <p class="auth-subtitle">Enterprise Task Management</p>
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
                <button class="tab-btn active" onclick="app.showTab('login')">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
                <button class="tab-btn" onclick="app.showTab('register')">
                    <i class="fas fa-user-plus"></i> Sign Up
                </button>
            </div>

            <div id="login-tab" class="tab-content active">
                <form id="login-form" onsubmit="app.handleLogin(event)">
                    <div class="form-group">
                        <label class="form-label" for="login-email">Email or Username</label>
                        <input type="text" id="login-email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="login-password">Password</label>
                        <input type="password" id="login-password" class="form-input" required>
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
                        <input type="text" id="register-username" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-email">Email</label>
                        <input type="email" id="register-email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-password">Password</label>
                        <input type="password" id="register-password" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-firstname">First Name</label>
                        <input type="text" id="register-firstname" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="register-lastname">Last Name</label>
                        <input type="text" id="register-lastname" class="form-input">
                    </div>
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                </form>
            </div>
        `;
    }

    showTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');
    }

    async handleLogin(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
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
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
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
                this.showTab('login');
                event.target.reset();
            }
        } catch (error) {
            notification.show(error.message, 'error');
        }
    }

    showDashboard() {
        document.body.innerHTML = `
            <div class="dashboard">
                <nav class="navbar">
                    <div class="nav-container">
                        <a href="#" class="nav-brand">
                            <i class="fas fa-tasks"></i> TaskFlow
                        </a>
                        <div class="nav-actions">
                            <button class="theme-toggle" data-theme-toggle>
                                <i class="fas fa-moon"></i>
                            </button>
                            <div class="user-menu">
                                <div class="avatar">
                                    ${this.getUserInitials()}
                                </div>
                                <span>${this.currentUser.first_name || this.currentUser.username}</span>
                                <button class="btn btn-ghost" onclick="app.handleLogout()">
                                    <i class="fas fa-sign-out-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main class="main-content">
                    <div class="content-header">
                        <h1>Dashboard</h1>
                        <button class="btn btn-primary" onclick="app.showCreateTaskModal()">
                            <i class="fas fa-plus"></i> New Task
                        </button>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="total-tasks">0</div>
                            <div class="stat-label">Total Tasks</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="completed-tasks">0</div>
                            <div class="stat-label">Completed</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="pending-tasks">0</div>
                            <div class="stat-label">Pending</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="overdue-tasks">0</div>
                            <div class="stat-label">Overdue</div>
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
                                <label class="form-label">Title</label>
                                <input type="text" class="form-input" id="task-title" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <textarea class="form-input" id="task-description" rows="4"></textarea>
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
                            <div class="flex gap-4">
                                <button type="button" class="btn btn-secondary flex-1" onclick="app.hideCreateTaskModal()">
                                    Cancel
                                </button>
                                <button type="submit" class="btn btn-primary flex-1">
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
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
                <div class="text-center mt-4">
                    <i class="fas fa-tasks" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary);">No tasks yet</h3>
                    <p style="color: var(--text-light);">Create your first task to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map(task => `
            <div class="task-card ${task.status === 'completed' ? 'completed' : ''} ${task.priority}-priority">
                <div class="task-header">
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                    <div class="flex items-center gap-2">
                        <span class="status-badge status-${task.status}">
                            ${task.status.replace('_', ' ')}
                        </span>
                        <div class="task-actions">
                            ${task.status !== 'completed' ? `
                                <button class="btn btn-success btn-sm" onclick="app.updateTaskStatus('${task.id}', 'completed')">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-primary btn-sm" onclick="app.editTask('${task.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-error btn-sm" onclick="app.deleteTask('${task.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                ${task.description ? `
                    <p class="task-description">${this.escapeHtml(task.description)}</p>
                ` : ''}
                
                <div class="task-meta">
                    <div class="task-meta-item">
                        <i class="fas fa-flag" style="color: ${this.getPriorityColor(task.priority)}"></i>
                        ${task.priority}
                    </div>
                    ${task.due_date ? `
                        <div class="task-meta-item">
                            <i class="fas fa-calendar"></i>
                            ${new Date(task.due_date).toLocaleDateString()}
                        </div>
                    ` : ''}
                    <div class="task-meta-item">
                        <i class="fas fa-clock"></i>
                        ${new Date(task.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getPriorityColor(priority) {
        const colors = {
            low: 'var(--info)',
            medium: 'var(--warning)',
            high: 'var(--error)',
            urgent: 'var(--error)'
        };
        return colors[priority] || 'var(--text-light)';
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const overdue = this.tasks.filter(t => 
            t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
        ).length;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('pending-tasks').textContent = pending;
        document.getElementById('overdue-tasks').textContent = overdue;
    }

    showCreateTaskModal() {
        document.getElementById('create-task-modal').classList.remove('hidden');
    }

    hideCreateTaskModal() {
        document.getElementById('create-task-modal').classList.add('hidden');
    }

    async handleCreateTask(event) {
        event.preventDefault();
        
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
                document.getElementById('create-task-form').reset();
                notification.show('Task created successfully!', 'success');
            }
        } catch (error) {
            notification.show(error.message, 'error');
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

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

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