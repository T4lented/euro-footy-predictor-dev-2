import React from 'react';
import ReactDOM from 'react-dom/client';
import { init as sentryInit, ErrorBoundary } from '@sentry/react';
import App from './App';
import './index.css';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
  sentryInit({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<p>Something went wrong. The error has been reported.</p>}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
