from flask import Flask, jsonify, request
import os
from flask_cors import CORS
import geopandas as gpd
import pandas as pd
import sqlite3

import sys
import os

# Add the directory containing the module to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../environmental_insights')))

# Import the module
import air_pollution_functions as ei_air_pollution_functions


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


@app.route('/predict', methods=['POST'])
def predict():
    location = "London"
    date = "Today"
    # Implement your prediction logic here
    prediction_result = f"Prediction result for location: {location} and date: {date}"
    return jsonify({"result": prediction_result})

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

