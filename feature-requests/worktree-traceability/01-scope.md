# Scope

## Goal

Improve how Kanban identifies, displays, and reconciles task worktrees so operators can answer:

- which task owns this worktree
- where the worktree lives
- whether the worktree still exists
- whether the runtime and UI are looking at the same worktree reference

This is a traceability branch, not a worktree scheduler branch.

## What The Feature Should Do

- make the task-to-worktree reference stable and easy to read
- keep the canonical path logic in one place
- surface task-worktree reference identity through the runtime and UI
- make missing or stale worktrees visible instead of silent
- preserve current Kanban task/worktree behavior unless the traceability surface depends on it

## What Is Locked Out

- no worktree slot pool
- no isolated database or execution environment system
- no recovery/resume semantics rewrite
- no new task creation API
- no SDK edits
- no broad board-state persistence redesign
- no generic product rewrite of the worktree model

## Brownfield Rule

The existing code is the source of truth.
This branch should derive requirements from current worktree helpers, runtime metadata, and UI surfaces rather than inventing a parallel identity model.

## Recommended Outcome

The best v1 is a narrow traceability layer that:

- reuses the current worktree path helpers
- exposes task-worktree reference identity through existing runtime read surfaces
- shows the reference in the board and detail surfaces
- adds tests that pin the display and reconciliation behavior

## Tradeoff

If the branch tries to solve traceability plus slot reuse plus isolation at once, the scope becomes too broad and the identity story gets harder to validate.

Recommended split:
- this branch: traceability only
- later branches: slot pool or environment isolation
