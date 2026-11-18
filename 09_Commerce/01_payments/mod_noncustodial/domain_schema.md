# PS-069-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R01–R03, R08, R11), CTR-ID-001, CTR-PRV-001, CTR-SCH-001. **Decisions:** D09 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-01.R01 | Stores direct payment instructions only. No balance, wallet, payout or platform-account field exists; any such field is rejected with `COM.CUSTODY_FORBIDDEN`. | MVP |
| PS-069-01.R02 | One `route` = one (`trx_`, party `acc_`, method, destination). `method` ∈ {`on_chain`, `cash`, `in_kind_compensation`, `other_external`}. | MVP |
| PS-069-01.R03 | Max 5 non-withdrawn routes per (`trx_`, party). Unique on (`trx_`, party, method, `destination_hash`). | MVP |
| PS-069-01.R04 | `on_chain` routes carry CAIP-2 `chain`, CAIP-19 `asset` and `destination`, validated by the registered rail adapter (PS-069-02). | MVP |
| PS-069-01.R05 | `contact_hint` (off-platform handle for cash or other routes) is ≤ 200 characters, PRIVATE_PERSONAL, encrypted at rest with a KMS key (ASSUMPTION), readable by the counterparty only. | MVP |
| PS-069-01.R06 | `adapter` registry rows: `adapter_id`, `rail`, `chain`, `finality_confirmations`, `status`, signing `key_` ID. Unregistered adapters are untrusted (CTR-COM-001 R11). | MVP |
| PS-069-01.R07 | Route records and `contact_hint` are never federated in MVP (CTR-FED-001 R03; financial evidence deferred). | MVP |

## Data / schema
| Field | Type / constraint | Data class |
|---|---|---|
| `route_id` | `rte_` + ULID body (PENDING CTR-ID-001 prefix registration; proposed `rte`, class `ulid`) | PSEUDONYMOUS |
| `trx_id` | `^trx_[0-9A-HJKMNP-TV-Z]{26}$` | FINANCIAL_EVIDENCE |
| `party_ref` | `acc_` ID; must be a participant of `trx_id` | PSEUDONYMOUS |
| `method` | enum, 4 values (R02) | FINANCIAL_EVIDENCE |
| `chain` | CAIP-2 or null (null unless `on_chain`) | PSEUDONYMOUS |
| `asset` | CAIP-19 (`on_chain`) or ISO 4217 alpha-3 (`fiat`) | PSEUDONYMOUS |
| `destination` | string ≤ 128 chars or null; `on_chain` only | PSEUDONYMOUS (public on chain; linkable, see PS-069-07) |
| `destination_hash` | SHA-256 hex, 64 chars, of JCS(destination) | PSEUDONYMOUS |
| `contact_hint` | string ≤ 200 chars or null; `cash` and `other_external` only | PRIVATE_PERSONAL |
| `status` | enum `DECLARED`, `SUPERSEDED`, `WITHDRAWN`, `SUSPENDED`, `EXPIRED` | PSEUDONYMOUS |
| `state_version` | integer ≥ 1, increments per transition | PSEUDONYMOUS |
| `schema_version` | `1.0.0` (CTR-SCH-001) | — |

Provenance: `created_by` (actor ref), `created_at` (server time), `superseded_by` (route_id or null).

## Commands / queries / events
Described in PS-069-04. Records are append-only; a replace creates a new row and sets the old row to `SUPERSEDED`.

## States & transitions
See PS-069-03.

## Validation & errors
See PS-069-02.

## Authorization
Field visibility (CTR-CAP-001 R10): `destination` visible to `participant`; `contact_hint` visible to counterparty only; both `never` to `sys_` verifiers outside their scope.

## Failure, idempotency, concurrency, offline
Schema changes follow CTR-SCH-001 expand-contract. A stored row missing `schema_version` is rejected at read time (`SCH.UNKNOWN_VERSION`).

## Privacy, retention, abuse
Class per field as above (CTR-PRV-001 R01). Retention in PS-069-07.

## Observability & budgets
Row counts per status per day (aggregate only). No per-row logging.

## Tests
- TEST-PS-069-01-01 (unit): every field carries exactly one class; CI fails `PRV.UNCLASSIFIED_FIELD` otherwise.
- TEST-PS-069-01-02 (contract): fixtures with balance, wallet_id, payout_account fields are rejected with `COM.CUSTODY_FORBIDDEN`.
- TEST-PS-069-01-03 (property): `destination_hash` is stable under JCS key reordering.

## Acceptance criteria
1. All seven requirements have passing tests (TEST-PS-069-01-*).
2. Schema contains zero custody-class fields (grep-based CI check over schema files).
3. `contact_hint` never appears in any event payload (CTR-EVT-001 R11).

## Assumptions & open decisions
- ASSUMPTION: 5 routes per (trx, party) is sufficient for MVP.
- ASSUMPTION: address format validity is syntax only; ownership proof is future scope (PS-069-02).
- PENDING CTR-ID-001: prefix `rte` for route records.
- D09 (PROVISIONAL default, unapproved): no platform custody; routes are external or direct arrangement evidence.
