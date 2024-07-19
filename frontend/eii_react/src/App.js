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
  'HGV Score',
  'Road Infrastructure Distance residential',
  'Road Infrastructure Distance footway',
  'Road Infrastructure Distance service',
  'Road Infrastructure Distance primary',
  'Road Infrastructure Distance bridleway',
  'Road Infrastructure Distance path',
  'Road Infrastructure Distance cycleway',
  'Road Infrastructure Distance tertiary',
  'Road Infrastructure Distance secondary',
  'Road Infrastructure Distance unclassified',
  'Road Infrastructure Distance trunk',
  'Road Infrastructure Distance track',
  'Road Infrastructure Distance motorway_link',
  'Road Infrastructure Distance steps',
  'Road Infrastructure Distance motorway',
  'Road Infrastructure Distance trunk_link',
  'Road Infrastructure Distance primary_link',
  'Road Infrastructure Distance pedestrian',
  'Road Infrastructure Distance construction',
  'Road Infrastructure Distance tertiary_link',
  'Road Infrastructure Distance secondary_link',
  'Road Infrastructure Distance living_street',
  'Road Infrastructure Distance raceway',
  'Total Length bridleway',
  'Total Length construction',
  'Total Length cycleway',
  'Total Length footway',
  'Total Length living_street',
  'Total Length motorway',
  'Total Length motorway_link',
  'Total Length path',
  'Total Length pedestrian',
  'Total Length primary',
  'Total Length primary_link',
  'Total Length raceway',
  'Total Length residential',
  'Total Length secondary',
  'Total Length secondary_link',
  'Total Length service',
  'Total Length steps',
  'Total Length tertiary',
  'Total Length tertiary_link',
  'Total Length track',
  'Total Length trunk',
  'Total Length trunk_link',
  'Total Length unclassified',
  'S5P_NO2',
  'S5P_AAI',
  'S5P_CO',
  'S5P_HCHO',
  'S5P_O3',
  'Improved Grassland',
  'Broadleaved woodland',
  'Suburban',
  'Arable and Horticulture',
  'Urban',
  'Neutral Grassland',
  'Freshwater',
  'Saltmarsh',
  'Supra-littoral Sediment',
  'Calcareous Grassland',
  'Saltwater',
  'Fen Marsh and Swamp',
  'Inland Rock',
  'Littoral Sediment',
  'Littoral Rock',
  'Builtup Areas and Gardens',
  'Coniferous woodland',
  'Bog',
  'Dwarf Shrub Heath',
  'NAEI SNAP 1 NOx',
  'NAEI SNAP 1 CO',
  'NAEI SNAP 1 SOx',
  'NAEI SNAP 1 NH3',
  'NAEI SNAP 1 NMVOC',
  'NAEI SNAP 1 PM10',
  'NAEI SNAP 1 PM25',
  'NAEI SNAP 2 NOx',
  'NAEI SNAP 2 CO',
  'NAEI SNAP 2 SOx',
  'NAEI SNAP 2 NH3',
  'NAEI SNAP 2 NMVOC',
  'NAEI SNAP 2 PM10',
  'NAEI SNAP 2 PM25',
  'NAEI SNAP 3 NOx',
  'NAEI SNAP 3 CO',
  'NAEI SNAP 3 SOx',
  'NAEI SNAP 3 NH3',
  'NAEI SNAP 3 NMVOC',
  'NAEI SNAP 3 PM10',
  'NAEI SNAP 3 PM25',
  'NAEI SNAP 4 NOx',
  'NAEI SNAP 4 CO',
  'NAEI SNAP 4 SOx',
  'NAEI SNAP 4 NH3',
  'NAEI SNAP 4 NMVOC',
  'NAEI SNAP 4 PM10',
  'NAEI SNAP 4 PM25',
  'NAEI SNAP 5 NOx',
  'NAEI SNAP 5 CO',
  'NAEI SNAP 5 SOx',
  'NAEI SNAP 5 NH3',
  'NAEI SNAP 5 NMVOC',
  'NAEI SNAP 5 PM10',
  'NAEI SNAP 5 PM25',
  'NAEI SNAP 6 NOx',
  'NAEI SNAP 6 CO',
  'NAEI SNAP 6 SOx',
  'NAEI SNAP 6 NH3',
  'NAEI SNAP 6 NMVOC',
  'NAEI SNAP 6 PM10',
  'NAEI SNAP 6 PM25',
  'NAEI SNAP 7 NOx',
  'NAEI SNAP 7 CO',
  'NAEI SNAP 7 SOx',
  'NAEI SNAP 7 NH3',
  'NAEI SNAP 7 NMVOC',
  'NAEI SNAP 7 PM10',
  'NAEI SNAP 7 PM25',
  'NAEI SNAP 8 NOx',
  'NAEI SNAP 8 CO',
  'NAEI SNAP 8 SOx',
  'NAEI SNAP 8 NH3',
  'NAEI SNAP 8 NMVOC',
  'NAEI SNAP 8 PM10',
  'NAEI SNAP 8 PM25',
  'NAEI SNAP 9 NOx',
  'NAEI SNAP 9 CO',
  'NAEI SNAP 9 SOx',
  'NAEI SNAP 9 NH3',
  'NAEI SNAP 9 NMVOC',
  'NAEI SNAP 9 PM10',
  'NAEI SNAP 9 PM25',
  'NAEI SNAP 10 NOx',
  'NAEI SNAP 10 CO',
  'NAEI SNAP 10 SOx',
  'NAEI SNAP 10 NH3',
  'NAEI SNAP 10 NMVOC',
  'NAEI SNAP 10 PM10',
  'NAEI SNAP 10 PM25',
  'NAEI SNAP 11 NOx',
  'NAEI SNAP 11 CO',
  'NAEI SNAP 11 SOx',
  'NAEI SNAP 11 NH3',
  'NAEI SNAP 11 NMVOC',
  'NAEI SNAP 11 PM10',
  'NAEI SNAP 11 PM25',
  '100m_u_component_of_wind',
  '100m_v_component_of_wind',
  '10m_u_component_of_wind',
  '10m_v_component_of_wind',
  '2m_dewpoint_temperature',
  '2m_temperature',
  'boundary_layer_height',
  'downward_uv_radiation_at_the_surface',
  'instantaneous_10m_wind_gust',
  'surface_pressure',
  'total_cloud_cover',
  'total_column_rain_water',
  'instantaneous_surface_sensible_heat_flux',
];

function App() {
  const [secondaryTitle] = useState('Air Pollution Predictor');
  const [selectedAirPollution, setSelectedAirPollution] = useState(airPollutionColumnNames[0]);
  const [selectedFeatureVector, setSelectedFeatureVector] = useState(featureVectorColumnNames[0]);
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedHour, setSelectedHour] = useState('00:00');
  const [showFeatureVector, setShowFeatureVector] = useState(false);
  const [clickedValue, setClickedValue] = useState(null);
  const [chartData, setChartData] = useState(null);
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

  const handleLoadData = () => {
    // Convert selected month name to its numerical representation
    const monthNumber = monthNames[selectedMonth];

    const endpoint = showFeatureVector ? '/feature-vector' : '/air-pollution-concentrations';
    const dataTypeParam = showFeatureVector ? selectedFeatureVector : selectedAirPollution;

    // Fetch GeoJSON data and display it on the map
    fetch(`${endpoint}?dataType=${dataTypeParam}&month=${monthNumber}&day=${selectedDay}&hour=${selectedHour}`)
      .then(response => response.json())
      .then(geojsonData => {
        if (mapRef.current) {
          const map = mapRef.current;

          // Clear existing GeoJSON layers
          if (map.geojsonLayer) {
            map.removeLayer(map.geojsonLayer);
          }

          // Determine concentration values
          const concentrationColumnName = showFeatureVector ? dataTypeParam : `${selectedAirPollution} Prediction mean`;
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
          if (!showFeatureVector) {
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
          } else {
            setChartData(null);
          }
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
        <div style={{ display: 'flex' }}>
          <div id="ukMap" style={{ height: '600px', width: '50%' }}></div>
          {!showFeatureVector && chartData && (
            <div style={{ width: '50%', padding: '20px' }}>
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
                        text: 'Value'
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
        <h2>{secondaryTitle}</h2>
        <button onClick={handleLoadData}>Load Data</button>
        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ margin: '0 10px' }}>
            <label htmlFor="airPollution">Air Pollution:</label>
            <select
              id="airPollution"
              name="airPollution"
              value={selectedAirPollution}
              onChange={(e) => setSelectedAirPollution(e.target.value)}
              style={{ margin: '0 10px' }}
              disabled={showFeatureVector}
            >
              {airPollutionColumnNames.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="checkbox"
              id="showFeatureVector"
              name="showFeatureVector"
              checked={showFeatureVector}
              onChange={(e) => setShowFeatureVector(e.target.checked)}
            />
            <label htmlFor="showFeatureVector">Display Feature Vector</label>
          </div>
          {showFeatureVector && (
            <div style={{ margin: '0 10px' }}>
              <label htmlFor="featureVector">Feature Vector:</label>
              <select
                id="featureVector"
                name="featureVector"
                value={selectedFeatureVector}
                onChange={(e) => setSelectedFeatureVector(e.target.value)}
                style={{ margin: '0 10px' }}
              >
                {featureVectorColumnNames.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
          )}
          <label htmlFor="month">Month:</label>
          <select
            id="month"
            name="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ margin: '0 10px' }}
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
                      style={{ margin: '0 10px' }}
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
                      style={{ margin: '0 10px' }}
                    >
                      {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                        <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>{`${hour.toString().padStart(2, '0')}:00`}</option>
                      ))}
                    </select>
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
          