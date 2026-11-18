# PS-112-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-05.R01 | Catalog publish requires an `ope_` with `global` scope and dual control (CTR-CAP-001 R07). | MVP |
| PS-112-05.R02 | Catalog reads are public. | MVP |
| PS-112-05.R03 | No principal of this module can create, change or read quotes (F09 scope). | MVP |

## Data / schema
Capabilities: `currency_catalog.read`, `currency_catalog.publish`.

## Commands / queries / events
Per [PS-112-04](commands_queries_events.md).

## States & transitions
Not applicable.

## Validation & errors
Denials per CTR-CAP-001.

## Authorization
| Actor | Action | Resource | Decision |
|---|---|---|---|
| ope_ (localization role, two approvers) | publish | cur catalog | ALLOW |
| any | read | published catalog | ALLOW |
| acc_, sys_ | publish | cur catalog | DENY |
| any | create or read quote (qte_) | F09 | DENY (not this module) |

## Failure, idempotency, concurrency, offline
Revocation effective at next decision.

## Privacy, retention, abuse
No principal data used in catalog decisions.

## Observability & budgets
Publish writes `aud_` record.

## Tests
- TEST-PS-112-05-01 unit: decision table.
- TEST-PS-112-05-02 integration: single approver publish refused.

## Acceptance criteria
1. Publish requires two distinct approvers in test.
2. Every publish writes an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: localization role is a named `ope_` grant.
- No Dxx decision directly affects authorization.
