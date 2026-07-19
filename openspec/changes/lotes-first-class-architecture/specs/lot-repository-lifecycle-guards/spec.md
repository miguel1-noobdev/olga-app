# Lot Repository Lifecycle Guards Specification

## Purpose

Repository-level enforcement of snapshot regeneration and immutability rules based on the canonical lot lifecycle: `in_production`, `finalized`, and `discarded`. Only `in_production` can modify production data or regenerate its own snapshot; both terminal statuses freeze production data. Legacy stored values are read-normalized only; no MongoDB migration or schema changes.

## Requirements

### Requirement: Guard-Preserving Recovery

Recovery from a broken release MUST use a Git revert only when the target version retains these mandatory lifecycle guards, or a targeted fix-forward change. The system MUST NOT reintroduce a version that weakens, bypasses, or omits the guards.

#### Scenario: Recovery preserves lifecycle invariants

- GIVEN a release requires recovery
- WHEN maintainers choose revert or fix-forward
- THEN the recovered version retains the mandatory lifecycle guards

### Requirement: Editable Snapshot Regeneration

The system MUST allow target-gram edits and snapshot regeneration only when lot status is `in_production`.

When target grams change on an editable lot, the system MUST rescale that lot's existing snapshot proportionally without re-reading the formula.

#### Scenario: In-production lot target gram change

- GIVEN a lot with status `in_production` and a 100g snapshot
- WHEN target grams change to 200g via `LotRepository.update()`
- THEN the snapshot is rescaled proportionally to 200g

### Requirement: Terminal Production Freeze

The system MUST reject snapshot and all production field mutations when lot status is `finalized` or `discarded`.

Follow-up entries MUST remain appendable on every status, including `finalized`.

#### Scenario: Completed lot mutation rejected

- GIVEN a lot with status `completed`
- WHEN `LotRepository.update()` is called with production field changes
- THEN the update is rejected

#### Scenario: In-progress lot target-gram change rejected

- GIVEN a lot with status `in_progress`
- WHEN `LotRepository.update()` is called with a target-gram change
- THEN the update is rejected

#### Scenario: Completed lot follow-up append allowed

- GIVEN a lot with status `completed`
- WHEN a follow-up entry is appended
- THEN the entry is added to `followUp.entries`

### Requirement: Append-Only Follow-Up

The system MUST append dated follow-up entries without replacing, removing, or modifying existing entries for every lot status.

#### Scenario: Follow-up append allowed for every lifecycle status

- GIVEN one lot in each of `planned`, `in_progress`, `completed`, and `cancelled` status
- WHEN a dated follow-up entry is appended to each lot
- THEN each entry is added without altering production data, snapshot, or existing follow-up entries

### Requirement: Typed Guard Errors

The repository MUST expose `LotLifecycleError` for lifecycle rejections and `LotValidationError` for invalid target-gram input.

#### Scenario: Invalid target grams are distinguished

- GIVEN a lot update with zero or negative target grams
- WHEN `LotRepository.update()` validates the input
- THEN it rejects with `LotValidationError`
