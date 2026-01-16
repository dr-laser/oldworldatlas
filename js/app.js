/**
 * Main application initialization for Old World Atlas
 */

async function initializeApp() {
    try {
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

        // Initialize UI controls
        uiControls.initialize(mapManager.getMap());

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
