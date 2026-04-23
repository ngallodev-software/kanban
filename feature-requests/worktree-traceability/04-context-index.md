# Context Index

Read in this order:

1. [05-refs-existing-behavior.md](./05-refs-existing-behavior.md)
2. [06-kit-worktree-traceability.md](./06-kit-worktree-traceability.md)
3. [02-ticket-index.md](./02-ticket-index.md)
4. [07-validation.md](./07-validation.md)
5. [08-tracking.md](./08-tracking.md)

Why this order:
- first confirm the existing behavior
- then turn behavior into requirements
- then sequence the work
- then define validation
- then track execution

Key code refs:
- `src/workspace/task-worktree.ts`
- `src/workspace/task-worktree-path.ts`
- `src/server/workspace-metadata-monitor.ts`
- `src/server/workspace-registry.ts`
- `src/core/api-contract.ts`
- `web-ui/src/stores/workspace-metadata-store.ts`
- `web-ui/src/components/board-card.tsx`
- `web-ui/src/components/detail-panels/agent-terminal-panel.tsx`
- `test/integration/workspace-state.integration.test.ts`
- `test/integration/runtime-state-stream.integration.test.ts`

Key Phase 2 docs:
- `/lump/apps/kanban-integration-idea/docs/Phase2/009-kanban-feature-request-alignment.md`
- `/lump/apps/kanban-integration-idea/docs/Phase2/010-fork-backlog.md`
- `/lump/apps/kanban-integration-idea/docs/Phase2/011-fork-feature-overlap-map.md`
- `/lump/apps/kanban-integration-idea/docs/Phase2/012-recommended-first-branch.md`

Cross-branch lesson:
- task-worktree reference traceability should stay separate from recovery/resume
- slot pooling and environment isolation are later branches, not prerequisites for this one
