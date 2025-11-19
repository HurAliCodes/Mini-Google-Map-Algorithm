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
          <div className="meta">Distance</div>

          {/* Prominent distance like Google Maps */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:'var(--text)'}}>
                {formatDistance(distanceMeters)}
              </div>
              <div style={{fontSize:13,color:'var(--muted)'}}>{destination ? (destination.name || '') : ''}</div>
            </div>

            <div style={{display:'flex',gap:8}}>
              <button className="button" onClick={onFitRoute} title="Fit route on map">Center route</button>
              <button className="button" onClick={onSaveRoute} title="Save route">Save</button>
            </div>
          </div>

          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:8,justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:30}}>
              <div style={{minWidth:140, display:'flex',gap:5, alignItems:'flex-end'}}>
                <div style={{fontSize:14,color:'var(--muted)',marginRight:4}}><i class="fa-solid fa-car"></i></div>
                <div style={{fontWeight:500, fontSize:'14px'}}>{estimates?.driving || '--'}</div>
              </div>
              <div style={{minWidth:140, display:'flex',gap:5, alignItems:'flex-end'}}>
                <div style={{fontSize:14,color:'var(--muted)',marginRight:4}}><i class="fa-solid fa-person-walking"></i></div>
                <div style={{fontWeight:500, fontSize:'14px'}}>{estimates?.walking || '--'}</div>
              </div>
            </div>

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
