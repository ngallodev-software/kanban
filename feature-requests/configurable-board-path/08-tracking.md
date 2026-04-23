# Tracking

## Status

- branch: `fork/feature-request/configurable-board-path`
- phase: implementation complete
- implementation: in progress review / validation closed for current scope

## Requirement tracking

| Requirement | Status | Notes |
| --- | --- | --- |
| `R-01` default compatibility | done | default fallback remains `<statePath>/board.json` |
| `R-02` canonical resolver | done | board path joins centralized in `workspace-state.ts` |
| `R-03` stable workspace identity | done | workspace index semantics unchanged |
| `R-04` narrow persistence change | done | only board file relocates; sessions/meta remain in state dir |
| `R-05` honest runtime contract | done | runtime responses expose `boardPath` only when a non-default override is active |
| `R-06` configurability | done | persisted project runtime config is canonical source; board-path UI is hidden when no project config exists |
| `R-07` loud failure behavior | done | malformed custom board path fails loudly; no silent fallback |
| `R-08` test coverage | done | config, validation, workspace-state, and focused web tests updated |
| `R-09` low drift | done | no SDK changes and no broad persistence redesign |

## Decision log

### Accepted

- use brownfield, low-drift approach
- preserve default behavior
- no SDK changes
- persisted project runtime config as canonical override source
- board-only override in v1
- runtime response exposes `boardPath` only when a non-default override is active

### Deferred

- explicit CLI setter surface in v1

## Risks

1. Split storage can make `statePath` semantically misleading.
2. `runtime-api` suite execution is still blocked by existing `@clinebot/core` export conditions in this repo.
3. Full-state relocation would widen scope sharply and should be rejected unless evidence demands it.

## Implemented

1. Added project-level `boardPath` to runtime config and runtime contract.
2. Added canonical storage resolver and board-path migration helper.
3. Refactored board load/save/mutate flows to use resolved board path.
4. Added runtime save rollback so failed board relocation restores prior config.
5. Added settings UI field for project board file path, shown only when project config is available.
6. Added config, validation, workspace-state, and focused web test coverage.

## Validation summary

1. `pnpm vitest run test/runtime/config/runtime-config.test.ts test/integration/workspace-state.integration.test.ts test/runtime/api-validation.test.ts`
   - pass
2. `npm run typecheck`
   - pass
3. `cd web-ui && npm run typecheck`
   - pass
4. `cd web-ui && npx vitest run src/runtime/use-runtime-config.test.tsx src/runtime/use-runtime-project-config.test.tsx src/runtime/native-agent.test.ts src/hooks/use-git-actions.test.tsx src/hooks/use-home-agent-session.test.tsx src/hooks/use-runtime-settings-cline-controller.test.tsx src/hooks/use-startup-onboarding.test.tsx`
   - pass

## Remaining work

1. optional full-suite execution once the repo-wide `@clinebot/core` test-import issue is resolved
2. final audit / commit only when requested
