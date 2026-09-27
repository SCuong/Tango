import React, { forwardRef } from 'react';
import {
  CLAY_PRESSED_CLASSES,
  MIN_PRESS_FEEDBACK_MS,
  usePressFeedback,
} from '../hooks/usePressFeedback';

/** Shared focus ring (DESIGN_SYSTEM B6): primary ring with a 2px page-colored offset. */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  /** `lg` is the 52–56px primary action size; `md` is the 48px minimum touch target. */
  size?: 'md' | 'lg';
  onClick?: () => void;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Raised primary CTA: solid --cta-* surface on a depth lip (.cta-raised)
  primary: 'cta-raised bg-cta-surface border border-cta-border text-cta-text font-bold',
  // Restrained clay secondary control
  secondary: 'bg-surface border border-border-subtle text-text-primary font-semibold',
  // Destructive: semantic error colors, never the raised primary treatment
  danger: 'bg-error-surface border border-error-border text-error-text font-semibold',
  // Flat text action (tertiary)
  quiet: 'bg-transparent border border-transparent text-text-secondary font-semibold',
};

/**
 * Tango button with the canonical press model (DESIGN_SYSTEM §3.1): explicit pressed state from
 * `usePressFeedback`, hover only on fine pointers (`.clay-interactive`), drag-out cancels.
 * Primary buttons keep their press visible for MIN_PRESS_FEEDBACK_MS before acting.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    icon,
    trailingIcon,
    fullWidth = false,
    size = 'md',
    className = '',
    children,
    disabled,
    onClick,
    type = 'button',
    ...rest
  },
  ref
) {
  const isPrimary = variant === 'primary';
  const { isPressed, pressHandlers, runAfterPress } = usePressFeedback({
    minPressMs: isPrimary ? MIN_PRESS_FEEDBACK_MS : 0,
  });

  const pressClasses =
    variant === 'quiet'
      ? isPressed
        ? 'bg-surface-elevated'
        : ''
      : isPrimary
        ? ''
        : isPressed
          ? CLAY_PRESSED_CLASSES
          : 'shadow-clay-card';

  const sizeClasses =
    size === 'lg' ? 'min-h-[52px] px-5 text-base' : 'min-h-touch px-4 text-sm';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      {...(disabled ? {} : pressHandlers)}
      data-pressed={disabled ? 'false' : pressHandlers['data-pressed']}
      onClick={() => {
        if (disabled || !onClick) return;
        if (isPrimary) runAfterPress(onClick);
        else onClick();
      }}
      className={`${variant === 'quiet' ? 'flat-interactive' : 'clay-interactive'} inline-flex items-center justify-center gap-2 rounded-xl leading-snug text-center ${sizeClasses} ${VARIANT_CLASSES[variant]} ${pressClasses} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${FOCUS_RING} ${className}`}
      {...rest}
    >
      {icon && (
        <span className="shrink-0 inline-flex" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {trailingIcon && (
        <span className="shrink-0 inline-flex" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
});

export interface IconButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

/** 48px round clay icon button (back, close). Accessible name and native tooltip from `label`. */
export const IconButton: React.FC<IconButtonProps> = ({ label, icon, onClick, className = '' }) => {
  const { isPressed, pressHandlers } = usePressFeedback();
  return (
    <button
      type="button"
      {...pressHandlers}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`clay-interactive clay-hover-surface flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-surface border border-border-subtle text-text-primary ${isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${FOCUS_RING} ${className}`}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
    </button>
  );
};
