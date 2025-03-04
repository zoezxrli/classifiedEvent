// set mapbox token 
mapboxgl.accessToken = 'pk.eyJ1Ijoiem9lemh1b2xpIiwiYSI6ImNtN3R6bDFybzE0N3EybG9pdTJhbWhjdWIifQ.F2uw6Wdnx7123MgeohvncQ';

// initialize the mapbox map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11', // dark theme map style 
    center: [-79.3832, 43.6532], // set center to Toronto
    zoom: 12  // default zoom level
});

map.on('load', () => {
    // load the school icon properly and ensure it's added only once
    map.loadImage('school.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('school-icon')) {
            map.addImage('school-icon', image);
        }

        // add Toronto center marker after confirming icon exists
        map.addLayer({
            id: 'toronto-marker',
            type: 'symbol',
            source: 'radius3-locations',
            'source-layer': 'points-2mn1e9',
            filter: ['==', ['get', 'Type'], 'Center'],  // ensure the dataset matched this filter from csv
            layout: {
                'icon-image': 'school-icon',
                'icon-size': 0.05  // adjust icon size 
            }
        });
    });

    // load the GeoJSON asynchronously to avoid missing source errors
    fetch('Polygon.geojson')
        .then(response => response.json())
        .then(data => {
            map.addSource('range-3km', {
                type: 'geojson',
                data: data
            });

            // add the range of 3km boundary
            map.addLayer({
                id: 'range-layer',
                type: 'fill',
                source: 'range-3km',
                paint: {
                    'fill-color': '#00FFFF',
                    'fill-opacity': 0.08,
                    'fill-outline-color': '#00FFFF'
                }
            });
        })
        .catch(error => console.error('Error loading GeoJSON:', error));

    // add the locations layer from mapbox
    map.addSource('radius3-locations', {
        type: 'vector',
        url: 'mapbox://zoezhuoli.bngr19y3'
    });

    // define marker sizes and colors
    const markerSizes = {
        'Comedy club': 6,
        'Cultural center': 8,
        'Concert hall': 10,
        'Opera house': 12,
        'Event venue': 14,
        'Movie theater': 16,
        'Live music venue': 18,
        'Performing arts theater': 8
    };

    const colorMapping = {
        'Comedy club': '#e73649',
        'Cultural center': '#ee7d09',
        'Concert hall': '#f8bd00',
        'Opera house': '#96c535',
        'Event venue': '#00a496',
        'Movie theater': '#0091d8',
        'Live music venue': '#d45f9d',
        'Performing arts theater': '#844aa8'
    };

    // add a circle layer for event locations 
    map.addLayer({
        id: 'radius3-layer',
        type: 'circle',
        source: 'radius3-locations',
        'source-layer': 'points-2mn1e9',
        paint: {
            // circle size scales based on the type of location
            'circle-radius': ['match', ['get', 'Type'],
                ...Object.entries(markerSizes).flat(),
                10
            ],
            //circle color changes based on the type of location
            'circle-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false], '#ffffff',  // location markers will be shaded to white when hovere
                ['match', ['get', 'Type'],
                ...Object.entries(colorMapping).flat(),
                '#ccc']
            ],
            'circle-opacity': 0.1   // slightly transparent circles
        }
    });

    // display popup with event details. including: tel number, location name, type of the place, and its website
    map.on('click', 'radius3-layer', (e) => {
        const properties = e.features[0].properties;
        new mapboxgl.Popup({ closeButton: false })
            .setLngLat(e.lngLat)
            .setHTML(`
                <div style="
                    font-family: Arial, sans-serif; 
                    padding: 8px;
                    background: #1e1e1e;
                    color: white;
                    border-radius: 5px;">
                    <h3 style="margin: 0; font-weight: bold;">${properties.Name}</h3>
                    <p style="margin: 5px 0;">Type: ${properties.Type}</p>
                    <p style="margin: 5px 0;">Tel: ${properties.Tel || 'N/A'}</p>
                    <p><a href="${properties.website}" target="_blank" style="
                        color: #00FFFF; 
                        text-decoration: none;
                        font-weight: bold;">
                        Visit Website
                    </a></p>
                </div>
            `)
            .addTo(map);
    });

    // implementing hover effect to highlight markers
    let hoveredFeatureId = null;    // variable to store the currently hovered feature ID
    map.on('mousemove', 'radius3-layer', (e) => {
        if (e.features.length > 0) {    // ensure at least one feature is detecdted under the cursor
            if (hoveredFeatureId !== null) {
                // if a feature was previously hovered, reset its hover state to false
                map.setFeatureState(
                    { source: 'radius3-locations', sourceLayer: 'points-2mn1e9', id: hoveredFeatureId },
                    { hover: false }
                );
            }
            // update the hovered feature ID to the new feature under the cursor
            hoveredFeatureId = e.features[0].id;

            // Set the hover state of the newly hovered feature to true (e.g., change color)
            map.setFeatureState(
                { source: 'radius3-locations', sourceLayer: 'points-2mn1e9', id: hoveredFeatureId },
                { hover: true }
            );
        }
    });

    // remove hover effect when mouse leaves the marker
    map.on('mouseleave', 'radius3-layer', () => {
        if (hoveredFeatureId !== null) {
            // Reset the last hovered feature's state to remove the hover effect
            map.setFeatureState(
                { source: 'radius3-locations', sourceLayer: 'points-2mn1e9', id: hoveredFeatureId },
                { hover: false }
            );
        }
        // Reset the hovered feature ID since no feature is being hovered anymore
        hoveredFeatureId = null;
    });

    // toggle visibility button
    // The toggle button (toggleLayer) is used to show or hide event markers on the map. This is useful for user interaction, data filtering, and map clarity.
    document.getElementById('toggleLayer').addEventListener('click', () => {
        const visibility = map.getLayoutProperty('radius3-layer', 'visibility');
        map.setLayoutProperty('radius3-layer', 'visibility', visibility === 'visible' ? 'none' : 'visible');
    });

    // reset view button
    // the Reset View button ensures users can always return to the original map position and zoom level after they navigate elsewhere.
    document.getElementById('resetView').addEventListener('click', () => {
        map.flyTo({ center: [-79.3832, 43.6532], zoom: 12 });
    });
});
