# PS-057-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R02, R04, R05, R06 privileged grants, R07 dual control, R08 audit, R10 field visibility), CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-05.R01 | Evidence actions are evaluated on the owning `acc_` of the subject or issuer `prf_`; `prf_` is never a principal. | MVP |
| PS-057-05.R02 | Only the subject, the issuer and mod_reputation (service principal `sys_`, summary scope) can read evidence metadata. | MVP |
| PS-057-05.R03 | Evidence content (≤ 500 cp) readable by subject and issuer only; never by public or service principals. | MVP |
| PS-057-05.R04 | Moderators read evidence only under a case grant and only metadata (kind, state, digest presence), never content, under dual control if any PRIVATE content is included (CTR-CAP-001 R07). | MVP |
| PS-057-05.R05 | Counterparty signing (`counterparty_signed`) requires participant relation derived from owning modules at decision time. | MVP |
| PS-057-05.R06 | Default deny. | MVP |

## Data / schema
Field visibility (CTR-CAP-001 R10):

| Field | public | subject / issuer | sys (reputation) | case (mod_) | never |
|---|---|---|---|---|---|
| `kind`, `state`, `issued_at`, `subject_prf_id` | | Y | Y (summary) | Y | |
| `content`, `content_digest`, `signature` | | Y | | digest presence only | |
| `issuer_ref` | | Y | Y | Y | |

## Commands / queries / events
| Action | Actor | Scope | Result |
|---|---|---|---|
| `evidence.record` | subject or issuer `acc_` | self / participant | allow |
| `evidence.supersede` | original issuer | self | allow |
| `evidence.withdraw` | subject or issuer | self | allow |
| `evidence.read_summary` | `sys_` reputation | global summary | counts only |
| `evidence.read_own` | subject or issuer | self | fields per matrix |
| `evidence.quarantine_decide` | `mod_` | case | allow with case grant |

## States & transitions
Denied actions produce no state change; decision record `dec_` stores outcome only (CTR-CAP-001 R13).

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `SYS.NOT_FOUND` | false | `err.sys.not_found` |
| `SYS.FORBIDDEN` | false | `err.sys.forbidden` |

## Authorization
Relation rules derived at decision time (CTR-CAP-001 R05). Revocation of keys stops new signatures immediately.

## Failure, idempotency, concurrency, offline
Re-authorized on each retry. Offline-held signed evidence is not readable beyond the authenticated session.

## Privacy, retention, abuse
Moderator reads emit `aud_` with `evidence_id`, purpose and decision ID. Reputation service reads counts only.

## Observability & budgets
`evidence_authz_deny_total{action}`; alert on repeated `read_summary` denials.

## Tests
- TEST-PS-057-05-01 (unit): matrix per principal × action × field.
- TEST-PS-057-05-02 (negative): moderator without case grant cannot read content.
- TEST-PS-057-05-03 (integration): reputation service receives counts without content fields (absent, not null).
- TEST-PS-057-05-04 (negative): non-participant cannot record `counterparty_signed`.

## Acceptance criteria
1. Matrix implemented; default deny verified.
2. Content never readable by sys or mod without subject/issuer relation or case grant.
3. Participant relation enforced for counterparty signing.
4. Audit records for all privileged reads.

## Assumptions & open decisions
- ASSUMPTION: reputation service principal `sys_` exists with summary scope (F16 to confirm).
- PROVISIONAL (D10 default, unapproved): key rotation and revocation as stated; user-controlled keys do not change matrix in MVP.
