# Detailed Tickets

## T-01 Brownfield seam audit and contract anchor map

Model:
- `gpt-5.4-mini low`

Goal:
- confirm exact implementation anchors before code changes

Files to inspect:
- [task.ts](/lump/apps/kanban/src/commands/task.ts)
- [app-router.ts](/lump/apps/kanban/src/trpc/app-router.ts)
- [workspace-api.ts](/lump/apps/kanban/src/trpc/workspace-api.ts)
- [runtime-api.ts](/lump/apps/kanban/src/trpc/runtime-api.ts)
- [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts)
- [task-board-mutations.ts](/lump/apps/kanban/src/core/task-board-mutations.ts)

Deliverable:
- update `08-tracking.md` with exact seam decisions

Acceptance:
- chosen API placement is evidence-backed
- task metadata extension point is identified

## T-02 Contract types and validation schema

Model:
- `gpt-5.4-mini low`

Goal:
- define import request/response schemas and types

Likely files:
- [api-contract.ts](/lump/apps/kanban/src/core/api-contract.ts)
- [api-validation.ts](/lump/apps/kanban/src/core/api-validation.ts)

Required contract:
- request version
- workspace-scoped task list
- link list
- explicit start list
- machine-visible ambiguity/error shape

Acceptance:
- schemas reject unsupported version
- schemas encode minimal contract only

## T-03 Metadata model extension

Model:
- `gpt-5.4-mini medium`

Goal:
- add first-class external identity fields to task and possibly dependency records

Likely files:
- [api-contract.ts](/lump/apps/kanban/src/core/api-contract.ts)
- [task-board-mutations.ts](/lump/apps/kanban/src/core/task-board-mutations.ts)

Acceptance:
- board model can persist external task key
- optional dependency external key decision is explicit
- non-import flows remain backward compatible

## T-04 Router and workspace API skeleton

Model:
- `gpt-5.4-mini medium`

Goal:
- expose import procedure on existing tRPC boundary

Likely files:
- [app-router.ts](/lump/apps/kanban/src/trpc/app-router.ts)
- [workspace-api.ts](/lump/apps/kanban/src/trpc/workspace-api.ts)

Acceptance:
- procedure is workspace-scoped
- request dispatch is version-aware
- no broad save-state shortcut

## T-05 Task create idempotency path

Model:
- `gpt-5.4-mini medium`

Goal:
- realize tasks without duplicate creation on replay

Likely files:
- [workspace-api.ts](/lump/apps/kanban/src/trpc/workspace-api.ts)
- [task-board-mutations.ts](/lump/apps/kanban/src/core/task-board-mutations.ts)

Behavior:
- create new task if external key unseen
- return existing mapping if same external key + same task intent
- fail closed if same external key conflicts

Acceptance:
- replay-safe task creation
- no silent duplicate tasks

## T-06 Link realization and idempotency path

Model:
- `gpt-5.4-mini medium`

Goal:
- realize dependency edges after task mappings are known

Likely files:
- [workspace-api.ts](/lump/apps/kanban/src/trpc/workspace-api.ts)
- [task-board-mutations.ts](/lump/apps/kanban/src/core/task-board-mutations.ts)

Behavior:
- link only after both tasks are resolved
- no duplicate dependency creation
- fail closed on conflicting link identity or impossible endpoints

Acceptance:
- repeated import does not duplicate graph edges

## T-07 Explicit start-task path

Model:
- `gpt-5.4-mini low`

Goal:
- optionally start explicit tasks after create/link succeed

Likely files:
- [workspace-api.ts](/lump/apps/kanban/src/trpc/workspace-api.ts)
- [runtime-api.ts](/lump/apps/kanban/src/trpc/runtime-api.ts)

Behavior:
- delegate to existing task start/runtime path
- do not mix runtime failure with graph corruption

Acceptance:
- start order deterministic
- created mappings survive start failure

## T-08 Readback and result surface

Model:
- `gpt-5.4-mini low`

Goal:
- return enough realized mapping to support safe reconciliation

Likely files:
- [api-contract.ts](/lump/apps/kanban/src/core/api-contract.ts)
- [workspace-api.ts](/lump/apps/kanban/src/trpc/workspace-api.ts)

Decision:
- prefer synchronous result first
- add persistent import-run readback only if replay safety demands it

Acceptance:
- caller gets external task key -> task id mapping
- caller gets link realization results

## T-09 Tests and regression coverage

Model:
- `gpt-5.4-mini medium`

Goal:
- prove contract, idempotency, ambiguity failure, and no regression

Likely files:
- `test/runtime/...`
- `test/integration/...`

Minimum coverage:
- supported version success
- unsupported version failure
- repeated same import no duplicate tasks
- repeated same link no duplicate dependencies
- conflicting external key fails closed
- explicit start list behavior

## T-10 Docs and final audit

Model:
- `gpt-5.4-mini low`

Goal:
- close branch with Cavekit-complete artifacts

Files:
- [README.md](/lump/apps/kanban/feature-requests/minimal-kanban-integration-feature/README.md)
- [07-validation.md](/lump/apps/kanban/feature-requests/minimal-kanban-integration-feature/07-validation.md)
- [08-tracking.md](/lump/apps/kanban/feature-requests/minimal-kanban-integration-feature/08-tracking.md)
- [09-final-validation.md](/lump/apps/kanban/feature-requests/minimal-kanban-integration-feature/09-final-validation.md)

Acceptance:
- docs match implemented scope
- non-goals remain enforced
