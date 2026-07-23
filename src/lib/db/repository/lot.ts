import { LotModel, ILot } from '../models/lot';
import { FormulaModel, IFormula } from '../models/formula';
import { isLotStatus } from '@/lib/lots/lot-types';
import type {
  LotRecord,
  CreateLotInput,
  UpdateLotInput,
  LotStatus,
  LotStorageStatus,
  FormulaSnapshot,
} from '@/lib/lots/lot-types';
import type {
  FormulaIngredient,
  FormulaProcedureStep,
  FormulaPhase,
  FormulaTechnicalData,
} from '@/lib/formulas/formula-types';

export type { LotRecord, CreateLotInput, UpdateLotInput } from '@/lib/lots/lot-types';

export class LotLifecycleError extends Error {
  constructor(
    public readonly reason:
      | 'completed_freeze'
      | 'snapshot_regeneration_not_allowed'
      | 'not_found'
  ) {
    super(
      reason === 'completed_freeze'
        ? 'Lot production fields and snapshot are frozen once terminal'
        : reason === 'snapshot_regeneration_not_allowed'
          ? 'Lot snapshots can only be regenerated while in production'
          : 'Lot not found'
    );
    this.name = 'LotLifecycleError';
  }
}

export class LotValidationError extends Error {
  constructor(public readonly reason: 'target_batch_grams_invalid' | 'lot_status_invalid') {
    super(
      reason === 'target_batch_grams_invalid'
        ? 'targetBatchGrams must be greater than 0'
        : 'Estado de lote no válido'
    );
    this.name = 'LotValidationError';
  }
}

export interface LotRepository {
  create(input: CreateLotInput): Promise<LotRecord>;
  findById(id: string): Promise<LotRecord | null>;
  findByLotCode(code: string): Promise<LotRecord | null>;
  findAll(): Promise<LotRecord[]>;
  findByFormulaId(formulaId: string): Promise<LotRecord[]>;
  findByStatus(status: LotStatus): Promise<LotRecord[]>;
  update(id: string, input: UpdateLotInput): Promise<LotRecord>;
  delete(id: string): Promise<void>;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toIsoDate(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return new Date(value).toISOString();
  }

  return new Date(value as number).toISOString();
}

function toTechnicalDataSnapshot(
  value: unknown
): FormulaSnapshot['technicalData'] | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const data = value as Partial<FormulaTechnicalData>;
  const snapshot: NonNullable<FormulaSnapshot['technicalData']> = {};

  if (data.productionTemperatureCelsius !== undefined) {
    snapshot.productionTemperatureCelsius = Number(data.productionTemperatureCelsius);
  }
  if (data.mixingTimeMinutes !== undefined) {
    snapshot.mixingTimeMinutes = Number(data.mixingTimeMinutes);
  }
  if (data.preservative !== undefined) {
    snapshot.preservative = String(data.preservative);
  }

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
}

function toSnapshot(plain: Record<string, unknown>): FormulaSnapshot {
  return {
    productName: String(plain.productName),
    productType: String(plain.productType),
    targetBatchGrams: Number(plain.targetBatchGrams),
    phases: plain.phases as FormulaPhase | undefined,
    procedureSteps: (plain.procedureSteps ?? []) as FormulaProcedureStep[],
    technicalData: toTechnicalDataSnapshot(plain.technicalData),
  };
}

function toOperationalStatus(status: LotStorageStatus): LotStatus {
  switch (status) {
    case 'planned':
    case 'in_progress':
      return 'in_production';
    case 'completed':
      return 'finalized';
    case 'cancelled':
      return 'discarded';
    default:
      return status;
  }
}

function toStoredStatuses(status: LotStatus): LotStorageStatus[] {
  switch (status) {
    case 'in_production':
      return ['in_production', 'planned', 'in_progress'];
    case 'finalized':
      return ['finalized', 'completed'];
    case 'discarded':
      return ['discarded', 'cancelled'];
  }
}

function toLotRecord(doc: ILot): LotRecord {
  const plain = JSON.parse(JSON.stringify(doc.toObject ? doc.toObject() : doc));

  return {
    id: doc._id.toString(),
    formulaId: doc.formulaId.toString(),
    formulaCode: plain.formulaCode,
    formulaVersion: plain.formulaVersion,
    lotNumber: plain.lotNumber,
    lotCode: plain.lotCode,
    status: toOperationalStatus(plain.status as LotStorageStatus),
    targetBatchGrams: plain.targetBatchGrams,
    formulaSnapshot: toSnapshot(plain.formulaSnapshot),
    followUp: {
      entries: (plain.followUp?.entries ?? []).map((entry: { date: unknown; note: string }) => ({
        date: toIsoDate(entry.date) as string,
        note: entry.note,
      })),
    },
    operationalObservations: plain.operationalObservations,
    plannedAt: toIsoDate(plain.plannedAt),
    startedAt: toIsoDate(plain.startedAt),
    completedAt: toIsoDate(plain.completedAt),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function buildLotCode(formulaCode: string, lotNumber: number): string {
  return `${formulaCode}-L${String(lotNumber).padStart(3, '0')}`;
}

function buildTechnicalDataSnapshot(
  formula: IFormula
): FormulaSnapshot['technicalData'] | undefined {
  if (!formula.technicalData) {
    return undefined;
  }

  const snapshot: NonNullable<FormulaSnapshot['technicalData']> = {};

  if (formula.technicalData.productionTemperatureCelsius !== undefined) {
    snapshot.productionTemperatureCelsius = formula.technicalData.productionTemperatureCelsius;
  }
  if (formula.technicalData.mixingTimeMinutes !== undefined) {
    snapshot.mixingTimeMinutes = formula.technicalData.mixingTimeMinutes;
  }
  if (formula.technicalData.preservative !== undefined) {
    snapshot.preservative = formula.technicalData.preservative;
  }

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
}

function buildSnapshot(formula: IFormula, targetBatchGrams: number): FormulaSnapshot {
  const ratio = targetBatchGrams / formula.targetBatchGrams;
  const scaleGrams = (grams: number) => Number((grams * ratio).toFixed(2));

  return {
    productName: formula.productName,
    productType: formula.productType,
    targetBatchGrams,
    phases: formula.phases
      ? {
          aqueous: formula.phases.aqueous?.map((ingredient: FormulaIngredient) => ({
            ingredient: ingredient.ingredient,
            grams: scaleGrams(ingredient.grams),
          })),
          oil: formula.phases.oil?.map((ingredient: FormulaIngredient) => ({
            ingredient: ingredient.ingredient,
            grams: scaleGrams(ingredient.grams),
          })),
          actives: formula.phases.actives?.map((ingredient: FormulaIngredient) => ({
            ingredient: ingredient.ingredient,
            grams: scaleGrams(ingredient.grams),
          })),
        }
      : undefined,
    procedureSteps: formula.procedureSteps.map((step: FormulaProcedureStep) => ({
      stepNumber: step.stepNumber,
      instruction: step.instruction,
    })),
    technicalData: buildTechnicalDataSnapshot(formula),
  };
}

function scaleSnapshot(snapshot: FormulaSnapshot, newTargetBatchGrams: number): FormulaSnapshot {
  const oldTarget = snapshot.targetBatchGrams;

  if (oldTarget === newTargetBatchGrams) {
    return snapshot;
  }

  const ratio = newTargetBatchGrams / oldTarget;
  const scaleGrams = (grams: number) => Number((grams * ratio).toFixed(2));

  return {
    productName: snapshot.productName,
    productType: snapshot.productType,
    targetBatchGrams: newTargetBatchGrams,
    phases: snapshot.phases
      ? {
          aqueous: snapshot.phases.aqueous?.map((ingredient: FormulaIngredient) => ({
            ingredient: ingredient.ingredient,
            grams: scaleGrams(ingredient.grams),
          })),
          oil: snapshot.phases.oil?.map((ingredient: FormulaIngredient) => ({
            ingredient: ingredient.ingredient,
            grams: scaleGrams(ingredient.grams),
          })),
          actives: snapshot.phases.actives?.map((ingredient: FormulaIngredient) => ({
            ingredient: ingredient.ingredient,
            grams: scaleGrams(ingredient.grams),
          })),
        }
      : undefined,
    procedureSteps: snapshot.procedureSteps,
    technicalData: snapshot.technicalData,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 11000
  );
}

export function createLotRepository(): LotRepository {
  return {
    async create(input: CreateLotInput): Promise<LotRecord> {
      const formula = await FormulaModel.findById(input.formulaId);

      if (!formula) {
        throw new Error('Formula not found');
      }

      if (formula.status !== 'validated') {
        throw new Error('Formula must be validated before creating lots');
      }

      if (input.targetBatchGrams <= 0) {
        throw new LotValidationError('target_batch_grams_invalid');
      }

      if (input.status !== undefined && !isLotStatus(input.status)) {
        throw new LotValidationError('lot_status_invalid');
      }

      const maxRetries = 5;
      let lastError: Error | undefined;

      for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        const lastLot = await LotModel.findOne({ formulaId: formula._id })
          .sort({ lotNumber: -1 })
          .limit(1);

        const lotNumber = lastLot ? lastLot.lotNumber + 1 : 1;
        const lotCode = buildLotCode(formula.formulaCode, lotNumber);
        const snapshot = buildSnapshot(formula, input.targetBatchGrams);

        try {
          const lot = await LotModel.create({
            formulaId: formula._id,
            formulaCode: formula.formulaCode,
            formulaVersion: formula.formulaVersion,
            lotNumber,
            lotCode,
            status: input.status ?? 'in_production',
            targetBatchGrams: input.targetBatchGrams,
            formulaSnapshot: snapshot,
            operationalObservations: input.operationalObservations,
            followUp: input.followUp,
            plannedAt: input.plannedAt,
            startedAt: new Date(),
            completedAt: input.completedAt,
          });

          return toLotRecord(lot);
        } catch (error) {
          if (isDuplicateKeyError(error)) {
            lastError = error as Error;
            continue;
          }
          throw error;
        }
      }

      throw lastError ?? new Error('Unable to create lot after retries');
    },

    async findById(id: string): Promise<LotRecord | null> {
      const lot = await LotModel.findById(id);
      return lot ? toLotRecord(lot) : null;
    },

    async findByLotCode(code: string): Promise<LotRecord | null> {
      const trimmed = code.trim();
      const lot = await LotModel.findOne({
        lotCode: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' },
      });

      return lot ? toLotRecord(lot) : null;
    },

    async findAll(): Promise<LotRecord[]> {
      const lots = await LotModel.find().sort({ lotCode: 1 });
      return lots.map(toLotRecord);
    },

    async findByFormulaId(formulaId: string): Promise<LotRecord[]> {
      const lots = await LotModel.find({ formulaId }).sort({ lotNumber: 1 });
      return lots.map(toLotRecord);
    },

    async findByStatus(status: LotStatus): Promise<LotRecord[]> {
      const lots = await LotModel.find({ status: { $in: toStoredStatuses(status) } }).sort({ lotCode: 1 });
      return lots.map(toLotRecord);
    },

    async update(id: string, input: UpdateLotInput): Promise<LotRecord> {
      const lot = await LotModel.findById(id);

      if (!lot) {
        throw new LotLifecycleError('not_found');
      }

      const hasProductionChanges =
        input.status !== undefined ||
        input.targetBatchGrams !== undefined ||
        input.operationalObservations !== undefined ||
        input.plannedAt !== undefined ||
        input.startedAt !== undefined ||
        input.completedAt !== undefined;

      const status = toOperationalStatus(lot.status);

      if (input.status !== undefined && !isLotStatus(input.status)) {
        throw new LotValidationError('lot_status_invalid');
      }

      if ((status === 'finalized' || status === 'discarded') && hasProductionChanges) {
        throw new LotLifecycleError('completed_freeze');
      }

      const updateOps: Record<string, unknown> = {};
      const $set: Record<string, unknown> = {};

      if (input.status !== undefined) {
        $set.status = input.status;

        if (
          (input.status === 'finalized' || input.status === 'discarded') &&
          input.completedAt === undefined
        ) {
          $set.completedAt = new Date(new Date().toISOString().slice(0, 10));
        }
      }
      if (input.targetBatchGrams !== undefined) {
        if (input.targetBatchGrams <= 0) {
          throw new LotValidationError('target_batch_grams_invalid');
        }

        if (status !== 'in_production') {
          throw new LotLifecycleError('snapshot_regeneration_not_allowed');
        }

        $set.targetBatchGrams = input.targetBatchGrams;
        const currentSnapshot = JSON.parse(JSON.stringify(lot.formulaSnapshot)) as FormulaSnapshot;
        $set.formulaSnapshot = scaleSnapshot(currentSnapshot, input.targetBatchGrams);
      }
      if (input.operationalObservations !== undefined) {
        $set.operationalObservations = input.operationalObservations;
      }
      if (input.plannedAt !== undefined) {
        $set.plannedAt = input.plannedAt;
      }
      if (input.startedAt !== undefined) {
        $set.startedAt = input.startedAt;
      }
      if (input.completedAt !== undefined) {
        $set.completedAt = input.completedAt;
      }

      if (Object.keys($set).length > 0) {
        updateOps.$set = $set;
      }

      if (input.followUp?.entries && input.followUp.entries.length > 0) {
        updateOps.$push = {
          'followUp.entries': { $each: input.followUp.entries },
        };
      }

      const updateFilter: Record<string, unknown> = { _id: id };
      if (hasProductionChanges) {
        updateFilter.status = { $nin: ['finalized', 'discarded', 'completed', 'cancelled'] };
      }

      const updated = await LotModel.findOneAndUpdate(updateFilter, updateOps, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!updated) {
        if (hasProductionChanges && (await LotModel.exists({ _id: id }))) {
          throw new LotLifecycleError('completed_freeze');
        }

        throw new LotLifecycleError('not_found');
      }

      return toLotRecord(updated);
    },

    async delete(id: string): Promise<void> {
      const result = await LotModel.findByIdAndDelete(id);

      if (!result) {
        throw new Error('Lot not found');
      }
    },
  };
}
