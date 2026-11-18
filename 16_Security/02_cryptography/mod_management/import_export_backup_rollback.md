# PS-129-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001, CTR-SCH-001, CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-10.R01 | Export bundle is a signed list of `crypto_policy` records in JSON-Schema 2020-12 form. | MVP |
| PS-129-10.R02 | Import accepts a bundle only with a valid signature from a trusted F16 signing key and a `policy_version` greater than the local one. | MVP |
| PS-129-10.R03 | Rollback is forward-only: a previous policy is re-issued as a new version; no record is deleted or edited. | MVP |
| PS-129-10.R04 | Backups include the policy and suite registry; restore verifies the hash chain before serving reads. | MVP |

## Data / schema
Bundle envelope per CTR-FED-001 batch rules: ≤ 100 records and ≤ 1 MiB (ASSUMPTION).

## Commands / queries / events
Import is a `sys_` job emitting `crypto_policy.imported`; export is a read.

## States & transitions
Imported records enter `scheduled` only after local approval; they never enter `active` directly.

## Validation & errors
Invalid signature: `FED.SIGNATURE_INVALID` (shared). Version not greater: `MGMT.POLICY_INVALID` with `rule = version_not_newer`.

## Authorization
Export requires `crypto_policy.read`. Import requires `sys_` with `execute`.

## Failure, idempotency, concurrency, offline
Import idempotent on (`origin_node`, `policy_id`, `policy_version`). Partial bundle import is rejected as a whole.

## Privacy, retention, abuse
Bundles contain no personal data. Export to peers uses per-audience pseudonymous approver IDs only where a peer is not trusted; ASSUMPTION.

## Observability & budgets
Counter `crypto_policy_import_rejected_total{rule}`.

## Tests
- TEST-PS-129-10-01: integration, import rejects tampered bundle.
- TEST-PS-129-10-02: restore, backup restore reproduces identical active set.
- TEST-PS-129-10-03: rollback creates new version and keeps history.

## Acceptance criteria
1. Zero destructive operations on policy records in any path.
2. Tampered bundle rejected in 100% of fixtures.
3. Restore verifies chain before first read.

## Assumptions & open decisions
- ASSUMPTION: bundle limits from CTR-FED-001.
- D01 (signed envelopes): PROVISIONAL (D01 default, unapproved). D10 (recovery): PROVISIONAL (D10 default, unapproved).
