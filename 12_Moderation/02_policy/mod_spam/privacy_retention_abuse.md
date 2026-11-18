# PS-097-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R03, R09, R10), CTR-FED-001 (R03, R08), CTR-CAP-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-07.R01 | Message content is never read by this module; only metadata features are computed (PS-097-01 R04). | MVP |
| PS-097-07.R02 | Text is processed in memory and discarded after feature extraction; no text is persisted by this module. | MVP |
| PS-097-07.R03 | Feature hashes use a rotating key (90-day rotation, ASSUMPTION) so hashes cannot be joined across rotations. | MVP |
| PS-097-07.R04 | Verdicts are not exported to federation peers. Federated items' verdicts stay local. | MVP |
| PS-097-07.R05 | Sender-visible messages state only "Your messages are being sent more slowly" when throttled (no classifier detail). | MVP |

## Data / schema
Retention (D07, PROVISIONAL):

| Record | Retention | After expiry |
|---|---|---|
| `spm_verdict` (allow, released) | 90 days | hard delete |
| `spm_verdict` (rejected) | 12 months (supports appeals) | hard delete after appeal window closes |
| `feature_hash` | 90 days | hard delete |
| Evaluation queue | until processed or 7 days | hard delete |

Legal holds apply per `cas_` (CTR-PRV-001 R07).

## Commands / queries / events
No export command. Owner access is limited to status (PS-097-05).

## States & transitions
Retention deletes rows but never changes an unresolved quarantine.

## Validation & errors
No privacy-sensitive values in errors.

## Authorization
Verdict deletion is a system job only.

## Failure, idempotency, concurrency, offline
Retention job idempotent by `spm_id` cursor.

## Privacy, retention, abuse
- Abuse 1 (classifier probing): message responses are binary (throttled or not); event payloads omit confidence for `msg` (PS-097-04); per-sender probe rate limit through `mod_rate`.
- Abuse 2 (evasion of rules): reason codes are generic in author notices; thresholds are not published.
- Abuse 3 (discriminatory filtering): per-language and per-locale false-positive rates tracked, reviewed by F14 (accessibility and internationalization).
- Abuse 4 (surveillance through features): no feature derived from precise location or contact lists.

## Observability & budgets
Logs contain `spm_id`, `subject_type`, `reason_code` only.

## Tests
- `TEST-PS-097-07-01` privacy: no text persisted in DB, cache or logs after evaluation (memory-only test with canary strings).
- `TEST-PS-097-07-02` privacy: message throttle notice contains no classifier detail.
- `TEST-PS-097-07-03` retention: allow verdict removed at 90 days in simulated clock.
- `TEST-PS-097-07-04` federation: verdict export attempt refused.

## Acceptance criteria
1. Canary text never appears in storage or logs.
2. Message verdicts contain metadata features only.
3. Per-language false positive rate reported monthly with no locale above threshold (threshold set by F14).

## Assumptions & open decisions
- ASSUMPTION: 90-day rotation and 12-month rejected retention are placeholders pending F10 review.
- D07 (retention), PROVISIONAL default: minimal retention with legal-hold exceptions (unapproved).
- D01 (federated protocol), PROVISIONAL default: verdicts stay local (unapproved).
