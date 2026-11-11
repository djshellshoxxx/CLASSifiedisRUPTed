# PS-133-04 — Commands, queries and events: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-04.R01** The CLI parses the register, validates rules V01 to V06, resolves references against planning/modules.yaml, module.spec.yaml files and test IDs, and exits non-zero on any error.
- **PS-133-04.R02** The report lists counts per boundary and STRIDE letter, rows by residual risk level and dangling references, in text and JSON.
- **PS-133-04.R03** The CLI runs in CI on every pull request touching module specs or the register, and in the release gate.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_THREATMODEL_COVERAGE_GAP | 422 | no | a boundary lacks a STRIDE category without a recorded reason |
| SECURITY_THREATMODEL_DANGLING_CONTROL | 422 | no | a control reference does not exist in the module specs |
| SECURITY_THREATMODEL_NO_TEST | 422 | no | a row has no existing test reference |
| SECURITY_THREATMODEL_REVIEW_STALE | 422 | no | review date older than 6 months |
| SECURITY_THREATMODEL_FORBIDDEN_CLAIM | 422 | no | a document claims audit, certification or guaranteed security |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Documentation and tooling module with no bus commands, queries or events. Interface is the CLI pnpm security:threats:check and the generated report.

### Example

```
$ pnpm security:threats:check
boundaries: 6 (B1..B6) + 2 cross-cutting (X1, X2); rows: 42; STRIDE gaps: 0; dangling controls: 0; rows without test: 0; stale reviews: 0
exit 0
$ pnpm security:threats:check   (after renaming F16.S02.M03)
SECURITY_THREATMODEL_DANGLING_CONTROL THR-B2-03 -> F16.S02.M03.07.R02 not found    exit 1
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T06 | integration | PS-133-04.R01, PS-133-04.R02, PS-133-04.R03 | run CLI in CI on a pull request touching a spec | report text and JSON produced; non-zero exit blocks merge |
| TEST-PS-133-09.T12 | manual | PS-133-03.R01, PS-133-04.R03 | tabletop review of rows T02, T37 and T39 by two maintainers before each release | review recorded with date and reviewers; any change merged via pull request |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
