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

function App() {
  const [secondaryTitle] = useState('Air Pollution Predictor');
  const [selectedDataType, setSelectedDataType] = useState('o3');
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedHour, setSelectedHour] = useState('00:00');
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

    // Fetch GeoJSON data and display it on the map
    fetch(`/geojson-data?dataType=${selectedDataType}&month=${monthNumber}&day=${selectedDay}&hour=${selectedHour}`)
      .then(response => response.json())
      .then(geojsonData => {
        if (mapRef.current) {
          const map = mapRef.current;
          
          // Clear existing GeoJSON layers
          if (map.geojsonLayer) {
            map.removeLayer(map.geojsonLayer);
          }

          // Determine concentration values
          const concentrationColumnName = `${selectedDataType} Prediction mean`;
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

          // Prepare data for the histogram based on AQI
          const aqiColumnName = `${selectedDataType} AQI`;
          console.log(aqiColumnName);
          let aqiValues = geojsonData.features.map(feature => feature.properties[aqiColumnName]);
          const bins = new Array(10).fill(0);

          aqiValues.forEach(value => {
            if (value >= 1 && value <= 10) {
              bins[value - 1]++;
            }
          });

          const labels = bins.map((_, index) => (index + 1).toString());

          setChartData({
            labels,
            datasets: [
              {
                label: `${selectedDataType.toUpperCase()} AQI count`,
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
        <h1>Geospatial Map of the UK</h1>
        <div style={{ display: 'flex' }}>
          <div id="ukMap" style={{ height: '600px', width: '50%' }}></div>
          <div style={{ width: '50%', padding: '20px' }}>
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
                        text: 'AQI Value'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
        <h2>{secondaryTitle}</h2>
        <button onClick={handleLoadData}>Load Data</button>
        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center' }}>
          <label htmlFor="dataType">Data Type:</label>
          <select
            id="dataType"
            name="dataType"
            required
            value={selectedDataType}
            onChange={(e) => setSelectedDataType(e.target.value)}
            style={{ margin: '0 10px' }}
          >
            <option value="no2">NO2</option>
            <option value="o3">O3</option>
            <option value="pm10">PM10</option>
            <option value="pm2.5">PM2.5</option>
            <option value="so2">SO2</option>
          </select>
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
