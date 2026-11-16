# PS-133-06 — Failure recovery and idempotency: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-06.R01** The check is deterministic and idempotent, producing identical output for identical inputs.
- **PS-133-06.R02** A failed run changes no files; reports are written to a build directory only.
- **PS-133-06.R03** A broken reference is reported with enough context to fix it in one edit.

## Specification

- **idempotency:** The CLI has no side effects besides writing the report file; repeated runs give identical output.
- **concurrency:** Parallel runs write to separate report paths keyed by commit SHA; no shared state.
- **retries:** CI retries the job once on infrastructure failure; check failures are never retried.
- **offline:** The check runs fully offline from repository files.
- **partial failure:** If module specs fail to parse, the check reports the parse error and fails; it never passes with unresolved references.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T08 | integration | PS-133-06.R01, PS-133-06.R02, PS-133-06.R03 | run twice on the same input; unparsable spec | identical output; no files modified; parse error reported and exit 1 |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
