# PS-143-04 — Commands, queries and events: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-04.R01** The module exposes pnpm gates:release, pnpm gates:trace, pnpm gates:audit and pnpm gates:report.
- **PS-143-04.R02** Exit codes: 0 GO, 1 at least one gate failed, 2 evidence missing or stale, 3 configuration failure.
- **PS-143-04.R03** The release workflow of F17.S03.M01 calls gates:release and attaches reports/gates.md to the release.

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
| QUALITY_GATE_TRACE_GAP | 422 | no | requirement without a passing test (exit 1) |
| QUALITY_GATE_TRACE_DUPLICATE | 422 | no | duplicate or dangling test ID (exit 1) |
| QUALITY_GATE_VULNERABLE | 422 | no | critical or high production vulnerability (exit 1) |
| QUALITY_GATE_AUDIT_UNAVAILABLE | 503 | yes | audit could not run; gate fails closed (exit 2) |
| QUALITY_GATE_A11Y | 422 | no | serious or critical accessibility violation or stale report (exit 1) |
| QUALITY_GATE_BUDGET | 422 | no | a performance budget was exceeded or its report is stale (exit 1) |
| QUALITY_GATE_CHANGELOG | 422 | no | no changelog entry for the version (exit 1) |
| QUALITY_GATE_WAIVER_EXPIRED | 422 | no | a waiver is expired or longer than 14 days (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm gates:release --version 0.3.0
  traceability  1432/1432 requirements covered (2 waived)  PASS
  audit         0 critical, 0 high, 3 moderate  PASS
  a11y          serious 0, critical 0  PASS
  budgets       relay OBS-4 PASS, PWA OBS-5 PASS
  changelog     0.3.0 present  PASS
  verdict GO  (reports/gates.json)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T07 | integration | PS-143-04.R01, PS-143-04.R02, PS-143-04.R03 | run each script and the release workflow dry-run | documented exit codes; gates.md attached |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
