/**
 * Settlement data management for Old World Atlas
 */

class SettlementDataManager {
    constructor() {
        this.rawFeatures = [];
        this.filteredFeatures = [];
        this.settlementMap = new Map(); // For quick lookup by name
    }

    /**
     * Load settlements from GeoJSON file
     * @param {string} dataPath - Path to GeoJSON file
     * @returns {Promise}
     */
    async loadSettlements(dataPath) {
        try {
            const response = await fetch(dataPath);
            const data = await response.json();
            this.rawFeatures = data.features;
            this.filterAndIndexSettlements();
            return this.filteredFeatures;
        } catch (error) {
            console.error('Error loading settlements:', error);
            throw error;
        }
    }

    /**
     * Filter settlements based on criteria and build index
     * @private
     */
    filterAndIndexSettlements() {
        this.filteredFeatures = this.rawFeatures.filter(feature => {
            return this.meetsFilterCriteria(feature);
        });

        // Build lookup map
        this.settlementMap.clear();
        this.filteredFeatures.forEach(feature => {
            const name = feature.properties.name;
            if (name) {
                this.settlementMap.set(name, feature);
            }
        });
    }

    /**
     * Check if feature meets filter criteria
     * @private
     * @param {object} feature - GeoJSON feature
     * @returns {boolean}
     */
    meetsFilterCriteria(feature) {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        // Valid coordinates
        if (!isValidCoordinate(coords)) {
            return false;
        }

        // Within bounds
        const [lon, lat] = coords;
        if (!isWithinBounds(lon, lat)) {
            return false;
        }

        // Size category >= 3
        if (!props.size_category || props.size_category < 3) {
            return false;
        }

        return true;
    }

    /**
     * Convert raw feature to settlement object
     * @param {object} feature - GeoJSON feature
     * @returns {object}
     */
    featureToSettlement(feature) {
        const coords = feature.geometry.coordinates;
        return {
            name: feature.properties.name,
            sizeCategory: feature.properties.size_category,
            population: feature.properties.population || 0,
            province: feature.properties.province || 'Unknown',
            coordinates: coords,
            notes: feature.properties.notes || []
        };
    }

    /**
     * Get all filtered settlements as objects
     * @returns {array}
     */
    getAllSettlements() {
        return this.filteredFeatures.map(f => this.featureToSettlement(f));
    }

    /**
     * Get settlement by name
     * @param {string} name - Settlement name
     * @returns {object|null}
     */
    getSettlement(name) {
        const feature = this.settlementMap.get(name);
        return feature ? this.featureToSettlement(feature) : null;
    }

    /**
     * Search settlements by name
     * @param {string} query - Search query
     * @returns {array}
     */
    search(query) {
        const settlements = this.getAllSettlements();
        return searchSettlements(settlements, query);
    }

    /**
     * Get settlements by province
     * @param {string} province - Province name
     * @returns {array}
     */
    getByProvince(province) {
        return this.getAllSettlements().filter(s => s.province === province);
    }

    /**
     * Get settlements by size category
     * @param {number} sizeCategory - Size category
     * @returns {array}
     */
    getBySize(sizeCategory) {
        return this.getAllSettlements().filter(s => s.sizeCategory === sizeCategory);
    }

    /**
     * Get raw GeoJSON features for OpenLayers
     * @returns {array}
     */
    getOLFeatures() {
        return this.filteredFeatures.map(feature => {
            const coords = feature.geometry.coordinates;
            return new ol.Feature({
                geometry: new ol.geom.Point(coords),
                name: feature.properties.name,
                sizeCategory: feature.properties.size_category,
                population: feature.properties.population,
                province: feature.properties.province
            });
        });
    }
}

// Create global instance
const settlementData = new SettlementDataManager();
