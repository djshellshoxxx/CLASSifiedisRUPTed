# PS-136-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ID-001, CTR-COM-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-07.R01 | Generators produce synthetic values only; no value derived from a production dataset. | MVP |
| PS-136-07.R02 | Generated coordinates are from registered test cells (CTR-PRV-001 R04 cell set) and never precise. | MVP |
| PS-136-07.R03 | Counterexamples retained 180 days, then deleted. | MVP |
| PS-136-07.R04 | Generated IDs carry test prefixes or synthetic bodies; they cannot be confused with production IDs (lint). | MVP |

## Data / schema
See [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events carry no generated content.

## States & transitions
N/A.

## Validation & errors
Lint per [validation_rules.md](validation_rules.md).

## Authorization
Counterexample read per PS-136-05.R03.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
- Property generators can accidentally emit real-looking identifiers; lint flags values matching production ID format with non-test marker.
- Exhaustive generation must not write logs containing values beyond counterexample files.

## Observability & budgets
Logs record seeds and IDs only.

## Tests
- TEST-PS-136-07-01: lint, generator emitting an email-like value is blocked.
- TEST-PS-136-07-02: retention, counterexample deleted at 180 days in test clock.

## Acceptance criteria
1. Zero production-looking identifiers in generator output in 100,000-case nightly run.
2. Retention deletion verified.

## Assumptions & open decisions
- ASSUMPTION: test cell set from F10 registry.
- D05 (coarse geo cells): PROVISIONAL (D05 default, unapproved).
