import React, { useState, useEffect, useCallback } from 'react';
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

const INITIAL_VIEW_STATE = {
  longitude: -4,
  latitude: 54.5,
  zoom: 6,
  pitch: 0,
  bearing: 0
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
  const [mapState, setMapState] = useState('original'); // New state to track map state

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
    fetch(`/feature-vector?dataType=${selectedFeatureVector}&month=${selectedMonth}&day=${selectedDay}&hour=${selectedHour}`)
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
    fetch(`/air-pollution-concentrations?dataType=${selectedAirPollution}&month=${selectedMonth}&day=${selectedDay}&hour=${selectedHour}`)
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
              label: `Original ${histogramColumnName} count`,
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
          label: `Updated ${histogramColumnName} count`,
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

  const debouncedSetViewState = useCallback(debounce((newViewState) => {
    setViewState(newViewState);
  }, 200), []); // Adjust the debounce delay as needed

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="center-title">Environmental Insights Interactive</h1>
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
                {Array.from({ length: 12 }, (_, i) => (i + 1)).map(month => (
                  <option key={month} value={month}>{month}</option>
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
                onViewStateChange={({ viewState }) => debouncedSetViewState(viewState)}
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
                onViewStateChange={({ viewState }) => debouncedSetViewState(viewState)}
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
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
              <button onClick={handleLoadAirPollutionData}>Load Air Pollution Data</button>
              <button onClick={handleMakePrediction}>Make Prediction</button>
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
      </header>
    </div>
  );
}

export default App;
