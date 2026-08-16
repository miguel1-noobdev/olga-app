import { afterEach, describe, expect, it, vi } from 'vitest';
import { request as httpRequest } from 'node:http';
import { createEmailSender } from '@/lib/email/sender';

const MAILPIT_API = 'http://127.0.0.1:8025/api/v1';

function mailpitRequest(path: string, method = 'GET', requestFactory: typeof httpRequest = httpRequest): Promise<unknown> {
  if (process.env.MAILPIT_RUNTIME_TEST !== '1') {
    return Promise.reject(
      new Error(
        'Mailpit runtime tests require MAILPIT_RUNTIME_TEST=1. Start prerequisites with: docker compose up -d mongo mailpit'
      )
    );
  }

  return new Promise((resolve, reject) => {
    const request = requestFactory(`${MAILPIT_API}${path}`, { method }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => (body += chunk));
      response.on('end', () => resolve(body === 'ok' ? null : JSON.parse(body)));
    });
    request.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
        reject(new Error('Mailpit is unavailable. Start prerequisites with: docker compose up -d mongo mailpit'));
        return;
      }

      reject(error);
    });
    request.end();
  });
}

const runtimeFlag = process.env.MAILPIT_RUNTIME_TEST;

afterEach(() => {
  if (runtimeFlag === undefined) {
    delete process.env.MAILPIT_RUNTIME_TEST;
    return;
  }

  process.env.MAILPIT_RUNTIME_TEST = runtimeFlag;
});

function requestThatFails(error: Error): typeof httpRequest {
  let errorHandler: ((error: Error) => void) | undefined;
  const request = {
    on(event: string, handler: (error: Error) => void) {
      if (event === 'error') {
        errorHandler = handler;
      }
      return request;
    },
    end() {
      errorHandler?.(error);
    },
  };

  return (() => request) as unknown as typeof httpRequest;
}

describe('Mailpit runtime preflight', () => {
  it('requires the explicit runtime flag before network I/O', async () => {
    delete process.env.MAILPIT_RUNTIME_TEST;
    const request = vi.fn();

    await expect(mailpitRequest('/messages', 'GET', request as typeof httpRequest)).rejects.toThrow(
      'MAILPIT_RUNTIME_TEST=1'
    );

    expect(request).not.toHaveBeenCalled();
  });

  it('turns connection refusal into an actionable prerequisite error', async () => {
    process.env.MAILPIT_RUNTIME_TEST = '1';
    const refusal = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:8025'), { code: 'ECONNREFUSED' });

    await expect(mailpitRequest('/messages', 'GET', requestThatFails(refusal))).rejects.toThrow(
      'docker compose up -d mongo mailpit'
    );
  });

  it('preserves non-connection errors from Mailpit', async () => {
    process.env.MAILPIT_RUNTIME_TEST = '1';
    const failure = new Error('unexpected HTTP client failure');

    await expect(mailpitRequest('/messages', 'GET', requestThatFails(failure))).rejects.toBe(failure);
  });
});

describe('Mailpit-only email runtime', () => {
  it('captures verification mail locally without contacting an external provider', async () => {
    await mailpitRequest('/messages', 'DELETE');

    const sender = createEmailSender({
      NODE_ENV: 'test',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: '1025',
      SMTP_FROM: 'esenciales.ob@gmail.com',
    });
    await sender.send({
      to: 'reader@example.test',
      template: 'verify',
      tokenUrl: 'http://localhost:3000/verify?accountId=test&token=local-only-token',
    });

    const payload = (await mailpitRequest('/messages')) as { messages: Array<{ ID: string; To: Array<{ Address: string }>; From: { Address: string } }> };

    expect(payload.messages).toHaveLength(1);
    expect(payload.messages[0].To[0].Address).toBe('reader@example.test');
    expect(payload.messages[0].From.Address).toBe('esenciales.ob@gmail.com');

    expect(((await mailpitRequest(`/message/${payload.messages[0].ID}`)) as { Text: string }).Text).toContain('local-only-token');
  });
});
