from flask import Flask, send_from_directory, jsonify, request
import os
from flask_cors import CORS
import geopandas as gpd

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/geojson-data', methods=['POST', 'GET'])
def geojson_data():
    # Read the GeoPackage file
    gdf = gpd.read_file('data/database.gpkg', layer="grids")

    # Reproject to EPSG:3857 (Web Mercator)
    gdf = gdf.to_crs(epsg=4326)

    # Convert the GeoDataFrame to GeoJSON
    geojson_data = gdf.to_json()
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
