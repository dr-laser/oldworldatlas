# Styles Configuration Guide

## Overview

The Old World Atlas uses a centralized JSON-based configuration system for all map styling. This allows for easy customization of how settlements, POIs, provinces, and water labels appear at different zoom levels.

## Configuration File

All styling parameters are defined in `styles-config.json` at the root of the project.

## Configuration Structure

### Settlements

Each settlement size category (1-6) can be configured with the following parameters:

#### Visual Properties
- **`label`**: Display name for the category (e.g., "Village", "City")
- **`color`**: RGBA color of the dot/marker (e.g., `"rgba(100, 200, 100, 0.7)"`)
- **`strokeColor`**: Color of the dot's outline
- **`strokeWidth`**: Width of the dot's outline in pixels

#### Font Sizing (Labels)
- **`minFontSize`**: Font size (in pixels) when the label first appears
- **`maxFontSize`**: Font size (in pixels) at maximum zoom
- **`minFontZoom`**: Map resolution at which font is at minimum size (label first appears at or below this resolution)
- **`maxFontZoom`**: Map resolution at which font reaches maximum size

#### Dot/Marker Sizing
- **`minDotRadius`**: Radius (in pixels) when the dot first appears
- **`maxDotRadius`**: Radius (in pixels) at maximum zoom
- **`minDotRadiusZoom`**: Map resolution at which dot is at minimum radius
- **`maxDotRadiusZoom`**: Map resolution at which dot reaches maximum radius

#### Visibility Controls
- **`minZoomLevelLabel`**: Map resolution threshold - label appears at or below this value
- **`maxZoomLevelLabel`**: Map resolution threshold - label disappears below this value
- **`minZoomLevelDot`**: Map resolution threshold - dot appears at or below this value
- **`maxZoomLevelDot`**: Map resolution threshold - dot disappears below this value

### Points of Interest (POI)

POIs use a `default` configuration with the same parameter structure as settlements:
- Font sizing parameters
- Dot radius parameters
- Visibility controls
- Base visual properties (color, stroke)

### Provinces

Province labels have three types: `Nation-State`, `Grand-Province`, and `Province`.

Each can be configured with:
- **`minFontSize`** / **`maxFontSize`**: Font size range
- **`minFontZoom`** / **`maxFontZoom`**: Zoom levels for font interpolation
- **`minZoomLevelLabel`** / **`maxZoomLevelLabel`**: Visibility thresholds
- **`textFont`**: Font family and weight (e.g., `"bold Arial, sans-serif"`)
- **`textFillColor`**: Text color
- **`textStrokeColor`**: Text outline color
- **`textStrokeWidth`**: Text outline width

### Water Labels

Water labels support types like `Ocean`, `Major Sea`, `Large Sea`, etc.

Configuration parameters:
- Font sizing and zoom parameters (same as provinces)
- Visibility controls
- Text styling (font, colors, stroke)

## Understanding Resolution Values

In OpenLayers, "resolution" represents how many map units (degrees) are represented by one pixel. **Lower resolution values = more zoomed in**.

### Typical Resolution Values
- `100.0` - Very zoomed out (world view)
- `1.0` - Zoomed out (region view)
- `0.010` - Medium zoom
- `0.003` - Closer zoom
- `0.0005` - Very zoomed in
- `0.00001` - Maximum zoom

### Visibility Logic
A feature appears when: `currentResolution <= minZoomLevel`
A feature disappears when: `currentResolution < maxZoomLevel`

### Interpolation
Between `minFontZoom` and `maxFontZoom`, the font size smoothly interpolates from `minFontSize` to `maxFontSize`. The same applies to dot radius.

## Design Patterns

### Settlement Size Differentiation

The current configuration differentiates settlement sizes as follows:

**Size 1-2 (Villages)**
- Small dots (2-2.5px min)
- Thin or no stroke (0.5px)
- Smaller fonts (11px min)
- Appear at close zoom (0.003 resolution)
- Dots visible at medium zoom (0.010)

**Size 3 (Small Towns)**
- Medium dots (3px min)
- Normal stroke (1px)
- Medium fonts (12px min)
- Appear at medium zoom (0.010)

**Size 4-6 (Cities)**
- Large dots (4-6px min)
- Thick stroke (1.5-3px)
- Larger fonts (13-15px min)
- Appear at far zoom (1.0 resolution)
- Size 5 has notably thick white border (2.5px)

### Progressive Disclosure

Features are designed to appear progressively as users zoom in:
1. Province/water labels visible at far zoom
2. Large cities appear
3. Province/water labels fade out
4. Medium settlements appear
5. Small settlements appear
6. All features scale up as zoom increases

## Customization Tips

### Making a Feature Appear Earlier
Set a **higher** `minZoomLevelLabel` or `minZoomLevelDot` value (e.g., change from `0.003` to `0.010`)

### Making a Feature Disappear at Close Zoom
Set a **higher** `maxZoomLevelLabel` value (e.g., change from `0.00001` to `0.001`)

### Adjusting Font Scaling
- Increase the difference between `minFontSize` and `maxFontSize` for more dramatic scaling
- Adjust `minFontZoom` and `maxFontZoom` to control at which zoom levels the scaling occurs

### Creating Distinct Visual Hierarchy
- Use different stroke widths (thicker = more important)
- Use different colors for different categories
- Stagger the visibility thresholds so features don't all appear at once

### Testing Changes
1. Edit `styles-config.json`
2. Refresh the browser (no rebuild needed)
3. Zoom in/out to test the appearance at different levels
4. Adjust values iteratively

## Additional Customization Parameters

The system supports several other easily adjustable parameters:

### Base Configuration (shared across a feature type)
- `textOffsetY`: Vertical offset of labels from dots
- `textFont`: Default font family
- `textFillColor`: Default text color
- `textStrokeColor`: Default text outline color
- `textStrokeWidth`: Default text outline width

### Future Expansion
The JSON structure is designed to easily accommodate:
- New feature types (just add new sections)
- Per-feature-instance overrides (extend the structure)
- Animation parameters
- Hover states
- Click interactions
- Custom icons instead of circles

## Technical Implementation

The styling system is implemented in `styling.js`:

- **`loadStylesConfig()`**: Loads the JSON configuration
- **`lerp()`**: Linear interpolation function for smooth transitions
- **`getInterpolatedFontSize()`**: Calculates font size at current zoom
- **`getInterpolatedRadius()`**: Calculates dot radius at current zoom
- **`shouldShowLabel()`**: Determines label visibility
- **`shouldShowDot()`**: Determines dot visibility
- **`createSettlementStyle()`**: Generates OpenLayers style for settlements
- **`createPOIStyle()`**: Generates OpenLayers style for POIs
- **`createProvinceStyle()`**: Generates OpenLayers style for provinces
- **`createWaterStyle()`**: Generates OpenLayers style for water labels

The configuration is loaded at application startup in `app.js` before initializing the map.
