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
  "Bicycle Score", "Car and Taxi Score", "Bus and Coach Score", "LGV Score", "HGV Score",
  '100m_u_component_of_wind', '100m_v_component_of_wind', '10m_u_component_of_wind',
  '10m_v_component_of_wind', '2m_dewpoint_temperature', '2m_temperature',
  'boundary_layer_height', 'downward_uv_radiation_at_the_surface', 'instantaneous_10m_wind_gust',
  'surface_pressure', 'total_column_rain_water', 'S5P_NO2', 'S5P_AAI', 'S5P_CO', 'S5P_HCHO', 'S5P_O3',
  'Road Infrastructure Distance residential', 'Road Infrastructure Distance footway',
  'Road Infrastructure Distance service', 'Road Infrastructure Distance primary',
  'Road Infrastructure Distance path', 'Road Infrastructure Distance cycleway',
  'Road Infrastructure Distance tertiary', 'Road Infrastructure Distance secondary',
  'Road Infrastructure Distance unclassified', 'Road Infrastructure Distance trunk',
  'Road Infrastructure Distance track', 'Road Infrastructure Distance motorway',
  'Road Infrastructure Distance pedestrian', 'Road Infrastructure Distance living_street',
  'Total Length cycleway', 'Total Length footway', 'Total Length living_street', 'Total Length motorway',
  'Total Length path', 'Total Length pedestrian', 'Total Length primary', 'Total Length residential',
  'Total Length secondary', 'Total Length service', 'Total Length tertiary', 'Total Length track',
  'Total Length trunk', 'Total Length unclassified', 'No Land', 'Broadleaved woodland',
  'Coniferous Woodland', 'Arable and Horticulture', 'Improved Grassland', 'Neutral Grassland',
  'Calcareous Grassland', 'Acid grassland', 'Fen Marsh and Swamp', 'Heather', 'Heather grassland', 'Bog',
  'Inland Rock', 'Saltwater', 'Freshwater', 'Supra-littoral Rock', 'Supra-littoral Sediment',
  'Littoral Rock', 'Littoral sediment', 'Saltmarsh', 'Urban', 'Suburban', 'NAEI SNAP 1 NOx',
  'NAEI SNAP 2 NOx', 'NAEI SNAP 3 NOx', 'NAEI SNAP 4 NOx', 'NAEI SNAP 5 NOx', 'NAEI SNAP 6 NOx',
  'NAEI SNAP 7 NOx', 'NAEI SNAP 8 NOx', 'NAEI SNAP 9 NOx', 'NAEI SNAP 10 NOx', 'NAEI SNAP 11 NOx',
  'NAEI SNAP 1 CO', 'NAEI SNAP 2 CO', 'NAEI SNAP 3 CO', 'NAEI SNAP 4 CO', 'NAEI SNAP 5 CO',
  'NAEI SNAP 6 CO', 'NAEI SNAP 7 CO', 'NAEI SNAP 8 CO', 'NAEI SNAP 9 CO', 'NAEI SNAP 10 CO',
  'NAEI SNAP 11 CO', 'NAEI SNAP 1 SOx', 'NAEI SNAP 2 SOx', 'NAEI SNAP 3 SOx', 'NAEI SNAP 4 SOx',
  'NAEI SNAP 5 SOx', 'NAEI SNAP 6 SOx', 'NAEI SNAP 7 SOx', 'NAEI SNAP 8 SOx', 'NAEI SNAP 9 SOx',
  'NAEI SNAP 10 SOx', 'NAEI SNAP 11 SOx', 'NAEI SNAP 1 NH3', 'NAEI SNAP 2 NH3', 'NAEI SNAP 3 NH3',
  'NAEI SNAP 4 NH3', 'NAEI SNAP 5 NH3', 'NAEI SNAP 6 NH3', 'NAEI SNAP 7 NH3', 'NAEI SNAP 8 NH3',
  'NAEI SNAP 9 NH3', 'NAEI SNAP 10 NH3', 'NAEI SNAP 11 NH3', 'NAEI SNAP 1 NMVOC', 'NAEI SNAP 2 NMVOC',
  'NAEI SNAP 3 NMVOC', 'NAEI SNAP 4 NMVOC', 'NAEI SNAP 5 NMVOC', 'NAEI SNAP 6 NMVOC', 'NAEI SNAP 7 NMVOC',
  'NAEI SNAP 8 NMVOC', 'NAEI SNAP 9 NMVOC', 'NAEI SNAP 10 NMVOC', 'NAEI SNAP 11 NMVOC', 'NAEI SNAP 1 PM10',
  'NAEI SNAP 2 PM10', 'NAEI SNAP 3 PM10', 'NAEI SNAP 4 PM10', 'NAEI SNAP 5 PM10', 'NAEI SNAP 6 PM10',
  'NAEI SNAP 7 PM10', 'NAEI SNAP 8 PM10', 'NAEI SNAP 9 PM10', 'NAEI SNAP 10 PM10', 'NAEI SNAP 11 PM10',
  'NAEI SNAP 1 PM25', 'NAEI SNAP 2 PM25', 'NAEI SNAP 3 PM25', 'NAEI SNAP 4 PM25', 'NAEI SNAP 5 PM25',
  'NAEI SNAP 6 PM25', 'NAEI SNAP 7 PM25', 'NAEI SNAP 8 PM25', 'NAEI SNAP 9 PM25', 'NAEI SNAP 10 PM25',
  'NAEI SNAP 11 PM25'
];

function App() {
  const [selectedAirPollution, setSelectedAirPollution] = useState(airPollutionColumnNames[0]);
  const [selectedFeatureVector, setSelectedFeatureVector] = useState(featureVectorColumnNames[0]);
  const [selectedMonth, setSelectedMonth] = useState('1');
  const [selectedDay, setSelectedDay] = useState('Friday');
  const [selectedHour, setSelectedHour] = useState('08:00');
  const [clickedValue, setClickedValue] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [changes, setChanges] = useState({});
  const [showOriginalMap, setShowOriginalMap] = useState(true);
  const [originalGeojson, setOriginalGeojson] = useState(null);
  const [updatedGeojson, setUpdatedGeojson] = useState(null);
  const [minValue, setMinValue] = useState(null);
  const [maxValue, setMaxValue] = useState(null);
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

  const handleLoadFeatureVectorData = () => {
    fetch(`/feature-vector?dataType=${selectedFeatureVector}&month=${selectedMonth}&day=${selectedDay}&hour=${selectedHour}`)
      .then(response => response.json())
      .then(geojsonData => {
        if (featureVectorMapRef.current) {
          const map = featureVectorMapRef.current;

          if (map.geojsonLayer) {
            map.removeLayer(map.geojsonLayer);
          }

          const concentrationColumnName = selectedFeatureVector;
          console.log(concentrationColumnName);
          let concentrationValues = geojsonData.features.map(feature => feature.properties[concentrationColumnName]);
          let minValue = Math.min(...concentrationValues);
          let maxValue = Math.max(...concentrationValues);

          function getColor(value) {
            let ratio = (value - minValue) / (maxValue - minValue);
            let r = 255;
            let g = Math.floor(255 * (1 - ratio));
            let b = Math.floor(255 * (1 - ratio));
            return `rgb(${r}, ${g}, ${b})`;
          }

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

          map.fitBounds(map.geojsonLayer.getBounds());
        }
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  };

  const handleLoadAirPollutionData = () => {
    fetch(`/air-pollution-concentrations?dataType=${selectedAirPollution}&month=${selectedMonth}&day=${selectedDay}&hour=${selectedHour}`)
      .then(response => response.json())
      .then(geojsonData => {
        if (airPollutionMapRef.current) {
          const map = airPollutionMapRef.current;

          if (map.geojsonLayer) {
            map.removeLayer(map.geojsonLayer);
          }

          const concentrationColumnName = `${selectedAirPollution} Prediction mean`;
          console.log(concentrationColumnName);
          let concentrationValues = geojsonData.features.map(feature => feature.properties[concentrationColumnName]);
          let minValue = Math.min(...concentrationValues);
          let maxValue = Math.max(...concentrationValues);

          function getColor(value) {
            let ratio = (value - minValue) / (maxValue - minValue);
            let r = 255;
            let g = Math.floor(255 * (1 - ratio));
            let b = Math.floor(255 * (1 - ratio));
            return `rgb(${r}, ${g}, ${b})`;
          }

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

          map.fitBounds(map.geojsonLayer.getBounds());

          setOriginalGeojson(geojsonData);
          setMinValue(minValue);
          setMaxValue(maxValue);

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
                label: `Original ${histogramColumnName} count`,
                data: bins,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
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

  const handleSelectChange = () => {
    setChanges({
      ...changes,
      [selectedFeatureVector]: sliderValue
    });
  };

  const handleMakePrediction = () => {
    const changesStr = Object.entries(changes).map(([feature, value]) => `${feature}:${value}`).join(',');

    const url = new URL('/predict', window.location.origin);
    url.searchParams.append('changes', changesStr);
    url.searchParams.append('air_pollutant', selectedAirPollution);
    url.searchParams.append('month', selectedMonth);
    url.searchParams.append('day', selectedDay);
    url.searchParams.append('hour', selectedHour);

    fetch(url.toString(), {
      method: 'GET'
    })
      .then(response => response.json())
      .then(data => {
        if (!data || !data.updated_geojson) {
          throw new Error("Invalid JSON data");
        }
        const updatedGeojson = JSON.parse(data.updated_geojson);
        setUpdatedGeojson(updatedGeojson);

        if (airPollutionMapRef.current) {
          const map = airPollutionMapRef.current;

          if (map.geojsonLayer) {
            map.removeLayer(map.geojsonLayer);
          }

          const concentrationColumnName = `${selectedAirPollution} Prediction mean`;
          let minValue = Math.min(...updatedGeojson.features.map(f => f.properties[concentrationColumnName]));
          let maxValue = Math.max(...updatedGeojson.features.map(f => f.properties[concentrationColumnName]));

          function getColor(value) {
            let ratio = (value - minValue) / (maxValue - minValue);
            let r = Math.floor(255 * (1 - ratio));
            let g = Math.floor(255 * (1 - ratio));
            let b = 255;
            return `rgb(${r}, ${g}, ${b})`;
          }

          map.geojsonLayer = L.geoJSON(updatedGeojson, {
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

          map.fitBounds(map.geojsonLayer.getBounds());

          const histogramColumnName = `${selectedAirPollution} AQI`;
          let columnValues = updatedGeojson.features.map(feature => feature.properties[histogramColumnName]);
          const bins = new Array(10).fill(0);

          columnValues.forEach(value => {
            if (value >= 1 && value <= 10) {
              bins[value - 1]++;
            }
          });

          const updatedLabels = bins.map((_, index) => (index + 1).toString());
          const updatedDataset = {
            label: `Updated ${histogramColumnName} count`,
            data: bins,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          };

          setChartData((prevChartData) => ({
            labels: updatedLabels,
            datasets: [...prevChartData.datasets, updatedDataset]
          }));
        }
      })
      .catch(error => {
        console.error('Error making prediction:', error);
      });
  };

  const handleToggleMap = () => {
    setShowOriginalMap(!showOriginalMap);

    if (airPollutionMapRef.current && originalGeojson) {
      const map = airPollutionMapRef.current;

      if (map.geojsonLayer) {
        map.removeLayer(map.geojsonLayer);
      }

      const geojsonData = showOriginalMap ? originalGeojson : updatedGeojson;
      const concentrationColumnName = `${selectedAirPollution} Prediction mean`;

      function getColor(value) {
        let ratio = (value - minValue) / (maxValue - minValue);
        let r = showOriginalMap ? 255 : Math.floor(255 * (1 - ratio));
        let g = showOriginalMap ? Math.floor(255 * (1 - ratio)) : Math.floor(255 * (1 - ratio));
        let b = showOriginalMap ? Math.floor(255 * (1 - ratio)) : 255;
        return `rgb(${r}, ${g}, ${b})`;
      }

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

      map.fitBounds(map.geojsonLayer.getBounds());
    }
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
              <label htmlFor="month">Month:</label>
              <select
                id="month"
                name="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) => (i + 1)).map(month => (
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
              <button onClick={handleLoadFeatureVectorData}>Load Feature Vector Data</button>
              <div className="slider-container">
                <label htmlFor="featureVectorSlider">Adjust Value (%):</label>
                <input
                  id="featureVectorSlider"
                  type="range"
                  min="-100"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(e.target.value)}
                />
                <span>{sliderValue}%</span>
              </div>
              <button onClick={handleSelectChange}>Select Change</button>
              <div className="selected-changes">
                <h3>Selected Changes</h3>
                {Object.entries(changes).map(([feature, value]) => (
                  <div key={feature} className="selected-change">
                    {feature}: {value}%
                  </div>
                ))}
              </div>
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
              <button onClick={handleMakePrediction}>Make Prediction</button>
              <div>
                <input
                  type="checkbox"
                  id="toggleMap"
                  checked={!showOriginalMap}
                  onChange={handleToggleMap}
                />
                <label htmlFor="toggleMap">Show Updated Map</label>
              </div>
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
