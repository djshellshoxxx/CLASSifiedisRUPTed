# PS-031-06 — Failure recovery and idempotency: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-06.R01** Commands are idempotent through local command ids and statements are idempotent by cid; replays and duplicate relay deliveries never advance a milestone twice.
- **PS-031-06.R02** Contradictory signed statements for one milestone (two submissions with the same predecessor, or approvals of different cids) freeze the milestone and require explicit renegotiation, never last-writer-wins.
- **PS-031-06.R03** Each state change, its event and its sync outbox entry commit in one IndexedDB transaction.

## Specification

- **idempotency:** Local command id stored 24 h; submission cid and approval cid are content hashes so a repeated statement yields the same result; commerce.deal.open is idempotent through the deterministic dealId; payment events are deduplicated by (consumer, eventId) in the inbox; DeletionPort and RetentionPurgePort handlers are idempotent by request id.
- **concurrency:** Web Locks lock services-booking-<bookingId> around milestone commands and payment event handling; expectedRevision on every command; forked devices of one party are detected through the seq/prev chain and freeze the milestone.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination; local payment-event handlers retry per EVT-6.
- **offline:** Submit, approve, request_changes and completion signing work offline and commit locally (the Deal is opened in the same local vault); the UI shows prepared, transport_acknowledged or peer_accepted and never claims the counterparty saw it before the signed acknowledgement.
- **partial failure:** If commerce.deal.open fails during approval, approval is not signed and the milestone stays submitted; if relay delivery fails the local state remains and the sync line shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T08 | integration | PS-031-06.R01, PS-031-06.R02, PS-031-09.R03 | relay duplicates, drops and reorders; two forked provider devices sign different submissions | duplicates skipped; fork freezes the milestone for renegotiation |
| TEST-PS-031-09.T09 | integration | PS-031-06.R03, PS-031-03.R04 | commerce.deal.open fails during approval | approval not signed; milestone stays submitted; no dealId |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
