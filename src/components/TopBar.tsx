import React from 'react';
import { IconSettings } from '@tabler/icons-react';
import { useNavigation } from '../hooks/useNavigation';
import { useI18n } from '../hooks/useI18n';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../hooks/usePressFeedback';

export interface TopBarProps {
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ className = '' }) => {
  const { navigate } = useNavigation();
  const { t } = useI18n();
  const { isPressed: isSettingsPressed, pressHandlers: settingsPressHandlers } =
    usePressFeedback();

  return (
    <header
      className={`w-full border-b border-border-subtle bg-page sticky top-0 z-10 pt-[env(safe-area-inset-top)] ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="inline-flex items-center min-h-touch px-2 font-bold text-xl tracking-wider text-text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page rounded-xl"
          aria-label={t('nav.home')}
        >
          TANGO
        </button>

        {/* Settings button (theme and language are chosen only inside Settings) */}
        <button
          type="button"
          {...settingsPressHandlers}
          onClick={() => navigate({ type: 'settings' })}
          aria-label={t('nav.settings')}
          title={t('nav.settings')}
          className={`clay-interactive clay-hover-surface flex items-center justify-center w-12 h-12 rounded-full bg-surface border border-border-subtle text-text-primary ${isSettingsPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page min-h-touch`}
        >
          <IconSettings size={22} stroke={2} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
