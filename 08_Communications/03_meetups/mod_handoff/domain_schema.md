# PS-065-01 — Domain schema: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-01.R01** A MeetupCheckin stores, per meetup and party, the status, the claimed check-in time, the local receive time, the signed statement ID and for no-show claims the reporter and report statement, with tenant and revision per CTR-ID-001; no coordinates and no device identifiers are stored.
- **PS-065-01.R02** Check-in times from other parties are claims; the vault stores its own receivedAt and, if a relay receipt exists, the relay-signed time as evidence of that relay's clock only.
- **PS-065-01.R03** A MeetupShare stores the relay ID, share ID, expiry, revoked flag and the hash of the share key (never the key), is P3 on the owner's device, and the relay holds only an encrypted snapshot of at most 2 KiB.

## Specification

### MeetupCheckin

Schema `classrup.comms.meetup_checkin/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| meetupId | uuidv7 — ref F08.S03.M03 Meetup in agreed state |
| proposalHash | string — SHA-256 hex of the agreed proposal this check-in belongs to |
| partyDid | did:key — party the record is about |
| status | enum — pending \| checked_in \| no_show \| void |
| checkedInAtClaim? | timestamp — party clock, a claim, set when status is checked_in |
| receivedAt? | timestamp — local clock when a remote check-in statement was verified |
| relayReceiptAt? | timestamp — relay-signed receipt time, evidence of that relay clock only |
| checkinStatementCid? | string — sha256 cid of the signed check-in statement |
| reportedByDid? | did:key — reporter when status is no_show |
| reportStatementCid? | string — sha256 cid of the signed no-show report |
| contradicted | boolean — true when a check-in statement for the same party arrived after a no-show report |
| voidReason? | enum — meetup_cancelled \| window_elapsed \| not_applicable |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- One record per (meetupId, partyDid, proposalHash); records are created pending when the agreed event is consumed.
- status checked_in implies a verified signature by partyDid on the check-in statement and no coordinates in any field.
- status no_show is always a claim by reportedByDid, who must have status checked_in, and is never shown without the label reported by the reporter name.

### MeetupShare

Schema `classrup.comms.meetup_share/v1` · storage **relay+device** · privacy **P3** · retention **RET-EPHEMERAL**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, also the share path ID |
| meetupId | uuidv7 — ref Meetup |
| ownerDid | did:key — member who created the link |
| relayId | string — relay hosting the encrypted snapshot |
| keyHash | string — SHA-256 hex of the 256-bit share key held only in the link fragment |
| snapshotRevision | int — increments each time the snapshot is re-encrypted (create, check-in, revoke) |
| ciphertext? | bytes — relay only, ≤ 2 048 bytes, XChaCha20-Poly1305 of { placeLabel, windowStart, windowEnd, checkInStates, updatedAt } |
| expiresAt | timestamp — createdAt + at most 24 hours and not later than windowEnd + 6 hours |
| revoked | boolean — true after revoke |
| createdAt | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- The relay never stores the share key and the key never appears in a request path or query string, only in the URL fragment.
- expiresAt is at most 24 hours after createdAt and a revoked or expired share has ciphertext erased on the relay.
- A share exposes place label, window and check-in status only, never names, DIDs, phone numbers or coordinates.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T01 | unit | PS-065-01.R01, PS-065-01.R02, PS-065-02.R01, PS-065-02.R03 | A checks in at 13:50 and with coordinates in the request | first stored checked_in with signed statement; second refused VALIDATION_FAILED; no coordinates stored |
| TEST-PS-065-09.T09 | abuse | PS-065-01.R03, PS-065-07.R01, PS-065-07.R02 | capture all traffic during check-in and share creation | no location, no share key outside the fragment, relay stores ciphertext only ≤ 2 048 bytes |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F08.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
