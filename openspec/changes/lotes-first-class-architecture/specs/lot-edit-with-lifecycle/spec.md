# Lot Edit With Lifecycle Specification

## Purpose

Lot edit page at `/laboratorio/lotes/[lotId]/editar` with lifecycle-aware guards that enforce different editability rules per lot status. The Spanish segment `editar` is the intentional canonical route convention.

## Requirements

### Requirement: Lifecycle Edit Rules

The system MUST allow production edits, including target grams and rescaling only that lot's snapshot, only in `in_production` status.

The system MUST freeze all production fields and the snapshot when status is `finalized` or `discarded`.

The system MUST allow append-only dated follow-up entries for `in_production`, `finalized`, and `discarded` lots. A finalized lot is historical in the same collection and keeps this follow-up available indefinitely.

#### Scenario: Edit in-production lot

- GIVEN a lot with status `in_production`
- WHEN the user changes target grams
- THEN the snapshot is regenerated proportionally

#### Scenario: Edit finalized lot production fields rejected

- GIVEN a lot with status `finalized`
- WHEN the user attempts to modify production fields or snapshot
- THEN the system rejects the mutation

#### Scenario: Append follow-up on finalized lot

- GIVEN a lot with status `finalized`
- WHEN the user appends a follow-up entry
- THEN the entry is added to `followUp.entries`

#### Scenario: Edit discarded lot

- GIVEN a lot with status `discarded`
- WHEN the user changes target grams or another production field
- THEN the system rejects the production mutation

#### Scenario: Edit page reflects finalized lifecycle

- GIVEN a lot with status `finalized`
- WHEN the user navigates to `/laboratorio/lotes/[lotId]/editar`
- THEN production fields are displayed as read-only
- AND the follow-up section remains available for appending
