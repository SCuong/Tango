import React, { useEffect, useRef, useState } from 'react';
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconCards,
  IconFolders,
  IconHome,
  IconSettings,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-react';
import { AppTheme, UserPreferences } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { usePressFeedback } from '../../hooks/usePressFeedback';
import { FOCUS_RING } from '../../components/Button';
import { ModalRoute } from '../../components/ModalRoute';
import { SegmentedControl } from '../../components/FormControls';
import { TranslationKey } from '../../lib/i18n';
import { InlineNotice } from '../study/StudyParts';
import tangoWordmark from '../../assets/brand/tango-wordmark.webp';

/**
 * Applies a preference change and reports whether it was saved. `updatePreferences` persists
 * before touching the document or in-memory state, so a failed write leaves both unchanged.
 */
export function applyPreferenceChange(
  updatePreferences: (patch: Partial<UserPreferences>) => void,
  patch: Partial<UserPreferences>
): boolean {
  try {
    updatePreferences(patch);
    return true;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return false;
  }
}

const THEMES: { value: AppTheme; nameKey: TranslationKey; descKey: TranslationKey }[] = [
  { value: 'light', nameKey: 'preferences.theme.light', descKey: 'settings.themeDesc.light' },
  { value: 'dark', nameKey: 'preferences.theme.dark', descKey: 'settings.themeDesc.dark' },
  { value: 'sakura', nameKey: 'preferences.theme.sakura', descKey: 'settings.themeDesc.sakura' },
  // Special easter-egg theme: revealed by the carousel arrow, never in the initial three
  { value: 'meo', nameKey: 'preferences.theme.meo', descKey: 'settings.themeDesc.meo' },
];

/**
 * SCREEN 16 — Settings (`/settings`).
 * Full-screen route on mobile; a centered `max-w-lg` panel over a dimmed canvas from `sm` up.
 * Theme selection lives only here (DESIGN_SYSTEM §16.5).
 */
export const SettingsScreen: React.FC = () => {
  const { state, updatePreferences } = useAppState();
  const { navigate, goBack } = useNavigation();
  const { t } = useI18n();
  const close = () => goBack({ type: 'home' });

  const { preferences } = state;

  const [saveFailed, setSaveFailed] = useState(false);

  const safeUpdate = (patch: Partial<UserPreferences>) => {
    setSaveFailed(!applyPreferenceChange(updatePreferences, patch));
  };

  return (
    <ModalRoute titleId="settings-title" title={t('settings.title')} onClose={close} size="lg" hideMobileBack>
      <div className="space-y-7 pb-4">
        <section aria-labelledby="settings-appearance" className="space-y-5">
          <h2 id="settings-appearance" className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('settings.appearance')}
          </h2>

          {saveFailed && (
            <div role="alert">
              <InlineNotice tone="warning" icon={<IconAlertTriangle size={18} stroke={2} />}>
                {t('common.saveError')}
              </InlineNotice>
            </div>
          )}

          <div>
            <p id="settings-language" className="text-sm font-semibold text-text-primary mb-2">
              {t('settings.language')}
            </p>
            <SegmentedControl
              labelledBy="settings-language"
              value={preferences.language}
              onChange={(language) => safeUpdate({ language })}
              options={[
                { value: 'vi', label: t('preferences.language.vi') },
                { value: 'en', label: t('preferences.language.en') },
              ]}
            />
          </div>

          <div>
            <p id="settings-theme" className="text-sm font-semibold text-text-primary mb-2">
              {t('settings.theme')}
            </p>
            <ThemePicker value={preferences.theme} onChange={(theme) => safeUpdate({ theme })} />
          </div>

          <div>
            <p id="settings-sound" className="text-sm font-semibold text-text-primary">
              {t('settings.sound')}
            </p>
            <p className="text-xs text-text-muted mt-0.5 mb-2 leading-relaxed">{t('settings.soundDesc')}</p>
            <SegmentedControl
              labelledBy="settings-sound"
              value={preferences.soundEnabled ? 'on' : 'off'}
              onChange={(value) => safeUpdate({ soundEnabled: value === 'on' })}
              options={[
                { value: 'off', label: t('preferences.sound.off'), icon: <IconVolumeOff size={18} stroke={2} /> },
                { value: 'on', label: t('preferences.sound.on'), icon: <IconVolume size={18} stroke={2} /> },
              ]}
            />
          </div>
        </section>

        <section aria-labelledby="settings-content" className="space-y-2">
          <h2 id="settings-content" className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('settings.studyContent')}
          </h2>
          <ContentManagementRow onOpen={() => navigate({ type: 'content_management' })} />
        </section>
      </div>
    </ModalRoute>
  );
};

const ContentManagementRow: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const { t } = useI18n();
  const { pressHandlers } = usePressFeedback();
  return (
    <button
      type="button"
      {...pressHandlers}
      onClick={onOpen}
      className={`flat-interactive w-full min-h-[64px] px-4 py-3 rounded-xl border border-border-subtle bg-surface flex items-center gap-3 text-left ${FOCUS_RING}`}
    >
      <span aria-hidden="true" className="tango-icon-puck w-10 h-10 rounded-lg bg-primary-surface text-primary flex items-center justify-center shrink-0">
        <IconFolders size={20} stroke={1.75} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-text-primary leading-snug">{t('settings.manageContent')}</span>
      </span>
      <IconChevronRight size={20} stroke={2} aria-hidden="true" className="shrink-0 text-text-muted" />
    </button>
  );
};

/**
 * Theme carousel positions: 0 shows the three standard themes (Light, Dark, Sakura); 1 shifts the
 * track one card to the left, hiding Light and revealing Meo's World (the easter-egg theme).
 */
export type ThemeCarouselPosition = 0 | 1;

/** Number of theme cards visible at once. */
export const VISIBLE_THEME_CARDS = 3;

/** Themes visible at a carousel position, in picker order. */
export function visibleThemes(position: ThemeCarouselPosition): AppTheme[] {
  return THEMES.slice(position, position + VISIBLE_THEME_CARDS).map((theme) => theme.value);
}

/**
 * Position that keeps `theme` visible: the current one when it already shows the theme, otherwise
 * the one position that does (Light only at 0, Meo's World only at 1). A persisted Meo's World
 * therefore opens Settings on the second position.
 */
export function carouselPositionFor(theme: AppTheme, current: ThemeCarouselPosition = 0): ThemeCarouselPosition {
  if (visibleThemes(current).includes(theme)) return current;
  return theme === THEMES[0].value ? 0 : 1;
}

/**
 * Theme previews: each miniature sets its own `data-theme`, so it renders with that theme's real
 * tokens (canvas, surface card, category identities, CTA, ambience motif). Three cards are visible;
 * a subtle arrow beside the group slides the track by one card to reveal Meo's World and back.
 */
const ThemePicker: React.FC<{ value: AppTheme; onChange: (theme: AppTheme) => void }> = ({ value, onChange }) => {
  const { t } = useI18n();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const arrowRef = useRef<HTMLButtonElement | null>(null);
  const moveFocusToArrow = useRef(false);
  const [position, setPosition] = useState<ThemeCarouselPosition>(() => carouselPositionFor(value));
  const visible = visibleThemes(position);
  const tabbable = visible.includes(value) ? value : visible[0];

  // The arrow swaps sides after a shift; keep keyboard focus on the arrow that replaced it
  useEffect(() => {
    if (moveFocusToArrow.current) {
      moveFocusToArrow.current = false;
      arrowRef.current?.focus();
    }
  }, [position]);

  const shift = (next: ThemeCarouselPosition) => {
    moveFocusToArrow.current = typeof document !== 'undefined' && document.activeElement === arrowRef.current;
    setPosition(next);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % THEMES.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + THEMES.length) % THEMES.length;
    if (next >= 0) {
      e.preventDefault();
      onChange(THEMES[next].value);
      setPosition((current) => carouselPositionFor(THEMES[next].value, current));
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="theme-picker relative -mx-3" data-position={position}>
      <div className="theme-carousel-viewport">
        <div
          id="settings-theme-track"
          role="radiogroup"
          aria-labelledby="settings-theme"
          data-position={position}
          className="theme-carousel-track flex"
        >
          {THEMES.map((theme, index) => (
            <ThemeCard
              key={theme.value}
              ref={(el) => {
                refs.current[index] = el;
              }}
              theme={theme}
              selected={value === theme.value}
              offscreen={!visible.includes(theme.value)}
              tabbable={tabbable === theme.value}
              onSelect={() => onChange(theme.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
            />
          ))}
        </div>
      </div>
      {position === 0 ? (
        <CarouselArrow ref={arrowRef} side="right" label={t('settings.themeMore')} onPress={() => shift(1)} />
      ) : (
        <CarouselArrow ref={arrowRef} side="left" label={t('settings.themeBack')} onPress={() => shift(0)} />
      )}
    </div>
  );
};

/** Small clay arrow in the picker's reserved gutter, beside the card row: a 44px touch target around a 32px puck. */
const CarouselArrow = React.forwardRef<
  HTMLButtonElement,
  { side: 'left' | 'right'; label: string; onPress: () => void }
>(function CarouselArrow({ side, label, onPress }, ref) {
  const { isPressed, pressHandlers } = usePressFeedback();
  const Icon = side === 'right' ? IconChevronRight : IconChevronLeft;
  return (
    <button
      ref={ref}
      type="button"
      {...pressHandlers}
      onClick={onPress}
      aria-label={label}
      title={label}
      aria-controls="settings-theme-track"
      data-carousel-arrow={side}
      className={`theme-carousel-arrow absolute top-1/2 -translate-y-1/2 ${side === 'right' ? 'right-0' : 'left-0'} z-10 w-11 h-11 flex items-center justify-center rounded-full ${FOCUS_RING}`}
    >
      <span
        aria-hidden="true"
        className={`tango-icon-puck flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border-subtle text-text-secondary transition-[transform,box-shadow] duration-100 ease-out ${
          isPressed ? 'translate-y-px shadow-clay-pressed' : 'shadow-clay-card'
        }`}
      >
        <Icon size={18} stroke={2.4} />
      </span>
    </button>
  );
});

const ThemeCard = React.forwardRef<
  HTMLButtonElement,
  {
    theme: (typeof THEMES)[number];
    selected: boolean;
    offscreen: boolean;
    tabbable: boolean;
    onSelect: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  }
>(function ThemeCard({ theme, selected, offscreen, tabbable, onSelect, onKeyDown }, ref) {
  const { t } = useI18n();
  const { isPressed, pressHandlers } = usePressFeedback();
  const descId = `theme-desc-${theme.value}`;
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={t(theme.nameKey)}
      aria-describedby={descId}
      aria-hidden={offscreen || undefined}
      data-offscreen={offscreen}
      data-theme-option={theme.value}
      tabIndex={tabbable && !offscreen ? 0 : -1}
      {...pressHandlers}
      onKeyDown={(e) => {
        pressHandlers.onKeyDown(e);
        onKeyDown(e);
      }}
      onClick={onSelect}
      className={`theme-carousel-card clay-interactive relative text-left rounded-xl border bg-surface p-1.5 sm:p-2 ${
        selected ? 'border-primary ring-2 ring-primary' : 'border-border-subtle'
      } ${isPressed ? 'translate-y-px shadow-clay-pressed' : 'shadow-clay-card'} ${FOCUS_RING}`}
    >
      <ThemeMiniature theme={theme.value} />
      <span className="block px-1 pt-2 pb-0.5 min-w-0 text-[13px] sm:text-sm font-semibold text-text-primary leading-snug break-words">
        {t(theme.nameKey)}
      </span>
      <span id={descId} className="hidden sm:block px-1 pb-1 text-xs text-text-muted leading-snug">
        {t(theme.descKey)}
      </span>
    </button>
  );
});

/**
 * Miniature of the current Tango shell in the given theme (its own `data-theme`, so real tokens):
 * the brand top bar, the Vocabulary / Kanji category cards, and the Home / Test / Settings
 * navigation with Home active. Simple shapes only; the canvas motif hints at the ambience.
 */
const ThemeMiniature: React.FC<{ theme: AppTheme }> = ({ theme }) => (
  <span
    data-theme={theme}
    aria-hidden="true"
    className="relative block aspect-[4/5] rounded-lg overflow-hidden border border-border-subtle bg-page p-1.5 sm:p-2"
  >
    <MiniMotif theme={theme} />
    <span className="relative flex h-full flex-col gap-1 sm:gap-1.5">
      {/* Top bar: the Tango cat wordmark, the brand of every theme */}
      <span className="flex items-center h-3 sm:h-3.5 shrink-0" data-mini="topbar">
        <img src={tangoWordmark} alt="" draggable={false} className="block h-full w-auto" />
      </span>
      {/* Vocabulary / Kanji category cards */}
      <span className="grid grid-cols-2 gap-1 flex-1" data-mini="categories">
        <span className="rounded-md bg-category-vocabulary-surface border border-category-vocabulary-border flex items-start p-0.5">
          <span className="font-japanese text-[9px] sm:text-[10px] font-bold leading-none text-category-vocabulary-icon">語</span>
        </span>
        <span className="rounded-md bg-category-kanji-surface border border-category-kanji-border flex items-start p-0.5">
          <span className="font-japanese text-[9px] sm:text-[10px] font-bold leading-none text-category-kanji-icon">漢</span>
        </span>
      </span>
      {/* Primary navigation: Home (active) / Test / Settings */}
      <span
        data-mini="nav"
        className={`relative flex items-center justify-around shrink-0 h-4 sm:h-5 rounded-md bg-surface border shadow-clay-card ${
          theme === 'meo' ? 'border-[color:var(--meo-outline)]' : 'border-border-subtle'
        }`}
      >
        {theme === 'meo' && <MiniNavEars />}
        <span className="flex items-center justify-center h-3 sm:h-3.5 px-1 rounded-full bg-primary-surface text-primary">
          <IconHome size={9} stroke={2.4} />
        </span>
        <IconCards size={9} stroke={2.4} className="text-text-secondary" />
        <IconSettings size={9} stroke={2.4} className="text-text-secondary" />
      </span>
    </span>
  </span>
);

/** Meo's World preview: the mini navigation wears the same small cat ears as the real bar. */
const MiniNavEars: React.FC = () => (
  <svg viewBox="0 0 40 6" preserveAspectRatio="none" className="absolute left-1 right-1 -top-[5px] h-[5px] w-[calc(100%-8px)]" focusable="false">
    <path d="M4 6 L7 1 L10 6 Z M30 6 L33 1 L36 6 Z" fill="var(--meo-fur)" stroke="var(--meo-outline)" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

const MiniMotif: React.FC<{ theme: AppTheme }> = ({ theme }) => {
  if (theme === 'meo') {
    return (
      <svg viewBox="0 0 40 50" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" focusable="false">
        <circle cx="38" cy="4" r="14" fill="var(--meo-fur)" opacity="0.7" />
        <circle cx="2" cy="44" r="12" fill="var(--meo-cream)" opacity="0.8" />
        <g fill="var(--meo-outline)" opacity="0.3">
          <circle cx="4" cy="24" r="1.3" />
          <circle cx="36" cy="30" r="1.3" />
        </g>
      </svg>
    );
  }
  if (theme === 'light') {
    return (
      <svg viewBox="0 0 40 50" className="absolute -right-2 top-1 w-8 h-10" focusable="false">
        <rect x="2" y="2" width="36" height="46" rx="2" fill="var(--ambience-glow)" opacity="0.6" />
        <path d="M14 2 V48 M26 2 V48 M2 16 H38 M2 30 H38" stroke="var(--ambience-line)" strokeWidth="1.5" opacity="0.14" fill="none" />
      </svg>
    );
  }
  if (theme === 'dark') {
    return (
      <svg viewBox="0 0 40 40" className="absolute -right-2 -top-1 w-9 h-9" focusable="false">
        <circle cx="22" cy="18" r="11" fill="var(--ambience-glow)" opacity="0.16" />
        <circle cx="6" cy="34" r="1.6" fill="var(--ambience-accent)" opacity="0.7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className="absolute -right-1 -top-1 w-9 h-9" focusable="false">
      <path d="M40 6 C30 10 22 14 14 24" stroke="var(--ambience-line)" strokeWidth="2" opacity="0.3" fill="none" strokeLinecap="round" />
      {[
        [24, 16],
        [33, 9],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} fill="var(--ambience-accent)" opacity="0.7">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse key={angle} cx="0" cy="-2.5" rx="1.8" ry="2.6" transform={`rotate(${angle})`} />
          ))}
        </g>
      ))}
    </svg>
  );
};
