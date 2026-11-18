# PS-086-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01 default deny, R02 principals, R04 scopes including `case:`, R06–R08 privileged and audit, R10 field visibility), CTR-FED-001 (peer trust transitions), CTR-ERR-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-05.R01 | Default deny. Conflict records are visible only to federation stewards (`ope_` with `federation_conflict.read`) and to a `mod_` principal through an open `case:<cas_>` link. | MVP |
| PS-086-05.R02 | Only a distinct second `ope_` can approve a restore after equivocation. Self-approval returns `CAP.SELF_APPROVAL_FORBIDDEN`. | MVP |
| PS-086-05.R03 | Equivocation review is performed by the Platform Lead role or a delegate. F12 reviewers see a case-linked record only (ASSUMPTION; agreement pending, module TODO). | MVP |
| PS-086-05.R04 | Raw evidence bytes are readable only by stewards with `federation_conflict.evidence_read`, which is granted per record for a stated purpose and expires within 72 h (CTR-CAP-001 R06). Each read writes an `aud_` record. | MVP |
| PS-086-05.R05 | Peers (`fpr_`) can never read conflict records about themselves or others. A quarantined peer receives only the generic rejection code. | MVP |

## Data / schema
Actions per CTR-CAP-001 vocabulary:

| Capability | Verb | Resource | Principal |
|---|---|---|---|
| `federation_conflict.open` | create | conflict record | `sys_` ingress |
| `federation_conflict.read` | read | conflict record (no bytes) | `ope_` steward; `mod_` with `case:` scope |
| `federation_conflict.evidence_read` | read (privileged) | raw bytes | `ope_` steward, per record, dual control |
| `federation_conflict.review` | accept | review decision | `ope_` steward, distinct approvers |
| `federation_conflict.close` | update | conflict status | `ope_` steward |

## Authorization matrix
| Actor | Action | Resource | Decision |
|---|---|---|---|
| `sys_` ingress | open | conflict | allow |
| `ope_` steward | read | record, no bytes | allow |
| `ope_` steward | evidence_read | raw bytes | allow with per-record grant and second approver |
| `ope_` steward | review / close | conflict | allow; restore needs second distinct `ope_` |
| `mod_` moderator | read | record, `case:` scope only | allow when linked case is open |
| `mod_` moderator | evidence_read | raw bytes | deny |
| `fpr_` peer | any | any conflict | deny |
| `acc_` user | any | any conflict | deny |

## Field visibility (CTR-CAP-001 R10)
| Field | Visibility |
|---|---|
| `cfl_id`, `kind`, `status`, `opened_at`, `revision` | `case` (stewards and linked moderators) |
| `origin_node`, `delivered_by_fpr`, digests, event IDs | `case` |
| `aggregate_id` | `case` |
| `evidence_bytes_ref` | `never` via read APIs |
| Raw bytes | `never` except through `evidence_read` |

## Validation & errors
Denials return `SYS.NOT_FOUND` where the record must not be revealed (CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Grants expire at their stated time. Revocation applies at the next decision (CTR-CAP-001 R09). Review and close are idempotent with the command key (PS-086-04).

## Privacy, retention, abuse
All privileged reads are audited. Reads without a case link by a moderator are refused.

## Observability & budgets
`fed_conflict_read_total{principal_type,field_class}`. Alert on evidence reads outside an open review.

## Tests
- TEST-PS-086-05-01 (unit): matrix rows return the stated decision.
- TEST-PS-086-05-02 (integration): steward self-approval of restore refused.
- TEST-PS-086-05-03 (integration): `mod_` read without open case refused with `SYS.NOT_FOUND`.
- TEST-PS-086-05-04 (integration): evidence read creates an `aud_` record; expired grant refused.
- TEST-PS-086-05-05 (negative): peer querying its own conflict receives only generic rejection.

## Acceptance criteria
1. Matrix complete; TEST-PS-086-05-01 passes.
2. Restore requires two distinct approvers; TEST-PS-086-05-02 passes.
3. No moderator reads evidence bytes; TEST-PS-086-05-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: dual control for evidence reads and restore (F16 to confirm).
- OPEN: which F12 roles may read case-linked conflict metadata (agreement pending).
- PENDING F16: purpose registry values for `federation_conflict.evidence_read`.
