import os
import geopandas as gpd
import pandas as pd
import sqlite3

def create_spatial_database(gpkg_path, air_pollution_csv, feature_vector_csv, db_path):
    # Check if the database already exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Existing database {db_path} deleted.")

    # Load the .gpkg file
    gdf = gpd.read_file(gpkg_path)

    # Load the CSV files
    df_air_pollution = pd.read_csv(air_pollution_csv)
    df_feature_vector = pd.read_csv(feature_vector_csv)

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

    # Create tables for the CSV data based on DataFrame columns
    def create_table_from_df(df, table_name):
        cols = ', '.join([f'"{col}" TEXT' if df[col].dtype == 'object' else f'"{col}" REAL' for col in df.columns])
        cur.execute(f'CREATE TABLE {table_name} ({cols});')
    
    create_table_from_df(df_air_pollution, 'air_pollution')
    create_table_from_df(df_feature_vector, 'feature_vector')

    conn.commit()

    # Insert the CSV data into the respective tables
    df_air_pollution.to_sql('air_pollution', conn, if_exists='append', index=False)
    df_feature_vector.to_sql('feature_vector', conn, if_exists='append', index=False)

    conn.commit()
    conn.close()
    print(f"New database {db_path} created and populated.")

# Paths to your files
gpkg_path = 'data/raw_data/uk_1km_landGrids_3395.gpkg'
air_pollution_csv = 'data/raw_data/Month_1-Day_Friday-Hour_9_Air_Pollution_Concentrations.csv'
feature_vector_csv = 'data/raw_data/Month_1-Day_Friday-Hour_9_Feature_Vector.csv'
db_path = 'data/spatial_database.db'

create_spatial_database(gpkg_path, air_pollution_csv, feature_vector_csv, db_path)
