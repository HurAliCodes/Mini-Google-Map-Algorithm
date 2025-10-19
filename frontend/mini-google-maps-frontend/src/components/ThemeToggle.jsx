import React from 'react';

export default function ThemeToggle({ theme = 'light', onToggle }) {
  const isDark = theme === 'dark';
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1100 }}>
      <button
        className="button"
        onClick={onToggle}
        title="Toggle theme"
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'inline-block',
          background: isDark ? '#ffd54f' : '#202124'
        }} />
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </button>
    </div>
  );
}