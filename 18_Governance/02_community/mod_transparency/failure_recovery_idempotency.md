# PS-148-06 — Failure recovery and idempotency: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-06.R01** Commands are idempotent per CTR-IDM-001; counter consumers are idempotent by event id (EVT-3).
- **PS-148-06.R02** Compute is deterministic: the same snapshot and parameters give the same contentCid.
- **PS-148-06.R03** Coverage is measured, not declared: counters accumulate on the relay while its consumers run, the snapshot's coverage comes from the relay's hourly processing checkpoints, and the report states it.

## Specification

- **idempotency:** Idempotency-Key required on record_legal_request, import_snapshot, compute, request_review, publish and discard; keys kept 24 h; counter increments from events are deduplicated by (consumer, eventId) and policy decisions by (proposalId, statementCid); legal request increments are applied once per key.
- **concurrency:** expectedRevision on request_review and discard in the compiler vault; publish binds the draft cid; counters use compare-and-set increments inside one relay transaction; nothing orders two operator vaults, so two different reports published for the same (relayId, periodKey, version) are both marked conflicted by every reader (V14) and the operators publish a new version.
- **retries:** Relay-side consumers retry with IDM-4 backoff and dead-letter after 8 attempts (EVT-6); hours with dead-lettered counter events are not counted as processed; relay upload retries base 500 ms cap 30 s, 6 attempts.
- **offline:** Once a snapshot is imported, compute, review and publish signing work offline in the operator vaults; publication stays prepared until the relay returns a signed receipt (transport_acknowledged); peer_accepted is not used because a report has no single addressee.
- **partial failure:** If upload fails after signing, the report is published locally with delivery pending and the public page does not show it until the relay confirms; a consumer failure for one event does not affect other counters and lowers measured coverage for that hour.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T07 | integration | PS-148-04.R02, PS-148-06.R01 | deliver the same relay events twice and out of order, plus vault-origin copies, vault_filter spam events and decided events from another publisher | counts equal unique relay events; ignored events not counted; each operator decision counted once |
| TEST-PS-148-09.T09 | chaos | PS-148-06.R03 | relay consumers stopped for 12 hours in the 92-day quarter; upload fails after signing | coverage computed as 99 percent from checkpoints and stated in the report; published locally with pending delivery and not shown publicly |
| TEST-PS-148-09.T10 | integration | PS-148-06.R01, PS-148-06.R02 | replay compute and publish with same key; recompute from the same snapshot in O2's vault | same contentCid; one published report |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
