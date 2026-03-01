import React, { useEffect, useRef, useState } from 'react';
import './Map.css';

const Map = ({
  center,
  zoom = 12,
  markers = [],
  showRoute = false,
  origin,
  destination,
  onLoad,
  height = '100%'
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [markerRefs, setMarkerRefs] = useState([]);
  
  useEffect(() => {
    if (!window.google) {
      console.error('Google Maps API not loaded');
      return;
    }
    
    // Initialize map
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: center || { lat: 9.0245, lng: 38.7468 }, // Default to Addis Ababa
      zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true
    });
    
    setMap(mapInstance);
    
    // Initialize directions service
    setDirectionsService(new window.google.maps.DirectionsService());
    setDirectionsRenderer(new window.google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#2196F3',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    }));
    
    if (onLoad) {
      onLoad(mapInstance);
    }
    
    return () => {
      // Cleanup markers
      markerRefs.forEach(marker => marker.setMap(null));
    };
  }, []);
  
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    markerRefs.forEach(marker => marker.setMap(null));
    
    // Add new markers
    const newMarkers = markers.map((markerData, index) => {
      const markerIcon = getMarkerIcon(markerData.icon || 'default');
      
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        icon: markerIcon,
        animation: window.google.maps.Animation.DROP
      });
      
      if (markerData.info) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: markerData.info
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }
      
      return marker;
    });
    
    setMarkerRefs(newMarkers);
    
    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);
    }
  }, [map, markers]);
  
  useEffect(() => {
    if (!map || !showRoute || !origin || !destination || !directionsService || !directionsRenderer) return;
    
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [map, showRoute, origin, destination, directionsService, directionsRenderer]);
  
  const getMarkerIcon = (type) => {
    const icons = {
      pickup: {
        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      delivery: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      driver: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      default: {
        url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      }
    };
    
    return icons[type] || icons.default;
  };
  
  return (
    <div 
      ref={mapRef} 
      className="google-map"
      style={{ height, width: '100%' }}
    />
  );
};

export default Map;