# PS-060-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (codes), CTR-PRV-001 (R10 generic previews), CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-02.R01 | Body: NFC; 1–2,000 code points; no control characters except newline (max 50 newlines); zero-width characters stripped. | MVP |
| PS-060-02.R02 | Body with only whitespace is rejected. | MVP |
| PS-060-02.R03 | URLs allowed as plain text; never fetched or previewed server-side (no unfurling). | MVP |
| PS-060-02.R04 | Thread creation requires an eligibility rule to be true at send time (PS-060-03 guard). | MVP |
| PS-060-02.R05 | Contact requests: ≤ 3 per sender per recipient per 7 days; recipient may accept or ignore; ignoring does not notify sender. | MVP |
| PS-060-02.R06 | Sender must not be blocked by the recipient; a block is indistinguishable from "no thread" in errors. | MVP |
| PS-060-02.R07 | Body must not be echoed in any error or log. | MVP |

## Data / schema
Maps to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `StartThread`, `SendMessage`, `RequestContact`, `AcceptContact`.

## States & transitions
Validation precedes transitions.

## Validation & errors
| Code | `retryable` | `message_key` | `details[].rule` |
|---|---|---|---|
| `PRIVMSG.BODY_INVALID` | false | `err.privmsg.body_invalid` | `length` or `control` |
| `PRIVMSG.BODY_EMPTY` | false | `err.privmsg.body_empty` | `length` |
| `PRIVMSG.NOT_ELIGIBLE` | false | `err.privmsg.not_eligible` | `relation` |
| `PRIVMSG.CONTACT_LIMIT` | true | `err.privmsg.contact_limit` | `rate` |
| `PRIVMSG.RATE_LIMITED` | true | `err.privmsg.rate_limited` | `rate` |

A blocked recipient receives `PRIVMSG.NOT_ELIGIBLE` (identical to non-eligible), per R06.

## Authorization
Validation does not authorize; PS-060-05 runs first.

## Failure, idempotency, concurrency, offline
Deterministic. Offline sends validated again on relay; ineligible at relay time → `not_applied`.

## Privacy, retention, abuse
Rejected bodies are not stored or logged. Rate-limit events record code only.

## Observability & budgets
`privmsg_validation_fail_total{code}`; validation p95 ≤ 5 ms.

## Tests
- TEST-PS-060-02-01 (unit): length, control, whitespace and zero-width cases.
- TEST-PS-060-02-02 (negative): blocked and non-eligible sends return identical errors (timing-equalized within 20 ms, ASSUMPTION).
- TEST-PS-060-02-03 (privacy scan): no body content in errors or logs.
- TEST-PS-060-02-04 (integration): URL in body is stored as text, with no outbound request.

## Acceptance criteria
1. All rules enforced server-side.
2. Block responses indistinguishable from non-eligibility.
3. No body in any error or log.
4. No server-side URL fetch.

## Assumptions & open decisions
- ASSUMPTION: 3 contact requests per 7 days per pair.
- PROVISIONAL (D10 default, unapproved): no end-to-end encryption in MVP (see PS-060-07).
