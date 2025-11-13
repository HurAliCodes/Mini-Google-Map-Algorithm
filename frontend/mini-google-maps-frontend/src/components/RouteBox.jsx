import React from 'react';

function formatDistance(meters) {
  if (!meters || meters <= 0) return '--';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export default function RouteBox({
  destination,
  awaitingStart,
  onFindRoute,
  onUseCurrentLocation,
  onClear,
  onSaveRoute,
  routeFound,
  distanceMeters,
  estimates,
  onFitRoute,
  pathPointsCount
}) {
  return (
    <div className="routebox" role="region" aria-live="polite">
      {routeFound ? (
        <>
          <div className="meta">Route summary</div>

          {/* Prominent distance like Google Maps */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:'var(--text)'}}>
                {formatDistance(distanceMeters)}
              </div>
              <div style={{fontSize:13,color:'var(--muted)'}}>{pathPointsCount} points · {destination ? (destination.name || '') : ''}</div>
            </div>

            <div style={{display:'flex',gap:8}}>
              <button className="button" onClick={onFitRoute} title="Fit route on map">Center route</button>
              <button className="button" onClick={onSaveRoute} title="Save route">Save</button>
            </div>
          </div>

          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:8}}>
            <div style={{minWidth:140}}>
              <div style={{fontSize:12,color:'var(--muted)'}}>Driving</div>
              <div style={{fontWeight:700}}>{estimates?.driving || '--'}</div>
            </div>

            <div style={{minWidth:140}}>
              <div style={{fontSize:12,color:'var(--muted)'}}>Walking</div>
              <div style={{fontWeight:700}}>{estimates?.walking || '--'}</div>
            </div>

            <div style={{minWidth:120}}>
              <div style={{fontSize:12,color:'var(--muted)'}}>Steps</div>
              <div style={{fontWeight:700}}>{pathPointsCount}</div>
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}>
           
            <div style={{display:'flex',gap:8}}>
              <button className="button" onClick={onClear}>Clear</button>
            </div>
          </div>
        </>
      ) : destination ? (
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
