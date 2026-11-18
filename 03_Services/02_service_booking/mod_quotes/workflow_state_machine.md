# PS-032-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-03. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Defines the lifecycle of a quote from composition to a terminal state. Business outcome: a requester can rely on a quote's status and validity, and a terminal state cannot be silently reopened.

Exclusions: no escrow, payment or delivery state; no booking, milestone or dispute states; no implied completion. Reaching ACCEPTED means both parties' recorded assertions match one revision. It does not mean work is done or paid.

## Requirements
- PS-032-03.R01: Every state, entry event, transition, guard and terminal flag is listed in Section 1 and Section 2. No other transition exists.
- PS-032-03.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial cases are enumerated in Section 4 and tested in TEST-PS-032-03-T01 to T05.
- PS-032-03.R03: Accessibility and budgets: status changes are announced to assistive technology with text, not colour alone. Transition latency budgets are in observability_performance.md.
- PS-032-03.R04: Transitions are atomic. Status, version, history row and outbox row commit in one transaction.
- PS-032-03.R05: Expiry is enforced at read and at accept time, independent of the scheduled job (Section 3).
- PS-032-03.R06: Terminal states are immutable. No command changes a terminal quote except read and export.

## 1. States
| State | Entry event | Allowed outgoing transitions (command → next state) | Guard summary | Terminal |
|---|---|---|---|---|
| COMPOSING | `quotes.quote.create` | issue → ISSUED; withdraw → WITHDRAWN; stale timeout (system) → WITHDRAWN with `STALE_COMPOSING` | issue guard G1 | no |
| ISSUED | `quotes.quote.issue` (first issue) or issue from COUNTER_PROPOSED | respond ACCEPT → ACCEPTED; respond DECLINE → DECLINED; respond COUNTER → COUNTER_PROPOSED; withdraw → WITHDRAWN; expiry (system) → EXPIRED | accept guard G2; counter guard G3 | no |
| COUNTER_PROPOSED | respond COUNTER | issue (new revision) → ISSUED; withdraw → WITHDRAWN; expiry (system) → EXPIRED | issue guard G1 on new revision | no |
| ACCEPTED | respond ACCEPT | none | none | yes |
| DECLINED | respond DECLINE | none | none | yes |
| WITHDRAWN | withdraw, or stale timeout | none | none | yes |
| EXPIRED | expiry job, or read-time check promoted by job | none | none | yes |

Note that `revise` on COMPOSING, or on COUNTER_PROPOSED with a new unissued revision, keeps the state unchanged. It bumps `version`. It is not a transition.

## 2. Guards
- G1 (issue): caller is provider; `moderation_hold` false; revision has 1–50 lines; `valid_until` within bounds (A-quotes-04); provider not blocked by requester (A-quotes-12); status COMPOSING or COUNTER_PROPOSED; `expected_version` matches.
- G2 (ACCEPT): caller is requester; status ISSUED; `revision_no` equals `issued_revision_no`; `valid_until` > server now; `acknowledged_content_hash` equals revision `content_hash`; `moderation_hold` false; requester not blocked; `expected_version` matches. Evaluated under row lock.
- G3 (COUNTER): caller is requester; status ISSUED; `counter_count` < 3; counter currency equals revision currency; counter amount differs from issued total (A-quotes-09).
- Decline and withdraw do not require the hold to be clear (A-quotes-11).

## 3. Expiry and time rules
- Expiry (system): a job selects status ISSUED or COUNTER_PROPOSED with `valid_until` ≤ now, sets EXPIRED with `closed_reason` EXPIRED, writes history and outbox in one transaction. Runs every 60 seconds, batch 500 (A-quotes-10). The update is conditional on the prior status, so re-running is a no-op.
- Read-time: any read or G2 check treats `valid_until` ≤ now as expired even before the job has run. G2 returns `QUOTES_REVISION_EXPIRED`.
- Stale composing (system): COMPOSING quotes with `updated_at` older than 30 days move to WITHDRAWN with `closed_reason` STALE_COMPOSING (A-quotes-08).
- Clock source is the database server clock only. Client clocks are never used for guards.

## 4. Transition cases
| Case | Setup | Expected outcome | Test |
|---|---|---|---|
| normal | ISSUED, requester accepts current revision with correct hash | ACCEPTED, `closed_reason` ACCEPTED | T01 |
| invalid | COMPOSING, requester attempts ACCEPT | QUOTES_STATE_INVALID; no change | T02 |
| expired | ISSUED, `valid_until` passed, job not yet run | QUOTES_REVISION_EXPIRED on accept; status later EXPIRED | T03 |
| duplicate | ACCEPTED quote, second ACCEPT with same key | Replay of stored response (idempotency); no second transition | T04 |
| concurrent | ISSUED, accept and withdraw race with same `expected_version` | One succeeds; other returns QUOTES_VERSION_CONFLICT | T05 |
| offline | Requester device offline during accept | No transition until server ack; client shows pending | failure_recovery_idempotency.md |
| adversarial | Accept with hash of superseded revision | QUOTES_REVISION_STALE; no transition | T02 |

## 5. Terminal state guarantees
- Once `closed_at` is set, `status`, `closed_reason`, `issued_revision_no` and all revisions are immutable (R06).
- Only read, export and anonymization (privacy_retention_abuse.md) may touch a terminal quote.
- Operator hold on a terminal quote is rejected with QUOTES_STATE_INVALID.

## Assumptions and open decisions
- A-quotes-08: Stale composing timeout is 30 days without update.
- A-quotes-09: Maximum three counters per quote. A counter records a proposed amount and note. It does not change the record's amount. The provider must issue a new revision or withdraw.
- A-quotes-10: Expiry job cadence 60 seconds, batch 500, database clock.
- A-quotes-11: Moderation hold blocks issue and ACCEPT only. Decline and withdraw remain allowed so parties can exit.
- A-quotes-12: Block check reads identity block status with 500 ms timeout. Fails closed for issue and ACCEPT; fails open for DECLINE and withdraw.
- D04 (open, DECISIONS.md): partial barter execution is out of scope for this module. Quote acceptance is a single-party-pair assertion.
