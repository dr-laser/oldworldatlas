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
                formalTitle: feature.properties.formal_title,
                population: feature.properties.population,
                info: feature.properties.info || {},
                coordinates: feature.geometry.coordinates
            }));

            // Create OpenLayers features
            this.olFeatures = this.provinces.map(province => {
                const info = province.info || {};
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(province.coordinates),
                    name: province.name,
                    provinceType: province.provinceType,
                    formalTitle: province.formalTitle,
                    population: province.population,
                    wikiUrl: info.wiki_url,
                    wikiDescription: info.description,
                    featureType: 'province'
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
