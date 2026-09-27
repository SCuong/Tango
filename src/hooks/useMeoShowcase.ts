import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Meo's World Home showcase (DESIGN_SYSTEM §9.4): on a touch device, a long press on empty Home
 * canvas hides the interface so the background artwork can be enjoyed; a single tap brings the UI
 * back. The gesture never blocks scrolling (no preventDefault on pointer down, no pointer capture)
 * and never starts on an interactive element.
 */

/** Hold time before the showcase opens. */
export const SHOWCASE_HOLD_MS = 550;

/** Movement (px) that turns a pending hold into a scroll/drag and cancels it. */
export const SHOWCASE_MOVE_TOLERANCE = 10;

/** Anything a user can act on (or the fixed chrome) never starts the showcase gesture. */
export const SHOWCASE_BLOCKING_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="radio"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
  '.tango-topbar',
  '.tango-bottom-nav',
].join(', ');

interface ClosestTarget {
  closest: (selector: string) => unknown;
}

/** True when a press that starts on `target` may open the showcase (empty, non-interactive canvas). */
export function isShowcaseTarget(target: unknown): boolean {
  if (!target || typeof (target as ClosestTarget).closest !== 'function') return false;
  return !(target as ClosestTarget).closest(SHOWCASE_BLOCKING_SELECTOR);
}

/** Only touch and pen presses count; mouse users never trigger the long press. */
export function isShowcasePointer(pointerType: string, isPrimary = true): boolean {
  return isPrimary && (pointerType === 'touch' || pointerType === 'pen');
}

export interface LongPressController {
  /** A hold is in progress (started and not yet completed or cancelled). */
  readonly pending: boolean;
  start: (x: number, y: number) => void;
  /** Cancels the pending hold once the pointer moves beyond the tolerance. Returns true if cancelled. */
  move: (x: number, y: number) => boolean;
  cancel: () => void;
}

/**
 * Framework-free long-press timing: a hold completes after `holdMs` unless it is cancelled or the
 * pointer moves more than `tolerance` px from where it started.
 */
export function createLongPressController(options: {
  holdMs: number;
  tolerance: number;
  onLongPress: () => void;
  schedule?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  unschedule?: (handle: ReturnType<typeof setTimeout>) => void;
}): LongPressController {
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const unschedule = options.unschedule ?? ((handle) => clearTimeout(handle));
  let timer: ReturnType<typeof setTimeout> | null = null;
  let origin: { x: number; y: number } | null = null;

  const cancel = () => {
    if (timer !== null) unschedule(timer);
    timer = null;
    origin = null;
  };

  return {
    get pending() {
      return timer !== null;
    },
    start(x, y) {
      cancel();
      origin = { x, y };
      timer = schedule(() => {
        timer = null;
        origin = null;
        options.onLongPress();
      }, options.holdMs);
    },
    move(x, y) {
      if (!origin) return false;
      if (Math.hypot(x - origin.x, y - origin.y) > options.tolerance) {
        cancel();
        return true;
      }
      return false;
    },
    cancel,
  };
}

/**
 * Exit guard for the full-screen layer shown during the showcase: only a tap that both starts and
 * ends on the layer exits, so the lift of the long press that opened the showcase never counts, and
 * the tap never reaches the hidden UI underneath.
 */
export function createShowcaseExitGuard() {
  let armed = false;
  return {
    pointerDown() {
      armed = true;
    },
    /** Returns true when this click should exit the showcase. */
    click() {
      const exit = armed;
      armed = false;
      return exit;
    },
  };
}

export interface ShowcaseHold {
  x: number;
  y: number;
  key: number;
  done: boolean;
}

export function useMeoShowcase(enabled: boolean) {
  const [active, setActive] = useState(false);
  const [hold, setHold] = useState<ShowcaseHold | null>(null);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const controllerRef = useRef<LongPressController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createLongPressController({
      holdMs: SHOWCASE_HOLD_MS,
      tolerance: SHOWCASE_MOVE_TOLERANCE,
      onLongPress: () => {
        setActive(true);
        // A tiny pop on the hold indicator, then it goes away
        setHold((current) => (current ? { ...current, done: true } : null));
        popTimer.current = setTimeout(() => setHold(null), 260);
      },
    });
  }
  const controller = controllerRef.current;

  const cancelHold = useCallback(() => {
    if (controller.pending) {
      controller.cancel();
      setHold(null);
    }
  }, [controller]);

  const exit = useCallback(() => setActive(false), []);

  // Leaving Meo's World (or Home unmounting) always returns to the normal UI
  useEffect(() => {
    if (!enabled) {
      controller.cancel();
      setHold(null);
      setActive(false);
    }
  }, [enabled, controller]);

  // Scrolling, losing focus, or unmounting cancels a pending hold
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onScroll = () => cancelHold();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('blur', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('blur', onScroll);
      controller.cancel();
      if (popTimer.current !== null) clearTimeout(popTimer.current);
    };
  }, [cancelHold, controller]);

  // Page-level flags drive the CSS: the whole UI (including the bottom nav) hides while active,
  // and browser long-press callouts are suppressed only on the Home canvas during a pending hold.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    if (active) root.setAttribute('data-meo-showcase', '');
    else root.removeAttribute('data-meo-showcase');
    return () => root.removeAttribute('data-meo-showcase');
  }, [active]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    if (hold && !hold.done) root.setAttribute('data-meo-holding', '');
    else root.removeAttribute('data-meo-holding');
    return () => root.removeAttribute('data-meo-holding');
  }, [hold]);

  // Escape exits for keyboard users; focus is never trapped
  useEffect(() => {
    if (!active || typeof window === 'undefined') return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  const zoneHandlers = enabled
    ? {
        'data-meo-showcase-zone': '',
        onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
          if (active || !isShowcasePointer(e.pointerType, e.isPrimary) || !isShowcaseTarget(e.target)) return;
          controller.start(e.clientX, e.clientY);
          setHold((current) => ({ x: e.clientX, y: e.clientY, key: (current?.key ?? 0) + 1, done: false }));
        },
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
          if (controller.move(e.clientX, e.clientY)) setHold(null);
        },
        onPointerUp: cancelHold,
        onPointerCancel: cancelHold,
        onPointerLeave: cancelHold,
        onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
          // Only the showcase gesture's own long press is kept free of the browser callout
          if (controller.pending || active) e.preventDefault();
        },
      }
    : {};

  return { active, hold, exit, zoneHandlers };
}
