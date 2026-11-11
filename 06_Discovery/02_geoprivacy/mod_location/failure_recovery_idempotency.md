# PS-048-06 — Failure recovery and idempotency: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-06.R01** Vault commands are idempotent through the local command log and use expectedRevision where an aggregate exists.
- **PS-048-06.R02** Delivery of share and revoke statements goes through the sync outbox with states local_committed, prepared, transport_acknowledged and peer_accepted, and the UI never claims more than the reached state.
- **PS-048-06.R03** Expiry and revocation are enforced locally even when the counterparty is unreachable; nothing waits on the network to end a share.

## Specification

- **idempotency:** Idempotency-Key per command kept in the local command log for 24 h; a replayed grant returns the same shareId and the same statement bytes; receive and receive_revoke are keyed by recordCid and statementCid, and the 8-day markers stop a replayed grant after the share record is purged.
- **concurrency:** One IndexedDB transaction per command; the partial unique index prevents two active shares for one recipient and context; key deletion and the status change share one transaction; two tabs serialize through Web Locks.
- **retries:** Outbox retries follow base 500 ms, cap 30 s, full jitter, max 6 attempts per attempt window and continue until effectiveExpiresAt; after expiry the statement is dropped from the outbox.
- **offline:** set_home, grant, revoke and local expiry work offline; the statements wait in the outbox and the share card shows 'not yet delivered' until transport_acknowledged and 'accepted by peer' only after the recipient vault's signed peer acknowledgement.
- **partial failure:** If sealing to the recipient key fails, grant fails before committing; if the revoke statement cannot be delivered, the local share still ends and the UI reports 'the other device may still show your position until <effectiveExpiresAt>'.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T09 | integration | PS-048-06.R01, PS-048-06.R02, PS-048-06.R03 | grant offline, replay same key, deliver later, revoke offline, recipient acknowledges | one share and one statement; UI states follow local_committed, prepared, transport_acknowledged; peer_accepted only after the recipient vault's signed peer acknowledgement; local expiry works with no network |
| TEST-PS-048-09.T16 | abuse | PS-048-02.R02, PS-048-06.R01 | grant replayed from a relay mailbox 30 h after the share ended and its record was purged; claimedIssuedAt 11 minutes ahead; claimedExpiresAt before receipt; outgoing mailbox put inspected | refused by the 8-day ended marker; DISCOVERY_SHARE_TIME_INVALID; EXPIRED; mailbox expiresAt equals claimedExpiresAt |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
