/**
 * Main application initialization for Old World Atlas
 */

async function initializeApp() {
    try {
        // Load styles configuration first
        await loadStylesConfig();
        console.log('Styles configuration loaded');
        
        // Initialize map
        mapManager.initialize();
        mapManager.setupEventListeners();

        // Load settlements data from multiple sources
        const features = await settlementData.loadSettlements([
            'data/empire_settlements.geojson',
            'data/westerland_settlements.geojson'
        ]);
        console.log(`Loaded ${features.length} settlements`);

        // Add settlements to map
        const olFeatures = settlementData.getOLFeatures();
        mapManager.addSettlementFeatures(olFeatures);
        
        // Load POI data
        const poiFeatures = await poiData.loadPOIs('data/points_of_interest.geojson');
        console.log(`Loaded ${poiFeatures.length} points of interest`);
        
        // Add POIs to map
        const olPOIFeatures = poiData.getOLFeatures();
        mapManager.addPOIFeatures(olPOIFeatures);

        // Load province labels
        const provinceFeatures = await provinceData.loadProvinces('data/province_labels.geojson');
        console.log(`Loaded ${provinceFeatures.length} province labels`);
        
        // Add province labels to map
        const olProvinceFeatures = provinceData.getOLFeatures();
        mapManager.addProvinceFeatures(olProvinceFeatures);

        // Load water labels
        const waterFeatures = await waterData.loadWaterLabels('data/water_labels.geojson');
        console.log(`Loaded ${waterFeatures.length} water labels`);
        
        // Add water labels to map
        const olWaterFeatures = waterData.getOLFeatures();
        mapManager.addWaterFeatures(olWaterFeatures);

        // Initialize UI controls
        uiControls.initialize(mapManager.getMap());
        
        // Initialize measurement tool
        measurementTool.initialize(mapManager.getMap());
        
        // Initialize search functionality
        searchManager.initialize();
        
        // Initialize changelog dropdown
        changelogDropdown.initialize();

        console.log('Old World Atlas initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
