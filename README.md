# Environmental Insights Interactive

Environmental Insights Interactive is a web application designed to provide detailed environmental insights through interactive data visualization and analysis tools. This project includes both backend and frontend components, developed using Python and React, respectively.

This is a demonstration of the python package [Environmental Insights](https://pypi.org/project/environmental-insights/). 

The online frontend can be found [here](https://berrli.github.io/Environmental-Insights-Interactive/), and the backend [here](https://liberrisford.pythonanywhere.com).

## Project Structure

- **Backend** (`backend/`): Contains the server-side code, including the API, database management, and PDF generation tools.
- **Frontend** (`frontend/`): Contains the client-side code, built with React, which interacts with the backend to display data and insights to the user.

## Setup Instructions

### Backend Setup

1. **Install Conda Environment:**
   ```bash
   conda env create -f backend/environment.yml
   conda activate <env_name>
   ```
3. **Run the Application:**
   ```bash
   flask run
   ```

### Frontend Setup

1. **Install Node.js Dependencies:**
   ```bash
   cd frontend/eii_react
   npm install
   ```
2. **Start the React Application:**
   ```bash
   npm start
   ```

## Usage

1. Navigate to the backend URL (e.g., `http://localhost:5000`) to access the backend interface, which can be changed on the fly in th frontend at the bottom of the web page. If the text box is green the backend can be found, red if not. 
2. Use the frontend React app to interact with the data and visualize insights.

## Contributing

Please feel free to submit issues and pull requests. Ensure that your contributions adhere to the project’s coding standards and guidelines.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
