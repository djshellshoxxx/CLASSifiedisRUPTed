# PS-107-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-05.R01 | Owner reads and writes own matrix (`notification_preference.read`, `notification_preference.update`; scope self). | MVP |
| PS-107-05.R02 | Unsubscribe token is a scoped grant: capability `notification_preference.withdraw`, scope self, constraints: single cell, purpose `unsubscribe`, `expires_at` ≤ 90 days, `max_uses` 1 (ASSUMPTION for max_uses; repeated use is idempotent). | MVP |
| PS-107-05.R03 | `sys_` may read cells under global scope with purpose `notification_gating`, expiry ≤ 72 h. | MVP |
| PS-107-05.R04 | Operators and moderators cannot change preferences. Support cannot toggle a user's channels (CTR-CAP-001 R12). | MVP |
| PS-107-05.R05 | Foreign account IDs return `SYS.NOT_FOUND`. | MVP |

## Data / schema
| Principal | Capability | Scope | Outcome |
|---|---|---|---|
| user (owner) | `notification_preference.update` | self | ALLOW (ALLOW_OWNER) |
| token holder | `notification_preference.withdraw` (cell) | self | ALLOW (ALLOW_GRANT); other cells DENY (SCOPE_MISMATCH) |
| sys | `notification_preference.read` | global | ALLOW (grant) |
| ope | `notification_preference.update` | any | DENY (NO_RELATION) |
| mod | any | case | DENY (STATE_FORBIDS: moderation does not change preferences) |

## Commands / queries / events
Token issuance and each use emit `aud_` records (no address). Grants emit events per CTR-CAP-001 R08.

## States & transitions
Grant states: active, revoked (on account deletion), expired.

## Validation & errors
Expired token → `OPT.CONFIRMATION_EXPIRED`; invalid token → `OPT.CONFIRMATION_INVALID`.

## Authorization
Token scope cannot be widened; any attempt to use it on another cell is denied and logged as a decision.

## Failure, idempotency, concurrency, offline
Revocation of account invalidates unsubscribe tokens within 60 s.

## Privacy, retention, abuse
Token hashes only; plaintext token exists only in the email link.

## Observability & budgets
Counter `opt_decisions_total{capability,outcome}`.

## Tests
- TEST-PS-107-05-01 (unit): token for `email/activity` cannot withdraw `push/deadline`.
- TEST-PS-107-05-02 (integration): support operator update attempt denied.
- TEST-PS-107-05-03 (unit): token after 90 days denied with expiry reason.
- TEST-PS-107-05-04 (integration): account deletion revokes tokens within 60 s.

## Acceptance criteria
1. Matrix matches tests.
2. No operator or moderator path changes cells.
3. Token scope never widens.

## Assumptions & open decisions
- ASSUMPTION: token lifetime 90 days.
- Consent evidence authorization stays with F10 mod_consent (canonical).
