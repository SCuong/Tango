import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-page text-text-primary p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl p-6 shadow-clay-card space-y-4">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Tango
        </h1>
        <p className="text-sm text-text-secondary font-japanese">
          日本語 • Tiếng Việt
        </p>
      </div>
    </div>
  );
};

export default App;
