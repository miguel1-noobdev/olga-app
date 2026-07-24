'use client';

import { useState, type ImgHTMLAttributes } from 'react';

interface ResilientImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src'> {
  alt: string;
  src?: string | null;
  fallbackLabel?: string;
}

export default function ResilientImage({
  alt,
  src,
  className,
  fallbackLabel = 'Imagen no disponible',
  ...props
}: ResilientImageProps) {
  const [hasFailed, setHasFailed] = useState(!src);

  if (hasFailed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-surface-container px-4 text-center text-sm text-on-surface-variant ${className ?? ''}`}
      >
        {fallbackLabel}
      </div>
    );
  }

  return <img {...props} src={src ?? undefined} alt={alt} className={className} onError={() => setHasFailed(true)} />;
}
