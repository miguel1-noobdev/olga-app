import {
  CreateFormulaInput,
  FormulaRecord,
  UpdateFormulaInput,
  FormulaPhase,
  FormulaStatus,
  FormulaTechnicalData,
  FormulaProductEvaluation,
  FormulaUseTest,
  FormulaInci,
  FormulaProcedureStep,
} from '@/lib/formulas/formula-types';

export type FormulaPhaseKey = 'aqueous' | 'oil' | 'actives';

export interface FormulaIngredientFormValue {
  id?: string;
  ingredient: string;
  grams: number | '';
}

export interface FormulaPhaseFormValues {
  aqueous: FormulaIngredientFormValue[];
  oil: FormulaIngredientFormValue[];
  actives: FormulaIngredientFormValue[];
}

export interface FormulaProcedureStepFormValue {
  id?: string;
  stepNumber: number;
  instruction: string;
}

export interface FormulaTechnicalDataFormValue {
  finalPh: number | '';
  productionTemperatureCelsius: number | '';
  mixingTimeMinutes: number | '';
  preservative: string;
  fragrance: string;
  color: string;
}

export interface FormulaProductEvaluationFormValue {
  texture: string;
  color: string;
  smell: string;
  viscosity: string;
  absorption: string;
  foam: string;
  stability: string;
}

export interface FormulaUseTestEntryFormValue {
  id?: string;
  date: string;
  note: string;
}

export interface FormulaUseTestFormValue {
  approxExpirationDate: string;
  entries: FormulaUseTestEntryFormValue[];
}

export interface FormulaInciFormValue {
  function: string;
  emulsionType: string;
  dosage: string;
  temperature: string;
  compatibility: string;
  inconveniences: string;
  ph: string;
}

export interface FormulaObjectiveFormValue {
  id?: string;
  value: string;
}

export interface FormulaFormValues {
  productName: string;
  formulaCode: string;
  formulaCreatedAt: string;
  formulaVersion: string;
  productObjectives: FormulaObjectiveFormValue[];
  productType: string;
  status: FormulaStatus;
  targetBatchGrams: number | '';
  phases: FormulaPhaseFormValues;
  procedureSteps: FormulaProcedureStepFormValue[];
  technicalData: FormulaTechnicalDataFormValue;
  productEvaluation: FormulaProductEvaluationFormValue;
  useTest: FormulaUseTestFormValue;
  inci: FormulaInciFormValue;
  finalObservations: string;
}

export type FormulaFormValidationError = Partial<
  Record<keyof FormulaFormValues | 'phases' | 'procedureSteps', string>
>;

export type SubmitFormulaResult =
  | { success: true }
  | { success: false; errors: FormulaFormValidationError }
  | { success: false; error: string };

export const DEFAULT_FORMULA_STATUS: FormulaStatus = 'draft';

const PHASE_KEYS: FormulaPhaseKey[] = ['aqueous', 'oil', 'actives'];

export function createEmptyTechnicalData(): FormulaTechnicalDataFormValue {
  return {
    finalPh: '',
    productionTemperatureCelsius: '',
    mixingTimeMinutes: '',
    preservative: '',
    fragrance: '',
    color: '',
  };
}

export function createEmptyProductEvaluation(): FormulaProductEvaluationFormValue {
  return {
    texture: '',
    color: '',
    smell: '',
    viscosity: '',
    absorption: '',
    foam: '',
    stability: '',
  };
}

export function createEmptyUseTest(): FormulaUseTestFormValue {
  return {
    approxExpirationDate: '',
    entries: [],
  };
}

export function createEmptyUseTestEntry(): FormulaUseTestEntryFormValue {
  return { date: '', note: '' };
}

export function createEmptyInci(): FormulaInciFormValue {
  return {
    function: '',
    emulsionType: '',
    dosage: '',
    temperature: '',
    compatibility: '',
    inconveniences: '',
    ph: '',
  };
}

export function createEmptyFormulaForm(): FormulaFormValues {
  const today = new Date().toISOString().split('T')[0];

  return {
    productName: '',
    formulaCode: '',
    formulaCreatedAt: today,
    formulaVersion: '1.0',
    productObjectives: [],
    productType: '',
    status: DEFAULT_FORMULA_STATUS,
    targetBatchGrams: '',
    phases: {
      aqueous: [],
      oil: [],
      actives: [],
    },
    procedureSteps: [{ stepNumber: 1, instruction: '' }],
    technicalData: createEmptyTechnicalData(),
    productEvaluation: createEmptyProductEvaluation(),
    useTest: createEmptyUseTest(),
    inci: createEmptyInci(),
    finalObservations: '',
  };
}

function toNumberOrNaN(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function toOptionalNumber(value: number | ''): number | undefined {
  if (value === '') {
    return undefined;
  }

  const parsed = toNumberOrNaN(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim() === '';
}

function normalizePhases(phases: FormulaPhaseFormValues): FormulaPhase | undefined {
  const normalized: FormulaPhase = {};

  for (const key of PHASE_KEYS) {
    const populated = phases[key].filter(
      (item) => item.ingredient.trim() !== '' && toNumberOrNaN(item.grams) > 0
    );

    if (populated.length > 0) {
      normalized[key] = populated.map((item) => ({
        ingredient: item.ingredient.trim(),
        grams: toNumberOrNaN(item.grams),
      }));
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeProductObjectives(
  objectives: FormulaObjectiveFormValue[]
): string[] | undefined {
  const populated = objectives
    .map((objective) => objective.value.trim())
    .filter((value) => value !== '');
  return populated.length > 0 ? populated : undefined;
}

function normalizeTechnicalData(
  data: FormulaTechnicalDataFormValue
): CreateFormulaInput['technicalData'] | undefined {
  const normalized = {
    finalPh: toOptionalNumber(data.finalPh),
    productionTemperatureCelsius: toOptionalNumber(data.productionTemperatureCelsius),
    mixingTimeMinutes: toOptionalNumber(data.mixingTimeMinutes),
    preservative: data.preservative.trim() || undefined,
    fragrance: data.fragrance.trim() || undefined,
    color: data.color.trim() || undefined,
  };

  const hasValue = Object.values(normalized).some((value) => value !== undefined);
  return hasValue ? normalized : undefined;
}

function normalizeTechnicalDataForUpdate(
  data: FormulaTechnicalDataFormValue
): FormulaTechnicalData {
  return {
    finalPh: toOptionalNumber(data.finalPh),
    productionTemperatureCelsius: toOptionalNumber(data.productionTemperatureCelsius),
    mixingTimeMinutes: toOptionalNumber(data.mixingTimeMinutes),
    preservative: data.preservative.trim() || undefined,
    fragrance: data.fragrance.trim() || undefined,
    color: data.color.trim() || undefined,
  };
}

function normalizeProductEvaluation(
  evaluation: FormulaProductEvaluationFormValue
): CreateFormulaInput['productEvaluation'] | undefined {
  const normalized = {
    texture: evaluation.texture.trim() || undefined,
    color: evaluation.color.trim() || undefined,
    smell: evaluation.smell.trim() || undefined,
    viscosity: evaluation.viscosity.trim() || undefined,
    absorption: evaluation.absorption.trim() || undefined,
    foam: evaluation.foam.trim() || undefined,
    stability: evaluation.stability.trim() || undefined,
  };

  const hasValue = Object.values(normalized).some((value) => value !== undefined);
  return hasValue ? normalized : undefined;
}

function normalizeProductEvaluationForUpdate(
  evaluation: FormulaProductEvaluationFormValue
): FormulaProductEvaluation {
  return {
    texture: evaluation.texture.trim() || undefined,
    color: evaluation.color.trim() || undefined,
    smell: evaluation.smell.trim() || undefined,
    viscosity: evaluation.viscosity.trim() || undefined,
    absorption: evaluation.absorption.trim() || undefined,
    foam: evaluation.foam.trim() || undefined,
    stability: evaluation.stability.trim() || undefined,
  };
}

function normalizeUseTest(
  useTest: FormulaUseTestFormValue
): CreateFormulaInput['useTest'] | undefined {
  const approxExpirationDate = useTest.approxExpirationDate.trim()
    ? new Date(useTest.approxExpirationDate.trim())
    : undefined;

  const entries = useTest.entries
    .filter((entry) => entry.date.trim() !== '' || entry.note.trim() !== '')
    .map((entry) => ({
      date: entry.date.trim() ? new Date(entry.date.trim()) : new Date(),
      note: entry.note.trim(),
    }));

  if (!approxExpirationDate && entries.length === 0) {
    return undefined;
  }

  return {
    approxExpirationDate,
    entries: entries.length > 0 ? entries : undefined,
  };
}

function normalizeUseTestForUpdate(
  useTest: FormulaUseTestFormValue
): UpdateFormulaInput['useTest'] {
  const approxExpirationDate = useTest.approxExpirationDate.trim()
    ? new Date(useTest.approxExpirationDate.trim())
    : undefined;

  const entries = useTest.entries
    .filter((entry) => entry.date.trim() !== '' || entry.note.trim() !== '')
    .map((entry) => ({
      date: entry.date.trim() ? new Date(entry.date.trim()) : new Date(),
      note: entry.note.trim(),
    }));

  if (!approxExpirationDate && entries.length === 0) {
    return {};
  }

  return {
    approxExpirationDate,
    entries: entries.length > 0 ? entries : undefined,
  };
}

function normalizeInci(inci: FormulaInciFormValue): CreateFormulaInput['inci'] | undefined {
  const normalized = {
    function: inci.function.trim() || undefined,
    emulsionType: inci.emulsionType.trim() || undefined,
    dosage: inci.dosage.trim() || undefined,
    temperature: inci.temperature.trim() || undefined,
    compatibility: inci.compatibility.trim() || undefined,
    inconveniences: inci.inconveniences.trim() || undefined,
    ph: inci.ph.trim() || undefined,
  };

  const hasValue = Object.values(normalized).some((value) => value !== undefined);
  return hasValue ? normalized : undefined;
}

function normalizeInciForUpdate(inci: FormulaInciFormValue): FormulaInci {
  return {
    function: inci.function.trim() || undefined,
    emulsionType: inci.emulsionType.trim() || undefined,
    dosage: inci.dosage.trim() || undefined,
    temperature: inci.temperature.trim() || undefined,
    compatibility: inci.compatibility.trim() || undefined,
    inconveniences: inci.inconveniences.trim() || undefined,
    ph: inci.ph.trim() || undefined,
  };
}

function normalizeProcedureSteps(
  steps: FormulaProcedureStepFormValue[]
): FormulaProcedureStep[] {
  return steps.map((step, index) => ({
    stepNumber: step.stepNumber || index + 1,
    instruction: step.instruction.trim(),
  }));
}

function buildCreateFormulaInput(values: FormulaFormValues): CreateFormulaInput {
  return {
    productName: values.productName.trim(),
    formulaCode: values.formulaCode.trim(),
    formulaCreatedAt: new Date(values.formulaCreatedAt),
    formulaVersion: values.formulaVersion.trim(),
    productObjectives: normalizeProductObjectives(values.productObjectives),
    productType: values.productType.trim(),
    status: values.status,
    targetBatchGrams: toNumberOrNaN(values.targetBatchGrams),
    phases: normalizePhases(values.phases),
    procedureSteps: normalizeProcedureSteps(values.procedureSteps),
    technicalData: normalizeTechnicalData(values.technicalData),
    productEvaluation: normalizeProductEvaluation(values.productEvaluation),
    useTest: normalizeUseTest(values.useTest),
    inci: normalizeInci(values.inci),
    finalObservations: values.finalObservations.trim() || undefined,
  };
}

function buildUpdateFormulaInput(values: FormulaFormValues): UpdateFormulaInput {
  return {
    productName: values.productName.trim(),
    formulaCode: values.formulaCode.trim(),
    formulaCreatedAt: new Date(values.formulaCreatedAt),
    formulaVersion: values.formulaVersion.trim(),
    productObjectives: normalizeProductObjectives(values.productObjectives) ?? [],
    productType: values.productType.trim(),
    status: values.status,
    targetBatchGrams: toNumberOrNaN(values.targetBatchGrams),
    phases: normalizePhases(values.phases),
    procedureSteps: normalizeProcedureSteps(values.procedureSteps),
    technicalData: normalizeTechnicalDataForUpdate(values.technicalData),
    productEvaluation: normalizeProductEvaluationForUpdate(values.productEvaluation),
    useTest: normalizeUseTestForUpdate(values.useTest),
    inci: normalizeInciForUpdate(values.inci),
    finalObservations: values.finalObservations.trim(),
  };
}

export function toCreateFormulaInput(values: FormulaFormValues): CreateFormulaInput {
  return buildCreateFormulaInput(values);
}

export function toUpdateFormulaInput(values: FormulaFormValues): UpdateFormulaInput {
  return buildUpdateFormulaInput(values);
}

function toDateInputValue(isoDate: string): string {
  return isoDate.split('T')[0];
}

function mapPhaseIngredients(phase?: Array<{ ingredient: string; grams: number }>): FormulaIngredientFormValue[] {
  if (!phase) {
    return [];
  }

  return phase.map((item) => ({
    ingredient: item.ingredient,
    grams: item.grams,
  }));
}

function mapTechnicalData(
  data?: FormulaRecord['technicalData']
): FormulaTechnicalDataFormValue {
  return {
    finalPh: data?.finalPh ?? '',
    productionTemperatureCelsius: data?.productionTemperatureCelsius ?? '',
    mixingTimeMinutes: data?.mixingTimeMinutes ?? '',
    preservative: data?.preservative ?? '',
    fragrance: data?.fragrance ?? '',
    color: data?.color ?? '',
  };
}

function mapProductEvaluation(
  evaluation?: FormulaRecord['productEvaluation']
): FormulaProductEvaluationFormValue {
  return {
    texture: evaluation?.texture ?? '',
    color: evaluation?.color ?? '',
    smell: evaluation?.smell ?? '',
    viscosity: evaluation?.viscosity ?? '',
    absorption: evaluation?.absorption ?? '',
    foam: evaluation?.foam ?? '',
    stability: evaluation?.stability ?? '',
  };
}

function mapUseTest(useTest?: FormulaRecord['useTest']): FormulaUseTestFormValue {
  return {
    approxExpirationDate: useTest?.approxExpirationDate
      ? toDateInputValue(useTest.approxExpirationDate)
      : '',
    entries:
      useTest?.entries.map((entry) => ({
        date: toDateInputValue(entry.date),
        note: entry.note,
      })) ?? [],
  };
}

function mapInci(inci?: FormulaRecord['inci']): FormulaInciFormValue {
  return {
    function: inci?.function ?? '',
    emulsionType: inci?.emulsionType ?? '',
    dosage: inci?.dosage ?? '',
    temperature: inci?.temperature ?? '',
    compatibility: inci?.compatibility ?? '',
    inconveniences: inci?.inconveniences ?? '',
    ph: inci?.ph ?? '',
  };
}

export function toFormulaFormValues(record: FormulaRecord): FormulaFormValues {
  const phases = record.phases ?? {};

  return {
    productName: record.productName,
    formulaCode: record.formulaCode,
    formulaCreatedAt: toDateInputValue(record.formulaCreatedAt),
    formulaVersion: record.formulaVersion,
    productObjectives:
      record.productObjectives?.map((value) => ({
        value,
      })) ?? [],
    productType: record.productType,
    status: record.status,
    targetBatchGrams: record.targetBatchGrams,
    phases: {
      aqueous: mapPhaseIngredients(phases.aqueous),
      oil: mapPhaseIngredients(phases.oil),
      actives: mapPhaseIngredients(phases.actives),
    },
    procedureSteps:
      record.procedureSteps.length > 0
        ? record.procedureSteps.map((step) => ({
            stepNumber: step.stepNumber,
            instruction: step.instruction,
          }))
        : [{ stepNumber: 1, instruction: '' }],
    technicalData: mapTechnicalData(record.technicalData),
    productEvaluation: mapProductEvaluation(record.productEvaluation),
    useTest: mapUseTest(record.useTest),
    inci: mapInci(record.inci),
    finalObservations: record.finalObservations ?? '',
  };
}

function hasPartialIngredientRow(phases: FormulaPhaseFormValues): boolean {
  for (const key of PHASE_KEYS) {
    for (const item of phases[key]) {
      const hasName = item.ingredient.trim() !== '';
      const hasGrams = toNumberOrNaN(item.grams) > 0;
      if ((hasName || hasGrams) && !(hasName && hasGrams)) {
        return true;
      }
    }
  }

  return false;
}

function hasPopulatedPhase(phases: FormulaPhaseFormValues): boolean {
  return PHASE_KEYS.some((key) =>
    phases[key].some(
      (item) => item.ingredient.trim() !== '' && toNumberOrNaN(item.grams) > 0
    )
  );
}

function validateTechnicalData(data: FormulaTechnicalDataFormValue): string | undefined {
  const finalPh = toOptionalNumber(data.finalPh);
  if (finalPh !== undefined && (finalPh < 0 || finalPh > 14)) {
    return 'El pH final debe estar entre 0 y 14';
  }

  const temperature = toOptionalNumber(data.productionTemperatureCelsius);
  if (temperature !== undefined && temperature < 0) {
    return 'La temperatura de producción debe ser mayor o igual a 0';
  }

  const mixingTime = toOptionalNumber(data.mixingTimeMinutes);
  if (mixingTime !== undefined && mixingTime < 0) {
    return 'El tiempo de mezcla debe ser mayor o igual a 0';
  }

  return undefined;
}

function hasPartialUseTestEntry(useTest: FormulaUseTestFormValue): boolean {
  return useTest.entries.some((entry) => {
    const hasDate = entry.date.trim() !== '';
    const hasNote = entry.note.trim() !== '';
    return (hasDate || hasNote) && !(hasDate && hasNote);
  });
}

export function validateMinimumFormulaForm(values: FormulaFormValues): {
  valid: boolean;
  errors: FormulaFormValidationError;
} {
  const errors: FormulaFormValidationError = {};

  if (values.productName.trim() === '') {
    errors.productName = 'El nombre del producto es obligatorio';
  }

  if (values.formulaCode.trim() === '') {
    errors.formulaCode = 'El código de fórmula es obligatorio';
  }

  if (values.formulaCreatedAt.trim() === '') {
    errors.formulaCreatedAt = 'La fecha de creación es obligatoria';
  }

  if (values.formulaVersion.trim() === '') {
    errors.formulaVersion = 'La versión de fórmula es obligatoria';
  }

  if (values.productType.trim() === '') {
    errors.productType = 'El tipo de producto es obligatorio';
  }

  const targetBatchGrams = toNumberOrNaN(values.targetBatchGrams);
  if (!Number.isFinite(targetBatchGrams) || targetBatchGrams <= 0) {
    errors.targetBatchGrams = 'El lote objetivo debe ser mayor a 0';
  }

  if (hasPartialIngredientRow(values.phases)) {
    errors.phases = 'Cada ingrediente debe tener un nombre y gramos mayores a 0';
  } else if (!hasPopulatedPhase(values.phases)) {
    errors.phases = 'Se requiere al menos una fase con ingredientes';
  }

  const hasProcedureStep = values.procedureSteps.some(
    (step) => step.instruction.trim() !== ''
  );
  if (!hasProcedureStep) {
    errors.procedureSteps = 'Se requiere al menos un paso de procedimiento';
  }

  const technicalDataError = validateTechnicalData(values.technicalData);
  if (technicalDataError) {
    errors.technicalData = technicalDataError;
  }

  if (hasPartialUseTestEntry(values.useTest)) {
    errors.useTest = 'Cada entrada de prueba de uso debe tener una fecha y una nota';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
