import React, { useRef, useState } from 'react';
import {
  IconAlertTriangle,
  IconChevronRight,
  IconCards,
  IconFolders,
  IconHome,
  IconSettings,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-react';
import {
  ANSWER_LAYOUTS,
  AnswerLayout,
  AppTheme,
  INCORRECT_FEEDBACK_STYLES,
  IncorrectFeedback,
  UserPreferences,
} from '../../types';
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
  // Special easter-egg theme: revealed in the third slot by the header action, never shown first
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

          <ThemePicker value={preferences.theme} onChange={(theme) => safeUpdate({ theme })} />

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

          <AnswerLayoutPicker value={preferences.answerLayout} onChange={(answerLayout) => safeUpdate({ answerLayout })} />

          <IncorrectFeedbackPicker
            value={preferences.incorrectFeedback}
            onChange={(incorrectFeedback) => safeUpdate({ incorrectFeedback })}
          />
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

const ANSWER_LAYOUT_LABELS: Record<AnswerLayout, TranslationKey> = {
  grid: 'preferences.answerLayout.grid',
  stacked: 'preferences.answerLayout.stacked',
};

/**
 * Answer layout for 4-option quiz questions: two small preview cards (a 2×2 grid, stacked rows).
 * The helper line explains the automatic per-question fallback of the grid.
 */
export const AnswerLayoutPicker: React.FC<{ value: AnswerLayout; onChange: (layout: AnswerLayout) => void }> = ({
  value,
  onChange,
}) => {
  const { t } = useI18n();
  return (
    <div>
      <p id="settings-answer-layout" className="text-sm font-semibold text-text-primary">
        {t('settings.answerLayout')}
      </p>
      <p id="settings-answer-layout-desc" className="text-xs text-text-muted mt-0.5 mb-2 leading-relaxed">
        {t('settings.answerLayoutDesc')}
      </p>
      <PreviewRadioGroup
        labelledBy="settings-answer-layout"
        optionAttribute="data-answer-layout-option"
        value={value}
        onChange={onChange}
        options={ANSWER_LAYOUTS.map((layout) => ({
          value: layout,
          label: t(ANSWER_LAYOUT_LABELS[layout]),
          describedBy: layout === 'grid' ? 'settings-answer-layout-desc' : undefined,
          preview: <AnswerLayoutMiniature layout={layout} />,
        }))}
      />
    </div>
  );
};

const INCORRECT_FEEDBACK_LABELS: Record<IncorrectFeedback, TranslationKey> = {
  popup: 'preferences.incorrectFeedback.popup',
  inline: 'preferences.incorrectFeedback.inline',
};

/**
 * How the explanation of a wrong answer is shown: a popup layer over the answers, or inline in a
 * dashed box below them. Two small preview cards, same treatment as the answer layout picker.
 */
export const IncorrectFeedbackPicker: React.FC<{
  value: IncorrectFeedback;
  onChange: (style: IncorrectFeedback) => void;
}> = ({ value, onChange }) => {
  const { t } = useI18n();
  return (
    <div>
      <p id="settings-incorrect-feedback" className="text-sm font-semibold text-text-primary mb-2">
        {t('settings.incorrectFeedback')}
      </p>
      <PreviewRadioGroup
        labelledBy="settings-incorrect-feedback"
        optionAttribute="data-incorrect-feedback-option"
        value={value}
        onChange={onChange}
        options={INCORRECT_FEEDBACK_STYLES.map((style) => ({
          value: style,
          label: t(INCORRECT_FEEDBACK_LABELS[style]),
          preview: <IncorrectFeedbackMiniature style={style} />,
        }))}
      />
    </div>
  );
};

interface PreviewOption<T extends string> {
  value: T;
  label: string;
  describedBy?: string;
  preview: React.ReactNode;
}

/**
 * A compact radio group of preview cards (miniature + label) for a Settings preference: one tab
 * stop, arrow keys move the selection, and the selected card gets the primary border and ring.
 */
export function PreviewRadioGroup<T extends string>({
  labelledBy,
  optionAttribute,
  value,
  onChange,
  options,
}: {
  labelledBy: string;
  /** Data attribute naming each card's value (e.g. `data-answer-layout-option`). */
  optionAttribute: `data-${string}`;
  value: T;
  onChange: (value: T) => void;
  options: PreviewOption<T>[];
}) {
  const refs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});
  const onKeyDown = (e: React.KeyboardEvent, current: T) => {
    const index = options.findIndex((option) => option.value === current);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % options.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    if (next >= 0) {
      e.preventDefault();
      onChange(options[next].value);
      refs.current[options[next].value]?.focus();
    }
  };
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {options.map((option) => (
        <PreviewCard
          key={option.value}
          ref={(el) => {
            refs.current[option.value] = el;
          }}
          value={option.value}
          label={option.label}
          describedBy={option.describedBy}
          dataAttributes={{ [optionAttribute]: option.value }}
          preview={option.preview}
          selected={value === option.value}
          onSelect={() => onChange(option.value)}
          onKeyDown={(e) => onKeyDown(e, option.value)}
        />
      ))}
    </div>
  );
}

const PreviewCard = React.forwardRef<
  HTMLButtonElement,
  {
    value: string;
    label: string;
    describedBy?: string;
    dataAttributes: Record<string, string>;
    preview: React.ReactNode;
    selected: boolean;
    onSelect: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  }
>(function PreviewCard({ label, describedBy, dataAttributes, preview, selected, onSelect, onKeyDown }, ref) {
  const { isPressed, pressHandlers } = usePressFeedback();
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      aria-describedby={describedBy}
      {...dataAttributes}
      tabIndex={selected ? 0 : -1}
      {...pressHandlers}
      onKeyDown={(e) => {
        pressHandlers.onKeyDown(e);
        onKeyDown(e);
      }}
      onClick={onSelect}
      className={`clay-interactive w-full min-h-[64px] rounded-xl border bg-surface p-2 flex items-center gap-2.5 text-left ${
        selected ? 'border-primary ring-2 ring-primary' : 'border-border-subtle'
      } ${isPressed ? 'translate-y-px shadow-clay-pressed' : 'shadow-clay-card'} ${FOCUS_RING}`}
    >
      {preview}
      <span className="min-w-0 text-[13px] sm:text-sm font-semibold text-text-primary leading-snug break-words">{label}</span>
    </button>
  );
});

/** Four answer tiles in the quiz answer colors: a 2×2 grid or four stacked rows. */
const AnswerLayoutMiniature: React.FC<{ layout: AnswerLayout }> = ({ layout }) => (
  <span
    aria-hidden="true"
    data-mini-layout={layout}
    className={`shrink-0 w-12 h-12 rounded-lg border border-border-subtle bg-page p-1.5 grid gap-1 ${
      layout === 'grid' ? 'grid-cols-2 grid-rows-2' : 'grid-rows-4'
    }`}
  >
    <span className="rounded-[3px] border bg-answer-1-bg border-answer-1-border" />
    <span className="rounded-[3px] border bg-answer-2-bg border-answer-2-border" />
    <span className="rounded-[3px] border bg-answer-3-bg border-answer-3-border" />
    <span className="rounded-[3px] border bg-answer-4-bg border-answer-4-border" />
  </span>
);

/**
 * Popup: dimmed answers behind a small floating explanation panel (a separate layer).
 * Inline: the answers stay as they are, and a dashed explanation box sits directly below them.
 * The panel / box shows a tiny error-colored heading line and two text lines.
 */
const IncorrectFeedbackMiniature: React.FC<{ style: IncorrectFeedback }> = ({ style }) => (
  <span
    aria-hidden="true"
    data-mini-feedback={style}
    className="relative shrink-0 w-12 h-12 rounded-lg border border-border-subtle bg-page p-1.5 flex flex-col gap-1 overflow-hidden"
  >
    {style === 'popup' ? (
      <>
        <span className="h-[5px] rounded-[2px] border bg-answer-1-bg border-answer-1-border opacity-50" />
        <span className="h-[5px] rounded-[2px] border bg-answer-2-bg border-answer-2-border opacity-50" />
        <span className="h-[5px] rounded-[2px] border bg-answer-3-bg border-answer-3-border opacity-50" />
        <span className="h-[5px] rounded-[2px] border bg-answer-4-bg border-answer-4-border opacity-50" />
        {/* The explanation as its own floating layer */}
        <span
          data-mini-part="popup-panel"
          className="absolute left-2 right-2 top-1/2 -translate-y-1/2 rounded-[4px] border border-text-muted bg-surface shadow-clay-card px-1 py-1 flex flex-col gap-[3px]"
        >
          <span className="h-[3px] w-3/5 rounded-full bg-error" />
          <span className="h-[2px] w-full rounded-full bg-text-muted opacity-70" />
          <span className="h-[2px] w-4/5 rounded-full bg-text-muted opacity-70" />
        </span>
      </>
    ) : (
      <>
        <span className="h-[5px] shrink-0 rounded-[2px] border bg-answer-1-bg border-answer-1-border" />
        <span className="h-[5px] shrink-0 rounded-[2px] border bg-answer-2-bg border-answer-2-border" />
        {/* The explanation directly below the answers, in a dashed box */}
        <span
          data-mini-part="inline-box"
          className="flex-1 min-h-0 rounded-[3px] border border-dashed border-text-muted px-1 py-[3px] flex flex-col gap-[3px]"
        >
          <span className="h-[3px] w-3/5 rounded-full bg-error" />
          <span className="h-[2px] w-full rounded-full bg-text-muted opacity-70" />
          <span className="h-[2px] w-4/5 rounded-full bg-text-muted opacity-70" />
        </span>
      </>
    )}
  </span>
);

/**
 * The picker always shows three card slots: Light and Dark stay fixed, and the third slot holds
 * either Sakura (default) or the Meo's World easter egg.
 */
export function slotThemes(meoRevealed: boolean): AppTheme[] {
  return ['light', 'dark', meoRevealed ? 'meo' : 'sakura'];
}

/** A persisted Meo's World opens Settings with it already revealed in the third slot. */
export function initialMeoRevealed(theme: AppTheme): boolean {
  return theme === 'meo';
}

const THEME_BY_VALUE = Object.fromEntries(THEMES.map((theme) => [theme.value, theme])) as Record<
  AppTheme,
  (typeof THEMES)[number]
>;

/**
 * Theme previews: each miniature sets its own `data-theme`, so it renders with that theme's real
 * tokens. The round header toggle (a cat, then a sakura blossom) swaps only the third slot between
 * Sakura and Meo's World with a vertical reel transition; it never selects a theme.
 */
export const ThemePicker: React.FC<{
  value: AppTheme;
  onChange: (theme: AppTheme) => void;
  /** Reveal state for this Settings visit; defaults to revealed only for a persisted Meo's World. */
  initialRevealed?: boolean;
}> = ({ value, onChange, initialRevealed }) => {
  const { t } = useI18n();
  const refs = useRef<Partial<Record<AppTheme, HTMLButtonElement | null>>>({});
  const [meoRevealed, setMeoRevealed] = useState(() => initialRevealed ?? initialMeoRevealed(value));
  const visible = slotThemes(meoRevealed);
  const tabbable = visible.includes(value) ? value : visible[0];

  // Roving radio focus among the three visible cards; revealing is only done with the header action
  const onKeyDown = (e: React.KeyboardEvent, theme: AppTheme) => {
    const index = visible.indexOf(theme);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % visible.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + visible.length) % visible.length;
    if (next >= 0) {
      e.preventDefault();
      onChange(visible[next]);
      refs.current[visible[next]]?.focus();
    }
  };

  const card = (theme: AppTheme, hidden = false) => (
    <ThemeCard
      ref={(el) => {
        refs.current[theme] = el;
      }}
      theme={THEME_BY_VALUE[theme]}
      selected={value === theme}
      offscreen={hidden}
      tabbable={tabbable === theme}
      onSelect={() => onChange(theme)}
      onKeyDown={(e) => onKeyDown(e, theme)}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p id="settings-theme" className="text-sm font-semibold text-text-primary">
          {t('settings.theme')}
        </p>
        <RevealToggle revealed={meoRevealed} onToggle={() => setMeoRevealed((revealed) => !revealed)} />
      </div>
      <div role="radiogroup" aria-labelledby="settings-theme" className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {card('light')}
        {card('dark')}
        <ThemeSlot id="settings-theme-slot" showSecond={meoRevealed}>
          {card('sakura', meoRevealed)}
          {card('meo', !meoRevealed)}
        </ThemeSlot>
      </div>
    </div>
  );
};

/**
 * One reel slot that swaps between two cards vertically. Both cards share the slot's grid cell, so
 * its size never changes; the first card rests below when hidden and the second rests above, so
 * revealing the second moves the first down and out while the second drops in from above, and
 * going back reverses it. The slot clips the travel to its own bounds (plus room for the card
 * ring and shadow); nothing around it moves.
 */
const ThemeSlot: React.FC<{ id: string; showSecond: boolean; children: [React.ReactNode, React.ReactNode] }> = ({
  id,
  showSecond,
  children,
}) => (
  <div id={id} className="theme-slot" data-show={showSecond ? 'second' : 'first'}>
    <div className="theme-slot-item" data-slot={showSecond ? 'below' : 'shown'}>
      {children[0]}
    </div>
    <div className="theme-slot-item" data-slot={showSecond ? 'shown' : 'above'}>
      {children[1]}
    </div>
  </div>
);

/**
 * Small round header toggle that swaps the third slot between Sakura and Meo's World; it never
 * selects a theme. It shows a cat while Sakura is in the slot and a sakura blossom once Meo's
 * World is revealed (the icon names what pressing brings into the slot).
 */
const RevealToggle: React.FC<{ revealed: boolean; onToggle: () => void }> = ({ revealed, onToggle }) => {
  const { t } = useI18n();
  const { isPressed, pressHandlers } = usePressFeedback();
  // The icon pops only after a press, never on first render
  const [swapped, setSwapped] = useState(false);
  const label = t(revealed ? 'settings.themeBack' : 'settings.themeMore');
  return (
    <button
      type="button"
      {...pressHandlers}
      onClick={() => {
        setSwapped(true);
        onToggle();
      }}
      aria-label={label}
      title={label}
      aria-controls="settings-theme-slot"
      data-theme-reveal={revealed ? 'back' : 'more'}
      className={`theme-reveal-toggle shrink-0 -my-3 -mr-1.5 w-12 h-12 flex items-center justify-center rounded-full ${FOCUS_RING}`}
    >
      <span
        aria-hidden="true"
        className={`theme-reveal-puck flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-border-subtle ${
          isPressed ? 'translate-y-px shadow-clay-pressed' : 'shadow-clay-card'
        }`}
      >
        {/* Keyed so the new icon pops in on every swap */}
        <span key={revealed ? 'sakura' : 'cat'} className={swapped ? 'theme-reveal-icon theme-reveal-icon-pop flex' : 'theme-reveal-icon flex'} data-reveal-icon={revealed ? 'sakura' : 'cat'}>
          {revealed ? <SakuraBlossomIcon /> : <SmirkCatIcon />}
        </span>
      </span>
    </button>
  );
};

/** Smirking Tango-style cat face (the Meo's World hint), in the mascot's own colors. */
const SmirkCatIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" focusable="false">
    <g stroke="var(--brand-outline)" strokeWidth="1.4" strokeLinejoin="round" fill="var(--brand-fur)">
      <path d="M4.8 10 L5.8 3.6 L10.4 6.8 Z" />
      <path d="M19.2 10 L18.2 3.6 L13.6 6.8 Z" />
      <path d="M3.4 14.2 C3.4 9.3 7.2 6.2 12 6.2 C16.8 6.2 20.6 9.3 20.6 14.2 C20.6 18.6 16.8 21 12 21 C7.2 21 3.4 18.6 3.4 14.2 Z" />
    </g>
    <path d="M10.8 7.2 L11.2 9.6 M12 7 V9.4 M13.2 7.2 L12.8 9.6" stroke="var(--brand-stripe)" strokeWidth="1.2" strokeLinecap="round" />
    <ellipse cx="12" cy="16.6" rx="4.2" ry="2.8" fill="var(--brand-cream)" />
    <g stroke="var(--brand-outline)" strokeWidth="1.3" strokeLinecap="round" fill="none">
      <path d="M7.4 12.6 Q9 11.4 10.6 12.4" />
      <path d="M13.4 12.4 Q15 11.4 16.6 12.6" />
      <path d="M10.2 16.8 Q12.2 18.1 14.6 16" />
    </g>
    <path d="M11.2 14.7 H12.8 L12 15.6 Z" fill="var(--brand-outline)" />
  </svg>
);

/** Pink five-petal sakura blossom (brings Sakura back into the slot). */
const SakuraBlossomIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" focusable="false">
    <g fill="var(--brand-sakura-petal)" stroke="var(--brand-sakura-edge)" strokeWidth="0.9" strokeLinejoin="round">
      {[0, 72, 144, 216, 288].map((angle) => (
        <path key={angle} d="M12 12 C9.4 10.4 9 6.6 10.4 3.8 L12 5.2 L13.6 3.8 C15 6.6 14.6 10.4 12 12 Z" transform={`rotate(${angle} 12 12)`} />
      ))}
    </g>
    <circle cx="12" cy="12" r="2" fill="var(--brand-sakura-core)" />
    <g fill="var(--brand-sakura-edge)">
      {[36, 108, 180, 252, 324].map((angle) => (
        <circle key={angle} cx="12" cy="8.6" r="0.7" transform={`rotate(${angle} 12 12)`} />
      ))}
    </g>
  </svg>
);

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
      className={`clay-interactive relative w-full h-full text-left rounded-xl border bg-surface p-1.5 sm:p-2 ${
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
