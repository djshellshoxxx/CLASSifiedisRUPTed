# PS-143-04 — Commands, queries and events: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-04.R01** The module exposes pnpm gates:release, pnpm gates:trace, pnpm gates:audit and pnpm gates:report.
- **PS-143-04.R02** Exit codes: 0 GO, 1 at least one gate failed, 2 evidence missing or stale, 3 configuration failure.
- **PS-143-04.R03** The release workflow of F17.S03.M01 calls gates:release in its collect job after downloading every report of the release commit into one reports/ directory; its separate release-publish job (contents: write) attaches reports/gates.md only after GO, and the gates themselves never write to the repository.

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
| QUALITY_GATE_SPEC | 422 | no | spec check has errors or NO-GO (exit 1) |
| QUALITY_GATE_COMPAT | 422 | no | compat report missing, stale, from another commit or showing a QUALITY_COMPAT_* failure or failed browser cell (exit 1) |
| QUALITY_GATE_WAIVER_UNAPPROVED | 422 | no | waiver, quarantine or manual checklist commit lacks code-owner approval (exit 1) |
| QUALITY_GATE_MANUAL_MISSING | 422 | no | a level manual test row has no signed passing checklist for this release commit (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm gates:release --version 0.3.0
  spec          specgen --strict --report: 0 errors, GO  PASS
  traceability  1432/1432 requirements covered (2 waived, 1 quarantined, 4 manual checklists signed by @release-owner)  PASS
  audit         0 critical, 0 high, 3 moderate  PASS
  a11y          serious 0, critical 0  PASS
  budgets       relay OBS-4 PASS (reports/load.json), PWA OBS-5 LCP 1.9 s INP 140 ms CLS 0.03 JS 131 KiB PASS (reports/pwa-budgets.json)
  compat        0 QUALITY_COMPAT_* failures; automated cells pass; manual Safari and iOS checklist signed  PASS
  changelog     0.3.0 present  PASS
  verdict GO  (reports/gates.json)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T07 | integration | PS-143-04.R01, PS-143-04.R02, PS-143-04.R03 | run each script and the release workflow dry-run | documented exit codes; gates.md attached |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03. Predecessor: [domain_schema.md](domain_schema.md).
