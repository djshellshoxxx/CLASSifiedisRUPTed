# PS-012-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (event envelope, revision), CTR-COM-001 (quote pin at consent), CTR-CAP-001 (actor roles).

**Decision label:** Accept = mutual agreement on the new revision is PROVISIONAL (D04 default, unapproved). Counter creation = proposer consent is ASSUMPTION.

## States
`OPEN` (initial) · terminal: `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `SUPERSEDED`, `EXPIRED`, `INVALIDATED`. Terminal states have no outgoing transitions.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `counter.create` (actor = holder ≠ latest proposer) | `cyc_` OPEN; `target_revision` current; validation PASS (PS-012-02) | OPEN | Prior OPEN counter on `cyc_` → SUPERSEDED in same transaction; emit `counter.proposed`; notify recipient |
| OPEN | `counter.accept` (actor = recipient) | Not expired; `cyc_` still at `target_revision`; all items ACTIVE; both holders ACTIVE; quote valid if cross-currency | ACCEPTED | Write `cyc_` revision = `revision` and consent for both holders in one transaction; emit `counter.accepted` |
| OPEN | `counter.reject` (actor = recipient) | State OPEN | REJECTED | `cyc_` unchanged; emit `counter.rejected` |
| OPEN | `counter.withdraw` (actor = proposer) | State OPEN | WITHDRAWN | `cyc_` unchanged; emit `counter.withdrawn` |
| OPEN | `counter.expire` (system timer) | `now ≥ expires_at` | EXPIRED | Emit `counter.expired` |
| OPEN | `counter.invalidate` (system) | Reason ∈ ITEM_GONE, PARTY_INACTIVE, TARGET_CHANGED, OFFER_WITHDRAWN | INVALIDATED | Emit `counter.invalidated` with reason; notify both holders |
| OPEN | `counter.supersede` (system) | Newer counter created on same `cyc_` | SUPERSEDED | Emit `counter.superseded` (inside create transaction) |

Invariants: at most one OPEN per `cyc_` (PS-012-01.R02). `cyc_` revision changes only by ACCEPTED. Each transition increments `state_version` by 1.

## Lifecycle notes
- A counter does not reserve items. Items stay available to other trades until ACCEPTED plus the owning module's consent step.
- Accept is refused, not silently re-based, when `cyc_` moved. The proposer must create a new counter.
- Cap: a chain reaching revision 5 accepts or rejects only; further creates fail with `CTROFFER.DEPTH_LIMIT`.

## Assumptions & open decisions
- ASSUMPTION: consent of the proposer is recorded at create (PS-012-01).
- D04 PROVISIONAL (D04 default, unapproved): no transition here asserts physical handover; execution is owned by F02.S02/S03.
- Open: owner of the `cyc_` revision write in the accept transaction (PENDING, F02 cycle module).
