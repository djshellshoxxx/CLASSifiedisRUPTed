# PS-055-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-03.R01 | Export states: generated, downloaded, expired, deleted. Import states: staged, applied, rejected. | MVP |
| PS-055-03.R02 | Import applies only from `staged`, and only once per (bundle_digest, target node). | MVP |
| PS-055-03.R03 | Export is single-download: the first successful download moves to `downloaded` and deletes the file. | MVP |
| PS-055-03.R04 | Every transition emits one CTR-EVT-001 event with `revision` + 1. | MVP |

## Data / schema
State on `bnd_` and `imj_` rows.

## Commands / queries / events
Transitions via [commands_queries_events](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | export.generate | owner step-up; ≤ 3 exports per 24 h | generated | Bundle file written encrypted; `portable_bundle.generated`. |
| generated | download | link unexpired (15 min); first download | downloaded | File deleted after response confirmed; `portable_bundle.downloaded`. |
| generated | timer | now > expires_at | expired | File deleted; `portable_bundle.expired`. |
| downloaded | timer | 7 d after generation | deleted | Metadata only kept. |
| (none) | import.stage | validation passes (PS-055-02) | staged | `portable_import.staged`. |
| staged | import.apply | owner session; digest not previously applied | applied | Create `prf_` with imported fields; `portable_import.applied`. |
| staged | import.apply | validation fails or digest applied | rejected | `portable_import.rejected` with code. |
| staged | timer | 24 h without apply | rejected | Bundle deleted. |

## Validation & errors
Guard failures map to codes in [validation_rules](validation_rules.md). Invalid transitions: `SYS.CONFLICT` (409).

## Authorization
Owner only (see [authorization_capabilities](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Apply is one transaction: profile creation and `imj_` state change commit together.

## Privacy, retention, abuse
Deleted bundle files are overwritten at storage layer where supported; otherwise crypto-erased with per-bundle key destruction (ASSUMPTION).

## Observability & budgets
`portable_transitions_total{type,to}`.

## Tests
TEST-PS-055-05 (table rows), TEST-PS-055-06 (double apply returns ALREADY_APPLIED, one profile).

## Acceptance criteria
1. Each row has a passing test.
2. A second download attempt returns 410.

## Assumptions & open decisions
- ASSUMPTION: 15 min link, 24 h staging, 7 d expiry.
