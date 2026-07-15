import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { getHealthReportMock } = vi.hoisted(() => ({ getHealthReportMock: vi.fn() }));

vi.mock('@/lib/admin/health', () => ({ getHealthReport: getHealthReportMock }));

import AdminHealthPage from '@/app/admin/salud/page';

describe('/admin/salud page', () => {
  it('renders generic cards for the three bounded dependencies', async () => {
    getHealthReportMock.mockResolvedValue({
      generatedAt: '2026-07-15T20:00:00.000Z',
      application: {
        state: 'ready',
        details: { routeImportsResolved: true, adminLayoutResolved: true },
      },
      mongo: {
        state: 'unavailable',
        details: { pingReachedServer: false, authenticated: false },
      },
      auth: {
        state: 'ready',
        details: {
          credentialsProviderConfigured: true,
          googleProviderConfigured: false,
          jwtSessionStrategy: true,
        },
      },
    });

    render(await AdminHealthPage());

    expect(screen.getByRole('heading', { name: 'Salud del sistema' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aplicación' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'MongoDB' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Autenticación' })).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
  });
});
