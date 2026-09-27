import React, { useCallback, useEffect, useState } from 'react';

/**
 * Tailwind classes applied while a clay control is explicitly pressed.
 * Components swap their resting shadow for these instead of relying on CSS `:active`,
 * which mobile browsers can leave stuck after a touch is dragged off and released.
 */
export const CLAY_PRESSED_CLASSES = 'translate-y-px shadow-clay-pressed';

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

/**
 * Explicit pressed state for tactile clay controls.
 *
 * The press starts on pointer down (or Space) and is cleared on pointer up, pointer
 * cancel, pointer leave, pointer moving outside the control, blur, or a release
 * anywhere in the window. Pointer capture is intentionally not used so native
 * click cancellation on drag-out keeps working unchanged.
 */
export function usePressFeedback<T extends HTMLElement = HTMLButtonElement>(): {
  isPressed: boolean;
  pressHandlers: PressFeedbackHandlers<T>;
} {
  const [isPressed, setIsPressed] = useState(false);

  const release = useCallback(() => setIsPressed(false), []);

  // While pressed, any release outside the element (or losing the window) clears it
  useEffect(() => {
    if (!isPressed || typeof window === 'undefined') return;

    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('keyup', release);
    window.addEventListener('blur', release);

    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('keyup', release);
      window.removeEventListener('blur', release);
    };
  }, [isPressed, release]);

  const pressHandlers: PressFeedbackHandlers<T> = {
    'data-pressed': isPressed ? 'true' : 'false',
    onPointerDown: (e) => {
      if (shouldStartPress(e.pointerType, e.button)) {
        setIsPressed(true);
      }
    },
    // Touch pointers are implicitly captured by the pressed element, so `pointerleave`
    // may not fire while dragging out; compare the position to the element bounds instead.
    onPointerMove: (e) => {
      if (isPressed && !isPointInsideRect(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())) {
        setIsPressed(false);
      }
    },
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release,
    onKeyDown: (e) => {
      if (e.key === ' ' && !e.repeat) {
        setIsPressed(true);
      }
    },
    onKeyUp: (e) => {
      if (e.key === ' ') {
        setIsPressed(false);
      }
    },
    onBlur: release,
  };

  return { isPressed, pressHandlers };
}
