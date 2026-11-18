# PS-099-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (policy events), CTR-FED-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-03.R01 | A bucket has two states: `conforming` (TAT ≤ now + burst allowance) and `limited` (TAT > now + burst allowance). No other bucket states exist. | MVP |
| PS-099-03.R02 | A bucket returns to `conforming` by time alone; no explicit reset exists. | MVP |
| PS-099-03.R03 | A rate-policy version is `loading` → `active` → `superseded`. Only one version is `active` per node. | MVP |
| PS-099-03.R04 | Policy switch takes effect for new decisions within 10 s on all nodes (ASSUMPTION); existing bucket TATs are kept. | MVP |

## Data / schema
Bucket state is `tat_ms` only (PS-099-01). Policy states: `loading`, `active`, `superseded`, `rejected`.

## Commands / queries / events
Policy events: `rate.policy_loaded`, `rate.policy_activated`, `rate.policy_rejected`, `rate.policy_superseded`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| bucket conforming | consume(cost) | `tat_ms − now + cost × T ≤ τ` | conforming | `tat_ms` advanced by cost × T |
| bucket conforming | consume(cost) | would exceed τ | limited | no change to `tat_ms`; `RATE.LIMITED` returned |
| bucket limited | time passes | `now ≥ tat_ms − τ` | conforming | none |
| policy loading | validation ok | schema and R04 pass | active | previous active → superseded |
| policy loading | validation fails | any violation | rejected | previous policy stays active; alert |

T = `emission_interval_ms`, τ = `burst × T` (GCRA parameters).

## Validation & errors
Policy rejection is non-user-facing; logged with rule name.

## Authorization
Policy activation is performed by F16-signed artifacts only; no runtime API activates a policy.

## Failure, idempotency, concurrency, offline
Concurrent consumes on one key are atomic via compare-and-set on `tat_ms` in the store.

## Privacy, retention, abuse
State carries no subject data beyond the keyed token.

## Observability & budgets
`rate_bucket_state_total{class_id,state}` sampled (1 %) to limit cardinality; `rate_policy_version` gauge.

## Tests
- `TEST-PS-099-03-01` unit: GCRA sequence matches reference implementation for 10 000 random consume patterns.
- `TEST-PS-099-03-02` property: a bucket never permits more than `burst + elapsed/T` conforming consumes in any window.
- `TEST-PS-099-03-03` integration: policy switch propagates within 10 s across three nodes.
- `TEST-PS-099-03-04` negative: invalid policy keeps previous version active.

## Acceptance criteria
1. Reference-implementation equivalence on the test corpus.
2. Burst and sustained rate bounds hold under property tests.
3. Policy rollback is a new signed version, not an in-place change.

## Assumptions & open decisions
- ASSUMPTION: 10 s propagation target is for F15 review.
- D02 (cycle optimizer), not applicable.
- D08 (PWA offline writes), PROVISIONAL default: offline client retries honor `retry_after_ms` (unapproved).
