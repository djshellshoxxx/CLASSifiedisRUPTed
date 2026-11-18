# PS-091-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (states, R01, R06, R09), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-03.R01 | Only the transitions in the table below are reachable. Any other pair returns `TRUST.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-091-03.R02 | A transition and its `trs_` row and outbox event commit in one database transaction. | MVP |
| PS-091-03.R03 | `quarantined` stops all new inbound and outbound sync for the peer within one relay cycle (≤ 60 s, ASSUMPTION) without changing local records (BT-09). | MVP |
| PS-091-03.R04 | `revoked` is terminal for the peer ID. Re-admission requires a new `fpr_` and a new `pending` admission. | MVP |
| PS-091-03.R05 | An automated actor may only move `trusted` → `restricted`. | MVP |

## Data / schema
State values and `trigger` enum as in [PS-091-01](domain_schema.md). Initial state on peer creation: `pending`.

## Commands / queries / events
See [PS-091-04](commands_queries_events.md).

## States & transitions
| From | Event (trigger) | Guard | To | Side effect |
|---|---|---|---|---|
| pending | `peer.admitted` | admin (dual control, PS-091-05) and `fingerprint_confirmation` matches | trusted | enable sync for peer; emit event |
| trusted | `peer.restricted` | SIG_FAILURES threshold (3 in 24 h, ASSUMPTION) by `sys_`, or admin review | restricted | stop outbound; inbound allowed |
| trusted | `peer.quarantined` | EQUIVOCATION, KEY_COMPROMISED, or MODERATION_CASE with `cas_` | quarantined | stop all sync; retain conflicting events as evidence (CTR-FED-001 R06) |
| restricted | `peer.quarantined` | same as above | quarantined | as above |
| restricted | `peer.restored` | admin; cooldown ≥ 1 h since restriction (ASSUMPTION) | trusted | resume outbound |
| quarantined | `peer.restored` | review record with `RECOVERY_REVIEWED`; new keys if KEY_COMPROMISED | trusted or restricted (named in command) | resume sync from last acknowledged revision |
| pending, trusted, restricted, quarantined | `peer.revoked` | admin, reason code | revoked | drop peer from relay routing; keep tombstones |

Guards on `restore` from `quarantined` to `trusted` require the review to be dated after the quarantine event (ASSUMPTION), so a stale review cannot lift a newer quarantine.

## Validation & errors
Transitions not listed above: `TRUST.TRANSITION_NOT_ALLOWED`, non-retryable.

## Authorization
Enforced per command in PS-091-05. Automated transitions use `sys_` with `fpr.update` restricted to `restricted`.

## Failure, idempotency, concurrency, offline
Concurrent transitions are serialized by the revision check in PS-091-06. Offline clients cannot change trust state.

## Privacy, retention, abuse
Transitions are internal state; peers receive `peer.*` events only for their own record, without `reason_text`-equivalent detail (see PS-091-07).

## Observability & budgets
Metric `trust_transition_total{from,to,trigger}` for every accepted transition.

## Tests
- `TEST-PS-091-03-01` unit: exhaustive 5×5 event matrix; only table rows succeed.
- `TEST-PS-091-03-02` integration: quarantine stops sync within one relay cycle; restore resumes from last acknowledged revision.
- `TEST-PS-091-03-03` property: `revoked` has no outgoing transition in 10 000 random sequences.

## Acceptance criteria
1. The transition table is the only source of allowed transitions; code is generated from or tested against it.
2. Quarantine blocks sync within 60 s in integration tests.
3. A revoked peer ID cannot be restored.

## Assumptions & open decisions
- ASSUMPTION: thresholds (3 signature failures per 24 h, 1 h restore cooldown) are defaults for F11 and F12 Trust&Safety review.
- D10 (auth and portability), PROVISIONAL default: key rotation is the recovery path for KEY_COMPROMISED (unapproved).
