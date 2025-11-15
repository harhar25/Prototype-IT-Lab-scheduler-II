/**
 * Modal System for IT Lab Scheduler
 * Enhanced modal component with animations and advanced features
 */

class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
        this.stack = [];
        this.zIndexBase = 1000;
        this.backdropEnabled = true;
        
        this.init();
    }

    /**
     * Initialize modal system
     */
    init() {
        this.createBackdrop();
        this.bindGlobalEvents();
    }

    /**
     * Create backdrop element
     */
    createBackdrop() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        this.backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: ${this.zIndexBase};
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
        `;
        
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop && this.activeModal) {
                const modal = this.modals.get(this.activeModal);
                if (modal && modal.options.backdropClose !== false) {
                    this.close(this.activeModal);
                }
            }
        });

        document.body.appendChild(this.backdrop);
    }

    /**
     * Bind global events
     */
    bindGlobalEvents() {
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                const modal = this.modals.get(this.activeModal);
                if (modal && modal.options.escapeClose !== false) {
                    this.close(this.activeModal);
                }
            }
        });

        // Prevent body scroll when modal is open
        this.observeBodyScroll();
    }

    /**
     * Observe and control body scroll
     */
    observeBodyScroll() {
        let scrollPosition = 0;

        const disableBodyScroll = () => {
            scrollPosition = window.pageYOffset;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollPosition}px`;
            document.body.style.width = '100%';
        };

        const enableBodyScroll = () => {
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('position');
            document.body.style.removeProperty('top');
            document.body.style.removeProperty('width');
            window.scrollTo(0, scrollPosition);
        };

        // Override methods to handle scroll control
        this.originalDisableBodyScroll = disableBodyScroll;
        this.originalEnableBodyScroll = enableBodyScroll;
    }

    /**
     * Create modal
     */
    create(content, options = {}) {
        const modalId = Helpers.generateId();
        
        const defaultOptions = {
            title: null,
            size: 'md', // sm, md, lg, xl, full
            backdrop: true,
            backdropClose: true,
            escapeClose: true,
            closeButton: true,
            animate: true,
            center: true,
            scrollable: false,
            onShow: null,
            onClose: null,
            onConfirm: null,
            onCancel: null,
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            showConfirm: false,
            showCancel: false,
            ...options
        };

        const modal = {
            id: modalId,
            content,
            options: defaultOptions,
            element: null,
            isOpen: false
        };

        this.modals.set(modalId, modal);
        this.renderModal(modal);

        return modalId;
    }

    /**
     * Render modal element
     */
    renderModal(modal) {
        const element = document.createElement('div');
        element.className = `modal modal-${modal.options.size}`;
        element.setAttribute('data-modal-id', modal.id);
        element.setAttribute('role', 'dialog');
        element.setAttribute('aria-modal', 'true');
        
        if (modal.options.title) {
            element.setAttribute('aria-labelledby', `modal-title-${modal.id}`);
        }

        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
            full: 'max-w-full mx-4'
        };

        const modalClass = sizeClasses[modal.options.size] || sizeClasses.md;
        const centerClass = modal.options.center ? 'modal-center' : '';

        const header = modal.options.title ? `
            <div class="modal-header">
                <h3 id="modal-title-${modal.id}" class="modal-title">${this.escapeHtml(modal.options.title)}</h3>
                ${modal.options.closeButton ? '<button class="modal-close" aria-label="Close modal"><i class="fas fa-times"></i></button>' : ''}
            </div>
        ` : '';

        const footer = modal.options.showConfirm || modal.options.showCancel ? `
            <div class="modal-footer">
                ${modal.options.showCancel ? `<button class="btn btn-ghost modal-cancel">${modal.options.cancelText}</button>` : ''}
                ${modal.options.showConfirm ? `<button class="btn btn-primary modal-confirm">${modal.options.confirmText}</button>` : ''}
            </div>
        ` : '';

        element.innerHTML = `
            <div class="modal-dialog ${modalClass} ${centerClass}">
                <div class="modal-content">
                    ${header}
                    <div class="modal-body ${modal.options.scrollable ? 'modal-body-scrollable' : ''}">
                        ${typeof modal.content === 'string' ? modal.content : ''}
                    </div>
                    ${footer}
                </div>
            </div>
        `;

        // Store reference
        modal.element = element;
        
        // Add event listeners
        this.bindModalEvents(modal);

        // Append to body but keep hidden
        document.body.appendChild(element);

        return element;
    }

    /**
     * Bind modal events
     */
    bindModalEvents(modal) {
        const element = modal.element;
        
        // Close button
        const closeBtn = element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close(modal.id);
            });
        }

        // Confirm button
        const confirmBtn = element.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (modal.options.onConfirm) {
                    modal.options.onConfirm(modal);
                } else {
                    this.close(modal.id);
                }
            });
        }

        // Cancel button
        const cancelBtn = element.querySelector('.modal-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (modal.options.onCancel) {
                    modal.options.onCancel(modal);
                } else {
                    this.close(modal.id);
                }
            });
        }

        // Prevent click events from propagating to backdrop
        element.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Open modal
     */
    open(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal || modal.isOpen) return;

        // Add to stack
        this.stack.push(modalId);
        this.activeModal = modalId;
        modal.isOpen = true;

        // Calculate z-index
        const zIndex = this.zIndexBase + this.stack.length;
        
        // Show backdrop
        if (modal.options.backdrop && this.backdropEnabled) {
            this.backdrop.style.zIndex = zIndex - 1;
            this.backdrop.style.opacity = '1';
            this.backdrop.style.visibility = 'visible';
        }

        // Show modal
        modal.element.style.zIndex = zIndex;
        modal.element.style.display = 'block';

        // Disable body scroll
        this.originalDisableBodyScroll();

        // Animate in
        requestAnimationFrame(() => {
            modal.element.classList.add('modal-open');
            
            // Focus management
            this.focusTrap(modal.element);
            
            // Trigger onShow callback
            if (modal.options.onShow) {
                modal.options.onShow(modal);
            }
        });

        return modalId;
    }

    /**
     * Close modal
     */
    close(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal || !modal.isOpen) return;

        // Remove from stack
        const stackIndex = this.stack.indexOf(modalId);
        if (stackIndex > -1) {
            this.stack.splice(stackIndex, 1);
        }

        modal.isOpen = false;

        // Animate out
        modal.element.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.element.style.display = 'none';
            
            // Update active modal
            this.activeModal = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
            
            // Hide backdrop if no more modals
            if (this.stack.length === 0) {
                this.backdrop.style.opacity = '0';
                this.backdrop.style.visibility = 'hidden';
                
                // Enable body scroll
                this.originalEnableBodyScroll();
            } else {
                // Update z-index for remaining modals
                this.updateModalStack();
            }
            
            // Trigger onClose callback
            if (modal.options.onClose) {
                modal.options.onClose(modal);
            }
        }, 300);
    }

    /**
     * Close all modals
     */
    closeAll() {
        const modalIds = Array.from(this.modals.keys());
        modalIds.forEach(id => {
            if (this.modals.get(id).isOpen) {
                this.close(id);
            }
        });
    }

    /**
     * Update modal stack z-index
     */
    updateModalStack() {
        this.stack.forEach((modalId, index) => {
            const modal = this.modals.get(modalId);
            if (modal && modal.element) {
                const zIndex = this.zIndexBase + index + 1;
                modal.element.style.zIndex = zIndex;
                
                if (index === this.stack.length - 1) {
                    // Update backdrop for top modal
                    this.backdrop.style.zIndex = zIndex - 1;
                }
            }
        });
    }

    /**
     * Focus trap for accessibility
     */
    focusTrap(modalElement) {
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            modalElement.addEventListener('keydown', function trapFocus(e) {
                if (e.key !== 'Tab') return;
                
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            });
            
            firstElement.focus();
        }
    }

    /**
     * Update modal content
     */
    updateContent(modalId, newContent) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        const body = modal.element.querySelector('.modal-body');
        if (body) {
            if (typeof newContent === 'string') {
                body.innerHTML = newContent;
            } else if (newContent instanceof HTMLElement) {
                body.innerHTML = '';
                body.appendChild(newContent);
            }
            modal.content = newContent;
        }
    }

    /**
     * Update modal title
     */
    updateTitle(modalId, newTitle) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        const titleElement = modal.element.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
        
        modal.options.title = newTitle;
    }

    /**
     * Show confirmation modal
     */
    confirm(message, onConfirm, onCancel = null, options = {}) {
        const modalId = this.create(message, {
            title: options.title || 'Confirmation',
            showConfirm: true,
            showCancel: true,
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel',
            onConfirm: () => {
                if (onConfirm) onConfirm();
                this.close(modalId);
            },
            onCancel: () => {
                if (onCancel) onCancel();
                this.close(modalId);
            },
            ...options
        });

        return this.open(modalId);
    }

    /**
     * Show alert modal
     */
    alert(message, onClose = null, options = {}) {
        const modalId = this.create(message, {
            title: options.title || 'Alert',
            showConfirm: true,
            confirmText: options.confirmText || 'OK',
            onConfirm: () => {
                if (onClose) onClose();
                this.close(modalId);
            },
            ...options
        });

        return this.open(modalId);
    }

    /**
     * Show prompt modal
     */
    prompt(message, defaultValue = '', onConfirm, onCancel = null, options = {}) {
        const inputId = Helpers.generateId();
        const promptContent = `
            <div class="modal-prompt">
                <p>${this.escapeHtml(message)}</p>
                <input type="text" 
                       id="${inputId}" 
                       class="form-input" 
                       value="${this.escapeHtml(defaultValue)}"
                       placeholder="${options.placeholder || ''}">
            </div>
        `;

        const modalId = this.create(promptContent, {
            title: options.title || 'Prompt',
            showConfirm: true,
            showCancel: true,
            confirmText: options.confirmText || 'OK',
            cancelText: options.cancelText || 'Cancel',
            onShow: () => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.focus();
                    input.select();
                }
            },
            onConfirm: () => {
                const input = document.getElementById(inputId);
                if (onConfirm && input) {
                    onConfirm(input.value);
                }
                this.close(modalId);
            },
            onCancel: () => {
                if (onCancel) onCancel();
                this.close(modalId);
            },
            ...options
        });

        return this.open(modalId);
    }

    /**
     * Show loading modal
     */
    loading(message = 'Loading...', options = {}) {
        const loadingContent = `
            <div class="modal-loading">
                <div class="loading-spinner"></div>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;

        const modalId = this.create(loadingContent, {
            title: options.title || 'Please Wait',
            closeButton: false,
            backdropClose: false,
            escapeClose: false,
            ...options
        });

        return this.open(modalId);
    }

    /**
     * Check if modal is open
     */
    isOpen(modalId) {
        const modal = this.modals.get(modalId);
        return modal ? modal.isOpen : false;
    }

    /**
     * Get active modal ID
     */
    getActiveModal() {
        return this.activeModal;
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
     * Destroy modal
     */
    destroy(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        if (modal.isOpen) {
            this.close(modalId);
        }

        if (modal.element && modal.element.parentNode) {
            modal.element.parentNode.removeChild(modal.element);
        }

        this.modals.delete(modalId);
    }

    /**
     * Destroy all modals
     */
    destroyAll() {
        this.closeAll();
        
        this.modals.forEach((modal, modalId) => {
            this.destroy(modalId);
        });
    }
}

// Add CSS styles for modals
const modalStyles = `
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.modal-open {
    opacity: 1;
}

.modal-dialog {
    width: 90%;
    margin: 2rem auto;
    transform: scale(0.7);
    transition: all 0.3s var(--transition-bounce);
}

.modal-open .modal-dialog {
    transform: scale(1);
}

.modal-center .modal-dialog {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.7);
}

.modal-open .modal-center .modal-dialog {
    transform: translate(-50%, -50%) scale(1);
}

.modal-content {
    background: var(--bg-primary);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-2xl);
    border: 1px solid var(--border-light);
    backdrop-filter: blur(20px);
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xl);
    border-bottom: 1px solid var(--border-light);
    background: var(--bg-secondary);
}

.modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    transition: var(--transition-normal);
    font-size: 1.2rem;
}

.modal-close:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

.modal-body {
    padding: var(--space-xl);
    max-height: 70vh;
}

.modal-body-scrollable {
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-xl);
    border-top: 1px solid var(--border-light);
    background: var(--bg-secondary);
}

/* Modal sizes */
.modal-sm .modal-dialog { max-width: 400px; }
.modal-md .modal-dialog { max-width: 500px; }
.modal-lg .modal-dialog { max-width: 700px; }
.modal-xl .modal-dialog { max-width: 900px; }
.modal-full .modal-dialog { max-width: 95%; }

/* Loading modal */
.modal-loading {
    text-align: center;
    padding: var(--space-xl);
}

.modal-loading .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-light);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto var(--space-md);
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Prompt modal */
.modal-prompt input {
    width: 100%;
    margin-top: var(--space-md);
}

/* Responsive */
@media (max-width: 768px) {
    .modal-dialog {
        width: 95%;
        margin: 1rem auto;
    }
    
    .modal-sm .modal-dialog,
    .modal-md .modal-dialog,
    .modal-lg .modal-dialog,
    .modal-xl .modal-dialog {
        max-width: 95%;
    }
    
    .modal-header,
    .modal-body,
    .modal-footer {
        padding: var(--space-lg);
    }
}
`;

// Inject styles
const modalStyleSheet = document.createElement('style');
modalStyleSheet.textContent = modalStyles;
document.head.appendChild(modalStyleSheet);

// Create global modal instance
const modal = new ModalSystem();

// Make modal available globally
window.modal = modal;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = modal;
}