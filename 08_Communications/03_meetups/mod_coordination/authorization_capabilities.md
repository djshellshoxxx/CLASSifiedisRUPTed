# PS-064-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04, R05, R06, R07, R10), CTR-PRV-001 (LOCATION_PRECISE; per-meetup disclosure), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-05.R01 | Actions evaluated on the owning `acc_` of a participant `prf_`; `prf_` is never a principal. | MVP |
| PS-064-05.R02 | Both thread participants can read meetup details (window, state, place text or venue). | MVP |
| PS-064-05.R03 | Precise point readable only by the grantee within the disclosure window; never by the proposer as a separate grant, and never by operators. | MVP |
| PS-064-05.R04 | Moderators read meetup details only under case grant; precise point access requires dual control and purpose `safety_report` (CTR-CAP-001 R06, R07). | MVP |
| PS-064-05.R05 | Participation derived from mod_private thread membership at decision time. | MVP |
| PS-064-05.R06 | Default deny. | MVP |

## Data / schema
Field visibility (CTR-CAP-001 R10):

| Field | public | participant | grantee (point) | case (mod_, dual control for point) | never |
|---|---|---|---|---|---|
| `window_start`, `window_end`, `state`, `venue_ref` | | Y | Y | Y | |
| `place_text` | | Y | Y | Y | |
| `point` | | | Y (within window) | Y only with dual control and purpose | operators |
| `reschedule_count` | | Y | | | |

## Commands / queries / events
| Action | Actor | Scope | Result |
|---|---|---|---|
| `meetup.propose` | participant | thread | allow |
| `meetup.accept` | counterparty | meetup | allow |
| `meetup.read` | participant | meetup | details without point |
| `meetup.point_read` | grantee | disclosure | point within expiry |
| `meetup.point_share` | proposer or accepting party | meetup | allow in `agreed` |
| `meetup.moderate_read` | `mod_` | case | details; point with dual control |

## States & transitions
Denied actions produce no state change; decisions recorded with outcome only.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `SYS.NOT_FOUND` | false | `err.sys.not_found` |
| `SYS.FORBIDDEN` | false | `err.sys.forbidden` |
| `COORD.DISCLOSURE_EXPIRED` | false | `err.coord.disclosure_expired` |

## Authorization
Relation rules derived at decision time. Point decision cache zero (CTR-CAP-001 R09).

## Failure, idempotency, concurrency, offline
Point read is re-checked at every request; no offline cache for points (device purges on expiry).

## Privacy, retention, abuse
Point reads and moderator reads emit `aud_` with `meetup_id`, purpose and approvers, never coordinates.

## Observability & budgets
`coord_authz_deny_total{action}`; alert on repeated point-read denials from one account.

## Tests
- TEST-PS-064-05-01 (unit): matrix per principal × action × field.
- TEST-PS-064-05-02 (negative): proposer cannot read point unless grantee.
- TEST-PS-064-05-03 (integration): point read fails after expiry.
- TEST-PS-064-05-04 (negative): operator read of point denied.

## Acceptance criteria
1. Matrix implemented; default deny verified.
2. Points accessible only to grantee within window, and to moderators under dual control.
3. Audit records contain no coordinates.
4. Participation change takes effect at next decision.

## Assumptions & open decisions
- ASSUMPTION: purpose enum includes `safety_report`.
- PROVISIONAL (D05 default, unapproved): per-meetup disclosure model.
