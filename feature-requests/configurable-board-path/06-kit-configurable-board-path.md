# Kit: Configurable Board Path

## Purpose

Let Kanban use a custom board file path while preserving current default behavior and keeping workspace identity stable.

## R-01 Default compatibility

Kanban must behave exactly as it does today when no board-path override is configured.

Acceptance:
- default path remains `<statePath>/board.json`
- existing projects continue loading without migration
- no task/session/worktree behavior changes

## R-02 Canonical resolver

Board path semantics must be owned by one canonical resolver in the state layer.

Acceptance:
- no duplicated board-path join logic remains
- resolver returns deterministic paths from workspace context + config
- resolver is used by read, write, and mutation flows

## R-03 Stable workspace identity

Custom board path must not redefine how Kanban identifies a workspace.

Acceptance:
- workspace identity remains tied to repo path and workspace index
- workspace id generation and collision handling remain unchanged
- task commands still resolve workspace by project repo path

## R-04 Narrow persistence change

v1 must keep the change narrow.

Acceptance:
- if only `board.json` is moved, that policy is explicit
- `sessions.json` and `meta.json` stay deterministic and documented
- no hidden full persistence relocation happens

## R-05 Honest runtime contract

Runtime responses and docs must not imply false storage semantics.

Acceptance:
- if `statePath` no longer implies board location, either:
  - runtime also exposes `boardPath`, or
  - docs/tests clearly state `statePath` is workspace metadata directory only

## R-06 Configurability

The board-path override must come from a supported, typed source.

Acceptance:
- override source is validated and normalized
- empty or invalid values fail clearly
- operator does not need to patch internal files by hand

## R-07 Loud failure behavior

Malformed custom board files must fail loudly with actual file-location context.

Acceptance:
- error includes offending path
- no silent fallback to default board file when override is configured
- malformed data still gets schema validation

## R-08 Test coverage

The feature must be covered by integration tests and any necessary config/CLI tests.

Acceptance:
- default path test
- custom path test
- malformed custom board file test
- conflict/revision behavior unchanged
- concurrent workspace creation/index behavior unchanged

## R-09 Low drift

The branch must not widen into unrelated persistence, runtime, or UI redesign.

Acceptance:
- no new external API
- no broad CLI redesign
- no changes under `src/cline-sdk/`
- only minimal docs/runtime contract changes

## Locked decisions

### D-01 Canonical override source

Chosen:
- persisted project config

Deferred:
- launch-time CLI flag

### D-02 Board-only vs full-state relocation

Chosen:
- board-only override in v1

Deferred:
- board + sessions + meta relocation

Reason:
- directly matches request `#228`
- minimizes blast radius
- avoids hidden migration complexity
