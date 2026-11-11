# PS-129-06 — Failure recovery and idempotency: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-06.R01** All commands are idempotent per CTR-IDM-001 and ingestion dedupes by statement content ID.
- **PS-129-06.R02** Registration and revocation commit the record, the event, the revoked-key set entry and the revocation list entry in one transaction.
- **PS-129-06.R03** A revocation received before its key is written to the revoked-key set at once and applied when the key is seen, so ordering never loses a revocation.

## Specification

- **idempotency:** Idempotency-Key for relay commands; statement and list ingestion dedupe by statementCid and (relayId, listSeq); a repeated revocation returns the stored record.
- **concurrency:** Unique keyId index for live records and the revoked-key primary key; expectedRevision on revoke; two simultaneous revocations of the same key converge on the earliest revokedAt; list heads are compared and stored inside one transaction per relay.
- **retries:** Relay revocation statements are delivered via the sync outbox with CTR-IDM-001 backoff until peer_accepted or 30 days; list polling retries with jitter.
- **offline:** A vault keeps answering from its cache with the true freshness age; propagation to others waits for the network, and the UI states the lag.
- **partial failure:** If publishing to the relay list fails, the local revocation stands and the sync outbox retries; if a source is unreachable freshness degrades honestly from the last head's issuedAt rather than treating keys as valid forever.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T04 | integration | PS-129-03.R03, PS-129-06.R03 | expiry sweep missed for a VAPID key; revocation of peer key Z arrives before federation.peer.added | verification refuses the expired key; Z's hash is in the revoked-key set and the key is recorded revoked when it appears |
| TEST-PS-129-09.T10 | chaos | PS-129-06.R01, PS-129-06.R02, PS-129-06.R03 | publish fails after a local VAPID revocation; replay of the same Idempotency-Key | local revocation stands; outbox retries; one record and one revoked-key entry |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
