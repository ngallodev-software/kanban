# Kit: Task-Worktree Traceability

## Status
Draft

## Scope

Add a clear, consistent task-worktree reference to the Kanban surfaces that already know about task worktrees.

The feature should make it easier to answer:

- which task owns this worktree
- which path the worktree lives at
- whether the worktree currently exists
- whether the UI, runtime, and metadata monitor agree on that reference

## Requirements

### R-01 Canonical task-worktree reference
Kanban must derive task-worktree references from the existing worktree path helpers, not from duplicated path logic.

Acceptance:
- a single canonical helper defines the displayable worktree reference
- the same reference is used wherever the UI or metadata layer needs it

### R-02 Task workspace info must stay consistent
`getTaskWorkspaceInfo` / `getTaskWorkspacePathInfo` style lookups must continue to report the same task, path, and existence semantics after the branch lands.

Acceptance:
- task identity, path, and existence are still computed from the same task/workspace inputs
- missing worktree cases are represented explicitly

### R-03 Metadata snapshot must expose traceability
The workspace metadata monitor must continue to build task workspace metadata from the same canonical worktree path logic.

Acceptance:
- metadata snapshots preserve task-to-worktree association
- path existence and branch/path summary remain coherent

### R-04 UI surfaces must display the reference
The board and/or task detail surfaces must show the task-worktree reference in a way operators can read quickly.

Acceptance:
- board/detail surfaces show a worktree reference or an explicit missing-worktree state
- no UI surface invents a separate identity model

### R-05 Missing task-worktree references must be visible
If the worktree path does not exist, the UI and metadata surfaces must make that obvious rather than silently hiding it.

Acceptance:
- missing paths render as missing/absent
- stale references do not appear healthy

### R-06 No scope creep into lifecycle redesign
The branch must not introduce worktree slot pooling, isolated environment orchestration, or a new recovery model.

Acceptance:
- no slot pool semantics
- no environment isolation rewrite
- no recovery semantics change unless a traceability test forces it

## Out Of Scope

- worktree slot pooling
- environment isolation
- crash/restart recovery
- board persistence redesign
- new external API design
- SDK changes

## Cross References

- [05-refs-existing-behavior.md](./05-refs-existing-behavior.md)
- [07-validation.md](./07-validation.md)
- `/lump/apps/kanban-integration-idea/docs/Phase2/011-fork-feature-overlap-map.md`

## Coverage Gaps To Verify

- whether board cards already show enough worktree context
- whether task detail panels need a new affordance
- whether metadata snapshot consumers already have all the fields they need
