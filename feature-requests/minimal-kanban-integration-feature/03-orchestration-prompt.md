# Orchestration Prompt

Branch:
- `fork/feature-request/minimal-kanban-integration-feature`

Objective:
- add a minimal external task-ingest API to Kanban using existing local runtime/trpc seams

Brownfield rules:
- existing Kanban code is reference material
- do not invent a second API platform if current tRPC boundary is enough
- do not use `workspace.saveState` as primary write path
- do not change `src/cline-sdk/`
- preserve existing CLI task semantics

Locked decisions:
- v1 uses existing `/api/trpc` boundary
- v1 is workspace-scoped
- v1 persists first-class external task keys
- v1 optionally persists external link keys
- v1 may start explicit tasks only after graph realization succeeds
- all ambiguity fails closed

Worker defaults:
- use `gpt-5.4-mini low` unless ticket clearly needs more

Escalation rules:
- `gpt-5.4-mini medium` for broader router/state/test tickets
- `gpt-5.3-codex medium` only if a ticket cannot be split further without thrash

Required outputs per worker:
- files touched
- acceptance criteria covered
- tests added or updated
- assumptions
- open risks

Required validation gates:
- contract gate
- idempotency gate
- ambiguity-failure gate
- compatibility gate
- regression gate for existing create/link/start behavior
