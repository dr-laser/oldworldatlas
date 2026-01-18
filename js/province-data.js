/**
 * Province label data management for Old World Atlas
 */

class ProvinceData {
    constructor() {
        this.provinces = [];
        this.olFeatures = [];
    }

    /**
     * Load province labels from GeoJSON file
     * @param {string} url - URL to province labels GeoJSON
     * @returns {Promise<Array>} Array of province features
     */
    async loadProvinces(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            this.provinces = data.features.map(feature => ({
                name: feature.properties.name,
                provinceType: feature.properties.province_type,
                coordinates: feature.geometry.coordinates
            }));

            // Create OpenLayers features
            this.olFeatures = this.provinces.map(province => {
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(province.coordinates),
                    name: province.name,
                    provinceType: province.provinceType
                });
                return feature;
            });

            return this.provinces;
        } catch (error) {
            console.error('Error loading provinces:', error);
            throw error;
        }
    }

    /**
     * Get OpenLayers features
     * @returns {Array<ol.Feature>}
     */
    getOLFeatures() {
        return this.olFeatures;
    }

    /**
     * Get all provinces
     * @returns {Array}
     */
    getProvinces() {
        return this.provinces;
    }
}

// Create global instance
const provinceData = new ProvinceData();
