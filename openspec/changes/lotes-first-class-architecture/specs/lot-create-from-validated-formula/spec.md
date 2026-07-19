# Lot Create From Validated Formula Specification

## Purpose

Lot creation flow that selects a validated formula and creates a lot with a proportionally scaled snapshot at `/laboratorio/lotes/nuevo`.

## Requirements

### Requirement: Validated Formula Selection

The system MUST present only validated formulas for lot creation at `/laboratorio/lotes/nuevo`.

When canonical creation receives a `formulaId` from a formula-context create link or a legacy-create redirect, it MUST preselect that formula only if it is currently validated. The server action MUST re-validate that formula on submit.

#### Scenario: List validated formulas

- GIVEN authenticated user with laboratory access
- WHEN navigating to `/laboratorio/lotes/nuevo`
- THEN the page lists only formulas with validated status

#### Scenario: No validated formulas available

- GIVEN no validated formulas exist
- WHEN navigating to `/laboratorio/lotes/nuevo`
- THEN the page indicates no validated formulas are available for lot creation

#### Scenario: Formula-context preselection

- GIVEN a validated formula context
- WHEN the user follows its create-lot link to `/laboratorio/lotes/nuevo?formulaId=[id]`
- THEN canonical creation preselects that validated formula
- AND submission re-validates the formula before creating the lot

### Requirement: Scaled Snapshot Creation

The system MUST scale the selected formula's snapshot proportionally to the user-specified target grams.

The server action MUST re-validate that the selected formula is still validated before creating the lot.

#### Scenario: Create lot with target grams

- GIVEN a validated formula with a 100g snapshot
- WHEN the user selects that formula and enters 200 target grams
- THEN a new lot is created with a proportionally scaled 200g snapshot
- AND the lot document stores immutable formula provenance (formulaId, code, version, formulaSnapshot)

#### Scenario: Formula unvalidated between selection and submission

- GIVEN a formula was validated at selection time
- WHEN the server action executes and the formula is no longer validated
- THEN creation is rejected with an error indicating the formula is no longer valid

### Requirement: Initial Lifecycle State

The system MUST create a new lot in `in_production` status. The only writable lifecycle statuses are `in_production`, `finalized`, and `discarded`.

#### Scenario: New lot starts in production

- GIVEN a validated formula and valid target grams
- WHEN the user creates a lot
- THEN the new lot has `in_production` status
- AND its follow-up accepts append-only dated entries

### Requirement: Create Redirect

After successful creation the system MUST redirect to `/laboratorio/lotes/[newLotId]`.

#### Scenario: Redirect after creation

- GIVEN a lot was successfully created
- WHEN the server action completes
- THEN the user is redirected to `/laboratorio/lotes/[newLotId]`
