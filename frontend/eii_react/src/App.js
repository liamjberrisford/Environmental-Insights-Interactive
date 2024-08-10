import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import { Bar } from 'react-chartjs-2';
import 'mapbox-gl/dist/mapbox-gl.css';
import bbox from '@turf/bbox';
import { debounce } from 'lodash';
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
  'surface_pressure', 'total_column_rain_water'
];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const INITIAL_VIEW_STATE = {
  longitude: -4,
  latitude: 54.5,
  zoom: 6,
  pitch: 0,
  bearing: 0
};

// Function to format air pollutant names with subscripts
const formatPollutantName = (name) => {
  switch (name) {
    case 'no2':
      return 'NO\u2082'; // NO₂
    case 'o3':
      return 'O\u2083'; // O₃
    case 'pm10':
      return 'PM\u2081\u2080'; // PM₁₀
    case 'pm2.5':
      return 'PM\u2082.\u2085'; // PM₂.₅
    case 'so2':
      return 'SO\u2082'; // SO₂
    default:
      return name;
  }
};

function App() {
  const [selectedAirPollution, setSelectedAirPollution] = useState(airPollutionColumnNames[0]);
  const [selectedFeatureVector, setSelectedFeatureVector] = useState(featureVectorColumnNames[0]);
  const [selectedMonth, setSelectedMonth] = useState('1');
  const [selectedDay, setSelectedDay] = useState('Friday');
  const [selectedHour, setSelectedHour] = useState('08:00');
  const [chartData, setChartData] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [changes, setChanges] = useState({});
  const [leftGeojson, setLeftGeojson] = useState(null);
  const [rightGeojson, setRightGeojson] = useState(null);
  const [updatedGeojson, setUpdatedGeojson] = useState(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [mapState, setMapState] = useState('original');
  const [backendStatus, setBackendStatus] = useState(false);

  const isDevelopment = process.env.NODE_ENV === 'development';
  const defaultBackendUrl = isDevelopment ? 'http://127.0.0.1:3000' : 'https://liberrisford.pythonanywhere.com';
  const [backendUrl, setBackendUrl] = useState(defaultBackendUrl);

  // Function to check the backend status
  const checkBackendStatus = useCallback(() => {
    fetch(`${backendUrl}/status`)
      .then(response => {
        if (response.ok) {
          setBackendStatus(true);
        } else {
          setBackendStatus(false);
        }
      })
      .catch(error => {
        setBackendStatus(false);
      });
  }, [backendUrl]);

  useEffect(() => {
    if (backendUrl) {
      checkBackendStatus();
      const intervalId = setInterval(checkBackendStatus, 5000); // Check every 5 seconds
      return () => clearInterval(intervalId); // Clear the interval when the component unmounts
    }
  }, [backendUrl, checkBackendStatus]);

  const updateViewState = (geojson) => {
    const bounds = bbox(geojson);
    setViewState((prevState) => ({
      ...prevState,
      longitude: (bounds[0] + bounds[2]) / 2,
      latitude: (bounds[1] + bounds[3]) / 2,
      zoom: 8
    }));
  };

  const getColor = (value, minValue, maxValue, colorScale) => {
    let ratio = (value - minValue) / (maxValue - minValue);
    let r = colorScale === 'red' ? 255 : Math.floor(255 * (1 - ratio));
    let g = colorScale === 'red' ? Math.floor(255 * (1 - ratio)) : Math.floor(255 * (1 - ratio));
    let b = colorScale === 'red' ? Math.floor(255 * (1 - ratio)) : 255;
    return [r, g, b, 180];
  };

  const getLineWidth = (zoom) => {
    if (zoom < 10) {
      return 0; // Hide lines at lower zoom levels
    } else if (zoom < 12) {
      return 0.5; // Thin lines at mid zoom levels
    } else {
      return 1; // Thicker lines at higher zoom levels
    }
  };

  const handleLoadFeatureVectorData = () => {
    fetch(`${backendUrl}/feature-vector?dataType=${selectedFeatureVector}&month=${selectedMonth}&day=${selectedDay}&hour=${selectedHour}`)
      .then(response => response.json())
      .then(geojsonData => {
        console.log('Original GeoJSON:', geojsonData); // Log GeoJSON data

        const concentrationColumnName = selectedFeatureVector;
        let concentrationValues = geojsonData.features.map(feature => feature.properties[concentrationColumnName]);
        const minValue = Math.min(...concentrationValues);
        const maxValue = Math.max(...concentrationValues);

        const leftLayer = new GeoJsonLayer({
          id: 'geojson-layer-left',
          data: geojsonData,
          stroked: true,
          filled: true,
          getLineWidth: () => getLineWidth(viewState.zoom), // Use dynamic line width
          opacity: 0.4,
          getLineColor: [0, 0, 0],
          getFillColor: f => getColor(f.properties[concentrationColumnName], minValue, maxValue, 'red'),
          pickable: true,
          updateTriggers: {
            getFillColor: [minValue, maxValue, concentrationColumnName],
            getLineWidth: viewState.zoom // Trigger updates when zoom changes
          }
        });

        setLeftGeojson([leftLayer]);
        updateViewState(geojsonData);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  };

  const handleLoadAirPollutionData = () => {
    fetch(`${backendUrl}/air-pollution-concentrations?dataType=${selectedAirPollution}&month=${selectedMonth}&day=${selectedDay}&hour=${selectedHour}`)
      .then(response => response.json())
      .then(geojsonData => {
        console.log('Air Pollution GeoJSON:', geojsonData); // Log GeoJSON data

        const concentrationColumnName = `${selectedAirPollution} Prediction 0.5`;
        let concentrationValues = geojsonData.features.map(feature => feature.properties[concentrationColumnName]);
        const minValue = Math.min(...concentrationValues);
        const maxValue = Math.max(...concentrationValues);

        const redLayer = new GeoJsonLayer({
          id: 'geojson-layer-red',
          data: geojsonData,
          stroked: true,
          filled: true,
          getLineWidth: () => getLineWidth(viewState.zoom), // Use dynamic line width
          opacity: 0.4,
          getLineColor: [0, 0, 0],
          getFillColor: f => getColor(f.properties[concentrationColumnName], minValue, maxValue, 'red'),
          pickable: true,
          updateTriggers: {
            getFillColor: [minValue, maxValue, concentrationColumnName],
            getLineWidth: viewState.zoom // Trigger updates when zoom changes
          }
        });

        setRightGeojson([redLayer]);
        setUpdatedGeojson(null); // Clear the blue layer when loading the red layer
        setMapState('original'); // Update map state to original
        updateViewState(geojsonData);

        const histogramColumnName = `${selectedAirPollution} AQI`;
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
              label: `Baseline ${formatPollutantName(selectedAirPollution)} AQI Count`,
              data: bins,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }
          ]
        });
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

    const url = new URL('/predict', backendUrl);
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
        console.log('Updated GeoJSON:', updatedGeojson); // Log GeoJSON data

        const concentrationColumnName = `${selectedAirPollution} Prediction 0.5`;
        let concentrationValues = updatedGeojson.features.map(feature => feature.properties[concentrationColumnName]);
        const minValue = Math.min(...concentrationValues);
        const maxValue = Math.max(...concentrationValues);

        const blueLayer = new GeoJsonLayer({
          id: 'geojson-layer-blue',
          data: updatedGeojson,
          stroked: true,
          filled: true,
          getLineWidth: () => getLineWidth(viewState.zoom), // Use dynamic line width
          opacity: 0.4,
          getLineColor: [100, 100, 255],
          getFillColor: f => getColor(f.properties[concentrationColumnName], minValue, maxValue, 'blue'),
          pickable: true,
          updateTriggers: {
            getFillColor: [minValue, maxValue, concentrationColumnName],
            getLineWidth: viewState.zoom // Trigger updates when zoom changes
          }
        });

        setUpdatedGeojson([blueLayer]);
        setMapState('prediction'); // Update map state to prediction
        updateViewState(updatedGeojson);

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
          label: `Modified Predicted ${formatPollutantName(selectedAirPollution)} AQI Count`,
          data: bins,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        };

        setChartData((prevChartData) => ({
          labels: updatedLabels,
          datasets: [
            prevChartData.datasets[0], // Keep the original dataset
            updatedDataset // Replace with the new updated dataset
          ]
        }));
      })
      .catch(error => {
        console.error('Error making prediction:', error);
      });
  };

  const handleGenerateReport = () => {
    const reportData = {
      selectedAirPollution,
      selectedFeatureVector,
      selectedMonth,
      selectedDay,
      selectedHour,
      changes,
      sliderValue
    };

    fetch(`${backendUrl}/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'pdf_report.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch(error => {
        console.error('Error generating report:', error);
      });
  };

  const debouncedSetViewState = debounce((newViewState) => {
    setViewState(newViewState);
  }, 200);

  const handleViewStateChange = useCallback(({ viewState }) => {
    debouncedSetViewState(viewState);
  }, [debouncedSetViewState]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="backend-input-container">
          <label htmlFor="backendUrl">Backend URL: </label>
          <input
            id="backendUrl"
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            style={{ backgroundColor: backendStatus ? 'green' : 'red' }}
          />
          <span className="backend-status-text">
            {backendStatus ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="title-container">
          <h1 className="center-title">Environmental Insights Interactive</h1>
        </div>
      </header>
      <div className="filters-container">
        <h2 className="filters-title">Typical Day Selection</h2>
        <div className="filters-box">
          <div className="filter">
            <label htmlFor="month">Month:</label>
            <select
              id="month"
              name="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="filter">
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
          </div>
          <div className="filter">
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
      <div className="maps-wrapper">
        <div className="map-section">
          <div className="map-container">
            <DeckGL
              initialViewState={viewState}
              controller={true}
              layers={leftGeojson ? leftGeojson : []}
              style={{ height: '500px' }}
              onViewStateChange={handleViewStateChange}
            >
              <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
            </DeckGL>
          </div>
        </div>
        <div className="map-section">
          <div className="map-container">
            <DeckGL
              initialViewState={viewState}
              controller={true}
              layers={mapState === 'prediction' ? updatedGeojson : rightGeojson} // Conditionally render the correct layer
              style={{ height: '500px' }}
              onViewStateChange={handleViewStateChange}
            >
              <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
            </DeckGL>
          </div>
        </div>
      </div>
      <div className="controls-wrapper">
        <div className="controls-section">
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
        <div className="controls-section">
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
                <option key={column} value={column}>
                  {formatPollutantName(column)}
                </option>
              ))}
            </select>
            <button onClick={handleLoadAirPollutionData}>Load Air Pollution Data</button>
            <button onClick={handleMakePrediction}>Make Prediction</button>
            <button onClick={handleGenerateReport}>Generate Report</button>
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
  );
}

export default App;
