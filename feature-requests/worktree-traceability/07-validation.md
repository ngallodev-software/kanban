# Validation

## Gate 1 - Reference integrity

Validate that all traceability surfaces use the same canonical task-worktree helper chain.

Checks:
- worktree path helper is the single source of truth
- metadata monitor uses the same helper outputs
- UI display prefers the derived `displayPath` on active task worktrees
- UI fallback reconstruction remains limited to trash/missing-metadata cases

## Gate 2 - Missing-worktree behavior

Validate that absent or stale worktrees are visible and do not read as healthy.

Checks:
- path absent renders explicit missing state
- metadata snapshot still preserves the task association
- UI does not hide the traceability gap
- terminal panel surfaces "Task worktree missing" when runtime info says the worktree is absent

## Gate 3 - UI exposure

Validate that operators can see the worktree reference where they already inspect tasks.

Checks:
- board card shows worktree reference or compact path
- detail panel shows the same reference
- workspace-metadata-store hydrates the same reference into UI selectors
- store-driven UI updates remain consistent after reload

## Gate 4 - Backend consistency

Validate that runtime metadata and workspace snapshots stay aligned.

Checks:
- `workspace-metadata-monitor` output remains stable
- runtime contract fields, if updated, round-trip through tests
- no extra API contract is invented
- `displayPath` round-trips through runtime metadata, store hydration, and UI surfaces

## Gate 5 - Regression matrix

Run tests that cover:
- existing task worktree path resolution
- metadata loading for existing and missing worktrees
- UI rendering for task-worktree reference fields
- reload/reconciliation behavior if any UI store state is involved

## Suggested tests

- unit tests around `task-worktree-path.ts`
- unit/integration tests around `task-worktree.ts`
- integration tests around `workspace-metadata-monitor.ts`
- UI tests for board card and detail panel surfaces
- store tests for metadata hydration and inactive snapshot cleanup
- runtime/state-stream tests if traceability fields flow through runtime snapshots
- TRPC workspace tests for runtime info contract propagation

## Completion signal

The feature is only ready when:
- the canonical worktree reference is consistent
- missing worktrees are explicit
- no new identity model was introduced
- tests prove the UI and backend agree
- branch docs reflect the implemented `displayPath` contract and the current traceability fallback behavior
