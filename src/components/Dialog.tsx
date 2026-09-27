import React, { useEffect, useId, useRef } from 'react';

/**
 * A pending marker pop (history.back() is asynchronous). Pushes of newly opened dialogs wait for
 * it, so two dialogs swapping in one render (e.g. explanation sheet → exit confirmation) never pop
 * each other's marker.
 */
let pendingPop: Promise<void> | null = null;

function popModalMarker(): Promise<void> {
  if (pendingPop) return pendingPop;
  pendingPop = new Promise<void>((resolve) => {
    const done = () => {
      window.removeEventListener('popstate', done);
      clearTimeout(timer);
      pendingPop = null;
      resolve();
    };
    const timer = setTimeout(done, 400);
    window.addEventListener('popstate', done);
    window.history.back();
  });
  return pendingPop;
}

/**
 * Browser Back closes an open dialog before navigating (SCREEN_SPEC §2.1): opening pushes a
 * same-URL history marker; a popstate that leaves the marker closes the dialog. Closing from the
 * UI pops the marker again so the history stays clean.
 */
function useModalHistory(open: boolean, requestClose: () => void): void {
  const key = useId();
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.history) return;

    if (open) {
      wasOpenRef.current = true;
      let cancelled = false;
      let pushed = false;
      const push = () => {
        if (cancelled) return;
        if (window.history.state?.tangoModal !== key) {
          window.history.pushState({ tangoModal: key }, '', window.location.href);
        }
        pushed = true;
      };
      // Defer the push until any marker pop scheduled in this same render has settled
      const timer = setTimeout(() => {
        if (pendingPop) void pendingPop.then(push);
        else push();
      }, 0);
      const onPopState = () => {
        if (pushed && window.history.state?.tangoModal !== key) requestCloseRef.current();
      };
      window.addEventListener('popstate', onPopState);
      return () => {
        cancelled = true;
        clearTimeout(timer);
        window.removeEventListener('popstate', onPopState);
      };
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (window.history.state?.tangoModal === key) void popModalMarker();
    }
    return undefined;
  }, [open, key]);
}

/**
 * Pops the current dialog history marker (if any) and resolves once the browser has settled.
 * Await it before navigating away from a dialog action (e.g. after a confirmed delete).
 */
export function dismissModalHistory(): Promise<void> {
  if (pendingPop) return pendingPop;
  if (typeof window === 'undefined' || !window.history?.state?.tangoModal) {
    return Promise.resolve();
  }
  return popModalMarker();
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name source: id of the visible title element. */
  labelledBy: string;
  describedBy?: string;
  /** Receives initial focus (e.g. the safe Cancel button of destructive dialogs). */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** `sheet` slides from the bottom on mobile; both are centered cards from `sm` up. */
  presentation?: 'modal' | 'sheet';
  /** Width of the centered card. */
  size?: 'md' | 'lg';
  /** Destructive dialogs keep a dimmed backdrop that does not dismiss on tap. */
  dismissOnBackdrop?: boolean;
  role?: 'dialog' | 'alertdialog';
  children: React.ReactNode;
}

/**
 * Opaque Tango dialog over a dimmed, lightly blurred backdrop (DESIGN_SYSTEM §2, §16.6).
 * Escape closes, Tab is trapped, focus starts on `initialFocusRef` and returns to the opener.
 */
export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  labelledBy,
  describedBy,
  initialFocusRef,
  presentation = 'modal',
  size = 'md',
  dismissOnBackdrop = true,
  role = 'dialog',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useModalHistory(open, onClose);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTarget =
      initialFocusRef?.current ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current;
    focusTarget?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
    // Focus handling runs once per opening
  }, [open]);

  if (!open) return null;

  const isSheet = presentation === 'sheet';

  return (
    <div
      data-tango-dialog="true"
      className={`fixed inset-0 z-50 flex justify-center ${isSheet ? 'items-end sm:items-center' : 'items-center'} p-0 ${isSheet ? '' : 'px-4'} sm:p-6`}
    >
      <div
        className="tango-backdrop absolute inset-0 backdrop-blur-sm"
        aria-hidden="true"
        onClick={dismissOnBackdrop ? () => onCloseRef.current() : undefined}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`tango-dialog-panel ${isSheet ? 'tango-sheet rounded-t-[26px] sm:rounded-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6' : 'rounded-2xl pb-6'} relative w-full ${size === 'lg' ? 'sm:max-w-lg' : 'sm:max-w-md'} ${isSheet ? '' : 'max-w-md'} max-h-[92vh] overflow-y-auto bg-surface border border-border-subtle shadow-clay-card px-5 pt-5 sm:px-6 sm:pt-6 focus:outline-none`}
      >
        {isSheet && (
          <div className="sm:hidden mx-auto -mt-1 mb-3 h-1.5 w-12 rounded-full bg-border-strong" aria-hidden="true" />
        )}
        {children}
      </div>
    </div>
  );
};
