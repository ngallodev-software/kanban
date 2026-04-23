# Refs: Existing Behavior

## Brownfield truth

Current Kanban already has three confirmed write seams for task flow:

- [task.ts](/lump/apps/kanban/src/commands/task.ts) `createTask()`
- [task.ts](/lump/apps/kanban/src/commands/task.ts) `linkTasks()`
- [task.ts](/lump/apps/kanban/src/commands/task.ts) `startTask()`

Those flows prove:
- task creation is a board mutation plus runtime workspace registration
- dependency linking is a board mutation with validation rules
- starting is separate from creation and depends on ensured worktree + runtime session start

## Existing API boundary

Kanban already exposes local API surfaces through:

- [runtime-server.ts](/lump/apps/kanban/src/server/runtime-server.ts)
- [app-router.ts](/lump/apps/kanban/src/trpc/app-router.ts)

Relevant current procedures:
- `runtime.startTaskSession`
- `workspace.getState`
- `workspace.saveState`
- `workspace.ensureWorktree`

Brownfield conclusion:
- new import behavior should fit this boundary instead of inventing a parallel server stack

## Why not `workspace.saveState`

[workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts) shows board persistence is revisioned and broad.

Risk:
- caller must synthesize full board state
- conflicts become the caller's problem
- integration can overwrite unrelated reality

Brownfield conclusion:
- use focused task import mutations, not full board replacement

## State mutation anchors

[task-board-mutations.ts](/lump/apps/kanban/src/core/task-board-mutations.ts) already centralizes:
- task creation
- task updates
- dependency creation/removal
- task movement and trash behavior

Brownfield conclusion:
- import should reuse this mutation layer

## Existing gaps

Confirmed current gap:
- no first-class external task key
- no versioned external ingest procedure
- no idempotent import contract
- no explicit ambiguity failure contract for external replay

## Planning implication

Minimal viable feature is not:
- new board model
- new workflow engine
- new CLI protocol

Minimal viable feature is:
- a narrow imported-task graph mutation API over existing runtime/trpc seams
