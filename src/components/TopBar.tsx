import React from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useI18n } from '../hooks/useI18n';
import { DesktopPrimaryNav } from './PrimaryNav';

export interface TopBarProps {
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ className = '' }) => {
  const { navigate } = useNavigation();
  const { t } = useI18n();

  return (
    <header
      className={`tango-topbar w-full bg-page sticky top-0 z-10 pt-[env(safe-area-inset-top)] ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="inline-flex items-center min-h-touch px-2 font-bold text-xl tracking-wider text-text-primary flat-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page rounded-xl"
          aria-label={t('nav.home')}
        >
          TANGO
        </button>

        {/* Primary navigation from sm up; on mobile the floating bottom nav takes this role.
            No theme status or control here: theme selection lives only in Settings. */}
        <DesktopPrimaryNav active="home" />
      </div>
    </header>
  );
};
