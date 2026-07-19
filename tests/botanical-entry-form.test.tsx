import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BotanicalEntryForm from '@/components/admin/botanical-entry-form';

const push = vi.fn();
const fetchMock = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('BotanicalEntryForm oil contract', () => {
  beforeEach(() => {
    push.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'oil-1' }) });
  });

  it('maps every supported oil detail field on creation and keeps an empty percentage null', async () => {
    render(<BotanicalEntryForm kind="oils" />);

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Aceite de oliva' } });
    fireEvent.change(screen.getByLabelText('Nombre INCI'), { target: { value: 'Olea Europaea Fruit Oil' } });
    fireEvent.change(screen.getByLabelText('Solubilidad'), { target: { value: 'Liposoluble' } });
    fireEvent.change(screen.getByLabelText('Tipos de piel'), { target: { value: 'Madura\nSeca' } });
    fireEvent.change(screen.getByLabelText('Absorción'), { target: { value: 'Lenta' } });
    fireEvent.change(screen.getByLabelText('Propiedades'), { target: { value: 'Regenerador' } });
    fireEvent.change(screen.getByLabelText('Imágenes'), {
      target: { value: 'https://example.test/olive.jpg | Aceite de oliva' },
    });
    fireEvent.change(screen.getByLabelText('Notas'), { target: { value: 'Combina bien' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/botanico/oils', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'Aceite de oliva',
        inciName: 'Olea Europaea Fruit Oil',
        recommendedPercentage: null,
        solubility: 'Liposoluble',
        skinTypes: ['Madura', 'Seca'],
        absorption: 'Lenta',
        properties: ['Regenerador'],
        images: [{ url: 'https://example.test/olive.jpg', alt: 'Aceite de oliva' }],
        notes: 'Combina bien',
      }),
    }));
  });

  it('prefills and updates every supported oil detail field', async () => {
    render(<BotanicalEntryForm kind="oils" entryId="oil-1" initialValues={{
      name: 'Aceite de oliva', solubility: 'Liposoluble', skinTypes: ['Madura', 'Seca'], absorption: 'Lenta',
      properties: ['Regenerador'], images: [{ url: 'https://example.test/olive.jpg', alt: 'Aceite de oliva' }], notes: 'Combina bien',
    }} />);

    expect(screen.getByLabelText('Tipos de piel')).toHaveValue('Madura\nSeca');
    fireEvent.change(screen.getByLabelText('Notas'), { target: { value: 'Actualizada' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      id: 'oil-1', solubility: 'Liposoluble', skinTypes: ['Madura', 'Seca'], absorption: 'Lenta',
      properties: ['Regenerador'], images: [{ url: 'https://example.test/olive.jpg', alt: 'Aceite de oliva' }], notes: 'Actualizada',
    });
  });
});
