# PS-102-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02 revision, R08 immutability), CTR-CAP-001 (R09), CTR-PRV-001 (R06, R07).

**Decision labels:** 30-minute verification TTL and 72-hour send expiry are PROVISIONAL (D10 and D07 defaults, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-03.R01 | Binding states: `UNVERIFIED`, `PENDING_VERIFY`, `VERIFIED`, `SUPPRESSED`, `REMOVED`. Only `VERIFIED` receives account and security mail. | MVP |
| PS-102-03.R02 | Delivery states: `QUEUED`, `SENT`, `DELIVERED`, `RETRY_WAIT`, `BOUNCED_HARD`, `BOUNCED_SOFT`, `COMPLAINED`, `EXPIRED`. | MVP |
| PS-102-03.R03 | `DELIVERED` is provider-reported acceptance at recipient server. It does not prove the user read or received the message. | MVP |
| PS-102-03.R04 | A `QUEUED` message expires after 72 hours without a `SENT` transition. | MVP |
| PS-102-03.R05 | Hard bounce or complaint moves the binding to `SUPPRESSED` for all non-security categories. | MVP |

## Data / schema
Binding `state` and `bounce_state` per PS-102-01. Delivery `status` closed enum (R02). Revision per aggregate (CTR-EVT-001 R02).

## Commands / queries / events
Transitions are triggered by `eml.bind`, `eml.verify`, `eml.remove`, `eml.send` and provider webhook `eml.webhook_ingest` (PS-102-04).

## States & transitions
Binding:
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `eml.bind` | address valid, under limit | PENDING_VERIFY | send verification (category `account_security`); emit `email_address.bound` |
| PENDING_VERIFY | `eml.verify` | token valid, unused, unexpired | VERIFIED | mark token used; emit `email_address.verified` |
| PENDING_VERIFY | TTL elapsed | now > expires_at | UNVERIFIED | emit nothing; token invalid |
| VERIFIED | hard bounce / complaint | — | SUPPRESSED | emit `email_delivery.suppressed` |
| VERIFIED, SUPPRESSED | `eml.remove` | owner or deletion | REMOVED | erase ciphertext; emit `email_address.removed` |

Delivery:
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `eml.send` | binding VERIFIED or security category | QUEUED | create `dlv_` |
| QUEUED | provider accepts | — | SENT | emit `email_delivery.sent` |
| SENT | webhook delivered | — | DELIVERED | record time |
| SENT | soft bounce | attempt < 5 | RETRY_WAIT | schedule retry |
| RETRY_WAIT | timer | — | QUEUED | increment attempt |
| SENT | hard bounce | — | BOUNCED_HARD | binding SUPPRESSED; emit `email_delivery.bounced` |
| QUEUED | 72 h elapsed | — | EXPIRED | emit `email_delivery.expired` |

## Validation & errors
Invalid transitions: `EVT.REVISION_CONFLICT` (stale), `SYS.CONFLICT` (409) otherwise.

## Authorization
Actor rules are in PS-102-05.

## Failure, idempotency, concurrency, offline
Retries and locks: PS-102-06. Offline: not applicable (server-side sending only).

## Privacy, retention, abuse
REMOVED erases ciphertext within 24 hours (CTR-PRV-001 R06). Deletion of the account triggers REMOVED.

## Observability and budgets
Transition counts per state; queue age metric (PS-102-08).

## Tests
- TEST-PS-102-06 (unit): every binding transition in the table.
- TEST-PS-102-07 (integration): soft bounce ×5 leads to BOUNCED_SOFT terminal state with no further sends.
- TEST-PS-102-08 (integration): PENDING_VERIFY after 30 min yields UNVERIFIED; verify then returns `EMAIL.VERIFICATION_EXPIRED`.

## Acceptance criteria
1. Transition table has one test per row.
2. No path sends non-security mail to SUPPRESSED or REMOVED bindings.
3. UI copy never says "delivered" to mean "read" (PS-102-08 wording check).

## Assumptions & open decisions
- ASSUMPTION: provider webhooks are delivered at least once and may be late by up to 10 minutes.
- D10 and D07 defaults (PROVISIONAL, unapproved).
