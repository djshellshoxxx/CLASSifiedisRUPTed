# PS-106-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-05.R01 | Owner can read, mark read, archive and set preferences on own items (`notification.read`, `notification.update`, `inbox_preference.update`; scope self). | MVP |
| PS-106-05.R02 | `sys_` may `notification.create` projections and `notification.delete` pruned items under global scope with purpose `inbox_maintenance`. | MVP |
| PS-106-05.R03 | Inbox content is never readable by `ope_`, `mod_` or `fpr_` (PSEUDONYMOUS, but personal activity). | MVP |
| PS-106-05.R04 | Foreign IDs return `SYS.NOT_FOUND`. | MVP |

## Data / schema
| Principal | Capability | Scope | Outcome |
|---|---|---|---|
| user (owner) | `notification.read` | self | ALLOW (ALLOW_OWNER) |
| user (owner) | `inbox_preference.update` | self | ALLOW |
| user (other) | `notification.update` | foreign | DENY → SYS.NOT_FOUND |
| sys | `notification.create` | global | ALLOW (grant) |
| ope | `notification.read` | any | DENY (NO_GRANT; no inbox grant type exists) |
| mod | `notification.read` | case | DENY unless the case concerns the account and grant purpose is `abuse_review`, which still excludes inbox content |
| fpr | any | any | DENY (inbox never federates) |

## Commands / queries / events
Maintenance grant use recorded per batch (`aud_` with counts).

## States & transitions
Grant lifecycle only.

## Validation & errors
Standard CTR-CAP-001 denial codes.

## Authorization
Server-side on every call.

## Failure, idempotency, concurrency, offline
Revocation effective next decision.

## Privacy, retention, abuse
Decision records hold outcome only (RET-AUD 12 months).

## Observability & budgets
Counter `inbox_decisions_total{capability,outcome}`.

## Tests
- TEST-PS-106-05-01 (unit): owner reads own item; other owner gets NOT_FOUND.
- TEST-PS-106-05-02 (integration): moderator with abuse grant cannot read inbox items.
- TEST-PS-106-05-03 (unit): maintenance grant expired denies prune with GRANT_EXPIRED.
- TEST-PS-106-05-04 (contract): federated peer cannot create inbox items.

## Acceptance criteria
1. Capability matrix matches tests.
2. No moderator path reads inbox content.
3. Maintenance runs carry `aud_` records.

## Assumptions & open decisions
- ASSUMPTION: no inbox-read grant type is added in MVP.
- Privacy default: D07 PROVISIONAL (D07 default, unapproved).
