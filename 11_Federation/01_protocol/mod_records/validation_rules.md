# PS-084-02 — Validation rules: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-02.R01** Checks run cheapest first and blocklists run before anything is persisted, so a blocked peer, author or cid never reaches storage.
- **PS-084-02.R02** Inbound responses to peers never reveal which block rule matched; every blocklist hit returns the generic FEDERATION_NOT_ACCEPTED while the internal reason is logged and evented.
- **PS-084-02.R03** Every rule violation maps to exactly one stable code and the per-envelope outcome is returned in a results array in request order.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | relay-to-relay requests: federation flag F11 is on (off by default); vault to relay requests: the relay hosting policy accepts the signing device key | FEATURE_DISABLED |
| V02 | sender is an active allowlisted peer relay or a device key registered with this relay, and the request signature verifies (F11.S03.M01, F11.S01.M03) | FEDERATION_PEER_NOT_ALLOWED |
| V03 | batch has 1..100 envelopes and body ≤ 4194304 bytes; each envelope ≤ 262144 bytes | FEDERATION_BATCH_TOO_LARGE |
| V04 | peer quota available: 6000 envelopes/hour and 10 batches/minute (F11.S03.M01) | FEDERATION_QUOTA_EXCEEDED |
| V05 | envelope has v = 1, a registered type, author did:key, seq ≥ 1, prev present iff seq > 1 | VALIDATION_FAILED |
| V06 | peer, author did, cid and content hash are not matched by an active block rule (F11.S03.M02) | FEDERATION_NOT_ACCEPTED |
| V07 | Ed25519 signature over JCS bytes verifies and claimed cid matches | FED_SIGNATURE_INVALID |
| V08 | createdAt is no older than 180 days and no more than 10 minutes in the future | FEDERATION_RECORD_TIME_INVALID |
| V09 | no applied tombstone targets this cid or this author and recordKey | FEDERATION_TOMBSTONED |
| V10 | sender peer equals the originRelay bound to the author; first accepted record binds the author to the sender and F11.S03.M03 move records rebind | FEDERATION_ORIGIN_MISMATCH |
| V11 | payload passes the F11.S01.M01 inbound allowlist, serialized ≤ 65536 bytes | FEDERATION_PAYLOAD_INVALID |
| V14 | vault only: signer key holds the role required by the statement type (author of the listing, listed proposal participant, owner of the offer) according to the registry in F11.S01.M01 | FEDERATION_SIGNER_ROLE_INVALID |
| V12 | tombstone issuer is the target's author or origin relay and reason is in the enum | FEDERATION_TOMBSTONE_UNAUTHORIZED |
| V13 | local publish: envelope author is a device key listed in the local principal's portable identity document (F07.S02.M01) and the source record is opted in | FEDERATION_AUTHOR_NOT_OWNED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T02 | unit | PS-084-02.R03, PS-084-02.R01, PS-084-09.R01 | each rule V01–V13 violated in turn | documented code per rule and nothing beyond a stub stored |
| TEST-PS-084-09.T03 | integration | PS-084-02.R01, PS-084-02.R02 | blocked author, blocked cid and blocked peer envelopes | stored count unchanged, response is FEDERATION_NOT_ACCEPTED for all three with the same shape |
| TEST-PS-084-09.T11 | abuse | PS-084-02.R01, PS-084-07.R01 | relay B sends record by author Y homed at C; then valid signed move record | FEDERATION_ORIGIN_MISMATCH; after federation.account.moved rebind the same sender is accepted |
| TEST-PS-084-09.T12 | abuse | PS-084-02.R01, PS-084-07.R01 | 7000 valid envelopes from one peer within an hour and 11 batches in a minute | FEDERATION_QUOTA_EXCEEDED with retryAfterMs; stored count capped at 6000 |
| TEST-PS-084-09.T14 | abuse | PS-084-02.R01, PS-084-07.R02, PS-084-07.R03 | payload with homeAddress, lat/lon, geohash 7 and a script tag | FEDERATION_PAYLOAD_INVALID; nothing stored; escaped render for allowed text |
| TEST-PS-084-09.T25 | integration | PS-084-01.R04, PS-084-02.R01, PS-084-03.R01 | vault receives accept-offer statement signed by a key that is not the listing author | quarantined with statusReason signer_role_invalid, no domain event, user can discard |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S04.M02, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
