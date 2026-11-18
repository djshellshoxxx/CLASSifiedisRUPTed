# PS-111-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-07.R01 | Test evidence uses synthetic listings and accounts only; no real user screenshots. | MVP |
| PS-111-07.R02 | Evidence artifacts are stored by digest in a restricted QA store; no public access. | MVP |
| PS-111-07.R03 | Findings never quote user-entered text. | MVP |

## Data / schema
PUBLIC records; evidence artifacts are QA-internal.

## Commands / queries / events
None beyond PS-111-04.

## States & transitions
Not applicable.

## Validation & errors
Screenshot scan in CI rejects images containing non-synthetic data (tool PENDING research).

## Authorization
Evidence store read: QA and Accessibility roles.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Evidence retained 24 months (ASSUMPTION) then deleted; records kept indefinitely as PUBLIC. Abuse: fabricated evidence is detectable by digest mismatch against CI artifact logs.

## Observability & budgets
Not applicable.

## Tests
- TEST-PS-111-07-01 static: evidence fixtures contain only synthetic data.
- TEST-PS-111-07-02 integration: evidence digest mismatch rejects record.

## Acceptance criteria
1. No real user data in any evidence artifact in the test corpus.
2. Digest mismatch is refused in 100% of tests.

## Assumptions & open decisions
- ASSUMPTION: 24-month evidence retention.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
