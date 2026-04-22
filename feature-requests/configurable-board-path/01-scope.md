# Scope

## Objective

Implement a low-drift configurable board-path feature that lets Kanban load and persist board state from an explicit custom file path while preserving current default behavior.

## Source request

GitHub discussion `#228`:
- “when executing the kanban command then we should have the option to set the customised board path so that we can load the project specific board and track the board.json in git.”

## Locked goals

- support a custom board file path
- preserve current default path behavior
- keep workspace identity based on repo path and existing workspace index
- keep current task/session/worktree behavior unchanged
- keep CLI/task seams compatible

## Recommended v1 scope

- add one canonical board-path resolver
- add one supported configuration source for board-path override
- refactor workspace-state reads/writes to use that resolver
- add validation and tests for default and override behavior
- document path semantics and limitations

## Non-goals

- no workspace-state storage redesign
- no full relocation of all workspace files unless evidence forces it
- no new external API
- no board import/export workflow
- no Prompt Forge integration work in this branch
- no changes under `src/cline-sdk/`
- no broad UI redesign

## Decision gates

### Gate 1: config surface

Chosen:
- persisted project runtime config as the canonical source

Deferred:
- launch-time CLI flag

Reason:
- lower drift than threading a launch-only override through every boot path
- aligns with existing per-project config pattern

### Gate 2: storage split policy

Chosen:
- `board.json` only in v1

Deferred:
- relocating `sessions.json` and `meta.json`

Reason:
- matches the actual feature request
- lowest drift
- avoids turning a file-path feature into a broader persistence migration

Accepted tradeoff:
- `statePath` no longer fully implies board location
- API/doc language must become more precise

## Success criteria

1. Kanban still works unchanged with no custom configuration.
2. A configured custom board file path is used for board read/write.
3. `sessions.json` and `meta.json` behavior remains deterministic.
4. Malformed custom board files fail loudly and clearly.
5. CLI/runtime/project flows continue to resolve the same workspace identity.
6. Tests cover default, override, and failure cases.
