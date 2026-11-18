# PS-144-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-07. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F10 privacy (classes, erasure), F12 moderation (abuse signals), F17 quality (sampling audit). **Upstream:** F07 identity, F16 security. Location, retention and disclosure classes come from CTR-PRV-001 (owner F10). See [CONTRACTS](../../../planning/CONTRACTS.md).

## Purpose and scope
**Business outcome.** The module stores only the policy evidence it needs. Participants learn the outcome for their own subject, never reviewer identities or private notes. Abuse of catalog, rules, evaluation and review is limited and visible.

**Exclusions.** Identity credentials and contact data (F07). Listing content (F01). Participant location (never collected here). Pseudonyms do not guarantee anonymity against network metadata, counterparties or legal process.

## Location class
`LOC-NONE`. The module stores no geolocation, address or device location. `jurisdiction_scope` is a policy scope code, not a user location.

## Data classification
Labels are provisional until CTR-PRV-001 is published (A-goods-11).

| Data element | Disclosure class | Retention | Storage notes |
|---|---|---|---|
| Category codes and display keys | DISC-PUBLIC | Life of category plus 7 years after `DEPRECATED` | Plain |
| Rule content (scope, class, conditions, dates) | DISC-PUBLIC summary; full record DISC-INTERNAL | 7 years after `RETIRED` | Plain |
| `drafted_by_ref`, `activated_by_ref`, `retired_by_ref` | DISC-INTERNAL | 7 years after `RETIRED` | Pseudonymous |
| `subject_ref` in decisions | DISC-PARTY (subject owner), DISC-INTERNAL | 2 years after `evaluated_at` | Pseudonymous; tombstoned on erasure |
| Decision `outcome`, `reason_code`, `condition_codes` | DISC-PARTY (outcome and reason only) | 2 years | Plain |
| `reviewer_note` | DISC-INTERNAL (PRV, AUD) | Deleted 1 year after `decided_at` | Free text; may contain personal data; never logged |
| `assigned_reviewer_ref` | DISC-INTERNAL | Replaced by hashed token after 1 year | Pseudonymous |
| Idempotency records | INTERNAL | 72 h | Hash of payload only |
| Application logs | INTERNAL | 30 days | Field allowlist in observability_performance.md |

Retention periods are concrete defaults (A-goods-12) pending the D07 retention decision in [DECISIONS.md](../../../DECISIONS.md).

## Erasure and legal hold
- A participant erasure request (F10) for a listing owner does not delete decisions, which are policy evidence. Instead: `subject_ref` is replaced by a tombstone `tmb_<ULID>`, owner-linked fields are cleared, and outcome fields stay.
- Review notes are deleted, not tombstoned, on their schedule or on erasure of the reviewer's own data where law allows.
- A legal hold suspends deletion for affected records and overrides erasure and the retention schedule. Holds are recorded by F18 and referenced by ID.
- Erasure is recorded as an audit event without the erased values.

## Disclosure rules
- Participants see outcome, `reason_code` and `condition_codes` for their own subject. They never see rule IDs, reviewer refs, reviewer notes or other participants' decisions.
- Public catalog and ACTIVE rule summaries show scope, class and conditions without drafter or activator refs.
- Exports are limited to OPS and AUD roles and follow import_export_backup_rollback.md.

## Abuse controls
| Threat | Control | Threshold | Error code or signal |
|---|---|---|---|
| Rule flooding by an operator | Cap on `EDITING` rules per operator | 50 per day | GOODS_RATE_LIMITED |
| Category spam | Cap on category creations per operator | 20 per day | GOODS_RATE_LIMITED |
| Probing policy by repeated evaluation | Evaluations per subject per hour | 10 per `subject_ref` | GOODS_RATE_LIMITED; abuse signal to F12 |
| Mislabeling to avoid review | Random audit sample of `ALLOW` outcomes (A-goods-13) | About 5% | Sampled decisions flagged for F17 review |
| Reviewer collusion or overload | Conflict guard; daily decision count per reviewer | Flag at 20 decisions per day | Signal to AUD |
| Replay of service requests | Signed token replay window | 5 min (F16) | Token refused |
| Forged evidence submitted as decision input | No external evidence accepted by this module | — | Not applicable |
| Metadata leakage through errors | Error envelope excludes input values | — | validation_rules.md |

## Assumptions
- **A-goods-11.** CTR-PRV-001 class labels used here (LOC-NONE, DISC-PUBLIC, DISC-PARTY, DISC-INTERNAL, INTERNAL) are provisional and must be reconciled with F10.
- **A-goods-12.** Retention periods: decisions 2 years; rule records 7 years after retirement; review notes 1 year; idempotency 72 h; logs 30 days.
- **A-goods-13.** About 5% of `ALLOW` and `ALLOW_WITH_CONDITIONS` decisions are sampled for audit. The rate is a default and is monitored in observability_performance.md.

## Open decisions
- **OD-GOODS-07.** Ordering of erasure and legal hold when both apply. Default: legal hold wins; erasure is queued and executed after release.
- Related: [DECISIONS.md](../../../DECISIONS.md) D07 (retention) is OPEN; these periods are defaults pending that decision.
