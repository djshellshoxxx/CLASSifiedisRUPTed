# PS-021-05 — Authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-05.R01 | Default deny: a consent command succeeds only if the actor is a `participant` of the cycle version (CTR-CAP-001 R01, R04). | MVP |
| PS-021-05.R02 | Capability `cyc.consent` (create, withdraw). Read of own consent state uses `cyc.read`, scope `participant`. | MVP |
| PS-021-05.R03 | Operators cannot record consent for a party. `ope_` and `mod_` principals have no `cyc.consent` grant. | MVP |
| PS-021-05.R04 | Consent counts visible to participants only; field visibility per CTR-CAP-001 R10 (`counterparty_decision` hidden until own decision recorded — ASSUMPTION). | MVP |
| PS-021-05.R05 | Revoked participation (party removed by dropout handling) denies new consents within 60 s (CTR-CAP-001 R09). | MVP |

## Data / schema
Authorization inputs: `acc_` of actor, cycle membership derived from the proposal version (relation rule, not stored grant).

## Commands / queries / events
Authorization is evaluated before idempotency lookup, so replays by non-participants return `SYS.NOT_FOUND`.

## States & transitions
Membership changes are events re-evaluated at decision time (CTR-CAP-001 R05).

## Validation & errors
| Condition | Code | Class / HTTP |
|---|---|---|
| Actor not participant | SYS.NOT_FOUND | not_found / 404 |
| Actor participant, revoked | SYS.FORBIDDEN | forbidden / 403 |
| Operator attempts consent | SYS.FORBIDDEN | forbidden / 403 |

## Authorization
| Actor × action | Resource scope | Capability | Result |
|---|---|---|---|
| participant × consent | cycle_id, current version | cyc.consent | ALLOW |
| participant × consent | stale version | cyc.consent | DENY SYS.CONFLICT |
| non-participant × consent | any | — | DENY SYS.NOT_FOUND |
| ope_ / mod_ × consent | any | — | DENY SYS.FORBIDDEN |
| participant × read counts | cycle_id | cyc.read | ALLOW (counts only) |

## Failure, idempotency, concurrency, offline
Policy store unavailable → fail closed `SYS.UNAVAILABLE` (CTR-CAP-001 TEST-10). Offline clients never decide authorization; queued consents are re-authorized at server commit.

## Privacy, retention, abuse
No privileged grants exist for this module; no PRIVATE_PERSONAL or LOCATION data is read here.

## Observability & budgets
Audit record `aud_` for every decision (allow and deny) with decision ID and reason code, no content (CTR-CAP-001 R08, R13).

## Tests
- TEST-PS-021-05-01 (matrix): each row of the authorization table.
- TEST-PS-021-05-02 (negative integration): guessed `cyc_` ID from another cycle denied.
- TEST-PS-021-05-03 (revocation): consent after removal denied within 60 s.

## Acceptance criteria
1. Matrix rows produce the stated outcome and code.
2. No operator path can write a consent row (static check plus test).
3. Every denial writes an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: `counterparty_decision` visibility rule.
- [DECISIONS.md](../../../DECISIONS.md) D10 — auth and portability. PROVISIONAL (D10 default, unapproved): consent signed by the party's user-controlled key when keys exist; pseudonymous session otherwise.
