/**
 * Main application initialization for Old World Atlas
 */

async function initializeApp() {
    try {
        // Initialize map
        mapManager.initialize();
        mapManager.setupEventListeners();

        // Load settlements data
        const features = await settlementData.loadSettlements('data/settlements_georeferenced.geojson');
        console.log(`Loaded ${features.length} settlements`);

        // Add settlements to map
        const olFeatures = settlementData.getOLFeatures();
        mapManager.addSettlementFeatures(olFeatures);

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
