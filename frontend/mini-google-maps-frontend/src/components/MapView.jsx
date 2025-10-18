import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { fixDefaultIcon } from '../utils/leafletIconFix';

// apply icon fix
fixDefaultIcon();

// Helper component to capture clicks
function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

export default function MapView() {
  // state
  const [points, setPoints] = useState([]);           // clicked points (max 2)
  const [path, setPath] = useState([]);               // array of {lat, lng} from backend
  const [movingPos, setMovingPos] = useState(null);   // for animated marker
  const animRef = useRef(null);

  // limit to 2 points
  const handleMapClick = (latlng) => {
    if (points.length >= 2) return; // ignore extra clicks
    setPoints(prev => [...prev, latlng]);
  };

  // Clear everything
  const clearAll = () => {
    setPoints([]);
    setPath([]);
    setMovingPos(null);
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  };

  // Request shortest path from backend
  const fetchPath = async () => {
    if (points.length < 2) {
      alert('Click two points: start and end.');
      return;
    }

    const payload = { start: points[0], end: points[1] };
    try {
      // Replace URL with your backend endpoint
      const res = await axios.post('http://localhost:5000/shortest-path', payload, { timeout: 10000 });
      // Expect backend: { path: [ {lat:.., lng:..}, ... ] }
      if (!res.data || !Array.isArray(res.data.path)) throw new Error('Invalid response format');
      setPath(res.data.path);
    } catch (err) {
      // If backend not ready, fallback to a mock path (for frontend dev)
      console.warn('Backend request failed — using mock path. Error:', err.message);
      const mockPath = generateMockPath(points[0], points[1]);
      setPath(mockPath);
    }
  };

  // Simple mock path generator (straight interpolation of a few points)
  const generateMockPath = (start, end) => {
    const steps = 12;
    const latDiff = (end.lat - start.lat) / steps;
    const lngDiff = (end.lng - start.lng) / steps;
    const arr = [];
    for (let i = 0; i <= steps; i++) {
      arr.push({ lat: start.lat + latDiff * i, lng: start.lng + lngDiff * i });
    }
    return arr;
  };

  // Auto-fit map to path bounds when path changes
  useEffect(() => {
    if (!path || path.length === 0) return;
    // Use Leaflet to fit bounds
    const group = new L.featureGroup(path.map(p => L.marker([p.lat, p.lng])));
    try {
      const map = group.getLayers()[0]._map; // not reliable here
      // We cannot get map instance easily here; fitBounds can be done via map ref if required.
      // For now, user can zoom manually. If you want auto-fit, we can add a mapRef and call fitBounds.
    } catch (e) {
      // ignore
    }
  }, [path]);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 8, display: 'flex', gap: 8 }}>
        <button onClick={fetchPath}>Find Shortest Path</button>
        <button onClick={clearAll}>Clear</button>
        <div style={{ marginLeft: 16 }}>
          {points[0] && <span>Start: {points[0].lat.toFixed(5)}, {points[0].lng.toFixed(5)}</span>}
          {points[1] && <span style={{ marginLeft: 12 }}>End: {points[1].lat.toFixed(5)}, {points[1].lng.toFixed(5)}</span>}
        </div>
      </div>

      <MapContainer center={[24.8607, 67.0011]} zoom={13} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onMapClick={handleMapClick} />
        {/* Markers for points */}
        {points.map((p, idx) => <Marker key={`pt-${idx}`} position={[p.lat, p.lng]} />)}

        {/* Path as polyline */}
        {path.length > 0 && (
          <Polyline positions={path.map(p => [p.lat, p.lng])} />
        )}

        {/* Animated moving marker */}
        {movingPos && (
          <Marker position={[movingPos.lat, movingPos.lng]} />
        )}
      </MapContainer>
    </div>
  );
}
