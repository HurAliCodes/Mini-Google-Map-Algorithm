import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
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
  shadowSize: [41, 41],
});

fixDefaultIcon();

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// haversine helper
function haversineMeters(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export default function MapView({ theme, onToggleTheme }) {
  const [points, setPoints] = useState([]);
  const [destination, setDestination] = useState(null);
  const [path, setPath] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [awaitingStart, setAwaitingStart] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [estimates, setEstimates] = useState({ driving: null, walking: null });
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const mountedRef = useRef(false);

  const handleMapClick = (latlng) => {
    const place = { lat: latlng.lat, lng: latlng.lng, name: 'Dropped Pin' };
    if (awaitingStart) {
      setStart(place);
    } else {
      setEnd(place);
    }
  };

  // Load saved route history once
  useEffect(() => {
    try {
      const rh = JSON.parse(localStorage.getItem('routeHistory') || '[]');
      if (Array.isArray(rh) && rh.length) setRouteHistory(rh);
    } catch (e) {
      console.error('Failed to read routeHistory from localStorage', e);
    }
  }, []);

  // Save route history (skip first render)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    try {
      localStorage.setItem('routeHistory', JSON.stringify(routeHistory));
    } catch (e) {
      console.error('Failed to write routeHistory to localStorage', e);
    }
  }, [routeHistory]);

  // Apply dark/light map filter
  useEffect(() => {
    if (mapRef.current) {
      const mapContainer = mapRef.current.getContainer();
      mapContainer.style.filter =
        theme === 'dark'
          ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'
          : 'none';
    }
  }, [theme]);

  // Distance + ETA calculation
  useEffect(() => {
    if (!path || path.length < 2) {
      setDistanceMeters(0);
      setEstimates({ driving: null, walking: null });
      return;
    }
    let total = 0;
    for (let i = 1; i < path.length; i++) total += haversineMeters(path[i - 1], path[i]);
    setDistanceMeters(total);

    const drivingSpeed = 50;
    const walkingSpeed = 5;
    const fmt = (h) => {
      const mins = Math.round(h * 60);
      if (mins < 60) return `${mins} min`;
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      return `${hh} h ${mm} min`;
    };
    setEstimates({
      driving: fmt((total / 1000) / drivingSpeed),
      walking: fmt((total / 1000) / walkingSpeed),
    });
  }, [path]);

  // command state for map child to act on (no imperative ref calls from buttons)
  const [mapCommand, setMapCommand] = useState({ id: 0, action: null });

  // MapActions: rendered inside MapContainer so it can use useMap() (no parent ref needed)
  function MapActions({ command, path }) {
    const map = useMap();
    const seenRef = useRef(0);

    useEffect(() => {
      if (!command || command.id === seenRef.current) return;
      seenRef.current = command.id;
      if (!map) return;

      try {
        if (command.action === 'zoomIn') {
          map.zoomIn();
          return;
        }
        if (command.action === 'zoomOut') {
          map.zoomOut();
          return;
        }
        if (command.action === 'fit') {
          if (!path || path.length === 0) return;
          // ensure layout is recalculated first
          map.invalidateSize && map.invalidateSize();
          const bounds = L.latLngBounds(path.map((p) => [p.lat, p.lng]));
          map.fitBounds(bounds.pad ? bounds.pad(0.15) : bounds, { padding: [50, 50], maxZoom: 18, animate: true });
          return;
        }
      } catch (err) {
        console.error('MapActions command failed', err);
      }
    }, [command, map, path]);

    return null;
  }

  // handlers that simply bump mapCommand --> MapActions inside MapContainer will perform action
  const handleZoomIn = () => setMapCommand((c) => ({ id: c.id + 1, action: 'zoomIn' }));
  const handleZoomOut = () => setMapCommand((c) => ({ id: c.id + 1, action: 'zoomOut' }));
  const handleFitRoute = () => setMapCommand((c) => ({ id: c.id + 1, action: 'fit' }));

  // Map control helpers
  const getMap = () => mapRef.current;

  const fitRouteBounds = () => {
    const map = getMap();
    if (!map || !path || !path.length) {
      console.warn('fitRouteBounds: map or path not ready');
      return;
    }

    // ensure layout recalculated and run on next frame
    map.invalidateSize && map.invalidateSize();
    // small delay to let invalidateSize take effect when called after layout changes
    requestAnimationFrame(() => {
      try {
        const bounds = L.latLngBounds(path.map((p) => [p.lat, p.lng]));
        // use fitBounds with a safe maxZoom and padding
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18, animate: true });
      } catch (err) {
        console.error('fitBounds error:', err);
        const mid = path[Math.floor(path.length / 2)];
        if (mid) map.setView([mid.lat, mid.lng], Math.max(map.getZoom ? map.getZoom() : 13, 13));
      }
    });
  };

  // ---- Route logic ----

  const setStart = (place) => {
    const start = { lat: place.lat, lng: place.lng, name: place.name };
    setPoints([start, ...(destination ? [destination] : [])]);
    centerMap(place);
    setAwaitingStart(false);
  };

  const setEnd = (place) => {
    const end = { lat: place.lat, lng: place.lng, name: place.name };
    setDestination(end);
    centerMap(place);
  };

  const clearAll = () => {
    setPoints([]);
    setDestination(null);
    setPath([]);
    setDistanceMeters(0);
    setEstimates({ driving: null, walking: null });
    setAwaitingStart(false);
  };

  const beginRoutePlanning = async () => {
    if (!destination) {
      alert('Select destination first.');
      return;
    }
    if (!points[0]) {
      setAwaitingStart(true);
      return;
    }
    await fetchPath();
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const place = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My Location',
        };
        setStart(place);
      },
      (err) => alert('Unable to get current location: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchPath = async () => {
    const start = points[0];
    const end = destination || points[1];
    if (!start || !end) return alert('Select both start and destination.');

    try {
      const res = await axios.post('http://127.0.0.1:5000/shortest-path', {
        start,
        end,
      });
      if (!res.data?.path) throw new Error('Invalid path response');
      setPath(res.data.path);
      if (res.data.distance_meters) setDistanceMeters(res.data.distance_meters);

      // NOTE: do NOT auto-center when new path is found (user requested)
      // removed auto fitRouteBounds here
    } catch (err) {
      console.error('Route fetch error:', err);
      setPath(generateMockPath(start, end));
      // removed auto fitRouteBounds here
    }
  };

  const generateMockPath = (start, end) => {
    const steps = 10;
    const arr = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      arr.push({
        lat: start.lat + t * (end.lat - start.lat),
        lng: start.lng + t * (end.lng - start.lng),
      });
    }
    return arr;
  };

  const saveCurrentRoute = () => {
    if (!points[0] || !destination || !path.length)
      return alert('No route to save.');
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
      distance_meters: distanceMeters,
      ts: Date.now(),
    };
    setRouteHistory((prev) => [route, ...prev].slice(0, 100));
    alert('Route saved to history!');
  };

  const loadRouteFromHistory = (r) => {
    const s = { lat: r.startLat, lng: r.startLng, name: r.startName };
    const e = { lat: r.endLat, lng: r.endLng, name: r.endName };
    setPoints([s, e]);
    setDestination(e);
    setPath(r.path || []);
    setDistanceMeters(r.distance_meters || 0);

    // center only when loading saved route
    // use the MapActions command so we don't rely on parent ref
    setTimeout(() => handleFitRoute(), 200);
  };

  const clearRouteHistory = () => setRouteHistory([]);

  const mapStyle = {
    height: '100%',
    width: '100%',
    filter:
      theme === 'dark'
        ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'
        : 'none',
  };

  return (
    <div style={{ height: '100%', width: '100%' }} className="map-shell">
      <div className="app-header">
        <div className="brand">
          <img src={image} height="40" alt="" />
          <div className="title">Mini Maps</div>
        </div>

        <SearchBar onSetStart={setStart} onSetEnd={setEnd} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="app-body">
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Sidebar
            routeHistory={routeHistory}
            onLoadRoute={loadRouteFromHistory}
            onClearRouteHistory={clearRouteHistory}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
          />
        </aside>

        <main className="map-area">
          <div className="map-canvas" id="map-root" style={mapStyle}>
            <MapContainer
              center={[24.8607,67.0011]}
              zoom={13}
              style={{height:'100%',width:'100%'}}
              whenCreated={(map) => {
                mapRef.current = map;
                setTimeout(() => map.invalidateSize && map.invalidateSize(), 150);
              }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickHandler onMapClick={handleMapClick} />
              {points[0] && <Marker position={[points[0].lat, points[0].lng]} />}
              {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}
              {path.length > 0 && (
                <Polyline
                  positions={path.map(p => [p.lat, p.lng])}
                  color="#1a73e8"
                  weight={4}
                  opacity={0.9}
                />
              )}

              {/* MapActions must be a child of MapContainer so useMap() works */}
              <MapActions command={mapCommand} path={path} />
            </MapContainer>
          </div>

          {/* ensure controls are clickable and above map */}
          <div className="map-floating" aria-hidden>
            <button className="map-fab" title="Zoom in" onClick={handleZoomIn}>＋</button>
            <button className="map-fab" title="Zoom out" onClick={handleZoomOut}>－</button>
            <button className="map-fab" title="Center route" onClick={handleFitRoute}>◎</button>
            <button className="map-fab" title="Locate" onClick={useCurrentLocation}>⌖</button>
          </div>

          <RouteBox
            destination={destination}
            awaitingStart={awaitingStart}
            onFindRoute={beginRoutePlanning}
            onUseCurrentLocation={useCurrentLocation}
            onClear={clearAll}
            onSaveRoute={saveCurrentRoute}
            routeFound={path.length > 0}
            distanceMeters={distanceMeters}
            estimates={estimates}
            onFitRoute={handleFitRoute} // RouteBox center uses MapActions now
            pathPointsCount={path.length}
          />
        </main>
      </div>
    </div>
  );
}
