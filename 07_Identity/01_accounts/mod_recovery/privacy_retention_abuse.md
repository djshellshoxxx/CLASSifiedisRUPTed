# PS-053-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-07.R01 | Recovery never discloses the account's contact address, region cell or home location to the requester. | MVP |
| PS-053-07.R02 | Enumeration resistance: identical responses for known and unknown accounts (PS-053-02.R01). | MVP |
| PS-053-07.R03 | Max 3 OTP sends per contact address per hour and 10 `start` calls per account hint per 24 h (ASSUMPTION). | MVP |
| PS-053-07.R04 | Every recovery start notifies all verified contacts and active sessions with generic text ("A recovery was requested. Cancel if this was not you."). | MVP |
| PS-053-07.R05 | Recovery codes are shown once at enrolment and never again. | MVP |
| PS-053-07.R06 | Requester IP is never stored raw; coarse network prefix is keyed-hashed (CTR-PRV-001 R09). | MVP |

## Data / schema
Data classes: codes and OTP = SECRET; contact address = PRIVATE_PERSONAL; `requester_ctx_digest` = PSEUDONYMOUS; `rec_` state = PSEUDONYMOUS.

## Commands / queries / events
Notification payloads: template key and `rec_` ID only.

## States & transitions
Cancel path is the user's defence against takeover; see [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Abuse-triggered rejections return `MOD_RECOVERY.LOCKED` (429) without revealing whether the account exists.

## Authorization
Support staff cannot see contact addresses or codes (PS-053-05.R03).

## Failure, idempotency, concurrency, offline
Not applicable beyond PS-053-06.

## Privacy, retention, abuse
| Data | Class | Retention |
|---|---|---|
| recovery_request row | PSEUDONYMOUS | 30 days (RET-OPS) |
| OTP HMAC | SECRET | purged at expiry or use (RET-EPH) |
| recovery_method secret_hash | SECRET | until rotated; purged 30 days after revoke (RET-SEC) |
| contact_enc | PRIVATE_PERSONAL | account lifetime (RET-ACC) |
Threats addressed: social engineering of contact channel (cooldown + notice + cancel), SIM or mailbox takeover (warn at enrolment; recommend codes), brute force (lock), enumeration (uniform response), notification spam (send caps).

## Observability & budgets
Logs: `rec_` ID, state, method, code. Never contact, code, OTP.

## Tests
TEST-PS-053-15 (log scan for contact and code strings), TEST-PS-053-16 (send caps), TEST-PS-053-17 (IP not stored).

## Acceptance criteria
1. Zero occurrences of test contact addresses or codes in logs and events.
2. Caps enforced at the configured thresholds.

## Assumptions & open decisions
- ASSUMPTION: caps and retention above.
- PROVISIONAL (D07 default, unapproved): per-category retention.
