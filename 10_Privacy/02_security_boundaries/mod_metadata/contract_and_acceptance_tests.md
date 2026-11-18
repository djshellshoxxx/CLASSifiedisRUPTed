# PS-080-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10; QA Lead, F17). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (TEST-CTR-PRV-001-03, -09, -10), CTR-EVT-001 (R06), CTR-ERR-001, CTR-FED-001 (R12).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-09.R01 | Corpus of ≥ 50 synthetic images (JPEG, PNG, WebP) with known GPS, device, author and thumbnail tags. | MVP |
| PS-080-09.R02 | Every `META.*` code has a contract test for category, status and retryable value. | MVP |
| PS-080-09.R03 | Egress filter tests cover all seven surfaces in PS-080-01 R01. | MVP |
| PS-080-09.R04 | Log scan test uses seeded fixture coordinates and IP addresses. | MVP |
| PS-080-09.R05 | No real photographs; all corpus files synthetic. | MVP |

## Data / schema
Corpus manifest lists each file's injected tags and expected removal counts.

## Commands / queries / events
Drive sanitise and egress through the module interface.

## States & transitions
Scenarios cover PS-080-03 transitions.

## Validation & errors
Negative corpus: disguised MIME, truncated file, PDF, oversized file.

## Authorization
Tests for sys sanitiser, owner, operator and egress path.

## Failure, idempotency, concurrency, offline
Fault injection: sanitiser crash, policy store down, duplicate upload.

## Privacy, retention, abuse
Corpus stored in test repository only; no production data.

## Observability & budgets
Suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-080-09-01 (property/corpus): zero residual GPS, device or author tags across corpus.
- TEST-PS-080-09-02 (contract): all META.* codes registered.
- TEST-PS-080-09-03 (integration): push preview and federation batch contain no attachment metadata.

## Acceptance criteria
1. TEST-PS-080-09-01 to -03 pass in CI.
2. Corpus manifest matches expected counts.
3. Log scan passes.

## Assumptions & open decisions
- PENDING: sanitiser library evaluation (Prompt 3 research).
- PROVISIONAL (D05 default) for location-adjacent fixtures.
