mapboxgl.accessToken = 'pk.eyJ1Ijoiem9lemh1b2xpIiwiYSI6ImNtN3R6bDFybzE0N3EybG9pdTJhbWhjdWIifQ.F2uw6Wdnx7123MgeohvncQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-79.3832, 43.6532], // Toronto
    zoom: 12
});

map.on('load', () => {
    // ✅ Load the school icon properly and ensure it's added only once
    map.loadImage('school.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('school-icon')) {
            map.addImage('school-icon', image);
        }

        // ✅ Add Toronto center marker after confirming icon exists
        map.addLayer({
            id: 'toronto-marker',
            type: 'symbol',
            source: 'radius3-locations',
            'source-layer': 'points-2mn1e9',
            filter: ['==', ['get', 'Type'], 'Center'],  // Make sure this matches your dataset!
            layout: {
                'icon-image': 'school-icon',
                'icon-size': 0.05
            }
        });
    });

    // ✅ Load the GeoJSON asynchronously to avoid missing source errors
    fetch('Polygon.geojson')
        .then(response => response.json())
        .then(data => {
            map.addSource('range-3km', {
                type: 'geojson',
                data: data
            });

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

    // ✅ Add the locations layer
    map.addSource('radius3-locations', {
        type: 'vector',
        url: 'mapbox://zoezhuoli.bngr19y3'
    });

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

    map.addLayer({
        id: 'radius3-layer',
        type: 'circle',
        source: 'radius3-locations',
        'source-layer': 'points-2mn1e9',
        paint: {
            'circle-radius': ['match', ['get', 'Type'],
                ...Object.entries(markerSizes).flat(),
                10
            ],
            'circle-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false], '#ffffff',
                ['match', ['get', 'Type'],
                ...Object.entries(colorMapping).flat(),
                '#ccc']
            ],
            'circle-opacity': 0.8
        }
    });

    // ✅ Update popups with Tel field
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

    // ✅ Hover effect
    let hoveredFeatureId = null;
    map.on('mousemove', 'radius3-layer', (e) => {
        if (e.features.length > 0) {
            if (hoveredFeatureId !== null) {
                map.setFeatureState(
                    { source: 'radius3-locations', sourceLayer: 'points-2mn1e9', id: hoveredFeatureId },
                    { hover: false }
                );
            }
            hoveredFeatureId = e.features[0].id;
            map.setFeatureState(
                { source: 'radius3-locations', sourceLayer: 'points-2mn1e9', id: hoveredFeatureId },
                { hover: true }
            );
        }
    });

    map.on('mouseleave', 'radius3-layer', () => {
        if (hoveredFeatureId !== null) {
            map.setFeatureState(
                { source: 'radius3-locations', sourceLayer: 'points-2mn1e9', id: hoveredFeatureId },
                { hover: false }
            );
        }
        hoveredFeatureId = null;
    });

    // ✅ Toggle visibility button
    document.getElementById('toggleLayer').addEventListener('click', () => {
        const visibility = map.getLayoutProperty('radius3-layer', 'visibility');
        map.setLayoutProperty('radius3-layer', 'visibility', visibility === 'visible' ? 'none' : 'visible');
    });

    // ✅ Reset view button
    document.getElementById('resetView').addEventListener('click', () => {
        map.flyTo({ center: [-79.3832, 43.6532], zoom: 12 });
    });
});
