import Link from 'next/link';
import { FlaskIcon, ArrowLeftIcon } from '@/components/ui/icons';

export default function LaboratoryNotFound() {
  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="glass-card rounded-xl p-12 space-y-6">
          <FlaskIcon className="w-16 h-16 mx-auto text-on-surface-variant" />

          <h1 className="font-serif text-3xl text-on-surface">
            Laboratory resource not found
          </h1>

          <p className="font-sans text-on-surface-variant max-w-md mx-auto">
            The requested formula, lot, or reference does not exist or may have been removed.
          </p>

          <div className="pt-4">
            <Link
              href="/laboratorio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-sans text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to laboratory
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
