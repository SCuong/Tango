import React from 'react';
import { IconSun, IconMoon, IconFlower, IconSettings } from '@tabler/icons-react';
import { useNavigation } from '../hooks/useNavigation';
import { useAppState } from '../hooks/useAppState';
import { useI18n } from '../hooks/useI18n';

export interface TopBarProps {
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ className = '' }) => {
  const { navigate } = useNavigation();
  const { state } = useAppState();
  const { t } = useI18n();

  const theme = state.preferences.theme;
  const themeLabel = t(`preferences.theme.${theme}`);
  const currentThemeAria = t('aria.currentTheme', { theme: themeLabel });

  const ThemeIcon = theme === 'dark' ? IconMoon : theme === 'sakura' ? IconFlower : IconSun;

  return (
    <header
      className={`w-full border-b border-border-subtle bg-surface/80 backdrop-blur-sm sticky top-0 z-10 pt-[env(safe-area-inset-top)] ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="font-bold text-xl tracking-wider text-text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-1 py-0.5"
          aria-label={t('nav.home')}
        >
          TANGO
        </button>

        <div className="flex items-center gap-2">
          {/* Active theme status indicator (read-only, non-interactive) */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-elevated text-text-secondary border border-border-subtle"
            aria-label={currentThemeAria}
            title={currentThemeAria}
          >
            <ThemeIcon size={20} stroke={2} aria-hidden="true" />
            <span className="sr-only">{currentThemeAria}</span>
          </div>

          {/* Settings button */}
          <button
            type="button"
            onClick={() => navigate({ type: 'settings' })}
            aria-label={t('nav.settings')}
            title={t('nav.settings')}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface hover:bg-surface-elevated active:translate-y-[1px] border border-border-subtle text-text-primary shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-touch"
          >
            <IconSettings size={22} stroke={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
