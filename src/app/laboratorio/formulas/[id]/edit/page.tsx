import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { ArrowLeftIcon } from '@/components/ui/icons';
import FormulaForm from '@/components/laboratorio/formula-form';
import { toFormulaFormValues } from '@/lib/formulas/formula-form-contract';
import { submitFormulaUpdate } from './actions';

interface PageProps {
  params: { id: string };
}

export default async function LaboratoryEditFormulaPage({ params }: PageProps) {
  await connectToDatabase();
  const repository = createFormulaRepository();
  const formula = await repository.findById(params.id);

  if (!formula) {
    notFound();
  }

  const initialValues = toFormulaFormValues(formula);

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/laboratorio/formulas"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to formulas
        </Link>

        <section className="bg-surface-container border border-surface-border rounded-2xl p-8">
          <h1 className="font-headline text-3xl text-on-surface mb-2">Edit formula</h1>
          <p className="font-body text-on-surface-variant mb-8">
            Update the formula identity, classification, phases, and procedure.
          </p>

          <FormulaForm
            mode="edit"
            formulaId={params.id}
            initialValues={initialValues}
            submitFormula={(values) => submitFormulaUpdate(params.id, values)}
          />
        </section>
      </div>
    </main>
  );
}
