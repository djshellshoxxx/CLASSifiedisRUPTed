# PS-089-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (peer states, batches), CTR-EVT-001 (aggregate, revision), CTR-ID-001 (`blk_` PENDING registry entry), CTR-SCH-001 (`blocklist.entry` PENDING), CTR-PRV-001 (data classes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-01.R01 | An entry has exactly one target: kind `node` (`nod_`), `peer` (`fpr_`) or `content_digest` (64 lowercase hex, SHA-256 of the canonical envelope; no payload stored). Any other kind, including `acc_`, `prf_`, coordinates, addresses or free text, is refused at write. | MVP |
| PS-089-01.R02 | Each entry has one provenance: `local_moderator` (requires `cas_` ref), `local_operator` (requires `ope_` actor and reason code) or `peer_import` (requires `dlv_` batch ref and `fpr_` origin). Provenance is immutable after creation. | MVP |
| PS-089-01.R03 | Uniqueness key is (`target_kind`, `target_ref`, `scope`, `source_kind`). A repeat import from another peer increments `corroboration_count` and creates no second row. | MVP |
| PS-089-01.R04 | Store holds ≥ 100,000 entries (ASSUMPTION) with one indexed read on (`target_kind`, `target_ref`) for the check path. | MVP |

## Data / schema
| Field | Type and constraint | Class |
|---|---|---|
| `blk_id` | `blk_` + 26 Crockford base32 (ulid class; prefix PENDING) | PUBLIC |
| `revision` | integer ≥ 1, per aggregate (CTR-EVT-001 R02) | PUBLIC |
| `target_kind` | closed enum: `node`, `peer`, `content_digest` | PUBLIC |
| `target_ref` | pattern per kind (see PS-089-02); never `acc_` or `prf_` | PSEUDONYMOUS |
| `scope` | closed enum: `local` (default), `federate` (CTR-FED-001 R02) | PUBLIC |
| `action` | closed enum: `deny_inbound`, `deny_outbound`, `deny_both` | PUBLIC |
| `reason_code` | closed enum owned by F12 (PENDING F12 registry); no free text | PUBLIC |
| `source_kind` | closed enum: `local_moderator`, `local_operator`, `peer_import` | PUBLIC |
| `source_ref` | `cas_` or `dlv_` ID; null for `local_operator` | PSEUDONYMOUS |
| `origin_peer` | `fpr_` ID; set only for `peer_import` | PSEUDONYMOUS |
| `status` | closed enum: `proposed`, `active`, `rejected`, `withdrawn`, `expired` | PUBLIC |
| `withdraw_cause` | null or closed enum: `operator`, `case_reversed`, `batch_rollback` | PUBLIC |
| `proposed_by` / `approved_by` | `mod_`, `ope_` or `sys_` ID; `approved_by` ≠ `proposed_by` | PSEUDONYMOUS |
| `expires_at` | RFC 3339 UTC ms; required for `peer_import` | PUBLIC |
| `corroboration_count` | integer ≥ 0 | PUBLIC |
| `schema_version` | `1.0.0` (CTR-SCH-001) | PUBLIC |

## Commands / queries / events
Defined in PS-089-04. This file defines the record shape only.

## States & transitions
Defined in PS-089-03.

## Validation & errors
Rules and codes in PS-089-02.

## Authorization
Field-level visibility in PS-089-05: no end-user role reads entries.

## Failure, idempotency, concurrency, offline
Record writes follow PS-089-06.

## Privacy, retention, abuse
No field holds personal data, coordinates or free text (PS-089-07). Retention per PS-089-07.

## Observability & budgets
Gauge `blocklist_entries_active` by `target_kind` and `scope`. Budgets in PS-089-08.

## Tests
- TEST-PS-089-01-01 (unit): each field pattern and closed enum accepts valid and rejects invalid values.
- TEST-PS-089-01-02 (property): random target strings never persist unless they match the kind pattern.
- TEST-PS-089-01-03 (integration): repeat import from second peer increments `corroboration_count`; row count unchanged.
- TEST-PS-089-01-04 (integration): 100,000-row seed; check read stays within PS-089-08 budget.

## Acceptance criteria
1. Every field in the table is enforced by schema and write path; TEST-PS-089-01-01 passes.
2. No row exists with `acc_`, `prf_`, free text or coordinates; TEST-PS-089-01-02 passes.
3. Uniqueness key holds under concurrent imports; TEST-PS-089-01-03 passes.

## Assumptions & open decisions
- PENDING CTR-ID-001: prefix `blk` (class ulid, owner F11). Not yet in registry.
- PENDING CTR-SCH-001: `blocklist.entry` 1.0.0 and `blocklist.*` event schemas.
- PENDING F12: reason-code registry and split of decision authority. CTR-FED-001 names F12 as distributor of blocklists.
- ASSUMPTION: 100,000-entry capacity.
- PROVISIONAL (D01 default, unapproved): signed envelopes; distribution is opt-in per entry.
- PROVISIONAL (D07 default, unapproved): retention classes per PS-089-07.
