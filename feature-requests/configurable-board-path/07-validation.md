# Validation

## Gate V-01 Resolver gate

Requirement links:
- `R-01`
- `R-02`

Pass when:
- canonical resolver exists
- default resolver output matches current layout
- all board read/write paths use resolver

Evidence:
- [`src/state/workspace-state.ts`](/lump/apps/kanban/src/state/workspace-state.ts)
- `test/integration/workspace-state.integration.test.ts`

Status:
- pass

## Gate V-02 Config gate

Requirement links:
- `R-06`

Pass when:
- one supported override source is implemented
- invalid/empty overrides fail clearly
- default config remains unchanged

Evidence:
- [`src/config/runtime-config.ts`](/lump/apps/kanban/src/config/runtime-config.ts)
- [`src/core/api-contract.ts`](/lump/apps/kanban/src/core/api-contract.ts)
- `test/runtime/config/runtime-config.test.ts`
- `test/runtime/api-validation.test.ts`

Status:
- pass

## Gate V-03 Persistence gate

Requirement links:
- `R-03`
- `R-04`
- `R-07`

Pass when:
- custom board path is used for load/save/mutate
- workspace identity remains repo-based
- malformed custom board files fail loudly
- no silent fallback occurs

Evidence:
- [`src/state/workspace-state.ts`](/lump/apps/kanban/src/state/workspace-state.ts)
- [`src/trpc/runtime-api.ts`](/lump/apps/kanban/src/trpc/runtime-api.ts)
- `test/integration/workspace-state.integration.test.ts`

Status:
- pass

## Gate V-04 Compatibility gate

Requirement links:
- `R-01`
- `R-08`

Pass when:
- stale write/conflict behavior unchanged
- concurrent workspace index behavior unchanged
- normal default-path workflows still pass

Evidence:
- `pnpm vitest run test/runtime/config/runtime-config.test.ts test/integration/workspace-state.integration.test.ts test/runtime/api-validation.test.ts`
- `cd web-ui && npx vitest run src/runtime/use-runtime-config.test.tsx src/runtime/use-runtime-project-config.test.tsx src/runtime/native-agent.test.ts src/hooks/use-git-actions.test.tsx src/hooks/use-home-agent-session.test.tsx src/hooks/use-runtime-settings-cline-controller.test.tsx src/hooks/use-startup-onboarding.test.tsx`

Status:
- pass

## Gate V-05 Contract honesty gate

Requirement links:
- `R-05`

Pass when:
- runtime/docs/tests do not imply `statePath === board location` if no longer true

Evidence:
- [`src/core/api-contract.ts`](/lump/apps/kanban/src/core/api-contract.ts)
- [`src/terminal/agent-registry.ts`](/lump/apps/kanban/src/terminal/agent-registry.ts)
- [`web-ui/src/components/runtime-settings-dialog.tsx`](/lump/apps/kanban/web-ui/src/components/runtime-settings-dialog.tsx)

Status:
- pass

## Gate V-06 Scope gate

Requirement links:
- `R-09`

Pass when:
- no SDK changes
- no hidden storage-engine redesign
- no unrelated runtime/UI work

Evidence:
- no changes under `src/cline-sdk/`
- diff limited to config, state, runtime, tests, and runtime settings UI
- final audit found and fixed non-atomic rollback in `runtime-api.ts`

Status:
- pass

## Known limitation

- `test/runtime/trpc/runtime-api.test.ts` still does not execute in this repo because of an existing `@clinebot/core` export-condition failure at suite load time. The new rollback path is covered by typecheck and code audit, but not by executable Vitest coverage in the current environment.
