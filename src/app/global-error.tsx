'use client';

import ErrorState, { type BoundaryErrorProps } from '@/components/ui/error-state';

export default function GlobalError({ error, reset }: BoundaryErrorProps) {
  return (
    <html lang="es">
      <body>
        <ErrorState error={error} reset={reset} />
      </body>
    </html>
  );
}
