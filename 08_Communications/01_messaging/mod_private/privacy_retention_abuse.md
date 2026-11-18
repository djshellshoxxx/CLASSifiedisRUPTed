# PS-060-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (PRIVATE_PERSONAL; R10 previews; RET-PRIV, RET-EPH, RET-AUD, RET-LEGAL), CTR-CAP-001, CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-07.R01 | Bodies are PRIVATE_PERSONAL; never in public responses, events, logs, analytics, push previews (default), federation or search. | MVP |
| PS-060-07.R02 | Retention RET-PRIV: bodies purged 365 days after last access or deletion, whichever first; purge within 24 h. | MVP |
| PS-060-07.R03 | Messages are encrypted at rest on the server (platform-held keys, ASSUMPTION); transport TLS only. The UI states that messages are not end-to-end encrypted in MVP. | MVP |
| PS-060-07.R04 | No typing indicators, presence, device identifiers or IP addresses stored with messages. | MVP |
| PS-060-07.R05 | Blocked users cannot discover the blocker's activity; block records are owner-only. | MVP |
| PS-060-07.R06 | Rate limits and contact limits (PS-060-02 R05) apply to every new relationship. | MVP |
| PS-060-07.R07 | End-to-end encrypted messaging. | Future (D10 key design) |

## Data / schema
| Record | Class | Retention |
|---|---|---|
| message body and thread | PRIVATE_PERSONAL | RET-PRIV |
| contact requests (pending) | PSEUDONYMOUS | 30 days, then deleted |
| per-participant thread state | PRIVATE_PERSONAL | RET-PRIV |
| blocks | PSEUDONYMOUS | RET-ACC |
| device queue | PRIVATE_PERSONAL (local) | RET-EPH |
| moderator read record | internal | RET-AUD |

## Commands / queries / events
Event payloads carry IDs only (PS-060-04 R03). Push generic (R04).

## States & transitions
Retention clocks per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Contact-pattern checks are not applied to message bodies in MVP (ASSUMPTION) because users share contact details voluntarily; abuse controls rely on blocks, reports and rate limits.

## Authorization
Participant-only (PS-060-05).

## Failure, idempotency, concurrency, offline
Purge jobs idempotent; legal hold suspends purge for held threads only.

## Privacy, retention, abuse
- **Unsolicited contact:** eligibility rule (PS-060-03 R02), contact requests limited (PS-060-02 R05).
- **Harassment and scams:** block (immediate), report to F12 (`rpt_`), moderator reads under dual control.
- **Metadata:** timing of messages reveals activity; not hidden in MVP; no typing or read data by default.
- **Limit:** the platform can read bodies it stores (not E2E); this is disclosed and not claimed as private from the platform.
- **Off-platform exposure:** recipients can copy messages; no recall guarantee.

## Observability & budgets
Aggregate counts of messages, blocks, reports, purges; no content.

## Tests
- TEST-PS-060-07-01 (privacy scan): bodies absent from events, logs, push, metrics.
- TEST-PS-060-07-02 (retention): purge at 365 days; purge within 24 h.
- TEST-PS-060-07-03 (abuse): contact limit and block flows.
- TEST-PS-060-07-04 (a11y): UI states the non-E2E disclosure (copy review F14).

## Acceptance criteria
1. Zero body occurrences outside participant responses.
2. Retention verified.
3. Non-E2E disclosure present in UI copy.
4. Rate and contact limits enforced.

## Assumptions & open decisions
- ASSUMPTION: no contact-pattern scanning of bodies in MVP.
- PROVISIONAL (D10 default, unapproved): platform-held keys; E2E deferred.
- PROVISIONAL (D07 default, unapproved): RET-PRIV retention.
