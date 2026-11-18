# PS-096-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001 (R07 dual control), CTR-FED-001 (R07 tombstones).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-03.R01 | Only the transitions in the table are reachable. Others → `ENFORCE.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-096-03.R02 | `suspend_account` starts in `pending_approval` and needs a second `mod_` approver distinct from the applier. | MVP |
| PS-096-03.R03 | Applying `hide`, `unpublish` or `remove_content` to a listing or service with an active barter cycle or booking emits `enf.applied`; `mod_` owners of F02 and F03 decide renegotiation. Enforcement never cancels or reroutes the commitment itself (PROJECT_SPEC system rule: dropout renegotiates, never silently reroutes). | MVP |
| PS-096-03.R04 | Expiry is processed by a scheduler within 60 s of `expires_at` (ASSUMPTION). | MVP |
| PS-096-03.R05 | `remove_content` is final in the local node; federation effect uses the origin tombstone rule (CTR-FED-001 R07). | MVP |

## Data / schema
States: `pending_approval`, `active`, `rejected`, `expired`, `reversed`, `superseded`. Stored in `enf_action.state`.

## Commands / queries / events
One event per transition; see [PS-096-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `enf.applied` | warn, hide, unpublish, remove_content: valid target and case grant | active | effect dispatched to owning module |
| (none) | `enf.applied` (pending) | restrict_publish, suspend_account: valid target and case grant | pending_approval | no effect until approval |
| pending_approval | `enf.approved` | approver is a distinct `mod_` with case grant | active | effect dispatched |
| pending_approval | `enf.rejected` | approver rejects, or 72 h elapse (ASSUMPTION) | rejected | terminal; applier notified |
| active | `enf.expired` | `now ≥ expires_at` | expired | effect removed; owner notified |
| active | `enf.reversed` | appeal decided REVERSED (`mod_appeals`) or operator reversal with case | reversed | effect removed; terminal |
| active | `enf.superseded` | appeal decided MODIFIED; replacement action written | superseded | old effect removed; replacement active |

Warnings have no expiry; they transition only by `reversed` or `superseded`.

## Validation & errors
Invalid transitions → `ENFORCE.TRANSITION_NOT_ALLOWED`, non-retryable.

## Authorization
Per [PS-096-05](authorization_capabilities.md). Automated actors cannot transition any action.

## Failure, idempotency, concurrency, offline
Effect dispatch is at-least-once with consumer dedupe on `(enf_id, revision)`. A failed effect sets `effect_status = failed` and is retried (PS-096-06).

## Privacy, retention, abuse
Expiry and reversal notifications are generic (CTR-PRV-001 R10).

## Observability & budgets
Metric `enforce_transition_total{from,to,action_type}`; gauge of `active` actions per type.

## Tests
- `TEST-PS-096-03-01` unit: exhaustive state × event matrix.
- `TEST-PS-096-03-02` integration: suspend requires second approver; self-approval denied.
- `TEST-PS-096-03-03` integration: hide on listing with active cycle emits `enf.applied`; cycle state unchanged by enforcement.
- `TEST-PS-096-03-04` integration: expiry fires within 60 s in simulated clock.
- `TEST-PS-096-03-05` property: `reversed`, `expired`, `rejected` and `superseded` have no outgoing transitions.

## Acceptance criteria
1. Table is the sole source of allowed transitions.
2. No action reaches `active` for `suspend_account` without distinct second approval.
3. Enforcement does not alter `cyc_`, `rnt_` or `trx_` state in any test.

## Assumptions & open decisions
- ASSUMPTION: 72 h approval window and 60 s expiry scheduler are defaults.
- D04 (partial barter execution), PROVISIONAL default: explicit per-party attestations and compensating recovery; enforcement triggers renegotiation only (unapproved).
- D09 (rentals and deposits), PROVISIONAL default: no custody; hide on rental listings does not touch deposits (unapproved).
