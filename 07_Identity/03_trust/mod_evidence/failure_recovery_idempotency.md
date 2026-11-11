# PS-057-06 — Failure recovery and idempotency: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-06.R01** Issue, receive and revoke are idempotent by statement cid, and duplicate delivery never creates a duplicate attestation.
- **PS-057-06.R02** Statements go through the sync outbox with states local_committed, prepared, transport_acknowledged and peer_accepted, and the UI never shows more than the reached state.
- **PS-057-06.R03** A revocation that cannot be delivered still takes effect locally, and the UI says other people may not have seen it yet.

## Specification

- **idempotency:** Idempotency-Key per command in the vault log for 24 h; receive and revocation keyed by cid; issue_relay keyed by (subjectDid, kind, validity window).
- **concurrency:** expectedRevision on revoke and visibility; unique cid index; one active peer attestation per pair enforced in the transaction; Web Locks serialize tabs.
- **retries:** Outbox retries follow base 500 ms, cap 30 s, full jitter, max 6 attempts per window until transport_acknowledged or the user cancels.
- **offline:** Issue, revoke and visibility changes work offline and wait in the outbox; verification of received statements needs no network.
- **partial failure:** If statement signing fails nothing is stored; if delivery to one relay fails, local state stays and the per-relay sync state shows the error.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T05 | integration | PS-057-03.R02, PS-057-06.R03 | revocation received after the subject republished the claim | viewer marks revoked with lastChecked time; subject's copy shows revoked on next sync |
| TEST-PS-057-09.T08 | chaos | PS-057-06.R01, PS-057-06.R02, PS-057-06.R03 | duplicate delivery, offline revoke, signing failure | one record; revoked locally with honest outbox state; nothing stored on failed signing |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
