/**
 * Changelog dropdown functionality for Old World Atlas
 */

class ChangelogDropdown {
    constructor() {
        this.button = null;
        this.dropdown = null;
        this.isOpen = false;
        this.content = null;
    }

    /**
     * Initialize changelog dropdown
     */
    async initialize() {
        this.button = document.getElementById('changelog-button');
        this.dropdown = document.getElementById('changelog-dropdown');
        
        if (!this.button || !this.dropdown) {
            console.error('Changelog elements not found');
            return;
        }

        // Load content
        await this.loadContent();

        // Set up event listeners
        this.button.addEventListener('click', () => this.toggle());
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.button.contains(e.target) && 
                !this.dropdown.contains(e.target)) {
                this.close();
            }
        });

        console.log('Changelog dropdown initialized');
    }

    /**
     * Load changelog content from HTML file
     */
    async loadContent() {
        try {
            const response = await fetch('changelog-content.html?v=7');
            if (!response.ok) {
                throw new Error('Failed to load changelog content');
            }
            const html = await response.text();
            const contentDiv = this.dropdown.querySelector('#changelog-dropdown-content');
            if (contentDiv) {
                contentDiv.innerHTML = html;
            }
        } catch (error) {
            console.error('Error loading changelog content:', error);
            const contentDiv = this.dropdown.querySelector('#changelog-dropdown-content');
            if (contentDiv) {
                contentDiv.innerHTML = '<div class="changelog-content"><h1>Error</h1><p>Failed to load changelog content.</p></div>';
            }
        }
    }

    /**
     * Toggle dropdown open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open dropdown
     */
    open() {
        this.dropdown.classList.add('active');
        this.button.classList.add('active');
        this.isOpen = true;
    }

    /**
     * Close dropdown
     */
    close() {
        this.dropdown.classList.remove('active');
        this.button.classList.remove('active');
        this.isOpen = false;
    }
}

// Create global instance
const changelogDropdown = new ChangelogDropdown();
