import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Silence console output in production builds (browser only)
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  const noop = () => {};
  window.console.log = noop;
  window.console.warn = noop;
  window.console.error = noop;
  window.console.info = noop;
  window.console.debug = noop;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



