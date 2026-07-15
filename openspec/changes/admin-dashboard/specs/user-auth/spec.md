# Delta for User Authentication

## MODIFIED Requirements

### Requirement: Role model
The system MUST store one role per user from `suscriptora`, `productora`, `admin`. Only authenticated `admin` MAY change a role through confirmed Dashboard Admin.
(Previously: Roles had no Admin-controlled change workflow.)

#### Scenario: Default role assignment
- GIVEN a new registration succeeds
- WHEN the user record is persisted
- THEN the role MUST be `suscriptora` unless the first-user-admin rule applies

#### Scenario: Confirmed role change
- GIVEN an authenticated `admin` selects a user and approved role
- WHEN the change is confirmed
- THEN that user's role is updated

## ADDED Requirements

### Requirement: Access-status gate
The system MUST NOT introduce or change access-status semantics until PR4 vocabulary and transitions are approved.

#### Scenario: Unapproved mutation
- GIVEN status rules are unapproved
- WHEN a status change is attempted
- THEN no status changes
