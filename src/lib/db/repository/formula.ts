import { FormulaModel, IFormula } from '../models/formula';
import { LotModel } from '../models/lot';
import { FormulaHasLotsError } from '../errors';
import type {
  FormulaRecord,
  CreateFormulaInput,
  UpdateFormulaInput,
  FormulaStatus,
} from '@/lib/formulas/formula-types';

export type {
  FormulaRecord,
  CreateFormulaInput,
  UpdateFormulaInput,
  FormulaStatus,
} from '@/lib/formulas/formula-types';

export interface FormulaRepository {
  create(input: CreateFormulaInput): Promise<FormulaRecord>;
  findById(id: string): Promise<FormulaRecord | null>;
  findByFormulaCode(code: string): Promise<FormulaRecord | null>;
  findAll(): Promise<FormulaRecord[]>;
  findByStatus(status: FormulaStatus): Promise<FormulaRecord[]>;
  searchByProductName(query: string): Promise<FormulaRecord[]>;
  update(id: string, input: UpdateFormulaInput): Promise<FormulaRecord>;
  delete(id: string): Promise<void>;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return new Date(value).toISOString();
  }

  return new Date(value as number).toISOString();
}

function cleanSubdocument<T extends Record<string, unknown>>(
  value: T | undefined
): T | undefined {
  if (!value) {
    return undefined;
  }

  const rest = { ...value };
  delete rest._id;
  return Object.keys(rest).length > 0 ? (rest as T) : undefined;
}

function cleanUseTest(
  value: { _id?: unknown; approxExpirationDate?: Date | null; entries?: Array<{ date: unknown; note: string }> } | undefined
): FormulaRecord['useTest'] | undefined {
  if (!value) {
    return undefined;
  }

  const { approxExpirationDate, entries } = value;
  const hasExpiration = Boolean(approxExpirationDate);
  const hasEntries = (entries ?? []).length > 0;

  if (!hasExpiration && !hasEntries) {
    return undefined;
  }

  return {
    approxExpirationDate: approxExpirationDate ? toIsoDate(approxExpirationDate) : null,
    entries: (entries ?? []).map((entry) => ({
      date: toIsoDate(entry.date),
      note: entry.note,
    })),
  };
}

function toFormulaRecord(doc: IFormula): FormulaRecord {
  const plain = JSON.parse(JSON.stringify(doc.toObject ? doc.toObject() : doc));

  return {
    id: doc._id.toString(),
    productName: plain.productName,
    formulaCode: plain.formulaCode,
    formulaCreatedAt: toIsoDate(plain.formulaCreatedAt),
    formulaVersion: plain.formulaVersion,
    productObjectives: plain.productObjectives,
    productType: plain.productType,
    status: plain.status,
    targetBatchGrams: plain.targetBatchGrams,
    phases: plain.phases,
    procedureSteps: plain.procedureSteps,
    technicalData: cleanSubdocument(plain.technicalData),
    productEvaluation: cleanSubdocument(plain.productEvaluation),
    useTest: cleanUseTest(plain.useTest),
    inci: cleanSubdocument(plain.inci),
    finalObservations: plain.finalObservations,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function createFormulaRepository(): FormulaRepository {
  return {
    async create(input: CreateFormulaInput): Promise<FormulaRecord> {
      const formula = await FormulaModel.create({
        ...input,
        formulaCode: normalizeCode(input.formulaCode),
      });

      return toFormulaRecord(formula);
    },

    async findById(id: string): Promise<FormulaRecord | null> {
      const formula = await FormulaModel.findById(id);
      return formula ? toFormulaRecord(formula) : null;
    },

    async findByFormulaCode(code: string): Promise<FormulaRecord | null> {
      const trimmed = code.trim();
      const formula = await FormulaModel.findOne({
        formulaCode: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' },
      });

      return formula ? toFormulaRecord(formula) : null;
    },

    async findAll(): Promise<FormulaRecord[]> {
      const formulas = await FormulaModel.find().sort({ productName: 1 });
      return formulas.map(toFormulaRecord);
    },

    async findByStatus(status: FormulaStatus): Promise<FormulaRecord[]> {
      const formulas = await FormulaModel.find({ status }).sort({ productName: 1 });
      return formulas.map(toFormulaRecord);
    },

    async searchByProductName(query: string): Promise<FormulaRecord[]> {
      const trimmed = query.trim();
      const regex = new RegExp(escapeRegex(trimmed), 'i');

      const formulas = await FormulaModel.find({ productName: regex }).sort({ productName: 1 });
      return formulas.map(toFormulaRecord);
    },

    async update(id: string, input: UpdateFormulaInput): Promise<FormulaRecord> {
      const existing = await FormulaModel.findById(id);

      if (!existing) {
        throw new Error('Formula not found');
      }

      const fields = Object.entries(input).filter(([, value]) => value !== undefined);

      for (const [key, value] of fields) {
        if (key === 'formulaCode') {
          existing.set(key, normalizeCode(value as string));
        } else {
          existing.set(key, value);
        }
      }

      const formula = await existing.save();

      return toFormulaRecord(formula);
    },

    async delete(id: string): Promise<void> {
      const existing = await FormulaModel.findById(id);

      if (!existing) {
        throw new Error('Formula not found');
      }

      const relatedLots = await LotModel.countDocuments({ formulaId: id });

      if (relatedLots > 0) {
        throw new FormulaHasLotsError();
      }

      await FormulaModel.findByIdAndDelete(id);
    },
  };
}
