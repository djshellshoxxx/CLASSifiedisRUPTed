# PS-104-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-05.R01 | Subscription actions are evaluated against `acc_` only (CTR-CAP-001 R02). A `prf_` view cannot register or revoke. | MVP |
| PS-104-05.R02 | A user may create, read and withdraw only subscriptions where `account_id` equals the authenticated `acc_`. | MVP |
| PS-104-05.R03 | `sys_` dispatcher holds a `push_attempt.execute` grant with `global` scope, purpose `notification_dispatch`, expiry ≤ 72 h (CTR-CAP-001 R06). | MVP |
| PS-104-05.R04 | No `ope_` or `mod_` principal can read `endpoint`, `p256dh` or `auth`, with or without grant (CTR-CAP-001 R12). | MVP |
| PS-104-05.R05 | Cross-account reads return `SYS.NOT_FOUND`, identical to nonexistent IDs (CTR-ERR-001 R08). | MVP |

## Data / schema
Capability IDs use `<resource_type>.<verb>` (CTR-CAP-001 R03).

| Principal | Capability | Resource scope | Outcome |
|---|---|---|---|
| user | `push_subscription.create` | self | ALLOW (rule: owner) |
| user | `push_subscription.read` | self | ALLOW (rule: owner) |
| user | `push_subscription.withdraw` | self | ALLOW (rule: owner) |
| user (other account) | `push_subscription.read` | foreign `psb_` | DENY → SYS.NOT_FOUND |
| sys | `push_attempt.execute` | global | ALLOW (grant, dec_ recorded) |
| sys | `push_subscription.read` | global | DENY (not granted; dispatch reads endpoint through an internal path only) |
| ope | `push_subscription.read` | any | DENY → SYS.NOT_FOUND (R04) |
| mod | `push_attempt.read` | case | DENY unless case grant with purpose `abuse_review` |

Field visibility (CTR-CAP-001 R10): `endpoint`, `p256dh`, `auth` = `never` for all principals except the dispatcher internal path.

## Commands / queries / events
Each grant, revoke and privileged dispatcher run emits an `aud_` record and a CTR-EVT-001 event (CTR-CAP-001 R08).

## States & transitions
Not applicable beyond grant lifecycle (`active`, `revoked`, `expired`).

## Validation & errors
Denials use `SYS.FORBIDDEN` for visible resources and `SYS.NOT_FOUND` otherwise. Decision `reason_code` values: `ALLOW_OWNER`, `NO_RELATION`, `GRANT_EXPIRED`.

## Authorization
Server-side on every command, query and dispatch. Request body fields `account_id` are ignored for authorization (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Grant revocation is effective at next decision; dispatcher decision cache TTL is zero for this capability (CTR-CAP-001 R09).

## Privacy, retention, abuse
Dispatch decision records (`dec_`) store outcome and reason only. Retention RET-AUD 12 months.

## Observability & budgets
Counter `push_decisions_total{capability,outcome}`. Decision p95 ≤ 10 ms.

## Tests
- TEST-PS-104-05-01 (unit): user cannot read another account's subscription; response equals nonexistent-ID response.
- TEST-PS-104-05-02 (integration): `ope_` read of `endpoint` is denied in every fixture.
- TEST-PS-104-05-03 (unit): expired `push_attempt.execute` grant denies dispatch with `GRANT_EXPIRED`.
- TEST-PS-104-05-04 (integration): `prf_` identifier cannot register a subscription.

## Acceptance criteria
1. Capability matrix matches the table above in code tests.
2. Zero operator or moderator paths expose key material.
3. Every dispatcher run has a live `dec_` record.

## Assumptions & open decisions
- ASSUMPTION: dispatcher grant purpose string `notification_dispatch` is registered with F16.
- Support-operator access to subscriptions is denied by design (no D-ID).
- Privacy default for audit retention: D07 default, PROVISIONAL (D07 default, unapproved).
