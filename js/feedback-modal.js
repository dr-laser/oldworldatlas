/**
 * Feedback modal dialog management for Old World Atlas
 */

class FeedbackModal {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.contentDiv = null;
        this.closeBtn = null;
        this.feedbackBtn = null;
    }

    /**
     * Initialize the Feedback modal functionality
     */
    initialize() {
        this.modal = document.getElementById('feedback-modal');
        this.overlay = document.getElementById('feedback-modal-overlay');
        this.contentDiv = document.getElementById('feedback-modal-content');
        this.closeBtn = document.getElementById('feedback-modal-close');
        this.feedbackBtn = document.getElementById('feedback-button');
        if (!this.modal || !this.overlay || !this.contentDiv || !this.closeBtn || !this.feedbackBtn) {
            console.error('Feedback modal elements not found');
            return;
        }

        // Bind event listeners
        this.feedbackBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });

        // Load content
        this.loadContent();
    }

    /**
     * Load content from feedback-content.html
     * @private
     */
    async loadContent() {
        try {
            const response = await fetch('feedback-content.html?v=7');
            if (!response.ok) {
                throw new Error('Failed to load feedback content');
            }
            const html = await response.text();
            this.contentDiv.innerHTML = html;
        } catch (error) {
            console.error('Error loading feedback content:', error);
            this.contentDiv.innerHTML = '<div class="feedback-content"><h1>Feedback</h1><p>Failed to load content. Please try again later.</p></div>';
        }
    }

    /**
     * Open the modal dialog
     */
    open() {
        if (this.modal && this.overlay) {
            this.overlay.style.display = 'block';
            this.modal.style.display = 'block';
            
            // Prevent scrolling on the body
            document.body.style.overflow = 'hidden';
            
            // Add animation class after display is set
            setTimeout(() => {
                this.overlay.classList.add('active');
                this.modal.classList.add('active');
            }, 10);
        }
    }

    /**
     * Close the modal dialog
     */
    close() {
        if (this.modal && this.overlay) {
            this.overlay.classList.remove('active');
            this.modal.classList.remove('active');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                this.overlay.style.display = 'none';
                this.modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    /**
     * Check if modal is currently open
     * @returns {boolean}
     */
    isOpen() {
        return this.modal && this.modal.style.display === 'block';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackModal = new FeedbackModal();
    window.feedbackModal.initialize();
});
