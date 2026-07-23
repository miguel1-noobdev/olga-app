import { isPersistenceInputError } from '@/lib/validation/runtime-input';

export function getSafeServerActionError(
  error: unknown,
  fallback: string
): string {
  return isPersistenceInputError(error) ? 'Entrada inválida' : fallback;
}
