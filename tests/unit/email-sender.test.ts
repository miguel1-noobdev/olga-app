import { EventEmitter } from 'node:events';
import net from 'node:net';
import { describe, expect, it, vi } from 'vitest';
import { createEmailSender } from '@/lib/email/sender';

vi.mock('node:net', () => ({
  default: { connect: vi.fn() },
}));

class RejectingSmtpSocket extends EventEmitter {
  write(command: string): boolean {
    const response = command === 'DATA\r\n'
      ? '354 send message\r\n'
      : command.endsWith('\r\n.\r\n')
        ? '550 message rejected\r\n'
        : '250 accepted\r\n';

    queueMicrotask(() => this.emit('data', Buffer.from(response)));
    return true;
  }

  end(): this {
    return this;
  }

  setTimeout(): this {
    return this;
  }
}

describe('SMTP email sender', () => {
  it('fails delivery when the SMTP server rejects the completed DATA command', async () => {
    const socket = new RejectingSmtpSocket();
    vi.mocked(net.connect).mockImplementation(() => {
      queueMicrotask(() => {
        socket.emit('connect');
        queueMicrotask(() => socket.emit('data', Buffer.from('220 test SMTP\r\n')));
      });
      return socket as unknown as net.Socket;
    });

    const sender = createEmailSender({
      NODE_ENV: 'test', SMTP_HOST: '127.0.0.1', SMTP_PORT: '1025', SMTP_FROM: 'esenciales.ob@gmail.com',
    });

    await expect(sender.send({ to: 'reader@example.test', template: 'verify', tokenUrl: 'https://botanicaob.example.test/verify?token=test' }))
      .rejects.toThrow('Email delivery failed.');
    expect(net.connect).toHaveBeenCalledWith({ host: '127.0.0.1', port: 1025 });
  });
});
