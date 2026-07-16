import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormulaForm from '@/components/laboratorio/formula-form';
import { SubmitFormulaResult } from '@/lib/formulas/formula-form-contract';
import { createEmptyFormulaForm } from '@/lib/formulas/formula-form-contract';

const submitFormulaMock = vi.fn<(_values: unknown) => Promise<SubmitFormulaResult>>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

describe('FormulaForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all minimum form sections in create mode', () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    expect(screen.getByRole('form', { name: /nueva fórmula/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /identidad/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /clasificación/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /tamaño del lote/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /fases e ingredientes/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /procedimiento/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /objetivos del producto/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /datos técnicos/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /evaluación del producto/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /prueba de uso/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /inci/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /observaciones finales/i })).toBeInTheDocument();
  });

  it('initializes with one empty procedure step', () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const procedureField = screen.getByRole('textbox', { name: /paso de procedimiento 1/i });
    expect(procedureField).toBeInTheDocument();
    expect(procedureField).toHaveValue('');
  });

  it('defaults status to draft', () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    expect(screen.getByRole('combobox', { name: /estado/i })).toHaveValue('draft');
  });

  it('allows adding and removing ingredients from a phase', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const addButton = screen.getByRole('button', { name: /agregar ingrediente a fase acuosa/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /eliminar ingrediente 1 de la fase acuosa/i });
    await userEvent.click(removeButton);

    expect(screen.queryByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i })).not.toBeInTheDocument();
  });

  it('allows adding and removing procedure steps', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const addButton = screen.getByRole('button', { name: /agregar paso de procedimiento/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('textbox', { name: /paso de procedimiento 2/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /eliminar paso de procedimiento 2/i });
    await userEvent.click(removeButton);

    expect(screen.queryByRole('textbox', { name: /paso de procedimiento 2/i })).not.toBeInTheDocument();
  });

  it('allows adding and removing product objectives', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const addButton = screen.getByRole('button', { name: /agregar objetivo del producto/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('textbox', { name: /objetivo del producto 1/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /eliminar objetivo del producto 1/i });
    await userEvent.click(removeButton);

    expect(screen.queryByRole('textbox', { name: /objetivo del producto 1/i })).not.toBeInTheDocument();
  });

  it('allows typing technical data values', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('spinbutton', { name: /ph final/i }), '5.5');
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /temperatura de producción/i }),
      '75'
    );
    await userEvent.type(screen.getByRole('textbox', { name: /conservante/i }), 'Sorbate');

    expect(screen.getByRole('spinbutton', { name: /ph final/i })).toHaveValue(5.5);
    expect(screen.getByRole('spinbutton', { name: /temperatura de producción/i })).toHaveValue(75);
    expect(screen.getByRole('textbox', { name: /conservante/i })).toHaveValue('Sorbate');
  });

  it('allows adding and removing use test entries', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const addButton = screen.getByRole('button', { name: /agregar entrada de prueba de uso/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('textbox', { name: /nota de la entrada 1 de prueba de uso/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /eliminar entrada 1 de prueba de uso/i });
    await userEvent.click(removeButton);

    expect(screen.queryByRole('textbox', { name: /nota de la entrada 1 de prueba de uso/i })).not.toBeInTheDocument();
  });

  it('displays validation errors when submitting an empty form', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/el nombre del producto es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/el código de fórmula es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/el tipo de producto es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/el lote objetivo debe ser mayor a 0/i)).toBeInTheDocument();
    expect(screen.getByText(/se requiere al menos una fase con ingredientes/i)).toBeInTheDocument();
    expect(screen.getByText(/se requiere al menos un paso de procedimiento/i)).toBeInTheDocument();
    expect(submitFormulaMock).not.toHaveBeenCalled();
  });

  it('displays a validation error for a partially filled ingredient row', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /nombre del producto/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /código de fórmula/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /tipo de producto/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /lote objetivo/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /agregar ingrediente a fase acuosa/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i }),
      'Water'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /paso de procedimiento 1/i }),
      'Mix aqueous phase'
    );

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/cada ingrediente debe tener un nombre y gramos mayores a 0/i)
    ).toBeInTheDocument();
    expect(submitFormulaMock).not.toHaveBeenCalled();
  });

  it('displays a validation error for an invalid final pH', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /nombre del producto/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /código de fórmula/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /tipo de producto/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /lote objetivo/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /agregar ingrediente a fase acuosa/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /gramos del ingrediente 1 de la fase acuosa/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /paso de procedimiento 1/i }),
      'Mix aqueous phase'
    );

    await userEvent.type(screen.getByRole('spinbutton', { name: /ph final/i }), '15');

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/el pH final debe estar entre 0 y 14/i)
    ).toBeInTheDocument();
    expect(submitFormulaMock).not.toHaveBeenCalled();
  });

  it('displays a validation error for a use test entry missing a note', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /nombre del producto/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /código de fórmula/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /tipo de producto/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /lote objetivo/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /agregar ingrediente a fase acuosa/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /gramos del ingrediente 1 de la fase acuosa/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /paso de procedimiento 1/i }),
      'Mix aqueous phase'
    );

    await userEvent.click(screen.getByRole('button', { name: /agregar entrada de prueba de uso/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /nota de la entrada 1 de prueba de uso/i }),
      'Good texture'
    );

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/cada entrada de prueba de uso debe tener una fecha y una nota/i)
    ).toBeInTheDocument();
    expect(submitFormulaMock).not.toHaveBeenCalled();
  });

  it('submits the form when all required fields are valid', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /nombre del producto/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /código de fórmula/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /tipo de producto/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /lote objetivo/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /agregar ingrediente a fase acuosa/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /gramos del ingrediente 1 de la fase acuosa/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /paso de procedimiento 1/i }),
      'Mix aqueous phase'
    );

    submitFormulaMock.mockResolvedValue({ success: true });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitFormulaMock).toHaveBeenCalledTimes(1));
    expect(submitFormulaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: 'Lavender cream',
        formulaCode: 'CF-001',
        productType: 'cream',
        targetBatchGrams: 500,
      })
    );
  });

  it('submits rich formula blocks with the form values', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /nombre del producto/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /código de fórmula/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /tipo de producto/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /lote objetivo/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /agregar ingrediente a fase acuosa/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /gramos del ingrediente 1 de la fase acuosa/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /paso de procedimiento 1/i }),
      'Mix aqueous phase'
    );

    await userEvent.click(screen.getByRole('button', { name: /agregar objetivo del producto/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /objetivo del producto 1/i }),
      'hydrating'
    );

    await userEvent.type(screen.getByRole('spinbutton', { name: /ph final/i }), '5.5');
    await userEvent.type(screen.getByRole('textbox', { name: /conservante/i }), 'Sorbate');
    await userEvent.type(screen.getByRole('textbox', { name: /textura/i }), 'Creamy');

    await userEvent.type(
      screen.getByRole('textbox', { name: /observaciones finales/i }),
      'First batch'
    );

    submitFormulaMock.mockResolvedValue({ success: true });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitFormulaMock).toHaveBeenCalledTimes(1));
    expect(submitFormulaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        productObjectives: [expect.objectContaining({ value: 'hydrating' })],
        technicalData: expect.objectContaining({ finalPh: 5.5, preservative: 'Sorbate' }),
        productEvaluation: expect.objectContaining({ texture: 'Creamy' }),
        finalObservations: 'First batch',
      })
    );
  });

  it('displays a server error when the action fails', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /nombre del producto/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /código de fórmula/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /tipo de producto/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /lote objetivo/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /agregar ingrediente a fase acuosa/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /gramos del ingrediente 1 de la fase acuosa/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /paso de procedimiento 1/i }),
      'Mix aqueous phase'
    );

    submitFormulaMock.mockResolvedValue({ success: false, error: 'El servidor rechazó la fórmula' });

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/el servidor rechazó la fórmula/i)).toBeInTheDocument();
  });

  describe('edit mode', () => {
    it('uses edit mode aria-label and submit button text', () => {
      render(<FormulaForm mode="edit" submitFormula={submitFormulaMock} />);

      expect(screen.getByRole('form', { name: /editar fórmula/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /actualizar fórmula/i })).toBeInTheDocument();
    });

    it('initializes with provided values', () => {
      const initialValues = createEmptyFormulaForm();
      initialValues.productName = 'Existing formula';
      initialValues.formulaCode = 'CF-999';
      initialValues.productType = 'Serum';
      initialValues.targetBatchGrams = 250;
      initialValues.productObjectives = [{ value: 'hydrating' }];
      initialValues.technicalData.finalPh = 5.5;
      initialValues.productEvaluation.texture = 'Creamy';
      initialValues.useTest.approxExpirationDate = '2026-12-01';
      initialValues.inci.function = 'Emollient';
      initialValues.finalObservations = 'Ready';

      render(<FormulaForm mode="edit" initialValues={initialValues} submitFormula={submitFormulaMock} />);

      expect(screen.getByRole('textbox', { name: /nombre del producto/i })).toHaveValue('Existing formula');
      expect(screen.getByRole('textbox', { name: /código de fórmula/i })).toHaveValue('CF-999');
      expect(screen.getByRole('textbox', { name: /tipo de producto/i })).toHaveValue('Serum');
      expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toHaveValue(250);
      expect(screen.getByRole('textbox', { name: /objetivo del producto 1/i })).toHaveValue('hydrating');
      expect(screen.getByRole('spinbutton', { name: /ph final/i })).toHaveValue(5.5);
      expect(screen.getByRole('textbox', { name: /textura/i })).toHaveValue('Creamy');
      expect(screen.getByRole('textbox', { name: /función/i })).toHaveValue('Emollient');
      expect(screen.getByRole('textbox', { name: /observaciones finales/i })).toHaveValue('Ready');
    });

    it('submits in edit mode using the provided submit action', async () => {
      const initialValues = createEmptyFormulaForm();
      initialValues.productName = 'Existing formula';
      initialValues.formulaCode = 'CF-999';
      initialValues.productType = 'Serum';
      initialValues.targetBatchGrams = 250;
      initialValues.phases.aqueous = [{ ingredient: 'Water', grams: 250 }];
      initialValues.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];

      render(<FormulaForm mode="edit" initialValues={initialValues} submitFormula={submitFormulaMock} />);

      submitFormulaMock.mockResolvedValue({ success: true });

      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => expect(submitFormulaMock).toHaveBeenCalledTimes(1));
      expect(submitFormulaMock).toHaveBeenCalledWith(
        expect.objectContaining({
          productName: 'Existing formula',
          formulaCode: 'CF-999',
          productType: 'Serum',
          targetBatchGrams: 250,
        })
      );
    });

    it('displays validation errors when submitting an empty prefilled form in edit mode', async () => {
      const initialValues = createEmptyFormulaForm();

      render(<FormulaForm mode="edit" initialValues={initialValues} submitFormula={submitFormulaMock} />);

      fireEvent.submit(screen.getByRole('form'));

      expect(await screen.findByText(/el nombre del producto es obligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/el código de fórmula es obligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/el tipo de producto es obligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/el lote objetivo debe ser mayor a 0/i)).toBeInTheDocument();
      expect(screen.getByText(/se requiere al menos una fase con ingredientes/i)).toBeInTheDocument();
      expect(screen.getByText(/se requiere al menos un paso de procedimiento/i)).toBeInTheDocument();
      expect(submitFormulaMock).not.toHaveBeenCalled();
    });

    it('displays a server error when the update action fails', async () => {
      const initialValues = createEmptyFormulaForm();
      initialValues.productName = 'Existing formula';
      initialValues.formulaCode = 'CF-999';
      initialValues.productType = 'Serum';
      initialValues.targetBatchGrams = 250;
      initialValues.phases.aqueous = [{ ingredient: 'Water', grams: 250 }];
      initialValues.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];

      render(<FormulaForm mode="edit" initialValues={initialValues} submitFormula={submitFormulaMock} />);

      submitFormulaMock.mockResolvedValue({ success: false, error: 'El servidor rechazó la actualización' });

      fireEvent.submit(screen.getByRole('form'));

      expect(await screen.findByText(/el servidor rechazó la actualización/i)).toBeInTheDocument();
    });
  });
});
