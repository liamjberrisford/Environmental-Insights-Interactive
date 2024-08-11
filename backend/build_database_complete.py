import os
import geopandas as gpd
import pandas as pd
import sqlite3
from glob import glob
from tqdm import tqdm

def create_spatial_database(gpkg_path, feature_vector_dir, air_pollution_dir, db_path):
    # Check if the database already exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Existing database {db_path} deleted.")

    # Load the .gpkg file
    gdf = gpd.read_file(gpkg_path)

    # Connect to the database
    conn = sqlite3.connect(db_path)

    # Enable spatialite extension
    conn.enable_load_extension(True)
    conn.execute('SELECT load_extension("mod_spatialite");')

    # Create a cursor object
    cur = conn.cursor()

    # Create a table for the spatial data
    cur.execute('''
    CREATE TABLE grids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grid_id TEXT,
        geom BLOB
    );
    ''')

    # Add spatial metadata
    cur.execute('SELECT InitSpatialMetaData();')

    # Add a geometry column to the table
    cur.execute('''
    SELECT AddGeometryColumn('grids', 'geom', 3395, 'MULTIPOLYGON', 'XY');
    ''')

    conn.commit()

    # Insert the spatial data into the grids table
    for _, row in gdf.iterrows():
        geom_wkb = row['geometry'].wkb
        cur.execute('''
        INSERT INTO grids (grid_id, geom)
        VALUES (?, GeomFromWKB(?, 3395));
        ''', (row['Grid ID'], geom_wkb))

    conn.commit()

    # Function to create a table from a DataFrame
    def create_table_from_df(df, table_name):
        cols = ', '.join([f'"{col}" TEXT' if df[col].dtype == 'object' else f'"{col}" REAL' for col in df.columns])
        cur.execute(f'CREATE TABLE {table_name} ({cols});')

    # Get all CSV files in the directories
    feature_vector_files = glob(os.path.join(feature_vector_dir, '*.csv'))
    air_pollution_files = glob(os.path.join(air_pollution_dir, '*.csv'))

    # Process feature vector CSV files
    for csv_file in tqdm(feature_vector_files, desc="Processing feature vector files"):
        df = pd.read_csv(csv_file)
        filename = os.path.basename(csv_file).replace('.csv', '')
        table_name = f"feature_vector_{filename}".replace("-", "_")
        create_table_from_df(df, table_name)
        df.to_sql(table_name, conn, if_exists='append', index=False)

    # Process air pollution concentration CSV files
    for csv_file in tqdm(air_pollution_files, desc="Processing air pollution files"):
        df = pd.read_csv(csv_file)
        filename = os.path.basename(csv_file).replace('.csv', '')
        table_name = f"air_pollution_concentration_{filename}".replace("-", "_")
        create_table_from_df(df, table_name)
        df.to_sql(table_name, conn, if_exists='append', index=False)

    conn.commit()
    conn.close()
    print(f"New database {db_path} created and populated.")

# Paths to your files
gpkg_path = 'data/raw_data/uk_1km_landGrids_3395.gpkg'
feature_vector_dir = 'data/raw_data/england_typical_day_london_feature_vector_complete'
air_pollution_dir = 'data/raw_data/england_typical_day_london_air_pollution_concentrations_complete'
db_path = 'data/database_complete.db'

create_spatial_database(gpkg_path, feature_vector_dir, air_pollution_dir, db_path)
