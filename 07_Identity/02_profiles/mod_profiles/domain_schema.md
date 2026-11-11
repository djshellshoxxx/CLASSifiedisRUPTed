# PS-056-01 — Domain schema: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-01.R01** A Profile stores the display data and per-field visibility; the record is classed P3 as a whole with field-level classes registered with F10.S02.M02 (public fields P0 once published, contacts fields P2, private fields P3), own profiles are editable and received profiles are read-only mirrors with provenance and the original signature.
- **PS-056-01.R02** A BlockEntry is a P3 vault-only record of blockerDid and blockedDid with an optional private note and is excluded from every statement, relay payload, log and event with class below P3.
- **PS-056-01.R03** Avatar and bio have hard size limits so signed statements stay under 32 KiB.

## Specification

### Profile

Schema `classrup.identity.profile/v1` · storage **relay+device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| did | did — profile subject (P0) |
| origin | enum — own \| received |
| seq | int — profile statement sequence, increments by 1 per published version |
| displayPseudonym | string — copy of the Account pseudonym, 3..32 code points (P0) |
| bio? | string — 0..500 code points, plain text; class follows its visibility |
| avatar? | object — { ref: blob:sha256-<base64url> MediaBlob of F15.S02.M03, mime: image/webp, widthPx: 128, heightPx: 128, bytes at most 24 576, sha256 }; class follows its visibility |
| languages? | array — at most 5 BCP 47 tags; class follows its visibility |
| regionCell? | string — geohash of 4 or 5 characters, never longer (CTR-PRV-001 L1 or L2), equal to the last publicCell from discovery.location.updated |
| visibility | object — per field bio, avatar, languages, region: public \| contacts \| private; default private for region and public for others |
| fieldClasses | object — F10.S02.M02 class per field derived from visibility - public P0, contacts P2, private P3 |
| publishState? | enum — never \| published \| withdrawn (own profile) |
| cid? | string — cid of the signed statement for published or received versions |
| signerKey? | string — device public key that signed the statement, active in the DID's document at first-seen time |
| sig? | string — Ed25519 signature by signerKey over JCS bytes |
| provenance? | object — { originRelay?, via, receivedAt, verifiedAt, notServedBy?: relay ids } for received profiles |
| syncState? | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| status | enum — active \| hidden \| deleted |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- regionCell has 4 or 5 characters or is absent, and is present in a statement only when its visibility is public or contacts.
- A signed statement never includes fields whose visibility is private, and contacts fields appear only in end-to-end encrypted statements.
- A received profile is never edited locally; only status can change (hidden, deleted), and only the local user or a tombstone authored by the profile's own DID changes it.
- No field with visibility private appears in logs, events below P3 or relay payloads.

### BlockEntry

Schema `classrup.identity.block_entry/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| blockerDid | did — the local principal |
| blockedDid | did — valid did:key different from blockerDid |
| note? | string — 0..140 code points, private to the user |
| status | enum — active \| removed |
| removedAt? | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one active BlockEntry exists per (blockerDid, blockedDid).
- blockerDid differs from blockedDid.
- A vault holds at most 1 000 active block entries.

### Storage DDL

```sql
CREATE TABLE identity_block_entry (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, blocker_did TEXT NOT NULL, blocked_did TEXT NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_block_active ON identity_block_entry(tenant_id, blocker_did, blocked_did) WHERE status = 'active';
CREATE TABLE identity_profile (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, did TEXT NOT NULL, origin TEXT NOT NULL, seq INTEGER NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_profile_did ON identity_profile(tenant_id, did, origin);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T01 | unit | PS-056-01.R01, PS-056-01.R03 | update bio and visibility then compose the public statement | statement contains only public fields, signed by P1; private fields absent; size under 32 KiB; field classes registered |
| TEST-PS-056-09.T02 | unit | PS-056-02.R01, PS-056-01.R03 | upload 3 MB JPEG with GPS EXIF and an oversized WebP | re-encoded WebP 128 by 128 under 24 KiB, stripped by F10.S02.M03 and stored as a MediaBlob, or IDENTITY_AVATAR_INVALID |
| TEST-PS-056-09.T05 | integration | PS-056-01.R02, PS-056-04.R02 | block S2 then deliver a profile, an offer card and a message from S2 | all dropped silently; S2 gets no error; isBlockedEither is true both ways |
| TEST-PS-056-09.T19 | abuse | PS-056-01.R01, PS-056-07.R04 | contacts and private field values with their F10 classes; scan logs, events below P3 and relay payloads | no private-visibility field anywhere; contacts fields only inside end-to-end encrypted statements |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F06.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
