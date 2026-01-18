# Quick Reference - Common Style Adjustments

## Making Features Appear Earlier/Later

### To make a feature appear EARLIER (at farther zoom):
```json
"minZoomLevelLabel": 1.0  // Change from 0.003 to 1.0
```
Higher number = appears when more zoomed out

### To make a feature disappear EARLIER (at medium zoom):
```json
"maxZoomLevelLabel": 0.001  // Change from 0.00001 to 0.001
```
Higher number = disappears sooner when zooming in

## Font Size Scaling

### Current default ranges:
- Villages (1-2): 11px → 22px
- Towns (3): 12px → 24px
- Cities (4-6): 13-15px → 26-30px

### To increase maximum font size:
```json
"maxFontSize": 30  // Increase from current value
```

### To change zoom range for scaling:
```json
"minFontZoom": 0.010,  // When scaling starts
"maxFontZoom": 0.0005  // When max size is reached
```

## Dot/Marker Appearance

### Settlement dot sizes (current):
- Size 1: 2px → 4px
- Size 2: 2.5px → 5px
- Size 3: 3px → 6px
- Size 4: 4px → 8px
- Size 5: 5px → 10px
- Size 6: 6px → 12px

### To change dot size:
```json
"minDotRadius": 3,     // Starting size
"maxDotRadius": 10     // Maximum size
```

## Visual Hierarchy

### Stroke widths (border thickness):
```json
"strokeWidth": 0.5   // Thin - for villages
"strokeWidth": 1.0   // Normal - for towns
"strokeWidth": 1.5   // Thick - for cities
"strokeWidth": 2.5   // Very thick - for large cities
"strokeWidth": 3.0   // Maximum - for major cities
```

### Stroke colors:
```json
"strokeColor": "rgba(255, 255, 255, 0.6)"  // Subtle white
"strokeColor": "rgba(255, 255, 255, 0.8)"  // Normal white
"strokeColor": "rgba(255, 255, 255, 1.0)"  // Bright white
```

## Resolution Values Quick Reference

```
100.0      = World view (very far out)
1.0        = Region view
0.010      = Medium zoom (small towns appear)
0.003      = Closer zoom (villages appear)
0.001      = Close zoom
0.0005     = Very close zoom
0.0001     = Maximum zoom
0.00001    = Never disappear (practical infinity)
```

## Common Patterns

### Make labels appear before dots:
```json
"minZoomLevelLabel": 0.010,  // Label appears at medium zoom
"minZoomLevelDot": 0.005     // Dot appears at closer zoom
```

### Make dots persist longer than labels:
```json
"maxZoomLevelLabel": 0.001,   // Label disappears at close zoom
"maxZoomLevelDot": 0.00001    // Dot stays visible
```

### No border (just colored dot):
```json
"strokeWidth": 0,
"strokeColor": "rgba(255, 255, 255, 0.0)"
```

### Very prominent feature:
```json
"minFontSize": 16,
"maxFontSize": 32,
"minDotRadius": 6,
"maxDotRadius": 14,
"strokeWidth": 3.5,
"strokeColor": "rgba(255, 255, 255, 1.0)"
```

## Testing Tips

1. **Edit** `styles-config.json`
2. **Save** the file
3. **Refresh** your browser (Ctrl+R or Cmd+R)
4. **Zoom** in and out to test
5. **Iterate** until satisfied

## File Location
```
oldworldatlas-web/
  └── styles-config.json  ← Edit this file
```

## Full Documentation
See `STYLES_GUIDE.md` for complete documentation.
