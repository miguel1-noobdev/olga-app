import { describe, expect, it } from 'vitest';
import { readProductoraProvisioningEnvironment } from '../scripts/productora-provisioning-environment';

const validEnvironment = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/botanica-ob',
  OLGA_EMAIL: 'Olga@Example.Test',
  OLGA_PASSWORD: 'not-a-real-secret',
};

describe('productora provisioning environment', () => {
  it('requires every credential environment variable without exposing a value', () => {
    expect(() => readProductoraProvisioningEnvironment({ MONGODB_URI: validEnvironment.MONGODB_URI })).toThrow(
      'Configuration error: MONGODB_URI, OLGA_EMAIL, and OLGA_PASSWORD are required.'
    );
  });

  it('rejects malformed Mongo configuration without including supplied values in the error', () => {
    const environment = {
      ...validEnvironment,
      MONGODB_URI: 'not-a-mongodb-uri',
    };

    expect(() => readProductoraProvisioningEnvironment(environment)).toThrow(
      'Configuration error: MONGODB_URI must be a valid MongoDB connection URI.'
    );
    expect(() => readProductoraProvisioningEnvironment(environment)).not.toThrow(environment.MONGODB_URI);
    expect(() => readProductoraProvisioningEnvironment(environment)).not.toThrow(environment.OLGA_EMAIL);
    expect(() => readProductoraProvisioningEnvironment(environment)).not.toThrow(environment.OLGA_PASSWORD);
  });

  it('rejects an invalid Olga email and a short password without exposing either value', () => {
    const invalidEmail = 'not-an-email';
    const shortPassword = 'short';

    expect(() => readProductoraProvisioningEnvironment({
      ...validEnvironment,
      OLGA_EMAIL: invalidEmail,
    })).toThrow('Configuration error: OLGA_EMAIL must be a valid email address.');
    expect(() => readProductoraProvisioningEnvironment({
      ...validEnvironment,
      OLGA_EMAIL: invalidEmail,
    })).not.toThrow(invalidEmail);

    expect(() => readProductoraProvisioningEnvironment({
      ...validEnvironment,
      OLGA_PASSWORD: shortPassword,
    })).toThrow('Configuration error: OLGA_PASSWORD must be at least 12 characters.');
    expect(() => readProductoraProvisioningEnvironment({
      ...validEnvironment,
      OLGA_PASSWORD: shortPassword,
    })).not.toThrow(shortPassword);
  });

  it('normalizes the email and returns the validated environment values', () => {
    expect(readProductoraProvisioningEnvironment({
      ...validEnvironment,
      OLGA_EMAIL: '  Olga@Example.Test  ',
    })).toEqual({
      ...validEnvironment,
      OLGA_EMAIL: 'olga@example.test',
    });
  });
});
