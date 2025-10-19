import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { fixDefaultIcon } from '../utils/leafletIconFix';
import axios from 'axios';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import RouteBox from './RouteBox';

fixDefaultIcon();

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

export default function MapView() {
  const [points, setPoints] = useState([]);              // [start, end]
  const [destination, setDestination] = useState(null);  // end only
  const [path, setPath] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);  // [{startName, startLat, startLng, endName, endLat, endLng, ts}]
  const [awaitingStart, setAwaitingStart] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mapRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('savedPlaces') || '[]');
      const rh = JSON.parse(localStorage.getItem('routeHistory') || '[]');
      if (Array.isArray(s)) setSavedPlaces(s);
      if (Array.isArray(rh)) setRouteHistory(rh);
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem('savedPlaces', JSON.stringify(savedPlaces));
  }, [savedPlaces]);
  useEffect(() => {
    localStorage.setItem('routeHistory', JSON.stringify(routeHistory));
  }, [routeHistory]);

  const centerMap = (place) => {
    if (mapRef.current) {
      mapRef.current.setView([place.lat, place.lng], Math.max(mapRef.current.getZoom(), 13));
    }
  };

  const setStart = (place) => {
    const start = { lat: place.lat, lng: place.lng, name: place.name };
    setPoints(prev => [start, ...(destination ? [destination] : [])]);
    centerMap(place);
  };

  const setEnd = (place) => {
    const end = { lat: place.lat, lng: place.lng, name: place.name };
    setDestination(end);
    centerMap(place);
  };

  const savePlace = (place) => {
    const key = `${place.lat.toFixed(5)},${place.lng.toFixed(5)}`;
    setSavedPlaces(prev => {
      const exists = prev.some(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}` === key);
      if (exists) return prev;
      return [...prev, { name: place.name || 'Saved Place', lat: place.lat, lng: place.lng }];
    });
  };

  const removeSaved = (place) => {
    setSavedPlaces(prev => prev.filter(p => !(p.lat === place.lat && p.lng === place.lng)));
  };

  const clearSaved = () => setSavedPlaces([]);
  const clearRouteHistory = () => setRouteHistory([]);

  const handleMapClick = (latlng) => {
    const place = { lat: latlng.lat, lng: latlng.lng, name: 'Dropped Pin' };
    if (awaitingStart) {
      setStart(place);
      setAwaitingStart(false);
      fetchPath();
    } else {
      setEnd(place);
    }
  };

  const clearAll = () => {
    setPoints([]);
    setDestination(null);
    setPath([]);
    setAwaitingStart(false);
  };

  const beginRoutePlanning = () => {
    if (!destination) {
      alert('Select destination (end) first.');
      return;
    }
    if (!points[0]) {
      setAwaitingStart(true);
    } else {
      fetchPath();
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const place = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'My Location' };
        setStart(place);
        if (awaitingStart) {
          setAwaitingStart(false);
        }
        fetchPath();
      },
      err => alert('Unable to get current location: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addRouteToHistory = (start, end) => {
    setRouteHistory(prev => [
      { startName: start.name || 'Start', startLat: start.lat, startLng: start.lng, endName: end.name || 'Destination', endLat: end.lat, endLng: end.lng, ts: Date.now() },
      ...prev
    ].slice(0, 100));
  };

  const fetchPath = async () => {
    const start = points[0];
    const end = destination || points[1];
    if (!start || !end) {
      alert('Select destination, then pick a start to plan route.');
      return;
    }
    // keep points aligned
    setPoints([start, end]);

    try {
      const res = await axios.post('http://127.0.0.1:5000/shortest-path', {
        start: { lat: start.lat, lng: start.lng },
        end: { lat: end.lat, lng: end.lng }
      });
      if (!res.data || !Array.isArray(res.data.path)) throw new Error('Invalid response format');
      setPath(res.data.path);
      addRouteToHistory(start, end);
    } catch (err) {
      console.warn('Backend request failed. Using fallback mock path.', err.message);
      const mockPath = generateMockPath(start, end);
      setPath(mockPath);
      addRouteToHistory(start, end);
    }
  };

  const generateMockPath = (start, end) => {
    const steps = 12;
    const arr = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      arr.push({
        lat: start.lat + t * (end.lat - start.lat),
        lng: start.lng + t * (end.lng - start.lng)
      });
    }
    return arr;
  };

  const loadRouteFromHistory = (r) => {
    const s = { lat: r.startLat, lng: r.startLng, name: r.startName };
    const e = { lat: r.endLat, lng: r.endLng, name: r.endName };
    setPoints([s, e]);
    setDestination(e);
    centerMap(e);
    setPath([]);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Sidebar */}
      <Sidebar
        savedPlaces={savedPlaces}
        routeHistory={routeHistory}
        onSetStart={setStart}
        onSetEnd={setEnd}
        onCenter={(p) => centerMap(p)}
        onClearSaved={clearSaved}
        onClearRouteHistory={clearRouteHistory}
        onRemoveSaved={removeSaved}
        onLoadRoute={loadRouteFromHistory}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      {/* Search Bar */}
      <SearchBar
        onSetStart={setStart}
        onSetEnd={setEnd}       // sets destination
        onSavePlace={savePlace}
      />

      {/* Route Box */}
      <RouteBox
        destination={destination}
        awaitingStart={awaitingStart}
        onFindRoute={beginRoutePlanning}
        onUseCurrentLocation={useCurrentLocation}
        onClear={clearAll}
      />

      {/* Map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapContainer
          center={[24.8607, 67.0011]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => { mapRef.current = map; }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapClick={handleMapClick} />

          {points[0] && <Marker position={[points[0].lat, points[0].lng]} />}
          {destination && <Marker position={[destination.lat, destination.lng]} />}

          {path.length > 0 && (
            <Polyline positions={path.map(p => [p.lat, p.lng])} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}