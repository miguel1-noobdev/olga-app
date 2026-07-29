import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CONFIG_PATH = resolve(process.cwd(), 'ops/nginx/botanicasob.conf');

describe('production Nginx topology', () => {
  it('redirects HTTP while preserving the ACME challenge path', () => {
    const config = readFileSync(CONFIG_PATH, 'utf8');

    expect(config).toContain('server_name botanicaob.duckdns.org;');
    expect(config).toContain('location ^~ /.well-known/acme-challenge/');
    expect(config).toContain('root /var/www/botanicaob-acme;');
    expect(config).toContain('return 301 https://$host$request_uri;');
  });

  it('terminates TLS with the acme.sh-installed certificate and secure protocols', () => {
    const config = readFileSync(CONFIG_PATH, 'utf8');

    expect(config).toContain('listen 443 ssl;');
    expect(config).toContain('ssl_certificate /etc/nginx/ssl/botanicaob.duckdns.org/fullchain.pem;');
    expect(config).toContain('ssl_certificate_key /etc/nginx/ssl/botanicaob.duckdns.org/key.pem;');
    expect(config).toContain('ssl_protocols TLSv1.2 TLSv1.3;');
  });

  it('proxies HTTPS application traffic only to the loopback Next.js listener', () => {
    const config = readFileSync(CONFIG_PATH, 'utf8');

    expect(config).toContain('proxy_pass http://127.0.0.1:3000;');
    expect(config).toContain('proxy_set_header X-Forwarded-Proto $scheme;');
    expect(config).toContain('proxy_read_timeout 60s;');
    expect(config).not.toContain('proxy_pass http://0.0.0.0:3000;');
  });
});
