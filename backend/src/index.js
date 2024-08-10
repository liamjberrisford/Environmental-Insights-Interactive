import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

var map = L.map('ukMap').setView([54.5, -4], 6); // Latitude, Longitude, Zoom Level

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

document.getElementById('predictionForm').addEventListener('submit', function (event) {
  event.preventDefault();
  // Your form submission logic here
});
