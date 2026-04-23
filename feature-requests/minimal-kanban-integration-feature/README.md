# `fork/feature-request/minimal-kanban-integration-feature`

Feature folder for planning a minimal external task-ingest API in Kanban.

Branch:
- `fork/feature-request/minimal-kanban-integration-feature`

Source requirement:
- [013-minimal-kanban-integration-feature.md](/lump/apps/kanban-integration-idea/docs/Phase2/013-minimal-kanban-integration-feature.md)

Planning stance:
- brownfield only
- use existing Kanban runtime/trpc boundary
- no invented parallel API platform
- no SDK changes
- no `workspace.saveState` primary write path

Recommended v1:
- add one narrow import procedure inside the existing local runtime API surface
- persist first-class external task keys in Kanban task metadata
- create tasks, realize links, optionally start explicit tasks
- make idempotency and fail-closed ambiguity part of the contract

Read in this order:
1. `05-refs-existing-behavior.md`
2. `06-kit-minimal-kanban-integration-feature.md`
3. `02-ticket-index.md`
4. `10-detailed-tickets.md`
5. `07-validation.md`
6. `08-tracking.md`

Current status:
- planning complete
- implementation complete for v1 scope
- focused validation passed
- repo-wide root typecheck still blocked by pre-existing `@clinebot/core` export drift in `src/cline-sdk/sdk-provider-boundary.ts`
- Cavekit brownfield and methodology artifacts updated to match the implemented scope
