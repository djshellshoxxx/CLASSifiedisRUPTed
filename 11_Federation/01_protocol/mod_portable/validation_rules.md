# PS-083-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R02, R03, R10), CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-02.R01 | Reject bundle creation with an item whose class is PRIVATE_PERSONAL, FINANCIAL_EVIDENCE, LOCATION_PRECISE or SECRET: `PORTABLE.CLASS_NOT_EXPORTABLE` (422). | MVP |
| PS-083-02.R02 | Reject bundle creation with an item whose `federate` is false: `PORTABLE.ITEM_NOT_FEDERATED` (422). | MVP |
| PS-083-02.R03 | Reject bundle creation with no `audience`: `PORTABLE.AUDIENCE_REQUIRED` (400). | MVP |
| PS-083-02.R04 | Reject bundle > 1000 items or > 1 MiB with `SYS.PAYLOAD_TOO_LARGE` (413). | MVP |
| PS-083-02.R05 | Reject an import whose `expires_at` has passed with `PORTABLE.BUNDLE_EXPIRED` (410). | MVP |

## Data / schema
Rules apply to fields in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `portable.create_bundle`, `portable.verify_bundle`, `portable.import_bundle`.

## States & transitions
Validation runs before state moves in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP |
|---|---|---|
| PORTABLE.CLASS_NOT_EXPORTABLE | false | unprocessable_state / 422 |
| PORTABLE.ITEM_NOT_FEDERATED | false | unprocessable_state / 422 |
| PORTABLE.AUDIENCE_REQUIRED | false | validation / 400 |
| PORTABLE.BUNDLE_EXPIRED | false | gone / 410 |

R04 uses shared `SYS.PAYLOAD_TOO_LARGE`.

## Authorization
Validation of shape precedes decision; unreadable items return `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Deterministic. Import path also runs CTR-FED-001 verification order (steps 1–14).

## Privacy, retention, abuse
Error details name item classes only, never values.

## Observability & budgets
Counter `portable_validation_failures_total{code}`.

## Tests
- TEST-PS-083-02-01 (unit): each R01–R05 returns its code.
- TEST-PS-083-02-02 (negative): LOCATION_PRECISE item in an otherwise valid bundle blocks the whole bundle.
- TEST-PS-083-02-03 (expiry): expired bundle import returns 410.

## Acceptance criteria
1. All codes covered.
2. Blocking is all-or-nothing per bundle.
3. No error echoes item content.

## Assumptions & open decisions
- ASSUMPTION: whole-bundle rejection rather than partial export.
