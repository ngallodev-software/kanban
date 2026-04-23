# Final Validation

Status:
- focused pass

Implemented:
- `workspace.importTasks` on existing tRPC boundary
- versioned v1 request/response contract
- persisted `externalTaskKey` on board cards
- endpoint-based link replay in v1
- deterministic optional explicit start list after graph realization

Non-goals held:
- no `workspace.saveState` import path
- no dependency metadata expansion for external link keys
- no persistent import-run storage
- no SDK changes

Evidence:
- pass: `pnpm vitest run test/runtime/api-validation.test.ts test/runtime/trpc/workspace-import-api.test.ts`
- pass: `pnpm vitest run test/runtime/trpc/workspace-api.test.ts`
- pass: `pnpm vitest run test/integration/task-command-exit.integration.test.ts -t "JSON payload file"`
- pass: `pnpm vitest run test/integration/runtime-state-stream.integration.test.ts -t "imports tasks through the live workspace.importTasks tRPC route"`

Extra coverage added after initial implementation:
- source CLI path via `task import --file <path>`
- live `/api/trpc/workspace.importTasks` route plus runtime stream update

Known unrelated blocker:
- root `npm run typecheck` is still blocked by pre-existing upstream drift:
  - `src/cline-sdk/sdk-provider-boundary.ts`
  - `@clinebot/core` no longer exports `ProviderSettings`

Assessment:
- branch scope matches the Cavekit kit
- brownfield seam choice stayed narrow and evidence-backed
- v1 is replay-safe for task and link realization
