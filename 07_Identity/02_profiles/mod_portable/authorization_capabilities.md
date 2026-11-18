# PS-055-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-05.R01 | Capabilities: `bundle.create` (export), `bundle.read` (download), `bundle.execute` (import apply), `bundle.delete` (cancel import). Default deny. | MVP |
| PS-055-05.R02 | Export and import require owner session with step-up ≤ 5 min. | MVP |
| PS-055-05.R03 | Download token bound to one `bnd_` and one requester session; single use. | MVP |
| PS-055-05.R04 | Import applies only into the authenticated owner's profile space; a bundle cannot target another `acc_`. | MVP |
| PS-055-05.R05 | Operators cannot export or import on a user's behalf (CTR-CAP-001 R12). | MVP |

## Data / schema
Owner relation derived from `acc_`; no stored grant.

## Commands / queries / events
Capability per command: generate → `bundle.create`; download → `bundle.read`; apply → `bundle.execute`; cancel → `bundle.delete`.

## States & transitions
Not applicable beyond [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Cross-account access returns `SYS.NOT_FOUND`.

## Authorization matrix
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| owner, step-up | bundle.create | own profile | ALLOW |
| owner session | bundle.read | own bnd_ with valid token | ALLOW once |
| other user | bundle.read | bnd_ of another | DENY, NOT_FOUND |
| owner session | bundle.execute | own imj_ | ALLOW |
| ope_ or mod_ | any | any | DENY (R05) |

## Failure, idempotency, concurrency, offline
Download token expiry ends access at 15 min regardless of file state.

## Privacy, retention, abuse
Each export and import emits an `aud_` record with IDs and counts only (CTR-CAP-001 R08).

## Observability & budgets
`portable_denied_total{reason}`.

## Tests
TEST-PS-055-09 (matrix rows), TEST-PS-055-10 (download token reuse denied).

## Acceptance criteria
1. Matrix rows pass.
2. No support path produces a bundle.

## Assumptions & open decisions
- ASSUMPTION: 15 min download token.
- PROVISIONAL (D10 default, unapproved).
