# Context Index

## Entry points

### Feature intent
- feature request `#228`
- Phase2 recommendation docs in `/lump/apps/kanban-integration-idea/docs/Phase2/`

### Primary code ownership
- `src/state/workspace-state.ts`

### Supporting areas
- `src/config/runtime-config.ts`
- `src/trpc/workspace-api.ts`
- `src/trpc/projects-api.ts`
- `src/server/workspace-registry.ts`
- `src/core/api-contract.ts`
- `src/cli.ts`
- `test/integration/workspace-state.integration.test.ts`
- `docs/architecture.md`

## Traversal order

1. `05-refs-existing-behavior.md`
2. `06-kit-configurable-board-path.md`
3. `02-ticket-index.md`
4. `07-validation.md`
5. `08-tracking.md`

## Context edges

### Existing behavior refs -> kit
- current hardcoded board path
- directory-centric persistence model
- repo-path-based workspace identity
- runtime contract exposing `statePath`

### Kit -> tickets
- every ticket maps to one or more kit requirements

### Tickets -> validation
- each implementation ticket has one or more validation gates

### Validation -> tracking
- `08-tracking.md` records pass/fail/open risk for each gate
