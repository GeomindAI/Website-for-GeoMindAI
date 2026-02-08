// Constants for mineral types and their image overlays
const MINERALS = {
    AU: { 
        name: 'Gold', 
        symbol: 'AU',
        imagePath: '/assets/MPM/newer-mineral-images/AU_heatmap.png',
        iconPath: '/assets/MPM/mineralicons/goldore.png',
        bounds: [
            [44.9930, -79.5720],  // Southwest corner
            [62.4910, -56.9430]   // Northeast corner
        ]
    },
    AG: { 
        name: 'Silver', 
        symbol: 'AG',
        imagePath: '/assets/MPM/newer-mineral-images/AG_heatmap.png',
        iconPath: '/assets/MPM/mineralicons/silverore.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    CU: { 
        name: 'Copper', 
        symbol: 'CU',
        imagePath: '/assets/MPM/newer-mineral-images/CU_heatmap.png',
        iconPath: '/assets/MPM/mineralicons/copperore.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    CO: { 
        name: 'Cobalt', 
        symbol: 'CO',
        imagePath: '/assets/MPM/newer-mineral-images/CO_heatmap.png',
        iconPath: '/assets/MPM/mineralicons/cobaltore.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    },
    NI: { 
        name: 'Nickel', 
        symbol: 'NI',
        imagePath: '/assets/MPM/newer-mineral-images/NI_heatmap.png',
        iconPath: '/assets/MPM/mineralicons/nickelore.png',
        bounds: [
            [44.9930, -79.5720],
            [62.4910, -56.9430]
        ]
    }
};

class QuebecMap {
    constructor(elementId) {
        // Add at the start of constructor
        this.isProcessing = false;
        this.lastPredictionTime = 0;
        this.PREDICTION_COOLDOWN = 2000; // 2 seconds cooldown
        
        // Initialize Supabase client first
        this.supabase = supabase.createClient(
            'https://inhvrqyvuwlhcijlqnxr.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHZycXl2dXdsaGNpamxxbnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTg3MDksImV4cCI6MjA4NjEzNDcwOX0.D_biN2-B-gKFPu6wByd-107ZFL18BR3xXRQgh3zNAoQ'
        );

        // Initialize map with bounds restriction
        this.map = L.map(elementId, {
            center: [52, -68],
            zoom: 5,
            attributionControl: false,
            minZoom: 5,
            maxBounds: [
                [44.0, -80.0],  // Southwest
                [63.0, -57.0]   // Northeast
            ]
        });

        // Initialize layers group for sample points
        this.samplePoints = L.layerGroup();
        
        // Initialize base layers
        this.baseLayers = {
            'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: ''
            }),
            'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: ''
            })
        };

        // Add default base layer
        this.baseLayers.OpenStreetMap.addTo(this.map);

        // Initialize the layer control with custom groups
        this.layerControl = L.control.layers(
            // Base layers (will be under "Basemaps" group)
            {
                'OpenStreetMap': this.baseLayers.OpenStreetMap,
                'Satellite': this.baseLayers.Satellite
            },
            // Overlays (empty initially)
            {},
            {
                position: 'topright',
                collapsed: false,
                groupsep: '<hr style="margin: 5px 0;">', // Add separator line
                sortLayers: false
            }
        ).addTo(this.map);

        // Add mask layer first and enable by default
        fetch('/assets/MPM/tiles/masking.geojson')
            .then(response => response.json())
            .then(data => {
                this.maskLayer = L.geoJSON(data, {
                interactive: false,
                    style: {
                        color: 'black',
                        fillColor: 'black',
                        weight: 1,
                        opacity: 0.9,
                        fillOpacity: 0.9,
                        pane: 'popupPane'
                    }
                }).addTo(this.map);  // Add to map by default
                this.layerControl.addOverlay(this.maskLayer, 'No Data Mask');
            });

        // Add a separator and Geology group header
        const separator = document.createElement('div');
        separator.innerHTML = '<hr style="margin: 5px 0;"><div style="font-weight: bold; margin: 5px 0;">Geology:</div>';
        this.layerControl._overlaysList.appendChild(separator);

        // Add geology layers
        fetch('/assets/MPM/tiles/Geology.geojson')
            .then(response => response.json())
            .then(data => {
                this.geologyLayer = L.geoJSON(data, {
                    interactive: false,
                    style: feature => ({
                        fillColor: `rgb(${feature.properties.RVB})`,
                        color: 'transparent',
                        fillOpacity: 0.8,
                        weight: 0,
                        pane: 'overlayPane'
                    })
                });
                this.layerControl.addOverlay(this.geologyLayer, 'Bedrock Geology');
            });

        fetch('/assets/MPM/tiles/faults.geojson')
            .then(response => response.json())
            .then(data => {
                this.faultsLayer = L.geoJSON(data, {
                    interactive: false,
                    style: {
                        color: 'black',
                        weight: 1,
                        opacity: 0.7,
                        pane: 'markerPane'
                    }
                });
                this.layerControl.addOverlay(this.faultsLayer, 'Faults');
            });

        // Add another separator and Anomalous Points header
        const pointsSeparator = document.createElement('div');
        pointsSeparator.innerHTML = '<hr style="margin: 5px 0;"><div style="font-weight: bold; margin: 5px 0;">Anomalous Points:</div>';
        this.layerControl._overlaysList.appendChild(pointsSeparator);

        // Add cobalt points
        fetch('/assets/MPM/tiles/Co-2.geojson')
            .then(response => response.json())
            .then(data => {
                this.cobaltSuperAnom = L.geoJSON(data, {
                    interactive: false,
                    pointToLayer: (feature, latlng) => {
                        return L.circleMarker(latlng, {
                            radius: 4,
                            fillColor: '#ff0000',
                            color: '#000',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8,
                            pane: 'markerPane'
                        });
                    }
                });
                this.layerControl.addOverlay(this.cobaltSuperAnom, 'Cobalt: Super Anom');
            });

        fetch('/assets/MPM/tiles/Co-1.geojson')
            .then(response => response.json())
            .then(data => {
                this.cobaltAnom = L.geoJSON(data, {
                    interactive: false,
                    pointToLayer: (feature, latlng) => {
                        return L.circleMarker(latlng, {
                            radius: 4,
                            fillColor: '#ff7800',
                            color: '#000',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8,
                            pane: 'markerPane'
                        });
                    }
                });
                this.layerControl.addOverlay(this.cobaltAnom, 'Cobalt: Anomalous');
            });

        // Add custom CSS for zoom controls
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-control-zoom {
                margin: 10px !important;
            }
            .leaflet-control-zoom-in,
            .leaflet-control-zoom-out {
                width: 24px !important;
                height: 24px !important;
                line-height: 22px !important;
                font-size: 14px !important;
            }
        `;
        document.head.appendChild(style);

        // Add scale control
        L.control.scale({
            metric: true,
            imperial: false  // This removes the miles
        }).addTo(this.map);

        // Add selection control
        this.addSelectionControl();

        // Add this at the end of constructor
        this.bindEvents();

        // Add after map initialization
        this.isSelectionMode = false;
        this.selectionBox = null;
    }



    bindEvents() {
        // Base layer changes
        document.getElementById('baseLayerSelect')?.addEventListener('change', (e) => {
            Object.values(this.baseLayers).forEach(layer => this.map.removeLayer(layer));
            this.baseLayers[e.target.value].addTo(this.map);
        });

        // Mineral layer changes
        document.getElementById('mineralLayerSelect')?.addEventListener('change', (e) => {
            this.showMineralLayer(e.target.value);
        });

        // Opacity control
        document.getElementById('opacityControl')?.addEventListener('input', (e) => {
            this.setMineralLayerOpacity(e.target.value);
        });

        // Add selection mode toggle button handler
        const selectionButton = document.getElementById('selectionModeToggle');
        if (selectionButton) {
            selectionButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the click from reaching the map
                this.toggleSelectionMode();
            });
        }

        // Map click handler - only bind when selection mode is active
        this.map.on('click', (e) => {
            if (this.isSelectionMode) {
                this.handleMapClick(e);
            }
        });

        // Heatmap viewer
        document.getElementById('heatmapViewer').addEventListener('change', (e) => {
            this.showMineralHeatmap(e.target.value);
            e.target.value = '';
        });
    }

    createResultsContainer() {
        const container = document.createElement('div');
        container.id = 'selection-results';
        container.className = 'selection-results';
        container.style.display = 'none';
        
        const thresholds = {
            AU: '100 ppb',
            AG: '1 ppm',
            CU: '100 ppm',
            CO: '20 ppm',
            NI: '100 ppm'
        };
        
        const thresholdsText = Object.entries(thresholds)
            .map(([mineral, value]) => `${mineral}: ${value}`)
            .join('<br>');
        
        container.innerHTML = `
            <div class="results-wrapper">
                <div class="results-header">
                    <h3>Analysis Results</h3>
                    <p class="total-samples"></p>
                    <div class="signal-counts">
                        <div class="signal-count">Strong: <span id="strong-signals">0</span></div>
                        <div class="signal-count">Anomalous: <span id="potential-signals">0</span></div>
                    </div>
                </div>

                <div class="model-agreement-card">
                    <div class="score-section">
                        <h4>
                            Prospectivity Score
                            <span class="info-icon">i
                                <span class="tooltip">
                                    Score calculation:<br>
                                    • Strong signals: 30 points each<br>
                                    • Anomalous signals: 15 points each<br>
                                    • Multiple minerals bonus: 10 points<br>
                                    • High concentration bonus: 10 points per mineral
                                </span>
                            </span>
                        </h4>
                        <div class="score-value">0</div>
                    </div>
                </div>

                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Mineral</th>
                            <th>
                                Anomalous
                                <span class="info-icon">i
                                    <span class="tooltip">
                                        Anomalous Thresholds:<br>${thresholdsText}
                                    </span>
                                </span>
                            </th>
                            <th>
                                Strong
                                <span class="info-icon">i
                                    <span class="tooltip">
                                        Two independent AI models have predicted<br>
                                        this area as anomalous, indicating higher<br>
                                        confidence in the prediction.
                                    </span>
                                </span>
                            </th>
                            <th>Probability</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        
        return container;
    }

    // Convert km to degrees (approximate)
    kmToDegrees(km) {
        return km / 111.32; // at the equator, more precise calculation can be added if needed
    }

    enableSelectionMode() {
        this.isSelectionMode = true;
        this.map.getContainer().style.cursor = 'crosshair';
    }

    async handleMapClick(e) {
        // Check if we're already processing or in cooldown
        const now = Date.now();
        if (this.isProcessing) {
            console.log('Already processing a prediction...');
            return;
        }
        if (now - this.lastPredictionTime < this.PREDICTION_COOLDOWN) {
            console.log('Please wait before making another prediction...');
            return;
        }

        try {
            this.isProcessing = true;
            this.lastPredictionTime = now;
            
            // Show loading state
            this.showLoadingOverlay('Analyzing region...');

            // Create selection box (radius of about 10km)
            const center = e.latlng;
            const radius = 0.045; // Changed from 0.1 to 0.045 (roughly 5km)
            const bounds = [
                [center.lat - radius, center.lng - radius],
                [center.lat + radius, center.lng + radius]
            ];

            // Clear existing selection
            if (this.selectionBox) {
                this.map.removeLayer(this.selectionBox);
            }

            // Create new selection box
            this.selectionBox = L.rectangle(bounds, {
                color: '#3388ff',
                weight: 1,
                fillOpacity: 0.2
            }).addTo(this.map);

            // Calculate statistics for the selected region
            await this.calculateStatistics(bounds);
            
            // Show success message
            this.showSelectionInstruction(true);

        } catch (error) {
            console.error('Error in prediction:', error);
        } finally {
            this.hideLoadingOverlay();
            this.isProcessing = false;
        }
    }

    async calculateStatistics(bounds) {
        const [[minLat, minLng], [maxLat, maxLng]] = bounds;

        console.log('calculateStatistics called with bounds:', { minLat, minLng, maxLat, maxLng });

        try {
            const { data: points, error } = await this.supabase
                .rpc('get_points_in_bounds', {
                    min_lat: minLat,
                    min_lng: minLng,
                    max_lat: maxLat,
                    max_lng: maxLng
                });

            console.log('Supabase RPC response - error:', error);
            console.log('Supabase RPC response - points:', points);
            console.log('Supabase RPC response - points count:', points ? points.length : 'null');

            if (error) throw error;

            if (!points || points.length === 0) {
                console.warn('No points returned from Supabase for these bounds');
                return;
            }

            // Log a sample point to see its structure
            console.log('Sample point:', JSON.stringify(points[0]));

            // Calculate statistics
            const stats = {
                AU: { anomalous: 0, strong: 0, maxProb: 0 },
                AG: { anomalous: 0, strong: 0, maxProb: 0 },
                CU: { anomalous: 0, strong: 0, maxProb: 0 },
                CO: { anomalous: 0, strong: 0, maxProb: 0 },
                NI: { anomalous: 0, strong: 0, maxProb: 0 }
            };

            points.forEach(point => {
                Object.keys(stats).forEach(mineral => {
                    const mineral_lower = mineral.toLowerCase();
                    const pred = point[`${mineral_lower}_pred`];
                    const prob = point[`${mineral_lower}_prob`] || 0;

                    // Update max probability if this is higher
                    stats[mineral].maxProb = Math.max(stats[mineral].maxProb, prob);

                    if (pred === 2) {
                        stats[mineral].strong++;
                    } else if (pred === 1) {
                        stats[mineral].anomalous++;
                    }
                });
            });

            console.log('Calculated stats:', JSON.stringify(stats));

            // Create results container if it doesn't exist
            const existingResults = document.getElementById('selection-results');
            console.log('Existing results container:', existingResults);

            if (!existingResults) {
                const parent = document.getElementById('quebec-map').parentNode;
                console.log('Parent element for results:', parent);
                const container = this.createResultsContainer();
                console.log('Created results container:', container);
                parent.appendChild(container);
            }

            // Display results
            console.log('Calling displayResults with', points.length, 'points');
            this.displayResults(stats, points.length);

        } catch (error) {
            console.error('Error fetching points:', error);
        }
    }
    
    displayResults(stats, totalPoints) {
        console.log('displayResults called - totalPoints:', totalPoints);
        const resultsContainer = document.getElementById('selection-results');
        console.log('Results container found:', resultsContainer);
        console.log('Results container display before:', resultsContainer?.style?.display);
        if (!resultsContainer) {
            console.error('Results container NOT found in DOM!');
            return;
        }
        
        const tbody = resultsContainer.querySelector('tbody');
        const totalSamplesDiv = resultsContainer.querySelector('.total-samples');
        
        tbody.innerHTML = '';
        totalSamplesDiv.textContent = `Based on ${totalPoints} rock samples`;
        
        // Calculate total strong and anomalous signals
        const totalStrong = Object.values(stats).reduce((sum, data) => sum + data.strong, 0);
        const totalAnomalous = Object.values(stats).reduce((sum, data) => sum + data.anomalous, 0);

        // Update signal counts
        resultsContainer.querySelector('#strong-signals').textContent = totalStrong;
        resultsContainer.querySelector('#potential-signals').textContent = totalAnomalous;
        
        // Calculate prospectivity score
        let prospectivityScore = this.calculateProspectivityScore(stats, totalPoints);
        
        // Update score display with color
        const scoreElement = resultsContainer.querySelector('.score-value');
        scoreElement.textContent = prospectivityScore.toFixed(0);
        
        // Add color class based on score
        scoreElement.classList.remove('score-low', 'score-medium', 'score-high');
        if (prospectivityScore < 40) {
            scoreElement.classList.add('score-low');
        } else if (prospectivityScore < 60) {
            scoreElement.classList.add('score-medium');
        } else {
            scoreElement.classList.add('score-high');
        }
        
        // Update table with colored probabilities
        Object.entries(stats).forEach(([mineral, data]) => {
            const row = document.createElement('tr');
            const probability = (data.maxProb * 100).toFixed(1);
            const probClass = probability < 40 ? 'probability-low' : 
                             probability < 60 ? 'probability-medium' : 
                             'probability-high';
            
            row.innerHTML = `
                <td>
                    <div class="mineral-name">
                        <img src="${MINERALS[mineral].iconPath}" alt="${MINERALS[mineral].name}" class="mineral-icon">
                        ${MINERALS[mineral].name}
                    </div>
                </td>
                <td>${data.anomalous}</td>
                <td>${data.strong}</td>
                <td class="${probClass}">${probability}%</td>
            `;
            tbody.appendChild(row);
        });
        
        resultsContainer.style.display = 'block';
    }

    calculateProspectivityScore(stats, totalPoints) {
        // Calculate total strong and anomalous signals
        const totalStrong = Object.values(stats).reduce((sum, data) => sum + data.strong, 0);
        const totalAnomalous = Object.values(stats).reduce((sum, data) => sum + data.anomalous, 0);
        
        let prospectivityScore = 0;
        prospectivityScore += totalStrong * 30;      // 30 points per strong signal
        prospectivityScore += totalAnomalous * 15;   // 15 points per anomalous signal
        
        // Add bonuses for multiple minerals
        const mineralsWithSignals = Object.values(stats)
            .filter(data => (data.strong + data.anomalous) > 0).length;
        if (mineralsWithSignals >= 2) prospectivityScore += 10;
        
        // Add bonus for high concentration
        const highConcentrationMinerals = Object.values(stats)
            .filter(data => (data.strong + data.anomalous) / totalPoints > 0.5).length;
        prospectivityScore += highConcentrationMinerals * 10;

        return Math.min(100, prospectivityScore); // Cap at 100
    }

    showMineralLayer(mineralType) {
        // Remove current layer if it exists
        if (this.currentMineralLayer) {
            this.map.removeLayer(this.currentMineralLayer);
            this.currentMineralLayer = null;
        }

        if (mineralType === 'none') return;

        if (mineralType === 'test') {
            // Create a heatmap from visible points
            this.createTestHeatmap();
            return;
        }

        // Handle other mineral layers as before...
        const mineral = MINERALS[mineralType];
        if (!mineral) return;

        this.currentMineralLayer = L.imageOverlay(
            mineral.imagePath,
            mineral.bounds,
            { opacity: 0.7 }
        ).addTo(this.map);
    }

    async createTestHeatmap() {
        try {
            const bounds = this.map.getBounds();
            const { data: points, error } = await this.supabase
                .rpc('get_points_in_bounds', {
                    min_lat: bounds.getSouth(),
                    min_lng: bounds.getWest(),
                    max_lat: bounds.getNorth(),
                    max_lng: bounds.getEast()
                });

            if (error) throw error;

            // Convert points to heatmap format
            const heatData = points.map(point => {
                const locationStr = point.location;
                const match = locationStr.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                if (match) {
                    const lng = parseFloat(match[1]);
                    const lat = parseFloat(match[2]);
                    return [lat, lng, 1]; // [lat, lng, intensity]
                }
                return null;
            }).filter(point => point !== null);

            // Create heatmap layer
            this.currentMineralLayer = L.heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 12,
                max: 1.0,
                gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
            }).addTo(this.map);

        } catch (error) {
            console.error('Error creating heatmap:', error);
        }
    }

    setMineralLayerOpacity(opacity) {
        if (this.currentMineralLayer) {
            this.currentMineralLayer.setOpacity(opacity / 100);
        }
    }

    addSelectionControl() {
        const control = L.control({position: 'topright'});
        
        control.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
            const button = document.createElement('button');
            button.id = 'selectionModeToggle';
            button.className = 'control-button';
            button.textContent = 'Predict Region';
            button.style.padding = '6px 10px';
            button.style.backgroundColor = '#fff';
            button.style.border = '2px solid rgba(0,0,0,0.2)';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            div.appendChild(button);
            return div;
        };
        
        control.addTo(this.map);
    }

    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        this.map.getContainer().style.cursor = this.isSelectionMode ? 'crosshair' : 'grab';
        const button = document.getElementById('selectionModeToggle');
        
        if (this.isSelectionMode) {
            // Enter selection mode
            button.textContent = 'Cancel Selection';
            button.style.backgroundColor = '#e9ecef';
            button.style.color = '#212529';
            
            // Disable dragging
            this.map.dragging.disable();
            
            // Show selection instruction
            this.showSelectionInstruction();
        } else {
            // Exit selection mode
            button.style.backgroundColor = '#fff';
            button.style.color = '#000';
            button.textContent = 'Predict Region';
            
            // Re-enable dragging
            this.map.dragging.enable();
            
            // Remove instruction if exists
            this.removeSelectionInstruction();
            
            // Clear existing selection if any
            if (this.selectionBox) {
                this.map.removeLayer(this.selectionBox);
                this.selectionBox = null;
            }
            
            // Hide results container
            const resultsContainer = document.getElementById('selection-results');
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }
        }
    }

    showSelectionInstruction(isSuccess = false) {
        // Remove any existing instruction first
        this.removeSelectionInstruction();
        
        const instruction = document.createElement('div');
        instruction.id = 'selection-instruction';
        instruction.className = `selection-instruction ${isSuccess ? 'success' : ''}`;
        
        if (isSuccess) {
            instruction.innerHTML = 'Prediction Complete! See analysis below';
            
            // After 5 seconds, show regular instruction
            setTimeout(() => {
                this.showSelectionInstruction(false);
            }, 5000);
        } else {
            instruction.innerHTML = 'Click anywhere on the map to predict a region';
        }
        
        document.getElementById('quebec-map').appendChild(instruction);
    }

    removeSelectionInstruction() {
        const instruction = document.getElementById('selection-instruction');
        if (instruction) instruction.remove();
    }

    showLoadingOverlay(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>
            </div>
        `;
        document.getElementById('quebec-map').appendChild(overlay);
        
        // Fade in animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '0';
            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });
        });
    }

    hideLoadingOverlay() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
    }

    showMineralHeatmap(mineralType) {
        if (!mineralType) return;

        const mineral = MINERALS[mineralType];

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `;
        backdrop.onclick = () => { backdrop.remove(); modal.remove(); };

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 800px;
            width: 90%;
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = '\u00d7';
        closeButton.style.cssText = `
            position: absolute;
            right: 10px;
            top: 10px;
            border: none;
            background: white;
            font-size: 24px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            color: #000;
        `;
        closeButton.onclick = () => { backdrop.remove(); modal.remove(); };

        const img = document.createElement('img');
        img.src = mineral.imagePath;
        img.alt = `${mineral.name} heatmap`;
        img.style.width = '100%';
        img.style.borderRadius = '4px';

        const downloadButton = document.createElement('a');
        downloadButton.href = mineral.imagePath;
        downloadButton.download = `${mineral.name}_Heatmap_Quebec.png`;
        downloadButton.textContent = `Download ${mineral.name} Heatmap`;
        downloadButton.style.cssText = `
            display: inline-block;
            margin-top: 12px;
            padding: 10px 20px;
            background: #609981;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.95rem;
            transition: background 0.2s;
        `;
        downloadButton.onmouseenter = () => { downloadButton.style.background = '#4c7a67'; };
        downloadButton.onmouseleave = () => { downloadButton.style.background = '#609981'; };

        modal.appendChild(closeButton);
        modal.appendChild(img);
        modal.appendChild(downloadButton);
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
    }
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quebecMap = new QuebecMap('quebec-map');
});