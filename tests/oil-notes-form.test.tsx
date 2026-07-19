import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OilNotesForm from '@/components/laboratorio/oil-notes-form';
import type { OilNotesFormValues, SubmitOilNotesResult } from '@/lib/aceites/oil-notes-form-contract';

const submitOilNotesMock = vi.fn<(values: OilNotesFormValues) => Promise<SubmitOilNotesResult>>();
const { routerRefreshMock } = vi.hoisted(() => ({ routerRefreshMock: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: routerRefreshMock }) }));

describe('OilNotesForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves the footer note and refreshes the canonical detail', async () => {
    submitOilNotesMock.mockResolvedValue({ success: true });
    render(<OilNotesForm initialNotes="Anterior" submitOilNotes={submitOilNotesMock} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Notas' }), { target: { value: 'Actualizada' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));
    await waitFor(() => expect(submitOilNotesMock).toHaveBeenCalledWith({ notes: 'Actualizada' }));
    expect(routerRefreshMock).toHaveBeenCalledOnce();
    expect(screen.getByText('Notas guardadas.')).toBeInTheDocument();
  });

  it('shows validation and server errors without refreshing', async () => {
    render(<OilNotesForm initialNotes={'x'.repeat(2001)} submitOilNotes={submitOilNotesMock} />);
    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));
    expect(await screen.findByText('Las notas no pueden superar los 2000 caracteres')).toBeInTheDocument();
    expect(submitOilNotesMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Notas' }), { target: { value: 'Válida' } });
    submitOilNotesMock.mockResolvedValue({ success: false, error: 'No se pudo guardar la nota' });
    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar la nota');
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });
});
