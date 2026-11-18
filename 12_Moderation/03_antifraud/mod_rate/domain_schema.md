# PS-099-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-FED-001 (R11), CTR-PRV-001 (R09), CTR-SCH-001 (policy schema).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-01.R01 | The module has no durable user-level records. Buckets are transient state with TTL, and no bucket is written to a database. | MVP |
| PS-099-01.R02 | Each bucket key is `HMAC-SHA256(rotating_key, class_id ‖ subject_token)`, where `subject_token` is `acc_`, `fpr_`, or a keyed hash of the network source for unauthenticated routes. Raw IPs and device IDs are never stored. | MVP |
| PS-099-01.R03 | Rate classes are defined in a versioned policy (`rate_policy_version`, semver) signed by F16 and loaded at start. | MVP |
| PS-099-01.R04 | Bucket state per key is one 64-bit theoretical arrival time (GCRA), so memory is O(1) per key. | MVP |
| PS-099-01.R05 | Store capacity ≤ 10 million live keys per node; eviction is LRU of expired-first (ASSUMPTION). | MVP |

## Data / schema
Rate class definition (policy file, JSON, `additionalProperties: false`):

```json
{
  "class_id": "msg.send",
  "subject": "acc",
  "emission_interval_ms": 2000,
  "burst": 10,
  "window_ms": 60000,
  "fail_mode": "open_throttled",
  "schema_version": "1.0.0"
}
```

Bucket record (in-memory store, not persisted): `key` (32 bytes), `tat_ms` (int64), `expires_at_ms` (int64). Fields are keyed-hash output and time values only.

Field classes (CTR-PRV-001): none of these fields holds personal data. The `subject_token` is pseudonymous by construction.

## Commands / queries / events
See [PS-099-04](commands_queries_events.md).

## States & transitions
See [PS-099-03](workflow_state_machine.md).

## Validation & errors
See [PS-099-02](validation_rules.md).

## Authorization
See [PS-099-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-099-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [PS-099-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-099-08](observability_performance.md).

## Tests
- `TEST-PS-099-01-01` unit: key derivation is deterministic per rotation epoch and differs across epochs.
- `TEST-PS-099-01-02` contract: policy file rejects unknown fields and `burst` < 1.
- `TEST-PS-099-01-03` privacy: store dump contains no IP, account ID or device ID in plaintext.

## Acceptance criteria
1. No table, file or log contains a raw network address or account ID from this module.
2. Memory per key ≤ 48 bytes including overhead (measured).
3. Policy file validates against the schema before load.

## Assumptions & open decisions
- ASSUMPTION: GCRA chosen over sliding-window log (memory O(1) per key) and fixed window (boundary bursts). Rationale recorded here as the ADR-lite decision for this module.
- D01 (federated protocol), PROVISIONAL default: federation inbound limit 600 events/min and 10 MiB/h per peer (CTR-FED-001 R11) (unapproved).
- D07 (retention), PROVISIONAL default: no retention beyond bucket TTL (unapproved).
