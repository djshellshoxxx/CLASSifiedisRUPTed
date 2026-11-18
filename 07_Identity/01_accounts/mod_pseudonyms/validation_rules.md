# PS-052-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (codes, `message_key`), CTR-ID-001 (`prf` format), CTR-PRV-001 (no contact data in visible fields).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-02.R01 | `handle` normalized by NFKC then lowercase; must match `^[a-z0-9_]{3,24}$`; leading digit allowed; no consecutive `__`. | MVP |
| PS-052-02.R02 | `handle_norm` rejected if in reserved list (operator, moderator, support, official, system names). List owned by F12; ASSUMPTION list at launch. | MVP |
| PS-052-02.R03 | `label` 0–40 Unicode code points after NFC; no control characters; no URL, email, phone-number or street-address pattern. | MVP |
| PS-052-02.R04 | Reject `label` containing a substring matching a contact pattern (email, E.164-like phone, URL scheme). Error names the rule, never echoes the input (CTR-ERR-001 R07). | MVP |
| PS-052-02.R05 | Active count check: create refused when `active` count = 5 (PS-052-01 R04). | MVP |
| PS-052-02.R06 | Validation is run server-side on every write; client validation is advisory only. | MVP |
| PS-052-02.R07 | Accessibility: handle and label error text has an associated programmatic error reference, with a message that is readable by screen readers (PS-052-08 a11y budget). | MVP |

## Data / schema
Validation inputs map to fields in [domain_schema.md](domain_schema.md). No new fields.

## Commands / queries / events
Applies to `CreatePseudonym`, `ChangeHandle`, `UpdateLabel` (see [commands_queries_events.md](commands_queries_events.md)).

## States & transitions
Validation runs before state transitions; a failed validation leaves state unchanged.

## Validation & errors
| Code | Trigger | `retryable` | `message_key` | `details[].rule` |
|---|---|---|---|---|
| `PSEUD.HANDLE_INVALID` | R01 fails | false | `err.pseud.handle_invalid` | `pattern` |
| `PSEUD.HANDLE_RESERVED` | R02 hit | false | `err.pseud.handle_reserved` | `reserved` |
| `PSEUD.HANDLE_TAKEN` | R03 unique conflict | false | `err.pseud.handle_taken` | `unique` |
| `PSEUD.LABEL_INVALID` | R03 fails | false | `err.pseud.label_invalid` | `pattern` |
| `PSEUD.LABEL_CONTAINS_CONTACT` | R04 hit | false | `err.pseud.label_contact` | `forbidden_content` |
| `PSEUD.LIMIT_REACHED` | R05 | false | `err.pseud.limit_reached` | `count` |

Diagnostics: field path and rule enum only. Never the handle, label or matched substring.

## Authorization
Validation does not authorize. Authorization is in PS-052-05 and runs first.

## Failure, idempotency, concurrency, offline
Validation is deterministic: same input and same registry version give the same result. Offline clients may pre-validate with the cached reserved list; server result is authoritative. Reserved-list changes are versioned (CTR-SCH-001).

## Privacy, retention, abuse
Rejected inputs are not logged in plain text. Only rule enum and code are logged. Contact-pattern matches count toward abuse signals (PS-052-07).

## Observability & budgets
Counter `pseud_validation_fail_total{code}`. Validation p95 ≤ 5 ms server-side.

## Tests
- TEST-PS-052-02-01 (unit): table-driven cases for handle regex, NFKC folding (for example full-width letters), reserved names.
- TEST-PS-052-02-02 (property): any accepted handle matches the regex after normalization.
- TEST-PS-052-02-03 (negative): labels containing email, phone, URL are rejected; error body has no echo (privacy scan).
- TEST-PS-052-02-04 (a11y): error messages linked to field via `aria-describedby` in web client.

## Acceptance criteria
1. Every accepted handle and label passes the rules; rejected inputs return the listed code and `message_key`.
2. Error bodies contain no input echo (fixture scan with contact data).
3. Limit check and insert are atomic (verified with PS-052-06 concurrency test).
4. Reserved list version recorded on each accepted create.

## Assumptions & open decisions
- ASSUMPTION: reserved-name list at launch is short and owned by F12; contents are not in this spec.
- PROVISIONAL (D10 default, unapproved): cap of 5 active pseudonyms (see PS-052-01).
- Contact-pattern detection is a heuristic; it is not a privacy guarantee and is listed as a limit in PS-052-07.
