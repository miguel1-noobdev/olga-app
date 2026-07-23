import { isValidMongoUri } from '../src/lib/db/connect';

type ProductoraProvisioningEnvironment = Partial<
  Pick<NodeJS.ProcessEnv, 'MONGODB_URI' | 'OLGA_EMAIL' | 'OLGA_PASSWORD'>
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PRODUCTORA_PASSWORD_LENGTH = 12;

export interface ProductoraProvisioningConfig {
  MONGODB_URI: string;
  OLGA_EMAIL: string;
  OLGA_PASSWORD: string;
}

export function readProductoraProvisioningEnvironment(
  environment: ProductoraProvisioningEnvironment = process.env as ProductoraProvisioningEnvironment
): ProductoraProvisioningConfig {
  const mongodbUri = environment.MONGODB_URI?.trim();
  const olgaEmail = environment.OLGA_EMAIL?.trim().toLowerCase();
  const olgaPassword = environment.OLGA_PASSWORD;

  if (!mongodbUri || !olgaEmail || !olgaPassword) {
    throw new Error('Configuration error: MONGODB_URI, OLGA_EMAIL, and OLGA_PASSWORD are required.');
  }

  if (!isValidMongoUri(mongodbUri)) {
    throw new Error('Configuration error: MONGODB_URI must be a valid MongoDB connection URI.');
  }

  if (!EMAIL_REGEX.test(olgaEmail)) {
    throw new Error('Configuration error: OLGA_EMAIL must be a valid email address.');
  }

  if (olgaPassword.trim().length < MIN_PRODUCTORA_PASSWORD_LENGTH) {
    throw new Error('Configuration error: OLGA_PASSWORD must be at least 12 characters.');
  }

  return {
    MONGODB_URI: mongodbUri,
    OLGA_EMAIL: olgaEmail,
    OLGA_PASSWORD: olgaPassword,
  };
}
