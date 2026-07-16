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
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a fórmulas
        </Link>

        <section className="bg-surface-container border border-surface-border rounded-2xl p-8">
          <h1 className="font-headline text-3xl text-on-surface mb-2">Nueva fórmula</h1>
          <p className="font-body text-on-surface-variant mb-8">
            Registrar una nueva fórmula con su identidad, clasificación, fases y procedimiento.
          </p>

          <FormulaForm submitFormula={submitFormula} />
        </section>
      </div>
    </main>
  );
}
