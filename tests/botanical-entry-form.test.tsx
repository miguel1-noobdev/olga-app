import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import BotanicalEntryForm from '@/components/admin/botanical-entry-form';

describe('BotanicalEntryForm', () => {
  beforeEach(() => pushMock.mockReset());

  it('submits a plant to the protected canonical catalog endpoint and returns to the catalog', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'plant-1' }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<BotanicalEntryForm kind="plants" />);
    await user.type(screen.getByLabelText('Nombre común'), 'Lavanda');
    await user.type(screen.getByLabelText('Nombre científico'), 'Lavandula angustifolia');
    await user.type(screen.getByLabelText('Familia'), 'Lamiaceae');
    await user.click(screen.getByRole('button', { name: 'Guardar planta' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/botanico/plants', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commonName: 'Lavanda', scientificName: 'Lavandula angustifolia', family: 'Lamiaceae' }),
    }));
    expect(pushMock).toHaveBeenCalledWith('/admin/botanico');
  });

  it('shows the server validation error and keeps an invalid oil/extract out of the catalog', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: { recommendedPercentage: 'Recommended percentage must be between 0 and 100.' },
    }), { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<BotanicalEntryForm kind="oils" />);
    await user.type(screen.getByLabelText('Nombre'), 'Aceite de jojoba');
    await user.clear(screen.getByLabelText('Porcentaje recomendado'));
    await user.type(screen.getByLabelText('Porcentaje recomendado'), '120');
    await user.click(screen.getByRole('button', { name: 'Guardar aceite o extracto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Recommended percentage must be between 0 and 100.');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
