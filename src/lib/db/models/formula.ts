import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  FormulaStatus,
  FormulaIngredient,
  FormulaPhase,
  FormulaProcedureStep,
  FormulaTechnicalData,
  FormulaProductEvaluation,
  FormulaUseTest,
  FormulaInci,
} from '@/lib/formulas/formula-types';
import { FORMULA_STATUSES } from '@/lib/formulas/formula-types';

export type {
  FormulaStatus,
  FormulaIngredient,
  FormulaPhase,
  FormulaProcedureStep,
  FormulaTechnicalData,
  FormulaProductEvaluation,
  FormulaUseTest,
  FormulaUseTestEntry,
  FormulaInci,
} from '@/lib/formulas/formula-types';
export { FORMULA_STATUSES } from '@/lib/formulas/formula-types';

export interface IFormula extends Document {
  productName: string;
  formulaCode: string;
  formulaCreatedAt: Date;
  formulaVersion: string;
  productObjectives: string[];
  productType: string;
  status: FormulaStatus;
  targetBatchGrams: number;
  phases?: FormulaPhase;
  procedureSteps: FormulaProcedureStep[];
  technicalData?: FormulaTechnicalData;
  productEvaluation?: FormulaProductEvaluation;
  useTest?: FormulaUseTest;
  inci?: FormulaInci;
  finalObservations?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<FormulaIngredient>(
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
        message: 'grams must be greater than 0',
      },
    },
  },
  { _id: false }
);

const ProcedureStepSchema = new Schema<FormulaProcedureStep>(
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

const FormulaSchema = new Schema<IFormula>(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    formulaCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    formulaCreatedAt: {
      type: Date,
      required: true,
    },
    formulaVersion: {
      type: String,
      required: true,
      trim: true,
    },
    productObjectives: {
      type: [String],
      default: [],
    },
    productType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: FORMULA_STATUSES,
      default: 'draft',
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
    phases: {
      type: {
        aqueous: {
          type: [IngredientSchema],
          default: undefined,
        },
        oil: {
          type: [IngredientSchema],
          default: undefined,
        },
        actives: {
          type: [IngredientSchema],
          default: undefined,
        },
      },
      default: undefined,
    },
    procedureSteps: {
      type: [ProcedureStepSchema],
      required: true,
      default: [],
    },
    technicalData: {
      type: {
        finalPh: { type: Number },
        productionTemperatureCelsius: { type: Number },
        mixingTimeMinutes: { type: Number },
        preservative: { type: String, trim: true },
        fragrance: { type: String, trim: true },
        color: { type: String, trim: true },
      },
      default: undefined,
    },
    productEvaluation: {
      type: {
        texture: { type: String, trim: true },
        color: { type: String, trim: true },
        smell: { type: String, trim: true },
        viscosity: { type: String, trim: true },
        absorption: { type: String, trim: true },
        foam: { type: String, trim: true },
        stability: { type: String, trim: true },
      },
      default: undefined,
    },
    useTest: {
      type: {
        approxExpirationDate: { type: Date },
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
      default: undefined,
    },
    inci: {
      type: {
        function: { type: String, trim: true },
        emulsionType: { type: String, trim: true },
        dosage: { type: String, trim: true },
        temperature: { type: String, trim: true },
        compatibility: { type: String, trim: true },
        inconveniences: { type: String, trim: true },
        ph: { type: String, trim: true },
      },
      default: undefined,
    },
    finalObservations: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

FormulaSchema.pre<IFormula>('validate', function () {
  const steps = this.procedureSteps;

  if (steps && steps.length > 0) {
    const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

    const hasInvalidNumber = sorted.some(
      (step) => !Number.isInteger(step.stepNumber) || step.stepNumber <= 0
    );

    if (hasInvalidNumber) {
      throw new Error('procedure step numbers must be positive integers');
    }

    const numbers = sorted.map((step) => step.stepNumber);
    const unique = new Set(numbers);

    if (unique.size !== numbers.length) {
      throw new Error('procedure step numbers must be unique');
    }

    this.procedureSteps = sorted;
  }
});

export const FormulaModel: Model<IFormula> =
  mongoose.models.Formula ?? mongoose.model<IFormula>('Formula', FormulaSchema);
