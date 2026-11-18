# PS-128-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-10.R01 | Owner export (CTR-PRV-001 R11) includes the owner's own public key records and revocation history; no private material exists to export. | MVP |
| PS-128-10.R02 | Portability: an owner may export public keys to a new platform node; the new node re-verifies proofs and does not import trust by default (D01 PROVISIONAL). | MVP |
| PS-128-10.R03 | Backups (PS-120) contain public key records; restore keeps revocations (PS-128-06 R05). | MVP |
| PS-128-10.R04 | Rollback of a key rotation re-activates the predecessor only while it is `rotating` and not expired. | MVP |
| PS-128-10.R05 | Key records use CTR-SCH-001 versioning; old records readable through the supported window. | MVP |

## Data / schema
Export bundle: `{"owner_ref", "keys": [public records], "revocations": [...], "digest"}`; signed by the owner key when available.

## Commands / queries / events
Rollback via `key.rotate` inverse is not a command; it is an admin procedure producing `key.rotated` (ASSUMPTION).

## States & transitions
`rotating` → `active` for rollback (PS-128-03).

## Validation & errors
`KEY.PUBLIC_KEY_INVALID` on import of a malformed bundle.

## Authorization
Owner export: owner only. Admin rollback: PS-128-05 R03.

## Failure, idempotency, concurrency, offline
Export is idempotent per digest.

## Privacy, retention, abuse
Bundles contain no personal data beyond pseudonymous `owner_ref`.

## Observability & budgets
Export under 5 s for 10 keys (ASSUMPTION).

## Tests
- TEST-PS-128-10-01 (round trip): export and re-verify proofs on another node.
- TEST-PS-128-10-02 (negative): bundle containing private field refused.
- TEST-PS-128-10-03 (restore): revoked key stays revoked after restore.
- TEST-PS-128-10-04 (rollback): predecessor re-activates only within window.

## Acceptance criteria
1. Export contains no private material (TEST-02).
2. TEST-PS-128-10-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D01 default, unapproved). OPEN (D10): portability of user-controlled keys.
