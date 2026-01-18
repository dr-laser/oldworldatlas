# Search Feature Documentation

## Overview
The search feature allows users to find and navigate to any settlement or point of interest on the Old World Atlas map. It includes autocomplete, German character normalization, visual highlighting, and automatic centering/zooming.

## Features

### 1. **Search Bar**
- Located in top-left corner (below zoom controls)
- Placeholder text: "Search settlements and POIs..."
- Autocomplete dropdown appears after typing 1+ characters
- Clear button (×) appears when a feature is selected

### 2. **Autocomplete**
- Shows up to 20 matching results
- Results display:
  - Feature name (with matched text highlighted)
  - Type (Settlement or POI)
  - Details (Size category for settlements, type for POIs)
- Results are sorted:
  - Exact prefix matches first
  - Then alphabetically

### 3. **German Character Normalization**
- Search automatically converts German characters for matching:
  - ü → u
  - ö → o
  - ä → a
  - ß → ss
- Users can type "Nurnberg" to find "Nürnberg"
- Original names are always displayed correctly

### 4. **Feature Selection**
When a feature is selected from autocomplete:
1. **Map Navigation**: Automatically centers and zooms to resolution 0.0015
2. **Info Popup**: Opens the same popup as clicking the feature directly
3. **Visual Highlighting**:
   - Circle marker turns red and grows 30% larger
   - Label text becomes bold and red
   - Stroke width increases 30-50%
   - Feature gets maximum zIndex (9999) to stay on top

### 5. **Clear Selection**
- Click the red × button to:
  - Clear the search input
  - Remove visual highlighting
  - Reset feature to normal appearance
  - Hide the clear button
- Clicking any feature on the map also clears the search selection

## Implementation Details

### Files Modified/Created

#### `index.html`
- Added search container with input, clear button, and dropdown
- Added CSS styles for search UI components

#### `js/search.js` (new file)
- `SearchManager` class with:
  - `initialize()` - Sets up event listeners and builds feature index
  - `buildFeatureIndex()` - Creates searchable list of all features
  - `normalizeString()` - Handles German character conversion
  - `handleSearchInput()` - Filters and displays autocomplete results
  - `selectFeature()` - Handles feature selection and highlighting
  - `clearSelection()` - Removes highlighting and resets state

#### `js/ui-controls.js`
- Added `selectedFeature` property to track highlighted feature
- Added `showFeatureFromSearch()` method for search-triggered navigation
- Modified `handleMapClick()` to clear search selection when clicking features

#### `js/styling.js`
- Modified `createSettlementStyle()` to check for `highlighted` property
- Modified `createSettlementMarkerOnlyStyle()` for highlighted markers
- Modified `createPOIStyle()` to support highlighting
- Highlighted features get:
  - Red color (#f44336 fill, #d32f2f stroke)
  - 30% larger radius
  - Bold, red text
  - 30-50% thicker strokes
  - Maximum zIndex (9999)

#### `js/map-manager.js`
- Added `getSettlementMarkersOnlyLayer()` method for search access

#### `js/app.js`
- Added `searchManager.initialize()` call during app initialization

## Usage

1. **Simple Search**: Type any part of a settlement or POI name
2. **Select Result**: Click on a result from the dropdown
3. **View Feature**: Map automatically centers, zooms, and shows info popup
4. **Clear Selection**: Click the × button or click another feature on the map

## Performance

- Feature index is built once at startup (~thousands of features)
- Autocomplete filtering is instant (normalized string comparison)
- Style changes are optimized with caching (only highlighted styles bypass cache)
- Results limited to 20 items for smooth rendering

## Browser Compatibility

- Modern browsers with ES6 support
- OpenLayers 7.0.0 compatibility
- No external dependencies beyond existing project stack
