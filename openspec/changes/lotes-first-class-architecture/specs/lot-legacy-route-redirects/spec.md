# Lot Legacy Route Redirects Specification

## Purpose

Compatibility redirects from legacy formula-nested lot routes (`/laboratorio/formulas/[id]/lotes/*`) to canonical Lotes routes. Detail and edit verify lot ownership; create validates its formula context.

## Requirements

### Requirement: Legacy Detail and Edit Ownership Redirects

The system MUST redirect legacy nested detail and edit URLs to their canonical Lotes routes.

Before redirecting, the system MUST verify that `lot.formulaId === params.id`; `id` is the legacy formula parameter and `lotId` is the canonical lot parameter.

If the ownership check fails, the system MUST return `notFound()`.

Legacy detail and edit routes MUST verify that `lot.formulaId === params.id` before redirecting. Matching detail redirects to `/laboratorio/lotes/[lotId]`; matching edit redirects to `/laboratorio/lotes/[lotId]/editar`. Legacy routes MUST NOT render screens or execute actions; they redirect only.

#### Scenario: Valid legacy redirect

- GIVEN a lot with `formulaId` matching the URL formula parameter
- WHEN a user accesses `/laboratorio/formulas/[id]/lotes/[lotId]`
- THEN the system redirects to `/laboratorio/lotes/[lotId]`

#### Scenario: Ownership mismatch returns not found

- GIVEN a lot whose `formulaId` does NOT match the URL formula parameter
- WHEN a user accesses `/laboratorio/formulas/[wrongId]/lotes/[lotId]`
- THEN the system returns `notFound()`

### Requirement: Legacy Create Formula-Context Redirect

The system MUST validate the legacy formula context before redirecting `/laboratorio/formulas/[id]/lotes/nuevo`. It MUST NOT perform a lot ownership check because no lot is part of this route.

When the formula exists and is validated, the system MUST redirect with its `formulaId` as canonical creation preselection. When the formula is unavailable or not validated, the system MUST return `notFound()`.

#### Scenario: Legacy create redirect for validated formula

- GIVEN a validated formula at `/laboratorio/formulas/[id]`
- WHEN a user accesses `/laboratorio/formulas/[id]/lotes/nuevo`
- THEN the system verifies the formula context
- AND redirects to `/laboratorio/lotes/nuevo?formulaId=[id]`
- AND canonical submission re-validates the formula

#### Scenario: Legacy create unvalidated formula returns not found

- GIVEN a formula at `/laboratorio/formulas/[id]` that is not validated
- WHEN a user accesses `/laboratorio/formulas/[id]/lotes/nuevo`
- THEN the system returns `notFound()` rather than redirecting to canonical creation

#### Scenario: Valid legacy edit redirect

- GIVEN a lot with `formulaId` matching the URL formula parameter
- WHEN a user accesses `/laboratorio/formulas/[id]/lotes/[lotId]/edit`
- THEN the system redirects to `/laboratorio/lotes/[lotId]/editar`

#### Scenario: Legacy edit ownership mismatch returns not found

- GIVEN a lot whose `formulaId` does NOT match the URL formula parameter
- WHEN a user accesses `/laboratorio/formulas/[wrongId]/lotes/[lotId]/edit`
- THEN the system returns `notFound()` rather than rendering or returning a legacy edit page
