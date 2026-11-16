# PS-055-06 — Failure recovery and idempotency: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-06.R01** Issue and receive are idempotent by cid, so duplicate delivery never creates a duplicate version.
- **PS-055-06.R02** Documents are published to relays through the sync outbox with states local_committed, prepared, transport_acknowledged and peer_accepted, and the UI never shows more than the reached state.
- **PS-055-06.R03** Fork detection never discards either version; it records both.

## Specification

- **idempotency:** Idempotency-Key per command in the vault log for 24 h; receive and publish are keyed by cid (unique index), so replays return the stored result.
- **concurrency:** expectedSeq compare-and-set for issue; two devices issuing seq n plus 1 concurrently create a fork that both vaults detect and show as contested; Web Locks serialize tabs on one device.
- **retries:** Outbox retries use base 500 ms, cap 30 s, full jitter, max 6 attempts per window and continue until transport_acknowledged or the user cancels.
- **offline:** Issue works offline and the new version waits in the outbox; receiving works from any transport including a scanned QR; verification needs no network.
- **partial failure:** If publication to one of several relays fails, the others continue and the UI shows the per-relay state; the local document is already current.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T10 | chaos | PS-055-06.R01, PS-055-06.R02, PS-055-06.R03 | duplicate delivery, crash after sign but before commit, one of three relays down | one document per cid; no half-committed seq; per-relay states shown |

## Dependencies

Module depends on: F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
