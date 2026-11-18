# PS-102-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001 (R08), CTR-PRV-001 (R07, R11, R12).

**Decision labels:** Recovery mail sent without a session is PROVISIONAL (D10 default, unapproved). Security review of recovery paths: OPEN (S3-01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-05.R01 | Capabilities: `eml.create` (bind), `eml.update` (verify), `eml.delete` (remove), `eml.read` (status), `eml.send` (system). | MVP |
| PS-102-05.R02 | Users act on their own binding only (`self` scope). Request-body `account_ref` is ignored. | MVP |
| PS-102-05.R03 | Sending requires a `sys_` principal with `global` scope limited to template catalog. | MVP |
| PS-102-05.R04 | Moderators and operators have no read access to addresses. Moderation notices contain no address. | MVP |
| PS-102-05.R05 | Support cannot read or change the binding (CTR-CAP-001 R12). | MVP |
| PS-102-05.R06 | Email-based recovery never grants a capability that skips proof requirements (S3-01). Verifying an address alone does not reset credentials. | MVP |
| PS-102-05.R07 | Webhook principal is a `sys_` identity whose only capability is `eml.webhook_ingest`. | MVP |

## Data / schema
Grant fields used: `grant_id`, `principal_ref`, `capability`, `scope`, `expires_at`. Owner: F16.S01.M01.

## Commands / queries / events
| Operation | Capability | Principal | Scope |
|---|---|---|---|
| `eml.bind`, `eml.verify`, `eml.remove`, `eml.status` | `eml.create`, `eml.update`, `eml.delete`, `eml.read` | `acc_` | `self` |
| `eml.send` | `eml.send` | `sys_` | `global`, template-limited |
| `eml.webhook_ingest` | `eml.webhook_ingest` | `sys_` (provider) | `global` |

## States & transitions
Authorization precedes every transition (PS-102-03).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| SYS.NOT_FOUND | false | not_found / 404 | Non-owner access to a binding |
| SYS.UNAUTHORIZED | false | auth / 401 | Webhook signature missing or invalid |
| CAP.SCOPE_INVALID | false | validation / 400 | Scope not allowed for capability |

## Authorization
Default deny. Relation rule: owner of `acc_`. Revocation is effective next decision; cache TTL zero for `eml.update` and `eml.delete`.

## Failure, idempotency, concurrency, offline
Capability check runs before idempotency lookup to avoid oracle responses. Details: PS-102-06.

## Privacy, retention, abuse
Every privileged send emits an `aud_` record with template ID and decision ID, no address (CTR-CAP-001 R08). Webhook secrets rotate every 90 days (ASSUMPTION).

## Observability and budgets
Count of denied `eml.read` attempts per account; alert on bursts (PS-102-08).

## Tests
- TEST-PS-102-12 (integration): account B reads account A's binding → `SYS.NOT_FOUND`, body identical to nonexistent ID.
- TEST-PS-102-13 (integration): support principal attempts `eml.read` on any binding → denied.
- TEST-PS-102-14 (negative): verify on binding with recovery token does not change credentials.

## Acceptance criteria
1. Capability IDs registered in CTR-CAP-001 vocabulary.
2. Access tests for owner, non-owner, support, moderator and system pass.
3. No path sends an address to a non-owner principal.

## Assumptions & open decisions
- ASSUMPTION: system sending principal is distinct from webhook principal.
- D10 (PROVISIONAL, unapproved).
