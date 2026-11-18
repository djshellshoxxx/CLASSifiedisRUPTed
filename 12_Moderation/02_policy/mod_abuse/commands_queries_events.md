# PS-095-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-04.R01 | Every state-changing command carries `idempotency_key` and `expected_revision`. | MVP |
| PS-095-04.R02 | Commands are `abuse.<verb>@1`; the scanner is an internal `sys_` principal only. | MVP |
| PS-095-04.R03 | Event `event_type` values use aggregates `finding` (abf_) and `account` (acc_). | MVP |

## Commands
| Command | Caller | Input | Emits | Errors |
|---|---|---|---|---|
| abuse.scan | sys | source_ref, text_digest, rule_set_version | finding.recorded (new only) | ABU.RULE_RETIRED |
| abuse.review | mod (triage) | finding_id, outcome (confirm, dismiss), rule_version, expected_revision | finding.confirmed or finding.dismissed | ABU.FINDING_NOT_OPEN, ABU.REVIEW_SELF_FORBIDDEN |
| abuse.restrict_reporter | mod (+ ope if > 7 days) | acc_, duration_days (1–14), reason_category | account.reporting_restricted | CAP.DUAL_APPROVAL_REQUIRED |
| abuse.rule.publish | governance (2 approvers) | rule bundle | rule.published (aggregate `rule`, PENDING prefix) | ABU.RULE_INVALID, ABU.RULE_APPROVAL_MISSING |

## Queries
| Query | Returns | Auth |
|---|---|---|
| abuse.review_queue | finding_id, category, severity, rule_id, age (no text, no digest) | mod triage |
| abuse.finding | category, rule_id, status, subject ref under case scope | mod case grant |
| abuse.rule_precision | per rule: confirmed, dismissed counts (no text) | ope |

## Events
| event_type | Aggregate | Payload | max_data_class |
|---|---|---|---|
| finding.recorded | finding | finding_id, category, severity, rule_id, rule_version | PSEUDONYMOUS |
| finding.confirmed | finding | finding_id, reviewer_ref | PSEUDONYMOUS |
| finding.dismissed | finding | finding_id | PSEUDONYMOUS |
| account.reporting_restricted | account | acc_, duration_days, reason_category | PSEUDONYMOUS |
| account.reporting_restored | account | acc_ | PSEUDONYMOUS |

Payloads exclude match_digest and matched text. Events are local-only.

## Validation & errors
Shared codes plus ABU.* (PS-095-02).

## Authorization
PS-095-05.

## Failure, idempotency, concurrency, offline
Scan idempotent on (source_ref, rule_id, rule_version). Review idempotent on (finding_id, revision).

## Privacy, retention, abuse
Events carry no subject text and no digests. `reviewer_ref` visible to case scope only.

## Observability & budgets
`abuse_commands_total{command,outcome}`; scan lag p95 ≤ 60 s from write (ASSUMPTION).

## Tests
- TEST-PS-095-04-01 (contract): payloads match schema 1.0.0.
- TEST-PS-095-04-02 (idempotency): repeat scan creates no second finding.
- TEST-PS-095-04-03 (lint): no match_digest or text in any event.

## Acceptance criteria
1. Each command lists exactly its errors.
2. Scanner principal cannot call review or restrict endpoints (TEST-05 in PS-095-09).

## Assumptions & open decisions
- PENDING: `abf` and rule aggregate prefix (CTR-ID-001).
- PROVISIONAL (D01 default, unapproved): signed rule bundles for any future cross-node sharing.
