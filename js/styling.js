/**
 * Settlement styling definitions for Old World Atlas
 */

const SETTLEMENT_STYLES = {
    baseConfig: {
        strokeColor: 'rgba(255, 255, 255, 0.9)',
        strokeWidth: 1,
        textOffsetY: -12,
        textFont: 'Arial, sans-serif',
        textFillColor: '#000',
        textStrokeColor: '#fff',
        textStrokeWidth: 2
    },
    
    sizeCategories: {
        1: {
            radius: 2,
            color: 'rgba(100, 200, 100, 0.7)',
            fontSize: 8,
            minZoomLevel: 0.003,
            label: 'Village'
        },
        2: {
            radius: 2.5,
            color: 'rgba(50, 180, 150, 0.75)',
            fontSize: 8,
            minZoomLevel: 0.003,
            label: 'Large Village'
        },
        3: {
            radius: 3,
            color: 'rgba(0, 128, 255, 0.8)',
            fontSize: 9,
            minZoomLevel: 0.010,
            label: 'Small Town'
        },
        4: {
            radius: 4,
            color: 'rgba(255, 128, 0, 0.8)',
            fontSize: 10,
            minZoomLevel: 1.0,
            label: 'City'
        },
        5: {
            radius: 5,
            color: 'rgba(255, 0, 0, 0.8)',
            fontSize: 11,
            minZoomLevel: 1.0,
            label: 'Large City'
        },
        6: {
            radius: 6,
            color: 'rgba(255, 0, 0, 0.8)',
            fontSize: 12,
            minZoomLevel: 1.0,
            label: 'Major City'
        }
    }
};

/**
 * Determine if a settlement should be visible at current zoom level
 * @param {number} sizeCategory - Settlement size category
 * @param {number} currentResolution - Current map resolution
 * @returns {boolean}
 */
function shouldShowSettlement(sizeCategory, currentResolution) {
    const config = SETTLEMENT_STYLES.sizeCategories[sizeCategory];
    if (!config) return false;
    
    return currentResolution <= config.minZoomLevel;
}

/**
 * Get style configuration for a settlement
 * @param {number} sizeCategory - Settlement size category
 * @returns {object}
 */
function getSettlementStyleConfig(sizeCategory) {
    return SETTLEMENT_STYLES.sizeCategories[sizeCategory] || null;
}

/**
 * Create an OpenLayers Style object for a POI
 * @param {OL.Feature} feature - OpenLayers feature
 * @returns {OL.style.Style}
 */
function createPOIStyle(feature) {
    return new ol.style.Style({
        image: new ol.style.Circle({
            radius: 4,
            fill: new ol.style.Fill({ color: 'rgba(148, 0, 211, 0.7)' }),
            stroke: new ol.style.Stroke({ 
                color: 'rgba(255, 255, 255, 0.9)', 
                width: 1 
            })
        }),
        text: new ol.style.Text({
            text: feature.get('name'),
            offsetY: -12,
            font: '10px Arial, sans-serif',
            fill: new ol.style.Fill({ color: '#000' }),
            stroke: new ol.style.Stroke({ 
                color: '#fff', 
                width: 2 
            })
        })
    });
}

/**
 * Create an OpenLayers Style object for a settlement
 * @param {OL.Feature} feature - OpenLayers feature
 * @param {number} currentResolution - Current map resolution
 * @returns {OL.style.Style}
 */
function createSettlementStyle(feature, currentResolution) {
    const sizeCategory = feature.get('sizeCategory');
    
    // Check if should be visible
    if (!shouldShowSettlement(sizeCategory, currentResolution)) {
        return new ol.style.Style({});
    }
    
    const config = getSettlementStyleConfig(sizeCategory);
    if (!config) {
        return new ol.style.Style({});
    }
    
    return new ol.style.Style({
        image: new ol.style.Circle({
            radius: config.radius,
            fill: new ol.style.Fill({ color: config.color }),
            stroke: new ol.style.Stroke({ 
                color: SETTLEMENT_STYLES.baseConfig.strokeColor, 
                width: SETTLEMENT_STYLES.baseConfig.strokeWidth 
            })
        }),
        text: new ol.style.Text({
            text: feature.get('name'),
            offsetY: SETTLEMENT_STYLES.baseConfig.textOffsetY,
            font: config.fontSize + 'px ' + SETTLEMENT_STYLES.baseConfig.textFont,
            fill: new ol.style.Fill({ color: SETTLEMENT_STYLES.baseConfig.textFillColor }),
            stroke: new ol.style.Stroke({ 
                color: SETTLEMENT_STYLES.baseConfig.textStrokeColor, 
                width: SETTLEMENT_STYLES.baseConfig.textStrokeWidth 
            })
        })
    });
}
