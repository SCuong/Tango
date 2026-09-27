import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Compact inline empty state rendered as a recessed clay "shelf" that sits
 * inside the section it belongs to, instead of a floating centered card.
 * The icon puck and text share one row; the action aligns under the text on
 * mobile and to the right on wider viewports.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-surface-elevated border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-clay-pressed flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {icon && (
          <div
            className="w-11 h-11 rounded-xl bg-surface border border-border-subtle shadow-clay-card text-text-secondary flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold leading-snug text-text-primary">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={`${icon ? 'ml-14 sm:ml-0' : ''} self-start sm:self-center shrink-0 inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-surface border border-border-subtle text-text-primary text-sm font-semibold shadow-clay-card hover:shadow-clay-card-hover hover:-translate-y-px active:translate-y-px active:shadow-clay-pressed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page min-h-touch`}
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
};
