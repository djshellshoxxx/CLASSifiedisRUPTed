# PS-133-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-04.R01 | Every write command requires `expected_revision` and an idempotency key; replay within 24 h returns the stored result | MVP |
| PS-133-04.R02 | PublishModel is atomic: all threats in the version are included or the publish fails | MVP |
| PS-133-04.R03 | ListThreats returns <= 100 rows per page and never returns restricted fields to non-authorized roles | MVP |
| PS-133-04.R04 | Commands and events versioned v1 | MVP |

## Data / schema
Event example:
```json
{"event":"threats.ControlVerified","v":1,"threat_id":"THR-PAY-001","control_ref":"09_Commerce/01_payments/mod_noncustodial","verified_by":"TEST-PS-127-01-01","revision":5,"idempotency_key":"<ulid>"}
```

## Commands / queries / events
| Name | Signature | Idempotency key | Errors |
|---|---|---|---|
| threats.RecordThreat | (threat fields) | threat_id | ID_INVALID, DESCRIPTION_UNSAFE, SCHEMA_INVALID |
| threats.AssessThreat | (threat_id, likelihood, impact, expected_revision) | threat_id + revision | RATING_OUT_OF_RANGE, ILLEGAL_TRANSITION |
| threats.LinkControl | (threat_id, control_ref, kind) | threat_id + control_ref | CONTROL_REF_UNRESOLVED |
| threats.VerifyControl | (threat_id, control_ref, TEST-ID) | threat_id + control_ref + TEST-ID | ILLEGAL_TRANSITION |
| threats.AcceptResidual | (threat_id, rationale, accepted_by, approved_by, expires_at) | threat_id + approval ID | RESIDUAL_SELF_APPROVED, UNAUTHORIZED |
| threats.PublishModel | (model_id, version) | model_id + version | CONTROL_REF_UNRESOLVED, REVIEW_OVERDUE (warning) |
| threats.RetireThreat | (threat_id, reason_code) | threat_id | ILLEGAL_TRANSITION |
| Query ListThreats | (area_path, status, page) | none | UNAUTHORIZED |
| Query GetThreat | (threat_id) | none | NOT_FOUND |
| Query CoverageReport | (area_path) | none | none |

Events: `threats.ThreatRecorded`, `threats.ThreatAssessed`, `threats.ControlLinked`, `threats.ControlVerified`, `threats.ResidualAccepted`, `threats.ResidualExpired`, `threats.ModelPublished`, `threats.ReviewOverdue`. Envelope per CTR-EVT-001.

## States & transitions
Command effects per PS-133-03.

## Validation & errors
Codes per PS-133-02 with `THREATS.` prefix; retryability per CTR-ERR-001.

## Authorization
Per PS-133-05.

## Failure, idempotency, concurrency, offline
Duplicate keyed command returns stored response. Events at-least-once; consumers dedupe on idempotency_key.

## Privacy, retention, abuse
Event payloads carry THR-IDs and control paths; description text never included in events.

## Observability & budgets
Latency p95 <= 300 ms for writes (ASSUMPTION). Event lag to mod_incident <= 60 s.

## Tests
- TEST-PS-133-04-01 (unit): replay of AssessThreat with same key returns same response, no second event.
- TEST-PS-133-04-02 (contract): ControlVerified payload validates against CTR-EVT-001 envelope.
- TEST-PS-133-04-03 (integration): PublishModel with one invalid threat writes nothing.

## Acceptance criteria
1. All commands and queries above implemented as specified; no unlisted write path.
2. Replay test passes for every state-changing command.
3. PublishModel atomicity demonstrated by failure injection.

## Assumptions & open decisions
- ASSUMPTION: 24 h replay window matches other F16 modules.
- CTR-ID-001 ID format OPEN.
- CTR-EVT-001 is DRAFT; field names are local until approval.
