# PS-130-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-05.R01 | Only registered producer `sys_` principals may call `signature.sign` for event subjects, scoped to their own aggregate types. | MVP |
| PS-130-05.R02 | Users never obtain a signing oracle over arbitrary bytes; user-originated statements use device keys under a separate capability (PENDING D06, D10). | MVP |
| PS-130-05.R03 | `signature.verify` is open to any authenticated principal and to federation import paths (`fpr_`) for their own batches. | MVP |
| PS-130-05.R04 | `signature.get` visible to subject's owner and participants; `signer_ref` visible to `case:` scope only. | MVP |
| PS-130-05.R05 | No principal may read private key material through this module. | MVP |

## Data / schema
Capability IDs: `signature.sign`, `signature.verify`, `signature.read`.

## Commands / queries / events
Authorization is evaluated before canonicalization so that unauthorized callers cannot probe canonical errors.

## States & transitions
Revoked signing grant for a producer blocks new signs immediately (zero cache, CTR-CAP-001 R09).

## Validation & errors
| Actor | Action | Resource | Result |
|---|---|---|---|
| sys (producer of aggregate X) | signature.sign | event of X | allow |
| sys (other producer) | signature.sign | event of X | DENY, SYS.FORBIDDEN |
| user | signature.sign | arbitrary bytes | DENY, SYS.FORBIDDEN |
| fpr | signature.verify | own batch | allow |
| any authenticated | signature.verify | any subject | allow |
| participant | signature.read | own subject | allow |

## Authorization
Actor identity from authenticated principal only (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Denials recorded as `dec_` records without payload.

## Privacy, retention, abuse
Decision records hold IDs and rule names only.

## Observability & budgets
Counter `sig_authz_denied_total{actor_type}`; alert on sudden rise from one producer.

## Tests
- TEST-PS-130-05-01: unit, decision table.
- TEST-PS-130-05-02: negative, user attempts to sign raw bytes and is denied.

## Acceptance criteria
1. No user path reaches the signing function.
2. Revoked producer denied on next call.

## Assumptions & open decisions
- ASSUMPTION: producer registry maintained by F16 with F15 approval.
- D10 (user-controlled keys): PROVISIONAL (D10 default, unapproved).
