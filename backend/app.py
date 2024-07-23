from flask import Flask, jsonify, request
import os
from flask_cors import CORS
import geopandas as gpd
import pandas as pd
import sqlite3
import pickle
import lightgbm as lgb

import sys
import os

# Add the directory containing the module to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../environmental_insights')))

# Import the module
import air_pollution_functions as ei_air_pollution_functions
import models as ei_models

featureVectorColumnNames = ["Bicycle Score", "Car and Taxi Score", "Bus and Coach Score", "LGV Score", "HGV Score",
                            
                            "Week Number", "Month Number", "Day of Week Number", "Hour Number", 
                            
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
                            'total_column_rain_water',
                            
                            "S5P_NO2","S5P_AAI","S5P_CO","S5P_HCHO","S5P_O3",
                                
                            "Road Infrastructure Distance residential",
                            "Road Infrastructure Distance footway",
                            "Road Infrastructure Distance service",
                            "Road Infrastructure Distance primary",
                            "Road Infrastructure Distance path",
                            "Road Infrastructure Distance cycleway",
                            "Road Infrastructure Distance tertiary",
                            "Road Infrastructure Distance secondary",
                            "Road Infrastructure Distance unclassified",
                            "Road Infrastructure Distance trunk",
                            "Road Infrastructure Distance track",
                            "Road Infrastructure Distance motorway",
                            "Road Infrastructure Distance pedestrian",
                            "Road Infrastructure Distance living_street",
                            
                            
                            "Total Length cycleway", "Total Length footway",
                            "Total Length living_street", "Total Length motorway",
                             "Total Length path",
                            "Total Length pedestrian", "Total Length primary",
                            "Total Length residential", "Total Length secondary",
                             "Total Length service",
                            "Total Length tertiary",
                             "Total Length track",
                            "Total Length trunk",
                            "Total Length unclassified",
                            
                            
                            'No Land',
                            'Broadleaved woodland',
                            'Coniferous Woodland',
                            'Arable and Horticulture',
                            'Improved Grassland',
                            'Neutral Grassland',
                            'Calcareous Grassland',
                            'Acid grassland',
                            'Fen Marsh and Swamp',
                            'Heather',
                            'Heather grassland',
                            'Bog',
                            'Inland Rock',
                            'Saltwater',
                            'Freshwater',
                            'Supra-littoral Rock',
                            'Supra-littoral Sediment',
                            'Littoral Rock',
                            'Littoral sediment',
                            'Saltmarsh',
                            'Urban',
                            'Suburban',
                           
                            'NAEI SNAP 1 NOx',
                            'NAEI SNAP 2 NOx',
                            'NAEI SNAP 3 NOx',
                            'NAEI SNAP 4 NOx',
                            'NAEI SNAP 5 NOx',
                            'NAEI SNAP 6 NOx',
                            'NAEI SNAP 7 NOx',
                            'NAEI SNAP 8 NOx',
                            'NAEI SNAP 9 NOx',
                            'NAEI SNAP 10 NOx',
                            'NAEI SNAP 11 NOx',
                            'NAEI SNAP 1 CO',
                            'NAEI SNAP 2 CO',
                            'NAEI SNAP 3 CO',
                            'NAEI SNAP 4 CO',
                            'NAEI SNAP 5 CO',
                            'NAEI SNAP 6 CO',
                            'NAEI SNAP 7 CO',
                            'NAEI SNAP 8 CO',
                            'NAEI SNAP 9 CO',
                            'NAEI SNAP 10 CO',
                            'NAEI SNAP 11 CO',
                            'NAEI SNAP 1 SOx',
                            'NAEI SNAP 2 SOx',
                            'NAEI SNAP 3 SOx',
                            'NAEI SNAP 4 SOx',
                            'NAEI SNAP 5 SOx',
                            'NAEI SNAP 6 SOx',
                            'NAEI SNAP 7 SOx',
                            'NAEI SNAP 8 SOx',
                            'NAEI SNAP 9 SOx',
                            'NAEI SNAP 10 SOx',
                            'NAEI SNAP 11 SOx',
                            'NAEI SNAP 1 NH3',
                            'NAEI SNAP 2 NH3',
                            'NAEI SNAP 3 NH3',
                            'NAEI SNAP 4 NH3',
                            'NAEI SNAP 5 NH3',
                            'NAEI SNAP 6 NH3',
                            'NAEI SNAP 7 NH3',
                            'NAEI SNAP 8 NH3',
                            'NAEI SNAP 9 NH3',
                            'NAEI SNAP 10 NH3',
                            'NAEI SNAP 11 NH3',
                            'NAEI SNAP 1 NMVOC',
                            'NAEI SNAP 2 NMVOC',
                            'NAEI SNAP 3 NMVOC',
                            'NAEI SNAP 4 NMVOC',
                            'NAEI SNAP 5 NMVOC',
                            'NAEI SNAP 6 NMVOC',
                            'NAEI SNAP 7 NMVOC',
                            'NAEI SNAP 8 NMVOC',
                            'NAEI SNAP 9 NMVOC',
                            'NAEI SNAP 10 NMVOC',
                            'NAEI SNAP 11 NMVOC',
                            'NAEI SNAP 1 PM10',
                            'NAEI SNAP 2 PM10',
                            'NAEI SNAP 3 PM10',
                            'NAEI SNAP 4 PM10',
                            'NAEI SNAP 5 PM10',
                            'NAEI SNAP 6 PM10',
                            'NAEI SNAP 7 PM10',
                            'NAEI SNAP 8 PM10',
                            'NAEI SNAP 9 PM10',
                            'NAEI SNAP 10 PM10',
                            'NAEI SNAP 11 PM10',
                            'NAEI SNAP 1 PM25',
                            'NAEI SNAP 2 PM25',
                            'NAEI SNAP 3 PM25',
                            'NAEI SNAP 4 PM25',
                            'NAEI SNAP 5 PM25',
                            'NAEI SNAP 6 PM25',
                            'NAEI SNAP 7 PM25',
                            'NAEI SNAP 8 PM25',
                            'NAEI SNAP 9 PM25',
                            'NAEI SNAP 10 PM25',
                            'NAEI SNAP 11 PM25',
                           
                           
                            
                           
                           
                           ]

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

@app.route('/')
def serve_react_app():
    
    return "Environmental Insights backend"

@app.route('/air-pollution-concentrations', methods=['POST', 'GET'])
def geojson_data():
    # Extract the parameters from the query
    data_type = request.args.get('dataType', default='nox', type=str)
    month = request.args.get('month', default='1', type=str)
    day_of_week = request.args.get('day', default='Friday', type=str)
    hour = int(request.args.get('hour', default='8', type=str).split(':')[0])

    print(f"Air Pollutant Requested: {data_type}")
    print(f"Month: {month}, Day: {day_of_week}, Hour: {hour}")

    # Read the GeoPackage file for the grids layer
    grids = gpd.read_file('data/raw_data/uk_1km_landGrids_3395_london.gpkg')

    # Reproject to EPSG:4326 (WGS 84)
    grids = grids.to_crs(epsg=4326)

    # Create a connection to the database using sqlite3
    conn = sqlite3.connect('data/database.db')

    # Construct table name based on the extracted parameters
    table_name = f"air_pollution_concentration_Month_{month}_Day_{day_of_week}_Hour_{hour}"

    # Create the SQL query to select only the required columns
    pollutant_column = f'"{data_type} Prediction mean"'
    sql_query = f'SELECT "Grid ID", {pollutant_column} FROM {table_name}'

    # Read the required columns using pandas
    try:
        air_pollution_concentrations = pd.read_sql_query(sql_query, conn)
    except Exception as e:
        print(f"Error reading table {table_name}: {e}")
        conn.close()
        return jsonify({"error": f"Could not find table {table_name} in the database."}), 400

    # Close the connection
    conn.close()

    # Merge or join the grids with the selected columns of air_pollution_concentrations
    # Assuming a common column 'Grid ID' exists in both GeoDataFrames
    merged_data = grids.merge(air_pollution_concentrations, left_on='Grid ID', right_on='Grid ID')

    # Reproject to EPSG:4326 (WGS 84)
    merged_data = merged_data.to_crs(epsg=4326)

    merged_data['geometry'] = merged_data['geometry'].simplify(0.001, preserve_topology=True)

    ei_air_pollution_functions.air_pollution_concentrations_to_UK_daily_air_quality_index(merged_data, data_type, data_type + " Prediction mean")

    print(merged_data.columns)

    # Convert the GeoDataFrame to GeoJSON
    geojson_data = merged_data.to_json()

    return geojson_data

@app.route('/feature-vector', methods=['POST', 'GET'])
def feature_vector_data():
    # Extract the parameters from the query
    data_type = request.args.get('dataType', default='Bicycle Score', type=str)
    month = request.args.get('month', default='1', type=str)
    day_of_week = request.args.get('day', default='Friday', type=str)
    hour = int(request.args.get('hour', default='8', type=str).split(':')[0])

    print(f"Feature Requested: {data_type}")
    print(f"Month: {month}, Day: {day_of_week}, Hour: {hour}")

    # Read the GeoPackage file for the grids layer
    grids = gpd.read_file('data/raw_data/uk_1km_landGrids_3395_london.gpkg')

    # Reproject to EPSG:4326 (WGS 84)
    grids = grids.to_crs(epsg=4326)

    # Create a connection to the database using sqlite3
    conn = sqlite3.connect('data/database.db')

    # Construct table name based on the extracted parameters
    table_name = f"feature_vector_Month_{month}_Day_{day_of_week}_Hour_{hour}"

    # Create the SQL query to select only the required columns
    feature_column = f'"{data_type}"'
    sql_query = f'SELECT "Grid ID", {feature_column} FROM {table_name}'

    # Read the required columns using pandas
    try:
        feature_vector_data = pd.read_sql_query(sql_query, conn)
    except Exception as e:
        print(f"Error reading table {table_name}: {e}")
        conn.close()
        return jsonify({"error": f"Could not find table {table_name} in the database."}), 400

    # Close the connection
    conn.close()

    # Merge or join the grids with the selected columns of feature_vector_data
    # Assuming a common column 'Grid ID' exists in both GeoDataFrames
    merged_data = grids.merge(feature_vector_data, left_on='Grid ID', right_on='Grid ID')

    # Reproject to EPSG:4326 (WGS 84)
    merged_data = merged_data.to_crs(epsg=4326)

    merged_data['geometry'] = merged_data['geometry'].simplify(0.001, preserve_topology=True)

    print(merged_data.columns)

    # Convert the GeoDataFrame to GeoJSON
    geojson_data = merged_data.to_json()

    return geojson_data

@app.route('/predict', methods=['GET'])
def predict():
    # Extract parameters from the query string
    air_pollutant = request.args.get('air_pollutant', default='no2', type=str)
    month = request.args.get('month', default='1', type=str)
    day_of_week = request.args.get('day', default='Friday', type=str)
    hour = int(request.args.get('hour', default='8', type=str).split(':')[0])
    changes_str = request.args.get('changes', default='', type=str)
    changes = {item.split(':')[0]: float(item.split(':')[1]) for item in changes_str.split(',') if ':' in item}

    # Read the GeoPackage file for the grids layer
    grids = gpd.read_file('data/raw_data/uk_1km_landGrids_3395_london.gpkg')
    grids = grids.to_crs(epsg=4326)

    # Create a connection to the database using sqlite3
    conn = None
    try:
        conn = sqlite3.connect('data/database.db')
        table_name = f"feature_vector_Month_{month}_Day_{day_of_week}_Hour_{hour}"
        sql_query = f'SELECT * FROM {table_name}'
        observation_data = pd.read_sql_query(sql_query, conn)
    except Exception as e:
        print(f"Error reading table {table_name}: {e}")
        return jsonify({"error": f"Could not find table {table_name} in the database."}), 400
    finally:
        if conn:
            conn.close()

    # Apply changes to observation_data
    for feature, change in changes.items():
        if feature in observation_data.columns:
            observation_data[feature] = observation_data[feature] * (1 + change / 100)

     # Load the model
    model_type, model_dataset = "0.5", "All"
    
    model_filepath = "models/uk/dataset_"+model_dataset+"_quantile_regression_"+model_type+"_air_pollutant_"+air_pollutant+".pkl"
    print(model_filepath)
    with open(model_filepath, "rb") as f:  # Python 3: open(..., 'rb')
        climate_projection_model = pickle.load(f)

    # Rename columns for consistency with the model
    observation_data = observation_data.rename(columns={"Grid ID": "UK Model Grid ID"})

    # Make predictions
    updated_predictions = ei_models.make_concentration_predicitions_united_kingdom(
        climate_projection_model, observation_data, featureVectorColumnNames
    )

    # Rename columns back for merging
    updated_predictions = updated_predictions.rename(columns={"UK Model Grid ID": "Grid ID"})
    updated_predictions = updated_predictions.rename(columns={"Model Predicition": air_pollutant + " Prediction mean"})

    # Merge with the grids data
    merged_data = grids.merge(updated_predictions, left_on='Grid ID', right_on='Grid ID')

    # Simplify geometries for performance
    merged_data['geometry'] = merged_data['geometry'].simplify(0.001, preserve_topology=True)

    ei_air_pollution_functions.air_pollution_concentrations_to_UK_daily_air_quality_index(merged_data, air_pollutant, air_pollutant + " Prediction mean")

    print(merged_data)
    # Convert the GeoDataFrame to GeoJSON
    updated_geojson = merged_data.to_json()
    return jsonify({"updated_geojson": updated_geojson})


@app.route('/num-tables', methods=['GET'])
def num_tables():
    # Create a connection to the database
    conn = sqlite3.connect('data/database.db')
    cur = conn.cursor()
    
    # Query to get the number and names of tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cur.fetchall()
    
    num_tables = len(tables)
    table_names = [table[0] for table in tables]
    
    # Close the connection
    conn.close()
    
    return jsonify({"num_tables": num_tables, "table_names": table_names})

if __name__ == '__main__':
    app.run(debug=True)

