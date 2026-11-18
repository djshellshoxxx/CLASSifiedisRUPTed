# PS-070-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04 scopes, R06, R07, R08, R10), CTR-ERR-001 (R08). **Decisions:** D04 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-05.R01 | Only the two parties of a claim may raise, respond or withdraw; the raiser alone may withdraw. | MVP |
| PS-070-05.R02 | `statement` and evidence content are readable only by the two claim parties and a moderator with a `case:<cas_>` grant for that dispute. | MVP |
| PS-070-05.R03 | `case.resolve` requires a `mod_` with case-scope grant and `constraints.purpose`; a single `ope_` cannot resolve or read private evidence (R07 dual control). | MVP |
| PS-070-05.R04 | A moderator who resolves a dispute cannot also be a party to it (CTR-CAP-001 R07 principal separation). | MVP |
| PS-070-05.R05 | Every privileged read writes an `aud_` record with dispute ID, purpose and actor (CTR-CAP-001 R08). | MVP |

## Data / schema
Grants reference `case:<cas_>` scope; no module-specific grant table.

## Commands / queries / events
Capability IDs: `dispute.raise`, `dispute.respond`, `dispute.withdraw`, `dispute.read`, `dispute.escalate`, `case.resolve`.

## States & transitions
Authorization is evaluated before each transition; DENY writes a `dec` record with reason code only.

## Validation & errors
| Case | Code | Retryable |
|---|---|---|
| Actor is not a claim party | `SYS.NOT_FOUND` | false |
| Party but wrong role for action | `SYS.FORBIDDEN` | false |
| Moderator without case grant | `SYS.NOT_FOUND` | false |
| Single operator resolve attempt | `SYS.PRECONDITION_FAILED` | true (after second approver) |

## Authorization
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| claimant or counterparty | `dispute.raise` | own claim | ALLOW (state permitting) |
| other party | `dispute.respond` | dispute on own claim | ALLOW before due date |
| raiser | `dispute.withdraw` | own dispute | ALLOW |
| either party | `dispute.read` | own claim's dispute | ALLOW (`statement` included) |
| `sys_` timer | `dispute.escalate` | dispute timers only | ALLOW |
| `mod_` with case grant | `dispute.read`, `case.resolve` | `case:<cas_>` | ALLOW with purpose; resolve needs second approver if PRIVATE evidence accessed |
| `mod_` without grant | any | any | DENY → `SYS.NOT_FOUND` |
| `ope_` single | `case.resolve` | any | DENY |
| `sys_` (other) | `dispute.read` | any | DENY |

## Failure, idempotency, concurrency, offline
Grant revocation takes effect at next decision (CTR-CAP-001 R09: zero cache for privileged reads). A resolution in progress when a grant is revoked is rejected at commit.

## Privacy, retention, abuse
Access logs record IDs and purpose, never content. Moderator access to `statement` is time-bounded to the case.

## Observability & budgets
Privileged read audit rate per case; alert if one moderator reads more than 50 disputes in 1 h (ASSUMPTION).

## Tests
- TEST-PS-070-05-01 (unit): decision matrix row by row.
- TEST-PS-070-05-02 (integration): non-party gets `SYS.NOT_FOUND` identical to nonexistent dispute.
- TEST-PS-070-05-03 (integration): single `ope_` resolve refused; second approver completes it.
- TEST-PS-070-05-04 (negative): party who is also assigned moderator is refused on that case.
- TEST-PS-070-05-05 (integration): each privileged read writes exactly one `aud_`.

## Acceptance criteria
1. Matrix rows all pass.
2. No `statement` content reachable by a non-party without case grant (negative tests).
3. Audit completeness 100% in fixture runs.

## Assumptions & open decisions
- ASSUMPTION: 50 reads per hour threshold for moderator alerting.
- D04 (PROVISIONAL default, unapproved). Moderation details are owned by the F12 trust and safety module, referenced by `cas_` ID only.
