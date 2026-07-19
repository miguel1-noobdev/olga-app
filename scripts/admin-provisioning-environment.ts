import { isValidMongoUri } from '../src/lib/db/connect';

type AdminProvisioningEnvironment = Partial<
  Pick<NodeJS.ProcessEnv, 'MONGODB_URI' | 'ADMIN_EMAIL' | 'ADMIN_PASSWORD'>
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_ADMIN_PASSWORD_LENGTH = 12;

export interface AdminProvisioningConfig {
  MONGODB_URI: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
}

export function readAdminProvisioningEnvironment(
  environment: AdminProvisioningEnvironment = process.env as AdminProvisioningEnvironment
): AdminProvisioningConfig {
  const mongodbUri = environment.MONGODB_URI?.trim();
  const adminEmail = environment.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = environment.ADMIN_PASSWORD;

  if (!mongodbUri || !adminEmail || !adminPassword) {
    throw new Error('Configuration error: MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD are required.');
  }

  if (!isValidMongoUri(mongodbUri)) {
    throw new Error('Configuration error: MONGODB_URI must be a valid MongoDB connection URI.');
  }

  if (!EMAIL_REGEX.test(adminEmail)) {
    throw new Error('Configuration error: ADMIN_EMAIL must be a valid email address.');
  }

  if (adminPassword.trim().length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error('Configuration error: ADMIN_PASSWORD must be at least 12 characters.');
  }

  return {
    MONGODB_URI: mongodbUri,
    ADMIN_EMAIL: adminEmail,
    ADMIN_PASSWORD: adminPassword,
  };
}
