# PS-056-06 — Failure recovery and idempotency: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-06.R01** Vault commands are idempotent through the local command log and use expectedRevision; a profile publish or unpublish is queued through the sync outbox with states local_committed, prepared, transport_acknowledged and peer_accepted.
- **PS-056-06.R02** Blocking is effective locally the moment it commits, independent of any network.
- **PS-056-06.R03** Receiving the same profile statement twice is a no-op keyed by cid.

## Specification

- **idempotency:** Idempotency-Key per command in the vault log for 24 h; receive keyed by cid; block add for an existing active pair returns the existing blockId; unpublish twice returns the same tombstone.
- **concurrency:** expectedRevision on profile and block mutations; the partial unique index prevents duplicate active blocks; Web Locks serialize tabs; two devices of the same principal reconcile profile edits as CONFLICT_REVISION with a resolve-or-discard prompt (IDM-5).
- **retries:** Outbox retries follow base 500 ms, cap 30 s, full jitter, max 6 attempts per window; local commands are not retried.
- **offline:** Profile editing, publishing and unpublishing to the outbox and blocking all work offline; the UI shows 'not yet delivered' until transport_acknowledged and 'accepted by peer' only after a signed acknowledgement.
- **partial failure:** If avatar re-encoding or metadata stripping fails the update is rejected as a whole; if a relay rejects the published statement or the tombstone, the local profile remains and the per-relay state shows the error.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T09 | chaos | PS-056-06.R01, PS-056-06.R02, PS-056-06.R03 | replay of the same key and the same statement; offline publish; avatar encoder failure | one result; outbox states shown honestly; blocking works offline; whole update rejected on failure |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F11.S01.M01, F06.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
