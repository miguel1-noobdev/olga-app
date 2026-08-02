import { describe, expect, it } from 'vitest';
import { request as httpRequest } from 'node:http';
import { createEmailSender } from '@/lib/email/sender';

const MAILPIT_API = 'http://127.0.0.1:8025/api/v1';

function mailpitRequest(path: string, method = 'GET'): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(`${MAILPIT_API}${path}`, { method }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => (body += chunk));
      response.on('end', () => resolve(body === 'ok' ? null : JSON.parse(body)));
    });
    request.on('error', reject);
    request.end();
  });
}

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
