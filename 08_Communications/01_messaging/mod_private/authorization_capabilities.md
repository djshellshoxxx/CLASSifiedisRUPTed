# PS-060-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R02, R04 participant, R05, R07, R10, R11), CTR-PRV-001 (PRIVATE_PERSONAL), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-05.R01 | Actions evaluated on the owning `acc_` of a participant `prf_`; `prf_` is never a principal. | MVP |
| PS-060-05.R02 | Only the two participants of a thread may read its messages, states or attachments. | MVP |
| PS-060-05.R03 | No public, search-engine or federated read path exists for messages. | MVP |
| PS-060-05.R04 | Operators have no read access to message bodies. Moderators read a reported thread only under case grant with dual control, and only the reported messages plus three messages of context (ASSUMPTION). | MVP |
| PS-060-05.R05 | Relation rule for `StartThread` derived from owning modules' events at decision time (CTR-CAP-001 R05). | MVP |
| PS-060-05.R06 | Default deny. | MVP |

## Data / schema
Field visibility (CTR-CAP-001 R10):

| Field | public | participant | sys (retention) | case (mod_, dual control) | never |
|---|---|---|---|---|---|
| `body`, `sent_at`, `sender_prf_id` | | Y | | reported messages only | |
| `thread_state`, per-participant state | | own only | | | other participant's state |
| thread IDs and counts | | Y | Y (aggregate) | | |

## Commands / queries / events
| Action | Actor | Scope | Result |
|---|---|---|---|
| `thread.open` | participant | relation | allow with R02 eligibility |
| `message.send` | participant | thread | allow when open |
| `message.read` | participant | thread | allow |
| `message.delete_for_all` | sender | own message | allow within window |
| `thread.block` | participant | thread | allow |
| `message.moderate_read` | `mod_` | case | reported messages only, dual control |
| `message.retain_purge` | `sys_` | global | purge only, no read |

## States & transitions
Denied actions produce no state change; decision records store outcome only.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `SYS.NOT_FOUND` | false | `err.sys.not_found` |
| `SYS.FORBIDDEN` | false | `err.sys.forbidden` |
| `PRIVMSG.NOT_ELIGIBLE` | false | `err.privmsg.not_eligible` |

Non-participants and blocked users receive `SYS.NOT_FOUND` for thread reads (CTR-ERR-001 R08).

## Authorization
Relation rules derived at decision time; revocation of a block takes effect at next decision (zero cache, CTR-CAP-001 R09).

## Failure, idempotency, concurrency, offline
Re-authorized each retry. Local message cache only while session is authenticated; purged at logout.

## Privacy, retention, abuse
Moderator reads emit `aud_` with `msg_id` list, purpose and approvers. Operators never read bodies; retention jobs never decrypt or read bodies beyond deletion.

## Observability & budgets
`privmsg_authz_deny_total{action}`; alert on mass `message.read` denials from one account.

## Tests
- TEST-PS-060-05-01 (unit): matrix per principal × action.
- TEST-PS-060-05-02 (negative): third party cannot read thread; response identical to non-existent thread.
- TEST-PS-060-05-03 (integration): block removes read for next request.
- TEST-PS-060-05-04 (negative): moderator read outside reported messages rejected.

## Acceptance criteria
1. Matrix implemented; default deny verified.
2. Non-participant responses indistinguishable from missing thread.
3. Moderator reads limited to reported messages under dual control.
4. Operators cannot read bodies.

## Assumptions & open decisions
- ASSUMPTION: three messages of context for moderator reads.
- PROVISIONAL (D10 default, unapproved): key handling and E2E not in MVP; operator no-read rule holds without E2E.
