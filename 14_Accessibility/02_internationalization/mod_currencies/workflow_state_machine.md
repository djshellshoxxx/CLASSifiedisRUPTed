# PS-112-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-03.R01 | A catalog version is `draft`, `published` or `superseded`; published versions are immutable. | MVP |
| PS-112-03.R02 | A catalog entry is `active` or `deprecated`; deprecation is one-way within a version. | MVP |
| PS-112-03.R03 | Exactly one catalog version is current at any time. | MVP |

## Data / schema
`catalog_version`, `digest` (SHA-256 of canonical JSON), entry `status`.

## Commands / queries / events
`cur.catalog.publish` drives version transitions; emits `currency_catalog.published`.

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| draft | publish | dual approval, validation passes | published | digest stored; event; previous → superseded |
| published | supersede | newer version published | superseded | clients keep reading cached copy |
| active | deprecate | entry in new version | deprecated | new use refused (CUR.CODE_DEPRECATED) |
| deprecated | reactivate | — | (not allowed; new entry required) | — |

## Validation & errors
See [PS-112-02](validation_rules.md).

## Authorization
See [PS-112-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-112-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Catalog is public; no transition emits personal data.

## Observability & budgets
Current version number exported as a gauge.

## Tests
- TEST-PS-112-03-01 unit: every table row.
- TEST-PS-112-03-02 integration: two versions, only one current.

## Acceptance criteria
1. A published version cannot change; a changed catalog requires a new version.
2. Deprecated entries cannot be reactivated in test.

## Assumptions & open decisions
- ASSUMPTION: reactivation requires a new entry to keep history unambiguous.
- No Dxx decision directly affects this state machine.
