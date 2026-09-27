import React from 'react';
import { useNavigation } from './hooks/useNavigation';
import { useI18n } from './hooks/useI18n';
import { HomeStudyHub } from './features/books/HomeStudyHub';

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

  // SCREEN 01: Home / Study Hub
  return <HomeStudyHub />;
};

export default App;
