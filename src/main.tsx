import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { bootstrapAppState, applyDocumentPreferences } from './lib/appState';
import { AppStateProvider } from './hooks/useAppState';
import { NavigationProvider } from './hooks/useNavigation';
import { QuizSessionProvider } from './features/quiz/QuizSessionContext';
import './index.css';

// 1. Bootstrap runtime state once before rendering
const initialAppState = bootstrapAppState();

// 2. Synchronize initial appearance theme & language to document root before mount
applyDocumentPreferences(initialAppState.preferences);

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
