import React, { useState, useEffect, useRef } from 'react';
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
  const activeUrlRef = useRef<string | null>(null);

  const revokeActiveUrl = () => {
    if (activeUrlRef.current) {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(activeUrlRef.current);
        } catch {
          // Ignore revocation errors
        }
      }
      activeUrlRef.current = null;
    }
  };

  useEffect(() => {
    // Immediately clear previously displayed image state and revoke any active URL
    // so a revoked or stale image is not retained in UI state while loading new cover
    revokeActiveUrl();
    setImageUrl(null);

    if (!coverImageId) {
      return;
    }

    let isCancelled = false;

    getCoverBlob(coverImageId)
      .then((blob) => {
        if (isCancelled) return;
        if (blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          try {
            const url = URL.createObjectURL(blob);
            if (isCancelled) {
              URL.revokeObjectURL(url);
              return;
            }
            activeUrlRef.current = url;
            setImageUrl(url);
          } catch {
            revokeActiveUrl();
            setImageUrl(null);
          }
        } else {
          revokeActiveUrl();
          setImageUrl(null);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          revokeActiveUrl();
          setImageUrl(null);
        }
      });

    return () => {
      isCancelled = true;
      revokeActiveUrl();
    };
  }, [coverImageId]);

  const handleImageError = () => {
    // Revoke current object URL before falling back to placeholder
    revokeActiveUrl();
    setImageUrl(null);
  };

  if (imageUrl) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-surface-elevated ${className}`}>
        <img
          src={imageUrl}
          alt={t('aria.bookCover', { title })}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>
    );
  }

  // Documented theme-aware clay placeholder (IconBook, no emoji) with a book-spine band
  return (
    <div
      className={`w-full h-full relative flex items-center justify-center bg-primary-surface text-primary ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-y-0 left-0 w-1.5 bg-primary-border" />
      <IconBook size={24} stroke={1.5} />
    </div>
  );
};
