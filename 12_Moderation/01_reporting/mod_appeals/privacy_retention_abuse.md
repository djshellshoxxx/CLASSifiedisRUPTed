# PS-092-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, R07, R12), CTR-FED-001 (R03), CTR-CAP-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-07.R01 | Appeal `body` is PRIVATE_PERSONAL and is stored only in `apl_appeal`; never in events, logs, analytics or previews. | MVP |
| PS-092-07.R02 | Appeal data is never federated (CTR-FED-001 R03). | MVP |
| PS-092-07.R03 | Reporter identity is not stored on appeal rows and is not revealed in any appeal response. | MVP |
| PS-092-07.R04 | Push or in-app text for appeal outcomes is generic (for example "An update on your appeal is available") (CTR-PRV-001 R10). | MVP |
| PS-092-07.R05 | Appellant may request deletion of `body` after `closed`; the appeal row keeps IDs, state and decision code. | MVP |

## Data / schema
Retention (D07, PROVISIONAL):

| Record | Retention | After expiry |
|---|---|---|
| `apl_appeal.body` and `evidence_refs` | 12 months after `closed` | body nulled; hash kept |
| `apl_appeal` IDs, state, decision code | 24 months after `closed` | hard delete unless legal hold |
| `apl_event` | same as appeal row | redaction keeps envelope, digest replaces payload (CTR-EVT-001 R08) |
| `aud_` body-read records | per F16 audit policy | not owned here |

Legal holds (CTR-PRV-001 R07) are scoped to `cas_`, not to individual appeals.

## Commands / queries / events
Deletion request → `appeal.body_deleted` event with counts only (CTR-PRV-001 R12).

## States & transitions
Deletion does not change `state`. A `withdrawn` appeal's body is deleted at 30 days (ASSUMPTION).

## Validation & errors
Deletion requests for open appeals → `APPEALS.TRANSITION_NOT_ALLOWED`.

## Authorization
Only the appellant or an operator under dual control with a legal-hold purpose may trigger deletion.

## Failure, idempotency, concurrency, offline
Retention job idempotent by `apl_id` cursor; failures retried next run; deletion propagates to backups per CTR-PRV-001 R06.

## Privacy, retention, abuse
- Abuse 1 (appeal spam): max 5 open appeals per `acc_` (ASSUMPTION).
- Abuse 2 (retaliation): reviewer identity hidden from appellant; reporter identity hidden from appellant and reviewer.
- Abuse 3 (stalling): enforcement stays in force unless a stay is recorded (PS-092-03 R03).
- Abuse 4 (doxxing via appeal text): body is never shown to the reporter; moderation on body follows F12.S02 policy.
- Metadata: reviewer and appellant IDs are pseudonymous; no IP addresses in appeal rows.

## Observability & budgets
Logs contain `apl_id`, `code`, `state` only.

## Tests
- `TEST-PS-092-07-01` privacy: schema scan finds no reporter identifier and no body in events.
- `TEST-PS-092-07-02` retention: body nulled at 12 months in simulated clock; row kept to 24 months.
- `TEST-PS-092-07-03` abuse: sixth open appeal → `APPEALS.DUPLICATE_OPEN` or quota error (code per PS-092-02).
- `TEST-PS-092-07-04` push: outcome notification contains no appeal text or reason detail.

## Acceptance criteria
1. Zero PRIVATE_PERSONAL fields outside `apl_appeal.body`.
2. Deletion completes within 24 h in staging drill (CTR-PRV-001 R06).
3. Reporter identity absent from all appellant-visible responses.

## Assumptions & open decisions
- ASSUMPTION: 12-month body retention is a placeholder pending Privacy Lead review (F10).
- D07 (retention), PROVISIONAL default: minimal per-category defaults with legal-hold exceptions (unapproved).
- D01 (federated protocol), PROVISIONAL default: no federation of appeals in MVP (unapproved).
