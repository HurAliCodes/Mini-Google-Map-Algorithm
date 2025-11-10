import React from 'react';

export default function RouteBox({
  destination,
  awaitingStart,
  onFindRoute,
  onUseCurrentLocation,
  onClear,
  onSaveRoute,           // 👈 add new prop
  routeFound             // 👈 add new prop
}) {
  return (
    <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 950 }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: 10, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', padding: 12, minWidth: 'min(90vw, 640px)' }}>
        {destination ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Destination</div>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                {destination.name || `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="button" onClick={onFindRoute}>Find Route</button>
                <button className="button" onClick={onClear}>Clear</button>

                {/* 👇 Show Save Route button only after route found */}
                {routeFound && (
                  <button className="button" onClick={onSaveRoute}>Save Route</button>
                )}
              </div>

              {awaitingStart && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="button" onClick={onUseCurrentLocation}>Use Current Location</button>
                </div>
              )}
            </div>

            {awaitingStart && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
                Click the map to choose your starting location, or use your current location.
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Select a destination on the map or via search to plan your route.
          </div>
        )}
      </div>
    </div>
  );
}
