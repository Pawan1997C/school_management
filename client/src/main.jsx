import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './styles.css';
import './site.css';
import { applyAdminTheme } from './utils/themes.js';

try { const t = localStorage.getItem('adminTheme'); if (t) applyAdminTheme(t); } catch { /* storage unavailable */ }

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
