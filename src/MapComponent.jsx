import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";

const defaultPosition = [20.5937, 78.9629]; // Centered on India

const MapComponent = () => {
    const [startLocation, setStartLocation] = useState("");
    const [destinationLocation, setDestinationLocation] = useState("");
    const [startCoords, setStartCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [distance, setDistance] = useState(null);

    // Custom marker icon
    const markerIcon = new L.Icon({
        iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-red.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });

    // Get coordinates from a location name
    const getCoordinates = async (location) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;
        try {
            const response = await axios.get(url);
            if (response.data.length === 0) {
                alert(`Location not found: ${location}`);
                return null;
            }
            return {
                lat: parseFloat(response.data[0].lat),
                lng: parseFloat(response.data[0].lon),
            };
        } catch (error) {
            console.error("Error fetching location:", error);
            return null;
        }
    };

    // Find route and calculate distance
    const findRoute = async () => {
        if (!startLocation || !destinationLocation) {
            alert("Please enter both locations.");
            return;
        }

        const startCoords = await getCoordinates(startLocation);
        const destinationCoords = await getCoordinates(destinationLocation);

        if (!startCoords || !destinationCoords) return;

        setStartCoords(startCoords);
        setDestinationCoords(destinationCoords);

        // Calculate distance (Haversine formula)
        const R = 6371;
        const dLat = (destinationCoords.lat - startCoords.lat) * (Math.PI / 180);
        const dLon = (destinationCoords.lng - startCoords.lng) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(startCoords.lat * (Math.PI / 180)) * Math.cos(destinationCoords.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = (R * c).toFixed(2); // Distance in km

        setDistance(distance);
    };

    // Switch locations
    const switchLocations = () => {
        setStartLocation(destinationLocation);
        setDestinationLocation(startLocation);
        setStartCoords(destinationCoords);
        setDestinationCoords(startCoords);
    };

    // Get current location
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setStartCoords({ lat: latitude, lng: longitude });

                    // Reverse geocode to get location name
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                    try {
                        const response = await axios.get(url);
                        setStartLocation(response.data.display_name);
                    } catch (error) {
                        console.error("Error getting location name:", error);
                    }
                },
                (error) => {
                    console.error("Error getting current location:", error);
                    alert("Unable to fetch current location.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Real-Time Location Map</h2>

            <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Enter initial location"
                style={{ margin: "5px", padding: "10px", width: "40%" }}
            />
            <button onClick={getCurrentLocation} style={{ padding: "10px 15px", margin: "5px" }}>
                📍 Use Current Location
            </button>
            <br />

            <input
                type="text"
                value={destinationLocation}
                onChange={(e) => setDestinationLocation(e.target.value)}
                placeholder="Enter destination location"
                style={{ margin: "5px", padding: "10px", width: "40%" }}
            />
            <br />

            <button onClick={switchLocations} style={{ padding: "10px 20px", margin: "5px" }}>Switch Locations</button>
            <button onClick={findRoute} style={{ padding: "10px 20px", margin: "5px" }}>Find Route</button>

            {distance && <h3>Distance: {distance} km</h3>}

            <MapContainer center={defaultPosition} zoom={5} style={{ height: "500px", width: "90%", margin: "auto" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />

                {/* Start Marker */}
                {startCoords && (
                    <Marker position={[startCoords.lat, startCoords.lng]} icon={markerIcon}>
                        <Popup>Start Location</Popup>
                    </Marker>
                )}

                {/* Destination Marker */}
                {destinationCoords && (
                    <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={markerIcon}>
                        <Popup>Destination</Popup>
                    </Marker>
                )}

                {/* Route Line */}
                {startCoords && destinationCoords && (
                    <Polyline positions={[[startCoords.lat, startCoords.lng], [destinationCoords.lat, destinationCoords.lng]]} color="blue" />
                )}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
