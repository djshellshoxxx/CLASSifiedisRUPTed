# PS-057-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, signature fields), CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (`evidence.*` actions), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-04.R01 | All writes carry `idempotency_key` and, except create, `expected_revision`. | MVP |
| PS-057-04.R02 | `RecordEvidence` p95 ≤ 300 ms server-side. | MVP |
| PS-057-04.R03 | Summary query returns counts by `kind` and state only, without content. | MVP |
| PS-057-04.R04 | Event payloads carry `evidence_id`, `subject_prf_id`, `kind`, `state`, revision; never `content_digest` or signature bytes (those stay in the record). | MVP |
| PS-057-04.R05 | Schema IDs `evidence.recorded`, `evidence.superseded`, `evidence.withdrawn`, `evidence.quarantined` at 1.0.0. | MVP |
| PS-057-04.R06 | Bulk import of evidence from external verifiers. | Future |

## Data / schema
| Command | Payload | Error codes |
|---|---|---|
| `RecordEvidence` | `subject_prf_id`, `kind`, `issuer_ref`, `content` (≤ 500 cp, optional), `content_digest`, `signature?`, `issued_at`, `idempotency_key` | `KIND_NOT_ALLOWED`, `ISSUER_NOT_ALLOWED`, `DIGEST_MISMATCH`, `SIGNATURE_INVALID`, `KEY_UNKNOWN` |
| `SupersedeEvidence` | `supersedes`, new record fields, `expected_revision` | `SUPERSEDE_TARGET_INVALID`, `SUPERSEDED`, `WITHDRAWN` |
| `WithdrawEvidence` | `evidence_id`, `expected_revision` | `WITHDRAWN`, `SYS.NOT_FOUND` |

Queries: `GetEvidenceSummary(subject_prf_id)` (counts; visible to subject and mod_reputation service principal); `ListOwnEvidence()` (subject or issuer).

## States & transitions
Events map to [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Rules in [validation_rules.md](validation_rules.md).

## Authorization
Actions `evidence.record`, `evidence.supersede`, `evidence.withdraw`, `evidence.read_summary`, `evidence.read_own`. See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key and digest → original result; reused key with different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Offline recording queued (D08 PROVISIONAL); signatures created on device with a key that must be registered before relay accepts.

## Privacy, retention, abuse
Events are PSEUDONYMOUS. `actor_ref` is `acc_` or `sys_` and appears only in the audit stream.

## Observability & budgets
`evidence_cmd_total{command,result}`; no subject or digest in labels.

## Tests
- TEST-PS-057-04-01 (contract): payload schemas validate.
- TEST-PS-057-04-02 (integration): duplicate `RecordEvidence` returns same ID; one event.
- TEST-PS-057-04-03 (contract): event payload lacks digest and signature (fixture).
- TEST-PS-057-04-04 (negative): summary query returns no content fields.

## Acceptance criteria
1. Commands, queries and events implemented as listed.
2. Idempotency verified.
3. Event payload lint passes.
4. Summary query leaks no content.

## Assumptions & open decisions
- ASSUMPTION: `aggregate_type = trust_evidence` registered in CTR-SCH-001.
- PROVISIONAL (D08 default, unapproved): offline queue until relay acknowledgment.
