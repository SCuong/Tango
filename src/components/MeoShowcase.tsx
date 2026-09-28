import React, { useRef } from 'react';
import { useI18n } from '../hooks/useI18n';
import { ShowcaseHold, createShowcaseExitGuard } from '../hooks/useMeoShowcase';

/**
 * Tiny paw that fades in around the finger while a showcase hold is pending, and pops once it
 * opens. Decorative only; hidden under reduced motion.
 */
export const MeoHoldIndicator: React.FC<{ hold: ShowcaseHold }> = ({ hold }) => (
  <span
    aria-hidden="true"
    className={hold.done ? 'tango-showcase-hold tango-showcase-hold-done' : 'tango-showcase-hold'}
    style={{ left: hold.x, top: hold.y }}
  />
);

/**
 * Full-screen transparent layer shown while the showcase is open. It sits above the hidden UI and
 * the bottom navigation, so a tap can only exit (never press a card or a nav item underneath).
 */
export const MeoShowcaseExitLayer: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { t } = useI18n();
  const guard = useRef(createShowcaseExitGuard()).current;
  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label={t('meo.showcaseExit')}
      data-meo-showcase-exit=""
      className="tango-showcase-exit"
      onPointerDown={() => guard.pointerDown()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (guard.click()) onExit();
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
