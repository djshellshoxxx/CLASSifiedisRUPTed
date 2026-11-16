# PS-008-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Marketplace Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (model; this file extends its action matrix), CTR-PRV-001 (field classes).

**Decisions:** Capability names are PROVISIONAL (ASSUMPTION, unapproved). Default-deny is required, not provisional (CTR-CAP-001 R01). D10 does not affect this module.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-05.R01 | Default deny. Each action below needs a relation rule or an active grant. | MVP |
| PS-008-05.R02 | Holder refs are visible only to the two proposal parties and to the owner's proposal view. Other principals get counts only. | MVP |
| PS-008-05.R03 | Only the `sys` principal of F01.S04.M01 may place or execute holds. Users cannot place holds directly. | MVP |
| PS-008-05.R04 | No moderation or operator action changes counters. Moderation may pause or resume only. | MVP |

## Capabilities
Action = `<resource_type>.<verb>` (CTR-CAP-001 R03).

| Capability | Verb | Resource scope |
|---|---|---|
| `availability.read` | read | self, or any public listing |
| `availability.update` | update | self (owner) |
| `availability.moderate` | moderate | case scope; pause and resume only |
| `availability.export` | export | self |
| `hold.read` | read | participant (holder) or self (owner) |
| `hold.create` | create | sys principal of F01.S04.M01, participant scope |
| `hold.withdraw` | withdraw | participant or self |
| `hold.execute` | execute | sys principal, both parties accepted |

## Actor matrix
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| owner `acc_` | `availability.update` | own record | ALLOW (owner rule) |
| other `acc_` | `availability.update` | any | DENY → SYS.FORBIDDEN if listing visible, else SYS.NOT_FOUND |
| anyone | `availability.read` | ACTIVE, PAUSED, SOLD_OUT, public listing | ALLOW: `status`, counts |
| holder `acc_` | `hold.read` | own hold | ALLOW: state, units, expires_at |
| `sys` (F01.S04.M01) | `hold.create` | own listing, holder ≠ owner | ALLOW (V07) |
| `sys` (F02.S03.M02, cycle lock) | `hold.create` | cycle proposal | ALLOW only after PENDING CTR-CAP entry |
| `mod` with case grant | `availability.moderate` | case-scoped record | ALLOW pause and resume; grant ≤ 72 h |
| `ope` | `availability.read` | global | ALLOW counts only; `holder_ref` DENY |
| `fpr` (federation peer) | any | any | DENY (holds never federated) |

## Field visibility
`holder_ref`: participant only. `hold_id`, `units`, `state`, `expires_at`: owner and participant. Counts: public. Fields without a rule are omitted, not null (CTR-CAP-001 R10).

## Data / schema, states, validation
See PS-008-01, PS-008-03 and PS-008-02.

## Failure, idempotency, concurrency, offline
Decisions fail closed: `SYS.UNAVAILABLE` on policy-store outage (PS-008-06).

## Privacy, retention, abuse
Grant and decision records follow RET-AUD. Repeated DENY from one principal raises a CAP alert. Scope of abuse controls in PS-008-07.

## Observability & budgets
`authz_decisions_total{outcome,reason_code}` per CTR-CAP-001. See PS-008-08.

## Tests
- TEST-PS-008-05-01 (matrix): each actor row produces its stated outcome and code.
- TEST-PS-008-05-02 (negative): user calls `hold.create` directly → SYS.FORBIDDEN.
- TEST-PS-008-05-03 (negative): moderator attempts `availability.commit_units` → denied.
- TEST-PS-008-05-04 (field): non-participant `hold.read` response omits `holder_ref` (absent, not null).
- TEST-PS-008-05-05 (federation): `fpr` import of any hold denied.

## Acceptance criteria
1. Matrix tests (TEST-01) pass for every row.
2. No capability lets a non-sys principal change counters.
3. Each capability name is registered with CTR-CAP-001 vocabulary.

## Assumptions & open decisions
- ASSUMPTION: moderation grants ≤ 72 h (CTR-CAP-001 R06).
- PENDING: `hold.create` scope for F02.S03.M02 (cycle lock) in CTR-CAP-001.
