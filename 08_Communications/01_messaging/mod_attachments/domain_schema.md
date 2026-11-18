# PS-059-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`att` opaque, `msg` and `thr` owned by F08), CTR-PRV-001 (PRIVATE_PERSONAL: attachment content; RET-PRIV), CTR-SCH-001, CTR-CAP-001 (R11 attachment download), CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-01.R01 | Each `att_` row belongs to exactly one `msg_` ID (NOT NULL once message is committed) and one uploader `prf_`. | MVP |
| PS-059-01.R02 | Stored content is an encrypted blob reference plus metadata; original bytes are never served without re-encoding (PS-059-02 R04). | MVP |
| PS-059-01.R03 | Metadata stored: MIME type after sniffing, byte size, pixel dimensions (images), SHA-256 of stored blob, scan status. No file name retained unless sanitized ≤ 100 chars. | MVP |
| PS-059-01.R04 | Max 5 attachments per message; max 10 MB per attachment; 25 MB total per message (ASSUMPTION). | MVP |
| PS-059-01.R05 | Schema `messaging.attachment` 1.0.0 registered in CTR-SCH-001. | MVP |
| PS-059-01.R06 | Video, audio and arbitrary documents. | Future (needs new scan and transcoding decisions) |

## Data / schema
| Field | Type | Constraint | Class |
|---|---|---|---|
| `att_id` | string(30) | prefix `att`, opaque class | PRIVATE_PERSONAL |
| `msg_id` | string(30) | prefix `msg`, FK, set on message commit | PRIVATE_PERSONAL |
| `uploader_prf_id` | string(30) | prefix `prf` | PSEUDONYMOUS, participant only |
| `mime_type` | enum closed | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` (ASSUMPTION) | PRIVATE_PERSONAL |
| `byte_size` | int | 1 ≤ n ≤ 10,485,760 | PRIVATE_PERSONAL |
| `width`, `height` | int | 1–8,000 (images only) | PRIVATE_PERSONAL |
| `blob_ref` | string | opaque storage key, not derivable from `att_id` | SECRET-adjacent (internal) |
| `content_sha256` | string(64) | hex, of stored (re-encoded) bytes | PRIVATE_PERSONAL |
| `scan_status` | enum | `pending`, `passed`, `failed` | internal |
| `created_at`, `purged_at` | timestamp | RFC 3339 UTC, ms | PRIVATE_PERSONAL |

## Commands / queries / events
Schema reference; see [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Lifecycle in [workflow_state_machine.md](workflow_state_machine.md): `uploading` → `scanning` → `available` or `rejected`; `available` → `purged`.

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Download only for thread participants (PS-059-05).

## Failure, idempotency, concurrency, offline
Upload is resumable with an idempotency key; see PS-059-06.

## Privacy, retention, abuse
Content is PRIVATE_PERSONAL; retention RET-PRIV; EXIF and location metadata are removed before storage (PS-059-07).

## Observability & budgets
Counts by MIME type and scan status; no names or sizes per user. See PS-059-08.

## Tests
- TEST-PS-059-01-01 (unit): every field constraint; over-limit rejected.
- TEST-PS-059-01-02 (contract): schema digest registered.
- TEST-PS-059-01-03 (negative): `file name` longer than 100 characters truncated and sanitized.
- TEST-PS-059-01-04 (integration): `att_` row cannot exist without a message commit or pending upload state.

## Acceptance criteria
1. Every stored attachment has exactly one message and uploader.
2. No stored field holds location or metadata from source files.
3. Blob keys are not derivable from IDs.
4. Limits enforced in database and API.

## Assumptions & open decisions
- ASSUMPTION: MIME allowlist limited to images and PDF; SVG and HTML are never accepted.
- PROVISIONAL (D07 default, unapproved): RET-PRIV retention.
