# PS-073-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, RET-LEGAL), CTR-EVT-001 (R06), CTR-FED-001 (R02). **Decisions:** D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-07.R01 | Registry holds no personal data. Schema lint blocks any field classed above PUBLIC (PRV.CLASS_VIOLATION). | MVP |
| PS-073-07.R02 | Registry entries referenced by any claim, proposal or quote are retained for the life of the reference plus 24 months (ASSUMPTION). Unreferenced disabled entries may be purged after 24 months. | MVP |
| PS-073-07.R03 | Asset look-alike abuse is controlled by PS-073-02 R04 and the flagged-entry warning shown in the proposal UI. | MVP |
| PS-073-07.R04 | Registry events are eligible for federation only as PUBLIC data and only when federation is enabled by an admin (CTR-FED-001 R01); MVP default is no federation. | MVP |
| PS-073-07.R05 | Legal hold on a referenced entry blocks purge (CTR-PRV-001 R07). | MVP |

## Data / schema
All fields PUBLIC. `version` and `status` are retained for audit; `display` holds localization keys only.

## Commands / queries / events
Events carry registry IDs and enums only. No free text is accepted in any registry field.

## States & transitions
Deprecated entries are not deleted; purge applies only to unreferenced disabled entries per R02.

## Validation & errors
Free-text fields rejected with `SYS.REQUEST_MALFORMED`. Lint violations fail CI (`PRV.UNCLASSIFIED_FIELD`, `PRV.CLASS_VIOLATION`).

## Authorization
No additional authorization beyond PS-073-05.

## Failure, idempotency, concurrency, offline
Purge is idempotent and checks references at purge time.

## Privacy, retention, abuse
- Asset impersonation: flagged entries (R03) and PS-073-02 look-alike rule.
- Operator identity on registry changes is recorded in `aud_` records and not shown publicly beyond role.
- Registry is not a user-profiling source: no per-user preference or currency history is stored here.

## Observability & budgets
Retention counts only (purged entries per month).

## Tests
- TEST-PS-073-07-01 (lint): no non-PUBLIC field in any registry schema.
- TEST-PS-073-07-02 (integration): entry retained while a claim references it; purged after 24 months with no reference.
- TEST-PS-073-07-03 (integration): legal hold blocks purge of referenced entry.
- TEST-PS-073-07-04 (negative): free-text field in a registry payload rejected.

## Acceptance criteria
1. Lint passes on every schema version.
2. Retention and legal hold rules tested.
3. No user data path into the registry.

## Assumptions & open decisions
- ASSUMPTION: 24-month post-reference retention; 24-month purge for unreferenced disabled entries.
- D07 (PROVISIONAL default, unapproved).
