# Delta for Blog Platform

## ADDED Requirements

### Requirement: Private content lifecycle
PR2 intake, including AI-assisted intake, MUST create a private draft. An `admin` MUST review, preview, publish, and unpublish it. Only published articles MAY appear in the subscriber-only Blog; drafts and previews MUST NOT be public.

#### Scenario: Intake
- GIVEN Admin submits intake
- WHEN it succeeds
- THEN a private review draft exists

#### Scenario: Draft request
- GIVEN an article is draft or unpublished
- WHEN a subscriber requests it
- THEN no content is returned

#### Scenario: Publication
- GIVEN Admin publishes a draft
- WHEN a subscriber opens the Blog
- THEN existing access permits it
