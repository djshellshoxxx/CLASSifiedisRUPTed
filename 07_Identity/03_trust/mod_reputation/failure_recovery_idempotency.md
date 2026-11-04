# PS-058-06 — Failure recovery and idempotency: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-06.R01** Posting, receiving and recomputing are idempotent because cids and the unique review key make duplicates harmless, and a summary can always be rebuilt from stored reviews.
- **PS-058-06.R02** Review statements reach others through the sync outbox with states local_committed, prepared, transport_acknowledged and peer_accepted, and the UI never claims more than the reached state.
- **PS-058-06.R03** Quarantine keeps unverified material out of every score until it verifies.

## Specification

- **idempotency:** Idempotency-Key per command in the vault log for 24 h; receive keyed by cid; recompute is a pure function of stored reviews and algorithmVersion.
- **concurrency:** Unique key on (context, author, subject) prevents duplicates under races; expectedRevision on withdraw and hide; summary recompute is a single transaction per subject; Web Locks serialize tabs.
- **retries:** Outbox retries use base 500 ms, cap 30 s, full jitter, max 6 attempts per window until transport_acknowledged or the user cancels; validation failures are never retried.
- **offline:** Posting, receiving from stored data and recomputing work offline; the review shows 'not yet delivered' until transport_acknowledged and 'accepted by peer' only after a signed peer acknowledgement.
- **partial failure:** If recompute fails the old summary stays with a stale marker and a retry runs in 60 s; if a review verifies but the summary write fails, the review is posted and the summary is rebuilt on the daily run.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T10 | chaos | PS-058-06.R01, PS-058-06.R02, PS-058-06.R03 | duplicate delivery, crash during recompute, offline post then reconnect | one review, summary rebuilt, outbox states honest |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
