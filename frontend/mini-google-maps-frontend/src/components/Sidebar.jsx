import React, { useState } from 'react';

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.6L8 12.2 3.8 14.9l.8-4.6-3.4-3.3 4.7-.7L8 1z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconRoute = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 13c0-3 2-4 5-4s5-1 5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="3" cy="13" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="13" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 8c2.5-4 11.5-4 14 0-2.5 4-11.5 4-14 0z" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const IconStart = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12l9-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M12 3v6H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconEnd = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 14V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M4 2h7l-2 3 2 3H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4h10" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M6 4V3h4v1" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4 4l1 9h6l1-9" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export default function Sidebar({
  savedPlaces = [],
  routeHistory = [],
  onSetStart,
  onSetEnd,
  onCenter,
  onClearSaved,
  onClearRouteHistory,
  onRemoveSaved,
  onLoadRoute,
  collapsed = false,
  onToggleCollapse,
}) {
  const [activeTab, setActiveTab] = useState('saved');

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div style={{ fontWeight: 700, color: 'var(--text)' }}>Menu</div>
        <button className="icon-btn" onClick={onToggleCollapse} aria-label="Toggle sidebar">
          {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="sidebar-tabs">
            <button className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
              <IconStar /> Saved
            </button>
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <IconClock /> History
            </button>
          </div>

          <div className="sidebar-content">
            {activeTab === 'saved' ? (
              <>
                {savedPlaces.length === 0 && (
                  <div style={{ padding: 10, color: 'var(--muted)', fontSize: 13 }}>No saved places</div>
                )}
                {savedPlaces.map((p, idx) => (
                  <div key={`s-${idx}`} className="item">
                    <IconStar />
                    <div style={{ flex: 1 }}>
                      <div className="title">{p.name}</div>
                      <div className="meta">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</div>
                    </div>
                    <button className="icon-btn" title="View" onClick={() => onCenter && onCenter(p)}><IconEye /></button>
                    <button className="icon-btn" title="Set start" onClick={() => onSetStart && onSetStart(p)}><IconStart /></button>
                    <button className="icon-btn" title="Set destination" onClick={() => onSetEnd && onSetEnd(p)}><IconEnd /></button>
                    <button className="icon-btn" title="Remove" onClick={() => onRemoveSaved && onRemoveSaved(p)}><IconTrash /></button>
                  </div>
                ))}
                <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="button" onClick={onClearSaved}>Clear Saved</button>
                </div>
              </>
            ) : (
              <>
                {routeHistory.length === 0 && (
                  <div style={{ padding: 10, color: 'var(--muted)', fontSize: 13 }}>No route history</div>
                )}
                {routeHistory.map((r, idx) => (
                  <div key={`r-${idx}`} className="item">
                    <IconRoute />
                    <div style={{ flex: 1 }}>
                      <div className="title">{r.startName} → {r.endName}</div>
                      <div className="meta">{r.startLat.toFixed(5)}, {r.startLng.toFixed(5)} → {r.endLat.toFixed(5)}, {r.endLng.toFixed(5)}</div>
                    </div>
                    <button className="icon-btn" title="Load route" onClick={() => onLoadRoute && onLoadRoute(r)}><IconEye /></button>
                  </div>
                ))}
                <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="button" onClick={onClearRouteHistory}>Clear History</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}