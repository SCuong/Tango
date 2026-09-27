import React, { useEffect, useRef } from 'react';
import { IconArrowLeft } from '@tabler/icons-react';
import { useI18n } from '../hooks/useI18n';
import { IconButton } from './Button';
import { ThemeAmbience } from './ThemeAmbience';

/** Canvas widths (DESIGN_SYSTEM B9): browsing 4xl, focused study/config 2xl–3xl, quiz xl. */
export type ScreenWidth = 'xl' | '2xl' | '3xl' | '4xl';

const WIDTH_CLASSES: Record<ScreenWidth, string> = {
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

/** True while any Tango dialog is open; screen-level Escape handling defers to it. */
export function isDialogOpen(): boolean {
  return typeof document !== 'undefined' && document.querySelector('[data-tango-dialog]') !== null;
}

/** Runs `handler` on Escape unless a dialog is open (dialogs handle their own Escape). */
export function useEscapeKey(handler: (() => void) | undefined): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !handlerRef.current || e.defaultPrevented) return;
      if (isDialogOpen()) return;
      e.preventDefault();
      handlerRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

export interface ScreenHeaderProps {
  title: React.ReactNode;
  /** Optional context line (e.g. book · category breadcrumb). */
  subtitle?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  /** Replaces the back arrow (e.g. a close `IconX`). */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  width?: ScreenWidth;
  /** Title language hint for Japanese book titles. */
  titleClassName?: string;
}

/**
 * Restrained sticky header for sub-screens: back arrow, screen title, optional trailing action.
 * Opaque page canvas with a soft page-colored feather instead of a hard divider (B11).
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backLabel,
  leading,
  trailing,
  width = '4xl',
  titleClassName = '',
}) => {
  const { t } = useI18n();
  return (
    <header className="tango-topbar w-full bg-page sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
      <div className={`${WIDTH_CLASSES[width]} mx-auto px-4 min-h-[64px] py-2 flex items-center gap-3`}>
        {leading ??
          (onBack && (
            <IconButton
              label={backLabel ?? t('nav.back')}
              icon={<IconArrowLeft size={22} stroke={2} />}
              onClick={onBack}
            />
          ))}
        <div className="flex-1 min-w-0">
          <h1
            className={`font-study-title font-bold text-text-primary text-lg sm:text-xl leading-snug truncate ${titleClassName}`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="font-study-title text-xs sm:text-sm text-text-secondary leading-snug truncate">
              {subtitle}
            </p>
          )}
        </div>
        {trailing && <div className="shrink-0 flex items-center gap-2">{trailing}</div>}
      </div>
    </header>
  );
};

export interface ScreenProps {
  header: React.ReactNode;
  children: React.ReactNode;
  width?: ScreenWidth;
  /**
   * Restrained theme ambience behind content (study browsing and quiz setup screens only).
   * Secondary screens use the subtle variant so motifs never compete with text on the canvas.
   */
  ambience?: boolean;
  /** Mobile sticky action bar; dissolves into document flow from `sm` up. */
  bottomBar?: React.ReactNode;
  /** Escape navigates back (SCREEN_SPEC keyboard matrix). */
  onEscape?: () => void;
  mainClassName?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  header,
  children,
  width = '4xl',
  ambience = false,
  bottomBar,
  onEscape,
  mainClassName = '',
}) => {
  useEscapeKey(onEscape);
  return (
    <div className="min-h-screen bg-page text-text-primary flex flex-col">
      {ambience && <ThemeAmbience subtle />}
      {header}
      <main
        className={`relative flex-1 w-full ${WIDTH_CLASSES[width]} mx-auto px-4 pt-3 sm:pt-5 ${bottomBar ? 'pb-4' : 'pb-10 sm:pb-14'} ${mainClassName}`}
      >
        {children}
      </main>
      {bottomBar}
    </div>
  );
};

export interface StickyBottomBarProps {
  children: React.ReactNode;
  width?: ScreenWidth;
  /** Hide the bar from `sm` up (when the action moves into the header on larger screens). */
  mobileOnly?: boolean;
}

/**
 * Mobile-only affixed action bar respecting the bottom safe area; from `sm` up it returns to
 * normal document flow under the content (SCREEN_SPEC §3).
 */
export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({ children, width = '2xl', mobileOnly = false }) => (
  <div
    className={`tango-bottombar sticky bottom-0 z-20 bg-page sm:static sm:bg-transparent pb-[env(safe-area-inset-bottom)] ${mobileOnly ? 'sm:hidden' : ''}`}
  >
    <div className={`${WIDTH_CLASSES[width]} mx-auto px-4 pt-3 pb-4 sm:pt-0 sm:pb-12`}>{children}</div>
  </div>
);

/** Small uppercase section label used above lists and control groups. */
export const SectionLabel: React.FC<{ children: React.ReactNode; id?: string; className?: string }> = ({
  children,
  id,
  className = '',
}) => (
  <h2
    id={id}
    className={`text-xs font-semibold uppercase tracking-wider text-text-muted leading-relaxed ${className}`}
  >
    {children}
  </h2>
);
