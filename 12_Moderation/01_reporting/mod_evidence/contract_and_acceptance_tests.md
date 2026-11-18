# PS-093-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-09.R01 | Every row in PS-093-02 to PS-093-08 maps to at least one test ID. | MVP |
| PS-093-09.R02 | Negative and abuse tests are mandatory for every command. | MVP |
| PS-093-09.R03 | Contract tests run against CTR-SCH-001 schema 1.0.0 in CI. | MVP |

## Test map
| Test ID | Level | Scope |
|---|---|---|
| TEST-PS-093-01-01 | schema lint | field classes (PS-093-01) |
| TEST-PS-093-01-02 | negative | extra field, oversize item |
| TEST-PS-093-02-01 | unit | error table codes and HTTP |
| TEST-PS-093-02-02 | fixture | MIME mismatch, GPS strip |
| TEST-PS-093-02-03 | negative | scanner reject and timeout |
| TEST-PS-093-03-01 | property | random event sequences |
| TEST-PS-093-03-02 | integration | hold blocks purge |
| TEST-PS-093-03-03 | concurrency | double redaction |
| TEST-PS-093-04-01 | contract | payload schema 1.0.0 |
| TEST-PS-093-04-02 | idempotency | replay returns same ID |
| TEST-PS-093-04-03 | lint | no content in events |
| TEST-PS-093-05-01 | matrix | action matrix |
| TEST-PS-093-05-02 | negative | guessed IDs identical 404 |
| TEST-PS-093-05-03 | privileged | expired grant denied |
| TEST-PS-093-06-01 | fault injection | scanner outage |
| TEST-PS-093-06-02 | offline | queue survives restart |
| TEST-PS-093-06-03 | restore | purge replay before read |
| TEST-PS-093-07-01 | privacy fixture | PII absence |
| TEST-PS-093-07-02 | retention | purge within 24 h |
| TEST-PS-093-07-03 | relation | no third-party capture |
| TEST-PS-093-08-01 | log capture | no content in logs |
| TEST-PS-093-08-02 | alert | outage alert ≤ 5 min |
| TEST-PS-093-08-03 | load | p95 budgets |
| TEST-PS-093-10-01 | export | legal-process bundle manifest |
| TEST-PS-093-10-02 | backup | restore replays redaction |

Accessibility: capture flow and receipt screens pass WCAG 2.1 AA checks (F14), test ID TEST-PS-093-09-01 (a11y).

## Acceptance criteria
1. All test IDs above pass in CI before implementation sign-off (future phase).
2. Negative and privacy tests have zero failures across fixture corpus.

## Assumptions & open decisions
- ASSUMPTION: fixture corpus includes synthetic PII only; no real user data.
- OPEN: F14 accessibility review scope.
