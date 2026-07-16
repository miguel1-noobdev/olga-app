import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  auditSummary,
  createAdministrativeAuditEvent,
  createAdministrativeAuditRepository,
} from '@/lib/admin/users/activity';

describe('administrative user activity', () => {
  it('retains an approved role-change summary without identities or sensitive values', () => {
    const event = createAdministrativeAuditEvent({
      type: 'role_changed',
      subjectUserId: 'user-1',
      actorUserId: 'admin-1',
      occurredAt: '2026-07-16T00:00:00.000Z',
    });

    expect(auditSummary(event)).toEqual({
      type: 'role_changed',
      occurredAt: '2026-07-16T00:00:00.000Z',
    });
  });

  it('rejects non-administrative activity and redacts event internals', () => {
    expect(() =>
      createAdministrativeAuditEvent({
        type: 'page_view',
        subjectUserId: 'user-1',
        actorUserId: 'admin-1',
        occurredAt: '2026-07-16T00:00:00.000Z',
      })
    ).toThrow('Unsupported administrative audit event');
  });
});

describe('administrative audit repository', () => {
  let mongoServer: MongoMemoryServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('permanently stores and lists only redacted administrative summaries', async () => {
    const repository = createAdministrativeAuditRepository();
    await repository.record(
      createAdministrativeAuditEvent({
        type: 'account_status_changed',
        subjectUserId: 'user-1',
        actorUserId: 'admin-1',
        occurredAt: '2026-07-16T00:00:00.000Z',
      })
    );

    await expect(repository.listSummaries()).resolves.toEqual([
      { type: 'account_status_changed', occurredAt: '2026-07-16T00:00:00.000Z' },
    ]);
  });
});
