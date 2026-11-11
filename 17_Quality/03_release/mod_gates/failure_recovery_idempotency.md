# PS-143-06 — Failure recovery and idempotency: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-06.R01** Gates are idempotent and side-effect free apart from writing reports; re-running yields the same verdict for the same inputs.
- **PS-143-06.R02** Stale evidence (older than 24 h or from a different commit SHA) is rejected so a green result from another commit cannot be reused.
- **PS-143-06.R03** If a gate crashes it is reported as failed with the error message and the other gates still run.

## Specification

- **idempotency:** Gates only read inputs and write reports; re-running with the same inputs returns the same verdict.
- **concurrency:** Gates run in parallel where independent (audit and trace) with a join before the verdict; the report is written atomically once.
- **retries:** The audit call is retried 3 times with 2 s backoff for network errors, then fails closed; other gates are not retried.
- **offline:** The audit gate needs the registry; offline it fails closed with QUALITY_GATE_AUDIT_UNAVAILABLE. Other gates work offline from local reports.
- **partial failure:** All gates always run; a crash in one is recorded as failed and does not hide results of others.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T01 | unit | PS-143-01.R01, PS-143-01.R03, PS-143-06.R01 | generate gates.json on the full-coverage repo | schema valid; no user data fields; verdict GO |
| TEST-PS-143-09.T04 | unit | PS-143-02.R03, PS-143-06.R02 | a11y, load, pwa-budgets and compat reports - missing, 25 h old, other commit SHA, with violations (including INP 250 ms) | each fails with its code |
| TEST-PS-143-09.T09 | integration | PS-143-06.R03 | crash one gate by injecting an exception | reported failed; others complete |
| TEST-PS-143-09.T14 | unit | PS-143-06.R01 | same inputs run twice with a different clock | identical verdict and report body |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03, CTR-FED-001, F18.S01.M01, F18.S01.M02, F18.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
