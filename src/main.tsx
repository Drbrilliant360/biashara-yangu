
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { initNative } from './lib/nativeInit';
import { installGlobalErrorReporting } from './lib/reportError';
import { installNetworkActivity } from './lib/networkActivity';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

installNetworkActivity();
installGlobalErrorReporting();
initNative();

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
