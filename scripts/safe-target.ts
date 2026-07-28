import { isValidMongoUri } from '../src/lib/db/connect';

const SAFE_DATABASES = {
  development: 'botanica-ob',
  test: 'botanica-ob-test',
  production: 'botanica-ob',
} as const;

const SAFE_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export type ScriptEnvironment = keyof typeof SAFE_DATABASES;

export interface SafeScriptTarget {
  environment: ScriptEnvironment;
  databaseName: string;
  MONGODB_URI: string;
}

export interface ScriptTargetEnvironment {
  SCRIPT_ENV?: string;
  MONGODB_URI?: string;
}

export function readSafeScriptTarget(
  environment: ScriptTargetEnvironment = process.env as ScriptTargetEnvironment,
): SafeScriptTarget {
  const scriptEnvironment = environment.SCRIPT_ENV?.trim().toLowerCase();

  if (!scriptEnvironment || !(scriptEnvironment in SAFE_DATABASES)) {
    throw new Error(
      'Script configuration error: SCRIPT_ENV must be one of development, test, or production.',
    );
  }

  const mongodbUri = environment.MONGODB_URI?.trim();

  if (!mongodbUri || !isValidMongoUri(mongodbUri)) {
    throw new Error(
      'Script configuration error: MONGODB_URI must be a valid MongoDB connection URI.',
    );
  }

  const parsed = new URL(mongodbUri);
  const hostname = parsed.hostname.toLowerCase();

  if (!SAFE_HOSTS.has(hostname)) {
    throw new Error('Script configuration error: MongoDB host is not allowlisted.');
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));

  if (databaseName !== SAFE_DATABASES[scriptEnvironment as ScriptEnvironment]) {
    throw new Error(
      'Script configuration error: database target is not allowlisted for this environment.',
    );
  }

  if (scriptEnvironment === 'production' && (!parsed.username || !parsed.password)) {
    throw new Error(
      'Script configuration error: production MongoDB target must be authenticated.',
    );
  }

  return {
    environment: scriptEnvironment as ScriptEnvironment,
    databaseName,
    MONGODB_URI: mongodbUri,
  };
}
