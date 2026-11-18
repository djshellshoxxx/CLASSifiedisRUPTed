# PS-095-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-10.R01 | Rule bundles are imported only from governance-signed bundles; unsigned bundle → `ABU.RULE_INVALID`. | MVP |
| PS-095-10.R02 | No findings are imported from federated peers (CTR-FED-001 R03). | MVP |
| PS-095-10.R03 | Finding exports only through the PS-093-10 legal-process path. | MVP |
| PS-095-10.R04 | Backups exclude `match_digest` keys; restore recomputes nothing that needs keys. | MVP |
| PS-095-10.R05 | Rule rollback keeps all findings and their cited rule_version. | MVP |

## Export
| Export | Scope | Auth |
|---|---|---|
| Aggregate rule precision | per rule counts | ope |
| Finding bundle | one `cas_` | legal path, dual approval (PS-093-10) |

Exports never include matched text (not stored) or digests.

## Backup and restore
Daily encrypted snapshot (RPO 24 h, RTO 4 h ASSUMPTION). Restore replays dismissals and expiries before serving. Keys restored from KMS, not from backup.

## Rollback
Rule rollback is per rule_id and version; a rolled-back rule stops scanning within 5 min. Findings remain. Schema rollback forbidden after first finding.

## Validation & errors
Unsigned bundle → `ABU.RULE_INVALID`; export without legal path → `SYS.FORBIDDEN`.

## Failure, idempotency, concurrency, offline
Bundle import idempotent on bundle hash. Partial import fails whole bundle.

## Privacy, retention, abuse
Bundle signature keys held by governance (F16); rotation documented.

## Observability & budgets
`abuse_bundle_imports_total{outcome}`; restore RTO ≤ 4 h (ASSUMPTION).

## Tests
- TEST-PS-095-10-01 (import): unsigned bundle rejected; signed bundle accepted once.
- TEST-PS-095-10-02 (rollback): rule disabled; findings count unchanged.
- TEST-PS-095-10-03 (restore): dismissals replayed before serving.

## Acceptance criteria
1. No federation path for findings (lint).
2. Rollback leaves finding count and hashes unchanged.

## Assumptions & open decisions
- ASSUMPTION: RPO 24 h, RTO 4 h.
- PROVISIONAL (D01 default, unapproved): signed envelopes for any future bundle exchange.
- PROVISIONAL (D10 default, unapproved): operator-held keys.
