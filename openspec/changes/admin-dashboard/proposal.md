# Proposal: Dashboard Admin

## Intent

Deliver the complete Dashboard Admin roadmap without weakening the existing `admin` access boundary. `/admin` is currently a secure temporary article tool; PR1 preserves it, and PR2 absorbs it into the shared Dashboard Admin.

## Scope

### In Scope
- Four independently verifiable, rollbackable chained PRs for Dashboard Admin.
- Desktop-first visual direction from Stitch `projects/13503137979360409383`, as reference only; no Stitch changes.
- Safe operational visibility and controlled content, botanical-data, and user workflows.

### Out of Scope
- Public Blog redesign, subscriber access changes, raw MongoDB console, migrations, or laboratory workflow redesign.
- Secrets, credentials, tokens, user identities, raw errors, or surveillance activity in health/activity UI.

## Capabilities

### New Capabilities
- `admin-dashboard`: shared Dashboard Admin shell and safe System Health.
- `botanical-data-management`: validated plants and oils/extracts administration with private/public projection separation.
- `user-administration`: user directory, safe role/access-status changes, and privacy-respecting activity.

### Modified Capabilities
- `blog-platform`: private draft intake, review, preview, publish, and unpublish lifecycle while retaining subscriber-only public Blog.
- `user-auth`: Admin-controlled role and access-status behavior.

## Approach

Foundation-first chain: retain the `admin` middleware and server-layout checks, establish the shared shell, then add modules in dependency order. Each PR targets the preceding PR, stays below the 800-line review threshold, and has focused tests.

## Chained PR Plan

1. **PR1 — Foundation and System Health**: shell; preserve/test `/admin` authorization; application, MongoDB, and authentication readiness checks with bounded, safe states. **Verify:** unauthorized access remains blocked; readiness states reveal no sensitive data. **Rollback:** revert shell/health only, retaining the temporary tool. **Decision points:** define application-readiness boundary and non-identifying authentication signal.
2. **PR2 — Content lifecycle**: external AI-assisted intake always creates a private draft; review, preview, publish, unpublish; absorb temporary tool. **Verify:** drafts never reach public Blog. **Rollback:** restore prior content UI/API after protecting published records.
3. **PR3 — Botanical Data**: validated plants plus oils/extracts management; preserve private/public projection boundary; coordinate laboratory ownership. **Verify:** public projection excludes internal data. **Rollback:** revert module without altering public records.
4. **PR4 — Users**: directory, confirmed safe role/access-status changes, minimal operational activity. **Verify:** protected mutations and privacy rules. **Rollback:** revert controls; retain existing roles/statuses. **Decision points:** activity retention and event vocabulary.

## Review Workload Forecast

Chained PRs recommended: **Yes**. Expected review size: PR1 550–750, PR2 650–800, PR3 650–800, PR4 500–700 changed lines. Dependency order is PR1 → PR2 → PR3 → PR4; no PR starts before its predecessor is verified.

## Risks and Success Criteria

| Risk | Mitigation |
|---|---|
| Slow/ambiguous database health | Bounded probe and generic status |
| Draft exposure | Server-side lifecycle enforcement and tests |
| Laboratory ownership conflict | Decide ownership before PR3 |

- [ ] PR1 preserves the existing `admin` boundary and temporary article tool.
- [ ] Every PR verifies independently and rolls back within its own boundary.
- [ ] Sensitive data never appears in Dashboard Admin health or activity UI.

## Proposal Question Round

Assumptions needing confirmation before later modules: the safe authentication signal, PR4 activity retention/events, and oils/extracts ownership with the laboratory domain.
