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
    const baseConfig = STYLES_CONFIG.poi.baseConfig;
    
    // Early exit for performance - don't even check visibility if way out of range
    if (currentResolution > config.minZoomLevelLabel * 2) {
        return null;
    }
    
    // Check visibility
    const showLabel = shouldShowLabel(config, currentResolution);
    const showDotVisible = shouldShowDot(config, currentResolution);
    
    if (!showLabel && !showDotVisible) {
        return null;
    }
    
    // Get interpolated values
    const fontSize = getInterpolatedFontSize(config, currentResolution);
    const radius = getInterpolatedRadius(config, currentResolution);
    
    // Cache the circle image (non-feature-specific)
    let imageStyle = null;
    if (showDotVisible) {
        const imageCacheKey = `poi_img_${currentResolution.toFixed(4)}`;
        imageStyle = getCachedStyle(STYLE_CACHE.poi, imageCacheKey, () => {
            return new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({ color: baseConfig.color }),
                stroke: new ol.style.Stroke({ 
                    color: baseConfig.strokeColor, 
                    width: config.strokeWidth 
                })
            });
        });
    }
    
    // Create style with feature-specific text (not cached)
    const style = new ol.style.Style({
        image: imageStyle
    });
    
    // Add text if visible (feature-specific, so not cached)
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
    
    return style;
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
    const baseConfig = STYLES_CONFIG.settlements.baseConfig;
    
    if (!config) {
        return null;
    }
    
    // Early exit for performance - don't even check if way out of range
    if (currentResolution > config.minZoomLevelLabel * 2) {
        return null;
    }
    
    // Check visibility
    const showLabel = shouldShowLabel(config, currentResolution);
    const showDotVisible = shouldShowDot(config, currentResolution);
    
    if (!showLabel && !showDotVisible) {
        return null;
    }
    
    // Get interpolated values
    const fontSize = getInterpolatedFontSize(config, currentResolution);
    const radius = getInterpolatedRadius(config, currentResolution);
    
    // Cache the circle image (non-feature-specific)
    let imageStyle = null;
    if (showDotVisible) {
        const imageCacheKey = `settle_img_${sizeCategory}_${currentResolution.toFixed(4)}`;
        imageStyle = getCachedStyle(STYLE_CACHE.settlements, imageCacheKey, () => {
            return new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({ color: config.color }),
                stroke: new ol.style.Stroke({ 
                    color: config.strokeColor || baseConfig.strokeColor, 
                    width: config.strokeWidth 
                })
            });
        });
    }
    
    // Create style with feature-specific text (not cached)
    // Set zIndex based on settlement size for decluttering priority
    // Higher population settlements get higher zIndex and won't be hidden
    const style = new ol.style.Style({
        image: imageStyle,
        zIndex: config.zIndex || sizeCategory  // Use configured zIndex or fall back to size
    });
    
    // Add text if visible (feature-specific, so not cached)
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
    
    return style;
}

/**
 * Create an OpenLayers Style object for a settlement marker only (no label)
 * Used for the always-visible marker layer underneath the decluttered label layer
 * @param {OL.Feature} feature - OpenLayers feature
 * @param {number} currentResolution - Current map resolution
 * @returns {OL.style.Style}
 */
function createSettlementMarkerOnlyStyle(feature, currentResolution) {
    if (!STYLES_CONFIG) {
        return null;
    }
    
    const sizeCategory = feature.get('sizeCategory');
    const config = STYLES_CONFIG.settlements.sizeCategories[sizeCategory];
    const baseConfig = STYLES_CONFIG.settlements.baseConfig;
    
    if (!config) {
        return null;
    }
    
    // Early exit for performance
    if (currentResolution > config.minZoomLevelDot * 2) {
        return null;
    }
    
    // Check if dot should be visible
    const showDotVisible = shouldShowDot(config, currentResolution);
    
    if (!showDotVisible) {
        return null;
    }
    
    // Get interpolated radius
    const radius = getInterpolatedRadius(config, currentResolution);
    
    // Cache the circle image
    const imageCacheKey = `settle_marker_${sizeCategory}_${currentResolution.toFixed(4)}`;
    const imageStyle = getCachedStyle(STYLE_CACHE.settlements, imageCacheKey, () => {
        return new ol.style.Circle({
            radius: radius,
            fill: new ol.style.Fill({ color: config.color }),
            stroke: new ol.style.Stroke({ 
                color: config.strokeColor || baseConfig.strokeColor, 
                width: config.strokeWidth 
            })
        });
    });
    
    // Return style with only the marker (no text)
    return new ol.style.Style({
        image: imageStyle
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
    
    // Get interpolated font size
    const fontSize = getInterpolatedFontSize(config, currentResolution);
    
    // Province labels are text-only and feature-specific, so less benefit from caching
    // The font size calculation is lightweight, so we create fresh styles
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
    
    // Get interpolated font size
    const fontSize = getInterpolatedFontSize(config, currentResolution);
    
    // Water labels are text-only and feature-specific, so less benefit from caching
    // The font size calculation is lightweight, so we create fresh styles
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
}
