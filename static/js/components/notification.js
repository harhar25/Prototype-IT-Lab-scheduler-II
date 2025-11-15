/**
 * Notification System for IT Lab Scheduler
 * Enhanced notification component with multiple types and animations
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.position = 'top-right';
        this.zIndex = 10000;
        this.autoRemove = true;
        this.duration = 5000;
        this.maxNotifications = 5;
        
        this.init();
    }

    /**
     * Initialize notification system
     */
    init() {
        this.createContainer();
        this.bindGlobalEvents();
    }

    /**
     * Create notification container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        this.container.setAttribute('data-position', this.position);
        this.container.style.cssText = `
            position: fixed;
            z-index: ${this.zIndex};
            max-width: 400px;
            pointer-events: none;
        `;

        this.updateContainerPosition();
        document.body.appendChild(this.container);
    }

    /**
     * Update container position based on configuration
     */
    updateContainerPosition() {
        const positions = {
            'top-right': {
                top: '20px',
                right: '20px',
                bottom: 'auto',
                left: 'auto'
            },
            'top-left': {
                top: '20px',
                left: '20px',
                right: 'auto',
                bottom: 'auto'
            },
            'bottom-right': {
                bottom: '20px',
                right: '20px',
                top: 'auto',
                left: 'auto'
            },
            'bottom-left': {
                bottom: '20px',
                left: '20px',
                top: 'auto',
                right: 'auto'
            },
            'top-center': {
                top: '20px',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                transform: 'translateX(-50%)'
            },
            'bottom-center': {
                bottom: '20px',
                left: '50%',
                right: 'auto',
                top: 'auto',
                transform: 'translateX(-50%)'
            }
        };

        const position = positions[this.position] || positions['top-right'];
        Object.assign(this.container.style, position);
    }

    /**
     * Bind global events
     */
    bindGlobalEvents() {
        // Handle escape key to close all notifications
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAllTimers();
            } else {
                this.resumeAllTimers();
            }
        });
    }

    /**
     * Show notification
     */
    show(message, type = 'info', duration = null, options = {}) {
        const notificationId = Helpers.generateId();
        const actualDuration = duration !== null ? duration : this.duration;

        const notification = {
            id: notificationId,
            message,
            type,
            duration: actualDuration,
            createdAt: Date.now(),
            paused: false,
            remainingTime: actualDuration,
            timer: null,
            element: null,
            ...options
        };

        // Remove oldest notification if we've reached the maximum
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = Array.from(this.notifications.keys())[0];
            this.close(oldestId);
        }

        this.notifications.set(notificationId, notification);
        this.renderNotification(notification);

        if (this.autoRemove && actualDuration > 0) {
            this.startTimer(notificationId);
        }

        return notificationId;
    }

    /**
     * Render notification element
     */
    renderNotification(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.setAttribute('data-notification-id', notification.id);
        
        const icon = this.getIcon(notification.type);
        const progressBar = this.autoRemove && notification.duration > 0 ? 
            `<div class="notification-progress" style="animation-duration: ${notification.duration}ms"></div>` : '';

        element.innerHTML = `
            ${progressBar}
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                <button class="notification-close" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add click event for close button
        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.close(notification.id);
        });

        // Add click event for notification (if click handler provided)
        if (notification.onClick) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-close')) {
                    notification.onClick(notification);
                }
            });
        }

        this.container.appendChild(element);
        notification.element = element;

        // Animate in
        requestAnimationFrame(() => {
            element.classList.add('notification-enter');
        });

        // Trigger onShow callback
        if (notification.onShow) {
            notification.onShow(notification);
        }
    }

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            loading: '<i class="fas fa-spinner fa-spin"></i>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Start auto-remove timer
     */
    startTimer(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification || notification.paused) return;

        notification.timer = setTimeout(() => {
            this.close(notificationId);
        }, notification.remainingTime);
    }

    /**
     * Pause notification timer
     */
    pauseTimer(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification || !notification.timer) return;

        clearTimeout(notification.timer);
        notification.paused = true;
        notification.remainingTime -= (Date.now() - notification.createdAt);
    }

    /**
     * Resume notification timer
     */
    resumeTimer(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification || !notification.paused) return;

        notification.paused = false;
        notification.createdAt = Date.now();
        this.startTimer(notificationId);
    }

    /**
     * Pause all notification timers
     */
    pauseAllTimers() {
        this.notifications.forEach((notification, id) => {
            if (notification.timer && !notification.paused) {
                this.pauseTimer(id);
            }
        });
    }

    /**
     * Resume all notification timers
     */
    resumeAllTimers() {
        this.notifications.forEach((notification, id) => {
            if (notification.paused) {
                this.resumeTimer(id);
            }
        });
    }

    /**
     * Close specific notification
     */
    close(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;

        // Clear timer
        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        // Animate out
        if (notification.element) {
            notification.element.classList.remove('notification-enter');
            notification.element.classList.add('notification-exit');

            // Remove after animation
            setTimeout(() => {
                if (notification.element && notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
            }, 300);
        }

        // Trigger onClose callback
        if (notification.onClose) {
            notification.onClose(notification);
        }

        this.notifications.delete(notificationId);
    }

    /**
     * Close all notifications
     */
    closeAll() {
        const notificationIds = Array.from(this.notifications.keys());
        notificationIds.forEach(id => this.close(id));
    }

    /**
     * Update notification message
     */
    update(notificationId, message, type = null) {
        const notification = this.notifications.get(notificationId);
        if (!notification || !notification.element) return;

        if (message) {
            const messageEl = notification.element.querySelector('.notification-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
            notification.message = message;
        }

        if (type && type !== notification.type) {
            // Update type
            notification.element.classList.remove(`notification-${notification.type}`);
            notification.element.classList.add(`notification-${type}`);
            
            const iconEl = notification.element.querySelector('.notification-icon');
            if (iconEl) {
                iconEl.innerHTML = this.getIcon(type);
            }
            
            notification.type = type;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Configure notification system
     */
    configure(options) {
        const allowedOptions = ['position', 'zIndex', 'autoRemove', 'duration', 'maxNotifications'];
        
        allowedOptions.forEach(option => {
            if (options[option] !== undefined) {
                this[option] = options[option];
            }
        });

        if (options.position && this.container) {
            this.updateContainerPosition();
        }
    }

    /**
     * Get notification count
     */
    getCount() {
        return this.notifications.size;
    }

    /**
     * Check if notification exists
     */
    exists(notificationId) {
        return this.notifications.has(notificationId);
    }

    /**
     * Show success notification
     */
    success(message, duration, options) {
        return this.show(message, 'success', duration, options);
    }

    /**
     * Show error notification
     */
    error(message, duration, options) {
        return this.show(message, 'error', duration, options);
    }

    /**
     * Show warning notification
     */
    warning(message, duration, options) {
        return this.show(message, 'warning', duration, options);
    }

    /**
     * Show info notification
     */
    info(message, duration, options) {
        return this.show(message, 'info', duration, options);
    }

    /**
     * Show loading notification
     */
    loading(message, duration = 0, options = {}) {
        return this.show(message, 'loading', duration, options);
    }

    /**
     * Show notification with custom HTML
     */
    html(htmlContent, type = 'info', duration, options) {
        const notificationId = this.show('', type, duration, {
            ...options,
            allowHtml: true
        });

        const notification = this.notifications.get(notificationId);
        if (notification && notification.element) {
            const messageEl = notification.element.querySelector('.notification-message');
            if (messageEl) {
                messageEl.innerHTML = htmlContent;
            }
        }

        return notificationId;
    }

    /**
     * Show confirmation dialog as notification
     */
    confirm(message, onConfirm, onCancel = null, confirmText = 'Confirm', cancelText = 'Cancel') {
        const notificationId = this.show(message, 'info', 0, {
            allowHtml: true
        });

        const notification = this.notifications.get(notificationId);
        if (notification && notification.element) {
            const messageEl = notification.element.querySelector('.notification-message');
            if (messageEl) {
                messageEl.innerHTML = `
                    <div class="notification-confirm">
                        <div class="confirm-message">${this.escapeHtml(message)}</div>
                        <div class="confirm-actions">
                            <button class="btn btn-sm btn-primary confirm-btn">${confirmText}</button>
                            <button class="btn btn-sm btn-ghost cancel-btn">${cancelText}</button>
                        </div>
                    </div>
                `;

                const confirmBtn = messageEl.querySelector('.confirm-btn');
                const cancelBtn = messageEl.querySelector('.cancel-btn');

                confirmBtn.addEventListener('click', () => {
                    this.close(notificationId);
                    if (onConfirm) onConfirm();
                });

                cancelBtn.addEventListener('click', () => {
                    this.close(notificationId);
                    if (onCancel) onCancel();
                });
            }
        }

        return notificationId;
    }

    /**
     * Show notification with action buttons
     */
    action(message, actions, type = 'info', duration = 0) {
        const notificationId = this.show(message, type, duration, {
            allowHtml: true
        });

        const notification = this.notifications.get(notificationId);
        if (notification && notification.element) {
            const messageEl = notification.element.querySelector('.notification-message');
            if (messageEl) {
                const actionsHtml = actions.map(action => 
                    `<button class="btn btn-sm ${action.primary ? 'btn-primary' : 'btn-ghost'} action-btn" data-action="${action.name}">${action.label}</button>`
                ).join('');

                messageEl.innerHTML = `
                    <div class="notification-action">
                        <div class="action-message">${this.escapeHtml(message)}</div>
                        <div class="action-buttons">${actionsHtml}</div>
                    </div>
                `;

                const actionBtns = messageEl.querySelectorAll('.action-btn');
                actionBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const actionName = btn.dataset.action;
                        const action = actions.find(a => a.name === actionName);
                        if (action && action.callback) {
                            action.callback(notificationId);
                        }
                    });
                });
            }
        }

        return notificationId;
    }
}

// Create global notification instance
const notification = new NotificationSystem();

// Add CSS styles for notifications
const notificationStyles = `
.notifications-container {
    pointer-events: none;
}

.notification {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-light);
    margin-bottom: var(--space-sm);
    max-width: 400px;
    pointer-events: all;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s var(--transition-bounce);
}

.notification-enter {
    transform: translateX(0);
    opacity: 1;
}

.notification-exit {
    transform: translateX(100%);
    opacity: 0;
}

.notification-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: var(--primary);
    animation: progress linear forwards;
    transform-origin: left;
}

@keyframes progress {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
}

.notification-content {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
    padding: var(--space-lg);
}

.notification-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.notification-success .notification-icon { color: var(--success); }
.notification-error .notification-icon { color: var(--error); }
.notification-warning .notification-icon { color: var(--warning); }
.notification-info .notification-icon { color: var(--info); }
.notification-loading .notification-icon { color: var(--primary); }

.notification-message {
    flex: 1;
    color: var(--text-primary);
    font-weight: 500;
    line-height: 1.4;
}

.notification-close {
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    transition: var(--transition-normal);
    flex-shrink: 0;
}

.notification-close:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
}

.notification-confirm,
.notification-action {
    width: 100%;
}

.confirm-message,
.action-message {
    margin-bottom: var(--space-md);
    color: var(--text-primary);
}

.confirm-actions,
.action-buttons {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
}

/* Position variations */
.notifications-container[data-position="top-left"] .notification {
    transform: translateX(-100%);
}

.notifications-container[data-position="top-left"] .notification-enter {
    transform: translateX(0);
}

.notifications-container[data-position="top-left"] .notification-exit {
    transform: translateX(-100%);
}

.notifications-container[data-position="top-center"] .notification,
.notifications-container[data-position="bottom-center"] .notification {
    transform: translateY(-100%);
}

.notifications-container[data-position="top-center"] .notification-enter,
.notifications-container[data-position="bottom-center"] .notification-enter {
    transform: translateY(0);
}

.notifications-container[data-position="top-center"] .notification-exit,
.notifications-container[data-position="bottom-center"] .notification-exit {
    transform: translateY(-100%);
}

.notifications-container[data-position="bottom-right"] .notification,
.notifications-container[data-position="bottom-left"] .notification {
    transform: translateY(100%);
}

.notifications-container[data-position="bottom-right"] .notification-enter,
.notifications-container[data-position="bottom-left"] .notification-enter {
    transform: translateY(0);
}

.notifications-container[data-position="bottom-right"] .notification-exit,
.notifications-container[data-position="bottom-left"] .notification-exit {
    transform: translateY(100%);
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Make notification available globally
window.notification = notification;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = notification;
}