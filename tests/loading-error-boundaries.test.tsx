import React from 'react';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import RootError from '@/app/error';
import GlobalError from '@/app/global-error';
import RootLoading from '@/app/loading';
import RootNotFound from '@/app/not-found';
import BlogError from '@/app/blog/error';
import BlogLoading from '@/app/blog/loading';
import BlogNotFound from '@/app/blog/not-found';
import JardinError from '@/app/jardin-digital/error';
import JardinLoading from '@/app/jardin-digital/loading';
import JardinNotFound from '@/app/jardin-digital/not-found';
import LaboratoryError from '@/app/laboratorio/error';
import LaboratoryLoading from '@/app/laboratorio/loading';
import LaboratoryNotFound from '@/app/laboratorio/not-found';
import AdminError from '@/app/admin/error';
import AdminLoading from '@/app/admin/loading';
import AdminNotFound from '@/app/admin/not-found';

const appRoot = path.resolve(__dirname, '../src/app');

describe('loading and error boundary coverage', () => {
  it('provides every required root and protected-segment special file', () => {
    const requiredFiles = [
      'loading.tsx',
      'error.tsx',
      'not-found.tsx',
      'global-error.tsx',
      'blog/loading.tsx',
      'blog/error.tsx',
      'blog/not-found.tsx',
      'jardin-digital/loading.tsx',
      'jardin-digital/error.tsx',
      'jardin-digital/not-found.tsx',
      'laboratorio/loading.tsx',
      'laboratorio/error.tsx',
      'laboratorio/not-found.tsx',
      'admin/loading.tsx',
      'admin/error.tsx',
      'admin/not-found.tsx',
    ];

    for (const relativePath of requiredFiles) {
      expect(existsSync(path.join(appRoot, relativePath)), relativePath).toBe(true);
    }
  });

  it('marks every interactive error boundary as a client component', () => {
    const errorFiles = ['error.tsx', 'global-error.tsx', 'blog/error.tsx', 'jardin-digital/error.tsx', 'laboratorio/error.tsx', 'admin/error.tsx'];

    for (const relativePath of errorFiles) {
      const source = readFileSync(path.join(appRoot, relativePath), 'utf8');
      expect(source.startsWith("'use client';"), relativePath).toBe(true);
    }
  });

  it('renders root loading state with a live accessible status', () => {
    render(<RootLoading />);

    expect(screen.getByRole('status', { name: /cargando/i })).toBeInTheDocument();
  });

  it.each([
    ['blog', BlogLoading],
    ['jardín digital', JardinLoading],
    ['laboratorio', LaboratoryLoading],
    ['admin', AdminLoading],
  ])('renders a responsive loading state for %s', (_name, Loading) => {
    render(<Loading />);

    expect(screen.getByRole('status', { name: /cargando/i })).toBeInTheDocument();
  });

  it.each([
    ['root', RootError],
    ['blog', BlogError],
    ['jardín digital', JardinError],
    ['laboratorio', LaboratoryError],
    ['admin', AdminError],
  ])('keeps %s error output safe and offers a user-triggered reset', (_name, ErrorBoundary) => {
    const reset = vi.fn();
    const secretError = new Error('SECRET_STACK_DIGEST_123');

    render(<ErrorBoundary error={secretError} reset={reset} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no pudimos cargar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /intentar de nuevo/i })).toBeInTheDocument();
    expect(screen.queryByText(/SECRET_STACK_DIGEST_123/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /intentar de nuevo/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders the global error boundary with a complete html document and safe output', () => {
    const reset = vi.fn();

    render(<GlobalError error={new Error('SECRET_GLOBAL_ERROR')} reset={reset} />);

    expect(document.querySelector('html')).toBeInTheDocument();
    expect(document.querySelector('body')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no pudimos cargar/i })).toBeInTheDocument();
    expect(screen.queryByText(/SECRET_GLOBAL_ERROR/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /intentar de nuevo/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['root', RootNotFound, '/'],
    ['blog', BlogNotFound, '/blog'],
    ['jardín digital', JardinNotFound, '/jardin-digital'],
    ['laboratorio', LaboratoryNotFound, '/laboratorio'],
    ['admin', AdminNotFound, '/admin'],
  ])('keeps the %s not-found recovery destination scoped to its section', (_name, NotFound, href) => {
    render(<NotFound />);

    expect(screen.getByRole('heading')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName();
    expect(link).toHaveAttribute('href', href);
  });
});
