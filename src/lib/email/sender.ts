import net from 'node:net';
import tls from 'node:tls';
import { readEmailConfig } from './config';
import { buildRecoveryMessage, buildVerificationMessage, type EmailMessage } from './templates';

export interface EmailSender {
  send(message: { to: string; template: 'verify' | 'recover'; tokenUrl: string }): Promise<void>;
}

type Socket = net.Socket | tls.TLSSocket;

function readResponse(socket: Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\r\n');
      const final = lines.find((line) => /^\d{3} /.test(line));
      if (final) {
        socket.off('data', onData);
        resolve(final);
      }
    };
    socket.on('data', onData);
    socket.once('error', reject);
  });
}

async function command(socket: Socket, value: string, expected: number): Promise<void> {
  socket.write(`${value}\r\n`);
  const response = await readResponse(socket);
  if (Number(response.slice(0, 3)) !== expected) {
    throw new Error('Email delivery failed.');
  }
}

function connect(config: ReturnType<typeof readEmailConfig>): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = config.secure
      ? tls.connect({ host: config.host, port: config.port, servername: config.host })
      : net.connect({ host: config.host, port: config.port });
    socket.once('connect', () => resolve(socket));
    socket.once('error', reject);
    socket.setTimeout(10_000, () => {
      socket.destroy();
      reject(new Error('Email delivery timed out.'));
    });
  });
}

function encodeMessage(config: ReturnType<typeof readEmailConfig>, message: EmailMessage): string {
  return [
    `From: ${config.from}`,
    `To: ${message.to}`,
    `Subject: ${message.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="botanica-boundary"',
    '',
    '--botanica-boundary',
    'Content-Type: text/plain; charset=utf-8',
    '',
    message.text,
    '--botanica-boundary',
    'Content-Type: text/html; charset=utf-8',
    '',
    message.html,
    '--botanica-boundary--',
  ].join('\r\n');
}

async function sendSmtp(config: ReturnType<typeof readEmailConfig>, message: EmailMessage): Promise<void> {
  const socket = await connect(config);
  try {
    await readResponse(socket);
    await command(socket, `EHLO botanicaob.duckdns.org`, 250);
    if (config.auth) {
      await command(socket, 'AUTH LOGIN', 334);
      await command(socket, Buffer.from(config.auth.user).toString('base64'), 334);
      await command(socket, Buffer.from(config.auth.password).toString('base64'), 235);
    }
    await command(socket, `MAIL FROM:<${config.from}>`, 250);
    await command(socket, `RCPT TO:<${message.to}>`, 250);
    await command(socket, 'DATA', 354);
    await command(socket, `${encodeMessage(config, message).replace(/^\./gm, '..')}\r\n.`, 250);
    await command(socket, 'QUIT', 221);
  } finally {
    socket.end();
  }
}

export function createEmailSender(environment: NodeJS.ProcessEnv = process.env): EmailSender {
  const config = readEmailConfig(environment);
  return {
    async send({ to, template, tokenUrl }) {
      const message = template === 'verify'
        ? buildVerificationMessage({ to, tokenUrl })
        : buildRecoveryMessage({ to, tokenUrl });
      await sendSmtp(config, message);
    },
  };
}
