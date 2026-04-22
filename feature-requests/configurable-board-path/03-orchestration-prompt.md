# Multi-Agent Orchestration Prompt

Branch:
- `fork/feature-request/configurable-board-path`

Objective:
- implement a low-drift configurable board-path feature for Kanban

Locked constraints:
- no SDK changes
- no changes under `src/cline-sdk/`
- preserve default behavior
- no invented APIs
- do not widen into workspace-state redesign

Feature intent:
- allow Kanban to load and persist board state from a custom board file path
- support tracking project-specific board state in git

Required brownfield facts:
- board path is currently hardcoded in `src/state/workspace-state.ts`
- workspace identity remains `repoPath <-> workspaceId`
- current persistence model is directory-centric
- request `#228` asks for custom board path, not a new storage engine

Decision gates before code lands:
1. choose canonical override source
2. choose whether override applies only to `board.json` or to all workspace state files

Recommended decisions:
1. project runtime config as canonical source
2. `board.json` only in v1

Delegation map:
- `gpt-5.4-mini low`
  - audits
  - docs
  - contract honesty pass
  - final validation
- `gpt-5.4-mini medium`
  - config plumbing
  - resolver extraction
  - CLI/config surface
- `gpt-5.4-medium`
  - workspace-state persistence refactor
- `gpt-5.3-codex medium`
  - integrated regression test wave

Validation gates:
1. resolver gate
   - one canonical resolver owns board path semantics
2. persistence gate
   - load/save/mutate respect override and preserve revision rules
3. compatibility gate
   - default path behavior unchanged
4. failure gate
   - malformed custom board file fails loudly with actual file path
5. scope gate
   - no hidden relocation of sessions/meta unless explicitly approved

Worker output requirements:
- files changed
- tests added/updated
- assumptions
- open risks
- whether change widened scope beyond plan
