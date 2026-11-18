# PS-009-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, R09), CTR-FED-001 (R02), CTR-EVT-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-07.R01 | All variant fields are class PUBLIC (PS-009-01.R07). Lint fails the build if a field without a class is added. | MVP |
| PS-009-07.R02 | Label values pass the PII pattern check (PS-009-02.R03) before storage. | MVP |
| PS-009-07.R03 | Variant rows follow listing retention class RET-ACC (account lifetime + 30 days grace). | MVP |
| PS-009-07.R04 | Listing deletion removes variant rows and replicas within 24 h (CTR-PRV-001 R06). | MVP |
| PS-009-07.R05 | Variants federate only when their listing federates (PUBLIC items, CTR-FED-001 R02). | Future |
| PS-009-07.R06 | Abuse: ≤ 30 variant writes per account per minute (ASSUMPTION); ≥ 5 near-duplicate labels in one listing raise a signal to F12. | MVP |

## Data / schema
Classes per field: all PUBLIC. No LOCATION fields. `aud_` records hold only IDs and counts.

## Commands / queries / events
Events are PUBLIC and carry no account names (CTR-EVT-001 R06).

## States & transitions
Archive removes the variant from public reads at once; the row remains for owner history (RET-ACC).

## Validation & errors
PII-pattern rejection uses `VARIANT.VALUE_INVALID` with rule `pii_pattern`; the value is never echoed.

## Authorization
Owner-only writes; see PS-009-05.

## Failure, idempotency, concurrency, offline
Deletion is retried until confirmed; a deletion record (`aud_`, counts only) is written (CTR-PRV-001 R12).

## Privacy, retention, abuse
- Threats: personal data hidden in labels; spam by many variants; scraping of variant lists. Controls: PII check, cap of 25, rate limit, listing-level read rules.
- Pseudonymity: the `acc_` on the listing is not a real identity; labels must not add one.

## Observability & budgets
No label values in metrics or logs.

## Tests
- TEST-PS-009-07-01 (negative): email, phone and URL labels rejected; false-positive set reviewed by F10.
- TEST-PS-009-07-02 (integration): listing deletion removes variants within 24 h in a simulated run.
- TEST-PS-009-07-03 (abuse): 31st write in one minute rate-limited.

## Acceptance criteria
1. No variant field is unclassified (lint passes).
2. PII heuristic false-negative rate is reported to F10 with a fixture set; no target is claimed as met.
3. Deletion completes within 24 h in 100% of simulated runs.

## Assumptions & open decisions
- ASSUMPTION: PII heuristic is a signal; it does not prove absence of personal data.
- PROVISIONAL (D07 default, unapproved): minimal retention with legal-hold exceptions (CTR-PRV-001 R07).
