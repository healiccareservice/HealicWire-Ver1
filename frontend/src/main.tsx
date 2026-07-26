import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Auto-cleanup for bloated JWT tokens that cause HTTP 431 errors
const authKey = 'sb-jkquqwxaopqszcnlnxti-auth-token';
const authStr = localStorage.getItem(authKey);
if (authStr && authStr.length > 8000) {
  console.warn("Detected bloated auth token. Clearing to prevent 431 errors...");
  localStorage.removeItem(authKey);
  window.location.reload();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
