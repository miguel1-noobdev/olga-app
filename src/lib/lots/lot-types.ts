import {
  FormulaPhase,
  FormulaProcedureStep,
} from '@/lib/formulas/formula-types';

export type LotStatus = 'in_production' | 'finalized' | 'discarded';

export type LegacyLotStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type LotStorageStatus = LotStatus | LegacyLotStatus;

export const LOT_STATUSES = [
  'in_production',
  'finalized',
  'discarded',
] as const satisfies readonly LotStatus[];

export const LOT_STORAGE_STATUSES = [
  ...LOT_STATUSES,
  'planned',
  'in_progress',
  'completed',
  'cancelled',
] as const satisfies readonly LotStorageStatus[];

export function isLotStatus(status: unknown): status is LotStatus {
  return typeof status === 'string' && LOT_STATUSES.includes(status as LotStatus);
}

export interface FormulaTechnicalDataSnapshot {
  productionTemperatureCelsius?: number;
  mixingTimeMinutes?: number;
  preservative?: string;
}

export interface FormulaSnapshot {
  productName: string;
  productType: string;
  targetBatchGrams: number;
  phases?: FormulaPhase;
  procedureSteps: FormulaProcedureStep[];
  technicalData?: FormulaTechnicalDataSnapshot;
}

export interface LotFollowUpEntry {
  date: Date;
  note: string;
}

export interface LotFollowUp {
  entries: LotFollowUpEntry[];
}

export interface LotRecord {
  id: string;
  formulaId: string;
  formulaCode: string;
  formulaVersion: string;
  lotNumber: number;
  lotCode: string;
  status: LotStatus;
  targetBatchGrams: number;
  formulaSnapshot: FormulaSnapshot;
  followUp: {
    entries: Array<{ date: string; note: string }>;
  };
  operationalObservations?: string;
  plannedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLotInput {
  formulaId: string;
  targetBatchGrams: number;
  status?: LotStatus;
  operationalObservations?: string;
  followUp?: LotFollowUp;
  plannedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface UpdateLotInput {
  status?: LotStatus;
  targetBatchGrams?: number;
  operationalObservations?: string;
  followUp?: LotFollowUp;
  plannedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}
