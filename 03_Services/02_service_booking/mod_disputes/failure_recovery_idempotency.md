# PS-030-06 — Failure recovery and idempotency: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-06.R01** Open is idempotent by local command id and by scopeKey; a repeated open returns the existing link.
- **PS-030-06.R02** A failure of the F09 case port leaves a pending_link that retries with backoff and never creates two cases.
- **PS-030-06.R03** The notice and the link commit in one vault transaction; a crash leaves neither.

## Specification

- **idempotency:** Local command id stored 24 h; scopeKey uniqueness returns the existing link; notice dedup by cid; the F09 case request carries the link id as idempotency reference.
- **concurrency:** Web Locks lock services-booking-<bookingId>; simultaneous opens by both parties are merged by scopeKey when the second notice arrives, keeping the earlier case cid with lexicographic tie-break.
- **retries:** F09 case open retried at 10 s, 60 s, 10 minutes (3 attempts); notice delivery retried 1 s, 2 s, 4 s, 8 s up to 8 attempts.
- **offline:** Opening works offline and creates a pending_link with a prepared notice; the case is requested when the local F09 module is reachable (always in the same vault) and delivery happens when online.
- **partial failure:** If notice delivery fails the link and case still exist locally and the counterparty learns through the case flow later; if the case port fails the link becomes link_failed after 3 attempts with no case created.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T06 | integration | PS-030-06.R01, PS-030-06.R02 | case port fails 3 times; port succeeds on retry 2 | link_failed after 3 failures with no case; success path creates exactly one case |
| TEST-PS-030-09.T07 | integration | PS-030-06.R03, PS-030-09.R03 | crash between notice and link commit; both parties open simultaneously | neither or both persisted; links merge on scopeKey keeping earlier case cid |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
