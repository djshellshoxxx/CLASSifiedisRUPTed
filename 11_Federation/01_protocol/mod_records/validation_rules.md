# PS-084-02 — Validation rules: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-02.R01** Checks run cheapest first and blocklists run before anything is persisted, so a blocked peer, author or cid never reaches storage.
- **PS-084-02.R02** Inbound responses to peers never reveal which block rule matched; every blocklist hit returns the generic FEDERATION_NOT_ACCEPTED while the internal reason is logged and evented.
- **PS-084-02.R03** Every rule violation maps to exactly one stable code and the per-envelope outcome is returned in a results array in request order.
- **PS-084-02.R04** Authorship is proven by the signature and the registry role alone; no relay is bound to an author, the sending relay is provenance for display, and where to fetch an author's records comes from the relays listed in the author's portable identity document.
- **PS-084-02.R05** Payload checks depend on the audience; the portable allowlist and federation opt-in apply only to audience public portable types, control types use their registry schema, and participant statements are checked for ciphertext shape and size.
- **PS-084-02.R06** A device key that the latest verified portable document marks revoked is refused at receipt whatever createdAt claims, and statements accepted before this vault learned the revocation are quarantined when this vault first saw them at or after revokesEffectiveAt.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | relay-to-relay requests: federation flag F11 is on (off by default); vault to relay requests: the relay hosting policy accepts the signing device key | FEATURE_DISABLED |
| V02 | relay: sender is an active allowlisted peer relay or a device key registered with this relay, and the RFC 9421 request signature verifies (F11.S03.M01, F11.S01.M03) | FEDERATION_PEER_NOT_ALLOWED |
| V03 | batch has 1..100 envelopes and body ≤ 4194304 bytes; each envelope ≤ 262144 bytes; participants envelopes ≤ 12288 bytes so their sealed wrapper fits an F08 mailbox blob | FEDERATION_BATCH_TOO_LARGE |
| V04 | peer quota available: 6000 envelopes/hour and 10 batches/minute (F11.S03.M01) | FEDERATION_QUOTA_EXCEEDED |
| V05 | envelope shape: v = 1, author is a did:key, ext.stream is pub or thr:<id>, ext.audience matches the registry audience of the type, participants envelopes carry ext.recipients, seq ≥ 1 and prev present iff seq > 1 | VALIDATION_FAILED |
| V06 | peer, author did, cid and content hash are not matched by an active reject rule (F11.S03.M02 evaluate, which exempts tombstone, move and move_cancel statements from author and cid rules); a hide match stores the record hidden | FEDERATION_NOT_ACCEPTED |
| V07 | strict parse and Ed25519 signature over JCS(envelope minus sig) verify with ext.signerKey or the author key (F11.S01.M03 V01–V04, V07); a wrong cid is refused with FEDERATION_CID_MISMATCH | FED_SIGNATURE_INVALID |
| V08 | createdAt is no more than 10 minutes in the future and no older than the registry maxAge of the type (types without maxAge have no age limit); the owner's own vault import and restore are exempt from the age limit, and a catch-up predecessor that fails only the age limit is kept as a continuity stub (cid, seq, prev; no content) per F11.S02.M02 | FEDERATION_RECORD_TIME_INVALID |
| V09 | no applied author tombstone targets this cid, or this author principal and recordKey; relay_removal advisories trigger this rule only in the issuing relay's own index; a pending_target tombstone counts only after V12 matched its issuer to the arriving record | FEDERATION_TOMBSTONED |
| V10 | relay ingest from a peer relay: only audience public signed envelopes are accepted; authorship is proven by the signature alone, the sender is recorded as receivedFromRelay for display and never binds the author to a relay (no trust on first use) | FEDERATION_ORIGIN_MISMATCH |
| V11 | audience public portable types: payload passes F11.S01.M01 V06, V07 and V09 (allowlist, 65536 bytes, L2); control types: their registry schema; participants: ciphertext shape and size only (F11.S01.M01 V11) | FEDERATION_PAYLOAD_INVALID |
| V14 | the type is registered and the signer holds its role per F11.S01.M01 roleFor; user roles need ext.signerKey active in the author's latest verified portable document at receiver time (F07.S02.M01 key_status), relay roles need a key pinned in F11.S03.M01; otherwise the statement is quarantined | FEDERATION_SIGNER_ROLE_INVALID |
| V12 | tombstone: signed by a device key of the target's author principal (targetRecordKey tombstones bind to the issuer did); relay_removal: signed by the pinned key of a relay that hosts the item, carries a statement of reasons, and is stored as an advisory; reason in the enum for the kind | FEDERATION_TOMBSTONE_UNAUTHORIZED |
| V13 | local publish: author is the local principal and ext.signerKey is this device's key listed active in the principal's portable document (F07.S02.M01); relay publish: the relay key signs only relay types; audience public portable types also need the source record opted in (F11.S01.M01 V02) and privacy.consent.check(federation_publish) granted, failing closed with DEPENDENCY_UNAVAILABLE | FEDERATION_AUTHOR_NOT_OWNED |
| V15 | the signer key is not marked revoked in the latest verified portable document this receiver has seen, whatever createdAt claims (statement rejected, not quarantined) | FEDERATION_SIGNER_ROLE_INVALID |
| V16 | vault receive: the author principal is not blocked in either direction (F07.S02.M02 isBlockedEither); a blocked author's statements are dropped silently with no ack, no event and the generic outcome (N7) | BLOCKED_PARTY |
| V17 | pending_target tombstones: at most 50 per issuer and 1000 per tenant, kept at most 180 days; excess tombstones for unseen targets are refused | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T02 | unit | PS-084-02.R03, PS-084-02.R01 | each rule V01–V17 violated in turn | documented code per rule; nothing beyond a cid stub stored; V14 quarantines instead of rejecting |
| TEST-PS-084-09.T03 | integration | PS-084-02.R01, PS-084-02.R02 | reject rules on an author, a cid and a peer; then a tombstone and a move statement by the blocked author through an allowed peer and through the blocked peer | stored count unchanged and FEDERATION_NOT_ACCEPTED with the same shape for the three blocked envelopes; the tombstone and move bypass the author rule and are applied via the allowed peer and refused via the blocked peer |
| TEST-PS-084-09.T10 | abuse | PS-084-03.R05, PS-084-02.R01 | third party signs a pre-emptive tombstone for X's record not yet seen; X's record arrives 2 days later; one issuer sends 51 tombstones for unseen targets | tombstone rejected on arrival and X's record accepted; the 51st refused with RATE_LIMITED |
| TEST-PS-084-09.T11 | abuse | PS-084-02.R04 | relay B sends Y's listing although Y's portable document lists only relay C; relay D then sends the same cid; Y later publishes via C | accepted from B on its signature, via [B, D], no binding to B and no FEDERATION_ORIGIN_MISMATCH; the later record via C accepted |
| TEST-PS-084-09.T12 | abuse | PS-084-02.R01 | 7000 valid envelopes from one peer within an hour and 11 batches in a minute | FEDERATION_QUOTA_EXCEEDED with retryAfterMs; stored count capped at 6000 |
| TEST-PS-084-09.T14 | abuse | PS-084-02.R05 | public payload with homeAddress, lat/lon, geohash 7 and a script tag; control tombstone with an extra member; participants ciphertext of 12289 bytes; participants statement without opt-in | FEDERATION_PAYLOAD_INVALID for the first three, nothing stored; the participants statement is accepted without any opt-in check |
| TEST-PS-084-09.T37 | integration | PS-084-02.R06 | statement signed by a key the latest portable document marks revoked with a backdated createdAt; revocation learned after acceptance for one record first seen after revokesEffectiveAt and one seen before | first rejected FEDERATION_SIGNER_ROLE_INVALID; the later-seen record quarantined signer_key_revoked; the earlier one stays accepted with a revoked-signer marker |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F07.S02.M02, F15.S04.M02, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
