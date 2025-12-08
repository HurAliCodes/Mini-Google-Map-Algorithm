import React, { useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';

export default function SearchBar({ onSetStart, onSetEnd, onSetStop, className }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wrapperRef = useRef(null); // detect outside click

  // Fetch results manually
  const fetchResults = async () => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      setError(null);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=50&countrycodes=pk&viewbox=66.95,25.40,67.35,24.70&bounded=1`;
      
      const res = await axios.get(url, { signal: controller.signal, headers: { 'Accept-Language': 'en' } });
      setResults(res.data || []);
    } catch (e) {
      if (e.name !== 'CanceledError') setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Hide results on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalized = useMemo(() => (results || []).map(r => ({
    id: r.place_id,
    name: r.display_name || r.name || 'Unknown',
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  })), [results]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  // Auto-fetch when typing (debounced)
useEffect(() => {
  if (!query || query.trim().length < 2) {
    setResults([]);
    return;
  }

  const delay = setTimeout(() => {
    fetchResults();
  }, 400); // debounce 400ms

  return () => clearTimeout(delay);
}, [query]);


  return (
    <div ref={wrapperRef} className={className ? className + ' searchbar-wrapper' : 'searchbar-wrapper'}>
      <div className="searchbar" role="search" aria-label="Search places" style={{ position: 'relative' }}>
        <input
          className="search-input"
          value={query}
          onChange={(e) =>{ setQuery(e.target.value)}}
          placeholder="Search places, addresses or coordinates"
        />
        {query && (
          <button
            className="clear-btn"
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: 80,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer'
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        <div className="search-actions">
          {loading ? <div className='searching' style={{ fontSize: 13 }}>Searching...</div> : null}
          <button className="search-btn" onClick={fetchResults}>Search</button>
        </div>
      </div>

      {normalized.length > 0 && (
        <div className="search-results" role="listbox" aria-label="Search results">
          {normalized.map(place => (
            <div key={place.id} className="result" role="option">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: 'var(--text)' }}>{place.name}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="button" onClick={() => { onSetStart && onSetStart(place); clearSearch(); }}>Start</button>
                <button className="button" onClick={() => { onSetEnd && onSetEnd(place); clearSearch(); }}>End</button>
                <button className="button" onClick={() => { onSetStop && onSetStop(place); clearSearch(); }}>Stop</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
