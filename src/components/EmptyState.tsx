import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-surface border border-border-subtle rounded-2xl p-6 text-center shadow-clay-card ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-elevated border border-border-subtle shadow-sm text-text-muted flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-text-primary">
        {title}
      </h3>
      <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-4">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated hover:shadow-clay-card-hover hover:-translate-y-px active:translate-y-px active:shadow-clay-pressed border border-border-subtle text-text-primary text-sm font-medium transition-all shadow-clay-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-touch"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};
