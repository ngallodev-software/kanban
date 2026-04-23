# Worktree Traceability

Status: implementation complete

Branch: `fork/feature-request/worktree-traceability`

Purpose:
- make task-to-worktree references clearer and more reliable
- keep the fork on existing Kanban seams
- improve operator visibility without inventing a new board model

Locked scope:
- task-worktree reference traceability only
- no SDK changes
- no worktree slot pool
- no isolated environment redesign
- no board persistence redesign
- no new public API invented outside existing Kanban seams

Doc index:
- [01-scope.md](./01-scope.md)
- [02-ticket-index.md](./02-ticket-index.md)
- [03-orchestration-prompt.md](./03-orchestration-prompt.md)
- [04-context-index.md](./04-context-index.md)
- [05-refs-existing-behavior.md](./05-refs-existing-behavior.md)
- [06-kit-worktree-traceability.md](./06-kit-worktree-traceability.md)
- [07-validation.md](./07-validation.md)
- [08-tracking.md](./08-tracking.md)
- [09-final-validation.md](./09-final-validation.md)
- [10-detailed-tickets.md](./10-detailed-tickets.md)

Current recommendation:
- treat `worktree-traceability` as a low-drift fork branch built on the existing worktree path and workspace metadata surfaces
- keep the work focused on identity, display, and reconciliation rather than lifecycle redesign

Implementation note:
- the canonical task-worktree reference now flows through backend metadata as `displayPath` and is surfaced in the board and terminal UI
- missing-worktree states are explicit in the terminal panel, while trash fallback remains derived
