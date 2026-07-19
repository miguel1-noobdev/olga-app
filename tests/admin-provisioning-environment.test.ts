import { describe, expect, it } from 'vitest';
import { readAdminProvisioningEnvironment } from '../scripts/admin-provisioning-environment';

const validEnvironment = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/botanica-ob',
  ADMIN_EMAIL: 'operator@example.test',
  ADMIN_PASSWORD: 'not-a-real-secret',
};

describe('admin provisioning environment', () => {
  it('requires every credential environment variable without exposing a value', () => {
    expect(() => readAdminProvisioningEnvironment({ MONGODB_URI: validEnvironment.MONGODB_URI })).toThrow(
      'Configuration error: MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD are required.'
    );
  });

  it('rejects malformed configuration without including supplied values in the error', () => {
    const environment = {
      ...validEnvironment,
      MONGODB_URI: 'not-a-mongodb-uri',
      ADMIN_EMAIL: 'not-an-email',
      ADMIN_PASSWORD: 'short',
    };

    expect(() => readAdminProvisioningEnvironment(environment)).toThrow(
      'Configuration error: MONGODB_URI must be a valid MongoDB connection URI.'
    );
    expect(() => readAdminProvisioningEnvironment(environment)).not.toThrow(environment.MONGODB_URI);
  });

  it('rejects an invalid admin email and a short password', () => {
    expect(() => readAdminProvisioningEnvironment({
      ...validEnvironment,
      ADMIN_EMAIL: 'not-an-email',
    })).toThrow('Configuration error: ADMIN_EMAIL must be a valid email address.');

    expect(() => readAdminProvisioningEnvironment({
      ...validEnvironment,
      ADMIN_PASSWORD: 'short',
    })).toThrow('Configuration error: ADMIN_PASSWORD must be at least 12 characters.');
  });

  it('returns valid environment values for the secured scripts', () => {
    expect(readAdminProvisioningEnvironment(validEnvironment)).toEqual(validEnvironment);
  });
});
