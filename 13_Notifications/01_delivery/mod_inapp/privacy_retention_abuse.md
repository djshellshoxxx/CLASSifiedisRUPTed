# PS-103-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R04, R06, R10, R12), CTR-FED-001 (R03, not federated), CTR-CAP-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-07.R01 | In-app notification text is produced client-side from template keys and short parameters; no server-rendered free text. | MVP |
| PS-103-07.R02 | Parameters are labels (for example a pseudonymous display name, a listing title truncated to 64 characters, a count). No coordinates, addresses, amounts, contact data, or message content. | MVP |
| PS-103-07.R03 | Notifications are not federated and not exported to peers. | MVP |
| PS-103-07.R04 | Expiry clears `params` (PS-103-03 R05) so archived rows carry no content. | MVP |
| PS-103-07.R05 | On a shared device, the inbox respects the app lock when enabled (ASSUMPTION); sensitive templates use neutral wording by default (CTR-PRV-001 R10). | MVP |

## Data / schema
Retention (D07, PROVISIONAL):

| Record | Retention | After expiry |
|---|---|---|
| `ntf_inapp` (queued) | 30 days | removed |
| `ntf_inapp` (delivered, read, dismissed) | 90 days | `params` cleared; ID, state and timestamps kept 12 months, then deleted |
| Operation log | 7 days | deleted |
| Dead-letter rows | 30 days after resolution | deleted |

Legal holds apply per case (CTR-PRV-001 R07) only where a notification is evidence in an open case; the hold references `cas_`, not the notification content.

## Commands / queries / events
Account deletion (F10) removes all `ntf_inapp` rows for the account within 24 h (CTR-PRV-001 R06); operation logs are removed with the account.

## States & transitions
Deletion does not change the recipient's other items.

## Validation & errors
Forbidden-class scan on creation (PS-103-02 R04).

## Authorization
Owner-only reads; no operator content access (PS-103-05 R04).

## Failure, idempotency, concurrency, offline
Retention jobs idempotent by `ntf_id` cursor.

## Privacy, retention, abuse
- Abuse 1 (notification flooding): per-producer rate class through `mod_rate` (`ntf.create`); per-recipient cap of 200 undelivered items (ASSUMPTION).
- Abuse 2 (harassment by notification): blocked senders suppressed at creation (PS-103-03 R04); report path via `mod_flags`.
- Abuse 3 (phishing through in-app notices): templates are registered; no links to external sites; only deep links to app routes.
- Abuse 4 (inference through notification timing): not mitigated in MVP; documented residual risk.

## Observability & budgets
Logs: template key, state, `ntf_id`. No parameter values.

## Tests
- `TEST-PS-103-07-01` privacy: parameters contain no coordinates, amounts or contacts in fixture corpus.
- `TEST-PS-103-07-02` retention: `params` cleared at 90 days; row removed at 12 months.
- `TEST-PS-103-07-03` account deletion: all rows removed within 24 h in staging drill.
- `TEST-PS-103-07-04` abuse: 201st undelivered item for one recipient refused.

## Acceptance criteria
1. No server-rendered free text in any notification path.
2. Account deletion propagates within 24 h.
3. Blocked-sender suppression verified.

## Assumptions & open decisions
- ASSUMPTION: 200-item undelivered cap and 12-month metadata retention are placeholders pending F10 review.
- D05 (geoprivacy), PROVISIONAL default: no location in notifications (unapproved).
- D07 (retention), PROVISIONAL default: minimal retention with legal-hold exceptions (unapproved).
