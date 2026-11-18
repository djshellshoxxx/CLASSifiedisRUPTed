# PS-130-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001, CTR-SCH-001, CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-10.R01 | Exported signed envelopes keep original signature bytes; re-signing an exported envelope is forbidden. | MVP |
| PS-130-10.R02 | Import verifies signature before dedupe storage, after size checks (CTR-FED-001 R10). | MVP |
| PS-130-10.R03 | Algorithm rollback is forward-only: a new algorithm is added as MINOR; old algorithm remains verify-only until retired. | MVP |
| PS-130-10.R04 | Backups include `signature_record` and verification results; key material is excluded (held by `mod_key`). | MVP |

## Data / schema
Bundle of signed subjects per CTR-FED-001 batch rules.

## Commands / queries / events
Import is a `fpr_`-initiated verify; no state written for invalid entries except the rejection record.

## States & transitions
Retired algorithm: verify returns `invalid` with reason `algorithm_retired`.

## Validation & errors
`FED.SIGNATURE_INVALID` returned per event result in the batch acknowledgement (CTR-FED-001).

## Authorization
Export requires `signature.read`; import requires `signature.verify` for the peer.

## Failure, idempotency, concurrency, offline
Restore recomputes digests for a random 1% sample and fails the restore on any mismatch (ASSUMPTION).

## Privacy, retention, abuse
Export to peers omits `signer_ref` unless the subject is public (CTR-FED-001 R08).

## Observability & budgets
Counter `sig_import_rejected_total{reason}`.

## Tests
- TEST-PS-130-10-01: integration, tampered import rejected.
- TEST-PS-130-10-02: restore, digest sample passes.
- TEST-PS-130-10-03: rollback, retired algorithm verify-only.

## Acceptance criteria
1. Zero re-signed exports in fixture run.
2. Restore sample check runs on every restore.

## Assumptions & open decisions
- ASSUMPTION: 1% digest sample.
- D01 (signed envelopes) and D10 (key recovery, key material excluded): PROVISIONAL (default, unapproved).
