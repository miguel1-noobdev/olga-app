import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, 'next.config.mjs');
const googleAvatarUrl = 'https://lh3.googleusercontent.com/offline-avatar.png';

const renderImageScript = String.raw`
(async () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Image = require('next/image').default;
  const { ImageConfigContext } = require('next/dist/shared/lib/image-config-context.shared-runtime');
  const { imageConfigDefault } = require('next/dist/shared/lib/image-config');
  const { pathToFileURL } = require('node:url');
  const configPath = process.argv[1];
  const src = process.argv[2];
  const { default: nextConfig } = await import(pathToFileURL(configPath).href);
  const imageConfig = { ...imageConfigDefault, ...nextConfig.images };
  const markup = renderToStaticMarkup(
    React.createElement(
      ImageConfigContext.Provider,
      { value: imageConfig },
      React.createElement(Image, { src, alt: 'Offline test image', fill: true }),
    ),
  );
  process.stdout.write(markup);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;

function renderImage(src: string) {
  const result = spawnSync(process.execPath, ['--eval', renderImageScript, configPath, src], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'development' },
  });

  if (result.error) throw result.error;
  return result;
}

function expectRejectedImage(src: string) {
  const result = renderImage(src);

  expect(result.status).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain(
    `Invalid src prop (${src}) on \`next/image\`, hostname "${new URL(src).hostname}" is not configured under images in your \`next.config.js\``,
  );
}

describe('Next image policy', () => {
  it('renders a Google avatar through the configured Next Image policy', () => {
    const result = renderImage(googleAvatarUrl);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(encodeURIComponent(googleAvatarUrl));
  });

  it('continues to render the existing local logo through Next Image', () => {
    const result = renderImage('/img/logo/logotrans3-256.png');

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(encodeURIComponent('/img/logo/logotrans3-256.png'));
  });

  it('rejects unintended remote image hosts and protocols', () => {
    expectRejectedImage('https://evil.googleusercontent.com/offline-avatar.png');
    expectRejectedImage('http://lh3.googleusercontent.com/offline-avatar.png');
    expectRejectedImage('https://example.com/offline-avatar.png');
  });
});
