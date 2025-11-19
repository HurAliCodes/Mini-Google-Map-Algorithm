import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function SearchBar({ onSetStart, onSetEnd, className }) {
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
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6`;
        const res = await axios.get(url, { signal: controller.signal, headers: { 'Accept-Language': 'en' } });
        setResults(res.data || []);
      } catch (e) {
        if (e.name !== 'CanceledError') setError('Search failed');
      } finally {
        setLoading(false);
      }
    };

    const id = setTimeout(fetch, 360);
    return () => { clearTimeout(id); controller.abort(); };
  }, [query]);

  const normalized = useMemo(() => (results || []).map(r => ({
    id: r.place_id,
    name: r.display_name || r.name || 'Unknown',
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  })), [results]);

  return (
    <div className={className ? className + ' searchbar-wrapper' : 'searchbar-wrapper'}>
      <div className="searchbar" role="search" aria-label="Search places">
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places, addresses or coordinates"
        />
        <div className="search-actions">
          {loading ? <div style={{fontSize:13}}>Searching...</div> : null}
          <button className="search-btn" onClick={() => { /* optional quick search action */ }}>Search</button>
        </div>
      </div>

      {error && (
        <div style={{
          marginTop:8,
          color:'#b00020',
          background:'rgba(176,0,32,0.08)',
          padding:8,
          borderRadius:8,
          fontSize:13
        }}>
          {error}
        </div>
      )}

      {normalized.length > 0 && (
        <div className="search-results" role="listbox" aria-label="Search results">
          {normalized.map(place => (
            <div key={place.id} className="result" role="option">
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{place.name}</div>
                {/* <div style={{fontSize:12,color:'var(--muted)'}}>{place.lat.toFixed(5)}, {place.lng.toFixed(5)}</div> */}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="button" onClick={() => onSetStart && onSetStart(place)}>Start</button>
                <button className="button" onClick={() => onSetEnd && onSetEnd(place)}>End</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
