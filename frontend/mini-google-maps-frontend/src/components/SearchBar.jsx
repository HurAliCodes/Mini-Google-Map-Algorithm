import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function SearchBar({ onSetStart, onSetEnd, onSavePlace }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
        const res = await axios.get(url, {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'en',
          }
        });
        setResults(res.data || []);
      } catch (e) {
        if (e.name !== 'CanceledError') setError('Search failed');
      } finally {
        setLoading(false);
      }
    };

    const id = setTimeout(fetch, 400);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  const normalized = useMemo(() => {
    return (results || []).map(r => ({
      id: r.place_id,
      name: r.display_name || r.name || 'Unknown',
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  }, [results]);

  return (
    <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1100, width: 'min(90vw, 640px)' }}>
      <div style={{ display: 'flex', gap: 8, background: 'var(--card-bg)', padding: 8, borderRadius: 8, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places"
          style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--card-bg)', color: 'var(--text)' }}
        />
        {loading && <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--muted)' }}>Searching...</span>}
      </div>

      {error && (
        <div style={{ marginTop: 6, background: '#ffecec', color: '#c00', padding: 8, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {normalized.length > 0 && (
        <div style={{ marginTop: 6, background: 'var(--card-bg)', borderRadius: 8, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden', maxHeight: '40vh', overflowY: 'auto' }}>
          {normalized.map(place => (
            <div key={place.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{place.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{place.lat.toFixed(5)}, {place.lng.toFixed(5)}</div>
              </div>
              <button className="button" onClick={() => onSetStart && onSetStart(place)}>Start</button>
              <button className="button" onClick={() => onSetEnd && onSetEnd(place)}>End</button>
              <button className="button" onClick={() => onSavePlace && onSavePlace(place)}>Save</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}