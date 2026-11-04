# PS-098-06 — Failure recovery and idempotency: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-06.R01** Overrides are idempotent per CTR-IDM-001 and use expectedRevision.
- **PS-098-06.R02** Checks never mutate stock-limit state and flow-limit consumption is atomic through F12.S03.M03.
- **PS-098-06.R03** Recompute and event commit in one transaction.

## Specification

- **idempotency:** Idempotency-Key required on override and clear; replay returns the stored response for 24 h.
- **concurrency:** expectedRevision on override; unique (tenant, key, limitKey) index; check reads the committed effective value; flow consumption is an atomic bucket consume.
- **retries:** Callers retry DEPENDENCY_UNAVAILABLE; ACCOUNT_LIMIT_REACHED is not retried until resetsAt.
- **offline:** Vaults queue commands in the outbox; the relay applies limits on replay and returns ACCOUNT_LIMIT_REACHED, which the UI shows with the reset time.
- **partial failure:** If the rate store is unavailable, flow limits use the failMode of the class from F12.S03.M03; stock limits rely on counts the caller supplies and never fail open for sensitive classes.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T07 | integration | PS-098-02.R03, PS-098-06.R02 | 6th listing in a day for tier new; stock limit with currentCount 10 of 10 | ACCOUNT_LIMIT_REACHED with resetsAt for flow; without for stock |
| TEST-PS-098-09.T09 | integration | PS-098-06.R01, PS-098-06.R03 | same Idempotency-Key replayed; rate store down for flow limit | original response replayed; fail mode of class applies |

## Dependencies

Module depends on: F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
