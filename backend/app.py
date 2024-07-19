from flask import Flask, send_from_directory, jsonify, request
import os
from flask_cors import CORS
import geopandas as gpd
import pandas as pd
import sqlite3

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

@app.route('/')
def serve_react_app():
    return "Environmental Insights backend"

@app.route('/geojson-data', methods=['POST', 'GET'])
def geojson_data():
    # Extract the data type from the query parameters
    data_type = request.args.get('dataType', default='nox', type=str)

    print("Air Pollutant Requested: " + data_type)

    # Read the GeoPackage file for the grids layer
    grids = gpd.read_file('data/database.gpkg', layer="grids")

    # Reproject to EPSG:4326 (WGS 84)
    grids = grids.to_crs(epsg=4326)

    # Create a connection to the GeoPackage using sqlite3
    conn = sqlite3.connect('data/database.gpkg')

    # Define the columns to read based on the selected data type
    if data_type == 'nox':
        columns = ['"Grid ID"', '"nox prediction mean"']
    elif data_type == 'no2':
        columns = ['"Grid ID"', '"no2 prediction mean"']
    elif data_type == 'no':
        columns = ['"Grid ID"', '"no prediction mean"']
    elif data_type == 'o3':
        columns = ['"Grid ID"', '"o3 prediction mean"']
    elif data_type == 'pm10':
        columns = ['"Grid ID"', '"pm10 prediction mean"']
    elif data_type == 'pm2.5':
        columns = ['"Grid ID"', '"pm2.5 prediction mean"']
    elif data_type == 'so2':
        columns = ['"Grid ID"', '"so2 prediction mean"']
    else:
        return jsonify({"error": "Invalid data type"}), 400

    # Create the SQL query to select only the required columns
    sql_query = 'SELECT * FROM air_pollution_concentrations'


    # Read the required columns using pandas
    air_pollution_concentrations = pd.read_sql_query(sql_query, conn)

    # Close the connection
    conn.close()

    # Merge or join the grids with the selected columns of air_pollution_concentrations
    # Assuming a common column 'Grid ID' exists in both GeoDataFrames
    merged_data = grids.merge(air_pollution_concentrations, left_on='Grid ID', right_on='Grid ID')

    # Reproject to EPSG:4326 (WGS 84)
    merged_data = merged_data.to_crs(epsg=4326)

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

if __name__ == '__main__':
    app.run(debug=True)
