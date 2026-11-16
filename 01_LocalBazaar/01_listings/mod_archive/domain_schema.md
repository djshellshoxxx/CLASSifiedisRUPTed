# PS-001-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`lst_` identifier), CTR-EVT-001 (revision, provenance), CTR-PRV-001 (data classes, retention), CTR-SCH-001 (schema versioning). **Decisions:** D05, D07 (defaults PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-01.R01 | Archive state is fields on the listing aggregate `lst_` (owned by F01). This module writes only `lifecycle_state`, `archived_at`, `archived_by_kind`, `archived_by_ref`, `archive_reason_code`, `archive_case_ref`. | MVP |
| PS-001-01.R02 | Module-visible `lifecycle_state` values: `PUBLISHED`, `ARCHIVED`. Other F01 values are owned by mod_publish. | MVP |
| PS-001-01.R03 | Archive and restore never change `published_at`. Ranking age is preserved. | MVP |
| PS-001-01.R04 | No free-text reason field exists. `archive_reason_code` is a closed enum of 4 values. | MVP |
| PS-001-01.R05 | Archive fields contain no LOCATION_PRECISE data. `region_cell` is LOCATION_COARSE only (D05 default). | MVP |
| PS-001-01.R06 | Every state change increments `revision` by exactly 1 (CTR-EVT-001 R02). | MVP |
| PS-001-01.R07 | Archive fields are retained per PS-001-07 (D07 default). | MVP |
| PS-001-01.R08 | Archive state is federated only when `federate=true` on the listing (CTR-FED-001 R02). | Future |

## Data / schema
| Field | Type / constraint | Class | Visible to |
|---|---|---|---|
| `listing_id` | string, `^lst_[0-7][0-9A-HJKMNPQRSTVWXYZ]{25}$` | PUBLIC | public |
| `revision` | integer, 1 ≤ n ≤ 2^53−1 | PUBLIC | public |
| `lifecycle_state` | enum closed: `PUBLISHED`, `ARCHIVED` (module view) | PUBLIC | public (archived = not found, see below) |
| `archived_at` | RFC3339 UTC, ms, `Z`; null unless ARCHIVED | PSEUDONYMOUS | owner, case |
| `archived_by_kind` | enum closed: `user`, `mod`; null unless ARCHIVED | PSEUDONYMOUS | owner, case |
| `archived_by_ref` | `acc_` or `mod_` ID; null unless ARCHIVED | PSEUDONYMOUS | owner (user), case (mod) |
| `archive_reason_code` | enum closed: `OWNER_HIDDEN`, `SOLD_ELSEWHERE`, `NO_LONGER_AVAILABLE`, `MODERATION_HOLD` | PUBLIC | owner, case |
| `archive_case_ref` | `cas_` ID; non-null only when `archived_by_kind = mod` | PSEUDONYMOUS | case |
| `region_cell` | registry cell ID (CTR-PRV-001 R04) | LOCATION_COARSE | per F01 rules |

Invariants: PUBLISHED implies all archive fields null. ARCHIVED implies `archived_at`, `archived_by_kind`, `archived_by_ref`, `archive_reason_code` non-null. `archived_by_kind = mod` implies `archive_case_ref` non-null. Violation → `SYS.INTERNAL`, write rejected.

Provenance: `provenance.source_kind` ∈ {`local`, `federated_import`}. Non-owners never receive an ARCHIVED listing: they get `SYS.NOT_FOUND` (CTR-ERR-001 R08).
