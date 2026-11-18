# PS-097-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-FED-001 (R04), CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-03.R01 | Only the transitions in the table are reachable. Others → `SPAM.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-097-03.R02 | A listing or service in `pending_evaluation` is not discoverable publicly (PS-097-06). | MVP |
| PS-097-03.R03 | `quarantine` holds an item out of public discovery and shows the author a generic "under review" state. | MVP |
| PS-097-03.R04 | A quarantine without reviewer decision for 7 days transitions to `released` with reason `NO_DECISION` (ASSUMPTION). | MVP |
| PS-097-03.R05 | Message verdicts never remove a delivered message; they only throttle or block further sends from that sender. | MVP |

## Data / schema
States: `pending_evaluation`, `allowed`, `quarantined`, `released`, `rejected`. Stored in `spm_verdict.state`.

## Commands / queries / events
See [PS-097-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `spam.evaluated` (created) | subject valid, model version active | pending_evaluation | feature extraction queued |
| pending_evaluation | `spam.evaluated` (allow) | decision = allow | allowed | subject visible to discovery |
| pending_evaluation | `spam.quarantined` | decision = quarantine | quarantined | hidden from discovery; author notified generically |
| pending_evaluation | `spam.rejected` | decision = reject (high confidence and pattern rule) | rejected | author notified; appeal target |
| quarantined | `spam.released` | reviewer release with case or review ref | released | visible; verdict kept |
| quarantined | `spam.rejected` | reviewer reject | rejected | hidden permanently; appeal target |
| quarantined | `spam.expired` | 7 days, no decision | released | visible; reason `NO_DECISION` |
| allowed | `spam.quarantined` | later signal (new mod_signals input) | quarantined | as quarantined row |

`released` and `rejected` are terminal for the verdict; a new evaluation creates a new verdict for a new revision of the subject.

## Validation & errors
Invalid transitions → `SPAM.TRANSITION_NOT_ALLOWED`.

## Authorization
Automated `sys_` may create verdicts and move `pending_evaluation` to `allowed`, `quarantined` or `rejected` only for `reject` with high confidence and a pattern rule; reviewer actions per PS-097-05.

## Failure, idempotency, concurrency, offline
Concurrent reviewer and expiry job: revision check decides; loser gets `EVT.REVISION_CONFLICT`.

## Privacy, retention, abuse
Author notices carry no feature detail and no reason beyond the category (`reason_code` mapped to generic category).

## Observability & budgets
`spam_transition_total{from,to,decision}`; `spam_quarantine_age_seconds` gauge.

## Tests
- `TEST-PS-097-03-01` unit: exhaustive state × event matrix.
- `TEST-PS-097-03-02` integration: quarantined listing absent from discovery query results within 1 index refresh.
- `TEST-PS-097-03-03` integration: 7-day expiry releases with `NO_DECISION`.
- `TEST-PS-097-03-04` integration: message verdict does not delete delivered message.

## Acceptance criteria
1. Table is the sole source of transitions.
2. Quarantined subjects never appear in public discovery in test corpus.
3. No automated path rejects an item without a registry pattern rule.

## Assumptions & open decisions
- ASSUMPTION: 7-day quarantine window and auto-release on no decision are defaults for Trust&Safety review.
- D08 (PWA offline writes), PROVISIONAL default: offline listing drafts are evaluated only after relay acknowledgement (unapproved).
