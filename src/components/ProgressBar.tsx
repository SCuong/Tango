import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  ariaLabel?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  ariaLabel,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedValue}
      aria-label={ariaLabel}
      className={`w-full h-2 bg-surface-elevated rounded-full overflow-hidden border border-border-subtle ${className}`}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
