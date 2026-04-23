# Validation

## Contract gate

Must prove:
- version field enforced
- request schema validated
- response schema stable

Target tests:
- new runtime/workspace API validation tests
- API contract schema tests if needed

Result:
- pass
- request parser enforces `version: "v1"`
- request parser trims and rejects empty import identifiers

## Identity gate

Must prove:
- external task key persists in task metadata
- task readback exposes it deterministically

Target tests:
- board mutation tests
- workspace state integration tests

Result:
- pass for v1 scope
- external task identity persists on `RuntimeBoardCard.externalTaskKey`
- verified via `workspace.importTasks` replay behavior in focused runtime tests

## Idempotency gate

Must prove:
- repeated same import does not create duplicate tasks
- repeated same link does not create duplicate dependencies
- conflicting replay fails closed

Target tests:
- import integration tests

Result:
- pass
- repeated same import reuses existing task mappings and dependency edges

## Ambiguity gate

Must prove:
- ambiguous mapping or conflicting external key does not silently continue

Target tests:
- import failure-path integration tests

Result:
- pass
- conflicting external task key intent fails closed with `conflicting_task_intent`

## Start gate

Must prove:
- explicit `startTaskKeys` runs only after successful create/link steps
- runtime start errors do not erase created mappings

Target tests:
- runtime/workspace integration tests with mocked start path where appropriate

Result:
- pass
- explicit `startTaskExternalKeys` run after successful graph realization
- start success preserves created mappings and moves tasks to `in_progress`

## Regression gate

Must prove:
- existing task CLI and board mutation semantics still hold

Target tests:
- targeted existing suites around `task-board-mutations`
- targeted existing suites around runtime task start if touched

Result:
- pass on nearby runtime regression slice:
  - `pnpm vitest run test/runtime/trpc/workspace-api.test.ts`
  - `pnpm vitest run test/integration/task-command-exit.integration.test.ts -t "JSON payload file"`
  - `pnpm vitest run test/integration/runtime-state-stream.integration.test.ts -t "imports tasks through the live workspace.importTasks tRPC route"`

## Documentation gate

Must prove:
- branch docs match actual contract and non-goals

Result:
- pass
- docs updated for implemented v1 shape and known unrelated root typecheck blocker
