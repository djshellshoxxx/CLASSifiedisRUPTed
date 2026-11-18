# PS-032-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-05.R01 | Only the provider of `srv_` may create, send, withdraw or supersede its quotes (`svq.create`, `svq.update`, scope `self`). | MVP |
| PS-032-05.R02 | Only the addressed customer may accept or decline (`svq.accept`, `svq.decline`, scope `participant`). A provider cannot accept its own quote. | MVP |
| PS-032-05.R03 | `scope_text` and `price_minor` are visible to provider and addressed customer only. | MVP |
| PS-032-05.R04 | Public listing shows only a "from" price band derived from listed services, never a specific quote. | MVP |
| PS-032-05.R05 | Operators have no read access to quotes without `case:` scope and dual control. | MVP |

## Data / schema
Action matrix:

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user, provider | `svq.create` / `svq.update` | own `srv_` quote | ALLOW (self) |
| user, other provider | `svq.update` | quote | DENY → `SYS.NOT_FOUND` |
| user, addressed customer | `svq.accept` | quote in SENT | ALLOW (participant) |
| user, provider of quote | `svq.accept` | own quote | DENY → `SYS.FORBIDDEN` |
| user, other customer | `svq.accept` | quote | DENY → `SYS.NOT_FOUND` |
| user, anonymous | `svq.read` | quote | DENY → `SYS.NOT_FOUND` |
| ope, single approval | `svq.read` | quote | DENY (dual control) |
| mod, case scope | `svq.read` | quote in `cas_` | ALLOW (grant) |

## Commands / queries / events
Each command maps to a row above. Decision records hold outcome and reason code only.

## States & transitions
Relation rules re-evaluated per command. Customer loses accept rights after decline, expiry or supersession (terminal states).

## Validation & errors
`SYS.FORBIDDEN` for visible-but-disallowed actions; `SYS.NOT_FOUND` otherwise.

## Authorization
Capability IDs: `svq.create`, `svq.update`, `svq.accept`, `svq.decline`, `svq.read`. Hold operations run as `sys` (`svq.accept` scope `participant` on the window).

## Failure, idempotency, concurrency, offline
Decision TTL zero for writes and for FINANCIAL_EVIDENCE reads (CTR-CAP-001 R09).

## Privacy, retention, abuse
Pseudonyms resolve to `acc_` before checks. Customer identity is not revealed to the provider until accept or decline.

## Observability & budgets
Metric `svcquote_authz_denials_total{action,code}`. Alert on repeated `SYS.FORBIDDEN` on accept (possible replay).

## Tests
- TEST-PS-032-05-01 (negative): each matrix row returns stated outcome.
- TEST-PS-032-05-02 (negative): provider accepting own quote returns `SYS.FORBIDDEN`.
- TEST-PS-032-05-03 (integration): public listing exposes price band only.
- TEST-PS-032-05-04 (negative): operator read denied without second approver.

## Acceptance criteria
1. Matrix tests pass with zero unlisted outcomes.
2. No quote field reaches public responses (automated scan).
3. Customer identity absent from provider-facing SENT state.

## Assumptions & open decisions
- ASSUMPTION: moderator case grants max 72 h (CTR-CAP-001 R06).
- PENDING CTR-ID-001 (`svq` prefix). See [DECISIONS.md](../../../DECISIONS.md) D10 (OPEN; account continuity).
