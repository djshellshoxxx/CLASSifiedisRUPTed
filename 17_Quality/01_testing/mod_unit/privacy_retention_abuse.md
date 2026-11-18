# PS-137-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-07.R01 | Unit fixtures use synthetic values only; a fixture linter rejects real-looking emails, phone numbers and street addresses (0 hits allowed) | MVP |
| PS-137-07.R02 | Test logs and coverage artifacts exclude fixture payloads; redaction pattern list is versioned | MVP |
| PS-137-07.R03 | Location-like fixtures use coordinates inside a reserved test region at coarse precision only (no more precise than 0.1 degree) | MVP |
| PS-137-07.R04 | Quarantine reasons and tracking notes contain no personal data (checked by PS-137-02 rule) | MVP |

## Data / schema
Data class for all manifest fields: public-engineering (CTR-PRV-001). Fixture manifest annotation: `fixture_class: synthetic`.

## Commands / queries / events
No new commands. Redaction applies to `unit.RunFailed` payloads and `unit.RecordCoverage` artifacts.

## States & transitions
Not applicable.

## Validation & errors
`UNIT.FIXTURE_NOT_SYNTHETIC` (non-retryable): fixture linter failure. Diagnostic: file path and rule ID only, never matched value.

## Authorization
Linter config changes need QA Lead approval (PS-137-05).

## Failure, idempotency, concurrency, offline
Linter failure blocks the run; it does not silently skip the file.

## Privacy, retention, abuse
- Retention: coverage snapshots 180 days; quarantine records 1 year for audit; manifest history follows git history (PROVISIONAL, D07 default, unapproved).
- Abuse: adding real user data to fixtures to reproduce a bug. Control: linter plus review rule that bug reproductions use synthetic equivalents.
- No security audit has been performed on the linter; its rules are a best-effort control (ASSUMPTION).

## Observability & budgets
Count of redaction hits per run; target 0 in main branch. Linter runtime <= 20 s per 1,000 files (ASSUMPTION).

## Tests
- TEST-PS-137-07-01 (unit): linter flags synthetic-looking but real-format email as violation.
- TEST-PS-137-07-02 (unit): redaction removes a planted fixture value from a sample failure log.
- TEST-PS-137-07-03 (unit): coordinate fixture beyond 0.1 degree precision rejected.

## Acceptance criteria
1. Linter rule set versioned and referenced in SPEC.
2. Redaction tests pass on sample logs containing planted values.
3. No fixture file in the repository matches the personal-data patterns.

## Assumptions & open decisions
- ASSUMPTION: pattern-based linting is a partial control; it does not prove absence of personal data.
- D05 PROVISIONAL (D05 default, unapproved): coarse public regions are the only precision allowed in test fixtures.
- D07 PROVISIONAL (D07 default, unapproved): retention periods above.
