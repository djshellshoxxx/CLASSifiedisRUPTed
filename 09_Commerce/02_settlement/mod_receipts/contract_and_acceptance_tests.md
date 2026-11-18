# PS-071-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (claim_hash, evidence), CTR-SCH-001 (R09), CTR-EVT-001, CTR-ERR-001. **Decisions:** D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-09.R01 | At least 50 JCS and SHA-256 golden vectors pass in two independent implementations. | MVP |
| PS-071-09.R02 | Contract tests for `evidence_item` and bundle schemas against CTR-SCH-001 rules. | MVP |
| PS-071-09.R03 | Every RECEIPT.* code is covered by one contract test. | MVP |
| PS-071-09.R04 | Accessibility: evidence upload flow passes WCAG 2.1 AA; file-picker alternatives exist. | MVP |

## Data / schema
Fixtures: claim bodies, evidence images with EXIF (GPS, device), PDF, plain text note.

## Commands / queries / events
Replay of upload and redact sequences.

## States & transitions
Shared with PS-071-03.

## Validation & errors
Shared with PS-071-02.

## Authorization
Shared with PS-071-05.

## Failure, idempotency, concurrency, offline
Shared with PS-071-06.

## Privacy, retention, abuse
Shared with PS-071-07.

## Observability & budgets
Shared with PS-071-08.

## Tests
- TEST-PS-071-09-01 (golden): JCS golden vectors.
- TEST-PS-071-09-02 (contract): bundle export verifies with independent verifier.
- TEST-PS-071-09-03 (e2e): upload, attest, export, verify signatures.
- TEST-PS-071-09-04 (a11y): upload flow audit.

## Acceptance criteria
1. Golden vectors pass in two implementations.
2. All PS-071 requirement IDs map to a test ID.
3. E2E export verification passes.

## Assumptions & open decisions
- ASSUMPTION: signing algorithm Ed25519 per CTR-COM-001 R14.
- D06 (PROVISIONAL, unapproved).
