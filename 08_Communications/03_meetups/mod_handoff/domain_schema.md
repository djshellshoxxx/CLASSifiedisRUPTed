# PS-065-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`trx`, `par`, `rnt`, `prf`; handoff prefix PENDING), CTR-COM-001 (R14 signed attestation pattern, referenced only), CTR-PRV-001, CTR-SCH-001, CTR-CAP-001 (`attest`).

**Duplicate slug.** `mod_handoff` also exists at 05_Rentals/02_rental_lifecycle/mod_handoff (PS-042). Canonical owner ID for the handoff record class: PENDING CTR-ID-001 entry (candidate prefix `hof`, owner F08). This module is the owner of the record for meetup-based handoff; rental handoff (F05) must reference records by full ID and must not define a second record class. Decision needed from F05 and F08 owners.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-01.R01 | One handoff record per exchange reference (`trx_`, `par_` or `rnt_`) and meetup reference (`mtg_`, PENDING) where present. | MVP |
| PS-065-01.R02 | One attestation line per (`handoff_id`, `item_ref`, `party_prf_id`, `direction`); direction enum `gave` or `received`. | MVP |
| PS-065-01.R03 | Each attestation is signed by the party's registered key (Ed25519, ASSUMPTION, CTR-COM-001 R14 pattern). | MVP |
| PS-065-01.R04 | The record stores no coordinates, no place text and no photos. Location is referenced through the meetup ID only. | MVP |
| PS-065-01.R05 | Items are listed by `item_ref` from the exchange, with `quantity` (integer ≥ 1). | MVP |
| PS-065-01.R06 | Schema `handoff.record` 1.0.0 registered in CTR-SCH-001. | MVP |
| PS-065-01.R07 | Handoff proof-of-delivery by third-party witness or device. | Future (not in MVP; physical-verification scope) |

## Data / schema
| Field | Type | Constraint | Class |
|---|---|---|---|
| `handoff_id` | string(30) | PENDING prefix (`hof`), opaque | PSEUDONYMOUS |
| `exchange_ref` | string(30) | prefix `trx`, `par` or `rnt` | PSEUDONYMOUS |
| `meetup_ref` | string(30) or null | PENDING `mtg` prefix | PSEUDONYMOUS |
| `party_a_prf_id`, `party_b_prf_id` | string(30) | prefix `prf`, distinct | PSEUDONYMOUS |
| `state` | enum closed | see PS-065-03 | internal |
| `window_closes_at` | timestamp | RFC 3339 UTC | PSEUDONYMOUS |
| `item_ref`, `quantity` | string(30), int ≥ 1 | | PSEUDONYMOUS |
| `direction` | enum closed | `gave`, `received` | PSEUDONYMOUS |
| `attested_at` | timestamp | server time at commit | PSEUDONYMOUS |
| `signature` | object | `alg`, `key_ref`, `sig` | PSEUDONYMOUS |
| `revision` | int | ≥ 1 | internal |

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See PS-065-05.

## Failure, idempotency, concurrency, offline
See PS-065-06.

## Privacy, retention, abuse
Class PSEUDONYMOUS; retention RET-EVD (attestations are evidence-like records) per PS-065-07.

## Observability & budgets
Counts by state only (PS-065-08).

## Tests
- TEST-PS-065-01-01 (unit): one line per (handoff, item, party, direction).
- TEST-PS-065-01-02 (contract): no coordinate or place field in schema (lint).
- TEST-PS-065-01-03 (contract): signature verifies against registered key at `attested_at`.
- TEST-PS-065-01-04 (contract): schema digest registered.

## Acceptance criteria
1. Record ownership decision recorded as PENDING with candidate prefix.
2. No location fields exist.
3. Attestations are append-only.
4. Items must belong to the referenced exchange.

## Assumptions & open decisions
- PENDING CTR-ID-001: handoff prefix `hof`, owner F08; F05 to reference by full ID.
- PROVISIONAL (D06 default, unapproved): signed statements only; no receipt verification in this module.
- PROVISIONAL (D04 default, unapproved): per-party attestations and compensating recovery; no atomic real-world guarantee.
