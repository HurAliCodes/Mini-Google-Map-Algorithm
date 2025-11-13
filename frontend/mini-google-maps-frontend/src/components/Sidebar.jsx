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

const IconChevron = ({ collapsed }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 20 20" 
    fill="none"
    style={{transform: collapsed ? 'rotate(270deg)' : 'rotate(90deg)', transition: 'transform .2s ease'}}
  >
    <path d="M13 8l-5 5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
    <>
      <div className="sidebar-header">
        <span style={{fontWeight:600}}>Route History</span>
        <button 
          className="icon-btn collapse-toggle" 
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IconChevron collapsed={collapsed} />
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-content">
          {routeHistory.length === 0 ? (
            <div style={{padding:'16px 8px', textAlign:'center', color:'var(--muted)', fontSize:14}}>
              No saved routes yet
            </div>
          ) : (
            <>
              {routeHistory.map((route, idx) => (
                <div key={`${route.ts}-${idx}`} className="item">
                  <div style={{display:'flex', gap:8, flex:1}}>
                    <div style={{display:'flex', alignItems:'center', color:'var(--primary)'}}>
                      <IconRoute />
                    </div>
                    <div style={{flex:1}}>
                      <div className="title" style={{fontSize:13}}>
                        {route.startName} → {route.endName}
                      </div>
                      <div className="meta" style={{display:'flex', gap:4, alignItems:'center'}}>
                        <IconClock />
                        {new Date(route.ts).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{display:'flex', gap:4}}>
                    <button 
                      className="icon-btn small-btn" 
                      onClick={() => onLoadRoute(route)}
                      title="Load route"
                    >
                      <IconEye />
                    </button>
                  </div>
                </div>
              ))}

              <div style={{padding:'12px 8px', borderTop:'1px solid var(--border)'}}>
                <button 
                  className="button" 
                  onClick={onClearRouteHistory}
                  style={{width:'100%', fontSize:13}}
                >
                  Clear History
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
