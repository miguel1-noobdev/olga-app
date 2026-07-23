export const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

export class RuntimeInputError extends Error {
  readonly status: 400 | 413;

  constructor(message: string, status: 400 | 413 = 400) {
    super(message);
    this.name = 'RuntimeInputError';
    this.status = status;
  }
}

export interface StringValidationOptions {
  maxLength: number;
  minLength?: number;
  required?: boolean;
  trim?: boolean;
}

export interface ArrayValidationOptions {
  maxLength: number;
  minLength?: number;
}

export interface NumberValidationOptions {
  min?: number;
  max?: number;
  integer?: boolean;
}

function invalid(message: string): never {
  throw new RuntimeInputError(message);
}

export function assertRecord(value: unknown, message = 'Invalid request'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid(message);
  }

  return value as Record<string, unknown>;
}

export function assertAllowedKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    invalid('Invalid request');
  }
}

export function boundedString(
  value: unknown,
  field: string,
  options: StringValidationOptions,
): string {
  if (typeof value !== 'string') {
    invalid(`Invalid ${field}`);
  }

  const normalized = options.trim === false ? value : value.trim();
  if (options.required !== false && normalized.length === 0) {
    invalid(`Invalid ${field}`);
  }
  if (options.minLength !== undefined && normalized.length < options.minLength) {
    invalid(`Invalid ${field}`);
  }
  if (normalized.length > options.maxLength) {
    invalid(`Invalid ${field}`);
  }

  return normalized;
}

export function boundedRequestId(value: unknown, field: string): string {
  const normalized = boundedString(value, field, { minLength: 1, maxLength: 128 });
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
    invalid(`Invalid ${field}`);
  }

  return normalized;
}

export function optionalString(
  value: unknown,
  field: string,
  options: StringValidationOptions,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return boundedString(value, field, { ...options, required: false });
}

export function boundedArray(
  value: unknown,
  field: string,
  options: ArrayValidationOptions,
): unknown[] {
  if (!Array.isArray(value) || value.length > options.maxLength) {
    invalid(`Invalid ${field}`);
  }
  if (options.minLength !== undefined && value.length < options.minLength) {
    invalid(`Invalid ${field}`);
  }

  return value;
}

export function finiteNumber(
  value: unknown,
  field: string,
  options: NumberValidationOptions = {},
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    invalid(`Invalid ${field}`);
  }
  if (options.integer && !Number.isInteger(value)) {
    invalid(`Invalid ${field}`);
  }
  if (options.min !== undefined && value < options.min) {
    invalid(`Invalid ${field}`);
  }
  if (options.max !== undefined && value > options.max) {
    invalid(`Invalid ${field}`);
  }

  return value;
}

export function strictDate(value: unknown, field: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    invalid(`Invalid ${field}`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    invalid(`Invalid ${field}`);
  }

  return date;
}

export function enumValue<const T extends readonly string[]>(
  value: unknown,
  field: string,
  allowedValues: T,
): T[number] {
  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    invalid(`Invalid ${field}`);
  }

  return value as T[number];
}

export function objectId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
    invalid(`Invalid ${field}`);
  }

  return value;
}

export function isSafeImageUrl(value: string): boolean {
  if (value.startsWith('/img/')) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function imageUrl(value: unknown, field = 'image'): string {
  const url = boundedString(value, field, { maxLength: 2048 });
  if (!isSafeImageUrl(url)) {
    invalid(`Invalid ${field}`);
  }

  return url;
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new RuntimeInputError('Invalid JSON request');
  }

  const declaredLength = request.headers.get('content-length');
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > MAX_REQUEST_BODY_BYTES) {
    throw new RuntimeInputError('Request body too large', 413);
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new RuntimeInputError('Invalid JSON request');
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel();
        throw new RuntimeInputError('Request body too large', 413);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof RuntimeInputError) throw error;
    throw new RuntimeInputError('Invalid JSON request');
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new RuntimeInputError('Invalid JSON request');
  }

  return assertRecord(parsed, 'Invalid JSON request');
}

export function isPersistenceInputError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  return name === 'CastError' || name === 'ValidationError' || name === 'ValidatorError';
}

export function getSafeInputError(error: unknown, fallback: string): {
  status: 400 | 413 | 500;
  message: string;
} {
  if (error instanceof RuntimeInputError) {
    return { status: error.status, message: error.message };
  }
  if (isPersistenceInputError(error)) {
    return { status: 400, message: 'Invalid request' };
  }
  return { status: 500, message: fallback };
}
