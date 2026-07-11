export type FormulaStatus = 'draft' | 'testing' | 'validated' | 'archived' | 'discarded';

export const FORMULA_STATUSES: FormulaStatus[] = [
  'draft',
  'testing',
  'validated',
  'archived',
  'discarded',
];

export interface FormulaIngredient {
  ingredient: string;
  grams: number;
}

export interface FormulaPhase {
  aqueous?: FormulaIngredient[];
  oil?: FormulaIngredient[];
  actives?: FormulaIngredient[];
}

export interface FormulaProcedureStep {
  stepNumber: number;
  instruction: string;
}

export interface FormulaTechnicalData {
  finalPh?: number;
  productionTemperatureCelsius?: number;
  mixingTimeMinutes?: number;
  preservative?: string;
  fragrance?: string;
  color?: string;
}

export interface FormulaProductEvaluation {
  texture?: string;
  color?: string;
  smell?: string;
  viscosity?: string;
  absorption?: string;
  foam?: string;
  stability?: string;
}

export interface FormulaUseTestEntry {
  date: Date;
  note: string;
}

export interface FormulaUseTest {
  approxExpirationDate?: Date;
  entries?: FormulaUseTestEntry[];
}

export interface FormulaInci {
  function?: string;
  emulsionType?: string;
  dosage?: string;
  temperature?: string;
  compatibility?: string;
  inconveniences?: string;
  ph?: string;
}

export interface FormulaRecord {
  id: string;
  productName: string;
  formulaCode: string;
  formulaCreatedAt: string;
  formulaVersion: string;
  productObjectives: string[];
  productType: string;
  status: FormulaStatus;
  targetBatchGrams: number;
  phases?: FormulaPhase;
  procedureSteps: FormulaProcedureStep[];
  technicalData?: FormulaTechnicalData;
  productEvaluation?: FormulaProductEvaluation;
  useTest?: {
    approxExpirationDate: string | null;
    entries: Array<{ date: string; note: string }>;
  };
  inci?: FormulaInci;
  finalObservations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormulaInput {
  productName: string;
  formulaCode: string;
  formulaCreatedAt: Date;
  formulaVersion: string;
  productObjectives?: string[];
  productType: string;
  status?: FormulaStatus;
  targetBatchGrams: number;
  phases?: FormulaPhase;
  procedureSteps: FormulaProcedureStep[];
  technicalData?: FormulaTechnicalData;
  productEvaluation?: FormulaProductEvaluation;
  useTest?: FormulaUseTest;
  inci?: FormulaInci;
  finalObservations?: string;
}

export interface UpdateFormulaInput {
  productName?: string;
  formulaCode?: string;
  formulaCreatedAt?: Date;
  formulaVersion?: string;
  productObjectives?: string[];
  productType?: string;
  status?: FormulaStatus;
  targetBatchGrams?: number;
  phases?: FormulaPhase;
  procedureSteps?: FormulaProcedureStep[];
  technicalData?: FormulaTechnicalData;
  productEvaluation?: FormulaProductEvaluation;
  useTest?: FormulaUseTest;
  inci?: FormulaInci;
  finalObservations?: string;
}
