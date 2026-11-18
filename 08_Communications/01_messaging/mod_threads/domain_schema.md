# PS-061-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`thr_`, `msg_`, `att_`), CTR-EVT-001, CTR-PRV-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-01.R01 | A thread (`thr_`) has exactly 2 participants (`acc_`), distinct. Optional context: `lst_`, `cyc_`, `rnt_`, `dsp_`, or none (direct). Context is fixed at open. | MVP |
| PS-061-01.R02 | A message (`msg_`) is immutable after commit. Correction = new message with `supersedes_id`. Redaction replaces `body_text` with null and keeps the envelope. | MVP |
| PS-061-01.R03 | Attachment (`att_`): size ≤ 10 MiB; MIME ∈ {image/jpeg, image/png, image/webp} (ASSUMPTION; PDF deferred). SHA-256 digest stored. GPS, device and camera EXIF/XMP tags stripped before commit. | MVP |
| PS-061-01.R04 | Body: 1–4000 Unicode scalar values after NFC normalization and trim. ≤ 10 attachments per message. | MVP |
| PS-061-01.R05 | Thread and message each carry `revision` (CTR-EVT-001 R02). Ordering key = (`thr_`, `revision`). | MVP |
| PS-061-01.R06 | Storage keeps `acc_` as sender. Display uses the `prf_` view only. | MVP |
| PS-061-01.R07 | Read receipts and typing indicators are not stored (MVP). | MVP |

## Data / schema
```json
{"thread":{"thread_id":"thr_…","context_type":"listing|cycle|rental|dispute|direct","context_ref":"lst_…|cyc_…|rnt_…|dsp_…|null","participants":["acc_…","acc_…"],"state":"open|archived|locked","revision":1,"opened_at":"RFC3339 ms Z","schema_version":"1.0.0"},
 "message":{"message_id":"msg_…","thread_id":"thr_…","sender":"acc_…","body_text":"string 1..4000 | null if redacted","attachment_ids":["att_…"],"supersedes_id":"msg_…|null","client_key":"16..128 chars","revision":1,"recorded_at":"RFC3339 ms Z","state":"sent|redacted","schema_version":"1.0.0"},
 "attachment":{"attachment_id":"att_…","message_id":"msg_…|null until commit","mime":"image/jpeg|image/png|image/webp","size_bytes":"integer 1..10485760","sha256":"64 hex","stripped_tags":["gps","device","xmp"],"state":"pending|stored|rejected|orphaned","expires_at":"RFC3339 (pending only, +1 h)"}}
```
Constraints: `participants` unique, length 2; `participants` immutable. `body_text` NFC. Data classes: `body_text` and `attachment` content PRIVATE_PERSONAL; thread metadata PSEUDONYMOUS; `context_ref` PSEUDONYMOUS.

## Commands / queries / events
See [PS-061-04](commands_queries_events.md). Schema IDs: `thread.v1`, `message.v1`, `attachment.v1`.

## States & transitions
See [PS-061-03](workflow_state_machine.md).

## Validation & errors
See [PS-061-02](validation_rules.md). Error module slug: `THREADS`.

## Authorization
Owner and participant rules are in [PS-061-05](authorization_capabilities.md). Schema itself carries no authorization logic.

## Failure, idempotency, concurrency, offline
Schema rows are written only through the commit path in [PS-061-06](failure_recovery_idempotency.md). Partial rows (`attachment.state = pending`) never appear in a message.

## Privacy, retention, abuse
Retention class RET-PRIV for `body_text` and attachment content; RET-ACC for thread metadata. See [PS-061-07](privacy_retention_abuse.md).

## Observability & budgets
Schema validation failures counted by `threads_schema_reject_total{schema}`. No field values logged.

## Tests
- TEST-PS-061-01-01 (unit): schema accepts the valid examples; rejects `participants` length ≠ 2 and duplicate `acc_`.
- TEST-PS-061-01-02 (unit): EXIF fixture with GPS tag → `stripped_tags` contains `gps`, stored bytes have no GPS tag.
- TEST-PS-061-01-03 (property): `revision` strictly increments by 1 per committed write.

## Acceptance criteria
1. TEST-PS-061-01-01 to -03 pass.
2. No schema field of `acc_` type appears in an outbound view (checked in [PS-061-07](privacy_retention_abuse.md)).

## Assumptions & open decisions
- ASSUMPTION: attachment MIME set and 10 MiB cap (MVP). PDF scanning deferred.
- ASSUMPTION: EXIF stripping is complete for the three tag families listed; verified by fixture only.
- PENDING CTR-ID-001 confirmation that `thr_`, `msg_`, `att_` are registered to F08 owner `mod_threads`.
- D07 (retention): PROVISIONAL (D07 default, unapproved) — RET-PRIV 365 days.
