# PS-058-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`prf`), CTR-PRV-001 (PSEUDONYMOUS: "reputation counts"), CTR-SCH-001, CTR-COM-001 (finality states consumed by reference), CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-01.R01 | One `reputation_profile` row per `prf_`; no account-level or cross-pseudonym aggregate row exists. | MVP |
| PS-058-01.R02 | Stored inputs are counters and weights only, per category (table below); no counterparty `prf_` list stored beyond the 90-day diversity window (PS-058-07). | MVP |
| PS-058-01.R03 | Public output is `band` (0–5) plus `status` (`insufficient_data` or `ready`). Raw counters visible to subject only. | MVP |
| PS-058-01.R04 | Schema `reputation.profile` 1.0.0 registered in CTR-SCH-001. | MVP |
| PS-058-01.R05 | Reputation is not transferable between `prf_` and cannot be imported (no import path in MVP). | MVP |
| PS-058-01.R06 | Reputation portability across federated nodes. | Future (D01, D10) |

## Data / schema
| Field | Type | Constraint | Class / visibility |
|---|---|---|---|
| `prf_id` | string(30) | prefix `prf`, PK | PSEUDONYMOUS, public |
| `confirmed_exchanges` | int ≥ 0 | count of exchanges with confirmed finality (F09) | PSEUDONYMOUS, subject |
| `self_attested_exchanges` | int ≥ 0 | count with only self-attestation | PSEUDONYMOUS, subject |
| `signed_statements` | int ≥ 0 | count of valid counterparty-signed evidence (mod_evidence summary) | PSEUDONYMOUS, subject |
| `disputes_lost` / `disputes_won` | int ≥ 0 | from F09 dispute outcomes | PSEUDONYMOUS, subject |
| `cancellations_by_subject` | int ≥ 0 | | PSEUDONYMOUS, subject |
| `distinct_counterparties` | int ≥ 0 | window 365 days, see PS-058-07 | PSEUDONYMOUS, subject |
| `weighted_points` | decimal(10,4) | ≥ 0; recomputed | internal |
| `band` | int 0–5 | derived | PSEUDONYMOUS, public |
| `status` | enum | `insufficient_data`, `ready` | PSEUDONYMOUS, public |
| `revision`, `computed_at` | int, timestamp | | internal |

## Commands / queries / events
Schema reference; see [commands_queries_events.md](commands_queries_events.md).

## States & transitions
`status` derived from thresholds in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Input validation in [validation_rules.md](validation_rules.md).

## Authorization
Field visibility in PS-058-05.

## Failure, idempotency, concurrency, offline
Recompute idempotent per input event ID; see PS-058-06.

## Privacy, retention, abuse
Class PSEUDONYMOUS; counts retained RET-ACC while `prf_` exists; purged at retirement + 30 days (PS-058-07).

## Observability & budgets
Distribution of bands (aggregate only). See PS-058-08.

## Tests
- TEST-PS-058-01-01 (unit): one row per `prf_`; duplicate insert rejected.
- TEST-PS-058-01-02 (contract): public projection contains only `prf_id`, `band`, `status`.
- TEST-PS-058-01-03 (property): counters never negative.
- TEST-PS-058-01-04 (contract): schema digest registered.

## Acceptance criteria
1. No account-level aggregate exists (schema lint).
2. Public projection matches R03.
3. Counters reconcile with source events in nightly check.
4. Schema registered.

## Assumptions & open decisions
- ASSUMPTION: 365-day distinct counterparty window.
- PROVISIONAL (D07 default, unapproved): minimal retention.
- PROVISIONAL (D10 default, unapproved): no portability in MVP.
