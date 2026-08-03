import { RateLimitModel, type RateLimitSubject } from '@/lib/db/models/rate-limit';
import { recordAuthEvent } from '@/lib/db/models/auth-event';

const WINDOW_MS = 60 * 60 * 1000;

export const RATE_LIMITS = {
  email: 5,
  ip: 20,
} as const;

async function recordRateLimitDenial(subject: RateLimitSubject, key: string, limit: number) {
  await recordAuthEvent({
    event: 'rate_limit',
    outcome: 'denied',
    email: subject === 'email' ? key : undefined,
    ip: subject === 'ip' ? key : undefined,
    metadata: { subject, limit },
  });
}

export async function consumeRateLimit(input: {
  subject: RateLimitSubject;
  key: string;
  limit?: number;
  now?: Date;
}): Promise<boolean> {
  const now = input.now ?? new Date();
  const limit = input.limit ?? RATE_LIMITS[input.subject];
  const current = await RateLimitModel.findOneAndUpdate(
    { subject: input.subject, key: input.key, expiresAt: { $gt: now } },
    { $inc: { hits: 1 } },
    { returnDocument: 'after' },
  );
  if (current) {
    const allowed = current.hits <= limit;
    if (!allowed) await recordRateLimitDenial(input.subject, input.key, limit);
    return allowed;
  }

  try {
    const created = await RateLimitModel.create({
      subject: input.subject,
      key: input.key,
      hits: 1,
      windowStartedAt: now,
      expiresAt: new Date(now.getTime() + WINDOW_MS),
    });
    const allowed = created.hits <= limit;
    if (!allowed) await recordRateLimitDenial(input.subject, input.key, limit);
    return allowed;
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) {
      throw error;
    }

    const existing = await RateLimitModel.findOne({ subject: input.subject, key: input.key });
    if (!existing) return false;
    if (existing.expiresAt <= now) {
      existing.hits = 1;
      existing.windowStartedAt = now;
      existing.expiresAt = new Date(now.getTime() + WINDOW_MS);
      await existing.save();
      return true;
    }
    existing.hits += 1;
    await existing.save();
    const allowed = existing.hits <= limit;
    if (!allowed) await recordRateLimitDenial(input.subject, input.key, limit);
    return allowed;
  }
}
