class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications');
        this.notificationCount = 0;
        this.maxNotifications = 5;
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }

        // Add global styles for notifications
        this.injectStyles();
    }

    injectStyles() {
        const styles = `
            .notifications-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
                pointer-events: none;
            }

            .notification {
                background: var(--bg-primary);
                border-radius: var(--radius-xl);
                padding: 16px 20px;
                box-shadow: var(--shadow-xl);
                border-left: 6px solid var(--primary);
                display: flex;
                align-items: center;
                gap: 12px;
                animation: notificationSlideIn 0.5s var(--transition-bounce);
                backdrop-filter: blur(20px);
                border: 1px solid var(--border-light);
                pointer-events: all;
                position: relative;
                overflow: hidden;
                transform-origin: top right;
                max-height: 120px;
                transition: all 0.3s ease;
            }

            .notification::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: currentColor;
                opacity: 0.3;
                transform: scaleX(0);
                transform-origin: left;
                animation: progress linear forwards;
            }

            .notification-success {
                border-left-color: var(--success);
                background: linear-gradient(135deg, var(--bg-primary), rgba(16, 185, 129, 0.08));
                color: var(--success);
            }

            .notification-error {
                border-left-color: var(--error);
                background: linear-gradient(135deg, var(--bg-primary), rgba(239, 68, 68, 0.08));
                color: var(--error);
            }

            .notification-warning {
                border-left-color: var(--warning);
                background: linear-gradient(135deg, var(--bg-primary), rgba(245, 158, 11, 0.08));
                color: var(--warning);
            }

            .notification-info {
                border-left-color: var(--info);
                background: linear-gradient(135deg, var(--bg-primary), rgba(59, 130, 246, 0.08));
                color: var(--info);
            }

            .notification-icon {
                font-size: 1.4rem;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .notification-content {
                flex: 1;
                font-weight: 500;
                line-height: 1.4;
                font-size: 0.95rem;
            }

            .notification-close {
                background: transparent;
                border: none;
                color: currentColor;
                opacity: 0.6;
                cursor: pointer;
                padding: 4px;
                border-radius: var(--radius-sm);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                width: 24px;
                height: 24px;
            }

            .notification-close:hover {
                opacity: 1;
                background: rgba(0, 0, 0, 0.1);
                transform: scale(1.1);
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: currentColor;
                opacity: 0.4;
                transform-origin: left;
                animation: progress linear forwards;
            }

            .notification-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .notification-action {
                background: transparent;
                border: 1px solid currentColor;
                color: currentColor;
                padding: 4px 12px;
                border-radius: var(--radius-sm);
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .notification-action:hover {
                background: currentColor;
                color: white;
            }

            .notification-exiting {
                animation: notificationSlideOut 0.3s ease forwards;
            }

            .notification-shake {
                animation: notificationShake 0.5s ease;
            }

            @keyframes notificationSlideIn {
                0% {
                    opacity: 0;
                    transform: translateX(100%) scale(0.8);
                }
                70% {
                    transform: translateX(-10px) scale(1.02);
                }
                100% {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
            }

            @keyframes notificationSlideOut {
                0% {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateX(100%) scale(0.8);
                }
            }

            @keyframes notificationShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            @keyframes progress {
                0% { transform: scaleX(1); }
                100% { transform: scaleX(0); }
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .notifications-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .notification {
                    padding: 14px 16px;
                }

                .notification-content {
                    font-size: 0.9rem;
                }
            }

            /* Dark mode adjustments */
            [data-theme="dark"] .notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        `;

        if (!document.getElementById('notification-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'notification-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    show(message, type = 'info', duration = 5000, options = {}) {
        // Limit number of notifications
        if (this.notificationCount >= this.maxNotifications) {
            this.removeOldest();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-notification-id', ++this.notificationCount);
        
        const icon = this.getIcon(type);
        const hasActions = options.actions && options.actions.length > 0;

        let actionsHTML = '';
        if (hasActions) {
            actionsHTML = `
                <div class="notification-actions">
                    ${options.actions.map(action => `
                        <button class="notification-action" onclick="${action.onclick}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-content">
                <div>${message}</div>
                ${actionsHTML}
            </div>
            <button class="notification-close" onclick="notification.removeNotification(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
            ${duration > 0 ? `<div class="notification-progress" style="animation-duration: ${duration}ms"></div>` : ''}
        `;

        this.container.appendChild(notification);

        // Add click outside to close (for important notifications)
        if (options.closeOnClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-close') && !e.target.closest('.notification-action')) {
                    this.remove(notification);
                }
            });
        }

        // Auto-remove after duration
        let removeTimeout;
        if (duration > 0) {
            removeTimeout = setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        // Store reference for manual control
        notification._notificationData = {
            id: this.notificationCount,
            type,
            message,
            removeTimeout,
            createdAt: Date.now()
        };

        // Add shake effect for important notifications
        if (options.important) {
            setTimeout(() => {
                notification.classList.add('notification-shake');
            }, 100);
        }

        return notification;
    }

    remove(notificationElement) {
        if (!notificationElement || !notificationElement.parentElement) return;

        // Clear timeout if exists
        if (notificationElement._notificationData?.removeTimeout) {
            clearTimeout(notificationElement._notificationData.removeTimeout);
        }

        // Add exit animation
        notificationElement.classList.add('notification-exiting');
        
        // Remove after animation completes
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.remove();
            }
        }, 300);
    }

    removeNotification(notificationElement) {
        this.remove(notificationElement);
    }

    removeOldest() {
        const notifications = this.container.querySelectorAll('.notification');
        if (notifications.length > 0) {
            this.remove(notifications[0]);
        }
    }

    removeAll() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.remove(notification);
        });
    }

    removeByType(type) {
        const notifications = this.container.querySelectorAll(`.notification-${type}`);
        notifications.forEach(notification => {
            this.remove(notification);
        });
    }

    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            loading: 'spinner fa-spin'
        };
        return icons[type] || 'info-circle';
    }

    // Convenience methods for different notification types
    success(message, duration = 3000, options = {}) {
        return this.show(message, 'success', duration, options);
    }

    error(message, duration = 6000, options = {}) {
        return this.show(message, 'error', duration, { important: true, ...options });
    }

    warning(message, duration = 5000, options = {}) {
        return this.show(message, 'warning', duration, options);
    }

    info(message, duration = 4000, options = {}) {
        return this.show(message, 'info', duration, options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', 0, { ...options, closeOnClick: true });
    }

    // Update existing notification
    update(notificationElement, newMessage, newType = null) {
        if (!notificationElement || !notificationElement.parentElement) return;

        const contentElement = notificationElement.querySelector('.notification-content div');
        if (contentElement) {
            contentElement.textContent = newMessage;
        }

        if (newType && notificationElement._notificationData) {
            const oldType = notificationElement._notificationData.type;
            notificationElement.classList.remove(`notification-${oldType}`);
            notificationElement.classList.add(`notification-${newType}`);
            
            const iconElement = notificationElement.querySelector('.notification-icon i');
            if (iconElement) {
                iconElement.className = `fas fa-${this.getIcon(newType)}`;
            }

            notificationElement._notificationData.type = newType;
        }

        // Add update animation
        notificationElement.style.transform = 'scale(1.05)';
        setTimeout(() => {
            notificationElement.style.transform = 'scale(1)';
        }, 150);
    }

    // Get notification count
    getCount() {
        return this.container.querySelectorAll('.notification').length;
    }

    // Pause all auto-removals
    pauseAll() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification._notificationData?.removeTimeout) {
                clearTimeout(notification._notificationData.removeTimeout);
                notification._notificationData.removeTimeout = null;
                
                // Pause progress bar
                const progressBar = notification.querySelector('.notification-progress');
                if (progressBar) {
                    progressBar.style.animationPlayState = 'paused';
                }
            }
        });
    }

    // Resume all auto-removals
    resumeAll() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            const data = notification._notificationData;
            if (data && !data.removeTimeout) {
                const remainingTime = data.createdAt + (data.duration || 5000) - Date.now();
                if (remainingTime > 0) {
                    data.removeTimeout = setTimeout(() => {
                        this.remove(notification);
                    }, remainingTime);
                    
                    // Resume progress bar
                    const progressBar = notification.querySelector('.notification-progress');
                    if (progressBar) {
                        progressBar.style.animationPlayState = 'running';
                        progressBar.style.animationDuration = `${remainingTime}ms`;
                    }
                }
            }
        });
    }
}

// Create global instance
const notification = new NotificationManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = notification;
}