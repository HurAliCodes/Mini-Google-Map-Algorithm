import React from 'react';

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconRoute = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 13c0-3 2-4 5-4s5-1 5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="3" cy="13" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="13" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1 8c2.5-4 11.5-4 14 0-2.5 4-11.5 4-14 0z" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

export default function Sidebar({
  routeHistory = [],
  onLoadRoute,
  onClearRouteHistory,
  collapsed = false,
  onToggleCollapse,
}) {
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div style={{ fontWeight: 700, color: 'var(--text)' }}>History</div>
        <button className="icon-btn" onClick={onToggleCollapse} aria-label="Toggle sidebar">
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-content">
          {routeHistory.length === 0 ? (
            <div style={{ padding: 10, color: 'var(--muted)', fontSize: 13 }}>No route history</div>
          ) : (
            routeHistory.map((r, idx) => (
              <div key={`r-${idx}`} className="item">
                <IconRoute />
                <div style={{ flex: 1 }}>
                  <div className="title">{r.startName} → {r.endName}</div>
                  <div className="meta">
                    {r.startLat.toFixed(5)}, {r.startLng.toFixed(5)} → {r.endLat.toFixed(5)}, {r.endLng.toFixed(5)}
                  </div>
                </div>
                <button className="icon-btn" title="Load route" onClick={() => onLoadRoute && onLoadRoute(r)}>
                  <IconEye />
                </button>
              </div>
            ))
          )}
          {routeHistory.length > 0 && (
            <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="button" onClick={onClearRouteHistory}>Clear History</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
