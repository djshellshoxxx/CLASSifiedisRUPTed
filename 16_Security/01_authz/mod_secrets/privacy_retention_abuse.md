# PS-127-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-07.R01 | Secret values are SECRET class: never in events, logs, exports, federation or analytics (CTR-PRV-001 R08). | MVP |
| PS-127-07.R02 | Backups hold only KMS-wrapped ciphertext or verifiers (CTR-PRV-001 disclosure matrix). | MVP |
| PS-127-07.R03 | Retention RET-SEC: until revoked or rotated; verifier hashes purged 30 days after revocation. | MVP |
| PS-127-07.R04 | Secret-to-user mapping is not stored here; this module holds platform secrets only. | MVP |
| PS-127-07.R05 | Secret values are never displayed in admin UI; UI shows name, version, status and age. | MVP |

## Data / schema
Retention class RET-SEC. Audit records RET-AUD (12 months).

## Commands / queries / events
Destruction event carries name and version only.

## States & transitions
Retention ends at `destroyed` (PS-127-03).

## Validation & errors
`SECRETS.VALUE_IN_LOG_PATH` (PS-127-02).

## Authorization
See PS-127-05.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Abuse: stolen lease token. Mitigated by requester binding, 15-minute TTL, in-memory-only storage and anomaly alerts. Insider abuse: dual control on revoke; no value-read path.

## Observability & budgets
No values in metrics or traces; trace attributes exclude secret names beyond the owner module prefix (ASSUMPTION).

## Tests
- TEST-PS-127-07-01 (log and event scan): no value fragments in logs, events or traces.
- TEST-PS-127-07-02 (backup scan): backup objects contain only handles and verifiers.
- TEST-PS-127-07-03 (retention): verifier purged 30 days after revocation.
- TEST-PS-127-07-04 (UI): admin screens show no value field (static scan).

## Acceptance criteria
1. Zero value fragments in sinks (TEST-01).
2. TEST-PS-127-07-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D10 default): platform secrets are separate from user keys.
- OPEN (F10): retention of audit records for lease events.
