import React from 'react';
import { IconArrowLeft, IconX } from '@tabler/icons-react';
import { useI18n } from '../hooks/useI18n';
import { IconButton } from './Button';
import { useEscapeKey } from './Screen';

export interface ModalRouteProps {
  titleId: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Primary actions: sticky bottom bar on mobile, panel footer from `sm` up. */
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
  /** Root destinations (Settings): no mobile back arrow; the bottom nav is the way out. */
  hideMobileBack?: boolean;
}

/**
 * Route that is a full-screen page on mobile and a centered panel over a dimmed canvas from
 * `sm` up (SCREEN 18 Add Study Book). Escape and the backdrop close it.
 */
export const ModalRoute: React.FC<ModalRouteProps> = ({
  titleId,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  hideMobileBack = false,
}) => {
  const { t } = useI18n();
  useEscapeKey(onClose);
  return (
    <div className="min-h-screen bg-page text-text-primary flex flex-col sm:flex-row sm:items-center sm:justify-center sm:p-6">
      <div className="hidden sm:block tango-backdrop fixed inset-0" aria-hidden="true" onClick={onClose} />
      <div
        role="region"
        aria-labelledby={titleId}
        className={`relative flex-1 sm:flex-none w-full ${size === 'lg' ? 'sm:max-w-lg' : 'sm:max-w-md'} flex flex-col bg-page sm:bg-surface sm:border sm:border-border-subtle sm:rounded-2xl sm:shadow-clay-card sm:max-h-[calc(100vh-3rem)] sm:overflow-y-auto tango-route-panel`}
      >
        <header className="tango-topbar sticky top-0 z-10 bg-page sm:bg-surface pt-[env(safe-area-inset-top)] sm:pt-0">
          <div className="px-4 sm:px-6 min-h-[64px] flex items-center gap-3 sm:border-b sm:border-border-subtle">
            {!hideMobileBack && (
              <span className="sm:hidden">
                <IconButton label={t('nav.back')} icon={<IconArrowLeft size={22} stroke={2} />} onClick={onClose} />
              </span>
            )}
            <h1 id={titleId} className="flex-1 text-lg sm:text-xl font-bold text-text-primary leading-snug">
              {title}
            </h1>
            <span className="hidden sm:block">
              <IconButton label={t('action.close')} icon={<IconX size={22} stroke={2} />} onClick={onClose} />
            </span>
          </div>
        </header>
        <div className="flex-1 px-4 sm:px-6 pt-3 sm:pt-5 pb-6">{children}</div>
        {footer && (
          <div className="tango-bottombar sticky bottom-0 z-10 bg-page sm:bg-surface px-4 sm:px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 sm:border-t sm:border-border-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
