# Lot Edit With Lifecycle Specification

## Purpose

Lot edit page at `/laboratorio/lotes/[lotId]/editar` with lifecycle-aware guards that enforce different editability rules per lot status. The Spanish segment `editar` is the intentional canonical route convention.

## Requirements

### Requirement: Lifecycle Edit Rules

The system MUST allow production edits, including target grams and rescaling only that lot's snapshot, for lots in `planned` or `cancelled` status.

The system MUST allow non-snapshot production edits when status is `in_progress`, but MUST reject target-gram changes and snapshot regeneration.

The system MUST freeze all production fields and the snapshot when status is `completed`.

The system MUST allow append-only dated follow-up entries for `planned`, `in_progress`, `completed`, and `cancelled` lots.

The system MUST keep production data frozen in `completed` status without blocking append-only follow-up.

#### Scenario: Edit planned lot

- GIVEN a lot with status `planned`
- WHEN the user changes target grams
- THEN the snapshot is regenerated proportionally

#### Scenario: Edit completed lot production fields rejected

- GIVEN a lot with status `completed`
- WHEN the user attempts to modify production fields or snapshot
- THEN the system rejects the mutation

#### Scenario: Edit in-progress lot snapshot fields rejected

- GIVEN a lot with status `in_progress`
- WHEN the user attempts to change target grams or regenerate the snapshot
- THEN the system rejects the mutation

#### Scenario: Append follow-up on completed lot

- GIVEN a lot with status `completed`
- WHEN the user appends a follow-up entry
- THEN the entry is added to `followUp.entries`

#### Scenario: Edit cancelled lot

- GIVEN a lot with status `cancelled`
- WHEN the user changes target grams or another production field
- THEN the changes are accepted
- AND the lot's own snapshot is rescaled when target grams change

#### Scenario: Edit page reflects lifecycle permissions

- GIVEN a lot with status `in_progress`
- WHEN the user navigates to `/laboratorio/lotes/[lotId]/editar`
- THEN target-gram and snapshot controls are read-only
- AND other production fields remain editable
- AND the follow-up section remains available for appending

#### Scenario: Edit page reflects completed lifecycle

- GIVEN a lot with status `completed`
- WHEN the user navigates to `/laboratorio/lotes/[lotId]/editar`
- THEN production fields are displayed as read-only
- AND the follow-up section remains available for appending
