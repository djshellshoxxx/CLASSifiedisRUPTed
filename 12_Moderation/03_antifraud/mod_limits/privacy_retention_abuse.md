# PS-098-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R04, R05, R06, R09), CTR-CAP-001 (R04, R08), CTR-FED-001 (not applicable: no federation).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-07.R01 | No usage counts or account activity history are stored in this module. Decision records keep IDs, quota key, policy version and outcome. | MVP |
| PS-098-07.R02 | Jurisdiction is a coded value; no precise location is accepted or derived (CTR-PRV-001 R03). | MVP |
| PS-098-07.R03 | Region-cell scopes are used only for registered cells and apply the K_MIN threshold to any published aggregate (CTR-PRV-001 R04). | MVP |
| PS-098-07.R04 | Quota denials are not disclosed with counts; users see "limit reached for this type of item" plus the policy's generic help text. | MVP |
| PS-098-07.R05 | Decision records (`dec_`) retained 90 days; policy records retained as long as referenced by a retained decision, then 12 months. | MVP |

## Data / schema
| Record | Retention (D07, PROVISIONAL) | Deletion |
|---|---|---|
| `dec_` quota decisions | 90 days | hard delete |
| `lim_policy` active or retired | retired + 12 months | hard delete when no retained decision references it |
| Active-policy cache | 1 h | expire |

## Commands / queries / events
No export command. Account-level export does not include quota decisions (they are operational records, ASSUMPTION).

## States & transitions
Deletion does not change policy state.

## Validation & errors
Errors never reveal another account's status.

## Authorization
Decision records readable by operators with dual control only.

## Failure, idempotency, concurrency, offline
Retention jobs idempotent by cursor.

## Privacy, retention, abuse
- Abuse 1 (quota gaming through multiple accounts): handled by identity controls in F07 and by `mod_risk` signals; this module does not decide account linkage.
- Abuse 2 (inference of other users' activity from denials): denial body has no counts (PS-098-02).
- Abuse 3 (geographic profiling): region-cell scope only; no per-user jurisdiction history retained beyond decision records.
- Abuse 4 (targeting a person with a tight personal limit): personal `acc` scope policies require `rationale_code` ABUSE_PATTERN and dual control.

## Observability & budgets
Logs: `quota_key`, `policy_version`, outcome, `dec_id`. No `acc_` in metrics; `acc_` appears only in `dec_` records.

## Tests
- `TEST-PS-098-07-01` privacy: schema scan finds no usage counts.
- `TEST-PS-098-07-02` privacy: denial response contains no numbers beyond policy version.
- `TEST-PS-098-07-03` retention: `dec_` removed at 90 days in simulated clock.
- `TEST-PS-098-07-04` abuse: personal `acc` policy without dual control → denied.

## Acceptance criteria
1. Schema contains no usage counter column.
2. Denial bodies pass the leak test.
3. Retention jobs verified in staging.

## Assumptions & open decisions
- ASSUMPTION: 90-day decision retention is a placeholder pending F10 review.
- D05 (geoprivacy), PROVISIONAL default: coarse public regions and user-initiated precision disclosure (unapproved).
- D07 (retention), PROVISIONAL default: minimal per-category defaults with legal-hold exceptions (unapproved).
