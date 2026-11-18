# PS-065-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R02, R04 participant and case, R05, R07, R10, R13), CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-05.R01 | Attest actions evaluated on the owning `acc_` of an exchange party `prf_`; `prf_` is never a principal. | MVP |
| PS-065-05.R02 | Only the two exchange parties may attest, withdraw or read the handoff; the F09 dispute service principal reads under a dispute scope. | MVP |
| PS-065-05.R03 | Moderators read handoff metadata only under case grant; no signatures or quantities beyond the case need. | MVP |
| PS-065-05.R04 | Operators cannot attest, edit or delete lines. | MVP |
| PS-065-05.R05 | Participation in the exchange is derived from owning modules' events at decision time. | MVP |
| PS-065-05.R06 | Default deny. | MVP |

## Data / schema
Field visibility (CTR-CAP-001 R10):

| Field | public | party | F09 dispute service | case (mod_) | never |
|---|---|---|---|---|---|
| line direction, item, quantity, `attested_at` | | Y | Y (dispute scope) | presence and state only | |
| `signature` | | own line Y, counterparty line Y | Y (dispute scope) | | |
| `state`, `window_closes_at` | | Y | Y | Y | |
| `meetup_ref` | | Y | | | |

## Commands / queries / events
| Action | Actor | Scope | Result |
|---|---|---|---|
| `handoff.open` | party | exchange | allow |
| `attest` (handoff line) | party | own direction | allow within window |
| `handoff.withdraw_line` | attesting party | own line | allow before counter-attestation |
| `handoff.read` | party | exchange | allow |
| `handoff.dispute_read` | F09 `sys_` | dispute | allow |
| `handoff.moderate_read` | `mod_` | case | presence and state |

## States & transitions
Denied actions produce no state change; decisions recorded with outcome only.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `SYS.NOT_FOUND` | false | `err.sys.not_found` |
| `SYS.FORBIDDEN` | false | `err.sys.forbidden` |
| `HANDOFF.PARTY_NOT_ALLOWED` | false | `err.handoff.party_not_allowed` |

## Authorization
Relation rules derived at decision time (CTR-CAP-001 R05). Closure of exchange does not remove party read rights until retention.

## Failure, idempotency, concurrency, offline
Re-authorized each attempt; queued attestations are re-checked against current party relation at relay time.

## Privacy, retention, abuse
Dispute reads and moderator reads emit `aud_` with `handoff_id`, scope and decision ID. No content of other attestations in audit.

## Observability & budgets
`handoff_authz_deny_total{action}`; alert on repeated attest denials from one account (possible probing).

## Tests
- TEST-PS-065-05-01 (unit): matrix per principal × action × field.
- TEST-PS-065-05-02 (negative): operator attest denied.
- TEST-PS-065-05-03 (integration): F09 dispute service sees lines only within dispute scope.
- TEST-PS-065-05-04 (negative): non-party read returns `SYS.NOT_FOUND`.

## Acceptance criteria
1. Matrix implemented; default deny verified.
2. Only parties attest.
3. Dispute scope enforced for F09.
4. Moderator reads limited to presence and state.

## Assumptions & open decisions
- ASSUMPTION: F09 dispute service principal exists with `dispute` scope.
- PROVISIONAL (D10 default, unapproved): key registry model unchanged in MVP.
