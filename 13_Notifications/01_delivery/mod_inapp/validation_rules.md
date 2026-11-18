# PS-103-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-PRV-001 (R03, R10), CTR-EVT-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-02.R01 | `template_key` must be in the template registry (owned by F13 root) and active. Else `INAPP.TEMPLATE_UNKNOWN`. | MVP |
| PS-103-02.R02 | `params` keys must match the template's declared parameter names; values are strings ≤ 64 characters, no newlines, no URLs. Else `INAPP.PARAM_INVALID`. | MVP |
| PS-103-02.R03 | Total `params` ≤ 512 bytes serialized. Else `INAPP.PAYLOAD_TOO_LARGE`. | MVP |
| PS-103-02.R04 | Parameter values must not match the forbidden classes: coordinates, street-address patterns, currency amounts with symbols, email or phone patterns. Else `INAPP.PARAM_FORBIDDEN_CLASS` (producer error, never shown to the user). | MVP |
| PS-103-02.R05 | `source_ref` must be a CTR-ID-001 valid ID or a domain event reference. | MVP |
| PS-103-02.R06 | Inbox cursor is an opaque token ≤ 64 characters encoding `inbox_revision`; malformed → `INAPP.CURSOR_INVALID`. | MVP |

## Data / schema
Module prefix `INAPP`.

| Code | Category | HTTP | Retryable | `details.rule` |
|---|---|---|---|---|
| `INAPP.TEMPLATE_UNKNOWN` | validation | 400 | false | `template_key` |
| `INAPP.PARAM_INVALID` | validation | 400 | false | `params` |
| `INAPP.PAYLOAD_TOO_LARGE` | payload_too_large | 413 | false | `params` |
| `INAPP.PARAM_FORBIDDEN_CLASS` | validation | 400 | false | `params` (producer-facing; logs only) |
| `INAPP.CURSOR_INVALID` | validation | 400 | false | `cursor` |
| `INAPP.STATE_NOT_ALLOWED` | unprocessable_state | 422 | false | `inbox_state` |
| `SYS.NOT_FOUND` | not_found | 404 | false | — (returned for another account's `ntf_`) |

## Commands / queries / events
Order: template, parameter names, size, forbidden classes, source reference.

## States & transitions
Validation failures create no `ntf_`.

## Validation & errors
`INAPP.PARAM_FORBIDDEN_CLASS` details never echo the value (CTR-ERR-001 R07).

## Authorization
Producers must hold `ntf.create` (PS-103-05); recipients see only their own items.

## Failure, idempotency, concurrency, offline
Duplicate source deliveries are accepted and deduped (PS-103-06).

## Privacy, retention, abuse
The forbidden-class scanner runs on every write and on template registration (CI check).

## Observability & budgets
Counter `inapp_validation_error_total{code, producer}` where `producer` is the template's owning module label.

## Tests
- `TEST-PS-103-02-01` unit: each code on exact condition only.
- `TEST-PS-103-02-02` negative: parameter containing a coordinate pair → `INAPP.PARAM_FORBIDDEN_CLASS`, value not echoed.
- `TEST-PS-103-02-03` negative: 513-byte params → `INAPP.PAYLOAD_TOO_LARGE`.
- `TEST-PS-103-02-04` contract: all registered templates pass CI forbidden-class scan.

## Acceptance criteria
1. No notification with a forbidden class is stored.
2. Error bodies never echo parameter values.
3. Template registry CI check blocks non-compliant templates.

## Assumptions & open decisions
- ASSUMPTION: the forbidden-class scanner is a deterministic pattern check; it is a defense-in-depth layer, not a guarantee.
- D05 (geoprivacy), PROVISIONAL default: no location in notifications (unapproved).
