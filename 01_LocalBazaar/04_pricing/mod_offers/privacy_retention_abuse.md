# PS-011-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention, disclosure matrix), CTR-FED-001 (no federation), CTR-ERR-001 (rate-limit codes), CTR-EVT-001 (redaction), CTR-CAP-001 (decision logs).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-07.R01 | Offer price, currency, status and expiry are PRIVATE_PERSONAL. Buyer and seller refs are PSEUDONYMOUS. No offer field is LOCATION_PRECISE. | MVP |
| PS-011-07.R02 | Offer data never appears in public listing payloads, search or ranking inputs, federation batches, push previews, analytics or logs. | MVP |
| PS-011-07.R03 | Terminal offers keep content for 90 days after terminal_at (ASSUMPTION; shorter than RET-PRIV default). Audit records (IDs, codes, timestamps) keep 12 months (RET-AUD). | MVP |
| PS-011-07.R04 | On buyer account deletion, buyer_ref is replaced by a tombstone within 24 h. Seller keeps amount and status. | MVP |
| PS-011-07.R05 | Legal holds apply only by cas_ scope (CTR-PRV-001 R07). Held offers are excluded from purge. | MVP |
| PS-011-07.R06 | Max 20 offer.submit per acc_ per 24 h (ASSUMPTION). Excess → SYS.RATE_LIMITED with retry_after_ms. | MVP |
| PS-011-07.R07 | Public listing shows no offer data. Seller sees count and offers on own listing only. | MVP |
| PS-011-07.R08 | Blocked pairs cannot submit, read or be read; responses are uniform (SYS.NOT_FOUND). | MVP |
| PS-011-07.R09 | Owner export includes own offers. Counterparty amounts and refs are redacted (CTR-PRV-001 R11). | MVP |
| PS-011-07.R10 | Logs and metrics carry offer_id and codes only. Never amounts, currency, buyer_ref or seller_ref. | MVP |
| PS-011-07.R11 | Offer data must not feed ranking (F06 relevance). Enforced by a deny-list test. | MVP |

## Data / schema
Data classes per field are in PS-011-01. No free-text, contact, location or device field exists, so no PII enters offer records (CTR-EVT-001 R06).

## Commands / queries / events
Events are local-only: never federated and never in push previews (CTR-PRV-001 disclosure matrix). Notification text is generic ("New offer on your listing").

## States & transitions
Retention lifecycle: active → expired (terminal_at + 90 days or deletion) → purged within 24 h (replicas, caches, exports); backups per schedule with replay on restore.

## Validation & errors
Rate-limit and block responses per PS-011-02 and CTR-ERR-001 (no quota values beyond retry_after_ms).

## Authorization
Disclosure to counterparties follows participant rules (PS-011-05). Operator access requires case scope and dual control.

## Failure, idempotency, concurrency, offline
Deletion is idempotent on offer_id. Offline drafts are purged on logout and account switch (CTR-PRV-001 failure section).

## Privacy, retention, abuse
- Lowball or spam probing: one active offer per buyer per listing; daily cap; no buyer-visible list of other offers.
- Harassment: seller may reject; repeated rejects do not notify buyer beyond generic status.
- Enumeration: uniform not-found bodies (CTR-ERR-001 R08).
- Pseudonyms do not hide the buyer from the seller on an offer; no anonymity claim is made (PROJECT_SPEC.md).

## Observability & budgets
Alert on any offer field found in logs or push payloads (zero tolerance, CTR-PRV-001 R03). Alert on deletion propagation past 24 h.

## Tests
- TEST-PS-011-07-01 (classification): every field class matches PS-011-01.
- TEST-PS-011-07-02 (zero tolerance): fixture amounts and refs absent from logs, push payloads, public listing and federation batches.
- TEST-PS-011-07-03 (retention): offers purge at terminal_at + 90 days in replicas and caches within 24 h.
- TEST-PS-011-07-04 (deletion): buyer deletion tombstones buyer_ref; seller record keeps amount.
- TEST-PS-011-07-05 (abuse): 21st submit in 24 h → SYS.RATE_LIMITED; blocked pair → byte-identical SYS.NOT_FOUND.
- TEST-PS-011-07-06 (ranking): ranking job cannot read offer tables (deny-list test).

## Acceptance criteria
1. Zero offer amounts in any non-owner or non-participant output across the fixture corpus.
2. Retention and deletion pass within 24 h in the seeded environment.
3. TEST-PS-011-07-01 through -06 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): minimal retention with legal-hold exceptions; 90-day terminal retention is ASSUMPTION pending F10 review.
- PROVISIONAL (D05 default, unapproved): no precise location in offers.
- ASSUMPTION: 20 submits per 24 h; no offer data in ranking.
