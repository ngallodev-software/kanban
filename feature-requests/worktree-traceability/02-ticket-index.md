# Ticket Index

## T-00 - Branch scaffolding and cavekit docs
- Model: `gpt-5.4-mini` low
- Goal:
  - create the planning docs and lock scope
  - make the branch readable for later agents
- Output:
  - README
  - scope
  - ticket index
  - orchestration prompt
  - context index
  - refs doc
  - kit
  - validation
  - tracking

## T-01 - Brownfield traceability audit
- Model: `gpt-5.4-mini` low
- Goal:
  - inventory the current task-worktree reference surfaces
  - identify the seam most suitable for traceability without drift
- Focus:
  - `src/workspace/task-worktree.ts`
  - `src/workspace/task-worktree-path.ts`
  - `src/server/workspace-metadata-monitor.ts`
  - `web-ui/src/stores/workspace-metadata-store.ts`

## T-02 - Traceability contract
- Model: `gpt-5.4-mini` medium
- Goal:
  - define what a canonical task-worktree reference is in this branch
  - separate display path, task ID, and existence status
  - decide which fields must be surfaced through runtime read paths
- Output:
  - a small, testable requirement set in the kit doc

## T-03 - Backend metadata propagation
- Model: `gpt-5.4-mini` medium
- Goal:
  - make task-worktree reference data flow through the existing runtime and metadata monitor seams
  - keep the canonical path logic centralized
- Focus:
  - `workspace-metadata-monitor`
  - `task-worktree`
  - runtime contract/read surfaces where needed

## T-04 - UI traceability surfaces
- Model: `gpt-5.4-mini` medium
- Goal:
  - show the task-worktree reference where operators already look
  - keep interaction lightweight and avoid UI-only shell wrappers
- Focus:
  - board cards
  - detail panels
  - workspace metadata store

## T-05 - Reconciliation and missing-worktree states
- Model: `gpt-5.4-mini` medium
- Goal:
  - make missing or stale task-worktree references visible and testable
  - ensure traceability degrades safely when the path is absent
- Focus:
  - metadata snapshots
  - UI display states
  - existing worktree info helpers

## T-06 - Regression tests
- Model: `gpt-5.3-codex` medium
- Goal:
  - cover the new traceability behavior end to end
  - keep the branch honest against the current Kanban behavior
- Focus:
  - backend snapshots
  - runtime read surfaces
  - UI rendering and lookup behavior

## T-07 - Final validation and doc closure
- Model: `gpt-5.4-mini` low
- Goal:
  - confirm the branch stayed narrow
  - record what was verified and what remains intentionally out of scope

## Dependency Order

1. T-00
2. T-01
3. T-02
4. T-03
5. T-04
6. T-05
7. T-06
8. T-07

## Delegation Rule

- small doc/audit tasks go to `gpt-5.4-mini` low
- medium cross-file contract and backend/UI tasks go to `gpt-5.4-mini` medium
- wide regression coverage goes to `gpt-5.3-codex` medium
