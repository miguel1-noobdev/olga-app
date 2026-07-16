# Botanical Data Management Specification

## Requirements

### Requirement: Validated records
Admin MUST save plants and oils/extracts only with valid approved data; invalid input MUST NOT change records.

#### Scenario: Valid save
- GIVEN approved valid data
- WHEN Admin saves it
- THEN the private record is stored

#### Scenario: Invalid save
- GIVEN invalid data
- WHEN Admin saves it
- THEN no record changes

### Requirement: Public projection
`plantas` MUST remain the complete source of truth. Public projections MUST expose only approved public fields, never internal botanical or laboratory data.

#### Scenario: Public view
- GIVEN a plant contains internal data
- WHEN its public view renders
- THEN internal fields are absent

### Decision gate
Oils/extracts ownership and laboratory coordination MUST be approved before PR3.
