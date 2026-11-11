# PS-063-06 — Failure recovery and idempotency: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-06.R01** Posting is idempotent on (threadId, refId, refRevision) so a retry returns the existing card.
- **PS-063-06.R02** Inbound cards are deduplicated on statement cid and reprocessed safely when the referenced statement arrives later.
- **PS-063-06.R03** The card record and its signed statement are written in one IndexedDB transaction; delivery follows the per-recipient message sync states of F08.S01.M01.

## Specification

- **idempotency:** Vault command idempotent on (threadId, refId, refRevision); inbound statements deduplicated by cid in the consumer inbox (EVT-3).
- **concurrency:** expectedRevision is not needed because cards are immutable except displayState; displayState updates are monotonic (waiting to posted to frozen, superseded, closed or unverified) and applied in one transaction per event; a newer card can supersede only after it reached posted.
- **retries:** Delivery retries are those of the message delivery rows on the F15.S01.M01 outbox (IDM-4 backoff, 7-day expiry); verification of waiting cards is retried whenever a new statement of the referenced kind is stored, for up to 7 days.
- **offline:** Posting works offline and the card shows saved on this device until the carrying message is transport acknowledged; inbound verification works offline against locally held statements.
- **partial failure:** If message delivery fails the local card stays and shows the message's failed state with resend; if the referenced record disappears locally the card becomes unverified instead of being deleted.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T08 | integration | PS-063-06.R01, PS-063-06.R02, PS-063-06.R03 | post twice, replay inbound statement three times, and kill the app before message delivery | single card, one event per origin, card remains with prepared delivery state |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F01.S04.M02, F02.S01.M01, F02.S01.M04, F07.S02.M02, F16.S02.M02, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
