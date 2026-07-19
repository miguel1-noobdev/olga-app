import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/ui/icons';
import FormulaForm from '@/components/laboratorio/formula-form';
import { submitFormula } from './actions';

export default async function LaboratoryNewFormulaPage() {
  return (
    <main className="flex-1 min-w-0 container mx-auto w-full max-w-7xl px-6 py-6 md:px-8 lg:px-12">
      <div className="min-w-0">
        <header className="mb-8">
          <Link
            href="/laboratorio/formulas"
            className="mb-4 inline-flex items-center gap-2 text-sm font-label text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver a fórmulas
          </Link>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            Nueva fórmula
          </h1>
          <p className="mt-2 font-body text-on-surface-variant">
            Definición de parámetros, ingredientes y procedimientos de elaboración.
          </p>
        </header>

        <FormulaForm submitFormula={submitFormula} />
      </div>
    </main>
  );
}
