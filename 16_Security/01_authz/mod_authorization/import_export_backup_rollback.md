# PS-126-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (versioning), CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-10.R01 | Policy bundles carry `policy_version`, `rules_hash` and approvals; import verifies the hash before activation. | MVP |
| PS-126-10.R02 | Policy rollback publishes a new version whose rules equal a prior version; history is not rewritten. | MVP |
| PS-126-10.R03 | Grants are not exported in operator backups except as encrypted, hashed records under RET-SEC rules. | MVP |
| PS-126-10.R04 | Vocabulary removal or rename is MAJOR and requires a grant re-map migration (CTR-CAP-001 Versioning). | MVP |
| PS-126-10.R05 | Restore drill recovers grant and policy tables within RPO 1 h (ASSUMPTION). | MVP |

## Data / schema
Policy bundle: `manifest.json` (version, rules_hash, approvals), `rules.json`, `purposes.json` (pinned purpose registry version). Format UTF-8 JSON; signed with a `sys_` key from [mod_key](../../02_cryptography/mod_key/SPEC.md) (ASSUMPTION).

## Commands / queries / events
- `policy.export(version)` → bundle.
- `policy.import(bundle)` → draft, never published automatically.
- `policy.rollback(to_version)` → as in PS-126-04.

## States & transitions
Import creates `draft`; publish requires dual approval (PS-126-03).

## Validation & errors
| Code | Retryable | Trigger |
|---|---|---|
| AUTHZ.BUNDLE_HASH_MISMATCH | false | Hash differs from manifest. |
| AUTHZ.BUNDLE_SIGNATURE_INVALID | false | Signature check fails. |
| AUTHZ.VOCABULARY_MIGRATION_REQUIRED | false | Capability removed without re-map. |

## Authorization
Export and import require `pol.administer`. Backup restore requires two `ope` approvers.

## Failure, idempotency, concurrency, offline
Import is idempotent by `rules_hash`. Restore is performed into a staging store and promoted only after integrity checks.

## Privacy, retention, abuse
Operator backups hold grant records with purposes but no object content; backups retained per RET-OPS/RET-AUD. Restored grants with expiry in the past are marked expired, not reactivated.

## Observability & budgets
`authz_restore_drill_result{outcome}`; bundle import duration p95 ≤ 30 s (ASSUMPTION).

## Tests
- TEST-PS-126-10-01 (round trip): export, import into staging, identical `rules_hash`.
- TEST-PS-126-10-02 (negative): one changed byte in `rules.json` → AUTHZ.BUNDLE_HASH_MISMATCH.
- TEST-PS-126-10-03 (restore): grant expired before backup point is not active after restore.
- TEST-PS-126-10-04 (migration): removed capability without re-map fails the release gate.

## Acceptance criteria
1. Round trip produces identical decisions on the matrix fixture.
2. No restored grant is active after its `expires_at`.
3. Rollback leaves prior versions byte-identical.

## Assumptions & open decisions
- ASSUMPTION: bundle signing with a `sys_` key; RPO 1 h.
- PROVISIONAL (D10 default, unapproved): key-based signing with documented rotation via mod_management.
