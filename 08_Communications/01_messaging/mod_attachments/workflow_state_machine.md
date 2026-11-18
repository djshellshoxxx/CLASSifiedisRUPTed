# PS-059-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-ERR-001, CTR-CAP-001 (R11), CTR-PRV-001 (RET-PRIV).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-03.R01 | Upload states: `uploading`, `scanning`, `available`, `rejected`, `purged`. `available` only after scan `passed`. | MVP |
| PS-059-03.R02 | Attachment is downloadable only in `available` and only while its message is not deleted for all. | MVP |
| PS-059-03.R03 | Message deletion-for-all moves attachments to `purged` within 24 h. | MVP |
| PS-059-03.R04 | Retention purge moves `available` → `purged` after RET-PRIV period (PS-059-07). | MVP |
| PS-059-03.R05 | Abandoned uploads (no `CompleteUpload` within 1 h) move to `rejected` and their bytes are deleted. | MVP |
| PS-059-03.R06 | Re-scan of `available` attachments when signature database updates. | Future (requires ops decision) |

## Data / schema
`attachment_state` enum closed: `uploading`, `scanning`, `available`, `rejected`, `purged`.

## Commands / queries / events
`InitiateUpload`, `UploadChunk`, `CompleteUpload`, `CommitWithMessage` (called by mod_private), `PurgeAttachment`; events `attachment.uploaded`, `attachment.scan_passed`, `attachment.scan_failed`, `attachment.purged`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `InitiateUpload` | quota ok, uploader is `prf_` in thread | `uploading` | reserve quota |
| `uploading` | `CompleteUpload` | size and sniffing pass | `scanning` | event `attachment.uploaded` |
| `uploading` | timeout 1 h | — | `rejected` | bytes deleted |
| `scanning` | scan passed | — | `available` | event `attachment.scan_passed` |
| `scanning` | scan failed | — | `rejected` | event `attachment.scan_failed`; bytes deleted |
| `available` | message deleted for all | — | `purged` | bytes deleted within 24 h |
| `available` | retention | RET-PRIV | `purged` | bytes deleted |

## Validation & errors
Codes in [validation_rules.md](validation_rules.md); state errors: `ATTACH.NOT_AVAILABLE` (retryable false for purged; true while scanning).

## Authorization
Transitions by uploader (up to `scanning`) and `sys_` scanner/purge jobs.

## Failure, idempotency, concurrency, offline
- Chunked upload resumes from last committed chunk; `UploadChunk` idempotent per chunk index.
- Scanner timeout retries with backoff; after 3 failures, `rejected` with `scan_failed` reason `scanner_unavailable` (not passed).
- Purge is idempotent; storage delete retried until confirmed.

## Privacy, retention, abuse
Rejected bytes deleted; metadata kept only for audit counts.

## Observability & budgets
`attach_transition_total{from,to}`; scan queue lag p95 ≤ 30 s.

## Tests
- TEST-PS-059-03-01 (unit): transition table complete.
- TEST-PS-059-03-02 (integration): unscanned attachment never downloadable.
- TEST-PS-059-03-03 (integration): deletion-for-all purges within 24 h.
- TEST-PS-059-03-04 (fault): scanner down → no `available` transition.

## Acceptance criteria
1. No path reaches `available` without `passed`.
2. Purge deadlines met.
3. Abandoned uploads removed within 1 h.
4. Scanner outage fails closed.

## Assumptions & open decisions
- ASSUMPTION: 1 h upload timeout; 24 h purge after deletion.
- PROVISIONAL (D07 default, unapproved): RET-PRIV retention.
