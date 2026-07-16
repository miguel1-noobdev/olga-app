'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FormulaFormValues,
  FormulaPhaseKey,
  FormulaIngredientFormValue,
  FormulaProcedureStepFormValue,
  FormulaTechnicalDataFormValue,
  FormulaProductEvaluationFormValue,
  FormulaUseTestFormValue,
  FormulaUseTestEntryFormValue,
  FormulaInciFormValue,
  FormulaFormValidationError,
  SubmitFormulaResult,
  createEmptyFormulaForm,
  createEmptyUseTestEntry,
  DEFAULT_FORMULA_STATUS,
  validateMinimumFormulaForm,
} from '@/lib/formulas/formula-form-contract';
import { FORMULA_STATUSES, FormulaStatus } from '@/lib/formulas/formula-types';
import { FORMULA_STATUS_LABELS } from '@/components/laboratorio/shared-presentation';

export interface FormulaFormProps {
  mode?: 'create' | 'edit';
  formulaId?: string;
  initialValues?: FormulaFormValues;
  submitFormula: (values: FormulaFormValues) => Promise<SubmitFormulaResult>;
}

const PHASE_LABELS: Record<FormulaPhaseKey, string> = {
  aqueous: 'Aqueous phase',
  oil: 'Oil phase',
  actives: 'Actives phase',
};

function createLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createEmptyIngredient(): FormulaIngredientFormValue {
  return { id: createLocalId(), ingredient: '', grams: '' };
}

function createEmptyProcedureStep(stepNumber: number): FormulaProcedureStepFormValue {
  return { id: createLocalId(), stepNumber, instruction: '' };
}

function createEmptyObjective() {
  return { id: createLocalId(), value: '' };
}

function createEmptyUseTestEntryWithId(): FormulaUseTestEntryFormValue {
  return { id: createLocalId(), ...createEmptyUseTestEntry() };
}

function ensureFormulaFormValues(values: FormulaFormValues): FormulaFormValues {
  return {
    ...values,
    phases: {
      aqueous: values.phases.aqueous.map((item) => ({
        ...item,
        id: item.id ?? createLocalId(),
      })),
      oil: values.phases.oil.map((item) => ({
        ...item,
        id: item.id ?? createLocalId(),
      })),
      actives: values.phases.actives.map((item) => ({
        ...item,
        id: item.id ?? createLocalId(),
      })),
    },
    procedureSteps: values.procedureSteps.map((step) => ({
      ...step,
      id: step.id ?? createLocalId(),
    })),
    productObjectives: values.productObjectives.map((objective) => ({
      ...objective,
      id: objective.id ?? createLocalId(),
    })),
    useTest: {
      ...values.useTest,
      entries: values.useTest.entries.map((entry) => ({
        ...entry,
        id: entry.id ?? createLocalId(),
      })),
    },
  };
}

export default function FormulaForm({
  mode = 'create',
  initialValues,
  submitFormula,
}: FormulaFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormulaFormValues>(
    ensureFormulaFormValues(initialValues ?? createEmptyFormulaForm())
  );
  const [errors, setErrors] = useState<FormulaFormValidationError>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formLabel = mode === 'edit' ? 'Edit formula' : 'New formula';
  const submitButtonLabel = isSubmitting
    ? mode === 'edit'
      ? 'Updating...'
      : 'Saving...'
    : mode === 'edit'
      ? 'Update formula'
      : 'Save formula';

  function updateField<K extends keyof FormulaFormValues>(field: K, value: FormulaFormValues[K]) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  function updateIngredient(phase: FormulaPhaseKey, index: number, updates: Partial<FormulaIngredientFormValue>) {
    setValues((previous) => {
      const nextIngredients = [...previous.phases[phase]];
      nextIngredients[index] = { ...nextIngredients[index], ...updates };

      return {
        ...previous,
        phases: { ...previous.phases, [phase]: nextIngredients },
      };
    });
  }

  function addIngredient(phase: FormulaPhaseKey) {
    setValues((previous) => ({
      ...previous,
      phases: { ...previous.phases, [phase]: [...previous.phases[phase], createEmptyIngredient()] },
    }));
  }

  function removeIngredient(phase: FormulaPhaseKey, index: number) {
    setValues((previous) => {
      const nextIngredients = previous.phases[phase].filter((_, currentIndex) => currentIndex !== index);
      return { ...previous, phases: { ...previous.phases, [phase]: nextIngredients } };
    });
  }

  function updateProcedureStep(index: number, instruction: string) {
    setValues((previous) => {
      const nextSteps = [...previous.procedureSteps];
      nextSteps[index] = { ...nextSteps[index], instruction };
      return { ...previous, procedureSteps: nextSteps };
    });
  }

  function addProcedureStep() {
    setValues((previous) => ({
      ...previous,
      procedureSteps: [...previous.procedureSteps, createEmptyProcedureStep(previous.procedureSteps.length + 1)],
    }));
  }

  function removeProcedureStep(index: number) {
    setValues((previous) => {
      const nextSteps = previous.procedureSteps
        .filter((_, currentIndex) => currentIndex !== index)
        .map((step, currentIndex) => ({ ...step, stepNumber: currentIndex + 1 }));
      return { ...previous, procedureSteps: nextSteps };
    });
  }

  function updateProductObjective(index: number, value: string) {
    setValues((previous) => {
      const nextObjectives = [...previous.productObjectives];
      nextObjectives[index] = { ...nextObjectives[index], value };
      return { ...previous, productObjectives: nextObjectives };
    });
  }

  function addProductObjective() {
    setValues((previous) => ({
      ...previous,
        productObjectives: [
          ...previous.productObjectives,
          createEmptyObjective(),
        ],
      }));
  }

  function removeProductObjective(index: number) {
    setValues((previous) => ({
      ...previous,
      productObjectives: previous.productObjectives.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function updateTechnicalData(updates: Partial<FormulaTechnicalDataFormValue>) {
    setValues((previous) => ({
      ...previous,
      technicalData: { ...previous.technicalData, ...updates },
    }));
  }

  function updateProductEvaluation(updates: Partial<FormulaProductEvaluationFormValue>) {
    setValues((previous) => ({
      ...previous,
      productEvaluation: { ...previous.productEvaluation, ...updates },
    }));
  }

  function updateUseTest(updates: Partial<FormulaUseTestFormValue>) {
    setValues((previous) => ({
      ...previous,
      useTest: { ...previous.useTest, ...updates },
    }));
  }

  function updateUseTestEntry(index: number, updates: Partial<FormulaUseTestEntryFormValue>) {
    setValues((previous) => {
      const nextEntries = [...previous.useTest.entries];
      nextEntries[index] = { ...nextEntries[index], ...updates };
      return { ...previous, useTest: { ...previous.useTest, entries: nextEntries } };
    });
  }

  function addUseTestEntry() {
    setValues((previous) => ({
      ...previous,
      useTest: {
        ...previous.useTest,
        entries: [...previous.useTest.entries, createEmptyUseTestEntryWithId()],
      },
    }));
  }

  function removeUseTestEntry(index: number) {
    setValues((previous) => ({
      ...previous,
      useTest: {
        ...previous.useTest,
        entries: previous.useTest.entries.filter((_, currentIndex) => currentIndex !== index),
      },
    }));
  }

  function updateInci(updates: Partial<FormulaInciFormValue>) {
    setValues((previous) => ({
      ...previous,
      inci: { ...previous.inci, ...updates },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setErrors({});

    const validation = validateMinimumFormulaForm(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    const result = await submitFormula(values);
    setIsSubmitting(false);

    if (!result.success) {
      if ('errors' in result) {
        setErrors(result.errors);
      } else {
        setSubmitError(result.error);
      }
    }
    // Success is handled by the server action redirect.
  }

  function FieldError({ name }: { name: keyof FormulaFormValidationError }) {
    const message = errors[name];
    if (!message) return null;
    return <p className="mt-1.5 text-sm text-error">{message}</p>;
  }

  const inputBaseClassName =
    'w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

  const inputErrorClassName =
    'border-error focus:border-error focus:ring-error/50';

  function inputClassName(fieldName: keyof FormulaFormValidationError): string {
    return errors[fieldName]
      ? `${inputBaseClassName} ${inputErrorClassName}`
      : inputBaseClassName;
  }

  const labelClassName = 'block text-sm font-medium text-on-surface mb-2';

  return (
    <form onSubmit={handleSubmit} aria-label={formLabel} className="space-y-8">
      {submitError && (
        <div
          className="rounded-lg bg-error-container border border-error/30 p-4 text-sm text-on-error-container"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Identity</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="productName" className={labelClassName}>
              Product name
            </label>
            <input
              id="productName"
              type="text"
              value={values.productName}
              onChange={(event) => updateField('productName', event.target.value)}
              className={inputClassName('productName')}
              placeholder="e.g. Lavender cream"
            />
            <FieldError name="productName" />
          </div>

          <div>
            <label htmlFor="formulaCode" className={labelClassName}>
              Formula code
            </label>
            <input
              id="formulaCode"
              type="text"
              value={values.formulaCode}
              onChange={(event) => updateField('formulaCode', event.target.value)}
              className={inputClassName('formulaCode')}
              placeholder="e.g. CF-001"
            />
            <FieldError name="formulaCode" />
          </div>

          <div>
            <label htmlFor="formulaCreatedAt" className={labelClassName}>
              Created at
            </label>
            <input
              id="formulaCreatedAt"
              type="date"
              value={values.formulaCreatedAt}
              onChange={(event) => updateField('formulaCreatedAt', event.target.value)}
              className={inputClassName('formulaCreatedAt')}
            />
            <FieldError name="formulaCreatedAt" />
          </div>

          <div>
            <label htmlFor="formulaVersion" className={labelClassName}>
              Version
            </label>
            <input
              id="formulaVersion"
              type="text"
              value={values.formulaVersion}
              onChange={(event) => updateField('formulaVersion', event.target.value)}
              className={inputClassName('formulaVersion')}
            />
            <FieldError name="formulaVersion" />
          </div>
        </div>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Classification</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="productType" className={labelClassName}>
              Product type
            </label>
            <input
              id="productType"
              type="text"
              value={values.productType}
              onChange={(event) => updateField('productType', event.target.value)}
              className={inputClassName('productType')}
              placeholder="e.g. Cream"
            />
            <FieldError name="productType" />
          </div>

          <div>
            <label htmlFor="status" className={labelClassName}>
              Status
            </label>
            <select
              id="status"
              value={values.status}
              onChange={(event) => updateField('status', event.target.value as FormulaStatus)}
              className={inputBaseClassName}
            >
              {FORMULA_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {FORMULA_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Batch size</legend>

        <div>
          <label htmlFor="targetBatchGrams" className={labelClassName}>
            Target batch (grams)
          </label>
          <input
            id="targetBatchGrams"
            type="number"
            min={0}
            step={1}
            value={values.targetBatchGrams}
            onChange={(event) => updateField('targetBatchGrams', event.target.value === '' ? '' : Number(event.target.value))}
            className={`${inputClassName('targetBatchGrams')} sm:w-1/2`}
            placeholder="e.g. 500"
          />
          <FieldError name="targetBatchGrams" />
        </div>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-8">
        <legend className="font-headline text-xl text-on-surface px-2">Phases and ingredients</legend>

        <FieldError name="phases" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(['aqueous', 'oil', 'actives'] as FormulaPhaseKey[]).map((phase) => (
            <section key={phase} aria-labelledby={`${phase}-heading`} className="space-y-4">
              <h3 id={`${phase}-heading`} className="font-headline text-lg text-on-surface">
                {PHASE_LABELS[phase]}
              </h3>

              {values.phases[phase].length === 0 ? (
                <p className="text-sm text-on-surface-variant">No ingredients added yet.</p>
              ) : (
                <ul className="space-y-3">
                  {values.phases[phase].map((ingredient, index) => (
                    <li key={ingredient.id} className="flex gap-3 items-start">
                      <input
                        type="text"
                        value={ingredient.ingredient}
                        onChange={(event) => updateIngredient(phase, index, { ingredient: event.target.value })}
                        placeholder="Ingredient name"
                        aria-label={`${PHASE_LABELS[phase]} ingredient ${index + 1} name`}
                        className={inputBaseClassName}
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={ingredient.grams}
                        onChange={(event) =>
                          updateIngredient(phase, index, {
                            grams: event.target.value === '' ? '' : Number(event.target.value),
                          })
                        }
                        placeholder="g"
                        aria-label={`${PHASE_LABELS[phase]} ingredient ${index + 1} grams`}
                        className={`${inputBaseClassName} w-28 shrink-0`}
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(phase, index)}
                        className="px-3 py-3 text-sm text-error hover:text-on-error-container rounded-lg border border-surface-border hover:bg-error-container transition-colors"
                        aria-label={`Remove ${PHASE_LABELS[phase]} ingredient ${index + 1}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => addIngredient(phase)}
                className="text-sm font-medium text-primary hover:text-primary/80 underline"
              >
                + Add ingredient to {PHASE_LABELS[phase].toLowerCase()}
              </button>
            </section>
          ))}
        </div>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Procedure</legend>

        <FieldError name="procedureSteps" />

        <ol className="space-y-4">
          {values.procedureSteps.map((step, index) => (
            <li key={step.id} className="flex gap-3 items-start">
              <span className="mt-3 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center shrink-0">
                {step.stepNumber}
              </span>
              <textarea
                value={step.instruction}
                onChange={(event) => updateProcedureStep(index, event.target.value)}
                placeholder={`Step ${step.stepNumber} instruction`}
                aria-label={`Procedure step ${step.stepNumber}`}
                rows={2}
                className={inputBaseClassName}
              />
              <button
                type="button"
                onClick={() => removeProcedureStep(index)}
                className="px-3 py-3 text-sm text-error hover:text-on-error-container rounded-lg border border-surface-border hover:bg-error-container transition-colors"
                aria-label={`Remove procedure step ${step.stepNumber}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={addProcedureStep}
          className="text-sm font-medium text-primary hover:text-primary/80 underline"
        >
          + Add procedure step
        </button>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Product objectives</legend>

        {values.productObjectives.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No objectives added yet.</p>
        ) : (
          <ul className="space-y-3">
            {values.productObjectives.map((objective, index) => (
              <li key={objective.id} className="flex gap-3 items-start">
                <input
                  type="text"
                  value={objective.value}
                  onChange={(event) => updateProductObjective(index, event.target.value)}
                  placeholder="e.g. Hydrating"
                  aria-label={`Product objective ${index + 1}`}
                  className={inputBaseClassName}
                />
                <button
                  type="button"
                  onClick={() => removeProductObjective(index)}
                  className="px-3 py-3 text-sm text-error hover:text-on-error-container rounded-lg border border-surface-border hover:bg-error-container transition-colors"
                  aria-label={`Remove product objective ${index + 1}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={addProductObjective}
          className="text-sm font-medium text-primary hover:text-primary/80 underline"
        >
          + Add product objective
        </button>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Technical data</legend>

        <FieldError name="technicalData" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="technicalData-finalPh" className={labelClassName}>
              Final pH
            </label>
            <input
              id="technicalData-finalPh"
              type="number"
              min={0}
              step={0.01}
              value={values.technicalData.finalPh}
              onChange={(event) =>
                updateTechnicalData({
                  finalPh: event.target.value === '' ? '' : Number(event.target.value),
                })
              }
              className={inputBaseClassName}
              placeholder="e.g. 5.5"
            />
          </div>

          <div>
            <label htmlFor="technicalData-productionTemperatureCelsius" className={labelClassName}>
              Production temperature (°C)
            </label>
            <input
              id="technicalData-productionTemperatureCelsius"
              type="number"
              min={0}
              step={0.1}
              value={values.technicalData.productionTemperatureCelsius}
              onChange={(event) =>
                updateTechnicalData({
                  productionTemperatureCelsius:
                    event.target.value === '' ? '' : Number(event.target.value),
                })
              }
              className={inputBaseClassName}
              placeholder="e.g. 75"
            />
          </div>

          <div>
            <label htmlFor="technicalData-mixingTimeMinutes" className={labelClassName}>
              Mixing time (minutes)
            </label>
            <input
              id="technicalData-mixingTimeMinutes"
              type="number"
              min={0}
              step={1}
              value={values.technicalData.mixingTimeMinutes}
              onChange={(event) =>
                updateTechnicalData({
                  mixingTimeMinutes: event.target.value === '' ? '' : Number(event.target.value),
                })
              }
              className={inputBaseClassName}
              placeholder="e.g. 20"
            />
          </div>

          <div>
            <label htmlFor="technicalData-preservative" className={labelClassName}>
              Preservative
            </label>
            <input
              id="technicalData-preservative"
              type="text"
              value={values.technicalData.preservative}
              onChange={(event) => updateTechnicalData({ preservative: event.target.value })}
              className={inputBaseClassName}
            />
          </div>

          <div>
            <label htmlFor="technicalData-fragrance" className={labelClassName}>
              Fragrance
            </label>
            <input
              id="technicalData-fragrance"
              type="text"
              value={values.technicalData.fragrance}
              onChange={(event) => updateTechnicalData({ fragrance: event.target.value })}
              className={inputBaseClassName}
            />
          </div>

          <div>
            <label htmlFor="technicalData-color" className={labelClassName}>
              Color
            </label>
            <input
              id="technicalData-color"
              type="text"
              value={values.technicalData.color}
              onChange={(event) => updateTechnicalData({ color: event.target.value })}
              className={inputBaseClassName}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Product evaluation</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(
            [
              ['texture', 'Texture'],
              ['color', 'Color'],
              ['smell', 'Smell'],
              ['viscosity', 'Viscosity'],
              ['absorption', 'Absorption'],
              ['foam', 'Foam'],
              ['stability', 'Stability'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`productEvaluation-${key}`} className={labelClassName}>
                {label}
              </label>
              <input
                id={`productEvaluation-${key}`}
                type="text"
                value={values.productEvaluation[key]}
                onChange={(event) => updateProductEvaluation({ [key]: event.target.value })}
                className={inputBaseClassName}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Use test</legend>

        <FieldError name="useTest" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="useTest-approxExpirationDate" className={labelClassName}>
              Approximate expiration date
            </label>
            <input
              id="useTest-approxExpirationDate"
              type="date"
              value={values.useTest.approxExpirationDate}
              onChange={(event) => updateUseTest({ approxExpirationDate: event.target.value })}
              className={inputBaseClassName}
            />
          </div>
        </div>

        {values.useTest.entries.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No test entries added yet.</p>
        ) : (
          <ul className="space-y-4">
            {values.useTest.entries.map((entry, index) => (
              <li key={entry.id} className="flex gap-3 items-start">
                <input
                  type="date"
                  value={entry.date}
                  onChange={(event) => updateUseTestEntry(index, { date: event.target.value })}
                  aria-label={`Use test entry ${index + 1} date`}
                  className={`${inputBaseClassName} w-44 shrink-0`}
                />
                <textarea
                  value={entry.note}
                  onChange={(event) => updateUseTestEntry(index, { note: event.target.value })}
                  placeholder="Observation note"
                  aria-label={`Use test entry ${index + 1} note`}
                  rows={2}
                  className={inputBaseClassName}
                />
                <button
                  type="button"
                  onClick={() => removeUseTestEntry(index)}
                  className="px-3 py-3 text-sm text-error hover:text-on-error-container rounded-lg border border-surface-border hover:bg-error-container transition-colors"
                  aria-label={`Remove use test entry ${index + 1}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={addUseTestEntry}
          className="text-sm font-medium text-primary hover:text-primary/80 underline"
        >
          + Add use test entry
        </button>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">INCI</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(
            [
              ['function', 'Function'],
              ['emulsionType', 'Emulsion type'],
              ['dosage', 'Dosage'],
              ['temperature', 'Temperature'],
              ['compatibility', 'Compatibility'],
              ['inconveniences', 'Inconveniences'],
              ['ph', 'pH'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`inci-${key}`} className={labelClassName}>
                {label}
              </label>
              <input
                id={`inci-${key}`}
                type="text"
                value={values.inci[key]}
                onChange={(event) => updateInci({ [key]: event.target.value })}
                className={inputBaseClassName}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">Final observations</legend>

        <textarea
          id="finalObservations"
          value={values.finalObservations}
          onChange={(event) => updateField('finalObservations', event.target.value)}
          rows={4}
          className={inputBaseClassName}
          placeholder="Any closing notes about the formula"
          aria-label="Final observations"
        />
      </fieldset>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-primary text-on-primary rounded-full font-label text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitButtonLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 bg-surface-container-high text-on-surface border border-surface-border rounded-full font-label text-sm font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
