# Lot Detail and Follow-Up Specification

## Purpose

Canonical lot detail page at `/laboratorio/lotes/[lotId]` showing formula provenance, operational summary, scaled snapshot, and an append-only follow-up section.

## Requirements

### Requirement: Lot Detail View

The system MUST display lot detail at `/laboratorio/lotes/[lotId]` with formula provenance (formulaId, code, version), operational summary, scaled snapshot, and follow-up section.

#### Scenario: View lot detail

- GIVEN an existing lot with formula provenance
- WHEN navigating to `/laboratorio/lotes/[lotId]`
- THEN the page displays formula provenance, operational summary, and scaled snapshot
- AND a link to the formula context at `/laboratorio/formulas/[formulaId]` is present

#### Scenario: Lot not found

- GIVEN no lot exists with the given lotId
- WHEN navigating to `/laboratorio/lotes/[lotId]`
- THEN the system returns a not-found response

### Requirement: Append-Only Follow-Up

The system MUST allow authorized users to append dated follow-up entries to `followUp.entries` on any lot regardless of lifecycle status.

Each entry MUST be atomic and timestamped.

When a lot is in `completed` status, production fields and the scaled snapshot MUST remain unchanged; only follow-up entries MAY be appended.

#### Scenario: Add follow-up to planned lot

- GIVEN a lot in `planned` status
- WHEN an authorized user appends a follow-up entry
- THEN the entry is added to `followUp.entries` with the current date

#### Scenario: Follow-up on in-progress lot

- GIVEN a lot in `in_progress` status
- WHEN an authorized user appends a follow-up entry
- THEN the entry is added to `followUp.entries` with the current date

#### Scenario: Follow-up on completed lot

- GIVEN a lot in completed status
- WHEN an authorized user appends a follow-up entry
- THEN the entry is added to `followUp.entries` with the current date
- AND production fields and scaled snapshot remain unchanged

#### Scenario: Follow-up on cancelled lot

- GIVEN a lot in `cancelled` status
- WHEN an authorized user appends a follow-up entry
- THEN the entry is added to `followUp.entries` with the current date

#### Scenario: Follow-up history preserved

- GIVEN a lot with existing follow-up entries
- WHEN the lot reaches completed status
- THEN all existing follow-up entries remain visible and readable
