# PS-066-01 — Domain schema: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-01.R01** A SafeSpot is a public P0 statement signed by a curator key with venue name, kind, an optional access note without house numbers, opening hours and the L2 region cell (geohash 5) it belongs to; it carries no street address, no cell finer than L2 and never user data, and its cell passes F06.S02.M01 assertPublicCell (N8).
- **PS-066-01.R02** Spots belong to exactly one L2 cell and carry a curator DID, the relay that hosts them, a version and a validity range; a vault shows on every spot where its trust comes from - a curator the user pinned, the app starter list, or a curator delegated by relay R through its signed curator list - and the app bundles no trusted curator keys.
- **PS-066-01.R03** Spot statements are retained under RET-STANDARD in relay indexes and vault caches and are replaced when a newer valid version arrives; retired spots keep a tombstone for 180 days.
- **PS-066-01.R04** The relay's curator list is the relay-signed statement classrup.comms.curator_list/v1 owned by this module and changed only by that relay's operators (F16.S01.M01 operator role); vaults pin curator keys per relay on first use and warn when the list changes.
- **PS-066-01.R05** The bundled starter set is unsigned default data labelled app starter list; users and relays can hide or override any entry, and it never grants curator status to anyone.

## Specification

### SafeSpot

Schema `classrup.comms.safe_spot/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — hosting relay or community scope |
| l2Cell | string — geohash of exactly 5 characters (L2), passes assertPublicCell |
| venueKey | string — normalized lowercase name plus l2Cell hash, ≤ 64 chars, for deduplication |
| name | string — 2..80 characters |
| kind | enum — police_station \| shopping_centre \| library \| transit_hub \| cafe \| community_centre |
| accessNote? | string — ≤ 160 characters such as 'main lobby, open to the public'; no house numbers, no street address |
| hours | array — 1..14 items { dayOfWeek 1..7, open HH:mm, close HH:mm } in the venue's IANA tz |
| venueTz | string — IANA time zone |
| curatorDid? | did:key — signer, must be in the hosting relay's curator list; absent for app starter list entries |
| source | enum — curated \| app_starter_list |
| hostRelayId? | string — relay whose curator list delegated the curator |
| status | enum — draft \| signed \| active \| retired |
| retiredReason? | enum — closed \| unsuitable \| duplicate \| policy \| expired \| discarded |
| version | int — increments on each published change |
| validUntil? | timestamp — optional curator-stated end of validity; the spot is retired with reason expired when it passes |
| signature? | bytes — Ed25519 over JCS of the statement; absent for app starter list entries |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- A spot is active only with a valid signature from a key in the hosting relay's curator list (or as an unsigned app starter list entry) and at least one hours entry, and only before validUntil.
- l2Cell is exactly 5 characters and no field carries a street address, a cell finer than L2, a residential address or user coordinates.
- Only the newest version per (curatorDid, venueKey) is active; older versions are superseded.
- draft and signed exist only in the curator's vault until a relay accepts the statement.

### Storage DDL

```sql
CREATE TABLE comms_safe_spot (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, l2_cell TEXT NOT NULL CHECK (length(l2_cell) = 5),
  venue_key TEXT NOT NULL, curator_did TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL,
  valid_until TEXT, revision INTEGER NOT NULL, statement TEXT NOT NULL);
CREATE INDEX comms_safe_spot_cell ON comms_safe_spot(tenant_id, l2_cell, status);
CREATE TABLE comms_curator_list (relay_id TEXT PRIMARY KEY, version INTEGER NOT NULL, statement TEXT NOT NULL);
CREATE TABLE comms_safe_spot_report (id TEXT PRIMARY KEY, spot_id TEXT NOT NULL, reporter_key TEXT NOT NULL,
  reason TEXT NOT NULL, text TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE UNIQUE INDEX comms_safe_spot_report_open ON comms_safe_spot_report(spot_id, reporter_key);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T01 | unit | PS-066-01.R01, PS-066-01.R03, PS-066-02.R01 | C1 drafts and publishes a valid police-station spot at u33db; drafts with a 6-character cell and with a house number in the access note | first stored active signed; second refused DISCOVERY_PRECISION_FORBIDDEN; third refused VALIDATION_FAILED |
| TEST-PS-066-09.T14 | abuse | PS-066-01.R02, PS-066-01.R04 | R adds its own key to its curator list and publishes a police station; the user had pinned C1 | the spot shows 'curator delegated by relay R', ranks below C1 spots and starter entries, and a curator-list-changed warning is shown until acknowledged |
| TEST-PS-066-09.T18 | unit | PS-066-01.R05 | load the app starter list; user hides an entry; relay overrides an entry | entries unsigned and labelled app starter list; no curator key ships with the app; hidden and overridden entries are not suggested |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [module SPEC](SPEC.md).
