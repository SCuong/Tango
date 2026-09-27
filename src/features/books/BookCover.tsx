import React, { useState, useEffect } from 'react';
import { IconBook } from '@tabler/icons-react';
import { getCoverBlob } from '../../lib/storage';
import { useI18n } from '../../hooks/useI18n';

export interface BookCoverProps {
  coverImageId?: string;
  title: string;
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  coverImageId,
  title,
  className = '',
}) => {
  const { t } = useI18n();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!coverImageId) {
      setImageUrl(null);
      return;
    }

    let isMounted = true;
    let currentUrl: string | null = null;

    getCoverBlob(coverImageId)
      .then((blob) => {
        if (!isMounted) return;
        if (blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          try {
            currentUrl = URL.createObjectURL(blob);
            setImageUrl(currentUrl);
          } catch {
            setImageUrl(null);
          }
        } else {
          setImageUrl(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setImageUrl(null);
        }
      });

    return () => {
      isMounted = false;
      if (currentUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(currentUrl);
        } catch {
          // Ignore revocation errors on unmount
        }
      }
    };
  }, [coverImageId]);

  if (imageUrl) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-surface-elevated ${className}`}>
        <img
          src={imageUrl}
          alt={t('aria.bookCover', { title })}
          className="w-full h-full object-cover"
          onError={() => setImageUrl(null)}
        />
      </div>
    );
  }

  // Documented theme-aware clay placeholder (IconBook, no emoji)
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-surface-elevated text-text-muted border border-border-subtle ${className}`}
      aria-hidden="true"
    >
      <IconBook size={28} stroke={1.5} className="text-text-muted" />
    </div>
  );
};
