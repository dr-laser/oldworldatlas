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
            fontSize: 11,  // Increased from 8
            minZoomLevel: 0.003,
            minZoomLevelDot: 0.010,  // Dots appear when size 3 appears
            textOffsetY: -8,  // Closer to dot
            label: 'Village'
        },
        2: {
            radius: 2.5,
            color: 'rgba(50, 180, 150, 0.75)',
            fontSize: 11,  // Increased from 8
            minZoomLevel: 0.003,
            minZoomLevelDot: 0.010,  // Dots appear when size 3 appears
            textOffsetY: -9,  // Closer to dot
            label: 'Large Village'
        },
        3: {
            radius: 3,
            color: 'rgba(0, 128, 255, 0.8)',
            fontSize: 12,  // Increased from 9
            minZoomLevel: 0.010,
            textOffsetY: -10,
            label: 'Small Town'
        },
        4: {
            radius: 4,
            color: 'rgba(255, 128, 0, 0.8)',
            fontSize: 13,  // Increased from 10
            minZoomLevel: 1.0,
            textOffsetY: -12,
            label: 'City'
        },
        5: {
            radius: 5,
            color: 'rgba(255, 0, 0, 0.8)',
            fontSize: 14,  // Increased from 11
            minZoomLevel: 1.0,
            textOffsetY: -13,
            label: 'Large City'
        },
        6: {
            radius: 6,
            color: 'rgba(255, 0, 0, 0.8)',
            fontSize: 15,  // Increased from 12
            minZoomLevel: 1.0,
            textOffsetY: -14,
            label: 'Major City'
        }
    }
};

/**
 * Province label styling definitions
 */
const PROVINCE_STYLES = {
    'Nation-State': {
        fontSize: 32,
        maxZoomLevel: 0.003,  // Disappears when size 1/2 settlements pop in
        textFont: 'bold Arial, sans-serif',
        textFillColor: '#000',
        textStrokeColor: '#fff',
        textStrokeWidth: 3
    },
    'Grand-Province': {
        fontSize: 24,
        maxZoomLevel: 0.0015,  // Disappears a few zoom levels further in
        textFont: 'bold Arial, sans-serif',
        textFillColor: '#000',
        textStrokeColor: '#fff',
        textStrokeWidth: 2.5
    },
    'Province': {
        fontSize: 18,
        maxZoomLevel: 0.0015,  // Disappears at same time as Grand-Province
        textFont: 'bold Arial, sans-serif',
        textFillColor: '#000',
        textStrokeColor: '#fff',
        textStrokeWidth: 2
    }
};

/**
 * Water label styling definitions
 */
const WATER_STYLES = {
    'Ocean': {
        fontSize: 28,
        textFont: 'italic Arial, sans-serif',
        textFillColor: '#0066cc',
        textStrokeColor: '#fff',
        textStrokeWidth: 2.5,
        maxZoomLevel: 0.010
    },
    'Major Sea': {
        fontSize: 24,
        textFont: 'italic Arial, sans-serif',
        textFillColor: '#0066cc',
        textStrokeColor: '#fff',
        textStrokeWidth: 2.5,
        maxZoomLevel: 0.006
    },
    'Large Sea': {
        fontSize: 20,
        textFont: 'italic Arial, sans-serif',
        textFillColor: '#0066cc',
        textStrokeColor: '#fff',
        textStrokeWidth: 2,
        maxZoomLevel: 0.004
    },
    'Medium Sea': {
        fontSize: 16,
        textFont: 'italic Arial, sans-serif',
        textFillColor: '#0066cc',
        textStrokeColor: '#fff',
        textStrokeWidth: 2,
        maxZoomLevel: 0.003
    },
    'Small Sea': {
        fontSize: 14,
        textFont: 'italic Arial, sans-serif',
        textFillColor: '#0066cc',
        textStrokeColor: '#fff',
        textStrokeWidth: 2,
        maxZoomLevel: 0.002
    },
    'Large Marsh': {
        fontSize: 14,
        textFont: 'italic Arial, sans-serif',
        textFillColor: '#009999',  // Blue-green
        textStrokeColor: '#fff',
        textStrokeWidth: 2,
        maxZoomLevel: 0.002
    },
    'Small Marsh': {
        fontSize: 12,
        textFont: 'italic Arial, sans-serif',
        textFillColor: '#009999',  // Blue-green
        textStrokeColor: '#fff',
        textStrokeWidth: 2,
        maxZoomLevel: 0.0015
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
 * Determine if a settlement dot should be visible at current zoom level
 * @param {number} sizeCategory - Settlement size category
 * @param {number} currentResolution - Current map resolution
 * @returns {boolean}
 */
function shouldShowSettlementDot(sizeCategory, currentResolution) {
    const config = SETTLEMENT_STYLES.sizeCategories[sizeCategory];
    if (!config) return false;
    
    // Use minZoomLevelDot if defined, otherwise use minZoomLevel
    const dotZoomLevel = config.minZoomLevelDot || config.minZoomLevel;
    return currentResolution <= dotZoomLevel;
}

/**
 * Calculate dynamic font size for settlements based on zoom level
 * @param {number} baseFontSize - Base font size
 * @param {number} currentResolution - Current map resolution
 * @param {number} minZoomLevel - When label first appears
 * @returns {number} Adjusted font size
 */
function getDynamicSettlementFontSize(baseFontSize, currentResolution, minZoomLevel) {
    // Scale up font size as we zoom in further from initial appearance
    // Scale from 1x to 2x over the first few zoom levels
    const zoomRatio = minZoomLevel / currentResolution;
    
    if (zoomRatio <= 1) return baseFontSize;
    
    // Scale gradually: at 2x zoom -> 1.3x font, at 4x zoom -> 1.6x font, at 8x zoom -> 2x font (capped)
    const scaleFactor = Math.min(2.0, 1 + Math.log2(zoomRatio) * 0.3);
    return Math.round(baseFontSize * scaleFactor);
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

    // Determine if dot should be visible
    const showDot = shouldShowSettlementDot(sizeCategory, currentResolution);
    
    // Get dynamic font size
    const fontSize = getDynamicSettlementFontSize(config.fontSize, currentResolution, config.minZoomLevel);
    
    // Use custom textOffsetY if defined, otherwise use base config
    const textOffsetY = config.textOffsetY || SETTLEMENT_STYLES.baseConfig.textOffsetY;
    
    const style = new ol.style.Style({
        text: new ol.style.Text({
            text: feature.get('name'),
            offsetY: textOffsetY,
            font: fontSize + 'px ' + SETTLEMENT_STYLES.baseConfig.textFont,
            fill: new ol.style.Fill({ color: SETTLEMENT_STYLES.baseConfig.textFillColor }),
            stroke: new ol.style.Stroke({ 
                color: SETTLEMENT_STYLES.baseConfig.textStrokeColor, 
                width: SETTLEMENT_STYLES.baseConfig.textStrokeWidth 
            })
        })
    });
    
    // Only add image (dot) if it should be visible
    if (showDot) {
        style.setImage(new ol.style.Circle({
            radius: config.radius,
            fill: new ol.style.Fill({ color: config.color }),
            stroke: new ol.style.Stroke({ 
                color: SETTLEMENT_STYLES.baseConfig.strokeColor, 
                width: SETTLEMENT_STYLES.baseConfig.strokeWidth 
            })
        }));
    }
    
    return style;
}

/**
 * Create an OpenLayers Style object for a province label
 * @param {OL.Feature} feature - OpenLayers feature
 * @param {number} currentResolution - Current map resolution
 * @returns {OL.style.Style}
 */
function createProvinceStyle(feature, currentResolution) {
    const provinceType = feature.get('provinceType');
    const config = PROVINCE_STYLES[provinceType];
    
    if (!config) {
        return new ol.style.Style({});
    }
    
    // Check if should be visible (disappears when zoomed in too far)
    if (currentResolution < config.maxZoomLevel) {
        return new ol.style.Style({});
    }
    
    return new ol.style.Style({
        text: new ol.style.Text({
            text: feature.get('name'), // Already in uppercase in data
            font: config.fontSize + 'px ' + config.textFont,
            fill: new ol.style.Fill({ color: config.textFillColor }),
            stroke: new ol.style.Stroke({ 
                color: config.textStrokeColor, 
                width: config.textStrokeWidth 
            })
        })
    });
}

/**
 * Create an OpenLayers Style object for a water label
 * @param {OL.Feature} feature - OpenLayers feature
 * @param {number} currentResolution - Current map resolution
 * @returns {OL.style.Style}
 */
function createWaterStyle(feature, currentResolution) {
    const waterbodyType = feature.get('waterbodyType');
    const config = WATER_STYLES[waterbodyType];
    
    if (!config) {
        return new ol.style.Style({});
    }
    
    // Check if should be visible (disappears when zoomed in too far)
    if (currentResolution < config.maxZoomLevel) {
        return new ol.style.Style({});
    }
    
    return new ol.style.Style({
        text: new ol.style.Text({
            text: feature.get('name'), // Already in uppercase in data
            font: config.fontSize + 'px ' + config.textFont,
            fill: new ol.style.Fill({ color: config.textFillColor }),
            stroke: new ol.style.Stroke({ 
                color: config.textStrokeColor, 
                width: config.textStrokeWidth 
            })
        })
    });
}
