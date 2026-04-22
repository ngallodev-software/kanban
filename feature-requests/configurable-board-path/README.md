# `fork/feature-request/configurable-board-path`

Feature folder for the configurable board-path fork branch.

Branch:
- `fork/feature-request/configurable-board-path`

Problem:
- Kanban currently hardcodes board persistence to `~/.cline/kanban/workspaces/<workspaceId>/board.json`.
- Feature request [`#228`](https://github.com/cline/kanban/discussions/228) asks for a custom board path so project-specific board state can be tracked in git.

Planning stance:
- brownfield only
- no SDK changes
- no invented APIs
- default behavior must remain intact

Recommended v1:
- make `board.json` path configurable
- do not redesign workspace identity
- do not relocate `sessions.json` or `meta.json` in v1 unless required by evidence

Read in this order:
1. `05-refs-existing-behavior.md`
2. `06-kit-configurable-board-path.md`
3. `02-ticket-index.md`
4. `07-validation.md`
5. `08-tracking.md`

Current status:
- implementation complete for planned v1 scope
- validation complete for executable targeted suites
- one repo-level test limitation remains: `test/runtime/trpc/runtime-api.test.ts` is blocked by the existing `@clinebot/core` export-condition issue
