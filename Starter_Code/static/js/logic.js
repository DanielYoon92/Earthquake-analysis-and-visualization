// URL to get earthquake data
const earthquakeData = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

//URL to get the tectonic plate data
const tectonicPlateData = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Base Layers for the map
const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

const stylized_topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

const baseMaps = {
    "Street Map": street,
    "Topographical": topo,
    "Stylized topographical": stylized_topo
};

// Function to determine marker size based on magnitude
function markerSize(magnitude) {
    return (magnitude**2)*7000
}

// Determine marker color based on earthquake depth
function markerColor(depth) {
    switch(true) {
        case (depth < 10):
        return "#00FF00"; // green
        case (depth < 30):
        return "#FFFF00"; // yellow
        case (depth < 50):
        return "#FFA500"; // orange
        case (depth < 70):
        return "#FF4500"; // dark orange
        case (depth < 90):
        return "#FF0000"; // red
        default:
        return "#800080"; // purple
    }
}

// Perform a GET request to query the URL
d3.json(earthquakeData).then(function(quakeData){

    // Once the first get request goes through, perform a second get request for techtonic plate data
    d3.json(tectonicPlateData).then(function(plateData){

        // Assign features to a variable
        let quakeFeatures = quakeData.features;

        // Initialize an array to hold earthquake markers
        let quakeMarkers = [];

        // Loop through the earthquake features and assign markers to each feature
        quakeMarkers = quakeFeatures.map(feature => {
            const [lat, lng] = feature.geometry.coordinates;
            const popupContent = `<h4>${feature.properties.place}</h4><hr><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`;
            return L.circle([lat, lng], {
              stroke: true,
              fillOpacity: 0.75,
              color: "black",
              fillColor: markerColor(feature.geometry.coordinates[2]),
              radius: markerSize(feature.properties.mag),
              weight: 0.5
            }).bindPopup(popupContent);
          });


        // Create a layer with tectonic plate data:
        const plateFeatures = plateData.features;

        // Initialize an array to hold earthquake markers
        const plateMarkers = [];

        // Loop through the plate features and assign markers to each feature
            plateFeatures.forEach(feature => {
                const formattedCoords = feature.geometry.coordinates.map(coord => coord.slice().reverse());
                const marker = L.polyline(formattedCoords, {
                    color: "yellow"
                });
                plateMarkers.push(marker);
            });
        
        // Create two separate layer groups: one for the earthquake markers and another for the plate markers.
        const quakes = L.layerGroup(quakeMarkers);
        const plates = L.layerGroup(plateMarkers);

        // Create an overlay object.
        const overlayMaps = {
            "Earthquakes": quakes,
            "Tectonic Plates": plates
        };

        // Define a map object.
        const myMap = L.map("map", {
            center: [37.5,-62.8],
            zoom: 3,
            layers: [street, quakes, plates]
        });
        
        // Add the layer control to the map.
        L.control.layers(baseMaps, overlayMaps, {
            collapsed: false
        }).addTo(myMap);

        // Legend setup.
        const legend = L.control({ position: "bottomright" });
        
        legend.onAdd = function() {
            const div = L.DomUtil.create("div", "info legend");
            const colors = ["#ADD8E6", "#00CED1", "#FFA07A", "#F08080", "#CD5C5C", "#8B0000"];
            const title = "Depth"
            const depths = ["-10-10", "10-30", "30-50", "50-70", "70-90", "90+"]

            const legendItems = colors.map((color, index) => {
                return `<div class="row row-cols-2 mx-sm-2" style="width: 128px;"><div style="height: 12px; width: 12px; background: ${color}"></div>` + `<span>${depths[index]}</span></div>`;
              });
              const legendHTML = `<div class="container bg-white py-sm-2"> <h5 class="ms-sm-1">${title}</h5> ${legendItems.join('')}</div>`

            div.innerHTML = legendHTML;

            return div;
          };
        
          // Adding the legend to the map
          legend.addTo(myMap);
    })
})