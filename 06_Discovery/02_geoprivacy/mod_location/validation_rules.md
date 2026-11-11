# PS-048-02 — Validation rules: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-02.R01** Home input is validated to cells at precision 5 or coarser and a public level no finer than L2 before storage, and the published cell passes assertPublicCell.
- **PS-048-02.R02** Share input enforces one counterparty, a TTL of 24 hours or less, a non-blocked recipient, location_precise consent, and on receipt an accepted record, a valid signer, bounded claimed times and no replay.
- **PS-048-02.R03** Incoming statements are accepted only when signed by the claimed sharer and addressed to the local principal; otherwise they are quarantined with a reason.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | home cell has exactly 5 geohash characters, publicLevel is L0, L1 or L2, and the resulting publicCell passes F06.S02.M01 assertPublicCell (N8) | DISCOVERY_PRECISION_FORBIDDEN |
| V02 | a 4th or later home change within 24 hours carries confirmFrequentChange true; this is a confirmation prompt against mis-taps, not a security control | DISCOVERY_HOME_CHANGE_CONFIRM_REQUIRED |
| V03 | share ttl is 15 minutes, 1 h, 2 h, 8 h or 24 h and never above 86 400 000 ms | DISCOVERY_SHARE_TTL_INVALID |
| V04 | recipient is a single known DID that is not the sharer and not blocked in either direction (F07.S02.M02 isBlockedEither) | BLOCKED_PARTY |
| V05 | fewer than 5 active outgoing shares exist and none is active for the same recipient and context | DISCOVERY_SHARE_LIMIT |
| V06 | an incoming share is a record F11.S01.M02 accepted for type classrup.discovery.location_share/v1 whose signer key belongs to sharerDid (F07.S02.M01 key set, F11.S01.M03 signature over JCS bytes) and whose recipientDid equals the local principal | DISCOVERY_SHARE_SIGNATURE_INVALID |
| V07 | position has finite lat in -90..90 and lon in -180..180 and is rounded to 5 decimals | DISCOVERY_COORD_INVALID |
| V08 | privacy.consent.check({ purpose: location_precise }) is granted (F10.S01.M01) before an L3 or L4 grant and before set_home with device_gps_once; the share sheet collects consent inline | PRECONDITION_FAILED |
| V09 | incoming claimedIssuedAt is at most 10 minutes ahead of local receipt and claimedExpiresAt is at most 24 h after claimedIssuedAt | DISCOVERY_SHARE_TIME_INVALID |
| V10 | incoming claimedExpiresAt is later than local receipt | EXPIRED |
| V11 | an incoming revoke is an accepted record of type classrup.discovery.location_share_revoke/v1 signed by a key of the share's sharerDid and addressed to the local principal; it names a shareId with direction incoming, or one not seen yet (stored as a pending revoke marker) | DISCOVERY_SHARE_SIGNATURE_INVALID |
| V12 | an incoming grant whose shareId or statementCid has an ended or pending-revoke marker (kept 8 days) is refused | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T01 | unit | PS-048-01.R01, PS-048-02.R01 | set home from GPS once with level L1 and consent granted | stored homeCell5 u4pru, publicCell u4pr (assertPublicCell passed), raw coordinates absent from storage |
| TEST-PS-048-09.T02 | unit | PS-048-02.R01 | 6-character cell, level L3, and a 4th change within 24 h without and with confirmFrequentChange | DISCOVERY_PRECISION_FORBIDDEN with nothing stored; DISCOVERY_HOME_CHANGE_CONFIRM_REQUIRED, then saved after confirmation |
| TEST-PS-048-09.T03 | unit | PS-048-01.R02, PS-048-02.R02, PS-048-03.R01 | grant share ttl 2 h, then ttl 25 h, 20 min, and a blocked recipient | first succeeds; others return DISCOVERY_SHARE_TTL_INVALID or BLOCKED_PARTY |
| TEST-PS-048-09.T07 | abuse | PS-048-02.R03, PS-048-05.R01, PS-048-05.R03 | incoming share with a bad signature, wrong addressee, claimed expiry 5 days ahead, a record F11 did not accept, and one from a blocked sender | rejected, clamped to receipt time plus 24 h, or ignored; the blocked sender's statement is dropped silently and quarantined with no UI trace |
| TEST-PS-048-09.T10 | abuse | PS-048-02.R02 | 11 grants in one hour and 21 incoming shares from one DID | RATE_LIMITED from RateLimitPort on the 11th grant; excess incoming quarantined |
| TEST-PS-048-09.T15 | integration | PS-048-04.R04, PS-048-02.R03 | verified revoke for an active incoming share; revoke arriving before its grant; revoke signed by R for Q's share | share ended and per-share key deleted; pending marker stored and the later grant refused with CONFLICT_STATE; DISCOVERY_SHARE_SIGNATURE_INVALID and quarantined |
| TEST-PS-048-09.T16 | abuse | PS-048-02.R02, PS-048-06.R01 | grant replayed from a relay mailbox 30 h after the share ended and its record was purged; claimedIssuedAt 11 minutes ahead; claimedExpiresAt before receipt; outgoing mailbox put inspected | refused by the 8-day ended marker; DISCOVERY_SHARE_TIME_INVALID; EXPIRED; mailbox expiresAt equals claimedExpiresAt |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
