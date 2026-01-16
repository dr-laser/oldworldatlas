/**
 * Points of Interest data management for Old World Atlas
 */

class POIDataManager {
    constructor() {
        this.rawFeatures = [];
        this.poiMap = new Map(); // For quick lookup by name
    }

    /**
     * Load POIs from GeoJSON file
     * @param {string} dataPath - Path to GeoJSON file
     * @returns {Promise}
     */
    async loadPOIs(dataPath) {
        try {
            const response = await fetch(dataPath);
            const data = await response.json();
            this.rawFeatures = data.features;
            this.indexPOIs();
            return this.rawFeatures;
        } catch (error) {
            console.error('Error loading POIs:', error);
            throw error;
        }
    }

    /**
     * Build index of POIs
     * @private
     */
    indexPOIs() {
        this.poiMap.clear();
        this.rawFeatures.forEach(feature => {
            const name = feature.properties.name;
            if (name) {
                this.poiMap.set(name, feature);
            }
        });
    }

    /**
     * Convert raw feature to POI object
     * @param {object} feature - GeoJSON feature
     * @returns {object}
     */
    featureToPOI(feature) {
        const coords = feature.geometry.coordinates;
        return {
            name: feature.properties.name,
            type: feature.properties.type || 'Unknown',
            coordinates: coords
        };
    }

    /**
     * Get all POIs as objects
     * @returns {array}
     */
    getAllPOIs() {
        return this.rawFeatures.map(f => this.featureToPOI(f));
    }

    /**
     * Get POI by name
     * @param {string} name - POI name
     * @returns {object|null}
     */
    getPOI(name) {
        const feature = this.poiMap.get(name);
        return feature ? this.featureToPOI(feature) : null;
    }

    /**
     * Get POIs by type
     * @param {string} type - POI type
     * @returns {array}
     */
    getByType(type) {
        return this.getAllPOIs().filter(poi => poi.type === type);
    }

    /**
     * Get raw GeoJSON features for OpenLayers
     * @returns {array}
     */
    getOLFeatures() {
        return this.rawFeatures.map(feature => {
            const coords = feature.geometry.coordinates;
            return new ol.Feature({
                geometry: new ol.geom.Point(coords),
                name: feature.properties.name,
                type: feature.properties.type,
                featureType: 'poi' // Identify as POI for styling
            });
        });
    }
}

// Create global instance
const poiData = new POIDataManager();
