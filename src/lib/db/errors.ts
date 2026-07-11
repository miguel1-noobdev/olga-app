export class FormulaHasLotsError extends Error {
  readonly code = 'FORMULA_HAS_LOTS';

  constructor(
    message = 'Cannot delete formula because it has related lots. Archive the formula instead.'
  ) {
    super(message);
    this.name = 'FormulaHasLotsError';
  }
}
