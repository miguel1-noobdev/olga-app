import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlantNotesForm from '@/components/laboratorio/plant-notes-form';
import type { PlantNotesFormValues, SubmitPlantNotesResult } from '@/lib/plantas/plant-notes-form-contract';

const submitPlantNotesMock = vi.fn<(values: PlantNotesFormValues) => Promise<SubmitPlantNotesResult>>();
const { routerRefreshMock } = vi.hoisted(() => ({
  routerRefreshMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: routerRefreshMock }),
}));

describe('PlantNotesForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the initial internal note', () => {
    render(<PlantNotesForm initialNotes="Reservar flores para oleato." submitPlantNotes={submitPlantNotesMock} />);

    expect(screen.getByRole('textbox', { name: 'Notas' })).toHaveValue('Reservar flores para oleato.');
  });

  it('supports a blank initial note', () => {
    render(<PlantNotesForm initialNotes="" submitPlantNotes={submitPlantNotesMock} />);

    expect(screen.getByRole('textbox', { name: 'Notas' })).toHaveValue('');
  });

  it('refreshes the canonical detail after a successful save', async () => {
    submitPlantNotesMock.mockResolvedValue({ success: true });
    render(<PlantNotesForm initialNotes="Anterior" submitPlantNotes={submitPlantNotesMock} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Notas' }), {
      target: { value: 'Actualizada' },
    });
    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));

    await waitFor(() => expect(submitPlantNotesMock).toHaveBeenCalledWith({ notes: 'Actualizada' }));
    expect(routerRefreshMock).toHaveBeenCalledOnce();
    expect(screen.getByText('Notas guardadas.')).toBeInTheDocument();
  });

  it('shows validation and unexpected errors without refreshing', async () => {
    submitPlantNotesMock.mockResolvedValueOnce({
      success: false,
      errors: { notes: 'Las notas no pueden superar los 2000 caracteres' },
    });
    render(<PlantNotesForm initialNotes="" submitPlantNotes={submitPlantNotesMock} />);

    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));
    expect(await screen.findByText('Las notas no pueden superar los 2000 caracteres')).toBeInTheDocument();
    expect(routerRefreshMock).not.toHaveBeenCalled();

    submitPlantNotesMock.mockResolvedValueOnce({ success: false, error: 'No se pudo guardar la nota' });
    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar la nota');
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it('catches rejected actions, announces a safe error, and settles pending state', async () => {
    submitPlantNotesMock.mockRejectedValueOnce(new Error('MongoServerSelectionError mongodb://secret-host/app'));
    render(<PlantNotesForm initialNotes="Actual" submitPlantNotes={submitPlantNotesMock} />);

    const submitButton = screen.getByRole('button', { name: /guardar notas/i });
    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));

    await waitFor(() => expect(submitButton).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron guardar las notas. Intentá de nuevo.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('mongodb://secret-host');
  });

  it('associates a returned field error with the notes field', async () => {
    submitPlantNotesMock.mockResolvedValue({ success: false, errors: { notes: 'Nota inválida' } });
    render(<PlantNotesForm initialNotes="Actual" submitPlantNotes={submitPlantNotesMock} />);

    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));

    const error = await screen.findByText('Nota inválida');
    expect(error).toHaveAttribute('id', 'plant-notes-error');
    expect(screen.getByRole('textbox', { name: 'Notas' })).toHaveAttribute('aria-describedby', 'plant-notes-error');
  });

  it('keeps the button disabled until a held action settles', async () => {
    let resolveAction!: (result: SubmitPlantNotesResult) => void;
    submitPlantNotesMock.mockImplementation(() => new Promise((resolve) => {
      resolveAction = resolve;
    }));
    render(<PlantNotesForm initialNotes="Actual" submitPlantNotes={submitPlantNotesMock} />);

    const submitButton = screen.getByRole('button', { name: /guardar notas/i });
    fireEvent.submit(screen.getByRole('form', { name: 'Editar notas internas' }));
    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveTextContent('Guardando...');

    resolveAction({ success: true });
    await waitFor(() => expect(submitButton).toBeEnabled());
  });
});
