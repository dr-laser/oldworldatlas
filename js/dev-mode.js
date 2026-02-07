/**
 * Developer mode management for Old World Atlas
 * Handles username management, local storage of contributions, and map interactions
 */

class DevModeManager {
    constructor() {
        this.username = null;
        this.mapManager = null;
        this.savedEntries = []; // Array of {id, name, tags, coords, state: 'saved'|'sent'}
        this.devLayer = null;
        this.devSource = null;
        this.currentRClickPopupCoords = null;
        this.entryMarkers = {}; // Map of entry id -> OpenLayers feature
    }

    /**
     * Initialize dev mode
     */
    initialize() {
        this.checkAndShowUsernameModal();
        this.setupStorageKey();
    }

    /**
     * Get unique storage key based on username
     */
    setupStorageKey() {
        const params = new URLSearchParams(window.location.search);
        const editor = params.get('editor');
        if (editor) {
            this.username = editor;
        }
    }

    /**
     * Check if user has username, show modal if not
     */
    checkAndShowUsernameModal() {
        const params = new URLSearchParams(window.location.search);
        const editor = params.get('editor');

        if (!editor) {
            this.showUsernameModal();
        } else {
            this.username = editor;
            this.loadSavedEntries();
            this.initializeDevFeatures();
        }
    }

    /**
     * Show username modal
     */
    showUsernameModal() {
        const modal = document.getElementById('dev-username-modal');
        const overlay = document.getElementById('dev-username-modal-overlay');
        const input = document.getElementById('dev-username-input');
        const button = document.getElementById('dev-continue-button');

        if (!modal || !overlay || !input || !button) {
            console.error('Dev username modal elements not found');
            return;
        }

        // Show modal
        overlay.classList.add('active');
        modal.classList.add('active');
        overlay.style.display = 'block';
        modal.style.display = 'block';

        // Prevent scrolling
        document.body.style.overflow = 'hidden';

        // Handle input and button
        const handleSubmit = () => {
            const username = input.value.trim();
            if (username) {
                this.username = username;
                this.redirectWithUsername(username);
            }
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });

        button.addEventListener('click', handleSubmit);

        // Enable button when input has content
        input.addEventListener('input', (e) => {
            button.disabled = e.target.value.trim() === '';
        });

        // Focus input
        input.focus();

        // Prevent closing modal by clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                e.preventDefault();
            }
        });
    }

    /**
     * Redirect to dev page with username parameter
     */
    redirectWithUsername(username) {
        const url = new URL(window.location);
        url.searchParams.set('editor', encodeURIComponent(username));
        window.location.href = url.toString();
    }

    /**
     * Hide and cleanup username modal
     */
    hideUsernameModal() {
        const modal = document.getElementById('dev-username-modal');
        const overlay = document.getElementById('dev-username-modal-overlay');

        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');

        setTimeout(() => {
            if (modal) modal.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    /**
     * Initialize dev features (called after username is set)
     */
    initializeDevFeatures() {
        // Wait for map to be initialized
        setTimeout(() => {
            this.setupDevLayer();
            this.setupMapClickHandler();
            this.setupRightClickHandler();
            this.loadSavedEntries();
            this.renderEntries();
            this.updateSendSavedButton();
        }, 1000);
    }

    /**
     * Create a vector layer for dev contributions
     */
    setupDevLayer() {
        if (!mapManager || !mapManager.map) {
            console.error('Map manager not ready');
            return;
        }

        this.devSource = new ol.source.Vector();
        this.devLayer = new ol.layer.Vector({
            title: 'Community Contributions',
            source: this.devSource,
            style: (feature) => this.getEntryStyle(feature),
            zIndex: 1000
        });

        // Add layer to map (on top)
        mapManager.map.addLayer(this.devLayer);
        this.mapManager = mapManager;
    }

    /**
     * Setup left-click handler for selecting entries
     */
    setupMapClickHandler() {
        if (!mapManager || !mapManager.map) {
            console.error('Map not ready');
            return;
        }

        mapManager.map.on('singleclick', (e) => {
            // Check if any feature was clicked
            let foundEntry = false;
            mapManager.map.forEachFeatureAtPixel(e.pixel, (feature) => {
                if (feature.get('id') && feature.get('id').startsWith('entry_')) {
                    // This is one of our entries
                    const entry = this.savedEntries.find(en => en.id === feature.get('id'));
                    if (entry) {
                        this.showEntryPopup(entry);
                        foundEntry = true;
                        return true; // Stop checking other features
                    }
                }
            });
        });
    }

    /**
     * Get style for entry markers
     */
    getEntryStyle(feature) {
        const state = feature.get('state');
        const isSelected = feature.get('isSelected');

        let color, strokeColor, radius;
        if (state === 'saved') {
            color = '#ff69b4'; // Pink
            strokeColor = '#000';
            radius = 8;
        } else if (state === 'sent') {
            color = '#ffd700'; // Yellow
            strokeColor = '#000';
            radius = 8;
        } else {
            return null;
        }

        return new ol.style.Style({
            image: new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({ color: color }),
                stroke: new ol.style.Stroke({ color: strokeColor, width: 2 })
            }),
            zIndex: isSelected ? 1000 : 100
        });
    }

    /**
     * Setup right-click handler on map
     */
    setupRightClickHandler() {
        if (!mapManager || !mapManager.map) {
            console.error('Map not ready');
            return;
        }

        const mapElement = mapManager.map.getTargetElement();
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }

        mapElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Get pixel coords and map coords
            const pixel = mapManager.map.getEventPixel(e);
            const coords = mapManager.map.getCoordinateFromPixel(pixel);

            // Store coords for later use
            this.currentRClickPopupCoords = coords;

            // Show popup at mouse position
            this.showRClickPopup(e, coords);
        }, true);
    }

    /**
     * Show right-click popup
     */
    showRClickPopup(event, coords) {
        const popup = document.getElementById('dev-rclick-popup');
        if (!popup) {
            console.error('Right-click popup element not found');
            return;
        }

        // Clear previous values
        document.getElementById('dev-popup-name').value = '';
        document.getElementById('dev-popup-tags').value = '';

        // Show coordinates
        const coordText = `X=${coords[0].toFixed(3)}, Y=${coords[1].toFixed(3)}`;
        document.getElementById('dev-popup-coordinates').textContent = coordText;

        // Position popup near mouse, but adjust if too close to edges
        let x = event.pageX + 10;
        let y = event.pageY + 10;

        // Store the click position for arrow positioning
        const clickX = event.pageX;
        const clickY = event.pageY;

        // Adjust for viewport edges
        const popupWidth = 270;
        const popupHeight = 220;
        const margin = 10;

        if (x + popupWidth + margin > window.innerWidth) {
            x = window.innerWidth - popupWidth - margin;
        }
        if (y + popupHeight + margin > window.innerHeight) {
            y = window.innerHeight - popupHeight - margin;
        }
        if (x < margin) x = margin;
        if (y < margin) y = margin;

        // Calculate arrow position relative to popup
        // Arrow should point to the click location
        const arrowLeftFromPopup = clickX - x - 5; // -5 for half of arrow width
        const arrowTopFromPopup = clickY - y - 7; // -7 for arrow height

        // Clamp arrow to reasonable bounds within popup
        const clampedArrowLeft = Math.max(10, Math.min(popupWidth - 20, arrowLeftFromPopup));
        const clampedArrowTop = y > clickY ? 'calc(100% + 5px)' : '-7px';

        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        popup.style.transform = 'none';
        popup.style.setProperty('--arrow-left', clampedArrowLeft + 'px');
        popup.style.setProperty('--arrow-top', clampedArrowTop);
        popup.classList.add('visible');

        // Setup handlers
        this.setupPopupHandlers();

        // Close on escape
        const closePopup = (e) => {
            if (e.key === 'Escape') {
                popup.classList.remove('visible');
                document.removeEventListener('keydown', closePopup);
                document.removeEventListener('click', closeOnClickOutside);
            }
        };
        document.addEventListener('keydown', closePopup);

        // Close on click outside
        const closeOnClickOutside = (e) => {
            if (!popup.contains(e.target) && e.target !== popup) {
                popup.classList.remove('visible');
                document.removeEventListener('keydown', closePopup);
                document.removeEventListener('click', closeOnClickOutside);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeOnClickOutside);
        }, 100);
    }

    /**
     * Setup handlers for popup buttons
     */
    setupPopupHandlers() {
        const saveBtn = document.getElementById('dev-popup-save');
        const sendBtn = document.getElementById('dev-popup-send');

        // Remove old listeners
        if (saveBtn) {
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => this.handleSaveEntry());
        }

        if (sendBtn) {
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
            newSendBtn.addEventListener('click', () => this.handleSendNow());
        }
    }

    /**
     * Handle Save button
     */
    handleSaveEntry() {
        const name = document.getElementById('dev-popup-name').value.trim();
        const tags = document.getElementById('dev-popup-tags').value.trim();

        if (!name) {
            alert('Please enter a name for this location');
            return;
        }

        const coords = this.currentRClickPopupCoords;
        const entry = {
            id: this.generateEntryId(),
            name: name,
            tags: tags,
            coords: coords,
            state: 'saved'
        };

        this.savedEntries.push(entry);
        this.saveTolocalStorage();
        this.renderEntries();

        // Close popup
        document.getElementById('dev-rclick-popup').classList.remove('visible');

        // Update send button visibility
        this.updateSendSavedButton();
    }

    /**
     * Handle Send Now button
     */
    handleSendNow() {
        const name = document.getElementById('dev-popup-name').value.trim();
        const tags = document.getElementById('dev-popup-tags').value.trim();

        if (!name) {
            alert('Please enter a name for this location');
            return;
        }

        const coords = this.currentRClickPopupCoords;
        const entry = {
            id: this.generateEntryId(),
            name: name,
            tags: tags,
            coords: coords,
            state: 'sent'
        };

        // Submit immediately
        this.submitEntry(entry, () => {
            this.savedEntries.push(entry);
            this.saveTolocalStorage();
            this.renderEntries();

            // Close popup
            document.getElementById('dev-rclick-popup').classList.remove('visible');
            
            console.log('Entry sent:', name);
        });
    }

    /**
     * Submit entry via web3forms
     */
    submitEntry(entry, onSuccess) {
        const formData = new FormData();
        formData.append('access_key', 'e6932590-32f9-4275-8c7d-478a2d4894b0');
        
        const message = `[DEVELOPER CONTRIBUTION]
Editor: ${this.username}
Location: ${entry.name}
Coordinates: X=${entry.coords[0].toFixed(3)}, Y=${entry.coords[1].toFixed(3)}
Tags: ${entry.tags || '(none)'}`;

        formData.append('message', message);

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                console.log('Entry submitted successfully:', entry.name);
                if (onSuccess) onSuccess();
            } else {
                console.error('Failed to submit entry, status:', response.status);
                if (onSuccess) onSuccess(); // Still mark as sent even if response fails
            }
        })
        .catch(error => {
            console.error('Error submitting entry:', error);
            if (onSuccess) onSuccess(); // Still mark as sent to avoid loops
        });
    }

    /**
     * Handle Send Saved Entries button
     */
    handleSendSavedEntries() {
        const savedEntries = this.savedEntries.filter(e => e.state === 'saved');
        
        if (savedEntries.length === 0) {
            alert('No saved entries to send');
            return;
        }

        const button = document.getElementById('dev-send-saved-button');
        if (button) {
            button.disabled = true;
            button.textContent = 'Sending...';
        }

        // Build combined message with all entries
        let message = `[COMMUNITY CONTRIBUTION]\nEditor: ${this.username}\n${savedEntries.length} locations added.\n\n`;
        
        savedEntries.forEach((entry, index) => {
            message += `Location: ${entry.name}\n`;
            message += `Coordinates: X=${entry.coords[0].toFixed(3)}, Y=${entry.coords[1].toFixed(3)}\n`;
            message += `Tags: ${entry.tags || '(none)'}\n`;
            if (index < savedEntries.length - 1) {
                message += '\n';
            }
        });

        // Submit all entries in a single message
        this.submitCombinedEntries(message, savedEntries, () => {
            // Mark all as sent
            savedEntries.forEach(entry => {
                entry.state = 'sent';
            });
            
            this.saveTolocalStorage();
            this.renderEntries();
            this.updateSendSavedButton();
            
            if (button) {
                button.disabled = false;
                button.textContent = 'Send Saved Entries';
            }
            
            alert(`Successfully sent ${savedEntries.length} contribution(s)!`);
        });
    }

    /**
     * Submit combined entries via web3forms
     */
    submitCombinedEntries(message, entries, onSuccess) {
        const formData = new FormData();
        formData.append('access_key', 'e6932590-32f9-4275-8c7d-478a2d4894b0');
        formData.append('message', message);

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                console.log('Combined entries submitted successfully');
                if (onSuccess) onSuccess();
            } else {
                console.error('Failed to submit entries, status:', response.status);
                if (onSuccess) onSuccess(); // Still mark as sent even if response fails
            }
        })
        .catch(error => {
            console.error('Error submitting entries:', error);
            if (onSuccess) onSuccess(); // Still mark as sent to avoid loops
        });
    }

    /**
     * Generate unique entry ID
     */
    generateEntryId() {
        return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save entries to local storage
     */
    saveTolocalStorage() {
        if (!this.username) return;

        const storageKey = `oldworldatlas_dev_${this.username}`;
        localStorage.setItem(storageKey, JSON.stringify(this.savedEntries));
    }

    /**
     * Load entries from local storage
     */
    loadSavedEntries() {
        if (!this.username) return;

        const storageKey = `oldworldatlas_dev_${this.username}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
            try {
                this.savedEntries = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading saved entries:', e);
                this.savedEntries = [];
            }
        }
    }

    /**
     * Delete an entry from saved entries and re-render
     */
    deleteEntry(entry) {
        this.savedEntries = this.savedEntries.filter(e => e.id !== entry.id);
        this.saveToLocalStorage();
        this.renderEntries();
        this.updateSendSavedButton();
    }

    /**
     * Render all entries on map
     */
    renderEntries() {
        if (!this.devSource) return;

        this.devSource.clear();
        this.entryMarkers = {};

        this.savedEntries.forEach(entry => {
            const feature = new ol.Feature({
                geometry: new ol.geom.Point(entry.coords),
                id: entry.id,
                state: entry.state,
                name: entry.name,
                tags: entry.tags,
                coords: entry.coords
            });

            feature.on('click', () => this.showEntryPopup(entry));
            
            this.devSource.addFeature(feature);
            this.entryMarkers[entry.id] = feature;
        });
    }

    /**
     * Show entry details in a small info card popup
     */
    showEntryPopup(entry) {
        // Create a simple info card popup similar to the right-click one
        const popup = document.getElementById('dev-rclick-popup');
        if (!popup) return;

        // Update popup with entry details (read-only display)
        const nameField = document.getElementById('dev-popup-name');
        const tagsField = document.getElementById('dev-popup-tags');
        const coordField = document.getElementById('dev-popup-coordinates');
        const buttons = popup.querySelector('.dev-popup-buttons');

        nameField.value = entry.name;
        nameField.disabled = true;
        tagsField.value = entry.tags || '';
        tagsField.disabled = true;
        coordField.textContent = `X=${entry.coords[0].toFixed(3)}, Y=${entry.coords[1].toFixed(3)}`;

        // Replace buttons with status badge and delete button if saved
        if (entry.state === 'saved') {
            buttons.innerHTML = `
                <div style="width: 100%; padding: 8px; background: #ffb3d9; border-radius: 3px; text-align: center; font-weight: 600; color: #333; font-size: 12px;">⏳ Saved</div>
                <button class="btn-delete" id="dev-popup-delete" style="width: 100%; margin-top: 8px; padding: 8px; background: #ff6b6b; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: 600; font-size: 12px;">Delete</button>
            `;
            const deleteBtn = buttons.querySelector('#dev-popup-delete');
            deleteBtn.addEventListener('click', () => {
                this.deleteEntry(entry);
                popup.classList.remove('visible');
                closePopup();
            });
        } else {
            buttons.innerHTML = `<div style="width: 100%; padding: 8px; background: #ffffcc; border-radius: 3px; text-align: center; font-weight: 600; color: #333; font-size: 12px;">✓ Sent</div>`;
        }

        // Position in center of screen
        popup.style.left = (window.innerWidth / 2) + 'px';
        popup.style.top = (window.innerHeight / 2) + 'px';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.classList.add('visible');

        // Setup handlers for closing
        const closePopup = () => {
            nameField.disabled = false;
            tagsField.disabled = false;
            buttons.innerHTML = `
                <button class="btn-save" id="dev-popup-save">Save</button>
                <button class="btn-send" id="dev-popup-send">Send Now</button>
            `;
            this.setupPopupHandlers();
        };

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                popup.classList.remove('visible');
                closePopup();
                document.removeEventListener('keydown', escapeHandler);
                document.removeEventListener('click', clickHandler);
            }
        };

        const clickHandler = (e) => {
            if (!popup.contains(e.target) && e.target !== popup) {
                popup.classList.remove('visible');
                closePopup();
                document.removeEventListener('keydown', escapeHandler);
                document.removeEventListener('click', clickHandler);
            }
        };

        document.addEventListener('keydown', escapeHandler);
        setTimeout(() => {
            document.addEventListener('click', clickHandler);
        }, 100);
    }

    /**
     * Update send saved entries button visibility
     */
    updateSendSavedButton() {
        const button = document.getElementById('dev-send-saved-button');
        const hasSaved = this.savedEntries.some(e => e.state === 'saved');

        if (button) {
            if (hasSaved) {
                button.classList.add('active');
                button.classList.remove('disabled');
                button.disabled = false;
            } else {
                button.classList.remove('active');
                button.classList.add('disabled');
                button.disabled = true;
            }
        }
    }
}

// Initialize dev mode when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.devModeManager = new DevModeManager();
    window.devModeManager.initialize();

    // Setup send saved entries button
    const sendButton = document.getElementById('dev-send-saved-button');
    if (sendButton && window.devModeManager) {
        sendButton.addEventListener('click', () => {
            window.devModeManager.handleSendSavedEntries();
        });
    }
});
