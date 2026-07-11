import { OilModel, IOil } from '../models/oil';

export interface OilRecord {
  id: string;
  name: string;
  inciName?: string;
  hlb?: number;
  phase?: string;
  recommendedPercentage: number | null;
  observations?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOilInput {
  name: string;
  inciName?: string;
  hlb?: number;
  phase?: string;
  recommendedPercentage?: number | null;
  observations?: string;
  notes?: string;
}

export interface UpdateOilInput {
  name?: string;
  inciName?: string;
  hlb?: number;
  phase?: string;
  recommendedPercentage?: number | null;
  observations?: string;
  notes?: string;
}

export interface OilRepository {
  create(input: CreateOilInput): Promise<OilRecord>;
  findById(id: string): Promise<OilRecord | null>;
  findByName(name: string): Promise<OilRecord | null>;
  findAll(): Promise<OilRecord[]>;
  searchByName(query: string): Promise<OilRecord[]>;
  update(id: string, input: UpdateOilInput): Promise<OilRecord>;
  delete(id: string): Promise<void>;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeName(name: string): string {
  return name.trim();
}

function toOilRecord(doc: IOil): OilRecord {
  const plain = JSON.parse(JSON.stringify(doc.toObject ? doc.toObject() : doc));

  return {
    id: doc._id.toString(),
    name: plain.name,
    inciName: plain.inciName,
    hlb: plain.hlb,
    phase: plain.phase,
    recommendedPercentage: plain.recommendedPercentage ?? null,
    observations: plain.observations,
    notes: plain.notes,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function createOilRepository(): OilRepository {
  return {
    async create(input: CreateOilInput): Promise<OilRecord> {
      const oil = await OilModel.create({
        ...input,
        name: normalizeName(input.name),
      });

      return toOilRecord(oil);
    },

    async findById(id: string): Promise<OilRecord | null> {
      const oil = await OilModel.findById(id);
      return oil ? toOilRecord(oil) : null;
    },

    async findByName(name: string): Promise<OilRecord | null> {
      const trimmed = name.trim();
      const oil = await OilModel.findOne({
        name: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' },
      });

      return oil ? toOilRecord(oil) : null;
    },

    async findAll(): Promise<OilRecord[]> {
      const oils = await OilModel.find().sort({ name: 1 });
      return oils.map(toOilRecord);
    },

    async searchByName(query: string): Promise<OilRecord[]> {
      const trimmed = query.trim();
      const regex = new RegExp(escapeRegex(trimmed), 'i');

      const oils = await OilModel.find({
        $or: [{ name: regex }, { inciName: regex }],
      }).sort({ name: 1 });

      return oils.map(toOilRecord);
    },

    async update(id: string, input: UpdateOilInput): Promise<OilRecord> {
      const existing = await OilModel.findById(id);

      if (!existing) {
        throw new Error('Oil not found');
      }

      const fields = Object.entries(input).filter(([, value]) => value !== undefined);

      for (const [key, value] of fields) {
        if (key === 'name') {
          existing.set(key, normalizeName(value as string));
        } else {
          existing.set(key, value);
        }
      }

      const oil = await existing.save();

      return toOilRecord(oil);
    },

    async delete(id: string): Promise<void> {
      const result = await OilModel.findByIdAndDelete(id);

      if (!result) {
        throw new Error('Oil not found');
      }
    },
  };
}
