# Styling System Architecture

## Visual Parameter Flow

```
                    ┌─────────────────────────────────┐
                    │    styles-config.json           │
                    │  (External Configuration)       │
                    └─────────────┬───────────────────┘
                                  │
                                  │ Loaded at startup
                                  ▼
                    ┌─────────────────────────────────┐
                    │   loadStylesConfig()            │
                    │   (styling.js)                  │
                    └─────────────┬───────────────────┘
                                  │
                                  │ Stores in STYLES_CONFIG
                                  ▼
        ┌─────────────────────────┴─────────────────────────┐
        │                                                     │
        │                                                     │
┌───────▼────────┐  ┌───────────────┐  ┌────────────────┐  │
│  Settlements   │  │     POIs      │  │   Provinces    │  │
│  (6 sizes)     │  │   (default)   │  │   (3 types)    │  │
└───────┬────────┘  └───────┬───────┘  └────────┬───────┘  │
        │                   │                    │          │
        │                   │                    │          │
        └───────────────────┴────────────────────┴──────────┘
                            │
                            │ On map render
                            ▼
              ┌─────────────────────────────┐
              │  createXXXStyle() functions  │
              └─────────────┬───────────────┘
                            │
                            │ For each feature
                            ▼
        ┌───────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────┐                  ┌──────────────────┐
│  Visibility      │                  │  Interpolation   │
│  Checks          │                  │  Calculations    │
│                  │                  │                  │
│ shouldShowLabel()│                  │ getInterpolated- │
│ shouldShowDot()  │                  │   FontSize()     │
│                  │                  │ getInterpolated- │
│ Compare:         │                  │   Radius()       │
│ - resolution     │                  │                  │
│ - min/maxZoom    │                  │ Uses lerp()      │
└──────────────────┘                  └──────────────────┘
        │                                         │
        └───────────────────┬─────────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │  OpenLayers Style      │
                │  Object                │
                │                        │
                │  - text (if visible)   │
                │  - image (if visible)  │
                └────────────────────────┘
```

## Parameter Interaction Diagram

```
Current Map Resolution (from zoom level)
              │
              ▼
    ┌─────────────────────┐
    │  minZoomLevelLabel  │────► Label appears at or below this value
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │    minFontZoom      │────► Start of font interpolation range
    └─────────────────────┘
              │
              │  Smooth interpolation
              │  (lerp function)
              ▼
    ┌─────────────────────┐
    │    maxFontZoom      │────► End of font interpolation range
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  maxZoomLevelLabel  │────► Label disappears below this value
    └─────────────────────┘

    Same pattern for:
    - minZoomLevelDot / maxZoomLevelDot
    - minDotRadiusZoom / maxDotRadiusZoom
```

## Font Size Interpolation Example

```
Resolution: 0.010 ─────────────────────────► 0.0005
            │                                  │
            ▼                                  ▼
Font Size:  11px ══════════════════════════► 22px
            minFontSize    (smooth gradient)  maxFontSize

At resolution 0.005 (midpoint):
  Font size ≈ 16.5px (middle of range)
```

## Dot Radius Interpolation Example

```
Resolution: 0.010 ─────────────────────────► 0.0005
            │                                  │
            ▼                                  ▼
Radius:     3px ═══════════════════════════► 6px
            minDotRadius   (smooth gradient)  maxDotRadius

At resolution 0.003:
  Radius ≈ 4.5px (interpolated based on position in range)
```

## Settlement Size Differentiation

```
Size 1-2 (Villages)
┌──────────────────────────────────────────────┐
│ Stroke: 0.5px (thin)                         │
│ Color: Green/Teal                            │
│ Font: 11px → 22px                            │
│ Dot: 2-2.5px → 4-5px                         │
│ Appears: Close zoom (0.003)                  │
└──────────────────────────────────────────────┘

Size 3 (Towns)
┌──────────────────────────────────────────────┐
│ Stroke: 1.0px (normal)                       │
│ Color: Blue                                  │
│ Font: 12px → 24px                            │
│ Dot: 3px → 6px                               │
│ Appears: Medium zoom (0.010)                 │
└──────────────────────────────────────────────┘

Size 4 (Cities)
┌──────────────────────────────────────────────┐
│ Stroke: 1.5px (thick)                        │
│ Color: Orange                                │
│ Font: 13px → 26px                            │
│ Dot: 4px → 8px                               │
│ Appears: Far zoom (1.0)                      │
└──────────────────────────────────────────────┘

Size 5 (Large Cities)
┌──────────────────────────────────────────────┐
│ Stroke: 2.5px (very thick) ◄─── Prominent!  │
│ Color: Red                                   │
│ Font: 14px → 28px                            │
│ Dot: 5px → 10px                              │
│ Appears: Far zoom (1.0)                      │
└──────────────────────────────────────────────┘

Size 6 (Major Cities)
┌──────────────────────────────────────────────┐
│ Stroke: 3.0px (maximum) ◄─── Most Prominent!│
│ Color: Red                                   │
│ Font: 15px → 30px                            │
│ Dot: 6px → 12px                              │
│ Appears: Far zoom (1.0)                      │
└──────────────────────────────────────────────┘
```

## Data Flow During Rendering

```
1. User zooms/pans map
        │
        ▼
2. Map resolution changes
        │
        ▼
3. OpenLayers calls style function for each visible feature
        │
        ▼
4. Style function receives:
   - feature (with properties like sizeCategory, name, type)
   - currentResolution (from map view)
        │
        ▼
5. Lookup configuration in STYLES_CONFIG
        │
        ▼
6. Check visibility (shouldShowLabel, shouldShowDot)
        │
        ▼
7. If visible, calculate interpolated values
   - Font size (getInterpolatedFontSize)
   - Dot radius (getInterpolatedRadius)
        │
        ▼
8. Create OpenLayers Style object with calculated values
        │
        ▼
9. OpenLayers renders feature with style
        │
        ▼
10. Repeat for next feature
```

## Configuration Organization

```
styles-config.json
│
├── settlements
│   ├── baseConfig (shared properties)
│   │   ├── strokeColor
│   │   ├── textOffsetY
│   │   ├── textFont
│   │   ├── textFillColor
│   │   ├── textStrokeColor
│   │   └── textStrokeWidth
│   │
│   └── sizeCategories
│       ├── 1 (Village)
│       ├── 2 (Large Village)
│       ├── 3 (Small Town)
│       ├── 4 (City)
│       ├── 5 (Large City)
│       └── 6 (Major City)
│           Each with:
│           ├── label
│           ├── color
│           ├── minFontSize / maxFontSize
│           ├── minFontZoom / maxFontZoom
│           ├── minDotRadius / maxDotRadius
│           ├── minDotRadiusZoom / maxDotRadiusZoom
│           ├── minZoomLevelLabel / maxZoomLevelLabel
│           ├── minZoomLevelDot / maxZoomLevelDot
│           ├── strokeWidth
│           └── strokeColor
│
├── poi
│   ├── baseConfig
│   └── default (all POIs use same config)
│
├── provinces
│   ├── Nation-State
│   ├── Grand-Province
│   └── Province
│
└── water
    ├── Ocean
    ├── Major Sea
    ├── Large Sea
    ├── Medium Sea
    ├── Small Sea
    ├── Large Marsh
    └── Small Marsh
```

## Key Functions

```javascript
// Main entry point - loads configuration
loadStylesConfig() → Promise<Object>

// Interpolation helpers
lerp(value, minIn, maxIn, minOut, maxOut) → number
getInterpolatedFontSize(config, resolution) → number
getInterpolatedRadius(config, resolution) → number

// Visibility checks
shouldShowLabel(config, resolution) → boolean
shouldShowDot(config, resolution) → boolean

// Style creators (called by OpenLayers for each feature)
createSettlementStyle(feature, resolution) → ol.style.Style
createPOIStyle(feature, resolution) → ol.style.Style
createProvinceStyle(feature, resolution) → ol.style.Style
createWaterStyle(feature, resolution) → ol.style.Style
```
