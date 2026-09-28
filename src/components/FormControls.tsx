import React, { useRef } from 'react';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../hooks/usePressFeedback';
import { FOCUS_RING } from './Button';

/* ==========================================================================
   SegmentedControl — real radio group with a raised clay active pill
   ========================================================================== */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  labelledBy?: string;
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  labelledBy,
  ariaLabel,
  className = '',
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  // Arrow keys move and select within the radio group (roving tabindex)
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % options.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    if (next >= 0) {
      e.preventDefault();
      onChange(options[next].value);
      refs.current[next]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      className={`grid gap-1 p-1 rounded-2xl bg-surface-elevated border border-border-subtle shadow-clay-pressed ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => (
        <SegmentButton
          key={option.value}
          ref={(el) => {
            refs.current[index] = el;
          }}
          option={option}
          selected={option.value === value}
          onSelect={() => onChange(option.value)}
          onKeyDown={(e) => onKeyDown(e, index)}
        />
      ))}
    </div>
  );
}

const SegmentButton = React.forwardRef<
  HTMLButtonElement,
  {
    option: SegmentedOption<string>;
    selected: boolean;
    onSelect: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  }
>(function SegmentButton({ option, selected, onSelect, onKeyDown }, ref) {
  const { isPressed, pressHandlers } = usePressFeedback();
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      {...pressHandlers}
      onKeyDown={(e) => {
        pressHandlers.onKeyDown(e);
        onKeyDown(e);
      }}
      onClick={onSelect}
      className={`min-h-touch px-3 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold leading-snug transition-colors ${
        selected
          ? `bg-surface text-text-primary border border-border-subtle ${isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'}`
          : `text-text-secondary border border-transparent ${isPressed ? 'bg-surface' : ''}`
      } ${FOCUS_RING}`}
    >
      {option.icon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {option.icon}
        </span>
      )}
      <span className="min-w-0 truncate">{option.label}</span>
    </button>
  );
});

/* ==========================================================================
   CheckboxRow — flat touch row with a visible check square
   ========================================================================== */

export interface CheckboxRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  meta?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const CheckboxRow: React.FC<CheckboxRowProps> = ({
  checked,
  onChange,
  label,
  meta,
  disabled = false,
  className = '',
}) => {
  const { pressHandlers } = usePressFeedback();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      {...pressHandlers}
      onClick={() => onChange(!checked)}
      className={`flat-interactive w-full min-h-touch px-3 py-2.5 flex items-center gap-3 text-left rounded-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${FOCUS_RING} ${className}`}
    >
      <CheckSquare checked={checked} />
      <span className="flex-1 min-w-0 font-study-title text-sm sm:text-[15px] text-text-primary leading-snug break-words">
        {label}
      </span>
      {meta && <span className="shrink-0 text-xs sm:text-sm text-text-muted whitespace-nowrap">{meta}</span>}
    </button>
  );
};

export const CheckSquare: React.FC<{ checked: boolean }> = ({ checked }) => (
  <span
    aria-hidden="true"
    className={`w-6 h-6 shrink-0 rounded-sm border-2 flex items-center justify-center transition-colors ${
      checked ? 'bg-primary border-primary text-page' : 'bg-surface border-border-strong text-transparent'
    }`}
  >
    <IconCheck size={16} stroke={3} />
  </span>
);

/* ==========================================================================
   Text and select fields (flat form inputs, radius-md)
   ========================================================================== */

const INPUT_CLASSES =
  'w-full min-h-touch rounded-md bg-surface border px-3.5 py-2.5 text-base text-text-primary placeholder:text-text-muted leading-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  className = '',
  ...rest
}) => {
  const describedBy = [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ');
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-text-primary mb-1.5 leading-snug">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        aria-required={required || undefined}
        className={`${INPUT_CLASSES} font-study-title ${error ? 'border-error' : 'border-border-strong'}`}
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-text-muted leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-error-text font-medium leading-relaxed" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  className = '',
}) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-semibold text-text-primary mb-1.5 leading-snug">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLASSES} font-study-title appearance-none pr-10 border-border-strong`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        size={18}
        stroke={2}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
      />
    </div>
  </div>
);
