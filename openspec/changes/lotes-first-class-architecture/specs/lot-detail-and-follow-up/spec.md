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

When a lot is in `finalized` status, it remains in the same collection as historical data; production fields and the scaled snapshot MUST remain unchanged while follow-up entries MAY be appended indefinitely.

#### Scenario: Add follow-up to an in-production lot

- GIVEN a lot in `in_production` status
- WHEN an authorized user appends a follow-up entry
- THEN the entry is added to `followUp.entries` with the current date

#### Scenario: Follow-up on finalized lot

- GIVEN a lot in `finalized` status
- WHEN an authorized user appends a follow-up entry
- THEN the entry is added to `followUp.entries` with the current date

#### Scenario: Follow-up on discarded lot

- GIVEN a lot in `discarded` status
- WHEN an authorized user appends a follow-up entry
- THEN the entry is added to `followUp.entries` with the current date

#### Scenario: Follow-up history preserved

- GIVEN a lot with existing follow-up entries
- WHEN the lot reaches finalized status
- THEN all existing follow-up entries remain visible and readable
