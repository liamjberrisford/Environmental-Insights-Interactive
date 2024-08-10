import matplotlib
matplotlib.use('Agg')  # Use the 'Agg' backend for non-GUI rendering

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
import matplotlib.pyplot as plt
import geopandas as gpd
import pandas as pd
import sqlite3
import numpy as np

def get_dummy_data():
    # Default values for testing
    selected_air_pollution = 'pm2.5'
    selected_feature_vector = 'Bicycle Score'
    selected_month = '5'  # May
    selected_day = 'Tuesday'
    selected_hour = '14:00'
    changes = {
        'Bicycle Score': 10,
        'Car and Taxi Score': -5,
        'Bus and Coach Score': 3,
        'HGV Score': 0,
        'LGV Score': 0
    }
    slider_value = 15

    dummy_data = {
        'selectedAirPollution': selected_air_pollution,
        'selectedFeatureVector': selected_feature_vector,
        'selectedMonth': selected_month,
        'selectedDay': selected_day,
        'selectedHour': selected_hour,
        'changes': changes,
        'sliderValue': slider_value
    }

    return dummy_data

def process_data(data):
    # Simulated processing logic
    report = {
        "summary": "This is a sample report generated from dummy data",
        "details": {
            "selectedAirPollution": data['selectedAirPollution'],
            "selectedMonth": data['selectedMonth'],
            "selectedDay": data['selectedDay'],
            "selectedHour": data['selectedHour'],
            "changes": data['changes'],
            "sliderValue": data['sliderValue'],
            "modelType": "All feature vector",
            "comparisonMaps": ["feature_vector_map.png", "air_pollution_map.png"],
            "histogramChanges": list(data["changes"].values())
        }
    }

    # Generate plots and maps
    generate_feature_vector_map(data)
    least_polluted, most_polluted = generate_air_pollution_map(data)
    generate_histogram(data['changes'])

    # Add pollution analysis to the report
    report["details"]["pollutionAnalysis"] = {
        "leastPollutedArea": f"{least_polluted['location']} (Lat: {least_polluted['lat']}, Long: {least_polluted['long']})",
        "mostPollutedArea": f"{most_polluted['location']} (Lat: {most_polluted['lat']}, Long: {most_polluted['long']})",
        "averagePollutionLevel": "Moderate"
    }

    return report

def generate_feature_vector_map(data):
    # Connect to the database and query the data
    conn = sqlite3.connect('data/database.db')
    feature_column = data['selectedFeatureVector']
    month = data['selectedMonth']
    day = data['selectedDay']
    hour = int(data['selectedHour'].split(':')[0])
    
    query = f'''
        SELECT "Grid ID", "{feature_column}"
        FROM feature_vector_Month_{month}_Day_{day}_Hour_{hour}
    '''
    feature_data = pd.read_sql(query, conn)
    conn.close()

    # Read the GeoPackage file for the grids layer
    grids = gpd.read_file('data/raw_data/uk_1km_landGrids_3395_london.gpkg')
    grids = grids.to_crs(epsg=4326)

    # Merge the feature data with the grids
    merged_data = grids.merge(feature_data, on='Grid ID')
    merged_data = merged_data.to_crs(epsg=4326)
    merged_data['geometry'] = merged_data['geometry'].simplify(0.001, preserve_topology=True)

    # Plot the feature vector map
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    merged_data.plot(column=feature_column, ax=ax, legend=True, cmap='OrRd')
    plt.title("Feature Vector Map")
    plt.savefig("feature_vector_map.png")
    plt.close()

def generate_air_pollution_map(data):
    # Connect to the database and query the data
    conn = sqlite3.connect('data/database.db')
    pollution_column = f"{data['selectedAirPollution']} Prediction 0.5"
    month = data['selectedMonth']
    day = data['selectedDay']
    hour = int(data['selectedHour'].split(':')[0])
    
    query = f'''
        SELECT "Grid ID", "{pollution_column}"
        FROM air_pollution_concentration_Month_{month}_Day_{day}_Hour_{hour}
    '''
    pollution_data = pd.read_sql(query, conn)
    conn.close()

    # Read the GeoPackage file for the grids layer
    grids = gpd.read_file('data/raw_data/uk_1km_landGrids_3395_london.gpkg')
    grids = grids.to_crs(epsg=4326)

    # Merge the pollution data with the grids
    merged_data = grids.merge(pollution_data, on='Grid ID')
    merged_data = merged_data.to_crs(epsg=4326)
    merged_data['geometry'] = merged_data['geometry'].simplify(0.001, preserve_topology=True)

    # Find the least and most polluted areas
    least_polluted_idx = merged_data[pollution_column].idxmin()
    most_polluted_idx = merged_data[pollution_column].idxmax()

    least_polluted = {
        'location': merged_data.loc[least_polluted_idx, 'Grid ID'],
        'lat': merged_data.loc[least_polluted_idx, 'geometry'].centroid.y,
        'long': merged_data.loc[least_polluted_idx, 'geometry'].centroid.x
    }

    most_polluted = {
        'location': merged_data.loc[most_polluted_idx, 'Grid ID'],
        'lat': merged_data.loc[most_polluted_idx, 'geometry'].centroid.y,
        'long': merged_data.loc[most_polluted_idx, 'geometry'].centroid.x
    }

    # Plot the air pollution map
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    merged_data.plot(column=pollution_column, ax=ax, legend=True, cmap='Blues')
    plt.title("Air Pollution Map")
    plt.savefig("air_pollution_map.png")
    plt.close()

    return least_polluted, most_polluted

def generate_histogram(changes):
    # Generate a histogram
    features = list(changes.keys())
    values = list(changes.values())
    
    plt.figure(figsize=(10, 6))
    plt.bar(features, values, color='skyblue')
    plt.xlabel('Feature')
    plt.ylabel('Change (%)')
    plt.title('Histogram of Changes')
    plt.xticks(rotation=45, ha='right')
    plt.savefig('histogram.png')
    plt.close()

def generate_pdf_report(report, filename):
    doc = SimpleDocTemplate(filename, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Title
    title = Paragraph("Environmental Insights Interactive Report Second Version Live Update", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))

    # Context for the Model
    context_text = """
    Machine learning plays a crucial role in estimating air pollution concentrations by providing a scalable method to analyze vast amounts of environmental data. This approach helps in generating timely and accurate pollution estimates, enabling proactive measures to mitigate pollution impacts. However, the limitations of machine learning models, such as data quality, spatial and temporal resolution, and model transferability, must be acknowledged. Despite these challenges, machine learning remains a powerful tool to supplement traditional monitoring methods and improve our understanding of air pollution dynamics.
    """
    elements.append(Paragraph(context_text, styles['BodyText']))
    elements.append(Spacer(1, 12))

    # Details Table
    details = report['details']
    details_data = [
        ["Selected Air Pollution", details['selectedAirPollution']],
        ["Selected Month", details['selectedMonth']],
        ["Selected Day", details['selectedDay']],
        ["Selected Hour", details['selectedHour']],
        ["Model Type", details['modelType']],
        ["Slider Value", f"{details['sliderValue']}%"]
    ]
    
    details_table = Table(details_data, colWidths=[200, 200])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(details_table)
    elements.append(Spacer(1, 12))

    # Feature Vectors
    feature_vectors_title = Paragraph("Feature Vectors and Changes:", styles['Heading2'])
    elements.append(feature_vectors_title)
    elements.append(Spacer(1, 12))

    feature_vector_data = [["Feature Vector", "Change (%)"]]
    for feature, change in details['changes'].items():
        feature_vector_data.append([feature, change])

    feature_vector_table = Table(feature_vector_data, colWidths=[200, 200])
    feature_vector_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(feature_vector_table)
    elements.append(Spacer(1, 12))

    # Comparison Maps
    comparison_maps_title = Paragraph("Comparison Maps:", styles['Heading2'])
    elements.append(comparison_maps_title)
    elements.append(Spacer(1, 12))
    
    for map_img in details['comparisonMaps']:
        elements.append(Image(map_img, width=400, height=300))
        elements.append(Spacer(1, 12))

    # Histogram of Changes
    histogram_title = Paragraph("Histogram of Changes:", styles['Heading2'])
    elements.append(histogram_title)
    elements.append(Spacer(1, 12))
    elements.append(Image('histogram.png', width=400, height=300))
    elements.append(Spacer(1, 12))

    # Pollution Analysis
    pollution_analysis_title = Paragraph("Pollution Analysis:", styles['Heading2'])
    elements.append(pollution_analysis_title)
    elements.append(Spacer(1, 12))
    
    pollution_analysis_data = [
        ["Least Polluted Area", details['pollutionAnalysis']['leastPollutedArea']],
        ["Most Polluted Area", details['pollutionAnalysis']['mostPollutedArea']],
        ["Average Pollution Level", details['pollutionAnalysis']['averagePollutionLevel']]
    ]
    
    pollution_analysis_table = Table(pollution_analysis_data, colWidths=[200, 200])
    pollution_analysis_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))

    elements.append(pollution_analysis_table)
    elements.append(Spacer(1, 12))

    doc.build(elements)

if __name__ == '__main__':
    # Get the dummy data
    data = get_dummy_data()
    
    # Process the data and generate the report
    report = process_data(data)
    
    # Generate the PDF report
    pdf_filename = "pdf_report.pdf"
    generate_pdf_report(report, pdf_filename)
    
    print(f"Generated PDF report: {pdf_filename}")
