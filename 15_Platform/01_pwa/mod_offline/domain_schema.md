# PS-116-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ID-001, CTR-PRV-001. **Canonical owner of record class "offline pending command":** F15.S01.M01 (consumers reference by full ID only).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-01.R01 | One pending entry is written to device storage before any network send of a state-changing command. No send occurs without a persisted entry. | MVP |
| PS-116-01.R02 | Entries are unique on (`account_ref`, `idempotency_key`). A duplicate create returns the existing entry and writes nothing new. | MVP |
| PS-116-01.R03 | Serialized `payload` ≤ 64 KiB and nesting depth ≤ 8 (CTR-EVT-001 R12). Larger commands are refused at enqueue with `SYS.PAYLOAD_TOO_LARGE`. | MVP |
| PS-116-01.R04 | Capacity per account per device: 500 entries and 5 MiB (ASSUMPTION). | MVP |
| PS-116-01.R05 | Commands whose contract forbids client-offline origin are refused at enqueue with `OFFLINE.COMMAND_NOT_OFFLINE_CAPABLE`. | MVP |
| PS-116-01.R06 | Cross-device queue merge is not provided. Each device replays its own queue; ordering conflicts resolve through server revisions. | Future |

## Data / schema
```json
{
  "local_id": "uuid-v4, device-only, never sent to server",
  "account_ref": "acc_ + 26 Crockford chars (CTR-ID-001)",
  "command_type": "<resource>.<verb> (CTR-CAP-001 R03), e.g. lst.update",
  "aggregate_id": "CTR-ID-001 entity ID, or null for creation",
  "expected_revision": "integer >= 1, or null for creation",
  "idempotency_key": "^[A-Za-z0-9_-]{16,128}$ (CTR-EVT-001)",
  "schema_version": "SemVer MAJOR.MINOR.PATCH (CTR-SCH-001)",
  "payload_ciphertext": "base64url, AES-256-GCM (see PS-116-07)",
  "payload_digest": "SHA-256 of JCS(payload), 64 hex",
  "max_data_class": "CTR-PRV-001 enum",
  "state": "queued | sending | applied | not_applied | upgrade_required | discarded",
  "attempts": "integer 0..50",
  "next_attempt_at": "RFC 3339 UTC, ms precision, or null",
  "server_ref": "evt_ ID when applied, else null",
  "result_code": "CTR-ERR-001 code when not_applied, else null",
  "created_at": "RFC 3339 UTC, ms", "updated_at": "RFC 3339 UTC, ms"
}
```
Constraints: `state=applied` requires `server_ref`; `state=not_applied` requires `result_code`; `payload_digest` must match decrypted payload on every read.

## Commands / queries / events
Covered in PS-116-04. Entries are not CTR-EVT-001 events; they never leave the device except as the command submitted during replay.

## States & transitions
Defined in PS-116-03. Entry records are created only in `queued`.

## Validation & errors
See PS-116-02. Schema violations at enqueue return `OFFLINE.ENTRY_INVALID` (validation, 400, not retryable).

## Authorization
Entry read and discard are limited to the signed-in `account_ref` on that device (PS-116-05).

## Failure, idempotency, concurrency, offline
Writes use a single IndexedDB transaction per entry. Crash between entry write and send leaves `queued`; replay is safe because of `idempotency_key`.

## Privacy, retention, abuse
Payload is PRIVATE_PERSONAL or FINANCIAL_EVIDENCE at most; LOCATION_PRECISE is never queued unless the user enabled local cache (CTR-PRV-001). Retention RET-EPH: purged on `applied`, on `discarded`, and on logout or account switch after user confirmation (PROVISIONAL, D07 default).

## Observability & budgets
Metrics: `offline_queue_depth{state}`, `offline_queue_bytes`. No payload, no `local_id` in telemetry.

## Tests
- TEST-PS-116-01-01 (unit): entry write precedes send; crash after write leaves `queued`.
- TEST-PS-116-01-02 (property): 10,000 random commands; `(account_ref, idempotency_key)` unique; digest matches payload.
- TEST-PS-116-01-03 (unit): 500-entry and 5 MiB caps enforced; 501st entry refused with `OFFLINE.QUEUE_FULL`.
- TEST-PS-116-01-04 (unit): non-offline-capable command refused at enqueue.
- TEST-PS-116-01-05 (offline): IndexedDB quota error handled without partial entry.

## Acceptance criteria
1. Entry schema validates all fixtures; all invalid fixtures rejected with the code in PS-116-02.
2. No send without persisted entry (TEST-01).
3. Caps match R04 (TEST-03).

## Assumptions & open decisions
- ASSUMPTION: 500 entries and 5 MiB caps; F15 to validate on target devices.
- ASSUMPTION: `local_id` UUID v4 is device-only; CTR-ID-001 registry needs no new prefix.
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
- PROVISIONAL (D07 default, unapproved): RET-EPH purge on acknowledgment.
- OPEN (D10): device key lifecycle that protects `payload_ciphertext`; see PS-116-07.
