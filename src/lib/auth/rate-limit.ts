import { RateLimitModel, type RateLimitSubject } from '@/lib/db/models/rate-limit';

const WINDOW_MS = 60 * 60 * 1000;

export async function consumeRateLimit(input: {
  subject: RateLimitSubject;
  key: string;
  limit: number;
  now?: Date;
}): Promise<boolean> {
  const now = input.now ?? new Date();
  const current = await RateLimitModel.findOneAndUpdate(
    { subject: input.subject, key: input.key, expiresAt: { $gt: now } },
    { $inc: { hits: 1 } },
    { returnDocument: 'after' },
  );
  if (current) return current.hits <= input.limit;

  try {
    const created = await RateLimitModel.create({
      subject: input.subject,
      key: input.key,
      hits: 1,
      windowStartedAt: now,
      expiresAt: new Date(now.getTime() + WINDOW_MS),
    });
    return created.hits <= input.limit;
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
    return existing.hits <= input.limit;
  }
}
