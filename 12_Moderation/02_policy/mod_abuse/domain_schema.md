# PS-095-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-01.R01 | One `abf_` finding per (source_ref, rule_id, rule_version). Class `opaque`. Prefix PENDING CTR-ID-001 entry. | MVP |
| PS-095-01.R02 | Findings store a keyed digest of the matched text, never the matched text. | MVP |
| PS-095-01.R03 | Rules are versioned records; a finding always cites the exact `rule_version` that fired. | MVP |
| PS-095-01.R04 | Reporter-misuse statistics are stored per reporter as counters, not as report text. | MVP |
| PS-095-01.R05 | Severity is an integer 1–4; severity 4 always routes to human review. | MVP |

## Data / schema
| Field | Type | Class | Constraint / visibility |
|---|---|---|---|
| finding_id | `abf_` | PSEUDONYMOUS | required |
| category | enum: harassment, threat, doxxing_pattern, hate_term, report_misuse, appeal_misuse | PUBLIC | required |
| source_ref | `msg_`, `lst_`, `srv_`, `auc_`, `rnt_`, `thr_` or `acc_` | PSEUDONYMOUS | prefix-matched |
| subject_ref | `acc_` (author or owner of source) | PSEUDONYMOUS | visibility `case` |
| rule_id | string `^[a-z_]{3,32}$` | PUBLIC | from registry |
| rule_version | SemVer | PUBLIC | required |
| match_digest | hex(64), HMAC-SHA-256 keyed | SECRET (keyed) | never in events or logs |
| severity | integer 1–4 | PUBLIC | 4 → review queue |
| status | enum: open, confirmed, dismissed, expired | PUBLIC | PS-095-03 |
| reviewer_ref | `mod_`, nullable | PSEUDONYMOUS | set on review |
| created_at | RFC3339 UTC ms | PSEUDONYMOUS | server-set |

Rule registry entry: `rule_id`, `rule_version`, `category`, `pattern_kind` (exact, normalized, token_set), `severity_default`, `approved_by` (2 approvers), `effective_from`, `retired_at`.

## Commands / queries / events
PS-095-04. Schema `finding` 1.0.0 (CTR-SCH-001).

## States & transitions
PS-095-03.

## Validation & errors
PS-095-02.

## Authorization
PS-095-05.

## Failure, idempotency, concurrency, offline
Unique on (source_ref, rule_id, rule_version); re-scan of same content returns the existing finding.

## Privacy, retention, abuse
`match_digest` is retained only with the finding; dismissed findings purged after 90 days; confirmed findings RET-AUD 12 months after the linked case closes.

## Observability & budgets
`abuse_findings_total{category,status}`; schema lint in CI.

## Tests
- TEST-PS-095-01-01 (lint): no field holds matched text; `match_digest` absent from events.
- TEST-PS-095-01-02 (uniqueness): re-scan of unchanged content creates no second finding.

## Acceptance criteria
1. Every finding carries rule_id and rule_version.
2. Rules without two approvers cannot be loaded (TEST-02 in PS-095-09).

## Assumptions & open decisions
- PENDING: `abf` prefix (CTR-ID-001 registry).
- PROVISIONAL (D07 default, unapproved): dismissed-finding purge after 90 days.
- OPEN: lexicon ownership and language coverage (Trust&Safety).
