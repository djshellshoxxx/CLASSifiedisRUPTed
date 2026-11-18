# PS-059-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04 participant scope, R10 field visibility, R11 attachment download), CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-05.R01 | Actions are evaluated on the owning `acc_` of the uploader or viewer `prf_`; `prf_` is never a principal. | MVP |
| PS-059-05.R02 | Only participants of the thread containing the message may download an attachment. Participation derived from mod_private at decision time. | MVP |
| PS-059-05.R03 | Uploader alone may upload into a thread and only until commit. | MVP |
| PS-059-05.R04 | Moderators read attachments only under a case grant, with dual control (PRIVATE_PERSONAL content, CTR-CAP-001 R07), and only for a time-limited purpose. | MVP |
| PS-059-05.R05 | Public access never exists; no link is publicly enumerable. | MVP |
| PS-059-05.R06 | Default deny. | MVP |

## Data / schema
Field visibility (CTR-CAP-001 R10):

| Field | public | participant | uploader | case (mod_, dual control) | never |
|---|---|---|---|---|---|
| content bytes | | via access grant | | via access grant | |
| `mime_type`, `byte_size`, `width`, `height` | | Y | Y | Y | |
| `blob_ref` | | | | | Y |
| `scan_status` | | | Y | Y | |

## Commands / queries / events
| Action | Actor | Scope | Result |
|---|---|---|---|
| `attachment.create` | uploader `acc_` | participant of thread | allow until commit |
| `attachment.read` | participant | thread | access grant |
| `attachment.purge` | `sys_` retention or deleter | self / global | allow |
| `attachment.moderate_read` | `mod_` | case | access grant with purpose and dual control |

## States & transitions
Denied requests make no state change. Decision records `dec_` store outcome only.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `SYS.NOT_FOUND` | false | `err.sys.not_found` |
| `SYS.FORBIDDEN` | false | `err.sys.forbidden` |
| `ATTACH.NOT_AVAILABLE` | depends on state | `err.attach.not_available` |

## Authorization
Relation rules derived from thread participation (CTR-CAP-001 R05). Access grants are bound to `att_id`, viewer `prf_` and expiry ≤ 5 min; revocation of participation invalidates grants at next decision.

## Failure, idempotency, concurrency, offline
Grants re-checked at each byte-range request. Offline access not allowed for attachments in MVP (cache disabled).

## Privacy, retention, abuse
Moderator reads emit `aud_` with `att_id`, purpose, dual-control approvers and decision ID.

## Observability & budgets
`attach_authz_deny_total{action}`; alert on access-grant denials spike for one thread.

## Tests
- TEST-PS-059-05-01 (unit): matrix per principal × action.
- TEST-PS-059-05-02 (negative): non-participant with a valid URL-like ID gets `SYS.NOT_FOUND`.
- TEST-PS-059-05-03 (integration): grant expires at 5 min; replay by another viewer rejected.
- TEST-PS-059-05-04 (negative): moderator read without dual control rejected.

## Acceptance criteria
1. Matrix implemented; default deny verified.
2. No public access path.
3. Grants bound to viewer and expire.
4. Moderator reads dual-controlled and audited.

## Assumptions & open decisions
- PROVISIONAL (D10 default, unapproved): key-based client-side encryption of attachments is not in MVP; server-side encryption at rest is.
- ASSUMPTION: dual control applies to moderator reads of attachments.
