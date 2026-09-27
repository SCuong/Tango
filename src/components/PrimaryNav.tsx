import React from 'react';
import { IconCards, IconHome, IconSettings } from '@tabler/icons-react';
import { AppRoute } from '../lib/routes';
import { TranslationKey } from '../lib/i18n';
import { useI18n } from '../hooks/useI18n';
import { useNavigation } from '../hooks/useNavigation';
import { usePressFeedback } from '../hooks/usePressFeedback';
import { FOCUS_RING } from './Button';

/**
 * Tango primary navigation (DESIGN_SYSTEM §16.0): three root destinations.
 * Mobile shows them in a floating clay bottom bar on root screens only; from `sm` up the same
 * destinations live in the Home top bar. Every destination is an existing canonical route.
 */
export type PrimaryDestination = 'home' | 'test' | 'settings';

export interface DestinationConfig {
  id: PrimaryDestination;
  route: AppRoute;
  labelKey: TranslationKey;
  Icon: typeof IconHome;
}

export const PRIMARY_DESTINATIONS: DestinationConfig[] = [
  { id: 'home', route: { type: 'home' }, labelKey: 'nav.home', Icon: IconHome },
  { id: 'test', route: { type: 'mixed_quiz_config' }, labelKey: 'nav.test', Icon: IconCards },
  { id: 'settings', route: { type: 'settings' }, labelKey: 'nav.settings', Icon: IconSettings },
];

/**
 * The root destination a route belongs to, or null for every deeper or focused screen
 * (study detail, category/book test setup, active quiz, results, review, management, import).
 */
export function getPrimaryDestination(route: AppRoute): PrimaryDestination | null {
  switch (route.type) {
    case 'home':
      return 'home';
    case 'mixed_quiz_config':
      return 'test';
    case 'settings':
      return 'settings';
    default:
      return null;
  }
}

/**
 * Route a tab press navigates to, or null for the tab that is already current, so tapping the
 * active destination neither pushes a history entry nor replays the root entrance transition.
 */
export function primaryNavTarget(destination: DestinationConfig, active: boolean): AppRoute | null {
  return active ? null : destination.route;
}

/**
 * True only when moving between two different root destinations (Home, Test, Settings).
 * Entering or leaving a deeper route, a first render, and staying on the same root never
 * trigger the root entrance transition.
 */
export function shouldAnimateRootEntrance(
  previous: PrimaryDestination | null,
  next: PrimaryDestination | null
): boolean {
  return previous !== null && next !== null && previous !== next;
}

/** Stroke weights: primary navigation icons are bolder than regular 2px line icons. */
const INACTIVE_STROKE = 2.4;
const ACTIVE_STROKE = 2.7;

const MobileNavTab: React.FC<{ destination: DestinationConfig; active: boolean }> = ({
  destination,
  active,
}) => {
  const { t } = useI18n();
  const { navigate } = useNavigation();
  const { isPressed, pressHandlers } = usePressFeedback();
  const label = t(destination.labelKey);
  const { Icon } = destination;
  // Pressed state lives on the icon puck only (same geometry at rest, pressed, and active);
  // the tab cell itself never gains a pressed background.
  let puckClasses: string;
  if (active) {
    puckClasses = `bg-primary-surface border-primary-border text-primary ${isPressed ? 'translate-y-0.5 shadow-clay-pressed' : 'shadow-clay-card'}`;
  } else if (isPressed) {
    puckClasses = 'translate-y-0.5 bg-surface-elevated border-border-subtle text-text-secondary shadow-clay-pressed';
  } else {
    puckClasses = 'border-transparent text-text-secondary';
  }
  return (
    <button
      type="button"
      {...pressHandlers}
      onClick={() => {
        const target = primaryNavTarget(destination, active);
        if (target) navigate(target);
      }}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      data-nav-destination={destination.id}
      className={`tango-nav-tab relative flex-1 min-w-0 min-h-touch h-full rounded-[20px] flex flex-col items-center justify-center gap-1 ${FOCUS_RING} focus-visible:ring-offset-surface`}
    >
      <span
        aria-hidden="true"
        data-nav-puck=""
        className={`tango-nav-puck flex items-center justify-center w-14 h-8 rounded-full border transition-[transform,box-shadow,background-color,border-color] duration-100 ease-out ${puckClasses}`}
      >
        <Icon size={24} stroke={active ? ACTIVE_STROKE : INACTIVE_STROKE} />
      </span>
      <span
        className={`max-w-full truncate text-xs leading-tight ${active ? 'font-bold text-primary' : 'font-semibold text-text-secondary'}`}
      >
        {label}
      </span>
    </button>
  );
};

/**
 * Floating clay bottom navigation, rendered only below `sm` and only on root destinations.
 * Inset from the screen edges and lifted above the system navigation area (safe-area aware).
 */
export const MobileBottomNav: React.FC<{ active: PrimaryDestination }> = ({ active }) => {
  const { t } = useI18n();
  return (
    <nav aria-label={t('nav.primary')} className="tango-bottom-nav sm:hidden">
      <div className="flex items-stretch gap-1 h-[72px] px-1.5 py-1.5 rounded-[26px] bg-surface border border-border-subtle shadow-clay-card">
        {PRIMARY_DESTINATIONS.map((destination) => (
          <MobileNavTab key={destination.id} destination={destination} active={destination.id === active} />
        ))}
      </div>
    </nav>
  );
};

const DesktopNavLink: React.FC<{ destination: DestinationConfig; active: boolean }> = ({
  destination,
  active,
}) => {
  const { t } = useI18n();
  const { navigate } = useNavigation();
  const { pressHandlers } = usePressFeedback();
  const label = t(destination.labelKey);
  const { Icon } = destination;
  return (
    <button
      type="button"
      {...pressHandlers}
      onClick={() => {
        const target = primaryNavTarget(destination, active);
        if (target) navigate(target);
      }}
      aria-current={active ? 'page' : undefined}
      title={label}
      data-nav-destination={destination.id}
      className={`flat-interactive inline-flex items-center gap-2 min-h-touch px-3.5 rounded-full text-sm leading-snug border ${
        active
          ? 'bg-primary-surface border-primary-border text-primary font-bold'
          : 'border-transparent text-text-secondary font-semibold'
      } ${FOCUS_RING}`}
    >
      <Icon size={20} stroke={active ? ACTIVE_STROKE : INACTIVE_STROKE} aria-hidden="true" />
      {label}
    </button>
  );
};

/** Compact header navigation for tablet/desktop (`sm` and up). */
export const DesktopPrimaryNav: React.FC<{ active: PrimaryDestination }> = ({ active }) => {
  const { t } = useI18n();
  return (
    <nav aria-label={t('nav.primary')} className="hidden sm:flex items-center gap-1">
      {PRIMARY_DESTINATIONS.map((destination) => (
        <DesktopNavLink key={destination.id} destination={destination} active={destination.id === active} />
      ))}
    </nav>
  );
};
