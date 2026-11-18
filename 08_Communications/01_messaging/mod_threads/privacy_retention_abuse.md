# PS-061-07 — privacy retention abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, RET-PRIV, R10 previews, R12 deletion record), CTR-CAP-001, CTR-EVT-001 (R06 no identifiers beyond IDs)

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-07.R01 | `body_text` and attachment content are PRIVATE_PERSONAL. Never in events, logs, analytics, federation or push. | MVP |
| PS-061-07.R02 | Push previews show "New message" only; no sender name or body (CTR-PRV-001 R10). | MVP |
| PS-061-07.R03 | Attachment EXIF/XMP GPS and device tags removed before storage; verified by fixture. | MVP |
| PS-061-07.R04 | No read receipts or typing indicators stored (PS-061-01 R07). | MVP |
| PS-061-07.R05 | Retention RET-PRIV: 365 days after last access or account deletion, whichever first. Deletion propagates within 24 h (CTR-PRV-001 R06). | MVP |
| PS-061-07.R06 | Abuse: repeated identical bodies sent to ≥ 5 distinct accounts within 1 h restricts sender to `THREADS.FIRST_CONTACT_LIMIT` for 24 h (ASSUMPTION). | MVP |
| PS-061-07.R07 | Report action creates an F12 report (`rpt_`) referencing `msg_` IDs; the report carries the reported content only inside the case scope. | MVP |

## Data / schema
Data classes: `message.body_text` PRIVATE_PERSONAL; `attachment.content` PRIVATE_PERSONAL; `attachment.sha256` PSEUDONYMOUS; `thread.context_ref` PSEUDONYMOUS. Field classes are registered in CTR-SCH-001 for `message.v1`.

## Commands / queries / events
Deletion emits `record.deleted` with IDs and counts only (CTR-PRV-001 R12). Report creation is handled by F12; this module emits `message.reported` with `message_id` only.

## States & transitions
Retention: `active` → `expired` (RET-PRIV reached or deletion requested) → `purged` (≤ 24 h). `legal_hold` (CTR-PRV-001 R07) overrides expiry for threads under a `cas_` or `dsp_`.

## Validation & errors
Abuse-limit responses use `THREADS.FIRST_CONTACT_LIMIT` ([PS-061-02](validation_rules.md)). No response reveals why a restriction exists.

## Authorization
Case-scoped reads only ([PS-061-05](authorization_capabilities.md)). Deleted-account counterparties see tombstone "Account removed" in threads.

## Failure, idempotency, concurrency, offline
Deletion is idempotent per account. Search indexes and attachment caches are purged with the same 24 h SLO.

## Privacy, retention, abuse
Threat list: (1) content leakage via push and notification previews; (2) EXIF location leakage (metadata stripping, R03); (3) timing metadata between accounts (not hidden in MVP; documented residual risk); (4) mass-messaging spam (R06); (5) moderator over-reach (case scope, R07). Pseudonyms do not guarantee anonymity: counterpart can correlate by content and timing.

## Observability & budgets
Logs: pseudonymous IDs and codes only. Metrics: `threads_abuse_restrict_total`, `threads_report_created_total`. Alert: any log line containing `body_text` (log redaction test in CI).

## Tests
- TEST-PS-061-07-01 (privacy): push payload for new message equals the generic string; contains no sender or body.
- TEST-PS-061-07-02 (privacy): fixture photo with GPS → stored bytes have no GPS tag (also PS-061-01 TEST-02).
- TEST-PS-061-07-03 (retention): RET-PRIV expiry job purges messages and attachments within 24 h in staging clock.
- TEST-PS-061-07-04 (abuse): duplicate body to 5 accounts in 1 h → sender restricted for 24 h.
- TEST-PS-061-07-05 (logs): synthetic body string never appears in captured logs during send, error and report paths.

## Acceptance criteria
1. Zero body text in events, logs or push payloads (TEST-PS-061-07-01, -05).
2. Retention purge meets 24 h in staging (TEST-PS-061-07-03).

## Assumptions & open decisions
- D07 (retention): PROVISIONAL (D07 default, unapproved) — RET-PRIV 365 days.
- D05 (geoprivacy): not applicable to message content; EXIF stripping is the only location control here.
- ASSUMPTION: abuse thresholds (5 accounts, 1 h, 24 h restriction) pending F12 review.
