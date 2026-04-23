# Ticket Index

## Execution order

1. `T-01` brownfield seam audit and contract anchor map
2. `T-02` API contract types and validation schema
3. `T-03` task and dependency metadata model extension
4. `T-04` import procedure skeleton and version routing
5. `T-05` task create idempotency path
6. `T-06` link realization and idempotency path
7. `T-07` explicit start-task path
8. `T-08` import readback or replay-safe result surface
9. `T-09` CLI/runtime compatibility and regression tests
10. `T-10` docs, tracking, and final audit

## Delegation default

Default model:
- `gpt-5.4-mini` `low`

Escalate only when needed:
- `gpt-5.4-mini` `medium` for cross-file implementation or test design
- `gpt-5.3-codex` `medium` only if a ticket resists clean subdivision

## Ownership split

- backend contract and router work: `T-02`, `T-04`, `T-08`
- board/state mutation path: `T-03`, `T-05`, `T-06`
- runtime start handoff: `T-07`
- tests and docs: `T-01`, `T-09`, `T-10`
