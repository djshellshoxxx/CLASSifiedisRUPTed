# PS-066-01 — Domain schema: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-01.R01** A SafeSpot is a public P0 statement signed by a curator key with venue name, kind, public street address, L3-or-coarser venue cell, opening hours and the L2 region cell it belongs to; it never contains user data.
- **PS-066-01.R02** Spots belong to exactly one L2 cell and carry a curator DID, the relay or community that hosts them, a version and a validity range; the vault trusts only curator keys listed in the selected relay's signed curator list or bundled with the app.
- **PS-066-01.R03** Spot statements are retained under RET-STANDARD in relay indexes and vault caches and are replaced when a newer valid version arrives; retired spots keep a tombstone for 180 days.

## Specification

### SafeSpot

Schema `classrup.comms.safe_spot/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — hosting relay or community scope |
| l2Cell | string — region cell ID, public location precision L2 |
| venueKey | string — normalized lowercase name plus street address hash, ≤ 64 chars, for deduplication |
| name | string — 2..80 characters |
| kind | enum — police_station \| shopping_centre \| library \| transit_hub \| cafe \| community_centre |
| publicAddress | string — street address of the public venue, ≤ 160 characters; no private addresses |
| venueCell | string — cell ID at L3 precision or coarser, never exact coordinates |
| hours | array — 1..14 items { dayOfWeek 1..7, open HH:mm, close HH:mm } in the venue's IANA tz |
| venueTz | string — IANA time zone |
| curatorDid | did:key — signer, must be in the curator list |
| status | enum — draft \| active \| retired |
| retiredReason? | enum — closed \| unsuitable \| duplicate \| policy |
| version | int — increments on each published change |
| validUntil? | timestamp — optional curator-stated end of validity |
| signature | bytes — Ed25519 over JCS of the statement |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- A spot is active only with a valid signature from a key in the curator list and at least one hours entry.
- venueCell is at most L3 precision and no field carries a residential address or user coordinates.
- Only the newest version per (curatorDid, venueKey) is active; older versions are superseded.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T01 | unit | PS-066-01.R01, PS-066-01.R02, PS-066-01.R03, PS-066-02.R01 | publish a valid police-station spot and a spot with exact coordinates in venueCell | first stored active signed; second refused VALIDATION_FAILED |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
