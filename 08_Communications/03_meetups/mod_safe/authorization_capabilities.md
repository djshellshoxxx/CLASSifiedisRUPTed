# PS-066-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R08), CTR-PRV-001 (R07), CTR-ERR-001 (R08). **Decisions:** D05, D10 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-05.R01 | Default deny. Only the two plan parties hold `meetup.*` rights on a plan. | MVP |
| PS-066-05.R02 | A trusted-contact grant is scoped to one plan, one action (`meetup.read`), one purpose (`safety_status`), and expires at `window_end + 1 h`. | MVP |
| PS-066-05.R03 | Trusted contact sees only `status` and `window_end` (rounded to 5 min). | MVP |
| PS-066-05.R04 | Moderators see plan data only under a `case:` grant, and never see `trusted_contact_hash` or `checkin_code_hash`. | MVP |
| PS-066-05.R05 | No operator (`ope_`) right to read plan content exists by default. Any grant requires dual control (CTR-CAP-001 R07). | MVP |
| PS-066-05.R06 | Non-parties receive `SYS.NOT_FOUND`, identical to nonexistent plans. | MVP |

## Data / schema
Grant record uses CTR-CAP-001 `grt_`. Constraints stored: `plan_id`, `action`, `purpose`, `fields`, `not_after`.

## Commands / queries / events
| Command | Action (CTR-CAP-001 verb) | Actor |
|---|---|---|
| `meetup.propose` | `meetup.propose` | participant |
| `meetup.confirm` | `meetup.accept` | other participant |
| `meetup.cancel` | `meetup.withdraw` | either participant |
| `meetup.check_in`, `meetup.check_out` | `meetup.execute` | participant |
| `meetup.safe_exit` | `meetup.withdraw` | either participant |
| `meetup.set_trusted_contact` | `meetup.update` | self only |
| `meetup.get` | `meetup.read` | participant or grant holder |

## States & transitions
Grant states: `active`, `revoked` (by the granting party at any time), `expired`. Revocation takes effect on the next decision (CTR-CAP-001 R09).

## Validation & errors
Unauthorized action returns `SYS.FORBIDDEN` only when the actor is a party; otherwise `SYS.NOT_FOUND`.

## Authorization
Field visibility:

| Field | Counterparty | Trusted contact | Moderator (case) |
|---|---|---|---|
| status | yes | yes | yes |
| window_end | yes | yes (rounded) | yes |
| window_start, venue_ref | after `CONFIRMED` | no | yes |
| trusted_contact_hash | no | no | no |
| checkin_code_hash | no | no | no |

## Failure, idempotency, concurrency, offline
Grant checks run on each read; a revoked grant fails within one request.

## Privacy, retention, abuse
Grant creation and revocation emit `aud_` records (CTR-CAP-001 R08) containing IDs and purpose only.

## Observability & budgets
Counter of grant reads per plan; alert if one grant is read more than 100 times (scraping signal, ASSUMPTION).

## Tests
- TEST-PS-066-05-01 (unit): each row of the command table allows the listed actor and denies others.
- TEST-PS-066-05-02 (integration): trusted contact cannot read `venue_ref` or `window_start`.
- TEST-PS-066-05-03 (integration): revoked grant returns `SYS.FORBIDDEN` on the next read.
- TEST-PS-066-05-04 (negative): non-party and nonexistent plan responses are identical.

## Acceptance criteria
1. Matrix matches implementation (generated test).
2. No role can read hashes of codes or contacts.
3. Grants expire at the configured time (time-travel test).

## Assumptions & open decisions
- ASSUMPTION: one active trusted-contact grant per party per plan.
- D05 (PROVISIONAL default, unapproved). D10 (PROVISIONAL, unapproved): key-based identity affects grant verification only when adopted.
