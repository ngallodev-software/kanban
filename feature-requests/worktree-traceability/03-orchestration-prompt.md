# Orchestration Prompt

Branch: `fork/feature-request/worktree-traceability`

Objective:
- improve task-to-worktree reference traceability in Kanban using the existing worktree and metadata seams
- keep the fork brownfield and low drift

Rules:
- use the current code as the source of truth
- do not invent a new task/worktree API
- do not modify SDK packages
- do not widen scope into worktree slot pooling or isolation
- do not redesign board persistence
- preserve current behavior unless the traceability contract requires a change

Reference seams:
- `src/workspace/task-worktree.ts`
- `src/workspace/task-worktree-path.ts`
- `src/server/workspace-metadata-monitor.ts`
- `src/server/workspace-registry.ts`
- `src/core/api-contract.ts`
- `web-ui/src/stores/workspace-metadata-store.ts`
- `web-ui/src/components/board-card.tsx`
- `web-ui/src/components/detail-panels/agent-terminal-panel.tsx`

Delegation map:
- `gpt-5.4-mini` low:
  - docs
  - narrow seam audits
  - validation checklist updates
  - tracking updates
- `gpt-5.4-mini` medium:
  - backend contract shape
  - metadata propagation
  - UI exposure plan
  - missing-worktree state design
- `gpt-5.3-codex` medium:
  - cross-cutting regression matrix
  - behavior audit against current tests

Validation gates:
1. canonical task-worktree reference is consistent across backend and UI
2. missing worktrees are visible, not silent
3. no scope creep into slot pooling or recovery semantics
4. tests cover both happy path and stale/missing path

Required outputs per ticket:
- changed files or planned files
- tests needed
- risks
- open questions

Completion rule:
- if a task requires a new identity model beyond current worktree seams, stop and raise it as a scope issue
