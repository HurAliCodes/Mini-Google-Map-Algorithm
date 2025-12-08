import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap, CircleMarker } from 'react-leaflet';
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

const stopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
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
  const [stops, setStops] = useState([]);
  const [path, setPath] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [awaitingStart, setAwaitingStart] = useState(false);
  const [awaitingStop, setAwaitingStop] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [estimates, setEstimates] = useState({ driving: null, walking: null });
  const mapRef = useRef(null);
  const mountedRef = useRef(false);
  const [isFetching, setIsFetching] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [simIdx, setSimIdx] = useState(0);
  const [simPos, setSimPos] = useState(null);
  const simTimerRef = useRef(null);
  const [navActive, setNavActive] = useState(false);
  const watchIdRef = useRef(null);
  const DEVIATE_THRESHOLD_M = 50;

  const handleMapClick = (latlng) => {
    if (isFetching) return;
    if (navActive && !awaitingStop) return;
    const place = { lat: latlng.lat, lng: latlng.lng, name: 'Dropped Pin' };
    if (awaitingStop) {
      setStops((prev) => [...prev, place]);
      setAwaitingStop(false);
      if (navActive && destination && points[0]) {
        try { fetchPathFrom(points[0], destination); } catch (e) {}
      }
      return;
    }
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
          map.invalidateSize && map.invalidateSize();
          const bounds = L.latLngBounds(path.map((p) => [p.lat, p.lng]));
          map.fitBounds(bounds, { padding: [50, 50, 500, 50], maxZoom: 18, animate: true });
          return;
        }
        if (command.action === 'center' && command.place) {
          const currentZoom = map.getZoom();
          map.setView([command.place.lat, command.place.lng], currentZoom, { animate: true });
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
  const centerMapOn = (place) => setMapCommand((c) => ({ id: c.id + 1, action: "center", place }));


  // Map control helpers
  const getMap = () => mapRef.current;

  // No auto-recompute: user must press "Find Route"

  // Ensure geolocation watch is cleared on unmount
  useEffect(() => {
    return () => {
      try {
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      } catch (e) {}
    };
  }, []);


  // ---- Route logic ----

  const setStart = (place) => {
    if (isFetching || path.length > 0) return; // lock while route is calculating or exists
    const start = { lat: place.lat, lng: place.lng, name: place.name };
    setPoints([start, ...(destination ? [destination] : [])]);
    setAwaitingStart(false);
    centerMapOn(start)
  };
  
  const setEnd = (place) => {
    if (isFetching || path.length > 0) return; // lock while route is calculating or exists
    const end = { lat: place.lat, lng: place.lng, name: place.name };
    setDestination(end);
    centerMapOn(end)
  };

  const setIntermediateStop = (place) => {
    if (isFetching) return;
    const s = { lat: place.lat, lng: place.lng, name: place.name };
    setStops((prev) => [...prev, s]);
    setAwaitingStop(false);
    centerMapOn(s);
    if (navActive && destination && points[0]) {
      try { fetchPathFrom(points[0], destination); } catch (e) {}
    }
  };

  const clearAll = () => {
    setPoints([]);
    setDestination(null);
    setStops([]);
    setPath([]);
    setIsFetching(false);
    setDistanceMeters(0);
    setEstimates({ driving: null, walking: null });
    setAwaitingStart(false);
    setAwaitingStop(false);
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

  const beginAddStop = () => {
    if (!destination) {
      alert('Select destination first.');
      return;
    }
    setAwaitingStop(true);
  };

  const removeStop = (index) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
    if (navActive && destination && points[0]) {
      try { fetchPathFrom(points[0], destination); } catch (e) {}
    }
  };

  const clearStops = () => {
    setStops([]);
    if (navActive && destination && points[0]) {
      try { fetchPathFrom(points[0], destination); } catch (e) {}
    }
  };

  const startNavigation = () => {
    if (!destination) return alert('Select destination first.');
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setAwaitingStart(false);
    setAwaitingStop(false);
    // initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const place = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'My Location' };
        setPoints(([_, ...rest]) => [{ ...place }, ...(destination ? [destination] : [])]);
        try {
          const end = destination || (points[1] ? points[1] : null);
          if (end) fetchPathFrom(place, end);
        } catch (e) {}
      },
      (err) => console.warn('Initial position failed: ' + err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    // start watch
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const place = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'My Location' };
          setPoints(([curStart, ...rest]) => [{ ...place }, ...(destination ? [destination] : [])]);
          try {
            const p = { lat: place.lat, lng: place.lng };
            let dev = Infinity;
            if (path && path.length > 1) {
              const cosLat = Math.cos((p.lat * Math.PI) / 180);
              const toXY = (ll) => ({ x: (ll.lng * Math.PI) / 180 * cosLat, y: (ll.lat * Math.PI) / 180 });
              const P = toXY(p);
              for (let i = 1; i < path.length; i++) {
                const A = toXY(path[i - 1]);
                const B = toXY(path[i]);
                const vx = B.x - A.x;
                const vy = B.y - A.y;
                const wx = P.x - A.x;
                const wy = P.y - A.y;
                const c1 = vx * wx + vy * wy;
                const c2 = vx * vx + vy * vy;
                let t = c2 > 0 ? c1 / c2 : 0;
                if (t < 0) t = 0; else if (t > 1) t = 1;
                const nx = A.x + t * vx;
                const ny = A.y + t * vy;
                const dx = P.x - nx;
                const dy = P.y - ny;
                const dRad = Math.sqrt(dx * dx + dy * dy);
                const dMeters = 6371000 * dRad;
                if (dMeters < dev) dev = dMeters;
              }
            }
            if (!path || path.length < 2 || dev > DEVIATE_THRESHOLD_M) {
              const end = destination || (points[1] ? points[1] : null);
              if (end) fetchPathFrom(place, end);
            }
          } catch (e) {}
          centerMapOn(place);
        },
        (err) => console.error('watchPosition error:', err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
      setNavActive(true);
    } catch (e) {
      console.error('Failed to start navigation', e);
    }
  };

  const stopNavigation = () => {
    try {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    } catch (e) {
      console.warn('clearWatch failed', e);
    }
    setNavActive(false);
  };

  const toggleNavigation = () => {
    if (navActive) stopNavigation(); else startNavigation();
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
        if (!isFetching && path.length === 0) {
          setStart(place);
          centerMapOn(place);
        }
      },
      (err) => alert('Unable to get current location: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchSegment = async (a, b) => {
    try {
      const res = await axios.post('http://127.0.0.1:5000/shortest-path', { start: a, end: b });
      if (!res.data?.path || !Array.isArray(res.data.path)) throw new Error('Invalid path response');
      return { path: res.data.path, distance: res.data.distance_meters };
    } catch (err) {
      console.error('Route segment fetch error:', err);
      return { path: generateMockPath(a, b), distance: null };
    }
  };

  const fetchPath = async () => {
    const start = points[0];
    const end = destination || points[1];
    if (!start || !end) return alert('Select both start and destination.');
    await fetchPathFrom(start, end);
  };

  // (removed simulation ticking; live navigation uses geolocation watch)

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

  const fetchPathFrom = async (start, end) => {
    if (!start || !end) return;
    setIsFetching(true);
    const waypoints = [start, ...stops, end];
    let merged = [];
    let total = 0;
    let distancesKnown = true;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i];
      const b = waypoints[i + 1];
      const seg = await fetchSegment(a, b);
      const segPath = seg.path || [];
      if (i === 0) merged = [...segPath]; else merged = [...merged, ...segPath.slice(1)];
      if (seg.distance != null) {
        total += seg.distance;
      } else {
        distancesKnown = false;
      }
    }
    setPath(merged);
    if (!distancesKnown) {
      total = 0;
      for (let i = 1; i < merged.length; i++) total += haversineMeters(merged[i - 1], merged[i]);
    }
    setDistanceMeters(total);
    setIsFetching(false);
  };

  const saveCurrentRoute = () => {
    if (!points[0] || !destination || !path.length)
      return alert('No route to save.');
    const start = points[0];
    const end = destination;
    const mid = stops && stops.length ? stops[0] : null;
    const route = {
      startName: start.name || 'Start',
      startLat: start.lat,
      startLng: start.lng,
      stopName: mid ? (mid.name || 'Stop') : null,
      stopLat: mid ? mid.lat : null,
      stopLng: mid ? mid.lng : null,
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
    const mid = r.stopLat != null && r.stopLng != null ? { lat: r.stopLat, lng: r.stopLng, name: r.stopName } : null;
    const e = { lat: r.endLat, lng: r.endLng, name: r.endName };
    setPoints([s, e]);
    setDestination(e);
    setStops(mid ? [mid] : []);
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

        <SearchBar onSetStart={setStart} onSetEnd={setEnd} onSetStop={setIntermediateStop} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="app-body">
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Sidebar
            routeHistory={routeHistory}
            onLoadRoute={loadRouteFromHistory}
            onClearRouteHistory={clearRouteHistory}
            stops={stops}
            onRemoveStop={removeStop}
            onClearStops={clearStops}
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
            {points[0] && !navActive && <Marker position={[points[0].lat, points[0].lng]} />}
            {navActive && points[0] && (
              <>
                <CircleMarker center={[points[0].lat, points[0].lng]} radius={10} pathOptions={{ color: '#1a73e8', fillColor: '#1a73e8', fillOpacity: 1 }} />
                <CircleMarker center={[points[0].lat, points[0].lng]} radius={18} pathOptions={{ color: '#1a73e8', fillColor: '#1a73e8', fillOpacity: 0.15 }} />
              </>
            )}
            {stops.map((st, i) => (
              <Marker key={`stop-${i}`} position={[st.lat, st.lng]} icon={stopIcon} />
            ))}
            {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}
              {path.length > 0 && (
                <Polyline
                  positions={path.map(p => [p.lat, p.lng])}
                  color="#1a73e8"
                  weight={6}
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
            <button className="map-fab" title={navActive ? "Stop navigation" : "Start navigation"} onClick={toggleNavigation}>{navActive ? '■' : '▶'}</button>
          </div>

          {navActive && (
            <div className="map-top-left">
              <div style={{ fontWeight: 600 }}>Navigation active</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Distance: {Math.round(distanceMeters)} m</div>
              {estimates?.driving && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ETA: {estimates.driving}</div>
              )}
            </div>
          )}

          <RouteBox
            destination={destination}
            stops={stops}
            awaitingStart={awaitingStart}
            awaitingStop={awaitingStop}
            onFindRoute={beginRoutePlanning}
            onUseCurrentLocation={useCurrentLocation}
            onAddStop={beginAddStop}
            onClearStops={clearStops}
            onClear={clearAll}
            onSaveRoute={saveCurrentRoute}
            routeFound={path.length > 0}
            distanceMeters={distanceMeters}
            estimates={estimates}
            onFitRoute={handleFitRoute}
            pathPointsCount={path.length}
            navActive={navActive}
            onToggleNavigation={toggleNavigation}
          />
        </main>
      </div>
    </div>
  );
}
