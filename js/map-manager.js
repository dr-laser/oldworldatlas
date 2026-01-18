/**
 * Map management for Old World Atlas
 */

class MapManager {
    constructor(targetElementId = 'map') {
        this.map = null;
        this.targetElementId = targetElementId;
        this.settlementVectorLayer = null;
        this.settlementSource = null;
        this.poiVectorLayer = null;
        this.poiSource = null;
        this.provinceVectorLayer = null;
        this.provinceSource = null;
        this.waterVectorLayer = null;
        this.waterSource = null;
    }

    /**
     * Initialize the map
     * @returns {ol.Map}
     */
    initialize() {
        // Custom coordinate format function
        const coordinateFormat = (coordinate) => {
            if (!coordinate || !this.map) {
                return '';
            }
            const lon = coordinate[0].toFixed(3);
            const lat = coordinate[1].toFixed(3);
            const zoom = this.map.getView().getResolution().toFixed(6);
            return `X=${lon}, Y=${lat}, Z=${zoom}`;
        };

        const mousePositionControl = new ol.control.MousePosition({
            className: 'custom-mouse-position',
            target: document.getElementById('mouse-position'),
            undefinedHTML: '&nbsp;',
            coordinateFormat: coordinateFormat
        });

        this.settlementSource = new ol.source.Vector();
        this.poiSource = new ol.source.Vector();
        this.provinceSource = new ol.source.Vector();
        this.waterSource = new ol.source.Vector();

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
                this.createProvinceLayer(),
                this.createWaterLayer(),
                this.createSettlementLayer(),
                this.createPOILayer()
            ],
            view: new ol.View({
                center: [3.832390, 49.796453],
                resolution: 0.0159930693920000006,
                maxResolution: 0.0370467098591999999,
                minResolution: 0.000578854841549999999
            })
        });

        // Store references to layers for visibility control
        this.provinceVectorLayer = this.map.getLayers().item(1);
        this.waterVectorLayer = this.map.getLayers().item(2);
        this.settlementVectorLayer = this.map.getLayers().item(3);
        this.poiVectorLayer = this.map.getLayers().item(4);
        
        // POI layer starts hidden (unchecked)
        this.poiVectorLayer.setVisible(false);

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
            updateWhileAnimating: false,  // Performance: don't update during animation
            updateWhileInteracting: false, // Performance: don't update while panning/zooming
            renderBuffer: 100,             // Render features slightly outside viewport
            style: (feature) => createSettlementStyle(feature, this.map.getView().getResolution())
        });
    }

    /**
     * Create POI vector layer
     * @private
     * @returns {ol.layer.Vector}
     */
    createPOILayer() {
        return new ol.layer.Vector({
            title: 'Points of Interest',
            source: this.poiSource,
            updateWhileAnimating: false,  // Performance: don't update during animation
            updateWhileInteracting: false, // Performance: don't update while panning/zooming
            renderBuffer: 100,             // Render features slightly outside viewport
            style: (feature) => createPOIStyle(feature, this.map.getView().getResolution())
        });
    }

    /**
     * Create province labels vector layer
     * @private
     * @returns {ol.layer.Vector}
     */
    createProvinceLayer() {
        return new ol.layer.Vector({
            title: 'Province Labels',
            source: this.provinceSource,
            updateWhileAnimating: false,  // Performance: don't update during animation
            updateWhileInteracting: false, // Performance: don't update while panning/zooming
            style: (feature) => createProvinceStyle(feature, this.map.getView().getResolution())
        });
    }

    /**
     * Create water labels vector layer
     * @private
     * @returns {ol.layer.Vector}
     */
    createWaterLayer() {
        return new ol.layer.Vector({
            title: 'Water Labels',
            source: this.waterSource,
            updateWhileAnimating: false,  // Performance: don't update during animation
            updateWhileInteracting: false, // Performance: don't update while panning/zooming
            style: (feature) => createWaterStyle(feature, this.map.getView().getResolution())
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
     * Add features to POI layer
     * @param {array} features - Array of ol.Feature objects
     */
    addPOIFeatures(features) {
        this.poiSource.addFeatures(features);
    }

    /**
     * Add features to province layer
     * @param {array} features - Array of ol.Feature objects
     */
    addProvinceFeatures(features) {
        this.provinceSource.addFeatures(features);
    }

    /**
     * Add features to water layer
     * @param {array} features - Array of ol.Feature objects
     */
    addWaterFeatures(features) {
        this.waterSource.addFeatures(features);
    }

    /**
     * Set up event listeners for map
     */
    setupEventListeners() {
        // Update styles on zoom change
        this.map.getView().on('change:resolution', () => {
            this.settlementSource.changed();
            this.provinceSource.changed();
            this.waterSource.changed();
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

    /**
     * Get POI source
     * @returns {ol.source.Vector}
     */
    getPOISource() {
        return this.poiSource;
    }

    /**
     * Get POI layer
     * @returns {ol.layer.Vector}
     */
    getPOILayer() {
        return this.poiVectorLayer;
    }
}

// Create global instance
const mapManager = new MapManager();
