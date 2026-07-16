import mongoose, { Schema } from 'mongoose';

export type AdministrativeAuditEventType = 'role_changed' | 'account_status_changed';

export interface AdministrativeAuditEvent {
  type: AdministrativeAuditEventType;
  subjectUserId: string;
  actorUserId: string;
  occurredAt: string;
}

export interface AdministrativeAuditSummary {
  type: AdministrativeAuditEventType;
  occurredAt: string;
}

const APPROVED_EVENT_TYPES: readonly AdministrativeAuditEventType[] = [
  'role_changed',
  'account_status_changed',
];

const AdministrativeAuditSchema = new Schema<AdministrativeAuditEvent>(
  {
    type: { type: String, enum: APPROVED_EVENT_TYPES, required: true },
    subjectUserId: { type: String, required: true },
    actorUserId: { type: String, required: true },
    occurredAt: { type: String, required: true },
  },
  { versionKey: false }
);

const AdministrativeAuditModel =
  mongoose.models.AdministrativeAudit ??
  mongoose.model<AdministrativeAuditEvent>('AdministrativeAudit', AdministrativeAuditSchema);

export function createAdministrativeAuditEvent(input: {
  type: string;
  subjectUserId: string;
  actorUserId: string;
  occurredAt: string;
}): AdministrativeAuditEvent {
  if (!APPROVED_EVENT_TYPES.includes(input.type as AdministrativeAuditEventType)) {
    throw new Error('Unsupported administrative audit event');
  }

  return input as AdministrativeAuditEvent;
}

export function auditSummary(event: AdministrativeAuditEvent): AdministrativeAuditSummary {
  return { type: event.type, occurredAt: event.occurredAt };
}

export interface AdministrativeAuditRepository {
  record(event: AdministrativeAuditEvent): Promise<void>;
  listSummaries(): Promise<AdministrativeAuditSummary[]>;
}

export function createAdministrativeAuditRepository(): AdministrativeAuditRepository {
  return {
    async record(event: AdministrativeAuditEvent): Promise<void> {
      await AdministrativeAuditModel.create(event);
    },

    async listSummaries(): Promise<AdministrativeAuditSummary[]> {
      const events = await AdministrativeAuditModel.find({}).sort({ occurredAt: -1 });
      return events.map((event) => auditSummary(event));
    },
  };
}
