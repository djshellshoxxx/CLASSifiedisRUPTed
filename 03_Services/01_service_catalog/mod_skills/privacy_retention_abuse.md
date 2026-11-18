# PS-029-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-07.R01 | Module stores no location, device identifier or IP-derived field (CTR-PRV-001 R03, R09). | MVP |
| PS-029-07.R02 | Skill attachments are not federated in MVP (CTR-FED-001 R02 default false). | MVP |
| PS-029-07.R03 | Skill-combination queries are limited to ≤ 5 codes (PS-029-04.R07) to limit graph inference of a provider's profile. | MVP |
| PS-029-07.R04 | Self-declared proficiency and labels are displayed with the label "self-declared" in every surface. | MVP |
| PS-029-07.R05 | Keyword stuffing: > 20 attachments or > 10 attach/detach cycles per listing per day → `SKILLS.LIMIT_EXCEEDED` and report signal to F12. | MVP |
| PS-029-07.R06 | Reports on a skill attachment go to F12 by full ID; this module does not decide account sanctions. | MVP |
| PS-029-07.R07 | Erasure of an account removes its listing_skill rows within 24 h and writes a completion record (CTR-PRV-001 R12). | MVP |

## Data / schema
Data classes: `skill_code`, `proficiency`, `status` = PUBLIC once active; `owner_acc_id` = PSEUDONYMOUS; `label_nfc` = PSEUDONYMOUS while pending. Retention: pending label 30 days; detached row 30 days (D07 PROVISIONAL).

## Commands / queries / events
Deletion propagates through `listing_skill.detached` with reason `erasure`. Event payloads carry no label text.

## States & transitions
Erasure and expiry both route through the detach transition in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
No additional codes beyond [validation_rules.md](validation_rules.md).

## Authorization
Retention and erasure jobs run as `sys_` with scope limited to this module (CTR-CAP-001 R02).

## Failure, idempotency, concurrency, offline
Erasure job is idempotent per account; partial completion resumes on retry within 24 h.

## Privacy, retention, abuse
Threats: profiling via unique skill sets, Sybil listings to inflate search, stale labels after account deletion, operator over-collection of pending labels. Controls: R03, R05, R07, and purge at 30 days. Backups expire within the CTR-PRV-001 R06 window.

## Observability & budgets
Logs record listing ID and code count only. No label text or proficiency values in logs. Erasure completion within 24 h (ASSUMPTION).

## Tests
- TEST-PS-029-07-01 unit: attach/detach cycle counter triggers at 11th cycle.
- TEST-PS-029-07-02 integration: account erasure removes all rows and emits one completion record.
- TEST-PS-029-07-03 privacy: log-scan test finds no label text across a test run.

## Acceptance criteria
1. No field classified above PSEUDONYMOUS except through a declared retention class.
2. Erasure completes within 24 h in test environment and leaves only IDs, timestamps and counts.
3. No federated export of skill rows in MVP.

## Assumptions & open decisions
- ASSUMPTION: abuse thresholds (20 attachments, 10 cycles).
- D07 (retention) PROVISIONAL: 30-day purge defaults.
- No payment or receipt checklist applies.
