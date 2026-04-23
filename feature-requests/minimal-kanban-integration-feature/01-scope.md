# Scope

## Goal

Plan the smallest Kanban change that makes external planners safe to integrate:

- external task definitions
- external dependency intent
- optional explicit start intent
- first-class external identity

## Brownfield framing

This is a brownfield feature plan.

Existing code is source of truth:
- CLI task commands already prove create/link/start semantics
- runtime/trpc already provides local API transport
- workspace state layer already owns board persistence and revision handling

The plan must fit those seams instead of replacing them.

## In scope

- one narrow versioned import contract
- workspace-scoped task import procedure in existing Kanban API boundary
- persistence of external task keys and optional external link keys
- idempotent create/link behavior
- explicit ambiguity failures
- import readback/status if needed for replay-safe operation
- tests for versioning, idempotency, ambiguity, and existing board semantics

## Out of scope

- full board-state mutation API
- Prompt Forge-specific branding or logic
- browser-only automation path
- new standalone REST stack if existing tRPC boundary is sufficient
- replacing CLI commands
- broad workflow engine behavior
- SDK or Cline behavior changes

## Locked decisions

### D-01 Brownfield transport

Chosen:
- implement v1 inside existing `/api/trpc` runtime/workspace boundary

Not chosen:
- separate bespoke REST controller

Reason:
- Kanban already exposes a typed local API boundary
- lower drift than inventing another server surface

### D-02 Write model

Chosen:
- narrow import operation, not `workspace.saveState`

Reason:
- `workspace.saveState` is broad, revision-sensitive, and too easy to misuse

### D-03 Identity model

Chosen:
- external task key is first-class persisted task metadata
- external link key is first-class if link identity is exposed in v1

Reason:
- replay safety depends on durable mapping inside Kanban, not only in caller memory

### D-04 Start semantics

Chosen:
- start only explicit tasks after create + link succeed

Reason:
- preserves deterministic sequencing
- avoids mixing graph realization with runtime failure
