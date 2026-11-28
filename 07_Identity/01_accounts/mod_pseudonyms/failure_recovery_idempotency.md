# PS-052-06 — Failure recovery and idempotency: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-06.R01** Vault commands are idempotent through the local command log; relay commands are idempotent by Idempotency-Key and statement cid.
- **PS-052-06.R02** Statements are queued through the sync outbox with states local_committed, prepared, transport_acknowledged and peer_accepted, and the UI never shows more than the reached state.
- **PS-052-06.R03** Concurrent edits from two tabs or two devices never overwrite each other silently; conflicts surface as CONFLICT_REVISION, a contested key, or a contested identity document.

## Specification

- **idempotency:** Idempotency-Key per command in the vault command log for 24 h; claim statements are keyed by claimCid so a replay to the same relay returns the same registration, while a cid seen for another purpose or a claim naming another relay is refused.
- **concurrency:** expectedRevision on every mutation; the unique skeleton index serializes concurrent relay claims; two tabs serialize via Web Locks; two devices revoking and adding concurrently produce separate signed statements - mutual revocations freeze both keys as contested here, and conflicting identity documents are detected as a fork in F07.S02.M01 and resolved by the union of revocations, never by last writer wins (ADR-0016 section 5).
- **retries:** Outbox and relay retries follow base 500 ms, cap 30 s, full jitter, max 6 attempts per window, continuing until peer_accepted or the user cancels.
- **offline:** Everything except relay handle claims works offline; a revocation takes effect locally at once and reaches others when the statement and the reissued identity document are delivered, which the UI states; a device link needs the root device to be present.
- **partial failure:** If key generation or the keystore write fails, account creation aborts with nothing persisted; if a revocation statement cannot be delivered, the key is revoked locally and the device list shows 'not yet known to others'.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T11 | integration | PS-052-06.R01, PS-052-06.R02, PS-052-06.R03 | replay the same Idempotency-Key; two tabs edit; A2 and A3 revoke each other concurrently; keystore write fails during creation | one result; CONFLICT_REVISION; both keys contested and nothing revoked silently; outbox state never above the reached state; nothing persisted on failure |

## Dependencies

Module depends on: F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
