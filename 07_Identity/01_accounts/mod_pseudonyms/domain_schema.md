# PS-052-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (prefixes `acc`, `prf`), CTR-PRV-001 (PSEUDONYMOUS), CTR-SCH-001, CTR-CAP-001 (R02, R10).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-01.R01 | Every `prf_` row has exactly one `account_id` (`acc_`), NOT NULL, immutable after insert. | MVP |
| PS-052-01.R02 | `prf_` rows store only the fields in the table below. A write with any other field is rejected with `PSEUD.FIELD_NOT_ALLOWED`. | MVP |
| PS-052-01.R03 | `handle_norm` is unique across rows in state `active` and across `handle_reservations`. | MVP |
| PS-052-01.R04 | At most 5 `active` `prf_` per `acc_`. PROVISIONAL (D10 default, unapproved). | MVP |
| PS-052-01.R05 | Schema `pseudonym.record` 1.0.0 registered in CTR-SCH-001 with SHA-256 of its JSON Schema. | MVP |
| PS-052-01.R06 | No table, view or export row joins `acc_` to `prf_` except the owner-scoped read path (PS-052-05). | MVP |
| PS-052-01.R07 | Federated export of `prf_` records. | Future (no CTR-FED-001 mapping; deferred) |

## Data / schema
| Field | Type | Constraint | Class / visibility |
|---|---|---|---|
| `prf_id` | string(30) | prefix `prf`, `ulid` class (CTR-ID-001 R02) | PSEUDONYMOUS, public |
| `account_id` | string(30) | prefix `acc`, FK, immutable | PSEUDONYMOUS, owner-only (CTR-CAP-001 R10) |
| `handle` | string(3–24) | `^[a-z0-9_]{3,24}$` after NFKC + lowercase; stored as display form | PSEUDONYMOUS, public |
| `handle_norm` | string(3–24) | unique index (R03) | PSEUDONYMOUS, internal |
| `label` | string(0–40) | NFC; rules in PS-052-02 | PSEUDONYMOUS, public |
| `state` | enum, closed | `active` \| `retired` (CTR-SCH-001 R04) | PSEUDONYMOUS, public |
| `revision` | int | ≥ 1, per aggregate (CTR-EVT-001 R02) | internal |
| `created_at`, `state_changed_at` | timestamp | RFC 3339 UTC, millisecond | PSEUDONYMOUS, owner-only |

`handle_reservations`: `handle_norm` (PK), `prf_id`, `reserved_until` (retired_at + 90 days, ASSUMPTION), class PSEUDONYMOUS, internal.

Provenance: rows are written only by the owning command handler. No session, device, IP or client-version field is stored on `prf_` (avoids linkage).

## Commands / queries / events
Schema reference only. Commands and events are specified in [commands_queries_events.md](commands_queries_events.md) (PS-052-04).

## States & transitions
Not applicable beyond the `state` enum; transitions are in [workflow_state_machine.md](workflow_state_machine.md) (PS-052-03).

## Validation & errors
Field rules and codes: [validation_rules.md](validation_rules.md) (PS-052-02).

## Authorization
Field visibility per table above; enforced in PS-052-05.

## Failure, idempotency, concurrency, offline
Insert of `prf_` and `handle_reservations` change in one transaction. A unique-index violation returns `PSEUD.HANDLE_TAKEN`; no partial row is kept. See PS-052-06.

## Privacy, retention, abuse
Class PSEUDONYMOUS. Retention per PS-052-07 (RET-ACC while account exists; tombstone rules in that file).

## Observability & budgets
Schema validation failures counted per field name (no values). See PS-052-08.

## Tests
- TEST-PS-052-01-01 (unit): reject each field not in table; accept each allowed field.
- TEST-PS-052-01-02 (property): `handle_norm` uniqueness holds for random case/NFKC variants.
- TEST-PS-052-01-03 (integration): insert of `prf_` with unknown `account_id` fails FK.
- TEST-PS-052-01-04 (contract): record validates against registered schema digest.

## Acceptance criteria
1. Every row maps to exactly one `acc_`; the link is immutable (R01).
2. No stored field outside the table; fixture scan finds no names, emails, phones or coordinates (R02).
3. Handle uniqueness holds under concurrent inserts (R03).
4. Cap of 5 active pseudonyms enforced in the database layer, not only in the API (R04).
5. Schema digest registered and matches (R05).

## Assumptions & open decisions
- ASSUMPTION: ULID body of `prf_` reveals creation time to the millisecond; acceptable for pseudonyms because they carry no legal identity. Revisit if timing linkage is found in PS-052-07 review.
- PROVISIONAL (D10 default, unapproved): cap of 5 active pseudonyms per account; user-controlled keys out of scope here.
- Owner decision for `acc`/`prf` contracts: F07 owner UNASSIGNED (see CTR-ID-001 header).
