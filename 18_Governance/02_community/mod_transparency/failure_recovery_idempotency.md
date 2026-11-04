# PS-148-06 — Failure recovery and idempotency: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-06.R01** Commands are idempotent per CTR-IDM-001; counter consumers are idempotent by event id (EVT-3).
- **PS-148-06.R02** Compute is deterministic: the same counters and parameters give the same contentCid.
- **PS-148-06.R03** Offline operation: counters keep accumulating only while the relay processes events, and the report states coverage honestly.

## Specification

- **idempotency:** Idempotency-Key required on record, compute, publish and discard; keys kept 24 h; counter increments from events are deduplicated by (consumer, eventId); legal request increments are applied once per key.
- **concurrency:** expectedRevision on publish and discard; unique published index per period; two operators computing at once create two computed reports and one wins publication, the other is discarded; counters use compare-and-set increments inside one transaction.
- **retries:** Event consumers retry with IDM-4 backoff and dead-letter after 8 attempts (EVT-6); relay upload retries base 500 ms cap 30 s, 6 attempts.
- **offline:** Compute and review work offline in the operator vault; publication stays prepared until the relay returns a signed receipt, and transport_acknowledged and peer_accepted are shown only on receipts.
- **partial failure:** If upload fails after signing, the report is published locally with delivery pending and the public page does not show it until the relay confirms; a consumer failure for one event does not affect other counters.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T07 | integration | PS-148-04.R02, PS-148-06.R01 | deliver the same moderation events twice and out of order | counts equal unique events; consumer idempotent |
| TEST-PS-148-09.T09 | chaos | PS-148-06.R03 | upload fails after signing; operator offline in the middle of the period | published locally with pending delivery and not shown publicly; coverage percent below 100 stated |
| TEST-PS-148-09.T10 | integration | PS-148-06.R01, PS-148-06.R02 | replay compute and publish with same key; recompute with same counters | same contentCid; one published report |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
