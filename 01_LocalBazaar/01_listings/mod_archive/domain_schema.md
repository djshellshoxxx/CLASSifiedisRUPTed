# PS-001-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`lst_`), CTR-EVT-001 (revision, provenance), CTR-PRV-001 (classes, retention), CTR-SCH-001 (versioning). **Pending:** CTR-LST-001 (listing aggregate ownership).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-01.R01 | Archive state lives as fields on the `lst_` aggregate owned by F01. This module writes only `lifecycle_state`, `archived_at`, `archived_by_kind`, `archived_by_ref`, `archive_reason_code`, `archive_case_ref`. | MVP |
| PS-001-01.R02 | Module-visible `lifecycle_state` values: `PUBLISHED`, `ARCHIVED`. Other F01 values belong to mod_publish. | MVP |
| PS-001-01.R03 | Archive and restore never change `published_at`. | MVP |
| PS-001-01.R04 | No free-text reason field. `archive_reason_code` is a closed enum of 4 values. | MVP |
| PS-001-01.R05 | Archive fields hold no LOCATION_PRECISE data. `region_cell` is LOCATION_COARSE only (PROVISIONAL, D05 default, unapproved). | MVP |
| PS-001-01.R06 | Each accepted state change increments `revision` by exactly 1 (CTR-EVT-001 R02). | MVP |
| PS-001-01.R07 | Archive fields are retained per PS-001-07 (PROVISIONAL, D07 default, unapproved). | MVP |
| PS-001-01.R08 | Archive state federates only when `federate=true` (CTR-FED-001 R02). | Future |

## Data / schema
| Field | Type / constraint | Class | Visible to |
|---|---|---|---|
| `listing_id` | string, `^lst_[0-7][0-9A-HJKMNPQRSTVWXYZ]{25}$` | PUBLIC | public |
| `revision` | integer, 1 ≤ n ≤ 2^53−1 | PUBLIC | public |
| `lifecycle_state` | enum closed: `PUBLISHED`, `ARCHIVED` | PUBLIC | public (ARCHIVED = not found) |
| `archived_at` | RFC3339 UTC, ms, `Z`; null unless ARCHIVED | PSEUDONYMOUS | owner, case |
| `archived_by_kind` | enum closed: `user`, `mod`; null unless ARCHIVED | PSEUDONYMOUS | owner, case |
| `archived_by_ref` | `acc_` or `mod_` ID; null unless ARCHIVED | PSEUDONYMOUS | owner (user), case (mod) |
| `archive_reason_code` | enum closed: `OWNER_HIDDEN`, `SOLD_ELSEWHERE`, `NO_LONGER_AVAILABLE`, `MODERATION_HOLD` | PUBLIC | owner, case |
| `archive_case_ref` | `cas_` ID; non-null only when `archived_by_kind = mod` | PSEUDONYMOUS | case |
| `region_cell` | registry cell ID (CTR-PRV-001 R04) | LOCATION_COARSE | per F01 rules |

Invariants: PUBLISHED implies all archive fields null. ARCHIVED implies `archived_at`, `archived_by_kind`, `archived_by_ref`, `archive_reason_code` non-null. `archived_by_kind = mod` implies `archive_case_ref` non-null. Violation → `SYS.INTERNAL`, write rejected.

Provenance: `provenance.source_kind` ∈ {`local`, `federated_import`}.

## Commands / queries / events
Not defined here. Signatures and payloads: [commands_queries_events.md](commands_queries_events.md) (PS-001-04).

## States & transitions
Transition table and guards: [workflow_state_machine.md](workflow_state_machine.md) (PS-001-03). The invariants above are the postconditions of every transition.

## Validation & errors
Field constraints above are enforced at write. Command-level codes: [validation_rules.md](validation_rules.md) (PS-001-02).

## Authorization
Non-owners never receive an ARCHIVED listing; they get `SYS.NOT_FOUND` (CTR-ERR-001 R08). Field visibility: [authorization_capabilities.md](authorization_capabilities.md) (PS-001-05).

## Failure, idempotency, concurrency, offline
Invariant violation aborts the write in the same transaction (no partial archive fields). Retry and dedupe: [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-001-06).

## Privacy, retention, abuse
Per-field classes are in the Data table. Retention bases: [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-001-07).

## Observability & budgets
No location precision in any metric or log (PS-001-08 R06).

## Tests
- TEST-PS-001-01-01 — property: any sequence of transitions keeps all invariants.
- TEST-PS-001-01-02 — unit: ARCHIVED record missing `archived_by_ref` is rejected by write.
- TEST-PS-001-01-03 — unit: `region_cell` outside registry is rejected; precise coordinates are rejected as a field.

## Acceptance criteria
1. Each field in the Data table has exactly one class (CTR-PRV-001 R01).
2. Invariants enforced by the storage write path, verified by TEST-PS-001-01-02.
3. No free-text field exists in the archive schema.
4. `published_at` unchanged across archive/restore in all fixtures.

## Assumptions & open decisions
- PROVISIONAL (D05 default, unapproved): coarse region only. PROVISIONAL (D07 default, unapproved): retention bases. PROVISIONAL (D01 default, unapproved): federation Future.
- ASSUMPTION: `archived_by_ref` is always an `acc_`/`mod_` ID, never a pseudonym view (CTR-CAP-001 R02).
- PENDING CTR-LST-001: owner of the `lst_` aggregate fields is not yet fixed by a contract.
