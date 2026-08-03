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

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000);
}

async function incrementRateLimit(input: {
  subject: RateLimitSubject;
  key: string;
  now: Date;
}) {
  const expiresAt = new Date(input.now.getTime() + WINDOW_MS);
  const isCurrentWindow = { $gt: ['$expiresAt', input.now] };
  const update = [
    {
      $set: {
        hits: {
          $cond: [
            isCurrentWindow,
            { $add: [{ $ifNull: ['$hits', 0] }, 1] },
            1,
          ],
        },
        windowStartedAt: {
          $cond: [isCurrentWindow, '$windowStartedAt', input.now],
        },
        expiresAt: {
          $cond: [isCurrentWindow, '$expiresAt', expiresAt],
        },
      },
    },
  ];

  while (true) {
    try {
      const current = await RateLimitModel.findOneAndUpdate(
        { subject: input.subject, key: input.key },
        update,
        { returnDocument: 'after', updatePipeline: true, upsert: true },
      );
      if (current) return current;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  }
}

export async function consumeRateLimit(input: {
  subject: RateLimitSubject;
  key: string;
  limit?: number;
  now?: Date;
}): Promise<boolean> {
  const now = input.now ?? new Date();
  const limit = input.limit ?? RATE_LIMITS[input.subject];
  const current = await incrementRateLimit({
    subject: input.subject,
    key: input.key,
    now,
  });
  const allowed = current.hits <= limit;
  if (!allowed) await recordRateLimitDenial(input.subject, input.key, limit);
  return allowed;
}
