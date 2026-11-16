# PS-012-05 — authorization capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (action vocabulary, scopes, default deny, field visibility), CTR-ERR-001 (not-found rule), CTR-PRV-001 (classes).

**Decision label:** Participant-only visibility is required, not provisional. Moderation scope is PROVISIONAL (ASSUMPTION, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-05.R01 | Default deny. Each action below needs a participant relation rule evaluated on current `cyc_` and counter state. | MVP |
| PS-012-05.R02 | Actions: `counter.propose`, `counter.accept`, `counter.reject`, `counter.withdraw`, `counter.read`. Verbs follow CTR-CAP-001.R03. | MVP |
| PS-012-05.R03 | Authorization uses the `acc_` principal only; `prf_` views never grant access. Body-supplied `proposer_ref` or `recipient_ref` is ignored for authorization. | MVP |
| PS-012-05.R04 | Field visibility: `value_terms`, `proposer_ref`, `recipient_ref`, `created_at` = `participant`; `status` = `participant`; all others omitted for non-participants. | MVP |
| PS-012-05.R05 | No `ope_` or global-scope principal may read `value_terms` (FINANCIAL_EVIDENCE). Moderation read needs `case:<cas_>`, dual control and ≤ 72 h expiry (CTR-CAP-001.R06, R07). | MVP |

## Authorization matrix
| Actor (relation) | propose | accept | reject | withdraw | read |
|---|---|---|---|---|---|
| Holder, no OPEN counter by holder | Allow | Deny | Deny | Deny | Allow |
| Holder, recipient of OPEN counter | Allow (supersedes) | Allow | Allow | Deny | Allow |
| Holder, proposer of OPEN counter | Deny `ROLE_NOT_PERMITTED` | Deny | Deny | Allow | Allow |
| Non-participant `acc_` | Deny `SYS.NOT_FOUND` | Deny | Deny | Deny | Deny `SYS.NOT_FOUND` |
| `mod_` with `case:<cas_>` | Deny | Deny | Deny | Deny | Allow, purpose-bound, value_terms only with dual control |
| `ope_` | Deny | Deny | Deny | Deny | Deny (global scope excluded) |
| `sys_` (this module) | Deny | Deny | Deny | Deny | Expire, invalidate, supersede only |

## Grant and decision handling
- No grants are stored for participant actions; the relation is derived from state (CTR-CAP-001.R05).
- Each denial is an `authz.decide` record with reason code and no object content (CTR-CAP-001.R13).
- Revocation of a holder's `acc_` status is an event; the next decision denies all actions except read of terminal counters.

## Assumptions & open decisions
- ASSUMPTION: the `mod_` moderation read path is provided by F12 `cas_` cases; this module adds no moderation action.
- PENDING: block control between holders (owner F12); until resolved, a blocked holder can still act only through existing relations.
- D10 PROVISIONAL (D10 default, unapproved): user-controlled keys do not change these relations; recovery never grants `counter.accept` (CTR-CAP-001.R12).
