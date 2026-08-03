export interface EmailConfig {
  transport: 'smtp';
  host: string;
  port: number;
  secure: boolean;
  from: string;
  user: string;
  auth?: {
    user: string;
    password: string;
  };
}

const APPROVED_SENDER = 'esenciales.ob@gmail.com';

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error('Email delivery configuration is unavailable.');
  }
  return value;
}

export function readEmailConfig(environment: NodeJS.ProcessEnv = process.env): EmailConfig {
  const isTest = environment.NODE_ENV === 'test';
  const host = environment.SMTP_HOST?.trim() || (isTest ? '127.0.0.1' : '');
  const portValue = environment.SMTP_PORT?.trim() || (isTest ? '1025' : '');
  const user = environment.SMTP_USER?.trim() || (isTest ? APPROVED_SENDER : '');
  const password = environment.SMTP_PASSWORD || (isTest ? '' : '');
  const from = environment.SMTP_FROM?.trim() || (isTest ? APPROVED_SENDER : '');

  if (isTest && (host !== '127.0.0.1' || portValue !== '1025')) {
    throw new Error('Email test delivery must use local Mailpit.');
  }

  if (!host || !portValue || !user || !from || (!isTest && !password)) {
    throw new Error('Email delivery configuration is unavailable.');
  }

  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || from !== APPROVED_SENDER) {
    throw new Error('Email delivery configuration is invalid.');
  }

  const secure = environment.SMTP_SECURE ? environment.SMTP_SECURE === 'true' : port === 465;
  if (!isTest && !secure) {
    throw new Error('Email delivery requires TLS when SMTP authentication is configured.');
  }

  return {
    transport: 'smtp',
    host,
    port,
    secure,
    from,
    user,
    auth: isTest ? undefined : { user, password },
  };
}

export { APPROVED_SENDER };
