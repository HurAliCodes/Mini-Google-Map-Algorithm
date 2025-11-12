import React from 'react';

export default function RouteBox({
  destination,
  awaitingStart,
  onFindRoute,
  onUseCurrentLocation,
  onClear,
  onSaveRoute,
  routeFound
}) {
  return (
    <div className="routebox" role="region" aria-live="polite">
      {destination ? (
        <>
          <div className="meta">Destination</div>
          <div style={{fontWeight:700,color:'var(--text)',marginBottom:6}}>
            {destination.name || `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`}
          </div>
          <div style={{fontSize:13,color:'var(--muted)',marginBottom:10}}>
            {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
          </div>

          <div className="actions">
            <div style={{display:'flex',gap:8}}>
              <button className="button" onClick={onFindRoute}>Find Route</button>
              <button className="button" onClick={onClear}>Clear</button>
              {routeFound && <button className="button" onClick={onSaveRoute}>Save Route</button>}
            </div>

            {awaitingStart ? (
              <div style={{display:'flex',gap:8}}>
                <button className="button" onClick={onUseCurrentLocation}>Use Current Location</button>
              </div>
            ) : null}
          </div>

          {awaitingStart && <div style={{marginTop:8,color:'var(--muted)',fontSize:13}}>Click map to place starting point or use your current location.</div>}
        </>
      ) : (
        <div style={{fontSize:13,color:'var(--muted)'}}>Select a destination on the map or via search to plan your route.</div>
      )}
    </div>
  );
}
