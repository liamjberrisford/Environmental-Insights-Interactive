import geopandas as gpd
import pandas as pd
import sqlite3
import pickle
import lightgbm as lgb
import generate_pdf

from flask import Flask, jsonify, request, send_file
import os
from flask_cors import CORS
import logging

from environmental_insights import air_pollution_functions as ei_air_pollution_functions
from environmental_insights import models as ei_models

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Define the base directory of the application
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# File paths
GPKG_FILE = os.path.join(BASE_DIR, 'data', 'raw_data', 'uk_1km_landGrids_3395_london.gpkg')
DATABASE_FILE = os.path.join(BASE_DIR, 'data', 'database.db')

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

@app.route('/')
def serve_react_app():
    return "Environmental Insights backend"

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "Server is running"}), 200

@app.route('/air-pollution-concentrations', methods=['POST', 'GET'])
def geojson_data():
    # Extract parameters from the query
    data_type = request.args.get('dataType', default='nox', type=str)
    month = request.args.get('month', default='1', type=str)
    day_of_week = request.args.get('day', default='Friday', type=str)
    hour = int(request.args.get('hour', default='8', type=str).split(':')[0])

    print(f"Air Pollutant Requested: {data_type}")
    print(f"Month: {month}, Day: {day_of_week}, Hour: {hour}")

    # Read the GeoPackage file
    grids = gpd.read_file(GPKG_FILE)

    # Reproject to EPSG:4326 (WGS 84)
    grids = grids.to_crs(epsg=4326)

    # Create a connection to the database
    conn = sqlite3.connect(DATABASE_FILE)

    # Construct table name and SQL query
    table_name = f"air_pollution_concentration_Month_{month}_Day_{day_of_week}_Hour_{hour}"
    pollutant_column = f'"{data_type} Prediction 0.5"'
    sql_query = f'SELECT "Grid ID", {pollutant_column} FROM {table_name}'

    try:
        air_pollution_concentrations = pd.read_sql_query(sql_query, conn)
        print("Air Pollution Concentrations")
        print(air_pollution_concentrations)
    except Exception as e:
        print(f"Error reading table {table_name}: {e}")
        conn.close()
        return jsonify({"error": f"Could not find table {table_name} in the database."}), 400

    # Close the connection
    conn.close()

    # Merge the data
    merged_data = grids.merge(air_pollution_concentrations, left_on='Grid ID', right_on='Grid ID')

    # Simplify geometry
    merged_data['geometry'] = merged_data['geometry'].simplify(0.001, preserve_topology=True)

    ei_air_pollution_functions.air_pollution_concentrations_to_UK_daily_air_quality_index(
        merged_data, data_type, data_type + " Prediction 0.5"
    )

    print(merged_data[data_type + " Prediction 0.5"].describe())

    # Convert to GeoJSON
    geojson_data = merged_data.to_json()

    return geojson_data

@app.route('/feature-vector', methods=['POST', 'GET'])
def feature_vector_data():
    # Extract parameters from the query
    data_type = request.args.get('dataType', default='Bicycle Score', type=str)
    month = request.args.get('month', default='1', type=str)
    day_of_week = request.args.get('day', default='Friday', type=str)
    hour = int(request.args.get('hour', default='8', type=str).split(':')[0])

    print(f"Feature Vector Requested: {data_type}")
    print(f"Month: {month}, Day: {day_of_week}, Hour: {hour}")

    # Read the GeoPackage file
    grids = gpd.read_file(GPKG_FILE)

    # Reproject to EPSG:4326 (WGS 84)
    grids = grids.to_crs(epsg=4326)

    # Create a connection to the database
    conn = sqlite3.connect(DATABASE_FILE)

    # Construct table name and SQL query
    table_name = f"feature_vector_Month_{month}_Day_{day_of_week}_Hour_{hour}"
    feature_column = f'"{data_type}"'
    sql_query = f'SELECT "Grid ID", {feature_column} FROM {table_name}'

    try:
        feature_vector_data = pd.read_sql_query(sql_query, conn)
    except Exception as e:
        print(f"Error reading table {table_name}: {e}")
        conn.close()
        return jsonify({"error": f"Could not find table {table_name} in the database."}), 400

    # Close the connection
    conn.close()

    # Merge the data
    merged_data = grids.merge(feature_vector_data, left_on='Grid ID', right_on='Grid ID')

    # Simplify geometry
    merged_data['geometry'] = merged_data['geometry'].simplify(0.001, preserve_topology=True)

    print(merged_data.columns)

    # Convert to GeoJSON
    geojson_data = merged_data.to_json()

    return geojson_data

@app.route('/predict', methods=['GET'])
def predict():
    # Extract parameters from the query
    air_pollutant = request.args.get('air_pollutant', default='no2', type=str)
    month = request.args.get('month', default='1', type=str)
    day_of_week = request.args.get('day', default='Friday', type=str)
    hour = int(request.args.get('hour', default='8', type=str).split(':')[0])
    changes_str = request.args.get('changes', default='', type=str)
    changes = {item.split(':')[0]: float(item.split(':')[1]) for item in changes_str.split(',') if ':' in item}

    print(f"Modified Predicted Air Pollutant Requested: {air_pollutant}")
    print(f"Month: {month}, Day: {day_of_week}, Hour: {hour}")
    print(f"Feature Vector Changes: {changes}")

    # Read the GeoPackage file
    grids = gpd.read_file(GPKG_FILE)
    grids = grids.to_crs(epsg=4326)

    # Create a connection to the database
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        table_name = f"feature_vector_Month_{month}_Day_{day_of_week}_Hour_{hour}"
        sql_query = f'SELECT * FROM {table_name}'
        observation_data = pd.read_sql_query(sql_query, conn)
    except Exception as e:
        print(f"Error reading table {table_name}: {e}")
        return jsonify({"error": f"Could not find table {table_name} in the database."}), 400
    finally:
        if conn:
            conn.close()

    print(observation_data)

    # Apply changes to observation_data
    for feature, change in changes.items():
        if feature in observation_data.columns:
            observation_data[feature] = observation_data[feature] * (1 + change / 100)

    # Load the model
    model_type, model_dataset = "0.5", "All"
    model_filepath = os.path.join(BASE_DIR, "models", "uk", f"dataset_{model_dataset}_quantile_regression_{model_type}_air_pollutant_{air_pollutant}.txt")
    print(model_filepath)
    model = lgb.Booster(model_file=model_filepath)

    # Rename columns for consistency with the model
    observation_data = observation_data.rename(columns={"Grid ID": "UK Model Grid ID"})

    print(model)
    print(observation_data)
    print(featureVectorColumnNames)

    # Make predictions
    updated_predictions = ei_models.make_concentration_predicitions_united_kingdom(
        model, observation_data, featureVectorColumnNames
    )

    # Rename columns back for merging
    updated_predictions = updated_predictions.rename(columns={"UK Model Grid ID": "Grid ID"})
    updated_predictions = updated_predictions.rename(columns={"Model Predicition": air_pollutant + " Prediction 0.5"})

    # Merge with the grids data
    merged_data = grids.merge(updated_predictions, left_on='Grid ID', right_on='Grid ID')

    # Simplify geometries for performance
    merged_data['geometry'] = merged_data['geometry'].simplify(0.001, preserve_topology=True)

    ei_air_pollution_functions.air_pollution_concentrations_to_UK_daily_air_quality_index(
        merged_data, air_pollutant, air_pollutant + " Prediction 0.5"
    )

    print(merged_data[air_pollutant + " Prediction 0.5"].describe())

    # Convert to GeoJSON
    updated_geojson = merged_data.to_json()

    return jsonify({"updated_geojson": updated_geojson})

@app.route('/generate-report', methods=['POST'])
def generate_report():
    try:
        # Extract the data from the request
        data = request.get_json()

        selected_air_pollution = data.get('selectedAirPollution')
        selected_feature_vector = data.get('selectedFeatureVector')
        selected_month = data.get('selectedMonth')
        selected_day = data.get('selectedDay')
        selected_hour = data.get('selectedHour')
        changes = data.get('changes')
        slider_value = data.get('sliderValue')

        # Log the received data
        app.logger.info(f"Selected Air Pollution: {selected_air_pollution}")
        app.logger.info(f"Selected Feature Vector: {selected_feature_vector}")
        app.logger.info(f"Selected Month: {selected_month}")
        app.logger.info(f"Selected Day: {selected_day}")
        app.logger.info(f"Selected Hour: {selected_hour}")
        app.logger.info(f"Changes: {changes}")
        app.logger.info(f"Slider Value: {slider_value}")

        # Create a data dictionary for processing
        report_data = {
            'selectedAirPollution': selected_air_pollution,
            'selectedFeatureVector': selected_feature_vector,
            'selectedMonth': selected_month,
            'selectedDay': selected_day,
            'selectedHour': selected_hour,
            'changes': changes,
            'sliderValue': slider_value
        }

        # Process the data and generate the report
        report = generate_pdf.process_data(report_data)

        # Generate the PDF report
        pdf_filename = os.path.join(BASE_DIR, "pdf_report.pdf")
        generate_pdf.generate_pdf_report(report, pdf_filename)

        # Check if the PDF file is generated correctly
        if not os.path.exists(pdf_filename):
            raise FileNotFoundError(f"PDF file {pdf_filename} not found.")

        # Return the PDF file
        return send_file(pdf_filename, as_attachment=True)
    except Exception as e:
        app.logger.error(f"Error generating report: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/num-tables', methods=['GET'])
def num_tables():
    # Create a connection to the database
    conn = sqlite3.connect(DATABASE_FILE)
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
    app.run(port=3000)
