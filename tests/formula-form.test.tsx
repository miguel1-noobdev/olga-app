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

    expect(screen.getByRole('form', { name: /new formula/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /identity/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /classification/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /batch size/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /phases and ingredients/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /procedure/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /product objectives/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /technical data/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /product evaluation/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /use test/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /inci/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /final observations/i })).toBeInTheDocument();
  });

  it('initializes with one empty procedure step', () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const procedureField = screen.getByRole('textbox', { name: /procedure step 1/i });
    expect(procedureField).toBeInTheDocument();
    expect(procedureField).toHaveValue('');
  });

  it('defaults status to draft', () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    expect(screen.getByRole('combobox', { name: /status/i })).toHaveValue('draft');
  });

  it('allows adding and removing ingredients from a phase', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const addButton = screen.getByRole('button', { name: /add ingredient to aqueous phase/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('textbox', { name: /aqueous phase ingredient 1 name/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove aqueous phase ingredient 1/i });
    await userEvent.click(removeButton);

    expect(screen.queryByRole('textbox', { name: /aqueous phase ingredient 1 name/i })).not.toBeInTheDocument();
  });

  it('allows adding and removing procedure steps', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const addButton = screen.getByRole('button', { name: /add procedure step/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('textbox', { name: /procedure step 2/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove procedure step 2/i });
    await userEvent.click(removeButton);

    expect(screen.queryByRole('textbox', { name: /procedure step 2/i })).not.toBeInTheDocument();
  });

  it('allows adding and removing product objectives', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const addButton = screen.getByRole('button', { name: /add product objective/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('textbox', { name: /product objective 1/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove product objective 1/i });
    await userEvent.click(removeButton);

    expect(screen.queryByRole('textbox', { name: /product objective 1/i })).not.toBeInTheDocument();
  });

  it('allows typing technical data values', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('spinbutton', { name: /final ph/i }), '5.5');
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /production temperature/i }),
      '75'
    );
    await userEvent.type(screen.getByRole('textbox', { name: /preservative/i }), 'Sorbate');

    expect(screen.getByRole('spinbutton', { name: /final ph/i })).toHaveValue(5.5);
    expect(screen.getByRole('spinbutton', { name: /production temperature/i })).toHaveValue(75);
    expect(screen.getByRole('textbox', { name: /preservative/i })).toHaveValue('Sorbate');
  });

  it('allows adding and removing use test entries', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    const addButton = screen.getByRole('button', { name: /add use test entry/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('textbox', { name: /use test entry 1 note/i })).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove use test entry 1/i });
    await userEvent.click(removeButton);

    expect(screen.queryByRole('textbox', { name: /use test entry 1 note/i })).not.toBeInTheDocument();
  });

  it('displays validation errors when submitting an empty form', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/product name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/formula code is required/i)).toBeInTheDocument();
    expect(screen.getByText(/product type is required/i)).toBeInTheDocument();
    expect(screen.getByText(/target batch must be greater than 0/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one phase with ingredients is required/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one procedure step is required/i)).toBeInTheDocument();
    expect(submitFormulaMock).not.toHaveBeenCalled();
  });

  it('displays a validation error for a partially filled ingredient row', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /product name/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /formula code/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /product type/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /target batch/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /add ingredient to aqueous phase/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /aqueous phase ingredient 1 name/i }),
      'Water'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /procedure step 1/i }),
      'Mix aqueous phase'
    );

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/each ingredient must have a name and grams greater than 0/i)
    ).toBeInTheDocument();
    expect(submitFormulaMock).not.toHaveBeenCalled();
  });

  it('displays a validation error for an invalid final pH', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /product name/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /formula code/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /product type/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /target batch/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /add ingredient to aqueous phase/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /aqueous phase ingredient 1 name/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /aqueous phase ingredient 1 grams/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /procedure step 1/i }),
      'Mix aqueous phase'
    );

    await userEvent.type(screen.getByRole('spinbutton', { name: /final ph/i }), '15');

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/final pH must be between 0 and 14/i)
    ).toBeInTheDocument();
    expect(submitFormulaMock).not.toHaveBeenCalled();
  });

  it('displays a validation error for a use test entry missing a note', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /product name/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /formula code/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /product type/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /target batch/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /add ingredient to aqueous phase/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /aqueous phase ingredient 1 name/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /aqueous phase ingredient 1 grams/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /procedure step 1/i }),
      'Mix aqueous phase'
    );

    await userEvent.click(screen.getByRole('button', { name: /add use test entry/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /use test entry 1 note/i }),
      'Good texture'
    );

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/each use test entry must have a date and a note/i)
    ).toBeInTheDocument();
    expect(submitFormulaMock).not.toHaveBeenCalled();
  });

  it('submits the form when all required fields are valid', async () => {
    render(<FormulaForm submitFormula={submitFormulaMock} />);

    await userEvent.type(screen.getByRole('textbox', { name: /product name/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /formula code/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /product type/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /target batch/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /add ingredient to aqueous phase/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /aqueous phase ingredient 1 name/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /aqueous phase ingredient 1 grams/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /procedure step 1/i }),
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

    await userEvent.type(screen.getByRole('textbox', { name: /product name/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /formula code/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /product type/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /target batch/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /add ingredient to aqueous phase/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /aqueous phase ingredient 1 name/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /aqueous phase ingredient 1 grams/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /procedure step 1/i }),
      'Mix aqueous phase'
    );

    await userEvent.click(screen.getByRole('button', { name: /add product objective/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /product objective 1/i }),
      'hydrating'
    );

    await userEvent.type(screen.getByRole('spinbutton', { name: /final ph/i }), '5.5');
    await userEvent.type(screen.getByRole('textbox', { name: /preservative/i }), 'Sorbate');
    await userEvent.type(screen.getByRole('textbox', { name: /texture/i }), 'Creamy');

    await userEvent.type(
      screen.getByRole('textbox', { name: /final observations/i }),
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

    await userEvent.type(screen.getByRole('textbox', { name: /product name/i }), 'Lavender cream');
    await userEvent.type(screen.getByRole('textbox', { name: /formula code/i }), 'CF-001');
    await userEvent.type(screen.getByRole('textbox', { name: /product type/i }), 'cream');
    await userEvent.type(screen.getByRole('spinbutton', { name: /target batch/i }), '500');

    await userEvent.click(screen.getByRole('button', { name: /add ingredient to aqueous phase/i }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /aqueous phase ingredient 1 name/i }),
      'Water'
    );
    await userEvent.type(
      screen.getByRole('spinbutton', { name: /aqueous phase ingredient 1 grams/i }),
      '500'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /procedure step 1/i }),
      'Mix aqueous phase'
    );

    submitFormulaMock.mockResolvedValue({ success: false, error: 'Server rejected the formula' });

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/server rejected the formula/i)).toBeInTheDocument();
  });

  describe('edit mode', () => {
    it('uses edit mode aria-label and submit button text', () => {
      render(<FormulaForm mode="edit" submitFormula={submitFormulaMock} />);

      expect(screen.getByRole('form', { name: /edit formula/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update formula/i })).toBeInTheDocument();
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

      expect(screen.getByRole('textbox', { name: /product name/i })).toHaveValue('Existing formula');
      expect(screen.getByRole('textbox', { name: /formula code/i })).toHaveValue('CF-999');
      expect(screen.getByRole('textbox', { name: /product type/i })).toHaveValue('Serum');
      expect(screen.getByRole('spinbutton', { name: /target batch/i })).toHaveValue(250);
      expect(screen.getByRole('textbox', { name: /product objective 1/i })).toHaveValue('hydrating');
      expect(screen.getByRole('spinbutton', { name: /final ph/i })).toHaveValue(5.5);
      expect(screen.getByRole('textbox', { name: /texture/i })).toHaveValue('Creamy');
      expect(screen.getByRole('textbox', { name: /function/i })).toHaveValue('Emollient');
      expect(screen.getByRole('textbox', { name: /final observations/i })).toHaveValue('Ready');
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

      expect(await screen.findByText(/product name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/formula code is required/i)).toBeInTheDocument();
      expect(screen.getByText(/product type is required/i)).toBeInTheDocument();
      expect(screen.getByText(/target batch must be greater than 0/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one phase with ingredients is required/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one procedure step is required/i)).toBeInTheDocument();
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

      submitFormulaMock.mockResolvedValue({ success: false, error: 'Update rejected by server' });

      fireEvent.submit(screen.getByRole('form'));

      expect(await screen.findByText(/update rejected by server/i)).toBeInTheDocument();
    });
  });
});
