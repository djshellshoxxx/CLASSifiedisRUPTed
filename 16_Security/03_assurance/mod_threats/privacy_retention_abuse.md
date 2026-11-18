# PS-133-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-07.R01 | Threat records contain no personal data about named individuals (0 hits on PII linter) | MVP |
| PS-133-07.R02 | Threats whose area is geolocation or graph linkage describe coarse classes only (region level, no coordinates) | MVP |
| PS-133-07.R03 | Attack detail is held outside the register in a restricted attachment with separate access list | MVP |
| PS-133-07.R04 | Retention: threat rows and model versions kept for product life + 3 years; residual acceptances 3 years after expiry | MVP |

## Data / schema
Data class restricted (CTR-PRV-001). Attachment reference field `detail_ref` (opaque ID; not in MVP schema PS-133-01 record view).

## Commands / queries / events
No new commands. Export tiers in PS-133-10.

## States & transitions
Retention: active -> archived (after product retirement) -> deleted (after retention end). No deletion while legal hold applies.

## Validation & errors
`THREATS.PII_DETECTED` (non-retryable): linter match. Diagnostic: rule ID and field name.

## Authorization
Restricted fields and attachments: Security Lead and Privacy Lead only.

## Failure, idempotency, concurrency, offline
Retention job idempotent per threat_id. Legal hold blocks deletion and logs the block.

## Privacy, retention, abuse
- Abuse: a threat description used to publish a live exploit or to target a named user. Control: sensitivity restricted default, no URLs, human review on publish.
- Abuse: register used to launder accepted risk. Control: expiry and two-role acceptance (PS-133-05).
- D07 PROVISIONAL (D07 default, unapproved) sets retention above; legal-hold exceptions apply.

## Observability & budgets
Count of PII linter hits per publish (target 0). Count of restricted reads per week by role.

## Tests
- TEST-PS-133-07-01 (unit): description with an email-shaped string rejected with PII_DETECTED.
- TEST-PS-133-07-02 (unit): geolocation threat with coordinate string rejected.
- TEST-PS-133-07-03 (integration): retention job does not delete a row under legal hold.

## Acceptance criteria
1. Linter rules versioned; 0 false negatives on the planted test set.
2. Restricted attachment not returned by any list query.
3. Retention job drill passes on fixture data.

## Assumptions & open decisions
- ASSUMPTION: pattern-based PII linting is a partial control only; human review required.
- D05 PROVISIONAL (D05 default, unapproved): region-level granularity for location threats.
- D07 PROVISIONAL (D07 default, unapproved): retention periods above, not approved.
