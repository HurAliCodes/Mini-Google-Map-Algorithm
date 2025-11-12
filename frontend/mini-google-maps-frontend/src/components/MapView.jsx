import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { fixDefaultIcon } from '../utils/leafletIconFix';
import axios from 'axios';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import RouteBox from './RouteBox';
import ThemeToggle from './ThemeToggle';
import image from '../assets/K.png';

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

fixDefaultIcon();

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng); }
  });
  return null;
}

export default function MapView({ theme, onToggleTheme }) {
  const [points, setPoints] = useState([]);
  const [destination, setDestination] = useState(null);
  const [path, setPath] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [awaitingStart, setAwaitingStart] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mapRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try { 
      const rh = JSON.parse(localStorage.getItem('routeHistory') || '[]'); 
      if (Array.isArray(rh)) setRouteHistory(rh); 
    } catch {}
  }, []);

  // Persist
  useEffect(() => { 
    localStorage.setItem('routeHistory', JSON.stringify(routeHistory)); 
  }, [routeHistory]);

  const centerMap = (place) => { 
    if (mapRef.current) mapRef.current.setView([place.lat, place.lng], Math.max(mapRef.current.getZoom(), 13)); 
  };

  const setStart = (place) => {
    const start = { lat: place.lat, lng: place.lng, name: place.name };
    setPoints(prev => [start, ...(destination ? [destination] : [])]);
    centerMap(place);
    setAwaitingStart(false);
  };

  const setEnd = (place) => {
    const end = { lat: place.lat, lng: place.lng, name: place.name };
    setDestination(end);
    centerMap(place);
  };

  const handleMapClick = (latlng) => {
    const place = { lat: latlng.lat, lng: latlng.lng, name: 'Dropped Pin' };
    if (awaitingStart) { 
      setStart(place); 
      setAwaitingStart(false); 
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

  const beginRoutePlanning = async () => {
    if (!destination) { 
      alert('Select destination (end) first.'); 
      return; 
    }
    if (!points[0]) { 
      setAwaitingStart(true); 
      return; 
    }
    await fetchPath();
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
      },
      err => alert('Unable to get current location: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchPath = async () => {
    const start = points[0];
    const end = destination || points[1];
    if (!start || !end) { 
      alert('Select destination, then pick a start to plan route.'); 
      return; 
    }
    try {
      const res = await axios.post('http://127.0.0.1:5000/shortest-path', { 
        start: { lat: start.lat, lng: start.lng }, 
        end: { lat: end.lat, lng: end.lng } 
      });
      if (!res.data || !Array.isArray(res.data.path)) throw new Error('Invalid response');
      setPath(res.data.path);
    } catch (err) {
      setPath(generateMockPath(start, end));
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

  const saveCurrentRoute = () => {
    if (!points[0] || !destination || path.length === 0) { 
      alert('No route to save.'); 
      return; 
    }
    const start = points[0]; 
    const end = destination;
    const route = { 
      startName: start.name || 'Start', 
      startLat: start.lat, 
      startLng: start.lng, 
      endName: end.name || 'Destination', 
      endLat: end.lat, 
      endLng: end.lng, 
      path, 
      ts: Date.now() 
    };
    setRouteHistory(prev => [route, ...prev].slice(0, 100));
    alert('Route saved to history!');
  };

  const loadRouteFromHistory = (r) => {
    const s = { lat: r.startLat, lng: r.startLng, name: r.startName };
    const e = { lat: r.endLat, lng: r.endLng, name: r.endName };
    setPoints([s, e]); 
    setDestination(e); 
    setPath(r.path || []); 
    centerMap(e);
  };

  const clearRouteHistory = () => setRouteHistory([]);

  return (
    <div style={{height:'100%',width:'100%'}} className="map-shell">
      <div className="app-header">
        <div className="brand">
          <div className="logo" aria-hidden><img src={image} height="40px" alt="" /></div>
          <div className="title">Mini Maps</div>
        </div>

        <div className="searchbar-wrapper">
          <SearchBar onSetStart={setStart} onSetEnd={setEnd} />
        </div>

        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      <div className="app-body">
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Sidebar 
            routeHistory={routeHistory} 
            onLoadRoute={loadRouteFromHistory} 
            onClearRouteHistory={clearRouteHistory}
            collapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)} 
          />
        </aside>

        <main className="map-area">
          <div className="map-canvas" id="map-root" style={{height:'100%',width:'100%'}}>
            <MapContainer 
              center={[24.8607,67.0011]} 
              zoom={13} 
              style={{height:'100%',width:'100%'}} 
              whenCreated={map => { mapRef.current = map; }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickHandler onMapClick={handleMapClick} />
              {points[0] && <Marker position={[points[0].lat, points[0].lng]} />}
              {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}
              {path.length > 0 && (
                <Polyline 
                  positions={path.map(p => [p.lat, p.lng])} 
                  color={getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#1a73e8'} 
                />
              )}
            </MapContainer>
          </div>

          <div className="map-floating" aria-hidden>
            <button 
              className="map-fab" 
              title="Zoom in" 
              onClick={() => { if (mapRef.current) mapRef.current.zoomIn(); }}
            >
              ＋
            </button>
            <button 
              className="map-fab" 
              title="Zoom out" 
              onClick={() => { if (mapRef.current) mapRef.current.zoomOut(); }}
            >
              －
            </button>
            <button 
              className="map-fab" 
              title="Locate" 
              onClick={useCurrentLocation}
            >
              ⌖
            </button>
          </div>

          <RouteBox 
            destination={destination} 
            awaitingStart={awaitingStart} 
            onFindRoute={beginRoutePlanning}
            onUseCurrentLocation={useCurrentLocation} 
            onClear={clearAll} 
            onSaveRoute={saveCurrentRoute} 
            routeFound={path.length>0} 
          />
        </main>
      </div>
    </div>
  );
}
