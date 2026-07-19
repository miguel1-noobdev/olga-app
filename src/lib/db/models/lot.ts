import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type {
  FormulaIngredient,
  FormulaPhase,
  FormulaProcedureStep,
} from '@/lib/formulas/formula-types';
import type {
  LotStorageStatus,
  FormulaSnapshot,
  FormulaTechnicalDataSnapshot,
  LotFollowUp,
  LotFollowUpEntry,
} from '@/lib/lots/lot-types';
import { LOT_STORAGE_STATUSES } from '@/lib/lots/lot-types';

export type { LotStorageStatus, FormulaSnapshot, FormulaTechnicalDataSnapshot, LotFollowUp, LotFollowUpEntry } from '@/lib/lots/lot-types';
export { LOT_STORAGE_STATUSES } from '@/lib/lots/lot-types';

export interface ILot extends Document {
  formulaId: Types.ObjectId;
  formulaCode: string;
  formulaVersion: string;
  lotNumber: number;
  lotCode: string;
  status: LotStorageStatus;
  targetBatchGrams: number;
  formulaSnapshot: FormulaSnapshot;
  followUp: LotFollowUp;
  operationalObservations?: string;
  plannedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SnapshotIngredientSchema = new Schema<FormulaIngredient>(
  {
    ingredient: {
      type: String,
      required: true,
      trim: true,
    },
    grams: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => value > 0,
        message: 'snapshot ingredient grams must be greater than 0',
      },
    },
  },
  { _id: false }
);

const SnapshotProcedureStepSchema = new Schema<FormulaProcedureStep>(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    instruction: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const SnapshotPhaseSchema = new Schema<FormulaPhase>(
  {
    aqueous: {
      type: [SnapshotIngredientSchema],
      default: undefined,
    },
    oil: {
      type: [SnapshotIngredientSchema],
      default: undefined,
    },
    actives: {
      type: [SnapshotIngredientSchema],
      default: undefined,
    },
  },
  { _id: false }
);

const SnapshotTechnicalDataSchema = new Schema<FormulaTechnicalDataSnapshot>(
  {
    productionTemperatureCelsius: {
      type: Number,
      default: undefined,
    },
    mixingTimeMinutes: {
      type: Number,
      default: undefined,
    },
    preservative: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  { _id: false }
);

const FormulaSnapshotSchema = new Schema<FormulaSnapshot>(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productType: {
      type: String,
      required: true,
      trim: true,
    },
    targetBatchGrams: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => value > 0,
        message: 'snapshot targetBatchGrams must be greater than 0',
      },
    },
    phases: {
      type: SnapshotPhaseSchema,
      default: undefined,
    },
    procedureSteps: {
      type: [SnapshotProcedureStepSchema],
      required: true,
      default: [],
    },
    technicalData: {
      type: SnapshotTechnicalDataSchema,
      default: undefined,
    },
  },
  { _id: false }
);

const LotSchema = new Schema<ILot>(
  {
    formulaId: {
      type: Schema.Types.ObjectId,
      ref: 'Formula',
      required: true,
      index: true,
    },
    formulaCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    formulaVersion: {
      type: String,
      required: true,
      trim: true,
    },
    lotNumber: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => Number.isInteger(value) && value > 0,
        message: 'lotNumber must be a positive integer',
      },
    },
    lotCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: LOT_STORAGE_STATUSES,
      default: 'in_production',
      required: true,
    },
    targetBatchGrams: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => value > 0,
        message: 'targetBatchGrams must be greater than 0',
      },
    },
    formulaSnapshot: {
      type: FormulaSnapshotSchema,
      required: true,
    },
    followUp: {
      entries: {
        type: [
          {
            date: { type: Date, required: true },
            note: { type: String, required: true, trim: true },
          },
        ],
        default: [],
      },
    },
    operationalObservations: {
      type: String,
      trim: true,
    },
    plannedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

LotSchema.index({ formulaId: 1, lotNumber: 1 }, { unique: true });

const cachedLotModel = mongoose.models.Lot as Model<ILot> | undefined;
const cachedStatusValues = (
  cachedLotModel?.schema.path('status') as { enumValues?: string[] } | undefined
)?.enumValues;

if (
  cachedLotModel &&
  !LOT_STORAGE_STATUSES.every((status) => cachedStatusValues?.includes(status))
) {
  mongoose.deleteModel('Lot');
}

export const LotModel: Model<ILot> =
  (mongoose.models.Lot as Model<ILot> | undefined) ?? mongoose.model<ILot>('Lot', LotSchema);
