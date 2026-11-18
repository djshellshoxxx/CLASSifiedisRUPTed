# PS-085-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R05 signing input), CTR-FED-001 (verification order, R04, R06, R09), CTR-SCH-001 (R09 golden fixtures), CTR-ERR-001 (R03 retryable), CTR-PRV-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-09.R01 | At least 10 golden vectors are committed with the implementation: valid; tampered payload; wrong prefix version; key revoked; key compromised at boundary −1 ms and at boundary; unknown `key_id`; origin mismatch; non-canonical base64url; malleated scalar; not-yet-valid key. Each has an expected code or result. | MVP |
| PS-085-09.R02 | Signing input bytes for each vector equal the golden bytes from two independent implementations (ASSUMPTION: second implementation in test harness only). | MVP |
| PS-085-09.R03 | Each step 1–13 of CTR-FED-001 verification order has at least one failing fixture that returns the documented code. | MVP |
| PS-085-09.R04 | Tests run in CI on every change to the signing path. No test in this list may be skipped or marked expected-fail at release. | MVP |
| PS-085-09.R05 | No copies of foreign schemas. Contract tests reference CTR IDs only (PS-089-09 R05 pattern). | MVP |

## Data / schema
Fixtures are stored with the implementation (future prompt). Each fixture file records: vector ID, input envelope, key row, expected result, expected code, source contract clause.

## Commands / queries / events
Tests exercise `signing.sign_event`, `signing.verify_event`, `key.lookup` (PS-085-04) and the batch path in `fed.receive_batch` (CTR-FED-001).

## Validation & errors
Every error code in PS-085-02 has one fixture. Unlisted codes fail the build.

## Authorization
Test principals are `sys_` and `fpr_` fixtures only. No operator principal is used in contract tests.

## Failure, idempotency, concurrency, offline
Fault injection: sign timeout, key cache stale, KMS unavailable. Expected behavior per PS-085-06.

## Privacy, retention, abuse
Test fixtures use synthetic keys only. No real node keys are committed.

## Observability & budgets
Test run time budget: full signature suite ≤ 3 min on CI runner (ASSUMPTION).

## Tests
- TEST-PS-085-09-01 (contract): golden signing-input bytes for all vectors (R01, R02).
- TEST-PS-085-09-02 (integration): one failing fixture per CTR-FED-001 step 1–13 (R03).
- TEST-PS-085-09-03 (contract): compromise boundary vectors match CTR-FED-001 R09.
- TEST-PS-085-09-04 (property): JCS-equivalent envelopes (key order, whitespace) yield identical signing input.
- TEST-PS-085-09-05 (abuse): replay after `expires_at`; tampered payload; malleated scalar.
- TEST-PS-085-09-06 (negative): private key bytes absent from every response, log and export in the suite.

## Acceptance criteria
1. All ten golden vectors pass with two implementations; TEST-PS-085-09-01 passes.
2. Each verification step has a failing fixture; TEST-PS-085-09-02 passes.
3. No private key material appears anywhere; TEST-PS-085-09-06 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: second independent implementation available for cross-check (F16 to confirm).
- PROVISIONAL (D01 default, unapproved): wire rules as in CTR-FED-001.
- PENDING CTR-SCH-001: fixture schema ID.
