import React, { useId, useRef } from 'react';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  /** Error message shown when the confirmed action failed. */
  error?: string | null;
}

/**
 * Destructive confirmation (DIALOG_SCREENS global invariants): Cancel always holds initial focus,
 * so Enter dismisses; Escape dismisses; the red delete action is spatially separated
 * (stacked with a 16px gap under Cancel on mobile, on the opposite side from sm up) and never
 * uses the raised primary treatment.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  children,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  busy = false,
  error,
}) => {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onCancel}
      labelledBy={titleId}
      describedBy={bodyId}
      initialFocusRef={cancelRef}
      dismissOnBackdrop={false}
      role="alertdialog"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="w-10 h-10 shrink-0 rounded-xl bg-error-surface border border-error-border text-error-text flex items-center justify-center"
        >
          <IconAlertTriangle size={22} stroke={2} />
        </span>
        <h2 id={titleId} className="pt-1.5 text-lg font-bold text-text-primary leading-snug">
          {title}
        </h2>
      </div>
      <div id={bodyId} className="mt-4 space-y-3 text-sm sm:text-[15px] text-text-secondary leading-relaxed">
        {children}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-error-text leading-relaxed">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:gap-6">
        <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy} className="sm:min-w-[9rem]" fullWidth>
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          icon={<IconTrash size={18} stroke={2} />}
          onClick={onConfirm}
          disabled={busy}
          className="sm:w-auto sm:min-w-[9rem]"
          fullWidth
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
};
