# Tracking

## Status

- current phase: implementation complete
- implementation: complete for v1 scope
- validation: focused pass

## Brownfield findings

- CLI create/link/start already define Kanban's intended graph realization flow
- existing `/api/trpc` boundary is correct placement for v1
- `workspace.saveState` remains too broad for safe external integration
- task metadata extension is likely required for durable external identity

## Locked scope

- workspace-scoped import only
- versioned contract
- first-class external task key
- no first-class external link key in v1
- deterministic explicit start list

## Implemented decisions

- external task identity persists on `RuntimeBoardCard.externalTaskKey`
- link identity stays endpoint-based in v1; dependency metadata was not widened
- result surface is synchronous only; no persistent import-run readback was added
- import lives on existing `workspace.importTasks` tRPC surface
- explicit starts run only after graph realization succeeds
- replay-safe conflicts fail closed with machine-visible error codes

## Validation evidence

- passed: `pnpm vitest run test/runtime/api-validation.test.ts test/runtime/trpc/workspace-import-api.test.ts`
- passed: `pnpm vitest run test/runtime/trpc/workspace-api.test.ts`
- passed: `pnpm vitest run test/integration/task-command-exit.integration.test.ts -t "JSON payload file"`
- passed: `pnpm vitest run test/integration/runtime-state-stream.integration.test.ts -t "imports tasks through the live workspace.importTasks tRPC route"`
- root `npm run typecheck` still blocked by unrelated upstream issue:
  - `src/cline-sdk/sdk-provider-boundary.ts`
  - missing exported member `ProviderSettings` from `@clinebot/core`

## Implementation notes

- shadow `.js` siblings under `src/core/` and `src/trpc/` required matching updates where the test/runtime resolver preferred them over `.ts`
- CLI coverage added through `task import --file <path>`
- no SDK code was modified

## Notes for implementation phase

- default delegation model is `gpt-5.4-mini low`
- escalate only when a ticket spans multiple layers and resists smaller decomposition
