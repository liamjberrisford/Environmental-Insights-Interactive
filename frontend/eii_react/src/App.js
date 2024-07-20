import './App.css';
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const airPollutionColumnNames = [
  'no2', 'o3', 'pm10', 'pm2.5', 'so2'
];

const featureVectorColumnNames = [
  'Bicycle Score',
  'Car and Taxi Score',
  'Bus and Coach Score',
  'LGV Score',
  'HGV Score'
];

function App() {
  const [secondaryTitle] = useState('Air Pollution Predictor');
  const [selectedAirPollution, setSelectedAirPollution] = useState(airPollutionColumnNames[0]);
  const [selectedFeatureVector, setSelectedFeatureVector] = useState(featureVectorColumnNames[0]);
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedHour, setSelectedHour] = useState('00:00');
  const [clickedValue, setClickedValue] = useState(null);
  const [chartData, setChartData] = useState(null);
  const featureVectorMapRef = useRef(null);
  const airPollutionMapRef = useRef(null);

  useEffect(() => {
    if (!featureVectorMapRef.current) {
      const featureVectorMap = L.map('featureVectorMap').setView([54.5, -4], 6);
      featureVectorMapRef.current = featureVectorMap;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(featureVectorMap);
    }

    if (!airPollutionMapRef.current) {
      const airPollutionMap = L.map('airPollutionMap').setView([54.5, -4], 6);
      airPollutionMapRef.current = airPollutionMap;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(airPollutionMap);
    }
  }, []);

  const monthNames = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12
  };

  const handleLoadFeatureVectorData = () => {
    // Convert selected month name to its numerical representation
    const monthNumber = monthNames[selectedMonth];

    // Fetch GeoJSON data and display it on the map
    fetch(`/feature-vector?dataType=${selectedFeatureVector}&month=${monthNumber}&day=${selectedDay}&hour=${selectedHour}`)
      .then(response => response.json())
      .then(geojsonData => {
        if (featureVectorMapRef.current) {
          const map = featureVectorMapRef.current;

          // Clear existing GeoJSON layers
          if (map.geojsonLayer) {
            map.removeLayer(map.geojsonLayer);
          }

          // Determine concentration values
          const concentrationColumnName = selectedFeatureVector;
          console.log(concentrationColumnName);
          let concentrationValues = geojsonData.features.map(feature => feature.properties[concentrationColumnName]);
          let minValue = Math.min(...concentrationValues);
          let maxValue = Math.max(...concentrationValues);

          // Function to determine color based on concentration value
          function getColor(value) {
            let ratio = (value - minValue) / (maxValue - minValue);
            let r = 255;
            let g = Math.floor(255 * (1 - ratio));
            let b = Math.floor(255 * (1 - ratio));
            return `rgb(${r}, ${g}, ${b})`;
          }

          // Add new GeoJSON layer with dynamic styling and click event
          map.geojsonLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
              const value = feature.properties[concentrationColumnName];
              return {
                fillColor: getColor(value),
                weight: 0.25,
                opacity: 1,
                color: 'grey',
                fillOpacity: 0.7
              };
            },
            onEachFeature: function (feature, layer) {
              layer.on('click', function () {
                const value = feature.properties[concentrationColumnName];
                setClickedValue(value);
              });
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

  const handleLoadAirPollutionData = () => {
    // Convert selected month name to its numerical representation
    const monthNumber = monthNames[selectedMonth];

    // Fetch GeoJSON data and display it on the map
    fetch(`/air-pollution-concentrations?dataType=${selectedAirPollution}&month=${monthNumber}&day=${selectedDay}&hour=${selectedHour}`)
      .then(response => response.json())
      .then(geojsonData => {
        if (airPollutionMapRef.current) {
          const map = airPollutionMapRef.current;

          // Clear existing GeoJSON layers
          if (map.geojsonLayer) {
            map.removeLayer(map.geojsonLayer);
          }

          // Determine concentration values
          const concentrationColumnName = `${selectedAirPollution} Prediction mean`;
          console.log(concentrationColumnName);
          let concentrationValues = geojsonData.features.map(feature => feature.properties[concentrationColumnName]);
          let minValue = Math.min(...concentrationValues);
          let maxValue = Math.max(...concentrationValues);

          // Function to determine color based on concentration value
          function getColor(value) {
            let ratio = (value - minValue) / (maxValue - minValue);
            let r = 255;
            let g = Math.floor(255 * (1 - ratio));
            let b = Math.floor(255 * (1 - ratio));
            return `rgb(${r}, ${g}, ${b})`;
          }

          // Add new GeoJSON layer with dynamic styling and click event
          map.geojsonLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
              const value = feature.properties[concentrationColumnName];
              return {
                fillColor: getColor(value),
                weight: 0.25,
                opacity: 1,
                color: 'grey',
                fillOpacity: 0.7
              };
            },
            onEachFeature: function (feature, layer) {
              layer.on('click', function () {
                const value = feature.properties[concentrationColumnName];
                setClickedValue(value);
              });
            }
          }).addTo(map);

          // Fit map to GeoJSON bounds
          map.fitBounds(map.geojsonLayer.getBounds());

          // Prepare data for the histogram based on the selected column
          const histogramColumnName = `${selectedAirPollution} AQI`;
          console.log(histogramColumnName);
          let columnValues = geojsonData.features.map(feature => feature.properties[histogramColumnName]);
          const bins = new Array(10).fill(0);

          columnValues.forEach(value => {
            if (value >= 1 && value <= 10) {
              bins[value - 1]++;
            }
          });

          const labels = bins.map((_, index) => (index + 1).toString());

          setChartData({
            labels,
            datasets: [
              {
                label: `${histogramColumnName} count`,
                data: bins,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }
            ]
          });
        }
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="center-title">Environmental Insights Interactive</h1>
        <div className="maps-container">
          <div className="map-container">
            <div id="featureVectorMap" className="map"></div>
            <div className="controls">
              <h2>Model Input</h2>
              <label htmlFor="featureVector">Feature Vector:</label>
              <select
                id="featureVector"
                name="featureVector"
                value={selectedFeatureVector}
                onChange={(e) => setSelectedFeatureVector(e.target.value)}
              >
                {featureVectorColumnNames.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
              <button onClick={handleLoadFeatureVectorData}>Load Feature Vector Data</button>
            </div>
          </div>
          <div className="map-container">
            <div id="airPollutionMap" className="map"></div>
            <div className="controls">
              <h2>Model Output</h2>
              <label htmlFor="airPollution">Air Pollution:</label>
              <select
                id="airPollution"
                name="airPollution"
                value={selectedAirPollution}
                onChange={(e) => setSelectedAirPollution(e.target.value)}
              >
                {airPollutionColumnNames.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
              <button onClick={handleLoadAirPollutionData}>Load Air Pollution Data</button>
            </div>
          </div>
          <div className="chart-container">
            {chartData && (
              <Bar
                data={chartData}
                options={{
                  plugins: {
                    datalabels: {
                      display: true,
                      color: 'black',
                      formatter: (value) => value
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Count'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'AQI'
                      }
                    }
                  }
                }}
              />
            )}
            <div className="controls">
              <label htmlFor="month">Month:</label>
              <select
                id="month"
                name="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {Object.keys(monthNames).map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <label htmlFor="day">Day of the Week:</label>
              <select
                id="day"
                name="day"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <label htmlFor="hour">Hour:</label>
              <select
                id="hour"
                name="hour"
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
              >
                {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                  <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>{`${hour.toString().padStart(2, '0')}:00`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {clickedValue !== null && (
          <div>
            <p>Clicked Value: {clickedValue}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

