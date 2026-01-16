/**
 * Map management for Old World Atlas
 */

class MapManager {
    constructor(targetElementId = 'map') {
        this.map = null;
        this.targetElementId = targetElementId;
        this.settlementVectorLayer = null;
        this.settlementSource = null;
    }

    /**
     * Initialize the map
     * @returns {ol.Map}
     */
    initialize() {
        const mousePositionControl = new ol.control.MousePosition({
            className: 'custom-mouse-position',
            target: document.getElementById('mouse-position'),
            undefinedHTML: '&nbsp;'
        });

        this.settlementSource = new ol.source.Vector();

        this.map = new ol.Map({
            controls: ol.control.defaults.defaults().extend([mousePositionControl]),
            target: this.targetElementId,
            layers: [
                new ol.layer.Group({
                    title: 'Overlay',
                    layers: [
                        this.createTileLayer(),
                    ]
                }),
                this.createSettlementLayer()
            ],
            view: new ol.View({
                center: [3.832390, 49.796453],
                resolution: 0.0159930693920000006,
                maxResolution: 0.0370467098591999999,
                minResolution: 0.000578854841549999999
            })
        });

        // Store reference to settlement layer for visibility control
        this.settlementVectorLayer = this.map.getLayers().item(1);

        return this.map;
    }

    /**
     * Create tile layer for base map
     * @private
     * @returns {ol.layer.Tile}
     */
    createTileLayer() {
        return new ol.layer.Tile({
            title: 'Map Tiles',
            source: new ol.source.TileImage({
                attributions: '',
                tileGrid: new ol.tilegrid.TileGrid({
                    extent: [-4.7926911472531506, 40.3006238607187441, 13.7306637823468485, 58.8239787903187477],
                    origin: [-4.7926911472531506, 40.3006238607187441],
                    resolutions: [0.0740934197183999999, 0.0370467098591999999, 0.0185233549296, 0.00926167746479999998, 0.00463083873239999999, 0.0023154193662, 0.0011577096831, 0.000578854841549999999],
                    tileSize: [256, 256]
                }),
                tileUrlFunction: function(tileCoord) {
                    return ('https://raw.githubusercontent.com/dr-laser/oldworldatlas-repository/main/{z}/{x}/{y}.png'
                        .replace('{z}', String(tileCoord[0]))
                        .replace('{x}', String(tileCoord[1]))
                        .replace('{y}', String(-1 - tileCoord[2])));
                },
            })
        });
    }

    /**
     * Create settlement vector layer
     * @private
     * @returns {ol.layer.Vector}
     */
    createSettlementLayer() {
        return new ol.layer.Vector({
            title: 'Settlements (Size 3+)',
            source: this.settlementSource,
            style: (feature) => createSettlementStyle(feature, this.map.getView().getResolution())
        });
    }

    /**
     * Add features to settlement layer
     * @param {array} features - Array of ol.Feature objects
     */
    addSettlementFeatures(features) {
        this.settlementSource.addFeatures(features);
    }

    /**
     * Set up event listeners for map
     */
    setupEventListeners() {
        // Update styles on zoom change
        this.map.getView().on('change:resolution', () => {
            this.settlementSource.changed();
        });
    }

    /**
     * Refresh settlement layer styling
     */
    refreshSettlementStyle() {
        this.settlementSource.changed();
    }

    /**
     * Zoom to feature
     * @param {ol.Feature} feature
     * @param {number} zoomLevel - Zoom resolution
     */
    zoomToFeature(feature, zoomLevel = 0.005) {
        const geometry = feature.getGeometry();
        const coordinates = geometry.getCoordinates();
        this.map.getView().animate({
            center: coordinates,
            resolution: zoomLevel,
            duration: 500
        });
    }

    /**
     * Get map instance
     * @returns {ol.Map}
     */
    getMap() {
        return this.map;
    }

    /**
     * Get settlement source
     * @returns {ol.source.Vector}
     */
    getSettlementSource() {
        return this.settlementSource;
    }

    /**
     * Get settlement layer
     * @returns {ol.layer.Vector}
     */
    getSettlementLayer() {
        return this.settlementVectorLayer;
    }
}

// Create global instance
const mapManager = new MapManager();
