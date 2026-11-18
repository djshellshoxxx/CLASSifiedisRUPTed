# PS-102-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R06, R08, R09, R10, R11, R12), CTR-EVT-001 (R06, R11), CTR-CAP-001 (R08).

**Decision labels:** Retention defaults are PROVISIONAL (D07 default, unapproved). Address handling and encryption are PROVISIONAL (D10 default, unapproved). Privacy review by F10: OPEN.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-07.R01 | Address is class PRIVATE_PERSONAL. Stored encrypted; never in logs, events, metrics, errors or exports except to its owner. | MVP |
| PS-102-07.R02 | Binding retained for account lifetime plus 30 days grace (RET-ACC); removed within 24 hours of account deletion request. | MVP |
| PS-102-07.R03 | Delivery attempts retained 30 days (RET-OPS); provider message IDs follow the same rule. | MVP |
| PS-102-07.R04 | Token hashes retained until use or expiry plus 30 minutes, then purged (RET-SEC). | MVP |
| PS-102-07.R05 | Every outgoing body is generic for account and security categories: no listing, counterparty, location or message content. | MVP |
| PS-102-07.R06 | Enumeration: bind and recover requests return the same response for registered and unregistered addresses. | MVP |
| PS-102-07.R07 | Rate limits: 5 verification sends per address per 24 h; 3 bind attempts per account per hour (ASSUMPTION). | MVP |
| PS-102-07.R08 | Marketing and digest email are out of MVP scope and require a separate opt-in category (PS-107-01). | Future |

## Data / schema
Field classes per PS-102-01: `address_ciphertext` PRIVATE_PERSONAL; `address_hmac` PSEUDONYMOUS (keyed); `token_hash` SECRET; `provider_message_id` PSEUDONYMOUS. The keyed HMAC key is SECRET and rotated under D10.

## Commands / queries / events
Events never carry address fields (PS-102-04 R05).

## States & transitions
REMOVED erases ciphertext (PS-102-03).

## Validation & errors
Diagnostic codes only; no value echo (PS-102-02).

## Authorization
Owner-only access to address (PS-102-05).

## Failure, idempotency, concurrency, offline
Deletion job retries until erasure is confirmed; erasure receipt is an `aud_` record without address (CTR-PRV-001 R12).

## Privacy, retention, abuse
| Threat | Control |
|---|---|
| Account enumeration | R06 identical responses; timing equalized to within 50 ms (ASSUMPTION) |
| Mail bombing a third party | R07 per-address cap; per-IP cap on truncated, keyed-hash IP (CTR-PRV-001 R09) |
| Token theft from mail client | Single use, 30-minute TTL, bound to account, link on first-party origin only |
| Phishing via templates | Template catalog signed; link allowlist (PS-102-02 R06) |
| Header injection | PS-102-02 R03 |
| Provider metadata exposure | Provider contract reviewed by F10 (OPEN); no body content beyond template |

Pseudonyms do not guarantee anonymity: a verified address can link back to a person. Users are told this at binding.

## Observability and budgets
Logs: `email_id`, `template_id`, `code`, timing. Dashboards aggregate bounce rates only.

## Tests
- TEST-PS-102-19 (negative): log scan of 10,000 sends finds no address, token or body text.
- TEST-PS-102-20 (integration): deleted account's binding erased within 24 hours.
- TEST-PS-102-21 (negative): bind for registered and unregistered address produce identical responses and timing within 50 ms.
- TEST-PS-102-22 (negative): 6th verification send in 24 h rejected with `EMAIL.RATE_LIMITED`.

## Acceptance criteria
1. F10 review of address handling (future gate; OPEN).
2. Enumeration test passes.
3. Log scan clean.

## Assumptions & open decisions
- ASSUMPTION: deletion of binding is independent of retention of delivery logs (logs carry no address).
- D10 and D07 (PROVISIONAL, unapproved).
