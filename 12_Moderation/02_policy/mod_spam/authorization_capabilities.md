# PS-097-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R03, R04, R06, R08), CTR-PRV-001 (R01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-05.R01 | Capabilities used: `spm.read`, `spm.create` (evaluate, sys_ only), `spm.moderate` (release, reject), `spm.read` for author status. | MVP |
| PS-097-05.R02 | Reviewers need a `mod_` grant with `case:<cas_>` or review scope and `constraints.purpose` = `spam_review`. | MVP |
| PS-097-05.R03 | Only `sys_` may create verdicts; no `acc_`, `ope_` or `mod_` may create one. | MVP |
| PS-097-05.R04 | Message subject verdicts are readable only by `sys_` and by the sender (send-restriction status only). Reviewers never read message verdicts. | MVP |
| PS-097-05.R05 | Operators have no direct write capability; reversals go through `mod_appeals`. | MVP |

## Data / schema
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| `sys_` (classifier) | `spm.create` | any subject | ALLOW |
| `mod_` (grant) | `spm.read` | `case:cas_` or review scope, `lst_` or `srv_` | ALLOW |
| `mod_` (grant) | `spm.moderate` (release, reject) | `case:cas_`/review scope | ALLOW with `expected_revision` |
| `mod_` | any | `msg_` verdict | DENY `SYS.NOT_FOUND` (R04) |
| `acc_` (author) | `spm.read` | own subject | ALLOW: `state` and generic category only |
| `acc_` (other) | any | any | DENY `SYS.NOT_FOUND` |
| `ope_` | `spm.moderate` | any | DENY; ALLOW with dual control only for release of a `rejected` verdict (ASSUMPTION) |

Field visibility (CTR-CAP-001 R10): `feature_hash`, `model_version`, `confidence` = `never` for non-`sys_` actors; `reason_code` = `case` (mapped category to author).

## Commands / queries / events
Reviewer grants carry `expires_at` ≤ 72 h after `not_before`.

## States & transitions
Authorization does not change state.

## Validation & errors
`SYS.NOT_FOUND` for unreadable verdicts (CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Zero-TTL decision cache for writes.

## Privacy, retention, abuse
Reviewer reads of listing content are audited (`aud_` record per read).

## Observability & budgets
Metric `spam_authz_denied_total{capability,actor_kind}`.

## Tests
- `TEST-PS-097-05-01` unit: each matrix row returns its outcome.
- `TEST-PS-097-05-02` negative: `mod_` attempts to read `msg_` verdict → `SYS.NOT_FOUND`.
- `TEST-PS-097-05-03` negative: `acc_` attempts `spm.create` → denied.
- `TEST-PS-097-05-04` negative: author reads `confidence` → field absent.

## Acceptance criteria
1. Only `sys_` creates verdicts.
2. Reviewers cannot read message verdicts.
3. Every reviewer read of content writes an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: reviewer access to message-subject metadata is not needed in MVP; abuse reports for messages go through `mod_flags`.
- D10 (auth and portability), PROVISIONAL default: author status visibility uses the pseudonymous account (unapproved).
