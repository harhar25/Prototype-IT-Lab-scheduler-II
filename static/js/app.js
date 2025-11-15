class TaskManager {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
    }

    bindEvents() {
        // Auto-hide notification after 5 seconds
        document.addEventListener('click', () => {
            this.hideNotification();
        });
    }

    async checkAuth() {
        try {
            // Check if user is already logged in (in a real app, you'd verify with backend)
            const user = sessionStorage.getItem('currentUser');
            if (user) {
                this.currentUser = user;
                this.showTasksSection();
                await this.loadTasks();
            } else {
                this.showAuthSection();
            }
        } catch (error) {
            this.showError('Failed to check authentication');
            this.showAuthSection();
        }
    }

    async login(event) {
        event.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await this.apiCall('/api/login', 'POST', {
                username,
                password
            });

            if (response.success) {
                this.currentUser = response.user;
                sessionStorage.setItem('currentUser', this.currentUser);
                this.showSuccess('Login successful!');
                this.showTasksSection();
                await this.loadTasks();
                document.getElementById('login-form').reset();
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async register(event) {
        event.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await this.apiCall('/api/register', 'POST', {
                username,
                password
            });

            if (response.success) {
                this.showSuccess('Registration successful! Please login.');
                showTab('login');
                document.getElementById('register-form').reset();
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async logout() {
        try {
            await this.apiCall('/api/logout', 'POST');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            sessionStorage.removeItem('currentUser');
            this.tasks = [];
            this.showAuthSection();
            this.showSuccess('Logged out successfully');
        }
    }

    async loadTasks() {
        try {
            const response = await this.apiCall('/api/tasks', 'GET');
            this.tasks = response.tasks || [];
            this.renderTasks();
        } catch (error) {
            this.showError('Failed to load tasks');
        }
    }

    async addTask(event) {
        event.preventDefault();
        
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;

        try {
            const response = await this.apiCall('/api/tasks', 'POST', {
                title,
                description
            });

            if (response.success) {
                this.tasks.push(response.task);
                this.renderTasks();
                this.closeAddTaskModal();
                this.showSuccess('Task added successfully!');
                document.getElementById('add-task-form').reset();
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async updateTask(taskId, updates) {
        try {
            const response = await this.apiCall(`/api/tasks/${taskId}`, 'PUT', updates);
            
            if (response.success) {
                const taskIndex = this.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex] = response.task;
                    this.renderTasks();
                }
            }
        } catch (error) {
            this.showError('Failed to update task');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            const response = await this.apiCall(`/api/tasks/${taskId}`, 'DELETE');
            
            if (response.success) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.renderTasks();
                this.showSuccess('Task deleted successfully!');
            }
        } catch (error) {
            this.showError('Failed to delete task');
        }
    }

    renderTasks() {
        const container = document.getElementById('tasks-container');
        
        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="no-tasks">
                    <p>No tasks yet. Add your first task to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map(task => `
            <div class="task-card ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    </div>
                    <div class="task-actions">
                        <button onclick="app.toggleTask(${task.id}, ${!task.completed})" 
                                class="btn ${task.completed ? 'btn-secondary' : 'btn-success'}">
                            ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </button>
                        <button onclick="app.editTask(${task.id})" class="btn btn-primary">Edit</button>
                        <button onclick="app.deleteTask(${task.id})" class="btn btn-danger">Delete</button>
                    </div>
                </div>
                <div class="task-meta">
                    Created: ${new Date(task.created_at).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    }

    toggleTask(taskId, completed) {
        this.updateTask(taskId, { completed });
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const newTitle = prompt('Edit task title:', task.title);
            if (newTitle !== null && newTitle.trim() !== '') {
                this.updateTask(taskId, { title: newTitle.trim() });
            }
            
            const newDescription = prompt('Edit task description:', task.description);
            if (newDescription !== null) {
                this.updateTask(taskId, { description: newDescription });
            }
        }
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Request failed');
        }

        return result;
    }

    showAuthSection() {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('tasks-section').style.display = 'none';
        document.getElementById('nav-auth').style.display = 'none';
    }

    showTasksSection() {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('tasks-section').style.display = 'block';
        document.getElementById('nav-auth').style.display = 'flex';
        document.getElementById('user-welcome').textContent = `Welcome, ${this.currentUser}!`;
    }

    showAddTaskModal() {
        document.getElementById('add-task-modal').style.display = 'block';
    }

    closeAddTaskModal() {
        document.getElementById('add-task-modal').style.display = 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.style.display = 'none';
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

// Global functions for HTML event handlers
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

function login(event) {
    app.login(event);
}

function register(event) {
    app.register(event);
}

function logout() {
    app.logout();
}

function showAddTaskModal() {
    app.showAddTaskModal();
}

function closeAddTaskModal() {
    app.closeAddTaskModal();
}

function addTask(event) {
    app.addTask(event);
}

// Initialize app
const app = new TaskManager();

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('add-task-modal');
    if (event.target === modal) {
        app.closeAddTaskModal();
    }
}