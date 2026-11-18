# PS-095-06 — failure, recovery, idempotency and offline

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-06.R01 | Scanning is detective and asynchronous. Content publication is never blocked by scanner failure in this module. | MVP |
| PS-095-06.R02 | Scan jobs are at-least-once with dedupe on (source_ref, rule_id, rule_version). | MVP |
| PS-095-06.R03 | A rule rollout is staged: 5% of scans for 24 h, then full, with precision check before full rollout (ASSUMPTION). | MVP |
| PS-095-06.R04 | Rule rollback is immediate; findings already recorded keep their cited rule_version. | MVP |

## Retry and timeouts
| Path | Timeout | Retry | Terminal |
|---|---|---|---|
| Scan job | 5 s per window | 3 attempts, backoff 2 s, 8 s, 32 s | job to dead-letter; alert |
| Finding write | 2 s | 2 attempts | scan re-queued |
| Enforcement proposal emit | 2 s | outbox pattern, at-least-once | outbox retained 7 days |

## Recovery
Dead-letter jobs are replayed after rule fix; replay is idempotent. Outbox rows are deleted only after consumer ack (PS-096 proposal).

## Offline behavior
Not applicable to server scanning. Reviewer offline clients are read-only for abuse queues (no local decisions).

## Concurrency
Review uses `expected_revision`; concurrent review returns `ABU.FINDING_NOT_OPEN`. Rule publish is serialized by governance lock.

## Authorization
Scanner credentials rotate every 24 h (F16); scans carry no user session.

## Privacy, retention, abuse
Dead-letter payloads hold digests only, never text; they expire in 7 days (RET-OPS). Rule-evasion attempts (repeated near-identical content from one account) are tracked as counters.

## Observability & budgets
`abuse_scan_backlog`, `abuse_deadletter_total`, `abuse_rule_rollout_precision`. Alert when backlog > 10,000 items or lag > 60 s.

## Tests
- TEST-PS-095-06-01 (fault): scanner down 30 min → publication unaffected; backlog drains after recovery.
- TEST-PS-095-06-02 (replay): duplicate scan jobs produce one finding.
- TEST-PS-095-06-03 (rollback): rule disabled → subsequent scans skip it; existing findings keep version.

## Acceptance criteria
1. Scanner outage never blocks a write (TEST-01).
2. No dead-letter payload contains text (privacy scan).

## Assumptions & open decisions
- ASSUMPTION: staged rollout 5% → 100% after 24 h.
- PROVISIONAL (D08 default, unapproved): not applicable to server scans; reviewer tools read-only offline.
