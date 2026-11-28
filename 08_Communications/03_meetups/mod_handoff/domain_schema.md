# PS-065-01 — Domain schema: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-01.R01** A MeetupCheckin stores, per meetup and party, the status, the claimed check-in time, the local receive time, the signed check-in statement ID and, whenever a verified no-show report about that party exists, the reporter, the report statement and the contradicted flag, whatever the status, with tenant and revision per CTR-ID-001; no coordinates and no device identifiers are stored.
- **PS-065-01.R02** Check-in times from other parties are claims; the vault stores its own receivedAt and, if a relay receipt exists, the relay-signed time as evidence of that relay's clock only.
- **PS-065-01.R03** A MeetupShare is a P3 record on the owner's device only (relay ID, share ID, expiry, revoked flag and the hash of the share key, never the key); the relay holds a separate opaque share blob row (shareId, ciphertext of at most 2 KiB, expiresAt, creator key ID) under RET-EPHEMERAL that carries no P3 field.
- **PS-065-01.R04** Signed check-in and no-show statements are evidence under RET-EVIDENCE (2 years after last related activity), kept independently of the thread purge so they and the meetup agreement consents stay re-verifiable, and pseudonymized on principal deletion (N6).
- **PS-065-01.R05** The share snapshot contains only the owner's own check-in state, the place label and the window; it never contains the counterparty's check-in state, names, DIDs, phone numbers or coordinates.

## Specification

### MeetupCheckin

Schema `classrup.comms.meetup_checkin/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| meetupId | uuidv7 — ref F08.S03.M03 Meetup in agreed state |
| proposalHash | string — sha256-<base64url> ID-3 cid of the agreed proposal this check-in belongs to |
| partyDid | did:key — party the record is about |
| status | enum — pending \| checked_in \| no_show \| void |
| checkedInAtClaim? | timestamp — party clock, a claim, set when a verified check-in exists |
| receivedAt? | timestamp — local clock when a remote check-in statement was verified |
| relayReceiptAt? | timestamp — relay-signed receipt time, evidence of that relay clock only |
| checkinStatementCid? | string — sha256 cid of the signed check-in statement |
| reportedByDid? | did:key — reporter of a verified no-show report about partyDid, set whatever the status |
| reportStatementCid? | string — sha256 cid of the signed no-show report |
| contradicted | boolean — true when both a verified check-in by partyDid and a verified no-show report about partyDid exist, in either order |
| contradictionAnnounced | boolean — comms.meetup.no_show_contradicted was emitted |
| voidReason? | enum — meetup_cancelled \| rescheduled \| window_elapsed \| not_applicable |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- One record per (meetupId, partyDid, proposalHash); records are created pending when the agreed event is consumed.
- status checked_in implies a verified signature by partyDid on the check-in statement and no coordinates in any field.
- status no_show is always a claim by reportedByDid, who must have status checked_in, and is never shown without the label reported by the reporter name.
- contradicted is true exactly when checkinStatementCid and reportStatementCid are both set; it never changes status.
- Field classes are annotated per F10.S02.M02 (party DIDs and statement cids P2; no location fields exist).

### MeetupShare

Schema `classrup.comms.meetup_share/v1` · storage **device** · privacy **P3** · retention **RET-EPHEMERAL**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, also the share ID used by the relay blob row |
| meetupId | uuidv7 — ref Meetup |
| ownerDid | did:key — member who created the link |
| relayId | string — relay hosting the encrypted share blob |
| creatorKeyId | string — device key that created the blob and alone may update or delete it |
| keyHash | string — SHA-256 hex of the 256-bit share key held only in the link fragment |
| snapshotRevision | int — increments each time the snapshot is re-encrypted (create, own check-in, revoke) |
| expiresAt | timestamp — createdAt + at most 24 hours and not later than windowEnd + 6 hours |
| revoked | boolean — true after revoke |
| blobState | enum — stored \| unavailable \| deleted (last known state of the relay blob) |
| createdAt | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- The share key is never stored and never appears in a request path or query string, only in the URL fragment of the app-origin viewer URL.
- expiresAt is at most 24 hours after createdAt and a revoked or expired share has its relay blob deleted through comms.meetup_share.delete.
- The snapshot exposes the place label, the window and the owner's own check-in state only.

### Storage DDL

```sql
CREATE TABLE comms_meetup_share_blob (
  share_id TEXT PRIMARY KEY, creator_key_id TEXT NOT NULL, snapshot_revision INTEGER NOT NULL,
  ciphertext BLOB NOT NULL CHECK (length(ciphertext) <= 2048), key_hash TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE INDEX comms_meetup_share_blob_expiry ON comms_meetup_share_blob(expires_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T01 | unit | PS-065-01.R01, PS-065-01.R02, PS-065-02.R01, PS-065-02.R03 | A checks in at 13:50 and with coordinates in the request | first stored checked_in with signed statement; second refused VALIDATION_FAILED; no coordinates stored |
| TEST-PS-065-09.T09 | abuse | PS-065-01.R03, PS-065-01.R05, PS-065-07.R01, PS-065-07.R02, PS-065-09.R03 | capture all traffic and storage during check-ins of A and B and A's share creation | no location, no share key outside the fragment, the relay stores an opaque blob ≤ 2 048 bytes and no P3 field, and the decrypted snapshot holds A's own state but not B's |
| TEST-PS-065-09.T17 | integration | PS-065-01.R04, PS-065-07.R04 | archive and purge the thread 30 days after the meetup, then re-verify | check-in and report statements and the agreement consents remain and verify |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M03, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [module SPEC](SPEC.md).
