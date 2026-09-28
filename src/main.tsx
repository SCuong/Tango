import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { bootstrapAppState, applyDocumentPreferences } from './lib/appState';
import { isFirstVisitAsset } from './lib/offlineAssets';
import { AppStateProvider } from './hooks/useAppState';
import { NavigationProvider } from './hooks/useNavigation';
import { QuizSessionProvider } from './features/quiz/QuizSessionContext';
import './index.css';

// 1. Bootstrap runtime state once before rendering
const initialAppState = bootstrapAppState();

// 2. Synchronize initial appearance theme & language to document root before mount
applyDocumentPreferences(initialAppState.preferences);

// 3. Offline support: register the service worker in production builds only
if (import.meta.env.PROD && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Assets loaded before the worker took control (first visit) are handed over for caching
        const urls = [
          window.location.origin + '/',
          ...performance
            .getEntriesByType('resource')
            .map((entry) => entry.name)
            .filter(isFirstVisitAsset),
        ];
        registration.active?.postMessage({ type: 'tango-cache-urls', urls });
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppStateProvider initialState={initialAppState}>
      <NavigationProvider>
        <QuizSessionProvider>
          <App />
        </QuizSessionProvider>
      </NavigationProvider>
    </AppStateProvider>
  </React.StrictMode>
);
