# Detailed Tickets

## T-01 - Brownfield traceability audit

Model:
- `gpt-5.4-mini` low

Goal:
- map the exact existing task-worktree reference chain from task ID to path to metadata to UI

Subtasks:
1. Read `task-worktree-path.ts` and define the canonical formatter chain.
2. Read `task-worktree.ts` and identify where the path is computed versus consumed.
3. Read `workspace-metadata-monitor.ts` and trace how task worktree metadata is built.
4. Read `board-card.tsx` and note whether the UI already reconstructs any path or label.
5. Record all findings as a seam map, not as implementation advice.

Output:
- one concise seam inventory
- one note on where traceability is already strong
- one note on where it is lost or hidden

## T-02 - Traceability contract

Model:
- `gpt-5.4-mini` medium

Goal:
- define the formal task-worktree reference contract for this branch

Subtasks:
1. Decide the canonical term to use in docs and UI.
2. Define what is derived versus what is surfaced.
3. Define which source fields are authoritative.
4. Define how missing worktrees should be represented.
5. Define what must remain backward-compatible.

Output:
- a compact requirement set with acceptance criteria
- a list of non-goals and edge cases

## T-03 - Backend metadata propagation

Model:
- `gpt-5.4-mini` medium

Goal:
- make the existing metadata/read surfaces carry the task-worktree reference cleanly

Subtasks:
1. Identify whether any runtime contract changes are needed.
2. Ensure metadata snapshot logic uses the canonical helper chain.
3. Ensure task workspace path info remains consistent across callers.
4. Note whether any field should be added to the runtime contract or left derived.
5. Record any compatibility concern before touching UI.

Output:
- backend contract note
- propagation map
- required tests

## T-04 - UI traceability surfaces

Model:
- `gpt-5.4-mini` medium

Goal:
- show the task-worktree reference where operators already inspect tasks

Subtasks:
1. Inspect board card display affordances.
2. Inspect detail panel display affordances.
3. Inspect workspace metadata store usage.
4. Decide whether the path should be visible inline or via compact secondary text.
5. Keep UI density and readability in mind.

Output:
- UI surface plan
- display priority recommendation
- test hooks to update

## T-05 - Reconciliation and missing-worktree states

Model:
- `gpt-5.4-mini` medium

Goal:
- make missing or stale task-worktree references explicit

Subtasks:
1. Define the missing-worktree state vocabulary.
2. Define how metadata should behave when the path is absent.
3. Define what the UI should show when a path exists but is stale.
4. Define whether missing path handling needs a new runtime field or a derived label.
5. Make sure the behavior fails visibly, not silently.

Output:
- missing/stale state contract
- reconciliation notes
- test matrix additions

## T-06 - Regression tests

Model:
- `gpt-5.3-codex` medium

Goal:
- cover the task-worktree reference flow end to end

Subtasks:
1. Add or update backend tests for canonical path consistency.
2. Add or update metadata snapshot tests.
3. Add or update UI tests for board/detail surfaces.
4. Add a missing-worktree regression case.
5. Confirm no scope drift into lifecycle or slot-pool behavior.

Output:
- test list
- any required fixtures
- known blockers

## T-07 - Final validation and doc closure

Model:
- `gpt-5.4-mini` low

Goal:
- close the branch planning record before implementation

Subtasks:
1. Confirm docs use consistent terminology.
2. Confirm scope is still traceability only.
3. Confirm no hidden recovery or slot-pool work slipped in.
4. Record any open questions that still need implementation-time review.

Output:
- final planning summary
- residual risks
- implementation-ready checkpoint
