# PS-108-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-02.R01 | `preset` ∈ {1h, 8h, until_morning, custom}. | MVP |
| PS-108-02.R02 | `custom` requires `until` as RFC 3339 instant; it must be in the future (≥ now + 1 min) and ≤ now + 7 days. | MVP |
| PS-108-02.R03 | `until_morning` requires the account to have a valid time zone (mod_hours); otherwise QUIET.ZONE_REQUIRED. | MVP |
| PS-108-02.R04 | `resume` on an inactive account is a successful no-op. | MVP |
| PS-108-02.R05 | Client clock skew is not trusted: `until` values are interpreted only as absolute instants; relative durations are computed server-side. | MVP |

## Data / schema
| Field | Rule | Error code | Retryable | message_key |
|---|---|---|---|---|
| preset | R01 | QUIET.PRESET_UNKNOWN | false | err.quiet.preset_unknown |
| until | R02 format and range | QUIET.UNTIL_INVALID | false | err.quiet.until_invalid |
| until | ≤ now + 7 days | QUIET.DURATION_TOO_LONG | false | err.quiet.duration_too_long |
| zone | R03 | QUIET.ZONE_REQUIRED | false | err.quiet.zone_required |
| revision | matches | SYS.CONFLICT | true | err.sys.conflict |

## Commands / queries / events
Validation before write; no event on rejection.

## States & transitions
Not applicable.

## Validation & errors
CTR-ERR-001 envelope; no echo of `until` value.

## Authorization
Ownership check first.

## Failure, idempotency, concurrency, offline
Deterministic; offline clients may pre-validate with server-provided clock offset.

## Privacy, retention, abuse
Logs contain codes only.

## Observability & budgets
Counter per code; p95 ≤ 2 ms.

## Tests
- TEST-PS-108-02-01 (unit): each rule maps to one code.
- TEST-PS-108-02-02 (unit): `until` in the past rejected.
- TEST-PS-108-02-03 (unit): `until` of now + 7 days − 1 second accepted.
- TEST-PS-108-02-04 (unit): `resume` when inactive returns success with `inactive` status.

## Acceptance criteria
1. Each rule covered by passing and failing fixtures.
2. Clock-skew fixture (client 10 min ahead) yields server-computed end.
3. No echoed values.

## Assumptions & open decisions
- ASSUMPTION: 1-minute minimum duration.
- Message keys pending mod_languages.
