# PS-096-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, R07, R10, R12), CTR-FED-001 (R07), CTR-CAP-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-07.R01 | No free-text narrative in this module. Case narrative stays in F12 case records. | MVP |
| PS-096-07.R02 | Target owners see action type, dates and reason category only; never the applier, approver or case ID. | MVP |
| PS-096-07.R03 | Enforcement notifications are generic (for example "A listing of yours was hidden. Open the app for details") with no reason detail in push (CTR-PRV-001 R10). | MVP |
| PS-096-07.R04 | Federation: only tombstones leave the node (CTR-FED-001 R07). | MVP |
| PS-096-07.R05 | Enforcement on `acc_` targets requires a case grant with purpose `enforcement`; no bulk actions on more than 50 targets per command (ASSUMPTION). | MVP |

## Data / schema
Retention (D07, PROVISIONAL):

| Record | Retention | After expiry |
|---|---|---|
| `enf_action` (active, expired, reversed, superseded) | 12 months after terminal state | row kept as IDs and codes only, then hard delete unless legal hold |
| `enf_event` | same as action | redaction keeps envelope, digest replaces payload |
| `rejected` pending suspensions | 90 days | hard delete |

Repeat-offender history is not stored here; any such aggregation is a future decision needing a Privacy Lead review (F10).

## Commands / queries / events
Legal holds (CTR-PRV-001 R07) scope to `cas_`, not to individual actions.

## States & transitions
Expiry removes effect but keeps the row. Deletion never changes state.

## Validation & errors
Bulk-size violations → `ENFORCE.BULK_LIMIT` (validation, 400, non-retryable).

## Authorization
Only operators with dual control can read `actor_ref` of actions older than 90 days.

## Failure, idempotency, concurrency, offline
Retention jobs are idempotent by `enf_id` cursor.

## Privacy, retention, abuse
- Abuse 1 (weaponized enforcement): per-`mod_` rate limit via F12.S03.M03 `mod_rate`; anomaly alert (PS-096-05).
- Abuse 2 (targeting private individuals): enforcement on a private person requires case grant with purpose and dual control on `suspend_account`.
- Abuse 3 (appeal evasion): re-applying the same action type to the same target within 30 days requires a new case with new evidence (ASSUMPTION).
- Metadata: owners cannot learn which moderator acted.

## Observability & budgets
Logs: `enf_id`, action type, code. No target content or owner identity beyond `acc_` pseudonym.

## Tests
- `TEST-PS-096-07-01` privacy: owner read omits `actor_ref` and `approver_ref`.
- `TEST-PS-096-07-02` privacy: push payload for hide contains no reason text.
- `TEST-PS-096-07-03` abuse: 51-target bulk apply → `ENFORCE.BULK_LIMIT`.
- `TEST-PS-096-07-04` retention: rejected suspension removed at 90 days.
- `TEST-PS-096-07-05` federation: attempt to export `enf.applied` with non-tombstone reason refused.

## Acceptance criteria
1. No free text field exists in any enforcement table or event.
2. Owner-facing responses contain no moderator identifiers.
3. Federation export test passes.

## Assumptions & open decisions
- ASSUMPTION: 12-month retention and bulk limit are placeholders pending F10 review.
- D07 (retention), PROVISIONAL default: minimal retention with legal-hold exceptions (unapproved).
- D01 (federated protocol), PROVISIONAL default: tombstone-only enforcement federation (unapproved).
