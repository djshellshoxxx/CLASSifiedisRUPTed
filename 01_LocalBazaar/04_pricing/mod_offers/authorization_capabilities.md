# PS-011-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (model, decision codes, field visibility), CTR-PRV-001 (class-based access), CTR-FED-001 (peer scope). PENDING CTR-CAP-001 relation rule `listing_visitor` for offer.create.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-05.R01 | Default deny for every `offer.*` action (CTR-CAP-001 R01). | MVP |
| PS-011-05.R02 | Capability names: offer.create, offer.read, offer.withdraw, offer.accept, offer.reject, offer.expire, offer.export. | MVP |
| PS-011-05.R03 | Buyer and seller relations are derived from the offer and the listing owner at decision time (CTR-CAP-001 R05). | MVP |
| PS-011-05.R04 | Non-visible offers return SYS.NOT_FOUND. Visible but forbidden returns SYS.FORBIDDEN. | MVP |
| PS-011-05.R05 | Operator (`ope`) access to offer content is denied without dual control (CTR-CAP-001 R07). | MVP |
| PS-011-05.R06 | Federation peers (`fpr`) have no offer capability. | MVP |
| PS-011-05.R07 | sys principal may use offer.expire only. It reads no offer content. | MVP |

## Data / schema
Decision records store principal, action, offer_id, outcome and reason code only (CTR-CAP-001 R13).

## Commands / queries / events
Each command in PS-011-04 maps to one capability below.

## States & transitions
Not applicable. Authorization is evaluated against the state at decision time (PS-011-03).

## Validation & errors
Codes: SYS.FORBIDDEN (403), SYS.NOT_FOUND (404), SYS.UNAVAILABLE (503, fail closed).

## Authorization
| Principal | Action | Resource and scope | Outcome | Reason code |
|---|---|---|---|---|
| user, not listing owner, listing visible | offer.create | listing lst_ | ALLOW | ALLOW_GRANT (PENDING relation rule) |
| user, buyer of offer | offer.read | own offer, participant | ALLOW | ALLOW_PARTICIPANT |
| user, seller of listing | offer.read | offer on own listing, participant | ALLOW | ALLOW_PARTICIPANT |
| user, unrelated | offer.read | any offer | DENY, SYS.NOT_FOUND | NO_RELATION |
| user, buyer | offer.accept | own offer | DENY, SYS.FORBIDDEN | SCOPE_MISMATCH |
| user, seller | offer.withdraw | offer on own listing | DENY, SYS.FORBIDDEN | SCOPE_MISMATCH |
| user, seller | offer.accept, offer.reject | submitted offer on own listing | ALLOW | ALLOW_PARTICIPANT |
| user, buyer | offer.withdraw | own submitted offer | ALLOW | ALLOW_PARTICIPANT |
| sys (offer timer) | offer.expire | global, expire verb only | ALLOW | ALLOW_GRANT (ASSUMPTION) |
| mod | offer.read | case scope, grant with purpose and expiry ≤ 72 h | ALLOW | ALLOW_GRANT |
| ope, single approval | offer.read | any | DENY | DUAL_APPROVAL_MISSING |
| fpr | any offer.* | any | DENY | NO_GRANT |

Field visibility (CTR-CAP-001 R10): status, expires_at, amount_minor, currency, quote_id: buyer and seller. buyer_ref: seller only. seller_ref: buyer and seller. listing_amount_minor: public. Fields without an allowing rule are omitted, not null.

## Failure, idempotency, concurrency, offline
Offline clients never decide authorization. Queued commands are re-authorized at commit (CTR-CAP-001 failure section). Revocation takes effect at next decision (R09 of CTR-CAP-001).

## Privacy, retention, abuse
Repeated denials from one principal raise a CAP alert (CTR-CAP-001 abuse section). List responses count only visible offers.

## Observability & budgets
Metrics: `offer_authz_decisions_total{action,outcome,reason_code}`. Decision p95 ≤ 5 ms (CTR-CAP-001 budget).

## Tests
- TEST-PS-011-05-01 (unit): default deny for every action with no relation or grant.
- TEST-PS-011-05-02 (matrix): each row of the Authorization table yields the stated outcome and code.
- TEST-PS-011-05-03 (negative): guessed offer IDs and cross-listing IDs return bytes identical to a missing offer.
- TEST-PS-011-05-04 (field): seller response omits fields not in the visibility list (no null placeholders).
- TEST-PS-011-05-05 (sys): offer.expire cannot read content (read attempt → SYS.FORBIDDEN).

## Acceptance criteria
1. Matrix rows pass TEST-PS-011-05-02.
2. No `ope` or `fpr` path returns offer content without an allowed grant.
3. TEST-PS-011-05-01 through -05 pass in CI.

## Assumptions & open decisions
- PENDING CTR-CAP-001: relation rule `listing_visitor` for offer.create (ALLOW_GRANT used as placeholder).
- ASSUMPTION: sys offer timer holds a standing grant limited to offer.expire.
- PROVISIONAL (D10 default, unapproved): user-controlled keys with documented recovery; buyer identity is the acc_ principal only.
