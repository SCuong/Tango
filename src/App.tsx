import React from 'react';
import { useNavigation } from './hooks/useNavigation';
import { useI18n } from './hooks/useI18n';

export const App: React.FC = () => {
  const { route } = useNavigation();
  const { t } = useI18n();

  if (route.type === 'not_found') {
    return (
      <div className="min-h-screen bg-page text-text-primary p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl p-6 shadow-clay-card space-y-2">
          <h1 className="text-xl font-bold text-text-primary">404</h1>
          <p className="text-sm text-text-secondary">{t('state.notFound')}</p>
        </div>
      </div>
    );
  }

  if (route.type !== 'home') {
    return (
      <div className="min-h-screen bg-page text-text-primary p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl p-6 shadow-clay-card space-y-2">
          <h1 className="text-xl font-bold text-text-primary">{t('app.name')}</h1>
          <p className="text-sm text-text-secondary">{t('state.notImplemented')}</p>
        </div>
      </div>
    );
  }

  // Home route ('/') retains the existing smoke UI
  return (
    <div className="min-h-screen bg-page text-text-primary p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl p-6 shadow-clay-card space-y-4">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Tango
        </h1>
        <p className="text-base text-text-secondary">
          <span className="font-japanese">日本語</span>
          <span> • </span>
          <span>Tiếng Việt</span>
        </p>
      </div>
    </div>
  );
};

export default App;
