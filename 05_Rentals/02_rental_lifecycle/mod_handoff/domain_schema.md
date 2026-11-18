# PS-042-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (LOCATION_COARSE cells, EXIF), CTR-ID-001 (`hnd_` PENDING registry entry, proposed owner F05), CTR-SCH-001, CTR-EVT-001 (`aggregate_type = rental_handoff`).

**Decision labels:** D04 partial execution OPEN (no atomic handover assumed). D06 signed statements only (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-01.R01 | One `direction = out` handoff per rental start. A second active handoff for the same `rnt_` → `RNTHAND.ALREADY_COMPLETE` or conflict. | MVP |
| PS-042-01.R02 | `place_region_cell` is a registered coarse cell (CTR-PRV-001 R04) or null. No coordinates, street address or meeting point text field exists in this schema. | MVP |
| PS-042-01.R03 | Checklist items are fixed codes: `accessories_complete`, `visible_condition_recorded`, `identifier_recorded`, `access_items_handed`. Each item is `ok`, `issue` or `not_applicable`. | MVP |
| PS-042-01.R04 | `photo_digests` ≤ 20 SHA-256 digests; bytes held by F08 attachments; EXIF location removed before digest (CTR-PRV-001 R03). | MVP |
| PS-042-01.R05 | Each party's attestation is a signed statement binding checklist and photo digests (Ed25519, ASSUMPTION). | MVP |
| PS-042-01.R06 | No platform custody or payment fields. | MVP |

**Canonical record owner (B-06):** the rental custody-handoff record class (`hnd_`, `rental_handoff`) is owned by this module, F05.S02.M01 (PROVISIONAL, pending CONTRACTS.md listing by lead). The meetup exchange record (F08.S03.M02, slug `mod_handoff`) is a separate record class with its own owner; consumers reference either by full ID only.

## Data / schema
```json
{
  "handoff_id": "hnd_<26>",
  "rental_id": "rnt_<26>",
  "direction": "out",
  "owner_ref": "acc_<26>",
  "renter_ref": "acc_<26>",
  "window_start": "RFC 3339", "window_end": "RFC 3339",
  "place_region_cell": "string | null",
  "checklist": [{"code": "enum", "result": "ok | issue | not_applicable"}],
  "photo_digests": ["sha256 hex, max 20"],
  "owner_attestation": {"attested_at": "RFC 3339", "signature": "base64"} ,
  "renter_attestation": {"attested_at": "RFC 3339", "signature": "base64"},
  "status": "SCHEDULED | OWNER_ATTESTED | RENTER_ATTESTED | COMPLETE | CONTESTED | EXPIRED | CANCELLED",
  "state_version": "integer >= 1",
  "schema_version": "1.0.0"
}
```
Data classes: party refs and checklist PRIVATE_PERSONAL; `place_region_cell` LOCATION_COARSE; digests PRIVATE_PERSONAL.

## Commands / queries / events
Not applicable here; see PS-042-04.

## States & transitions
Defined in PS-042-03.

## Validation & errors
PS-042-02.

## Authorization
Both parties read; non-participants `SYS.NOT_FOUND` (PS-042-05).

## Failure, idempotency, concurrency, offline
Signatures bind the record version; a change after attestation invalidates the attestation.

## Privacy, retention, abuse
Records RET-PRIV (365 days after last access). Records referenced by an open damage or deposit dispute are held until that dispute closes (case legal hold, CTR-PRV-001 R07). Never federated.

## Observability & budgets
`rental_handoff_schema_reject_total{code}`.

## Tests
- TEST-PS-042-01-01 (unit): valid record passes; unknown checklist code fails.
- TEST-PS-042-01-02 (lint): no coordinate or address field in the schema.
- TEST-PS-042-01-03 (integration): photo upload with GPS EXIF stored without GPS tags.
- TEST-PS-042-01-04 (unit): attestation signature fails after any record change.

## Acceptance criteria
1. Schema registered with owner F05 and digest.
2. Zero coordinate fields in schema (TEST-PS-042-01-02).
3. TEST-PS-042-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: Ed25519 attestation (CTR-EVT-001 R05 algorithm).
- PROVISIONAL (D06 default, unapproved).
- OPEN (lead): CONTRACTS.md owner listing for handoff record class.
