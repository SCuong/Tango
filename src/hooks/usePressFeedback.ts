import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tailwind classes applied while a clay control is explicitly pressed.
 * Components swap their resting shadow for these instead of relying on CSS `:active`,
 * which mobile browsers can leave stuck after a touch is dragged off and released.
 */
export const CLAY_PRESSED_CLASSES = 'translate-y-px shadow-clay-pressed';

/**
 * Minimum time a primary action stays visibly pressed before its action runs, so a quick tap
 * still shows the pressed state. Longer presses are never delayed.
 */
export const MIN_PRESS_FEEDBACK_MS = 100;

interface RectLike {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Returns true when the point lies inside the rectangle (edges inclusive). */
export function isPointInsideRect(x: number, y: number, rect: RectLike): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * Only a primary mouse button, a touch contact, or a pen contact starts a press.
 * Right/middle mouse buttons never show pressed depth.
 */
export function shouldStartPress(pointerType: string, button: number): boolean {
  return pointerType !== 'mouse' || button === 0;
}

/**
 * Remaining milliseconds a press must stay visible. Returns 0 when there was no press
 * (e.g. keyboard Enter), when no minimum is requested, or when the press already lasted long enough.
 */
export function remainingPressFeedbackMs(
  pressStartedAt: number | null,
  now: number,
  minPressMs: number
): number {
  if (pressStartedAt === null || minPressMs <= 0) return 0;
  return Math.max(0, minPressMs - (now - pressStartedAt));
}

const now = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

export interface PressFeedbackHandlers<T extends HTMLElement> {
  'data-pressed': 'true' | 'false';
  onPointerDown: (e: React.PointerEvent<T>) => void;
  onPointerMove: (e: React.PointerEvent<T>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent<T>) => void;
  onKeyUp: (e: React.KeyboardEvent<T>) => void;
  onBlur: () => void;
}

export interface PressFeedbackOptions {
  /**
   * Minimum visible press duration in ms (use `MIN_PRESS_FEEDBACK_MS` for primary actions).
   * When set, a completed press stays pressed until the minimum has elapsed, and actions passed
   * to `runAfterPress` wait for the same moment. Defaults to 0 (release immediately).
   */
  minPressMs?: number;
}

type PressPhase = 'idle' | 'pressing' | 'holding';

/**
 * Explicit pressed state for tactile clay controls.
 *
 * The press starts on pointer down (or Space) and is cancelled on pointer cancel, pointer
 * leave, pointer moving outside the control, blur, or a release anywhere outside the element.
 * A completed release (pointer up / Space up on the control) ends the press immediately, or,
 * with `minPressMs`, keeps it visible until the minimum duration has elapsed ("holding").
 * Pointer capture is intentionally not used so native click cancellation on drag-out keeps
 * working unchanged.
 */
export function usePressFeedback<T extends HTMLElement = HTMLButtonElement>(
  options: PressFeedbackOptions = {}
): {
  isPressed: boolean;
  pressHandlers: PressFeedbackHandlers<T>;
  /** Runs `action` once the minimum press feedback has been visible (immediately if already met). */
  runAfterPress: (action: () => void) => void;
} {
  const { minPressMs = 0 } = options;
  const [isPressed, setIsPressed] = useState(false);

  const phaseRef = useRef<PressPhase>('idle');
  const pressStartRef = useRef<number | null>(null);
  const elementRef = useRef<T | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const setPhase = useCallback((phase: PressPhase) => {
    phaseRef.current = phase;
    setIsPressed(phase !== 'idle');
  }, []);

  const start = (element: T) => {
    clearHoldTimer();
    elementRef.current = element;
    pressStartRef.current = now();
    setPhase('pressing');
  };

  // Abort an in-progress press (drag-out, cancel, blur). A press that is already
  // completed and only held for visibility is left to finish on its own.
  const cancel = useCallback(() => {
    if (phaseRef.current !== 'pressing') return;
    pressStartRef.current = null;
    setPhase('idle');
  }, [setPhase]);

  // Successful release on the control: end now, or hold until the minimum has elapsed.
  const finish = () => {
    if (phaseRef.current !== 'pressing') return;
    const remaining = remainingPressFeedbackMs(pressStartRef.current, now(), minPressMs);
    if (remaining <= 0) {
      setPhase('idle');
      return;
    }
    phaseRef.current = 'holding';
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setPhase('idle');
    }, remaining);
  };

  // While pressing, a release or key-up outside the element (or losing the window) cancels it
  useEffect(() => {
    if (!isPressed || typeof window === 'undefined') return;

    const cancelIfOutside = (e: Event) => {
      const target = e.target as Node | null;
      if (target && elementRef.current?.contains(target)) return;
      cancel();
    };

    window.addEventListener('pointerup', cancelIfOutside);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keyup', cancelIfOutside);
    window.addEventListener('blur', cancel);

    return () => {
      window.removeEventListener('pointerup', cancelIfOutside);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keyup', cancelIfOutside);
      window.removeEventListener('blur', cancel);
    };
  }, [isPressed, cancel]);

  // Never fire a pending action or state update after unmount
  useEffect(
    () => () => {
      clearHoldTimer();
      if (actionTimerRef.current !== null) clearTimeout(actionTimerRef.current);
    },
    []
  );

  const runAfterPress = useCallback(
    (action: () => void) => {
      const remaining = remainingPressFeedbackMs(pressStartRef.current, now(), minPressMs);
      pressStartRef.current = null;
      if (actionTimerRef.current !== null) clearTimeout(actionTimerRef.current);
      if (remaining <= 0) {
        action();
        return;
      }
      actionTimerRef.current = setTimeout(() => {
        actionTimerRef.current = null;
        action();
      }, remaining);
    },
    [minPressMs]
  );

  const pressHandlers: PressFeedbackHandlers<T> = {
    'data-pressed': isPressed ? 'true' : 'false',
    onPointerDown: (e) => {
      if (shouldStartPress(e.pointerType, e.button)) {
        start(e.currentTarget);
      }
    },
    // Touch pointers are implicitly captured by the pressed element, so `pointerleave`
    // may not fire while dragging out; compare the position to the element bounds instead.
    onPointerMove: (e) => {
      if (
        phaseRef.current === 'pressing' &&
        !isPointInsideRect(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())
      ) {
        cancel();
      }
    },
    onPointerUp: finish,
    onPointerCancel: cancel,
    // On touch, pointerleave also fires right after a successful pointerup; `cancel` ignores
    // it then because the press is already completed.
    onPointerLeave: cancel,
    onKeyDown: (e) => {
      if (e.key === ' ' && !e.repeat) {
        start(e.currentTarget);
      }
    },
    onKeyUp: (e) => {
      if (e.key === ' ') {
        finish();
      }
    },
    onBlur: cancel,
  };

  return { isPressed, pressHandlers, runAfterPress };
}
