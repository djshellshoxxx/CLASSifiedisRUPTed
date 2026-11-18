# PS-087-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-FED-001 (peer scopes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-05.R01 | Only `sys_` service principals may call `dedup.check_and_record`. | MVP |
| PS-087-05.R02 | No end-user or peer principal may call dedupe directly. | MVP |
| PS-087-05.R03 | Equivocation evidence readable by Security Lead and Trust & Safety only (`case` scope). | MVP |
| PS-087-05.R04 | Default deny. | MVP |

## Data / schema
Capabilities: `evt.dedupe`, `evt.evidence_read`.

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md).

## States & transitions
None.

## Validation & errors
`SYS.FORBIDDEN` / `SYS.NOT_FOUND` per CTR-CAP-001.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| sys_ delivery | evt.dedupe | index | ALLOW |
| peer fpr_ | evt.dedupe | index | DENY, SYS.FORBIDDEN |
| T&S (case) | evt.evidence_read | equivocation record | ALLOW (grant, audited) |
| ope single | evt.evidence_read | equivocation record | DENY, DUAL_APPROVAL_REQUIRED |

## Failure, idempotency, concurrency, offline
Fails closed; no offline path.

## Privacy, retention, abuse
Evidence reads audited (CTR-CAP-001 R08).

## Observability & budgets
Metric `dedup_authz_denies_total`.

## Tests
- TEST-PS-087-05-01 (matrix): table outcomes.
- TEST-PS-087-05-02 (peer): peer cannot dedupe-call.

## Acceptance criteria
1. Matrix passes.

## Assumptions & open decisions
- PROVISIONAL (CTR-CAP-001 default, unapproved).
