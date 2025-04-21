import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { overrideConsoleInProduction } from '@shared/utils/secureLogging';

// Add dark class to html element for Tailwind dark mode
document.documentElement.classList.add('dark');

// Override console methods in production to prevent exposing sensitive information
overrideConsoleInProduction();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
