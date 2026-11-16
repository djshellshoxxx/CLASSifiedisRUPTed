# PS-007-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (envelope, registry), CTR-COM-001 (amount format), CTR-PRV-001 (region cells, K_MIN), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-02.R01 | All field rules run before any state write. All violations return in one response, at most 20 `details`. | MVP |
| PS-007-02.R02 | Text is NFC-normalized, then checked. C0/C1 control characters are rejected. | MVP |
| PS-007-02.R03 | Contact patterns (email, phone, messenger handle) in `title` or `description` are rejected. Target recall ≥ 95%, benign false positive ≤ 2% (ASSUMPTION, fixture-measured). | MVP |
| PS-007-02.R04 | Precise addresses and coordinates in text are rejected. Users are told to use the region cell. | MVP |
| PS-007-02.R05 | Same owner, same normalized title and `category_id`, state `published` or `paused`, created < 24 h ago → rejected. | MVP |
| PS-007-02.R06 | Max 5 active posts (`published`, `paused`, `suspended`) per owner (ASSUMPTION). | MVP |

## Data / schema
Rule table (`details[].rule` is a registry enum; input values are never echoed, CTR-ERR R07).

| Field | Rule | Code (`WANTED.`) | `rule` |
|---|---|---|---|
| `title` | 3–80 chars after NFC; no controls; ≥ 1 non-space | `TITLE_INVALID` | length, charset, blank |
| `description` | 0–2000 chars; plain text, no markup links | `DESCRIPTION_INVALID` | length, markup |
| `category_id` | exists and active | `CATEGORY_UNKNOWN` | registry |
| `quantity` | integer 1–99 | `QUANTITY_INVALID` | range |
| `condition_preference` | closed enum | `CONDITION_INVALID` | enum |
| `budget_max` | decimal-string minor units, ≥ 0, ≤ 12 digits, no leading zeros | `BUDGET_INVALID` | format, range |
| `budget_max.currency` | fiat ISO 4217 or CAIP-19 on allowlist | `CURRENCY_UNSUPPORTED` | allowlist |
| `region_cell` | in registered cell set | `REGION_NOT_REGISTERED` | registry |
| `expires_at` | ≤ `published_at` + 90 d | `EXPIRY_OUT_OF_RANGE` | range |
| any unknown field | rejected | `FIELD_NOT_ALLOWED` | unknown_field |
| text contact pattern | rejected | `CONTACT_IN_TEXT` | contact_pattern |
| text address pattern | rejected | `PRECISE_LOCATION_IN_TEXT` | precise_location |
| duplicate (R05) | rejected | `DUPLICATE_ACTIVE` | duplicate |
| limit (R06) | rejected | `ACTIVE_LIMIT_REACHED` | limit |

## Commands / queries / events
Validation runs after authorization and before any state transition. A rejected command emits no event.

## States & transitions
Rules apply on `create`, `update`, `publish`, `renew`. Transition guards in PS-007-03.

## Validation & errors
Envelope per CTR-ERR-001. `retryable` is `false` for every code below. `message_key` = `err.wanted.` + lowercase code (CTR-ERR R05).

| Code | Category | Retryable | Privacy-safe diagnostic |
|---|---|---|---|
| `WANTED.TITLE_INVALID`, `DESCRIPTION_INVALID`, `CATEGORY_UNKNOWN`, `QUANTITY_INVALID`, `CONDITION_INVALID`, `BUDGET_INVALID`, `CURRENCY_UNSUPPORTED`, `REGION_NOT_REGISTERED`, `EXPIRY_OUT_OF_RANGE`, `FIELD_NOT_ALLOWED` | validation (400) | false | rule enum and field path only |
| `WANTED.CONTACT_IN_TEXT`, `PRECISE_LOCATION_IN_TEXT` | validation (400) | false | rule enum; no offset, no matched text |
| `WANTED.DUPLICATE_ACTIVE`, `ACTIVE_LIMIT_REACHED` | conflict (409) | false | rule enum; count only |

Shared codes (`SYS.FORBIDDEN`, `SYS.NOT_FOUND`, `SYS.CONFLICT`, rate-limit code per CTR-ERR registry) are referenced, not redefined.

## Authorization
Authorization precedes validation. A caller who cannot read the target gets `SYS.NOT_FOUND` before any rule detail is returned (CTR-ERR R08).

## Failure, idempotency, concurrency, offline
Validation is pure and deterministic, so retries re-run it unchanged. Offline clients run the same rules locally as a pre-check only; the server result is authoritative (D08 PROVISIONAL).

## Privacy, retention, abuse
Matched text is never returned, logged or stored. Only rule counters are emitted. Contact details are exchanged only through private messages (08_Communications).

## Observability & budgets
Counter `wanted_validation_reject_total{rule}`. Validation p95 ≤ 5 ms per request (ASSUMPTION).

## Tests
- TEST-PS-007-02-01 (unit): each rule row accepts boundary and rejects boundary+1 (title 2/3/80/81 chars).
- TEST-PS-007-02-02 (property): NFC-equivalent strings give equal length results; control characters always rejected.
- TEST-PS-007-02-03 (fixture): 200 contact and address fixtures; recall and false-positive targets from R03.
- TEST-PS-007-02-04 (integration): duplicate blocked < 24 h, accepted after 24 h.
- TEST-PS-007-02-05 (a11y): error summary announced; focus moves to first invalid field; text from `message_key`.
- TEST-PS-007-02-06 (negative): input values absent from response bodies and logs.

## Acceptance criteria
1. Every row in the rule table is implemented and returns the listed code.
2. Errors use the CTR-ERR-001 envelope; no value is echoed.
3. Fixture targets in R03 are measured before MVP sign-off.
4. Codes are added to the CTR-ERR-001 registry (lint TEST-CTR-ERR-001-02).

## Assumptions & open decisions
- D05 PROVISIONAL (Dxx default, unapproved): precise location rejected; region cell only.
- ASSUMPTION: contact and address detectors are heuristic; thresholds are provisional until fixture measurement.
- ASSUMPTION: active-post limit 5; duplicate window 24 h.
