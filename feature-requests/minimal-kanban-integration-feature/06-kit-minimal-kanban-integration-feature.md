# Kit: Minimal Kanban Integration Feature

## Purpose

Add the smallest Kanban-native import contract that lets external planners create and reconcile task graphs safely.

## R-01 Existing behavior compatibility

Existing Kanban create/link/start behavior must remain correct for non-import flows.

Acceptance:
- current CLI task commands still behave the same
- existing board mutation rules remain intact
- no Cline SDK behavior changes

## R-02 Brownfield API placement

The feature must live inside Kanban's existing local runtime/trpc boundary.

Acceptance:
- no separate bespoke server stack is introduced
- the new surface is exposed through existing router patterns
- workspace scoping remains explicit

## R-03 Versioned contract

Import requests and responses must be versioned and reject unsupported versions.

Acceptance:
- request includes schema/version field
- response includes schema/version field
- unsupported versions fail clearly

## R-04 First-class external task identity

Imported tasks must persist a caller-supplied external task key in Kanban-owned task metadata.

Acceptance:
- task metadata includes external task key
- task readback can expose the external task key
- replay can identify previously realized tasks without heuristics

## R-05 Optional first-class external link identity

If link identity is surfaced in v1, it must support stable external link keys.

Acceptance:
- link metadata either stores external link key or v1 explicitly excludes link-key persistence
- behavior is documented either way

## R-06 Idempotent task import

Repeated import of the same external task key must not create uncontrolled duplicates.

Acceptance:
- repeated import returns realized mapping or stable no-op result
- duplicate external task key with conflicting payload fails closed

## R-07 Idempotent link realization

Repeated import of the same dependency intent must not create uncontrolled duplicate links.

Acceptance:
- repeated link import returns realized mapping or stable no-op result
- conflicting link identity fails closed

## R-08 Explicit ambiguity failure

If Kanban cannot safely decide whether the external intent is already realized, import must stop and report ambiguity.

Acceptance:
- no silent duplicate creation
- no fallback to broad board replacement
- ambiguity is machine-visible in the result

## R-09 Deterministic start policy

Task start must remain separate from task creation and linking.

Acceptance:
- create happens first
- link happens second
- explicit start list runs only after prior steps succeed
- runtime start failure does not corrupt created mappings

## R-10 Narrow persistence model

The feature must avoid broad persistence redesign.

Acceptance:
- no replacement of workspace identity
- no board/session/meta file redesign
- no import path through `workspace.saveState`

## R-11 Readback and reconciliation

The import surface must return enough realized mapping information for callers to reconcile safely.

Acceptance:
- result includes external task key to task id mapping
- result includes realized dependency ids if links are created
- ambiguity and partial progress are visible

## R-12 Test coverage

The feature must include focused contract and regression coverage.

Acceptance:
- supported version success
- unsupported version failure
- idempotent task replay
- idempotent link replay
- ambiguity failure
- optional explicit start behavior
- existing create/link/start regressions remain green

## Locked design recommendation

Recommended procedure family:
- `workspace.importTasks`
- optional `workspace.getImportResult` only if persistent readback becomes necessary

Reason:
- board mutation belongs closer to workspace state than runtime session control
- explicit task starts can delegate into runtime after graph realization
