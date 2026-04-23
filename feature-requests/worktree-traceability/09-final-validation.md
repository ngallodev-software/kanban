# Final Validation

Status: pass

Checks completed:
- canonical task-worktree reference is stable across backend, store, and UI
- active cards surface the derived `displayPath`
- missing worktrees are explicit in the terminal header
- trash fallback remains derived rather than persisted
- no slot pool or isolation scope leaked into the branch
- runtime, web-ui, and TRPC seams are covered by focused tests
- documentation/tracking matches the implemented behavior

Notes:
- the branch keeps `taskId + baseRef` as the join key and does not introduce a new identity model
- the UI now prefers `displayPath` for active task worktrees and only reconstructs a fallback path where metadata is absent or the card is in trash
