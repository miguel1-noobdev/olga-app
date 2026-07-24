'use client';

import ErrorState, { type BoundaryErrorProps } from '@/components/ui/error-state';

export default function Error({ error, reset }: BoundaryErrorProps) {
  return <ErrorState error={error} reset={reset} />;
}
