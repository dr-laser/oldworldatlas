// New User Popup Modal
(function() {
    'use strict';

    const STORAGE_KEY = 'oldworldatlas_visited';
    
    function initializeNewUserPopup() {
        const overlay = document.getElementById('welcome-modal-overlay');
        const modal = document.getElementById('welcome-modal');
        const closeButton = document.getElementById('welcome-modal-close');
        const contentContainer = document.getElementById('welcome-modal-content');

        if (!overlay || !modal || !closeButton || !contentContainer) {
            console.error('Welcome modal elements not found');
            return;
        }

        // Check if user has visited before
        const hasVisited = localStorage.getItem(STORAGE_KEY);
        
        if (!hasVisited) {
            // Load content
            fetch('page_content/new-user-popup.html?v=7')
                .then(response => response.text())
                .then(html => {
                    contentContainer.innerHTML = html;
                    // Show the modal after a brief delay
                    setTimeout(() => {
                        openModal();
                    }, 500);
                })
                .catch(error => {
                    console.error('Error loading welcome content:', error);
                });
        }

        function openModal() {
            overlay.style.display = 'block';
            modal.style.display = 'block';
            
            // Trigger animations
            setTimeout(() => {
                overlay.classList.add('active');
                modal.classList.add('active');
            }, 10);
        }

        function closeModal() {
            overlay.classList.remove('active');
            modal.classList.remove('active');
            
            // Mark as visited
            localStorage.setItem(STORAGE_KEY, 'true');
            
            // Hide after animation
            setTimeout(() => {
                overlay.style.display = 'none';
                modal.style.display = 'none';
            }, 300);
        }

        // Close button click
        closeButton.addEventListener('click', closeModal);

        // Click outside modal to close
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNewUserPopup);
    } else {
        initializeNewUserPopup();
    }
})();
