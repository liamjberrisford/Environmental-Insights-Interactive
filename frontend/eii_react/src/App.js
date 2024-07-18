import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  const [predictionResult, setPredictionResult] = useState('Geospatial Map of the UK');
  const [secondaryTitle, setSecondaryTitle] = useState('Air Pollution Predictor With NPM and Flask for the fourth time!');
  const [selectedDataType, setSelectedDataType] = useState('nox');
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('ukMap').setView([54.5, -4], 6); // Initial view
      mapRef.current = map; // Store the map instance in the ref

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
    }
  }, []);

  const handleLoadData = () => {
    // Fetch prediction data
    fetch('/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // No location or date needed
    })
      .then(response => {
        console.log('Response status:', response.status);  // Log response status
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Prediction data received:', data);  // Log received data
        setPredictionResult(data.result);
        setSecondaryTitle(`Prediction Result: ${data.result}`);
      })
      .catch(error => {
        console.error('Error fetching prediction:', error);  // Log any errors
      });

    // Fetch GeoJSON data and display it on the map
    fetch(`/geojson-data?dataType=${selectedDataType}`)
      .then(response => response.json())
      .then(geojsonData => {
        if (mapRef.current) {
          const map = mapRef.current;

          // Clear existing GeoJSON layers
          if (map.geojsonLayer) {
            map.removeLayer(map.geojsonLayer);
          }

          // Add new GeoJSON layer
          map.geojsonLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
              return {
                color: 'grey',
                weight: 0.25
              };
            }
          }).addTo(map);

          // Fit map to GeoJSON bounds
          map.fitBounds(map.geojsonLayer.getBounds());
        }
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>{predictionResult}</h1>
        <div id="ukMap" style={{ height: '600px' }}></div>
        <h2>{secondaryTitle}</h2>
        <button onClick={handleLoadData}>Load Data</button>
        <div id="predictionResult"></div>
        <label htmlFor="dataType">Data Type:</label>
        <select
          id="dataType"
          name="dataType"
          required
          value={selectedDataType}
          onChange={(e) => setSelectedDataType(e.target.value)}
        >
          <option value="nox">NOx</option>
          <option value="no2">NO2</option>
          <option value="no">NO</option>
          <option value="o3">O3</option>
          <option value="pm10">PM10</option>
          <option value="pm2.5">PM2.5</option>
          <option value="so2">SO2</option>
        </select>
      </header>
    </div>
  );
}

export default App;
