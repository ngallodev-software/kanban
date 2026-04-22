# Refs: Existing Behavior

## Confirmed current behavior

### Board path is hardcoded

- `BOARD_FILENAME = "board.json"` in [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L28)
- `getWorkspaceBoardPath(workspaceId)` returns `<workspaceDir>/board.json` in [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L181)

### Workspace state is directory-centric

- workspace root is `~/.cline/kanban/workspaces` via [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L169)
- workspace dir is `<workspacesRoot>/<workspaceId>` via [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L177)
- sessions/meta are siblings of board file via:
  - [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L185)
  - [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L189)

### Load/save/mutate all assume default board path

- `loadWorkspaceState()` in [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L640)
- `saveWorkspaceState()` in [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L648)
- `mutateWorkspaceState()` in [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L701)

### Workspace identity is repo-based

- git-root canonicalization in [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L503)
- workspace index maps `repoPath <-> workspaceId` in [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L39) and [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L446)
- `loadWorkspaceContext()` returns `repoPath`, `workspaceId`, `statePath`, and git info in [workspace-state.ts](/lump/apps/kanban/src/state/workspace-state.ts#L551)

### Runtime/server bootstrap depends on repo path, not board path

- registry bootstraps from `loadWorkspaceContext(deps.cwd)` in [workspace-registry.ts](/lump/apps/kanban/src/server/workspace-registry.ts#L188)
- state snapshots reload by repo path in [workspace-registry.ts](/lump/apps/kanban/src/server/workspace-registry.ts#L315)
- project add/remove logic depends on repo path and workspace id in `projects-api`

### Runtime contract exposes `statePath`, not `boardPath`

- `RuntimeWorkspaceStateResponse` includes `statePath` in [api-contract.ts](/lump/apps/kanban/src/core/api-contract.ts#L296)
- workspace API returns that state shape in [workspace-api.ts](/lump/apps/kanban/src/trpc/workspace-api.ts)

### Existing tests pin current layout

- workspace-state integration tests write malformed board files at `join(context.statePath, "board.json")` in [workspace-state.integration.test.ts](/lump/apps/kanban/test/integration/workspace-state.integration.test.ts#L273)
- same suite pins `sessions.json` and index layout in:
  - [workspace-state.integration.test.ts](/lump/apps/kanban/test/integration/workspace-state.integration.test.ts#L319)
  - [workspace-state.integration.test.ts](/lump/apps/kanban/test/integration/workspace-state.integration.test.ts#L351)

## External requirement signal

GitHub discussion `#228` says:
- custom board path should be set when executing `kanban`
- goal is project-specific board tracking in git

Source:
- https://github.com/cline/kanban/discussions/228

## Brownfield implications

1. This feature is not just a UI tweak.
2. The primary blast radius is persistence resolution in `workspace-state.ts`.
3. A v1 that moves only `board.json` introduces split storage.
4. Split storage is acceptable only if:
   - resolver semantics are explicit
   - runtime contract is not misleading
   - tests cover custom-path failure modes
