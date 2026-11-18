# PS-100-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R03, R04, R06, R07), CTR-COM-001 (claim privacy), CTR-CAP-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-07.R01 | Feature allow-list excludes precise location, contact lists, device fingerprints beyond keyed IDs, and proxies on the fairness review list (PS-100-02 R03). | MVP |
| PS-100-07.R02 | Location input is LOCATION_COARSE region cell only (CTR-PRV-001 R04), with K_MIN applied to any aggregate. | MVP |
| PS-100-07.R03 | Subjects can request an explanation of category codes (not weights) and a human review (GDPR-style right to contest, ASSUMPTION jurisdictional scope). | MVP |
| PS-100-07.R04 | Assessments are not shared with peers or with counterparties. Counterparties see only generic "under review" on a shared listing. | MVP |
| PS-100-07.R05 | Automated tiers are not used alone for permanent account action (PS-100-03 R02). | MVP |

## Data / schema
Retention (D07, PROVISIONAL):

| Record | Retention | After expiry |
|---|---|---|
| `rsk_assessment` | 30 days (`expires_at`), then 6 months as reason-code history for case audit | IDs and codes only after 30 days; hard delete at 6 months unless legal hold |
| Queue and idempotency rows | 7 days | hard delete |
| Review decisions | per case retention (F12) | per case |

## Commands / queries / events
Explanation request (subject) returns category codes and the review path; never weights or thresholds.

## States & transitions
Expiry does not change case state.

## Validation & errors
No feature values in errors.

## Authorization
Case-scoped reviewers only (PS-100-05).

## Failure, idempotency, concurrency, offline
Retention jobs idempotent by `rsk_id` cursor.

## Privacy, retention, abuse
- Abuse 1 (gaming): tiers and features are not exposed; explanations give categories only.
- Abuse 2 (discrimination): fairness review of tier distribution per locale and per region cell (K_MIN); proxies excluded by allow-list.
- Abuse 3 (weaponization by rivals): flags alone do not raise tiers above `medium` without signal corroboration from `mod_signals`.
- Abuse 4 (surveillance): no cross-service profile is built; features are limited to the subject's activity on the platform.
- Metadata: counterparties learn only a generic state.

## Observability & budgets
Logs: `rsk_id`, tier bucket, category codes. No feature values, no subject IDs beyond `rsk_id`.

## Tests
- `TEST-PS-100-07-01` privacy: allow-list scan fails build on forbidden feature.
- `TEST-PS-100-07-02` privacy: counterparty view contains no tier or reason.
- `TEST-PS-100-07-03` fairness: tier distribution per locale within ±5 points of baseline on the labeled set (ASSUMPTION).
- `TEST-PS-100-07-04` retention: assessment content reduced at 30 days; deleted at 6 months.

## Acceptance criteria
1. Feature allow-list enforced; no forbidden feature in production model.
2. Counterparty and subject views contain no tier.
3. Fairness report completed before each model release.

## Assumptions & open decisions
- ASSUMPTION: the 6-month reason history is a placeholder pending F10 and legal review.
- D05 (geoprivacy), PROVISIONAL default: coarse public regions and user-initiated precision disclosure (unapproved).
- D07 (retention), PROVISIONAL default: minimal retention with legal-hold exceptions (unapproved).
