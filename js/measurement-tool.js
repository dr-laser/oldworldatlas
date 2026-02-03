/**
 * Measurement tool for Old World Atlas
 * Allows users to measure distances on the map
 */

class MeasurementTool {
    constructor() {
        this.map = null;
        this.measurementSource = null;
        this.measurementLayer = null;
        this.draw = null;
        this.modify = null;
        this.isActive = false;
        this.tipPoint = null;
        this.segmentStyles = [];
        
        // Initialize styles
        this.initializeStyles();
    }

    /**
     * Initialize measurement styles
     * @private
     */
    initializeStyles() {
        // Base style for measurement lines
        this.style = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.8)',
                lineDash: [10, 10],
                width: 3,
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: 'rgb(0, 0, 0)',
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.9)',
                }),
            }),
            zIndex: 10000,
        });

        // Label style for total measurement
        this.labelStyle = new ol.style.Style({
            text: new ol.style.Text({
                font: '14px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 1)',
                }),
                backgroundFill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.8)',
                }),
                padding: [3, 3, 3, 3],
                textBaseline: 'bottom',
                offsetY: -15,
            }),
            image: new ol.style.RegularShape({
                radius: 8,
                points: 3,
                angle: Math.PI,
                displacement: [0, 10],
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.8)',
                }),
            }),
            zIndex: 10001,
        });

        // Tip style for instructions
        this.tipStyle = new ol.style.Style({
            text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 1)',
                }),
                backgroundFill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.7)',
                }),
                padding: [3, 3, 3, 3],
                textAlign: 'left',
                offsetX: 15,
            }),
            zIndex: 10001,
        });

        // Modify style for editing
        this.modifyStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: 'rgb(0, 0, 0)',
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.5)',
                }),
            }),
            text: new ol.style.Text({
                text: 'Drag to modify',
                font: '12px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 1)',
                }),
                backgroundFill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.7)',
                }),
                padding: [3, 3, 3, 3],
                textAlign: 'left',
                offsetX: 15,
            }),
            zIndex: 10001,
        });

        // Segment style for individual segment labels
        this.segmentStyle = new ol.style.Style({
            text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 1)',
                }),
                backgroundFill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.6)',
                }),
                padding: [2, 2, 2, 2],
                textBaseline: 'bottom',
                offsetY: -12,
            }),
            image: new ol.style.RegularShape({
                radius: 6,
                points: 3,
                angle: Math.PI,
                displacement: [0, 8],
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.6)',
                }),
            }),
            zIndex: 10001,
        });

        this.segmentStyles = [this.segmentStyle];
    }

    /**
     * Format length in miles
     * @private
     * @param {ol.geom.LineString} line - Line geometry
     * @returns {string} Formatted length
     */
    formatLength(line) {
        const length = line.getLength();
        // Using map units directly as miles (no scaling)
        let output = Math.round(length * 10000) / 100 + ' miles';
        return output;
    }

    /**
     * Style function for measurement features
     * @private
     */
    styleFunction(feature, showSegments, drawType, tip) {
        const styles = [];
        const geometry = feature.getGeometry();
        const type = geometry.getType();
        let point, label, line;

        if (!drawType || drawType === type || type === 'Point') {
            styles.push(this.style);
            if (type === 'LineString') {
                point = new ol.geom.Point(geometry.getLastCoordinate());
                label = this.formatLength(geometry) + '';
                line = geometry;
            }
        }

        // Show segment lengths
        if (showSegments && line) {
            let count = 0;
            line.forEachSegment((a, b) => {
                const segment = new ol.geom.LineString([a, b]);
                const label = this.formatLength(segment);
                if (this.segmentStyles.length - 1 < count) {
                    this.segmentStyles.push(this.segmentStyle.clone());
                }
                const segmentPoint = new ol.geom.Point(segment.getCoordinateAt(0.5));
                this.segmentStyles[count].setGeometry(segmentPoint);
                this.segmentStyles[count].getText().setText(label);
                styles.push(this.segmentStyles[count]);
                count++;
            });
        }

        // Add total label
        if (label) {
            this.labelStyle.setGeometry(point);
            this.labelStyle.getText().setText(label);
            styles.push(this.labelStyle);
        }

        // Add tip
        if (
            tip &&
            type === 'Point' &&
            !this.modify.getOverlay().getSource().getFeatures().length
        ) {
            this.tipPoint = geometry;
            this.tipStyle.getText().setText(tip);
            styles.push(this.tipStyle);
        }

        return styles;
    }

    /**
     * Initialize the measurement tool
     * @param {ol.Map} map - OpenLayers map instance
     */
    initialize(map) {
        this.map = map;
        
        // Create measurement source and layer
        this.measurementSource = new ol.source.Vector();
        
        this.measurementLayer = new ol.layer.Vector({
            source: this.measurementSource,
            style: (feature) => {
                return this.styleFunction.call(this, feature, true, null, null);
            },
            declutter: false, // Disable decluttering to ensure labels always show
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            renderOrder: null, // Render in the order features are added
        });
        
        // Set z-index to ensure measurement layer renders on top of all other layers
        // Must be higher than settlement highlighted z-index (9999)
        this.measurementLayer.setZIndex(10000);
        
        this.map.addLayer(this.measurementLayer);
        
        // Force the measurement layer to be the topmost layer
        const layers = this.map.getLayers();
        const layerArray = layers.getArray();
        const measurementLayerIndex = layerArray.indexOf(this.measurementLayer);
        if (measurementLayerIndex !== layerArray.length - 1) {
            layers.removeAt(measurementLayerIndex);
            layers.push(this.measurementLayer);
        }
        this.measurementLayer.setZIndex(10000);
        
        // Create modify interaction
        this.modify = new ol.interaction.Modify({
            source: this.measurementSource,
            style: this.modifyStyle
        });
        
        // Don't add modify interaction yet - only when measurement tool is active
    }

    /**
     * Activate measurement tool
     */
    activate() {
        if (this.isActive) return;
        
        this.isActive = true;
        let tip = 'Click to start measuring';
        
        // Create draw interaction
        this.draw = new ol.interaction.Draw({
            source: this.measurementSource,
            type: 'LineString',
            style: (feature) => {
                return this.styleFunction.call(this, feature, true, 'LineString', tip);
            },
        });
        
        // Handle draw start
        this.draw.on('drawstart', () => {
            this.modify.setActive(false);
            tip = 'Double-click to end measurement';
        });
        
        // Handle draw end
        this.draw.on('drawend', () => {
            this.modifyStyle.setGeometry(this.tipPoint);
            this.modify.setActive(true);
            this.map.once('pointermove', () => {
                this.modifyStyle.setGeometry(null);
            });
            tip = 'Click to start measuring';
            
            // Show clear button when a measurement is completed
            this.showClearButton();
        });
        
        this.modify.setActive(true);
        this.map.addInteraction(this.draw);
        this.map.addInteraction(this.modify);
        
        // Update button state
        const button = document.getElementById('measure-button');
        const mobileButton = document.getElementById('mobile-measure-button');
        if (button) button.classList.add('active');
        if (mobileButton) mobileButton.classList.add('active');
        
        console.log('Measurement tool activated');
    }

    /**
     * Deactivate measurement tool
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Remove interactions
        if (this.draw) {
            this.map.removeInteraction(this.draw);
            this.draw = null;
        }
        if (this.modify) {
            this.map.removeInteraction(this.modify);
        }
        
        // Update button state
        const button = document.getElementById('measure-button');
        const mobileButton = document.getElementById('mobile-measure-button');
        if (button) button.classList.remove('active');
        if (mobileButton) mobileButton.classList.remove('active');
        
        console.log('Measurement tool deactivated');
    }

    /**
     * Toggle measurement tool
     */
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    /**
     * Clear all measurements
     */
    clearMeasurements() {
        if (this.measurementSource) {
            this.measurementSource.clear();
            this.hideClearButton();
        }
    }

    /**
     * Show clear button
     * @private
     */
    showClearButton() {
        const clearButton = document.getElementById('clear-measure-button');
        const mobileClearButton = document.getElementById('mobile-clear-measure-button');
        if (clearButton) {
            clearButton.classList.add('visible');
        }
        if (mobileClearButton) {
            mobileClearButton.style.display = 'block';
        }
    }

    /**
     * Hide clear button
     * @private
     */
    hideClearButton() {
        const clearButton = document.getElementById('clear-measure-button');
        const mobileClearButton = document.getElementById('mobile-clear-measure-button');
        if (clearButton) {
            clearButton.classList.remove('visible');
        }
        if (mobileClearButton) {
            mobileClearButton.style.display = 'none';
        }
    }

    /**
     * Check if measurement tool is active
     * @returns {boolean}
     */
    isToolActive() {
        return this.isActive;
    }
}

// Create global instance
const measurementTool = new MeasurementTool();
