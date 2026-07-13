# Lot Global List Specification

## Purpose

Canonical global listing of all lots at `/laboratorio/lotes`, replacing formula-nested lot browsing as the primary operational entry point.

## Requirements

### Requirement: Lotes Index Route

The system MUST serve a page at `/laboratorio/lotes` that lists all lots via `LotRepository.findAll()`.

Each row MUST link to `/laboratorio/lotes/[lotId]`.

The laboratory navbar and home MUST include a navigation entry pointing to this route.

#### Scenario: View all lots

- GIVEN authenticated user with laboratory access
- WHEN navigating to `/laboratorio/lotes`
- THEN the page displays all lots from `LotRepository.findAll()`
- AND each row links to `/laboratorio/lotes/[lotId]`

#### Scenario: Empty lot collection

- GIVEN no lots exist
- WHEN navigating to `/laboratorio/lotes`
- THEN the page displays an empty-state message

#### Scenario: Navbar includes Lotes entry

- GIVEN authenticated user in the laboratory
- WHEN viewing the navbar or laboratory home
- THEN a Lotes navigation entry is visible and links to `/laboratorio/lotes`
