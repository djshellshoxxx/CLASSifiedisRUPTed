# PS-119-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001 (R09), CTR-PRV-001 (R12), CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-09.R01 | Every STO.* code has a contract test. | MVP |
| PS-119-09.R02 | Upload-validation fixtures include valid, malformed, polyglot, bomb and EXIF-bearing files. | MVP |
| PS-119-09.R03 | Completion record for deletion matches CTR-PRV-001 R12 shape. | MVP |

## Data / schema
Fixture directory `fixtures/storage/` with synthetic images (generated, no real photos), polyglot samples and EXIF-bearing samples.

## Commands / queries / events
PS-119-04 routes.

## States & transitions
PS-119-03 transitions via API.

## Validation & errors
Each code asserted with status and retryable flag.

## Authorization
Fixtures per actor matrix (PS-119-05).

## Failure, idempotency, concurrency, offline
Concurrent duplicate uploads; object store fault injection.

## Privacy, retention, abuse
Fixtures are synthetic; canary filenames for leak tests.

## Observability & budgets
Suite ≤ 15 min in CI (ASSUMPTION).

## Tests
- TEST-PS-119-09-01 (contract): STO.* code table.
- TEST-PS-119-09-02 (security): polyglot, SVG, bomb fixtures refused.
- TEST-PS-119-09-03 (integration): duplicate upload race.
- TEST-PS-119-09-04 (e2e): listing photo upload, strip, scan, display; no GPS in output.
- TEST-PS-119-09-05 (accessibility): upload error messages localized via `message_key` and announced to screen readers (PWA client).

## Acceptance criteria
1. All STO.* codes covered.
2. Zero GPS tags across the e2e fixture set.
3. Race test passes 100 consecutive runs.

## Assumptions & open decisions
- ASSUMPTION: fixture generation without real user media.
- PENDING CTR-ID-001 prefix `blb_`.
