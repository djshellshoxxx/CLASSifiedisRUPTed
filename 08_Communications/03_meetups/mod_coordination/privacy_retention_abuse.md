# PS-064-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (LOCATION_PRECISE, LOCATION_COARSE, PRIVATE_PERSONAL; RET-LOC, RET-PRIV, RET-AUD, RET-LEGAL; R03 never in logs), CTR-CAP-001, CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-07.R01 | Precise points are LOCATION_PRECISE: encrypted at rest, never in logs, analytics, push, events, federation or search (zero tolerance). | MVP |
| PS-064-07.R02 | Points and place text purged at RET-LOC: 30 days after meetup end or 7 days after last use, whichever first. | MVP |
| PS-064-07.R03 | Disclosure expires at min(window_end + 2 h, 24 h after share). Revocation stops future access; copies seen cannot be recalled (UI states this). | MVP |
| PS-064-07.R04 | Venue choice from a public registry is the default; users are told that a home address should not be used. | MVP |
| PS-064-07.R05 | Coordination metadata (windows, states) retained as PSEUDONYMOUS for 365 days (ASSUMPTION), then count only. | MVP |
| PS-064-07.R06 | Safety features: safety reminder notice before meetup (generic text); trusted-contact sharing. | Future (trusted-contact sharing needs F10 review) |

## Data / schema
| Record | Class | Retention |
|---|---|---|
| precise point (disclosure) | LOCATION_PRECISE | RET-LOC (30 days after end or 7 days after last use), expiry at R03 |
| `place_text` | PRIVATE_PERSONAL | RET-LOC |
| window and state | PSEUDONYMOUS | 365 days, then count only |
| no-show reports | PSEUDONYMOUS | RET-AUD for disputes, otherwise 365 days |
| moderator point reads | internal | RET-AUD |

## Commands / queries / events
Event payloads carry IDs and states only (PS-064-04 R03).

## States & transitions
Retention clocks start at `completed`, `cancelled` or `expired` per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Place text heuristics (PS-064-02 R04) are not a guarantee; users are warned.

## Authorization
Point access per PS-064-05 only.

## Failure, idempotency, concurrency, offline
Purge jobs idempotent; legal hold suspends purge for held meetups only.

## Privacy, retention, abuse
- **Location inference:** window plus venue reveals plans; coarse venue default limits inference. Residual risk stated.
- **Stalking:** point visible only to grantee in window; no live tracking, no history of positions.
- **Harassment via meetups:** cancellation and no-show records feed F12 review; no automated sanctions.
- **Fake meetups for profiling:** rate limit 10 proposals per account per day (ASSUMPTION).
- **Limit:** a grantee can share the point off-platform; the platform cannot prevent this.

## Observability & budgets
Counts of disclosures and expiries; never coordinates.

## Tests
- TEST-PS-064-07-01 (privacy scan): points absent from logs, events, push, analytics, metrics.
- TEST-PS-064-07-02 (retention): purge at RET-LOC boundaries.
- TEST-PS-064-07-03 (expiry): disclosure ends at min(end + 2 h, 24 h).
- TEST-PS-064-07-04 (abuse): proposal rate limit enforced.

## Acceptance criteria
1. Zero LOCATION_PRECISE occurrences outside grantee and audit-exempt paths (fixture scan).
2. RET-LOC timers verified.
3. Expiry verified.
4. UI copy on venue choice and copies reviewed by F10 and F14.

## Assumptions & open decisions
- ASSUMPTION: 365-day coordination metadata retention; 10 proposals per day.
- PROVISIONAL (D05 default, unapproved): coarse public regions and per-meetup precision disclosure.
- PROVISIONAL (D07 default, unapproved): RET-LOC and legal-hold exceptions.
