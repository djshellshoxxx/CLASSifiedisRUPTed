# PS-076-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-ID-001 (new prefix PENDING CTR-ID-001 for `cns_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-01.R01 | One consent record per (`subject`, `purpose`, `scope`, `notice_version`) lineage. Records are append-only; each state change creates `revision` + 1. | MVP |
| PS-076-01.R02 | `purpose` is drawn from a closed registry: `analytics`, `notifications_push`, `federation_item_optin`, `location_precision_disclosure`, `counterparty_contact`. Values PROVISIONAL (owner F10). | MVP |
| PS-076-01.R03 | Record holds no free text, no IP address, no device identifier (CTR-EVT-001 R06, CTR-PRV-001 R09). | MVP |
| PS-076-01.R04 | Each record stores the `notice_version` the subject saw. A record cannot exist without it. | MVP |

## Data / schema
| Field | Type | Constraint | Class |
|---|---|---|---|
| `consent_id` | string | `cns_` + 26 Crockford chars (CTR-ID-001) | PSEUDONYMOUS |
| `subject` | string | `acc_` ID, reference only | PSEUDONYMOUS |
| `purpose` | enum (closed) | R02 registry | PUBLIC |
| `scope` | object | `{type: global\|item, ref: <ID>\|null}`; `ref` is an ID, never content | PSEUDONYMOUS |
| `status` | enum | `granted`, `withdrawn`, `expired`, `superseded` | PUBLIC |
| `revision` | integer | ≥ 1, per record | PUBLIC |
| `notice_version` | string | SemVer | PUBLIC |
| `granted_at`, `withdrawn_at` | date-time | `withdrawn_at` null unless status = withdrawn | PSEUDONYMOUS |
| `expires_at` | date-time or null | ≤ `granted_at` + 365 d (ASSUMPTION) | PSEUDONYMOUS |
| `source` | enum | `ui`, `api`, `migration` | PUBLIC |
| `schema_version` | const | `1.0.0` | — |

Canonical owner (B-06, PROVISIONAL): this module owns privacy-consent records only. Cycle-participation consent (`02_LocalMutiny/03_cycle_execution/mod_consent`) and negotiation consent (`08_Communications/02_negotiation/mod_consent`) are separate record classes; consumers reference them by full ID.

## Commands / queries / events
Defined in [commands_queries_events.md](commands_queries_events.md). This file defines fields only.

## States & transitions
Field `status` lifecycle is specified in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Field rules are in [validation_rules.md](validation_rules.md).

## Authorization
Field visibility per CTR-CAP-001 R10: `subject` and `status` visible to owner; `scope.ref` visible to owner and to the item owner only when status = granted (ASSUMPTION). No `global` read of consent content.

## Failure, idempotency, concurrency, offline
Revision check on every write (`expected_revision`, CTR-EVT-001 R02). Schema change rules: CTR-SCH-001 R10 (any class change requires F10 review).

## Privacy, retention, abuse
Record class PSEUDONYMOUS. Retention: see [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Schema lint in CI (PRV.UNCLASSIFIED_FIELD on any field lacking a class).

## Tests
- TEST-PS-076-01-01 (unit): registry rejects purpose outside R02 closed set.
- TEST-PS-076-01-02 (contract): every field carries exactly one class; CI fails on missing class.
- TEST-PS-076-01-03 (schema): record without `notice_version` fails validation.

## Acceptance criteria
1. Schema validates against `1.0.0` JSON Schema with `additionalProperties: false`.
2. Each field has one class from CTR-PRV-001.
3. Purpose registry matches R02 exactly.

## Assumptions & open decisions
- ASSUMPTION: consent expiry maximum 365 days.
- PROVISIONAL (D07 default, unapproved): minimal per-category retention; see file 07.
- B-06: canonical owner of privacy-consent class is this module (PROVISIONAL). Final ownership OPEN for Governance Lead (F18).
