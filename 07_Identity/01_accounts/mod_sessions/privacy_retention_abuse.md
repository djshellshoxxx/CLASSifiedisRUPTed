# PS-054-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-07.R01 | Device label and network digest visible to owner only. Never in logs, events or analytics. | MVP |
| PS-054-07.R02 | Keyed-hash key for network context rotated every 90 days; old digests are not re-keyed (they expire with the session). | MVP |
| PS-054-07.R03 | Session creation limit 10 per account per 10 min; failed proof limit 5 per account per 15 min, then 15 min lock (ASSUMPTION). | MVP |
| PS-054-07.R04 | New-device login triggers notice to all verified contacts with generic text and a "this was not me" link that revokes the session. | MVP |
| PS-054-07.R05 | Credential-stuffing signals (many accounts, one network digest) feed F12 signals; they do not reveal account existence. | MVP |

## Data / schema
Classes: tokens SECRET; device label PRIVATE_PERSONAL; network digest PSEUDONYMOUS; end_reason PSEUDONYMOUS.

## Commands / queries / events
Notice template key `session.new_device` with `ses_` ID only.

## States & transitions
The "this was not me" path is `revoked` with `end_reason = revoked_by_user` and a family revoke; see [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Limit breaches return `SYS.RATE_LIMITED` (429) with `Retry-After`, identical for known and unknown accounts.

## Authorization
Support cannot read device or network data (PS-054-05.R04).

## Failure, idempotency, concurrency, offline
Not applicable beyond PS-054-06.

## Privacy, retention, abuse
| Data | Class | Retention |
|---|---|---|
| session row (ended) | PSEUDONYMOUS | 30 days (RET-OPS) |
| token digests | SECRET | purged 30 days after end (RET-SEC) |
| device label | PRIVATE_PERSONAL | 30 days after end (RET-OPS) |
| end events | PSEUDONYMOUS | 12 months (RET-AUD) |
Abuse controls: rate limits above, lock on repeated failures, F12 signal feed.

## Observability & budgets
Logs: `ses_` ID, code, truncated digest prefix. Never token, device label or full digest.

## Tests
TEST-PS-054-15 (log scan), TEST-PS-054-16 (rate and lock thresholds), TEST-PS-054-17 (new-device notice and one-click revoke).

## Acceptance criteria
1. Zero token or device-label occurrences in logs and events.
2. Lock and rate thresholds enforced identically for known and unknown accounts.

## Assumptions & open decisions
- ASSUMPTION: limits above.
- PROVISIONAL (D07 default, unapproved): retention above.
