# PS-054-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-05.R01 | Capabilities: `session.create`, `session.read`, `session.delete`, `session.execute` (refresh), `session.attest` (step-up). Default deny. | MVP |
| PS-054-05.R02 | Owner may read and revoke only sessions where `account_id` matches the principal. | MVP |
| PS-054-05.R03 | Revoking a session other than the current one requires step-up ≤ 5 min. | MVP |
| PS-054-05.R04 | No support or operator capability can create, read or revoke another user's session tokens (CTR-CAP-001 R12). | MVP |
| PS-054-05.R05 | `admin_security` bulk revoke requires dual control (two distinct `ope_`), reason code, and `aud_` record. | MVP |

## Data / schema
Owner relation derived at decision time (CTR-CAP-001 R05); no stored grant.

## Commands / queries / events
Capability per command: create → `session.create` (anonymous, rate-limited); refresh → `session.execute` (refresh secret); revoke → `session.delete` (owner); step-up → `session.attest`.

## States & transitions
Not applicable beyond [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Cross-account access returns `SYS.NOT_FOUND` (CTR-CAP-001 action matrix).

## Authorization matrix
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| anonymous | session.create | acc_ by proof | ALLOW if proof valid |
| holder of refresh secret | session.execute | own ses_ | ALLOW if current or in grace |
| owner session | session.read | own ses_ list | ALLOW |
| owner, step-up ≤ 5 min | session.delete | other own ses_ | ALLOW |
| ope_ single approver | session.delete | any | DENY (R05 needs two) |
| ope_ dual approval | session.delete (admin_security) | any | ALLOW, audited |
| mod_ case grant | session.read | metadata of ses_ in case | ALLOW, no device or IP |

## Failure, idempotency, concurrency, offline
Revocation takes effect at next decision (CTR-CAP-001 R09); session validation cache TTL ≤ 60 s for reads, zero for writes and step-up checks.

## Privacy, retention, abuse
Every bulk revoke and privileged read emits `aud_` without device or IP content (CTR-CAP-001 R08).

## Observability & budgets
`session_denied_total{reason}`; alert on any single `ope_` attempt at `admin_security`.

## Tests
TEST-PS-054-09 (matrix rows), TEST-PS-054-10 (cross-account revoke returns NOT_FOUND, no existence leak).

## Acceptance criteria
1. Every matrix row has a passing test.
2. No test path yields another user's token material.

## Assumptions & open decisions
- ASSUMPTION: step-up window 5 min.
- PROVISIONAL (D10 default, unapproved).
