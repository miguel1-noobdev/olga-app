interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label = 'Cargando contenido' }: LoadingStateProps) {
  return (
    <main className="flex min-h-[50vh] w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-surface-container-low p-8 text-center shadow-sm sm:p-12"
      >
        <span
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
        />
        <p className="font-sans text-base text-on-surface-variant">{label}...</p>
      </div>
    </main>
  );
}
