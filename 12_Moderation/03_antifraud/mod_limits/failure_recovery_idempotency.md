# PS-098-06 — Failure recovery and idempotency: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-06.R01** Overrides are idempotent per CTR-IDM-001 and use expectedRevision.
- **PS-098-06.R02** Checks never mutate limit state and flow-limit consumption is atomic through F12.S03.M03.
- **PS-098-06.R03** Recompute and event commit in one transaction.

## Specification

- **idempotency:** Idempotency-Key required on override, clear and submit_completion; replay returns the stored response for 24 h; completion counting is idempotent on (completionCid, subjectKey) for as long as the row is retained.
- **concurrency:** expectedRevision on override; unique (tenant, key, limitKey) index; check reads the committed effective value; flow consumption is an atomic bucket consume; risk and action events are applied under BEGIN IMMEDIATE so the latest event wins per limit.
- **retries:** Callers retry DEPENDENCY_UNAVAILABLE; MODERATION_ACCOUNT_LIMIT_REACHED is not retried until resetsAt.
- **offline:** Vaults queue commands in the outbox; the relay applies limits on replay and returns MODERATION_ACCOUNT_LIMIT_REACHED, which the UI shows with the reset time.
- **partial failure:** If the rate store is unavailable, flow limits use the failMode of the class from F12.S03.M03; an action restriction whose revert event is delayed still lapses at its until time; privacy ports (N6) run resumably per row.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T07 | integration | PS-098-02.R02, PS-098-02.R04, PS-098-06.R02 | 6th index write in a day for tier new; check with an unknown limit key; check called with currentCount 0 for a key at its limit | MODERATION_ACCOUNT_LIMIT_REACHED with resetsAt; unknown key denied; VALIDATION_FAILED and no state change |
| TEST-PS-098-09.T09 | integration | PS-098-06.R01, PS-098-06.R03 | same Idempotency-Key replayed on override and on submit_completion; rate store down for a flow limit | original responses replayed; fail mode of class applies |

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
