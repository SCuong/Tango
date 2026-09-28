import React from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useI18n } from '../hooks/useI18n';
import { DesktopPrimaryNav } from './PrimaryNav';
import tangoWordmark from '../assets/brand/tango-wordmark.webp';

/** Intrinsic size of the brand asset (keeps the aspect ratio and avoids layout shift). */
const WORDMARK_WIDTH = 488;
const WORDMARK_HEIGHT = 176;

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
          className="inline-flex items-center min-h-touch px-1.5 -ml-1.5 flat-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page rounded-xl"
          aria-label={t('nav.home')}
        >
          {/* Canonical Tango cat wordmark (DESIGN_SYSTEM B1); the button carries the accessible name */}
          <img
            src={tangoWordmark}
            alt=""
            width={WORDMARK_WIDTH}
            height={WORDMARK_HEIGHT}
            draggable={false}
            className="tango-wordmark block h-10 sm:h-11 w-auto select-none"
          />
        </button>

        {/* Primary navigation from sm up; on mobile the floating bottom nav takes this role.
            No theme status or control here: theme selection lives only in Settings. */}
        <DesktopPrimaryNav active="home" />
      </div>
    </header>
  );
};
