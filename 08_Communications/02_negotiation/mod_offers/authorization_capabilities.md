# PS-063-05 — authorization capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (`ofr.*` actions, participant scope), CTR-PRV-001 (FINANCIAL_EVIDENCE visibility), CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-05.R01 | Offerer may create, counter (new version), withdraw. Recipient may accept, decline, counter. | MVP |
| PS-063-05.R02 | Only the recipient may accept or decline. Only the offerer may withdraw. | MVP |
| PS-063-05.R03 | Amounts and compensation lines are visible to offerer and recipient only (FINANCIAL_EVIDENCE). | MVP |
| PS-063-05.R04 | Non-party access returns `SYS.NOT_FOUND`. | MVP |
| PS-063-05.R05 | Operators have no default access. Case-scoped read requires `cas_` grant and dual control for FINANCIAL_EVIDENCE (CTR-CAP-001 R07). | MVP |
| PS-063-05.R06 | Action vocabulary: `ofr.create`, `ofr.counter`, `ofr.accept`, `ofr.decline`, `ofr.withdraw`, `ofr.read`. | MVP |

## Data / schema
Relation rules from offer `offerer` and `recipient` fields, evaluated at decision time (CTR-CAP-001 R05).

## Commands / queries / events
Denial decision records (`dec_`) with reason codes, no amounts (CTR-CAP-001 R13).

## States & transitions
Authorization depends on state (e.g., counter only from `open`); see [PS-063-03](workflow_state_machine.md).

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| user (offerer) | ofr.create | own target | ALLOW |
| user (recipient) | ofr.accept | offer `open`, own | ALLOW |
| user (offerer) | ofr.accept | own offer | DENY (SCOPE_MISMATCH) |
| user (recipient) | ofr.withdraw | offer | DENY (SCOPE_MISMATCH) |
| user (offerer) | ofr.withdraw | offer `open` | ALLOW |
| user (recipient) | ofr.counter | offer `open` | ALLOW (new version) |
| user (third party) | ofr.read | offer | DENY → SYS.NOT_FOUND |
| ope_ (single approval) | ofr.read | any | DENY (dual control) |

## Validation & errors
Codes per [PS-063-02](validation_rules.md).

## Failure, idempotency, concurrency, offline
Re-authorized at commit. Offline-queued accept of an offer since withdrawn is rejected.

## Privacy, retention, abuse
Field visibility: `terms` = party; `state` = party; `counter_of` = party. Counterparty identifiers never shown in third-party contexts.

## Observability & budgets
`offers_authz_denied_total{action,reason_code}`.

## Tests
- TEST-PS-063-05-01 (matrix): every row above.
- TEST-PS-063-05-02 (negative): third party guessing `ofr_` gets `SYS.NOT_FOUND`.
- TEST-PS-063-05-03 (negative): operator single approval cannot read amounts.

## Acceptance criteria
1. Matrix passes (TEST-PS-063-05-01).
2. No amount visible to a non-party (TEST-PS-063-05-02, -03).

## Assumptions & open decisions
- ASSUMPTION: party binding to listing owner or cycle slot from F01/F02 aggregates.
- Related: CTR-CAP-001 R07 dual control.
