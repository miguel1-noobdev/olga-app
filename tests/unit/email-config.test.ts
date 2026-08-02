import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readEmailConfig } from '@/lib/email/config';
import { buildVerificationMessage } from '@/lib/email/templates';

describe('email configuration', () => {
  it('fails closed when SMTP configuration is incomplete', () =>
    expect(() => readEmailConfig({ NODE_ENV: 'production' })).toThrow('Email delivery configuration is unavailable'));

  it('rejects test SMTP overrides that do not target local Mailpit', () =>
    expect(() => readEmailConfig({
      NODE_ENV: 'test',
      SMTP_HOST: 'smtp.example.test',
      SMTP_PORT: '2525',
    })).toThrow('Email test delivery must use local Mailpit.'));

  it('rejects authenticated SMTP over an insecure connection', () =>
    expect(() => readEmailConfig({
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'esenciales.ob@gmail.com',
      SMTP_PASSWORD: 'test-password',
      SMTP_FROM: 'esenciales.ob@gmail.com',
    })).toThrow('Email delivery requires TLS when SMTP authentication is configured.'));

  it('accepts the approved runtime sender without exposing the credential value', () => {
    const config = readEmailConfig({ NODE_ENV: 'production', SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '465', SMTP_USER: 'esenciales.ob@gmail.com', SMTP_PASSWORD: String.fromCharCode(120), SMTP_FROM: 'esenciales.ob@gmail.com' });
    expect(config).toMatchObject({ host: 'smtp.gmail.com', port: 465, secure: true, user: 'esenciales.ob@gmail.com', from: 'esenciales.ob@gmail.com' });
    expect(config).not.toHaveProperty('password');
  });

  it('renders a verification message with the token only in the URL', () => {
    const message = buildVerificationMessage({ to: 'reader@example.test', tokenUrl: 'https://botanicaob.example/verify?token=raw-token' });
    expect(message.to).toBe('reader@example.test');
    expect(message.subject).toContain('verificación');
    expect(message.text).toContain('raw-token');
    expect(message.text).not.toContain('password');
  });

  it('documents the existing NextAuth application URL convention', () => {
    const environment = readFileSync('.env.example', 'utf8');
    expect(environment).toContain('NEXTAUTH_URL=https://botanicaob.duckdns.org');
    expect(environment).not.toContain('APP_URL=');
  });
});
