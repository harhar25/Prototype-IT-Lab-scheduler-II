class ModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }

    init() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeCurrentModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCurrentModal();
            }
        });
    }

    createModal(id, content, options = {}) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content ${options.size || 'medium'}">
                <div class="modal-header">
                    <h3>${options.title || 'Modal'}</h3>
                    <button class="modal-close" onclick="modalManager.close('${id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer ? `
                    <div class="modal-footer">
                        ${options.footer}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        this.modals.set(id, modal);
        
        // Add animation
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);

        return modal;
    }

    open(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }

    close(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = ''; // Restore scrolling
            }, 300);
        }
    }

    closeCurrentModal() {
        const openModal = document.querySelector('.modal-overlay[style*="display: flex"]');
        if (openModal) {
            this.close(openModal.id);
        }
    }

    destroy(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.remove();
            this.modals.delete(id);
        }
    }
}

const modalManager = new ModalManager();
window.modalManager = modalManager;