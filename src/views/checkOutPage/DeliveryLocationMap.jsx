import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function DeliveryLocationMap({ onLocationSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [position, setPosition] = useState([40.7128, -74.0060]); // Default: New York City
  const [locationRequested, setLocationRequested] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Initialize map once on component mount
  useEffect(() => {
    // Only initialize map once
    if (!mapInitialized && mapRef.current) {
      // Create map instance
      const mapInstance = L.map(mapRef.current).setView(position, 13);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance);
      
      // Add initial marker
      const marker = L.marker(position).addTo(mapInstance);
      
      // Store references in refs instead of state to avoid re-renders
      mapInstanceRef.current = mapInstance;
      markerRef.current = marker;
      
      // Add click handler
      mapInstance.on('click', handleMapClick);
      
      // Mark as initialized
      setMapInitialized(true);
      
      // Notify parent of initial position
      notifyPositionChange(position);
    }
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // This useEffect is intentionally only run once on mount
  // Adding all dependencies would cause the map to re-initialize on every position change
  
  // Handle map clicks
  const handleMapClick = (e) => {
    const newPosition = [e.latlng.lat, e.latlng.lng];
    setPosition(newPosition);
    updateMarkerPosition(newPosition);
    notifyPositionChange(newPosition);
  };
  
  // Update marker position
  const updateMarkerPosition = (pos) => {
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    }
  };
  
  // Notify parent component of position change
  const notifyPositionChange = (pos) => {
    if (typeof onLocationSelect === 'function') {
      onLocationSelect({
        latitude: pos[0],
        longitude: pos[1]
      });
    }
  };
  
  // Update map when position changes (e.g., from geolocation)
  useEffect(() => {
    if (mapInitialized && mapInstanceRef.current) {
      // Update marker position
      updateMarkerPosition(position);
      
      // Pan map to new position (with a slight delay to avoid DOM errors)
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(position);
        }
      }, 100);
    }
  }, [position, mapInitialized]);
  
  // Handle getting current location - only when button is clicked
  const getCurrentLocation = () => {
    setLocationRequested(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = [position.coords.latitude, position.coords.longitude];
          setPosition(newPosition);
          setLocationRequested(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          setLocationRequested(false);
          // Show a more user-friendly message
          alert('Could not access your location. Please select a location on the map.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationRequested(false);
      alert('Geolocation is not supported by your browser. Please select a location on the map.');
    }
  };
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Delivery Location</h4>
      </Card.Header>
      <Card.Body>
        <p className="mb-3">Click on the map to select your delivery location:</p>
        
        <div 
          ref={mapRef} 
          style={{ height: '400px', width: '100%' }}
        />
        
        <Form.Group className="mt-3">
          <Form.Text className="text-muted">
            Selected coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </Form.Text>
          <div className="d-flex justify-content-end mt-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={getCurrentLocation}
              disabled={locationRequested}
            >
              {locationRequested ? 'Getting Location...' : 'Use My Current Location'}
            </Button>
          </div>
        </Form.Group>
      </Card.Body>
    </Card>
  );
}

export default DeliveryLocationMap;
