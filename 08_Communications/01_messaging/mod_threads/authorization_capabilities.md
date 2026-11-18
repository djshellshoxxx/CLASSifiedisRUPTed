# PS-061-05 — authorization capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (action vocabulary, scopes, decision records), CTR-PRV-001 (field visibility classes), CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-05.R01 | Every action in the matrix below is evaluated server-side with default deny (CTR-CAP-001 R01). | MVP |
| PS-061-05.R02 | Thread access uses the `participant` scope; message and attachment access inherit it. | MVP |
| PS-061-05.R03 | Counterparty `acc_` is never returned. Only the `prf_` view is returned (CTR-CAP-001 R02). | MVP |
| PS-061-05.R04 | Non-participants receive `SYS.NOT_FOUND` for every thread, message and attachment ID (CTR-ERR-001 R08). | MVP |
| PS-061-05.R05 | `thr.lock` is granted only to principal `sys_` (dispute resolver) or `mod_` with `case` scope and `cas_` ID. | MVP |
| PS-061-05.R06 | Attachment download URLs are signed, single-principal and valid ≤ 300 s (ASSUMPTION). | MVP |

## Data / schema
Capability vocabulary used: `thr.read`, `thr.create`, `thr.archive`, `thr.lock`, `thr.unlock`, `msg.read`, `msg.send`, `msg.redact`, `att.read`, `att.create`, `thr.export`.

## Commands / queries / events
Decision records (`dec_`) are written for every denial of a privileged action and for `thr.lock`/`thr.unlock` (CTR-CAP-001 R08).

## States & transitions
Relation rules are derived from thread participants at decision time (CTR-CAP-001 R05). Removing a participant is not a supported transition in MVP.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| user (participant) | thr.read, msg.read, msg.send | own thread, thread open | ALLOW (rule: participant) |
| user (participant) | msg.send | thread archived or locked | DENY (STATE_FORBIDS) |
| user (author) | msg.redact | own message | ALLOW (rule: owner) |
| user (other participant) | msg.redact | message by counterparty | DENY (SCOPE_MISMATCH) |
| user (non-participant) | thr.read | thread | DENY → SYS.NOT_FOUND |
| sys_ (dispute resolver) | thr.lock | thread with `dsp_` | ALLOW (grant) |
| mod_ (case scope, grant) | thr.lock | thread in `cas_` | ALLOW (grant, purpose required) |
| mod_ (no grant) | msg.read | any | DENY → SYS.NOT_FOUND |
| user (participant) | thr.export | own data | ALLOW (rule: self), counterparty redacted |

Field visibility: `body_text` = participant; `sender` = participant as `prf_`; `redacted` body = `never`.

## Validation & errors
Denial codes from CTR-CAP-001 mapped to `SYS.FORBIDDEN` or `SYS.NOT_FOUND` per R04 above.

## Failure, idempotency, concurrency, offline
Authorization is re-evaluated at commit. A participant removed or a thread locked between send and commit causes rejection (see [PS-061-06](failure_recovery_idempotency.md)). Decision cache TTL zero for writes (CTR-CAP-001 R09).

## Privacy, retention, abuse
Decision records hold no content (CTR-CAP-001 R13). Case-scoped moderator reads are logged in `aud_` with case ID and purpose.

## Observability & budgets
Metric `threads_authz_denied_total{action,reason_code}`. Alert on > 20 denials per principal per hour (ASSUMPTION).

## Tests
- TEST-PS-061-05-01 (matrix): every row of the authorization table produces the stated outcome and code.
- TEST-PS-061-05-02 (negative): guessed `msg_` IDs from another thread return `SYS.NOT_FOUND`, identical body and timing class to a nonexistent ID.
- TEST-PS-061-05-03 (negative): a `mod_` without grant cannot read messages; with a grant for another case cannot read this case's thread.
- TEST-PS-061-05-04 (privacy): counterparty `acc_` absent from every response (grep across fixtures).

## Acceptance criteria
1. Matrix rows pass (TEST-PS-061-05-01).
2. No `acc_` of counterparty appears in any non-audit response (TEST-PS-061-05-04).

## Assumptions & open decisions
- ASSUMPTION: 300 s signed attachment URL lifetime.
- OPEN: moderator read purposes list (owned by F16; see CTR-CAP-001).
- Related: CTR-CAP-001 R04 case scope; F12 Trust&Safety reviews moderator grants.
