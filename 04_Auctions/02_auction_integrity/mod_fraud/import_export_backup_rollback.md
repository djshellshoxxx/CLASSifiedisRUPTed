# PS-037-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-10.R01 | Subject export includes the requester's rule_id, rule_version, score, outcome and dates. It excludes other accounts, features and device hashes. | MVP |
| PS-037-10.R02 | No import path for fraud records in MVP. Federated fraud signals are rejected by CTR-FED-001 inbound rules. | MVP |
| PS-037-10.R03 | Backups include FraudCase and FraudSignal; restore replays deletions and legal holds before serving (CTR-PRV-001 TEST-07). | MVP |
| PS-037-10.R04 | Rule rollback activates the prior `rule_version`; no retroactive change to recorded signals. Superseded signals stay. | MVP |
| PS-037-10.R05 | Restore drill runs quarterly with RPO <= 24 h and RTO <= 4 h (ASSUMPTION). | MVP |

## Data / schema
Export file: JSON, `schema_version` 1, PSEUDONYMOUS class; no `device_key_hash`.

## Commands / queries / events
Export runs via F10 subject-access workflow; emits `fraud.export_generated` with counts only.

## States & transitions
Rule version states: ACTIVE, PRIOR, RETIRED. Rollback moves one ACTIVE to PRIOR and one PRIOR to ACTIVE.

## Validation & errors
`FRAUD.EXPORT_SCOPE` if requested data includes another account.

## Authorization
Export: the account holder (`fraud.read_own_outcome`). Restore: operator with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export is idempotent per request ID. Restore is blocked while a retention job is running.

## Privacy, retention, abuse
Exports and backups follow PS-037-07 retention; backups expire with their class maximum.

## Observability & budgets
Restore drill duration logged; export p95 <= 30 s for a 10 MB export.

## Tests
- TEST-PS-037-10-01 (export): export contains requester data only; no device hashes.
- TEST-PS-037-10-02 (restore): backup restore replays a deletion before serving.
- TEST-PS-037-10-03 (rollback): rule rollback leaves existing signals unchanged.

## Acceptance criteria
1. Export contains no other account data in the fixture corpus.
2. Restore drill meets RPO and RTO.
3. Rollback changes only the active rule version.

## Assumptions & open decisions
- ASSUMPTION: RPO 24 h and RTO 4 h are planning targets.
- PROVISIONAL (D01 default, unapproved): no federated fraud import.
- PROVISIONAL (D07 default, unapproved): backup retention per class.
