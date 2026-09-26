import React, { useState, useEffect } from 'react';
import {
  IconBook,
  IconLanguage,
  IconSun,
  IconMoon,
  IconFlower,
  IconFlame,
} from '@tabler/icons-react';
import { AppTheme } from './types';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-page text-text-primary px-4 py-8 flex flex-col items-center justify-center transition-colors duration-200">
      <main className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 shadow-clay-card">
        {/* Header with Tango brand and theme switcher */}
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-clay-button">
              <IconBook size={20} stroke={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Tango</h1>
              <p className="text-xs text-text-muted">Tiếng Nhật cho người Việt</p>
            </div>
          </div>

          {/* Theme Switcher Swatches */}
          <div className="flex items-center gap-1.5 bg-surface-elevated p-1 rounded-xl border border-border-subtle">
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-label="Giao diện Sáng"
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-surface text-primary shadow-clay-button'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <IconSun size={18} stroke={1.8} />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-label="Giao diện Tối"
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-surface text-primary shadow-clay-button'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <IconMoon size={18} stroke={1.8} />
            </button>
            <button
              type="button"
              onClick={() => setTheme('sakura')}
              aria-label="Giao diện Sakura"
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'sakura'
                  ? 'bg-surface text-primary shadow-clay-button'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <IconFlower size={18} stroke={1.8} />
            </button>
          </div>
        </div>

        {/* Japanese typography verification card */}
        <div className="bg-surface-elevated rounded-xl p-5 border border-border-subtle mb-6 text-center">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
            Từ vựng & Hán tự
          </span>
          <div className="text-3xl font-bold font-japanese mb-1 text-text-primary">
            旅行
          </div>
          <div className="text-sm font-japanese text-text-muted mb-2">
            りょこう • LỮ HÀNH
          </div>
          <div className="text-base text-text-secondary font-medium">
            Du lịch, chuyến đi
          </div>
        </div>

        {/* Positional 4-choice palette verification */}
        <div className="space-y-2.5 mb-6">
          <div className="p-3 rounded-xl border text-sm font-medium flex items-center justify-between bg-answer-1-bg border-answer-1-border text-answer-1-text">
            <span>Vị trí 1 (Amber)</span>
            <span className="font-japanese font-semibold">旅行</span>
          </div>
          <div className="p-3 rounded-xl border text-sm font-medium flex items-center justify-between bg-answer-2-bg border-answer-2-border text-answer-2-text">
            <span>Vị trí 2 (Sky Blue)</span>
            <span className="font-japanese font-semibold">実際</span>
          </div>
          <div className="p-3 rounded-xl border text-sm font-medium flex items-center justify-between bg-answer-3-bg border-answer-3-border text-answer-3-text">
            <span>Vị trí 3 (Violet)</span>
            <span className="font-japanese font-semibold">礼儀</span>
          </div>
          <div className="p-3 rounded-xl border text-sm font-medium flex items-center justify-between bg-answer-4-bg border-answer-4-border text-answer-4-text">
            <span>Vị trí 4 (Rose)</span>
            <span className="font-japanese font-semibold">景観</span>
          </div>
        </div>

        {/* Phase 1 readiness badge */}
        <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border-subtle">
          <span className="inline-flex items-center gap-1">
            <IconLanguage size={14} />
            Phase 1 Foundation
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-primary">
            <IconFlame size={14} />
            Ready for Phase 2
          </span>
        </div>
      </main>
    </div>
  );
};

export default App;
