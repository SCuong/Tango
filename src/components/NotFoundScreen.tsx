import React from 'react';
import { IconHome, IconMoodEmpty } from '@tabler/icons-react';
import { useI18n } from '../hooks/useI18n';
import { useNavigation } from '../hooks/useNavigation';
import { Screen, ScreenHeader } from './Screen';
import { Button } from './Button';

/**
 * Calm fallback for unknown routes or deleted content (e.g. a bookmarked lesson that was removed).
 * Never exposes management actions; offers a safe way home.
 */
export const NotFoundScreen: React.FC<{ message?: string; onBack?: () => void; title?: string }> = ({
  message,
  onBack,
  title,
}) => {
  const { t } = useI18n();
  const { replace } = useNavigation();
  const goHome = () => replace({ type: 'home' });
  return (
    <Screen
      width="2xl"
      onEscape={onBack ?? goHome}
      header={<ScreenHeader title={title ?? t('app.name')} onBack={onBack ?? goHome} width="2xl" />}
    >
      <div className="bg-surface-elevated border border-border-subtle rounded-2xl shadow-clay-pressed p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <span
          aria-hidden="true"
          className="w-11 h-11 rounded-xl bg-surface border border-border-subtle shadow-clay-card text-text-secondary flex items-center justify-center shrink-0"
        >
          <IconMoodEmpty size={22} stroke={1.75} />
        </span>
        <p className="flex-1 text-sm sm:text-base text-text-secondary leading-relaxed">
          {message ?? t('state.notFound')}
        </p>
        <Button icon={<IconHome size={18} stroke={2} />} onClick={goHome} className="self-start sm:self-center">
          {t('nav.home')}
        </Button>
      </div>
    </Screen>
  );
};
