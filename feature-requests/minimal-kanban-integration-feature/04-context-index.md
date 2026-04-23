# Context Index

## Entry points

Primary feature source:
- [013-minimal-kanban-integration-feature.md](/lump/apps/kanban-integration-idea/docs/Phase2/013-minimal-kanban-integration-feature.md)

Related Phase 2 refs:
- [004-revised-proposal.md](/lump/apps/kanban-integration-idea/docs/Phase2/004-revised-proposal.md)
- [005-integration-artifact-schema.md](/lump/apps/kanban-integration-idea/docs/Phase2/005-integration-artifact-schema.md)
- [006-kanban-seam-test-matrix.md](/lump/apps/kanban-integration-idea/docs/Phase2/006-kanban-seam-test-matrix.md)

## Brownfield code anchors

Task CLI behavior:
- [task.ts](/lump/apps/kanban/src/commands/task.ts)

TRPC boundary:
- [app-router.ts](/lump/apps/kanban/src/trpc/app-router.ts)
- [runtime-api.ts](/lump/apps/kanban/src/trpc/runtime-api.ts)
- [workspace-api.ts](/lump/apps/kanban/src/trpc/workspace-api.ts)

State and persistence:
- [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts)
- [task-board-mutations.ts](/lump/apps/kanban/src/core/task-board-mutations.ts)

## Traversal order

1. confirm existing create/link/start behavior in `task.ts`
2. confirm current tRPC mutation surfaces in `app-router.ts`
3. confirm state-layer persistence and revision model in `workspace-state.ts`
4. define minimal contract in kit
5. derive implementation tickets
