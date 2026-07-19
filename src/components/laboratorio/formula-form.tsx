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
  aqueous: 'Fase acuosa',
  oil: 'Fase oleosa',
  actives: 'Fase activos',
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

  const formLabel = mode === 'edit' ? 'Editar fórmula' : 'Nueva fórmula';
  const submitButtonLabel = isSubmitting
    ? mode === 'edit'
      ? 'Actualizando...'
      : 'Guardando...'
    : mode === 'edit'
      ? 'Actualizar fórmula'
      : 'Guardar fórmula';

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

    if (result.success) {
      router.push(result.redirectTo);
      return;
    }

    if ('errors' in result) {
      setErrors(result.errors);
    } else {
      setSubmitError(result.error);
    }
  }

  function FieldError({ name }: { name: keyof FormulaFormValidationError }) {
    const message = errors[name];
    if (!message) return null;
    return <p className="mt-1.5 text-sm text-error">{message}</p>;
  }

  const inputBaseClassName =
    'w-full min-w-0 bg-surface-container-high border border-outline-variant rounded px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors';

  const inputErrorClassName =
    'border-error focus:border-error focus:ring-error/50';

  function inputClassName(fieldName: keyof FormulaFormValidationError): string {
    return errors[fieldName]
      ? `${inputBaseClassName} ${inputErrorClassName}`
      : inputBaseClassName;
  }

  const labelClassName =
    'mb-1 block text-xs font-label uppercase tracking-wide text-on-surface-variant';
  const cardClassName =
    'min-w-0 overflow-hidden rounded-lg border border-outline-variant bg-surface-container p-5 shadow-lg md:p-6';
  const headingClassName =
    'flex items-center border-b border-outline-variant pb-3 text-lg font-bold uppercase tracking-wide text-primary';

  return (
    <form onSubmit={handleSubmit} aria-label={formLabel} className="w-full min-w-0 space-y-6">
      {submitError && (
        <div
          className="rounded border border-error/30 bg-error-container p-4 text-sm text-on-error-container"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <fieldset className={cardClassName}>
        <legend className="sr-only">Información básica de la fórmula</legend>
        <h2 className={headingClassName}>
          <span className="material-symbols-outlined mr-2 text-primary" aria-hidden="true">
            science
          </span>
          Información básica de la fórmula
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <fieldset className="contents">
            <legend className="sr-only">Identidad</legend>
            <div className="md:col-span-2 lg:col-span-2">
              <label htmlFor="productName" className={labelClassName}>
                Nombre del producto
              </label>
              <input
                id="productName"
                type="text"
                value={values.productName}
                onChange={(event) => updateField('productName', event.target.value)}
                className={inputClassName('productName')}
                placeholder="p. ej., Crema de lavanda"
              />
              <FieldError name="productName" />
            </div>

            <div>
              <label htmlFor="formulaCode" className={labelClassName}>
                Código de fórmula
              </label>
              <input
                id="formulaCode"
                type="text"
                value={values.formulaCode}
                onChange={(event) => updateField('formulaCode', event.target.value)}
                className={inputClassName('formulaCode')}
                placeholder="p. ej., CF-001"
              />
              <FieldError name="formulaCode" />
            </div>

            <div>
              <label htmlFor="formulaVersion" className={labelClassName}>
                Versión
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

            <div>
              <label htmlFor="formulaCreatedAt" className={labelClassName}>
                Fecha de elaboración
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
          </fieldset>

          <fieldset className="contents">
            <legend className="sr-only">Clasificación</legend>
            <div className="md:col-span-2 lg:col-span-2">
              <label htmlFor="productType" className={labelClassName}>
                Tipo de producto
              </label>
              <input
                id="productType"
                type="text"
                value={values.productType}
                onChange={(event) => updateField('productType', event.target.value)}
                className={inputClassName('productType')}
                placeholder="p. ej., Crema"
              />
              <FieldError name="productType" />
            </div>

            <div className="md:col-span-2 lg:col-span-2">
              <label htmlFor="status" className={labelClassName}>
                Estado
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
          </fieldset>

          <fieldset className="contents">
            <legend className="sr-only">Tamaño del lote</legend>
            <div>
              <label htmlFor="targetBatchGrams" className={labelClassName}>
                Lote objetivo (g)
              </label>
              <input
                id="targetBatchGrams"
                type="number"
                min={0}
                step={1}
                value={values.targetBatchGrams}
                onChange={(event) =>
                  updateField('targetBatchGrams', event.target.value === '' ? '' : Number(event.target.value))
                }
                className={inputClassName('targetBatchGrams')}
                placeholder="p. ej., 500"
              />
              <FieldError name="targetBatchGrams" />
            </div>
          </fieldset>

          <fieldset className="contents md:col-span-2 lg:col-span-2">
            <legend className="sr-only">Objetivos del producto</legend>
            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="text-xs font-label uppercase tracking-wide text-on-surface-variant">
                  Objetivo del producto
                </h3>
              </div>
              {values.productObjectives.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Todavía no se agregaron objetivos.</p>
              ) : (
                <ul className="space-y-3">
                  {values.productObjectives.map((objective, index) => (
                    <li
                      key={objective.id}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                    >
                      <input
                        type="text"
                        value={objective.value}
                        onChange={(event) => updateProductObjective(index, event.target.value)}
                        placeholder="p. ej., Hidratante"
                        aria-label={`Objetivo del producto ${index + 1}`}
                        className={inputBaseClassName}
                      />
                      <button
                        type="button"
                        onClick={() => removeProductObjective(index)}
                        className="w-full rounded border border-outline-variant px-3 py-2.5 text-sm text-error transition-colors hover:bg-error-container hover:text-on-error-container sm:w-auto"
                        aria-label={`Eliminar objetivo del producto ${index + 1}`}
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={addProductObjective}
                className="mt-3 inline-flex items-center gap-1 rounded border border-primary-dim px-3 py-2 text-sm text-primary transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  add
                </span>
                + Agregar objetivo del producto
              </button>
            </div>
          </fieldset>
        </div>
      </fieldset>

      <fieldset className={cardClassName}>
        <legend className="sr-only">Fases e ingredientes</legend>
        <h2 className={`${headingClassName} text-secondary`}>
          <span className="material-symbols-outlined mr-2 text-sm" aria-hidden="true">
            water_drop
          </span>
          Fases e ingredientes
        </h2>

        <FieldError name="phases" />

        <div className="mt-5 space-y-4">
          {(['aqueous', 'oil', 'actives'] as FormulaPhaseKey[]).map((phase) => (
            <section
              key={phase}
              aria-labelledby={`${phase}-heading`}
              className="min-w-0 rounded border border-outline-variant/50 bg-surface-container-lowest p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3
                  id={`${phase}-heading`}
                  className="font-label text-sm font-bold uppercase tracking-wide text-on-surface"
                >
                  {PHASE_LABELS[phase]}
                </h3>
                <button
                  type="button"
                  onClick={() => addIngredient(phase)}
                  className="inline-flex items-center gap-1 text-xs text-on-surface-variant transition-colors hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    add
                  </span>
                  Fila
                </button>
              </div>

              {values.phases[phase].length === 0 ? (
                <p className="text-sm text-on-surface-variant">Todavía no se agregaron ingredientes.</p>
              ) : (
                <ul className="space-y-3">
                  {values.phases[phase].map((ingredient, index) => (
                    <li
                      key={ingredient.id}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end"
                    >
                      <input
                        type="text"
                        value={ingredient.ingredient}
                        onChange={(event) => updateIngredient(phase, index, { ingredient: event.target.value })}
                        placeholder="Nombre del ingrediente"
                        aria-label={`Nombre del ingrediente ${index + 1} de la ${PHASE_LABELS[phase].toLowerCase()}`}
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
                        aria-label={`Gramos del ingrediente ${index + 1} de la ${PHASE_LABELS[phase].toLowerCase()}`}
                        className={inputBaseClassName}
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(phase, index)}
                        className="w-full rounded border border-outline-variant px-3 py-2.5 text-sm text-error transition-colors hover:bg-error-container hover:text-on-error-container sm:w-auto"
                        aria-label={`Eliminar ingrediente ${index + 1} de la ${PHASE_LABELS[phase].toLowerCase()}`}
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => addIngredient(phase)}
                className="mt-3 text-sm font-medium text-primary underline hover:text-primary/80"
              >
                + Agregar ingrediente a {PHASE_LABELS[phase].toLowerCase()}
              </button>
            </section>
          ))}
        </div>
      </fieldset>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <fieldset className={cardClassName}>
          <legend className="sr-only">Procedimiento</legend>
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant pb-3">
            <h2 className="flex items-center font-headline text-lg font-bold uppercase tracking-wide text-tertiary">
              <span className="material-symbols-outlined mr-2 text-sm" aria-hidden="true">
                format_list_numbered
              </span>
              Procedimiento
            </h2>
            <button
              type="button"
              onClick={addProcedureStep}
              aria-label="+ Agregar paso de procedimiento"
              className="inline-flex items-center gap-1 rounded border border-primary-dim px-2 py-1 text-xs text-primary transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                add
              </span>
              Paso
            </button>
          </div>

          <FieldError name="procedureSteps" />

          <ol className="mt-5 space-y-3">
            {values.procedureSteps.map((step, index) => (
              <li
                key={step.id}
                className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5rem_minmax(0,1fr)_auto] sm:items-start"
              >
                <span className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-container-high text-sm font-medium text-on-surface-variant">
                  {step.stepNumber}
                </span>
                <textarea
                  value={step.instruction}
                  onChange={(event) => updateProcedureStep(index, event.target.value)}
                  placeholder={`Instrucción del paso ${step.stepNumber}`}
                  aria-label={`Paso de procedimiento ${step.stepNumber}`}
                  rows={2}
                  className={inputBaseClassName}
                />
                <button
                  type="button"
                  onClick={() => removeProcedureStep(index)}
                  className="w-full rounded border border-outline-variant px-3 py-2.5 text-sm text-error transition-colors hover:bg-error-container hover:text-on-error-container sm:w-auto"
                  aria-label={`Eliminar paso de procedimiento ${step.stepNumber}`}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ol>
        </fieldset>

        <fieldset className={cardClassName}>
          <legend className="sr-only">Datos técnicos</legend>
          <h2 className={headingClassName}>
            <span className="material-symbols-outlined mr-2 text-sm" aria-hidden="true">
              tune
            </span>
            Datos técnicos
          </h2>

          <FieldError name="technicalData" />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="technicalData-finalPh" className={labelClassName}>
              pH final
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
              placeholder="p. ej., 5.5"
            />
          </div>

          <div>
            <label htmlFor="technicalData-productionTemperatureCelsius" className={labelClassName}>
              Temperatura de producción (°C)
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
              placeholder="p. ej., 75"
            />
          </div>

          <div>
            <label htmlFor="technicalData-mixingTimeMinutes" className={labelClassName}>
              Tiempo de mezcla (minutos)
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
              placeholder="p. ej., 20"
            />
          </div>

          <div>
            <label htmlFor="technicalData-preservative" className={labelClassName}>
              Conservante
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
              Fragancia
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
      </div>

      <fieldset className={cardClassName}>
        <legend className="sr-only">Evaluación del producto</legend>
        <h2 className={headingClassName}>
          <span className="material-symbols-outlined mr-2 text-sm" aria-hidden="true">
            fact_check
          </span>
          Evaluación del producto
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(
            [
              ['texture', 'Textura'],
              ['color', 'Color'],
              ['smell', 'Olor'],
              ['viscosity', 'Viscosidad'],
              ['absorption', 'Absorción'],
              ['foam', 'Espuma'],
              ['stability', 'Estabilidad'],
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

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <fieldset className={cardClassName}>
          <legend className="sr-only">Prueba de uso</legend>
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant pb-3">
            <h2 className="flex items-center font-headline text-lg font-bold uppercase tracking-wide text-primary">
              <span className="material-symbols-outlined mr-2 text-sm" aria-hidden="true">
                group
              </span>
              Prueba de uso
            </h2>
            <button
              type="button"
              onClick={addUseTestEntry}
              aria-label="+ Agregar entrada de prueba de uso"
              className="inline-flex items-center gap-1 rounded border border-primary-dim px-2 py-1 text-xs text-primary transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                add
              </span>
              Fila
            </button>
          </div>

          <FieldError name="useTest" />

          <div className="mb-5 mt-5 border-b border-outline-variant/30 pb-4">
            <label htmlFor="useTest-approxExpirationDate" className={labelClassName}>
              Vencimiento aproximado
            </label>
            <input
              id="useTest-approxExpirationDate"
              type="date"
              value={values.useTest.approxExpirationDate}
              onChange={(event) => updateUseTest({ approxExpirationDate: event.target.value })}
              className={`${inputBaseClassName} sm:w-1/2`}
            />
          </div>

          {values.useTest.entries.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Todavía no se agregaron entradas de prueba.</p>
          ) : (
            <ul className="space-y-3">
              {values.useTest.entries.map((entry, index) => (
                <li
                  key={entry.id}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-start"
                >
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(event) => updateUseTestEntry(index, { date: event.target.value })}
                    aria-label={`Fecha de la entrada ${index + 1} de prueba de uso`}
                    className={inputBaseClassName}
                  />
                  <textarea
                    value={entry.note}
                    onChange={(event) => updateUseTestEntry(index, { note: event.target.value })}
                    placeholder="Nota de observación"
                    aria-label={`Nota de la entrada ${index + 1} de prueba de uso`}
                    rows={2}
                    className={inputBaseClassName}
                  />
                  <button
                    type="button"
                    onClick={() => removeUseTestEntry(index)}
                    className="w-full rounded border border-outline-variant px-3 py-2.5 text-sm text-error transition-colors hover:bg-error-container hover:text-on-error-container sm:w-auto"
                    aria-label={`Eliminar entrada ${index + 1} de prueba de uso`}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset className={cardClassName}>
          <legend className="sr-only">INCI</legend>
          <h2 className={`${headingClassName} text-primary`}>
            <span className="material-symbols-outlined mr-2 text-sm" aria-hidden="true">
              inventory_2
            </span>
            INCI / Propiedades
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              ['function', 'Función'],
              ['emulsionType', 'Tipo de emulsión'],
              ['dosage', 'Dosificación'],
              ['temperature', 'Temperatura'],
              ['compatibility', 'Compatibilidad'],
              ['inconveniences', 'Inconvenientes'],
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
      </div>

      <fieldset className={cardClassName}>
        <legend className="sr-only">Observaciones finales</legend>
        <h2 className={`${headingClassName} text-secondary-fixed-dim`}>
          <span className="material-symbols-outlined mr-2 text-sm" aria-hidden="true">
            speaker_notes
          </span>
          Observaciones finales
        </h2>

        <textarea
          id="finalObservations"
          value={values.finalObservations}
          onChange={(event) => updateField('finalObservations', event.target.value)}
          rows={4}
          className={`${inputBaseClassName} mt-5 resize-y`}
          placeholder="Notas finales sobre la fórmula"
          aria-label="Observaciones finales"
        />
      </fieldset>

      <div className="mt-8 flex flex-col items-stretch gap-4 border-t border-outline-variant pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-primary-dim bg-transparent px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container-high"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded bg-primary-container px-8 py-2.5 text-sm font-bold uppercase tracking-wider text-on-primary-container transition-all hover:bg-primary hover:shadow-[0_0_15px_rgba(0,241,253,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined mr-2 text-sm" aria-hidden="true">
            save
          </span>
          {submitButtonLabel}
        </button>
      </div>
    </form>
  );
}
