# PS-059-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (PRIVATE_PERSONAL; LOCATION_PRECISE never in metadata; RET-PRIV, RET-EPH, RET-LEGAL), CTR-CAP-001, CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-07.R01 | All EXIF, XMP, GPS and device metadata removed from images before storage (zero tolerance; fixture scan). | MVP |
| PS-059-07.R02 | Attachment bytes and derived thumbnails are PRIVATE_PERSONAL; never in public responses, events, logs, analytics, push or federation. | MVP |
| PS-059-07.R03 | Retention RET-PRIV: 365 days after last access or deletion, whichever first; purge within 24 h of expiry. | MVP |
| PS-059-07.R04 | Encryption at rest with keys held by the platform (AES-256-GCM via audited library, ASSUMPTION); keys rotated annually. | MVP |
| PS-059-07.R05 | Malware scan before availability; hash-based block list of known-bad content (ASSUMPTION list source, F16). | MVP |
| PS-059-07.R06 | Upload rate ≤ 30 files per account per hour; repeated scanner-failed uploads from one account trigger review. | MVP |
| PS-059-07.R07 | Client-side end-to-end encryption of attachments. | Future (D10) |

## Data / schema
| Record | Class | Retention |
|---|---|---|
| attachment bytes (re-encoded) | PRIVATE_PERSONAL | RET-PRIV |
| metadata row | PRIVATE_PERSONAL | RET-PRIV, then count only |
| chunk table | PRIVATE_PERSONAL | 1 h after abandonment |
| scan result | internal | RET-OPS (30 days) |
| audit of moderator reads | internal | RET-AUD |

## Commands / queries / events
Event payloads carry IDs and states only (PS-059-04 R04).

## States & transitions
Purge timers per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Metadata removal is a processing step, not a validation error. Errors carry codes only.

## Authorization
Access by thread participants via short-lived grants only (PS-059-05).

## Failure, idempotency, concurrency, offline
Purge retried until storage confirms deletion. Legal hold (RET-LEGAL) suspends purge for held threads only.

## Privacy, retention, abuse
- **Location leakage:** photos carry GPS by default; stripping (R01) is mandatory and tested. Pixel content can still reveal place; users are warned before sending photos of home (F14 copy).
- **Malware and phishing:** scanning (R05); PDFs with active content rejected; no link previews fetched.
- **Abuse:** rate limits (R06); known-bad hash list; moderator review under dual control.
- **Limit:** the scanner cannot detect all abusive or private images; no guarantee is claimed.

## Observability & budgets
Aggregate counts of uploads, rejections, purges and scan results; no per-file values.

## Tests
- TEST-PS-059-07-01 (privacy): GPS, XMP and device fixtures produce zero metadata in stored output.
- TEST-PS-059-07-02 (retention): purge at 365 days; purge within 24 h of expiry.
- TEST-PS-059-07-03 (abuse): 31st upload in an hour rejected.
- TEST-PS-059-07-04 (security): known-bad hash fixture rejected.

## Acceptance criteria
1. Zero metadata leakage in fixture scan.
2. Purge deadlines met.
3. Rate limits enforced.
4. No attachment in any non-participant response.

## Assumptions & open decisions
- ASSUMPTION: AES-256-GCM server-side encryption; library to be recorded from audited options.
- PROVISIONAL (D07 default, unapproved): RET-PRIV retention.
- PROVISIONAL (D10 default, unapproved): platform-held keys for MVP.
