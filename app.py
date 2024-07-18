from flask import Flask, render_template, jsonify
import geopandas as gpd
import matplotlib.pyplot as plt

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/geojson-data')
def geojson_data():
    # Read the GeoPackage file
    gdf = gpd.read_file('data/database.gpkg', layer="grids")

    # Reproject to EPSG:3857 (Web Mercator)
    gdf = gdf.to_crs(epsg=4326)

    # Convert the GeoDataFrame to GeoJSON
    geojson_data = gdf.to_json()
    return geojson_data

if __name__ == '__main__':
    app.run(debug=True)
