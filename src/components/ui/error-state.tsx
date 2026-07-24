'use client';

export interface BoundaryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorStateProps extends BoundaryErrorProps {
  title?: string;
  description?: string;
}

export default function ErrorState({
  error,
  reset,
  title = 'No pudimos cargar esta sección',
  description = 'Ocurrió un problema inesperado. Podés intentar de nuevo.',
}: ErrorStateProps) {
  // The error is intentionally accepted for the App Router contract but never rendered.
  void error;

  return (
    <main className="flex min-h-[50vh] w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <section
        role="alert"
        aria-live="assertive"
        aria-labelledby="boundary-error-title"
        className="w-full max-w-xl rounded-2xl border border-error/30 bg-error-container p-6 text-center shadow-sm sm:p-10"
      >
        <h1 id="boundary-error-title" className="font-serif text-2xl text-on-error-container sm:text-3xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-base leading-7 text-on-error-container">
          {description}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 font-sans text-sm font-semibold text-on-primary transition-colors hover:bg-primary-dim focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          Intentar de nuevo
        </button>
      </section>
    </main>
  );
}
