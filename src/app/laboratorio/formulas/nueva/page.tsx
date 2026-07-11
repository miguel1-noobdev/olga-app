import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/ui/icons';
import FormulaForm from '@/components/laboratorio/formula-form';
import { submitFormula } from './actions';

export default async function LaboratoryNewFormulaPage() {
  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/laboratorio/formulas"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to formulas
        </Link>

        <section className="glass-card rounded-xl p-8">
          <h1 className="font-serif text-3xl text-on-surface mb-2">New formula</h1>
          <p className="font-sans text-on-surface-variant mb-8">
            Register a new formula with its identity, classification, phases, and procedure.
          </p>

          <FormulaForm submitFormula={submitFormula} />
        </section>
      </div>
    </main>
  );
}
