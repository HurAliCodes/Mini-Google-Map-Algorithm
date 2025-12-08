import React, { useEffect, useState } from 'react';
import MapView from './components/MapView';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <div className="app-root" style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <MapView theme={theme} onToggleTheme={toggleTheme} />
    </div>
  );
}
