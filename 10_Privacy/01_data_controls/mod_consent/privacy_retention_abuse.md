# PS-076-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R09, R11, R12), CTR-EVT-001 (R06), CTR-FED-001 (R02).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-07.R01 | Active consent records retained while subject active. After withdrawal, expiry or account deletion, the proof record is retained 3 years (ASSUMPTION) then reduced to a salted hash plus timestamps. | MVP |
| PS-076-07.R02 | Consent state propagates to federated peers as a revocation of `federation_item_optin` within 24 h (CTR-PRV-001 R06). | MVP |
| PS-076-07.R03 | Deletion of a subject removes `scope.ref` values but keeps the minimal proof record (R01) unless legal hold applies (CTR-PRV-001 R07). | MVP |
| PS-076-07.R04 | Toggle abuse: more than 20 grant/withdraw toggles per subject per hour returns `SYS.RATE_LIMITED` (ASSUMPTION). | MVP |
| PS-076-07.R05 | No dark patterns: a grant request must present purpose, notice version and an equal-weight decline option (checked in UX review). | MVP |

## Data / schema
Consent records are PSEUDONYMOUS. The proof record is `consent_id`, `subject`, `purpose`, `notice_version`, timestamps and a salted hash of the notice text. No free text.

## Commands / queries / events
Retention jobs run as `sys_` with `consent.expire` semantics; no new public commands.

## States & transitions
Retention stages: active → retained (proof) → hashed (minimal). Legal hold freezes stage transition.

## Validation & errors
`SYS.RATE_LIMITED` (retryable, 429) for abuse. `PRV.HOLD_SCOPE_INVALID` if a hold is attempted without scope.

## Authorization
Retention jobs are `sys_` only. Export of consent records via [import_export_backup_rollback.md](import_export_backup_rollback.md).

## Failure, idempotency, concurrency, offline
Deletion jobs are idempotent per subject. Retention runs do not block consent checks.

## Privacy, retention, abuse
- Data class: PSEUDONYMOUS (records), PUBLIC (purpose registry).
- Retention default: PROVISIONAL (D07 default, unapproved): minimal per-category defaults with legal-hold exceptions. Values above are ASSUMPTIONS.
- Abuse: toggle flooding (R04); repeated stale-notice grants (see file 02).
- Purpose enum must not reveal sensitive interests beyond the registry text.

## Observability & budgets
Retention job lag ≤ 24 h. Metric of records by retention stage. Logs contain no subject identifiers beyond pseudonymous `acc_`.

## Tests
- TEST-PS-076-07-01 (retention): record moves to hashed stage after 3 years in fixture clock.
- TEST-PS-076-07-02 (deletion): deleted subject keeps only proof fields.
- TEST-PS-076-07-03 (abuse): 21st toggle in an hour is rate limited.
- TEST-PS-076-07-04 (federation): withdrawal emits federated revocation within 24 h.

## Acceptance criteria
1. Retention stages and durations match R01 in tests.
2. Legal hold blocks retention transition.
3. No consent record contains free text.

## Assumptions & open decisions
- ASSUMPTION: 3-year proof retention; toggle threshold 20/h.
- PROVISIONAL (D07 default, unapproved). Final durations OPEN for F10.
