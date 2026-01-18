/**
 * Settlement styling definitions for Old World Atlas
 * 
 * Configuration is loaded from styles-config.json
 * This provides granular control over all visual aspects at different zoom levels.
 */

// Global variable to store loaded styles configuration
let STYLES_CONFIG = null;

// Style cache for performance optimization
// Caching styles significantly reduces rendering overhead with thousands of features
const STYLE_CACHE = {
    settlements: new Map(),
    poi: new Map(),
    provinces: new Map(),
    water: new Map()
};

// Cache size limits to prevent memory issues
const MAX_CACHE_SIZE = 1000;

/**
 * Clear style caches (useful when configuration changes)
 */
function clearStyleCaches() {
    STYLE_CACHE.settlements.clear();
    STYLE_CACHE.poi.clear();
    STYLE_CACHE.provinces.clear();
    STYLE_CACHE.water.clear();
}

/**
 * Get or create cached style
 * @param {Map} cache - Cache map
 * @param {string} key - Cache key
 * @param {Function} createFn - Function to create style if not cached
 * @returns {ol.style.Style|null}
 */
function getCachedStyle(cache, key, createFn) {
    if (cache.has(key)) {
        return cache.get(key);
    }
    
    // Limit cache size to prevent memory issues
    if (cache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entries (simple FIFO)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    
    const style = createFn();
    cache.set(key, style);
    return style;
}

/**
 * Load styles configuration from JSON file
 * @returns {Promise<Object>} Loaded configuration
 */
async function loadStylesConfig() {
    if (STYLES_CONFIG) {
        return STYLES_CONFIG;
    }
    
    try {
        const response = await fetch('styles-config.json');
        STYLES_CONFIG = await response.json();
        return STYLES_CONFIG;
    } catch (error) {
        console.error('Error loading styles configuration:', error);
        // Return empty config as fallback
        return { settlements: {}, poi: {}, provinces: {}, water: {} };
    }
}

/**
 * Linear interpolation helper
 * @param {number} value - Current value
 * @param {number} minIn - Minimum input value
 * @param {number} maxIn - Maximum input value
 * @param {number} minOut - Minimum output value
 * @param {number} maxOut - Maximum output value
 * @returns {number} Interpolated value
 */
function lerp(value, minIn, maxIn, minOut, maxOut) {
    // Clamp value between min and max
    value = Math.max(minIn, Math.min(maxIn, value));
    
    // Linear interpolation
    const t = (value - minIn) / (maxIn - minIn);
    return minOut + t * (maxOut - minOut);
}

/**
 * Get interpolated font size based on zoom level
 * @param {Object} config - Style configuration with min/max font settings
 * @param {number} currentResolution - Current map resolution
 * @returns {number} Interpolated font size
 */
function getInterpolatedFontSize(config, currentResolution) {
    return Math.round(lerp(
        currentResolution,
        config.minFontZoom,
        config.maxFontZoom,
        config.minFontSize,
        config.maxFontSize
    ));
}

/**
 * Get interpolated dot radius based on zoom level
 * @param {Object} config - Style configuration with min/max radius settings
 * @param {number} currentResolution - Current map resolution
 * @returns {number} Interpolated radius
 */
function getInterpolatedRadius(config, currentResolution) {
    return lerp(
        currentResolution,
        config.minDotRadiusZoom,
        config.maxDotRadiusZoom,
        config.minDotRadius,
        config.maxDotRadius
    );
}

/**
 * Check if label should be visible at current zoom level
 * @param {Object} config - Style configuration
 * @param {number} currentResolution - Current map resolution
 * @returns {boolean}
 */
function shouldShowLabel(config, currentResolution) {
    return currentResolution <= config.minZoomLevelLabel && 
           currentResolution >= config.maxZoomLevelLabel;
}

/**
 * Check if dot should be visible at current zoom level
 * @param {Object} config - Style configuration
 * @param {number} currentResolution - Current map resolution
 * @returns {boolean}
 */
function shouldShowDot(config, currentResolution) {
    return currentResolution <= config.minZoomLevelDot && 
           currentResolution >= config.maxZoomLevelDot;
}


/**
 * Create an OpenLayers Style object for a POI
 * @param {OL.Feature} feature - OpenLayers feature
 * @param {number} currentResolution - Current map resolution
 * @returns {OL.style.Style}
 */
function createPOIStyle(feature, currentResolution) {
    if (!STYLES_CONFIG) {
        console.warn('Styles configuration not loaded yet');
        return null;
    }
    
    const config = STYLES_CONFIG.poi.default;
    
    // Early exit for performance - don't even check visibility if way out of range
    if (currentResolution > config.minZoomLevelLabel * 2) {
        return null;
    }
    
    // Use cache for performance
    const cacheKey = `${currentResolution.toFixed(4)}`;
    return getCachedStyle(STYLE_CACHE.poi, cacheKey, () => {
        const baseConfig = STYLES_CONFIG.poi.baseConfig;
        
        // Check visibility
        const showLabel = shouldShowLabel(config, currentResolution);
        const showDotVisible = shouldShowDot(config, currentResolution);
        
        if (!showLabel && !showDotVisible) {
            return null;
        }
    
        // Get interpolated values
        const fontSize = getInterpolatedFontSize(config, currentResolution);
        const radius = getInterpolatedRadius(config, currentResolution);
        
        const style = new ol.style.Style({});
        
        // Add text if visible
        if (showLabel) {
            style.setText(new ol.style.Text({
                text: feature.get('name'),
                offsetY: baseConfig.textOffsetY,
                font: fontSize + 'px ' + baseConfig.textFont,
                fill: new ol.style.Fill({ color: baseConfig.textFillColor }),
                stroke: new ol.style.Stroke({ 
                    color: baseConfig.textStrokeColor, 
                    width: baseConfig.textStrokeWidth 
                })
            }));
        }
        
        // Add dot if visible
        if (showDotVisible) {
            style.setImage(new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({ color: baseConfig.color }),
                stroke: new ol.style.Stroke({ 
                    color: baseConfig.strokeColor, 
                    width: config.strokeWidth 
                })
            }));
        }
        
        return style;
    });
}

/**
 * Create an OpenLayers Style object for a settlement
 * @param {OL.Feature} feature - OpenLayers feature
 * @param {number} currentResolution - Current map resolution
 * @returns {OL.style.Style}
 */
function createSettlementStyle(feature, currentResolution) {
    if (!STYLES_CONFIG) {
        console.warn('Styles configuration not loaded yet');
        return null;
    }
    
    const sizeCategory = feature.get('sizeCategory');
    const config = STYLES_CONFIG.settlements.sizeCategories[sizeCategory];
    
    if (!config) {
        return null;
    }
    
    // Early exit for performance - don't even check if way out of range
    if (currentResolution > config.minZoomLevelLabel * 2) {
        return null;
    }
    
    // Use cache for performance - key includes size category and resolution
    const cacheKey = `${sizeCategory}_${currentResolution.toFixed(4)}`;
    return getCachedStyle(STYLE_CACHE.settlements, cacheKey, () => {
        const baseConfig = STYLES_CONFIG.settlements.baseConfig;
        
        // Check visibility
        const showLabel = shouldShowLabel(config, currentResolution);
        const showDotVisible = shouldShowDot(config, currentResolution);
        
        if (!showLabel && !showDotVisible) {
            return null;
        }
    
        // Get interpolated values
        const fontSize = getInterpolatedFontSize(config, currentResolution);
        const radius = getInterpolatedRadius(config, currentResolution);
        
        const style = new ol.style.Style({});
        
        // Add text if visible
        if (showLabel) {
            style.setText(new ol.style.Text({
                text: feature.get('name'),
                offsetY: baseConfig.textOffsetY,
                font: fontSize + 'px ' + baseConfig.textFont,
                fill: new ol.style.Fill({ color: baseConfig.textFillColor }),
                stroke: new ol.style.Stroke({ 
                    color: baseConfig.textStrokeColor, 
                    width: baseConfig.textStrokeWidth 
                })
            }));
        }
        
        // Add dot if visible
        if (showDotVisible) {
            style.setImage(new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({ color: config.color }),
                stroke: new ol.style.Stroke({ 
                    color: config.strokeColor || baseConfig.strokeColor, 
                    width: config.strokeWidth 
                })
            }));
        }
        
        return style;
    });
}

/**
 * Create an OpenLayers Style object for a province label
 * @param {OL.Feature} feature - OpenLayers feature
 * @param {number} currentResolution - Current map resolution
 * @returns {OL.style.Style}
 */
function createProvinceStyle(feature, currentResolution) {
    if (!STYLES_CONFIG) {
        console.warn('Styles configuration not loaded yet');
        return null;
    }
    
    const provinceType = feature.get('provinceType');
    const config = STYLES_CONFIG.provinces[provinceType];
    
    if (!config) {
        return null;
    }
    
    // Check if should be visible (early exit)
    if (!shouldShowLabel(config, currentResolution)) {
        return null;
    }
    
    // Use cache for performance
    const cacheKey = `${provinceType}_${currentResolution.toFixed(4)}`;
    return getCachedStyle(STYLE_CACHE.provinces, cacheKey, () => {
        // Get interpolated font size
        const fontSize = getInterpolatedFontSize(config, currentResolution);
        
        return new ol.style.Style({
            text: new ol.style.Text({
                text: feature.get('name'),
                font: fontSize + 'px ' + config.textFont,
                fill: new ol.style.Fill({ color: config.textFillColor }),
                stroke: new ol.style.Stroke({ 
                    color: config.textStrokeColor, 
                    width: config.textStrokeWidth 
                })
            })
        });
    });
}

/**
 * Create an OpenLayers Style object for a water label
 * @param {OL.Feature} feature - OpenLayers feature
 * @param {number} currentResolution - Current map resolution
 * @returns {OL.style.Style}
 */
function createWaterStyle(feature, currentResolution) {
    if (!STYLES_CONFIG) {
        console.warn('Styles configuration not loaded yet');
        return null;
    }
    
    const waterbodyType = feature.get('waterbodyType');
    const config = STYLES_CONFIG.water[waterbodyType];
    
    if (!config) {
        return null;
    }
    
    // Check if should be visible (early exit)
    if (!shouldShowLabel(config, currentResolution)) {
        return null;
    }
    
    // Use cache for performance
    const cacheKey = `${waterbodyType}_${currentResolution.toFixed(4)}`;
    return getCachedStyle(STYLE_CACHE.water, cacheKey, () => {
        // Get interpolated font size
        const fontSize = getInterpolatedFontSize(config, currentResolution);
        
        return new ol.style.Style({
            text: new ol.style.Text({
                text: feature.get('name'),
                font: fontSize + 'px ' + config.textFont,
                fill: new ol.style.Fill({ color: config.textFillColor }),
                stroke: new ol.style.Stroke({ 
                    color: config.textStrokeColor, 
                    width: config.textStrokeWidth 
                })
            })
        });
    });
}
