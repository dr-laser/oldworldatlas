/**
 * UI controls management for Old World Atlas
 */

class UIControls {
    constructor() {
        this.popupElement = null;
        this.popupOverlay = null;
        this.settlementCheckbox = null;
        this.poiCheckbox = null;
        this.regionCheckbox = null;
        this.waterCheckbox = null;
        this.publishedCanonOnlyCheckbox = null;
        this.selectedFeature = null;  // Track currently selected/highlighted feature
    }

    /**
     * Initialize UI controls
     * @param {ol.Map} map - OpenLayers map instance
     */
    initialize(map) {
        this.initializeSettlementToggle();
        this.initializePOIToggle();
        this.initializeRegionToggle();
        this.initializeWaterToggle();
        this.initializePublishedCanonOnlyToggle();
        this.initializePopup(map);
    }

    /**
     * Initialize settlement toggle checkbox
     * @private
     */
    initializeSettlementToggle() {
        this.settlementCheckbox = document.getElementById('settlement-checkbox');
        if (this.settlementCheckbox) {
            this.settlementCheckbox.addEventListener('change', (e) => {
                const layer = mapManager.getSettlementLayer();
                const markerLayer = mapManager.getSettlementMarkersOnlyLayer();
                if (layer) {
                    layer.setVisible(e.target.checked);
                }
                if (markerLayer) {
                    markerLayer.setVisible(e.target.checked);
                }
            });
        }
    }

    /**
     * Initialize POI toggle checkbox
     * @private
     */
    initializePOIToggle() {
        this.poiCheckbox = document.getElementById('poi-checkbox');
        if (this.poiCheckbox) {
            this.poiCheckbox.addEventListener('change', (e) => {
                const layer = mapManager.getPOILayer();
                if (layer) {
                    layer.setVisible(e.target.checked);
                }
            });
        }
    }

    /**
     * Initialize region toggle checkbox
     * @private
     */
    initializeRegionToggle() {
        this.regionCheckbox = document.getElementById('region-checkbox');
        if (this.regionCheckbox) {
            this.regionCheckbox.addEventListener('change', (e) => {
                const layer = mapManager.getProvinceLayer();
                if (layer) {
                    layer.setVisible(e.target.checked);
                }
            });
        }
    }

    /**
     * Initialize water toggle checkbox
     * @private
     */
    initializeWaterToggle() {
        this.waterCheckbox = document.getElementById('water-checkbox');
        if (this.waterCheckbox) {
            this.waterCheckbox.addEventListener('change', (e) => {
                const layer = mapManager.getWaterLayer();
                if (layer) {
                    layer.setVisible(e.target.checked);
                }
            });
        }
    }

    /**
     * Initialize Published Canon Only toggle checkbox
     * @private
     */
    initializePublishedCanonOnlyToggle() {
        const desktopCheckbox = document.getElementById('published-canon-only-checkbox');
        const mobileCheckbox = document.getElementById('mobile-published-canon-only-checkbox');
        
        const handleToggle = (e) => {
            const enabled = e.target.checked;
            settlementData.setPublishedCanonOnly(enabled);
            
            // Update both checkboxes to stay in sync
            if (desktopCheckbox) desktopCheckbox.checked = enabled;
            if (mobileCheckbox) mobileCheckbox.checked = enabled;
            
            // Reload settlement features with new filter
            const olFeatures = settlementData.getOLFeatures();
            const layer = mapManager.getSettlementLayer();
            const markerLayer = mapManager.getSettlementMarkersOnlyLayer();
            
            if (layer) {
                layer.getSource().clear();
                layer.getSource().addFeatures(olFeatures);
            }
            if (markerLayer) {
                markerLayer.getSource().clear();
                markerLayer.getSource().addFeatures(olFeatures);
            }
        };
        
        if (desktopCheckbox) {
            desktopCheckbox.addEventListener('change', handleToggle);
        }
        if (mobileCheckbox) {
            mobileCheckbox.addEventListener('change', handleToggle);
        }
    }

    /**
     * Initialize popup overlay
     * @private
     * @param {ol.Map} map - OpenLayers map instance
     */
    initializePopup(map) {
        this.popupElement = document.createElement('div');
        this.popupElement.id = 'popup';
        this.popupElement.className = 'ol-popup';
        this.popupElement.style.cssText = 'position: absolute; background-color: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 0 10px rgba(0,0,0,0.2); display: none; z-index: 100;';
        document.body.appendChild(this.popupElement);

        this.popupOverlay = new ol.Overlay({
            element: this.popupElement,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
        map.addOverlay(this.popupOverlay);

        // Handle clicks on features
        map.on('click', (evt) => this.handleMapClick(evt));
    }

    /**
     * Handle map click events
     * @private
     * @param {ol.MapBrowserEvent} evt
     */
    handleMapClick(evt) {
        let feature = null;
        mapManager.getMap().forEachFeatureAtPixel(evt.pixel, (f) => {
            feature = f;
            return true; // Stop iteration
        });

        if (feature && feature.get('name')) {
            // Clear any previous selection when clicking a feature
            if (window.searchManager) {
                window.searchManager.clearSelection();
            }
            this.showSettlementPopup(feature, evt.coordinate);
        } else {
            this.hidePopup();
        }
    }

    /**
     * Show feature from search (zoom, center, popup, and highlight)
     * @param {ol.Feature} feature - Feature to show
     * @param {array} coordinate - Map coordinate [lon, lat]
     */
    showFeatureFromSearch(feature, coordinate) {
        // Debug logging
        console.log('showFeatureFromSearch called', { feature, coordinate });
        console.log('mapManager exists:', typeof mapManager !== 'undefined');
        
        // Zoom and center to feature using mapManager
        if (typeof mapManager !== 'undefined' && mapManager.zoomToFeature) {
            console.log('Calling mapManager.zoomToFeature');
            mapManager.zoomToFeature(feature, 0.0015);
        } else {
            console.error('mapManager or zoomToFeature not available');
        }
        
        // Show popup
        this.showSettlementPopup(feature, coordinate);
    }
    
    /**
     * Show settlement information popup
     * @param {ol.Feature} feature - Settlement feature
     * @param {array} coordinate - Map coordinate [lon, lat]
     */
    showSettlementPopup(feature, coordinate) {
        const name = feature.get('name');
        const featureType = feature.get('featureType');
        
        // Handle POI features
        if (featureType === 'poi') {
            const poiType = feature.get('type');
            let html = `<div class="settlement-popup">
                <div class="settlement-popup-header">
                    <h2 class="settlement-popup-title">${this.escapeHtml(name)}</h2>
                </div>
                <div class="settlement-popup-field">
                    <span class="settlement-popup-label">Type:</span>
                    <span class="settlement-popup-value">${this.escapeHtml(poiType)}</span>
                </div>
            </div>`;
            
            this.popupElement.innerHTML = html;
            this.popupOverlay.setPosition(coordinate);
            this.popupElement.style.display = 'block';
            return;
        }
        
        // Handle settlement features
        const sizeCategory = feature.get('sizeCategory');
        const population = feature.get('population');
        const province = feature.get('province');
        const sourceTag = feature.get('sourceTag');
        const wikiTitle = feature.get('wikiTitle');
        const wikiUrl = feature.get('wikiUrl');
        const wikiDescription = feature.get('wikiDescription');
        const wikiImage = feature.get('wikiImage');
        const sizeLabel = getSizeCategoryLabel(sizeCategory);

        // Check if settlement has wiki data
        const hasWiki = wikiTitle && wikiTitle.trim() !== '';

        // Build header with title and subtitle
        const subtitle = province ? `${sizeLabel} in ${province}` : sizeLabel;
        let html = `<div class="settlement-popup">
            <div class="settlement-popup-header">
                <h2 class="settlement-popup-title">${this.escapeHtml(name)}</h2>
                <p class="settlement-popup-subtitle">${this.escapeHtml(subtitle)}</p>
            </div>`;

        // Add population field if present
        if (population && population > 0) {
            html += `<div class="settlement-popup-field">
                <span class="settlement-popup-label">Population:</span>
                <span class="settlement-popup-value">${population.toLocaleString()}</span>
            </div>`;
        }

        // Add wiki section if available
        if (hasWiki) {
            html += `<div class="settlement-popup-wiki">`;
            
            // Add wiki title
            html += `<div class="settlement-popup-wiki-title">${this.escapeHtml(wikiTitle)}</div>`;
            
            // Add wiki description if available
            if (wikiDescription && wikiDescription.trim() !== '') {
                html += `<div class="settlement-popup-wiki-description">${this.escapeHtml(wikiDescription)}</div>`;
            }
            
            // Add wiki link if available
            if (wikiUrl && wikiUrl.trim() !== '') {
                html += `<a href="${this.escapeHtml(wikiUrl)}" target="_blank" class="settlement-popup-wiki-link">Read on Wiki</a>`;
            }
            
            html += `</div>`;
        }

        // Add source field at bottom as footnote if present
        if (sourceTag) {
            const fullSourceName = settlementData.getFullSourceName(sourceTag);
            html += `<div class="settlement-popup-source">Source: ${this.escapeHtml(fullSourceName)}</div>`;
        }

        html += '</div>';

        this.popupElement.innerHTML = html;
        this.popupOverlay.setPosition(coordinate);
        this.popupElement.style.display = 'block';
    }

    /**
     * Hide popup
     */
    hidePopup() {
        this.popupElement.style.display = 'none';
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Toggle settlement layer visibility
     * @param {boolean} visible
     */
    setSettlementVisibility(visible) {
        const layer = mapManager.getSettlementLayer();
        if (layer) {
            layer.setVisible(visible);
        }
        if (this.settlementCheckbox) {
            this.settlementCheckbox.checked = visible;
        }
    }

    /**
     * Get settlement visibility state
     * @returns {boolean}
     */
    isSettlementVisible() {
        const layer = mapManager.getSettlementLayer();
        return layer ? layer.getVisible() : true;
    }
}

// Create global instance
const uiControls = new UIControls();
window.uiControls = uiControls;
