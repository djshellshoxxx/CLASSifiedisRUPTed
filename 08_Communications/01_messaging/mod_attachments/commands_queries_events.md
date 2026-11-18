# PS-059-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03, envelope), CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (`attachment.*`), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-04.R01 | Upload commands carry `idempotency_key`; `UploadChunk` also carries `chunk_index` and `chunk_sha256`. | MVP |
| PS-059-04.R02 | `InitiateUpload` p95 ≤ 200 ms; `CompleteUpload` returns `scanning` within 300 ms. | MVP |
| PS-059-04.R03 | Download is a server-authorized stream or a short-lived URL (≤ 5 min) bound to `att_id` and viewer; no permanent URLs. | MVP |
| PS-059-04.R04 | Events carry `att_id`, `msg_id`, state, revision; no MIME type or size. | MVP |
| PS-059-04.R05 | Schema IDs `attachment.uploaded`, `attachment.scan_passed`, `attachment.scan_failed`, `attachment.purged` at 1.0.0. | MVP |
| PS-059-04.R06 | Resumable uploads across devices. | Future |

## Data / schema
| Command | Payload | Error codes |
|---|---|---|
| `InitiateUpload` | `thread_id`, `declared_mime` (advisory), `declared_size`, `idempotency_key` | `QUOTA_EXCEEDED`, `TYPE_NOT_ALLOWED`, `SYS.FORBIDDEN` |
| `UploadChunk` | `att_id`, `chunk_index`, `chunk_sha256`, bytes | `TOO_LARGE`, `SYS.NOT_FOUND` |
| `CompleteUpload` | `att_id`, `expected_revision` | `IMAGE_INVALID`, `PDF_ACTIVE_CONTENT`, `TYPE_NOT_ALLOWED` |
| `PurgeAttachment` | `att_id`, reason enum (`deleted_for_all`, `retention`, `abandoned`) | `NOT_AVAILABLE` |

Query: `GetAttachmentAccess(att_id)` returns a short-lived access grant for thread participants only.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate `InitiateUpload` with same key returns same `att_id`. Chunk replays with same hash are no-ops; different hash for same index → `ATTACH.CHUNK_CONFLICT` (non-retryable). Offline upload held in device queue (D08 PROVISIONAL) with size cap 25 MiB total.

## Privacy, retention, abuse
Event payloads carry no file metadata. Access grants logged to audit with `att_id` and purpose only.

## Observability & budgets
`attach_cmd_total{command,result}`; no `att_id` labels.

## Tests
- TEST-PS-059-04-01 (contract): payloads validate.
- TEST-PS-059-04-02 (integration): duplicate initiate returns same `att_id`.
- TEST-PS-059-04-03 (negative): conflicting chunk returns `CHUNK_CONFLICT`.
- TEST-PS-059-04-04 (integration): access grant expires at 5 min and is not reusable by another viewer.

## Acceptance criteria
1. Commands, queries and events implemented as listed.
2. Idempotency and chunk integrity verified.
3. No permanent download URLs exist.
4. Event lint passes.

## Assumptions & open decisions
- ASSUMPTION: `aggregate_type = attachment` registered in CTR-SCH-001.
- PROVISIONAL (D08 default, unapproved): offline queue until relay acknowledgment.
