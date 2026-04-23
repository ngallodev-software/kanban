# Existing Behavior References

## Worktree identity helpers

- [`src/workspace/task-worktree-path.ts`](../../src/workspace/task-worktree-path.ts)
  - `normalizeTaskIdForWorktreePath`
  - `getWorkspaceFolderLabelForWorktreePath`
  - `buildTaskWorktreeDisplayPath`

- [`src/workspace/task-worktree.ts`](../../src/workspace/task-worktree.ts)
  - `getTaskWorktreePath`
  - `getTaskWorkspacePathInfo`
  - `getTaskWorkspaceInfo`
  - `ensureTaskWorktreeIfDoesntExist`
  - `deleteTaskWorktree`

## Metadata and runtime read surfaces

- [`src/server/workspace-metadata-monitor.ts`](../../src/server/workspace-metadata-monitor.ts)
  - `loadTaskWorkspaceMetadata`
  - `createWorkspaceMetadataMonitor`
  - `buildWorkspaceMetadataSnapshot`

- [`src/server/workspace-registry.ts`](../../src/server/workspace-registry.ts)
  - workspace hydration and snapshot assembly

- [`src/core/api-contract.ts`](../../src/core/api-contract.ts)
  - runtime response shapes

## UI surfaces

- [`web-ui/src/stores/workspace-metadata-store.ts`](../../web-ui/src/stores/workspace-metadata-store.ts)
  - task workspace metadata cache

- [`web-ui/src/components/board-card.tsx`](../../web-ui/src/components/board-card.tsx)
  - operator-visible card summary surface

- [`web-ui/src/components/detail-panels/agent-terminal-panel.tsx`](../../web-ui/src/components/detail-panels/agent-terminal-panel.tsx)
  - task detail/runtime surface

## Tests to anchor behavior

- [`test/integration/workspace-state.integration.test.ts`](../../test/integration/workspace-state.integration.test.ts)
- [`test/integration/runtime-state-stream.integration.test.ts`](../../test/integration/runtime-state-stream.integration.test.ts)
- existing web-ui store/component tests around workspace metadata and board cards where present

## Observed behavior today

- worktree paths are derived from task ID and repo/workspace path helpers
- metadata monitor already computes task workspace path existence and git summary data
- UI already has a workspace metadata store, but traceability presentation is not yet the primary feature
- missing worktree state exists implicitly today and should be made explicit in the branch plan

## Preferred terminology

Use `task-worktree reference` in this branch instead of the ambiguous phrase `worktree ID`.

Reason:
- the current Kanban model derives a traceable worktree path from task identity plus workspace context
- the branch should strengthen that trace, not imply a new identity primitive

## Brownfield note

The branch should reuse these helpers rather than duplicating path-building or metadata probing logic.
