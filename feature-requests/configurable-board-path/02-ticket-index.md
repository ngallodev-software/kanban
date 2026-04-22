# Ticket Index

## Summary

This branch is a brownfield persistence change. Most work belongs in `src/state/workspace-state.ts`, config plumbing, and workspace-state integration tests.

## Tickets

### T-00 Feature folder scaffolding
- Model: `gpt-5.4-mini low`
- Scope:
  - feature docs
  - ticket index
  - orchestration prompt
  - Cavekit kit/validation/tracking artifacts
- Status:
  - done

### T-01 Existing behavior audit
- Model: `gpt-5.4-mini medium`
- Scope:
  - enumerate every current assumption that board path equals `<statePath>/board.json`
  - identify all code paths that read or write board state
  - identify docs/tests that pin current path semantics
- Primary files:
  - `src/state/workspace-state.ts`
  - `src/server/workspace-registry.ts`
  - `src/trpc/projects-api.ts`
  - `src/trpc/workspace-api.ts`
  - `test/integration/workspace-state.integration.test.ts`
  - `docs/architecture.md`
- Acceptance:
  - drift map written into tracking
  - no assumed seams left undocumented

### T-02 Board-path config source
- Model: `gpt-5.4-mini medium`
- Scope:
  - add canonical board-path override source
  - prefer project runtime config for v1
  - if project config chosen, add typed field and normalization
- Primary files:
  - `src/config/runtime-config.ts`
  - `src/core/api-contract.ts` if config contract changes require it
  - related config tests
- Acceptance:
  - default config unchanged
  - override can be read deterministically
  - invalid/empty override rejected or normalized clearly

### T-03 Storage resolver extraction
- Model: `gpt-5.4-mini medium`
- Scope:
  - create one exported resolver for:
    - `statePath`
    - `boardPath`
    - `sessionsPath`
    - `metaPath`
  - preserve current defaults
- Primary files:
  - `src/state/workspace-state.ts`
- Acceptance:
  - no direct hardcoded board-path joins remain outside resolver
  - default resolver outputs match current behavior

### T-04 Workspace-state persistence refactor
- Model: `gpt-5.4-medium`
- Scope:
  - update load/save/mutate/read helpers to use resolved board path
  - keep locks and revision semantics correct
  - keep sessions/meta behavior explicit
- Primary files:
  - `src/state/workspace-state.ts`
- Acceptance:
  - default path still works
  - configured board path works
  - conflict behavior unchanged
  - malformed board file errors still identify actual file path

### T-05 Runtime/read-side contract audit
- Model: `gpt-5.4-mini low`
- Scope:
  - decide whether `RuntimeWorkspaceStateResponse` needs `boardPath`
  - update runtime/docs/tests if `statePath` would become misleading
- Primary files:
  - `src/core/api-contract.ts`
  - `src/trpc/workspace-api.ts`
  - `src/server/runtime-state-hub.ts`
  - `web-ui` tests if affected
- Acceptance:
  - runtime contract is semantically honest
  - no product code depends on false `statePath => board.json` assumption

### T-06 CLI and operator surface
- Model: `gpt-5.4-mini medium`
- Scope:
  - if needed, add a minimal CLI/configuration surface to set or inspect board-path override
  - keep scope narrow; avoid general config overhaul
- Primary files:
  - `src/cli.ts`
  - `src/commands/task.ts`
  - config command files if existing surface is reused
- Acceptance:
  - operator can configure feature without manual file surgery
  - no regression to normal launch/task commands

### T-07 Integration and regression test wave
- Model: `gpt-5.3-codex medium`
- Scope:
  - add or update tests for:
    - default path
    - custom path
    - malformed custom board file
    - concurrent workspace creation unaffected
    - stale write/conflict unaffected
- Primary files:
  - `test/integration/workspace-state.integration.test.ts`
  - config tests
  - CLI tests if new flag/surface added
- Acceptance:
  - path feature validated end-to-end
  - no silent fallback to old path when override configured

### T-08 Docs update
- Model: `gpt-5.4-mini low`
- Scope:
  - update human docs for board-path semantics
  - note feature-request motivation and limitations
- Primary files:
  - `README.md`
  - `docs/architecture.md`
  - maybe `docs/README.md`
- Acceptance:
  - docs match actual resolver behavior
  - no stale `statePath` implications remain

### T-09 Final audit
- Model: `gpt-5.4-mini low`
- Scope:
  - verify narrow branch scope
  - verify no hidden persistence redesign slipped in
  - close tracking/final validation
- Deliverables:
  - `09-final-validation.md`

## Dependency order

1. `T-01`
2. `T-02`
3. `T-03`
4. `T-04`
5. `T-05`
6. `T-06`
7. `T-07`
8. `T-08`
9. `T-09`

Reason:
- config source and resolver must settle first
- persistence refactor depends on both
- contract/CLI/docs should follow actual storage behavior
- tests validate the final integrated shape
